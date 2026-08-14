const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const transactions = [];

app.get("/", (req, res) => {
    res.send("Lumina API funcionando");
});

/* Transações */

app.get("/transactions", (req, res) => {
    res.json(transactions);
});

app.post("/transactions", (req, res) => {
    const newTransaction = req.body;

    transactions.push(newTransaction);

    res.status(201).json(newTransaction);
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});