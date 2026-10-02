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

app.post("/transactions", async (req, res) => {
    try {
        const {
            type,
            description,
            amount,
            category,
            date,
            account,
            payment_method,
            note,
            is_recurring
        } = req.body;

        const result = await pool.query(
            `INSERT INTO transactions
            (type, description, amount, category, date, account, payment_method, note, is_recurring)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                type,
                description,
                amount,
                category,
                date,
                account,
                payment_method,
                note,
                is_recurring
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

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});