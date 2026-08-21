import "./Transactions.css";
import { useState, useEffect } from "react";

export default function Transactions() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isPanelClosing, setIsPanelClosing] = useState(false);

    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");
    const [account, setAccount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [note, setNote] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);

    const [transactions, setTransactions] = useState([]);

    const categories = [
        "Alimentação",
        "Transporte",
        "Moradia",
        "Lazer"
    ];

    const accounts = [
        "Nubank",
        "Bradesco",
        "Caixa Econômica Federal",
        "Banco do Brasil"
    ];

    const paymentMethods = [
        "Cartão de crédito",
        "Cartão de débito",
        "Pix",
        "Dinheiro"
    ];

    function openPanel() {
        setIsPanelClosing(false);
        setIsPanelOpen(true);
    }

    function closePanel() {
        setIsPanelClosing(true);

        setTimeout(() => {
            setIsPanelOpen(false);
            setIsPanelClosing(false);
        }, 250);
    }

    function resetForm() {
        setType("");
        setDescription("");
        setAmount("");
        setCategory("");
        setDate("");
        setAccount("");
        setPaymentMethod("");
        setNote("");
        setIsRecurring(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!type) {
            alert("Selecione se a transação é uma despesa ou receita.");
            return;
        }

        const transaction = {
            type,
            description,
            amount,
            category,
            date,
            account,
            paymentMethod,
            note,
            isRecurring
        };

        try {
            const response = await fetch(
                "http://localhost:3000/transactions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(transaction)
                }
            );

            const data = await response.json();

            setTransactions((currentTransactions) => [...currentTransactions, data]);

            resetForm();
            closePanel();
        } catch (error) {
            console.error("Erro ao criar transação:", error);
        }
    }

    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch(
                    "http://localhost:3000/transactions"
                );

                const data = await response.json();

                setTransactions(data);
            } catch (error) {
                console.error("Erro ao buscar transações:", error);
            }
        }

        loadTransactions();
    }, []);

    return (
        <div className="new-transaction-container">

            <div className="page-header">

                <div>
                    <span className="page-label">
                        FINANÇAS
                    </span>

                    <h1>
                        Transações
                    </h1>

                    <p>
                        Acompanhe e gerencie todas as suas movimentações financeiras.
                    </p>
                </div>

                <button
                    className="new-transaction-button"
                    onClick={openPanel}
                >
                    <span>+</span>
                    Nova transação
                </button>

            </div>

            <div className="transactions-section">

                <div className="transactions-toolbar">

                    <div>
                        <h2>
                            Transações recentes
                        </h2>

                        <p>
                            {transactions.length} movimentações cadastradas
                        </p>
                    </div>

                    <div className="transactions-filter">
                        <input
                            type="text"
                            placeholder="Buscar transação..."
                        />
                    </div>

                </div>

                <div className="transactions-list">

                    <div className="transactions-header">
                        <span>Data</span>
                        <span>Descrição</span>
                        <span>Categoria</span>
                        <span>Tipo</span>
                        <span>Conta</span>
                        <span>Valor</span>
                        <span>Ações</span>
                    </div>

                    {transactions.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                ↔
                            </div>

                            <h3>
                                Nenhuma transação cadastrada
                            </h3>

                            <p>
                                Suas movimentações aparecerão aqui assim
                                que você cadastrar sua primeira transação.
                            </p>

                            <button onClick={openPanel}>
                                + Adicionar transação
                            </button>

                        </div>

                    ) : (

                        transactions.map((transaction, index) => (

                            <div
                                className="transaction-item"
                                key={transaction.id || index}
                            >

                                <p className="transaction-date">
                                    {new Date(transaction.date).toLocaleDateString("pt-BR", {timeZone: "UTC"})}
                                </p>

                                <div className="transaction-description">

                                    <div className="transaction-icon">
                                        {transaction.type === "expense"
                                            ? "↓"
                                            : "↑"}
                                    </div>

                                    <p>
                                        {transaction.description}
                                    </p>

                                </div>

                                <p>
                                    <span className="category-badge">
                                        {transaction.category}
                                    </span>
                                </p>

                                <p>
                                    <span
                                        className={`type-badge ${
                                            transaction.type === "expense"
                                                ? "expense"
                                                : "income"
                                        }`}
                                    >
                                        {transaction.type === "expense"
                                            ? "Despesa"
                                            : "Receita"}
                                    </span>
                                </p>

                                <p>
                                    {transaction.account}
                                </p>

                                <p
                                    className={`transaction-amount ${
                                        transaction.type === "expense"
                                            ? "expense-value"
                                            : "income-value"
                                    }`}
                                >
                                    {transaction.type === "expense"
                                        ? "- "
                                        : "+ "}

                                    R$ {Number(transaction.amount)
                                        .toFixed(2)
                                        .replace(".", ",")}
                                </p>

                                <div className="transaction-actions">

                                    <button
                                        type="button"
                                        className="delete-button"
                                    >
                                        Excluir
                                        <span>×</span>
                                    </button>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

            {isPanelOpen && (
                <>
                    <div
                        className={`transaction-overlay ${isPanelClosing ? "closing" : ""}`}
                        onClick={closePanel}
                    ></div>

                    <form
                        className={`transaction-form ${isPanelClosing ? "closing" : ""}`}
                        onSubmit={handleSubmit}
                    >

                        <div className="transaction-form-header">

                            <div>
                                <span className="form-label">
                                    NOVA MOVIMENTAÇÃO
                                </span>

                                <h2>
                                    Nova transação
                                </h2>

                                <p>
                                    Preencha os dados abaixo para registrar uma nova movimentação.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-form-button"
                                onClick={closePanel}
                            >
                                ×
                            </button>

                        </div>

                        <div className="form-divider"></div>

                        <div className="form-section">

                            <span className="form-section-title">
                                Informações principais
                            </span>

                            <div className="form-group">

                                <label>
                                    Tipo de transação
                                </label>

                                <div className="type-options">

                                    <button
                                        type="button"
                                        onClick={() => setType("expense")}
                                        className= {type === "expense" ? "selected expense-selected" : ""}
                                    >
                                        <span className="type-option-icon">
                                            ↓
                                        </span>

                                        Despesa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setType("income")}
                                        className= {type === "income" ? "selected income-selected" : ""}
                                    >

                                        <span className="type-option-icon">
                                            ↑
                                        </span>

                                        Receita
                                    </button>

                                </div>

                            </div>

                            <div className="form-group">

                                <label>
                                    Descrição
                                </label>

                                <input
                                    type="text"
                                    placeholder="Ex: Supermercado Extra"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Valor
                                </label>

                                <div className="amount-input">

                                    <span>
                                        R$
                                    </span>

                                    <input
                                        type="text"
                                        placeholder="0,00"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                        required
                                    />

                                </div>

                            </div>

                        </div>

                        <div className="form-section">

                            <span className="form-section-title">
                                Detalhes
                            </span>

                            <div className="form-group">

                                <label>
                                    Categoria
                                </label>

                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    required
                                >

                                    <option value="" disabled>
                                        Selecione uma categoria
                                    </option>

                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Data
                                </label>

                                <input
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Conta
                                </label>

                                <select
                                    value={account}
                                    onChange={(event) => setAccount(event.target.value)}
                                >

                                    <option value="">
                                        Selecione uma conta
                                    </option>

                                    {accounts.map((account) => (
                                        <option
                                            key={account}
                                            value={account}
                                        >
                                            {account}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Forma de pagamento
                                </label>

                                <select
                                    value={paymentMethod}
                                    onChange={(event) => setPaymentMethod(event.target.value)}
                                    required
                                >

                                    <option value="" disabled>
                                        Selecione
                                    </option>

                                    {paymentMethods.map((method) => (
                                        <option
                                            key={method}
                                            value={method}
                                        >
                                            {method}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="form-section">

                            <span className="form-section-title">
                                Informações adicionais
                            </span>

                            <div className="form-group">

                                <label>
                                    Observação

                                    <span className="optional-label">
                                        Opcional
                                    </span>
                                </label>

                                <textarea
                                    placeholder="Adicione uma observação sobre esta transação..."
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                ></textarea>

                            </div>

                            <label className="recurring-option">

                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(event) => setIsRecurring(event.target.checked)}
                                />

                                <div>

                                    <span>
                                        Transação recorrente
                                    </span>

                                    <p>
                                        Marque caso essa movimentação se repita periodicamente.
                                    </p>

                                </div>

                            </label>

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={closePanel}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="save-transaction-button"
                            >
                                Salvar transação
                            </button>

                        </div>

                    </form>
                </>
            )}

        </div>
    );
}