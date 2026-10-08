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

app.get("/transactions", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM transactions");

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro ao buscar transações"
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