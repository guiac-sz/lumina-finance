import "./Transactions.css";
import { useState, useEffect } from "react";

function normalizeText(text) {
    return (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

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
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState([]);
    const [editingId, setEditingId] = useState(null);

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

    const isIncome = type === "income";
    const isCashPayment = paymentMethod === "Dinheiro";

    // Receita pode ir para a Carteira; despesa em dinheiro só usa a Carteira;
    // as demais formas de pagamento nunca mostram a Carteira.
    const accountOptions = isIncome
        ? ["Carteira", ...accounts]
        : isCashPayment
            ? ["Carteira"]
            : accounts;

    const filteredTransactions = transactions.filter((transaction) =>
        normalizeText(transaction.description).includes(normalizeText(searchTerm))
    );

    function openPanel() {
        setIsPanelClosing(false);
        setIsPanelOpen(true);
    }

    function openEditPanel(transaction) {
        setType(transaction.type);
        setDescription(transaction.description);
        setAmount(String(transaction.amount).replace(".", ","));
        setCategory(transaction.category || "");
        setDate(transaction.date.slice(0, 10));
        setAccount(transaction.account || "");
        setPaymentMethod(transaction.payment_method || "");
        setNote(transaction.note || "");
        setEditingId(transaction.id);
        openPanel();
    }

    function closePanel() {
        setIsPanelClosing(true);

        setTimeout(() => {
            setIsPanelOpen(false);
            setIsPanelClosing(false);
            resetForm();
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
        setEditingId(null);
    }

    function handleTypeChange(newType) {
        if (newType === type) {
            return;
        }

        setType(newType);

        // Categoria e forma de pagamento nunca valem ao trocar de tipo:
        // a receita não usa e a despesa precisa escolher de novo.
        setCategory("");
        setPaymentMethod("");

        // A Carteira só vale numa despesa em dinheiro. Como a forma de
        // pagamento acabou de ser limpa, a Carteira também precisa sair.
        if (newType === "expense" && account === "Carteira") {
            setAccount("");
        }
    }

    function handlePaymentMethodChange(method) {
        setPaymentMethod(method);

        if (method === "Dinheiro") {
            setAccount("Carteira");
        } else if (isCashPayment) {
            // Estava em Dinheiro (conta travada): destrava e deixa vazia.
            setAccount("");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!type) {
            alert("Selecione se a transação é uma despesa ou receita.");
            return;
        }

        // Aceita só o formato brasileiro: 150 ou 150,50 (até 2 casas).
        if (!/^\d+(,\d{1,2})?$/.test(amount.trim())) {
            alert("Informe o valor no formato 150,50.");
            return;
        }

        const parsedAmount = Number(amount.trim().replace(",", "."));

        if (parsedAmount <= 0) {
            alert("O valor deve ser maior que zero.");
            return;
        }

        const transaction = {
            type,
            description,
            amount: parsedAmount,
            category: isIncome ? null : category,
            date,
            account,
            payment_method: isIncome ? null : paymentMethod,
            note
        };

        try {
            const isEditing = editingId !== null;

            const url = isEditing
                ? `http://localhost:3000/transactions/${editingId}`
                : "http://localhost:3000/transactions";

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Erro ao salvar transação");
            }

            if (isEditing) {
                setTransactions((current) =>
                    current.map((t) => (t.id === data.id ? data : t))
                );
            } else {
                setTransactions((current) => [...current, data]);
            }

            closePanel();
        } catch (error) {
            console.error("Erro ao salvar transação:", error);

            // TypeError = o fetch nem chegou na API (servidor desligado, por exemplo).
            alert(
                error instanceof TypeError
                    ? "Não foi possível conectar ao servidor."
                    : error.message
            );
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

    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Deseja realmente excluir esta transação?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/transactions/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Erro ao excluir transação");
            }

            setTransactions((currentTransactions) =>
                currentTransactions.filter(
                    (transaction) => transaction.id !== id
                )
            );
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
        }
    }

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
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                </div>

                <div className="transactions-list">

                    <div className="transactions-header">
                        <span>Data</span>
                        <span>Descrição</span>
                        <span>Categoria</span>
                        <span>Tipo</span>
                        <span>Pagamento</span>
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

                    ) : filteredTransactions.length === 0 ? (

                        <div className="empty-state">

                            <h3>
                                Nenhuma transação encontrada
                            </h3>

                            <p>
                                Nenhuma movimentação corresponde a "{searchTerm}".
                            </p>

                        </div>

                    ) : (

                        filteredTransactions.map((transaction, index) => (

                            <div
                                className="transaction-item"
                                key={transaction.id || index}
                            >

                                <p className="transaction-date">
                                    {new Date(transaction.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                                </p>

                                <div className="transaction-description">

                                    <div className="transaction-icon">
                                        {transaction.type === "expense" ? "↓" : "↑"}
                                    </div>

                                    <p>
                                        {transaction.description}
                                    </p>
                                </div>

                                <p>
                                    {transaction.category ? (
                                        <span className="category-badge">
                                            {transaction.category}
                                        </span>
                                    ) : (
                                        <span className="empty-value">—</span>
                                    )}
                                </p>

                                <p>
                                    <span
                                        className={`type-badge ${transaction.type === "expense" ? "expense" : "income"}`}
                                    >
                                        {transaction.type === "expense" ? "Despesa" : "Receita"}
                                    </span>
                                </p>

                                <p>
                                    {transaction.payment_method || "—"}
                                </p>

                                <p>
                                    {transaction.account || "—"}
                                </p>

                                <p
                                    className={`transaction-amount ${transaction.type === "expense" ? "expense-value" : "income-value"}`}
                                >
                                    {transaction.type === "expense" ? "- " : "+ "}

                                    R$ {Number(transaction.amount).toFixed(2).replace(".", ",")}
                                </p>

                                <div className="transaction-actions">

                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() => openEditPanel(transaction)}
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() => handleDelete(transaction.id)}
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
                                    {editingId ? "EDITAR MOVIMENTAÇÃO" : "NOVA MOVIMENTAÇÃO"}
                                </span>

                                <h2>
                                    {editingId ? "Editar transação" : "Nova transação"}
                                </h2>

                                <p>
                                    {editingId
                                        ? "Altere os dados abaixo e salve para atualizar a movimentação."
                                        : "Preencha os dados abaixo para registrar uma nova movimentação."}
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
                                        onClick={() => handleTypeChange("expense")}
                                        className={type === "expense" ? "selected expense-selected" : ""}
                                    >
                                        <span className="type-option-icon">
                                            ↓
                                        </span>

                                        Despesa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange("income")}
                                        className={type === "income" ? "selected income-selected" : ""}
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

                            {!isIncome && (
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
                            )}

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

                            {!isIncome && (
                                <div className="form-group">

                                    <label>
                                        Forma de pagamento
                                    </label>

                                    <select
                                        value={paymentMethod}
                                        onChange={(event) => handlePaymentMethodChange(event.target.value)}
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
                            )}

                            <div className="form-group">

                                <label>
                                    {isIncome ? "Conta de destino" : "Conta"}
                                </label>

                                <select
                                    value={account}
                                    onChange={(event) => setAccount(event.target.value)}
                                    disabled={!isIncome && isCashPayment}
                                    required
                                >

                                    <option value="" disabled>
                                        Selecione uma conta
                                    </option>

                                    {accountOptions.map((accountOption) => (
                                        <option
                                            key={accountOption}
                                            value={accountOption}
                                        >
                                            {accountOption}
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
                                {editingId ? "Salvar alterações" : "Salvar transação"}
                            </button>

                        </div>

                    </form>
                </>
            )}

        </div>
    );
}