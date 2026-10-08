require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("../db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Lumina API funcionando");
});

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    // Converte e volta: "2026-02-31" viraria 03/03, então não seria igual.
    const parsed = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}

// Monta o WHERE da listagem a partir dos filtros da URL (query params).
// Os valores do usuário nunca entram no texto do SQL: vão na lista
// "params" e o SQL só recebe $1, $2... no lugar deles.
// Retorna { error } se algum filtro for inválido, ou { where, params }.
function buildTransactionFilters(query) {
    const filters = {};

    for (const name of [
        "search", "type", "category", "account", "payment_method", "from", "to"
    ]) {
        const value = query[name];

        if (value === undefined) {
            continue;
        }

        // ?category=a&category=b chega como lista: não é aceito.
        if (typeof value !== "string") {
            return { error: `Parâmetro "${name}" inválido.` };
        }

        // Filtro vazio (?category=) é o mesmo que não filtrar.
        if (value.trim() !== "") {
            filters[name] = value.trim();
        }
    }

    if (filters.type && filters.type !== "income" && filters.type !== "expense") {
        return { error: "Tipo inválido. Use \"income\" ou \"expense\"." };
    }

    if (filters.from && !isValidDate(filters.from)) {
        return { error: "Data inicial inválida. Use o formato AAAA-MM-DD." };
    }

    if (filters.to && !isValidDate(filters.to)) {
        return { error: "Data final inválida. Use o formato AAAA-MM-DD." };
    }

    if (filters.from && filters.to && filters.from > filters.to) {
        return { error: "A data inicial não pode ser maior que a final." };
    }

    const conditions = [];
    const params = [];

    // Guarda o valor na lista e devolve o marcador ($1, $2...) dele.
    function addParam(value) {
        params.push(value);

        return `$${params.length}`;
    }

    if (filters.search) {
        // Escapa % _ \ para o texto digitado ser procurado literalmente.
        const pattern = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
        const marker = addParam(pattern);

        conditions.push(
            `(unaccent(description) ILIKE unaccent(${marker})
              OR unaccent(note) ILIKE unaccent(${marker}))`
        );
    }

    if (filters.type) {
        conditions.push(`type = ${addParam(filters.type)}`);
    }

    if (filters.category) {
        conditions.push(`category = ${addParam(filters.category)}`);
    }

    if (filters.account) {
        conditions.push(`account = ${addParam(filters.account)}`);
    }

    if (filters.payment_method) {
        conditions.push(`payment_method = ${addParam(filters.payment_method)}`);
    }

    if (filters.from) {
        conditions.push(`date >= ${addParam(filters.from)}`);
    }

    if (filters.to) {
        conditions.push(`date <= ${addParam(filters.to)}`);
    }

    const where = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return { where, params };
}

app.get("/transactions", async (req, res) => {
    try {
        const { error, where, params } = buildTransactionFilters(req.query);

        if (error) {
            return res.status(400).json({ error });
        }

        const result = await pool.query(
            `SELECT * FROM transactions
             ${where}
             ORDER BY date DESC, created_at DESC`,
            params
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro ao buscar transações"
        });
    }
});

// Total de transações cadastradas, sem filtros (usado no "X de Y").
app.get("/transactions/count", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT COUNT(*)::int AS total FROM transactions"
        );

        res.json({ total: result.rows[0].total });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro ao contar transações"
        });
    }
});

// Mês atual no formato "AAAA-MM" (usado quando a URL não traz ?month=).
function getCurrentMonth() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${today.getFullYear()}-${month}`;
}

// Resumo da visão geral. Todos os cálculos são feitos pelo banco.
// Cada etapa da tela ganha novos campos neste mesmo JSON.
app.get("/summary", async (req, res) => {
    try {
        const month = req.query.month === undefined
            ? getCurrentMonth()
            : req.query.month;

        // Ano de 4 dígitos (sem 0000) e mês de 01 a 12.
        if (typeof month !== "string" || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({
                error: "Mês inválido. Use o formato AAAA-MM, por exemplo 2026-10."
            });
        }

        // $1 é sempre o primeiro dia do mês escolhido. O PostgreSQL calcula
        // o mês seguinte e o anterior, já acertando virada de ano e fevereiro.
        const result = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
                    AS balance,

                COALESCE(SUM(amount) FILTER (
                    WHERE type = 'income'
                    AND date >= $1::date
                    AND date < $1::date + INTERVAL '1 month'
                ), 0) AS income,

                COALESCE(SUM(amount) FILTER (
                    WHERE type = 'expense'
                    AND date >= $1::date
                    AND date < $1::date + INTERVAL '1 month'
                ), 0) AS expense,

                COALESCE(SUM(amount) FILTER (
                    WHERE type = 'income'
                    AND date >= $1::date - INTERVAL '1 month'
                    AND date < $1::date
                ), 0) AS previous_income,

                COALESCE(SUM(amount) FILTER (
                    WHERE type = 'expense'
                    AND date >= $1::date - INTERVAL '1 month'
                    AND date < $1::date
                ), 0) AS previous_expense
            FROM transactions`,
            [`${month}-01`]
        );

        const row = result.rows[0];

        // O pg devolve NUMERIC como texto: converte para número antes de responder.
        res.json({
            month,
            currentBalance: Number(row.balance),
            currentMonth: {
                income: Number(row.income),
                expense: Number(row.expense)
            },
            previousMonth: {
                income: Number(row.previous_income),
                expense: Number(row.previous_expense)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro ao gerar o resumo"
        });
    }
});

const WALLET_ACCOUNT = "Carteira";
const CASH_PAYMENT_METHOD = "Dinheiro";

function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

// Valida os dados de uma transação (usada no POST e no PUT).
// Retorna { error } se algo estiver inválido, ou { data } com os
// valores já tratados e prontos para ir ao banco.
function validateTransaction(body) {
    const {
        type,
        description,
        amount,
        category,
        date,
        account,
        payment_method,
        note
    } = body;

    if (type !== "expense" && type !== "income") {
        return { error: "Tipo inválido. Use \"expense\" ou \"income\"." };
    }

    if (!isFilled(description)) {
        return { error: "A descrição é obrigatória." };
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return { error: "O valor deve ser maior que zero." };
    }

    if (!isFilled(date)) {
        return { error: "A data é obrigatória." };
    }

    const data = {
        type,
        description: description.trim(),
        amount: parsedAmount,
        category: null,
        date,
        account: null,
        payment_method: null,
        note
    };

    if (type === "income") {
        if (!isFilled(account)) {
            return { error: "A conta de destino é obrigatória." };
        }

        data.account = account;

        return { data };
    }

    if (!isFilled(category)) {
        return { error: "A categoria é obrigatória para despesas." };
    }

    if (!isFilled(payment_method)) {
        return { error: "A forma de pagamento é obrigatória para despesas." };
    }

    data.category = category;
    data.payment_method = payment_method;

    if (payment_method === CASH_PAYMENT_METHOD) {
        data.account = WALLET_ACCOUNT;
        return { data };
    }

    if (!isFilled(account)) {
        return { error: "A conta é obrigatória para despesas." };
    }

    if (account === WALLET_ACCOUNT) {
        return {
            error: "A conta Carteira só pode ser usada em pagamentos em dinheiro."
        };
    }

    data.account = account;

    return { data };
}

app.post("/transactions", async (req, res) => {
    try {
        const { error, data } = validateTransaction(req.body);

        if (error) {
            return res.status(400).json({ error });
        }

        const result = await pool.query(
            `INSERT INTO transactions
            (type, description, amount, category, date, account, payment_method, note)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                data.type,
                data.description,
                data.amount,
                data.category,
                data.date,
                data.account,
                data.payment_method,
                data.note
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Erro ao criar transação"
        });
    }
});

app.delete("/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Transação não encontrada"
            });
        }

        res.json({
            message: "Transação excluída com sucesso",
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Erro ao excluir transação"
        });
    }
});

app.put("/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error, data } = validateTransaction(req.body);

        if (error) {
            return res.status(400).json({ error });
        }

        const result = await pool.query(
            `UPDATE transactions
             SET type = $1, description = $2, amount = $3, category = $4,
                 date = $5, account = $6, payment_method = $7, note = $8
             WHERE id = $9
             RETURNING *`,
            [data.type, data.description, data.amount, data.category,
             data.date, data.account, data.payment_method, data.note, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Transação não encontrada" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar transação" });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});