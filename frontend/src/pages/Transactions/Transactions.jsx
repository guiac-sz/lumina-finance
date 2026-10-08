import "./Transactions.css";
import { useState, useEffect } from "react";
import {
    CATEGORIES,
    ACCOUNTS,
    PAYMENT_METHODS,
    WALLET_ACCOUNT,
    CASH_PAYMENT_METHOD
} from "../../constants/transactions";

const PERIOD_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "thisMonth", label: "Este m\u00eas" },
    { value: "lastMonth", label: "M\u00eas passado" },
    { value: "last30", label: "\u00daltimos 30 dias" },
    { value: "custom", label: "Personalizado" }
];

// Converte uma data para "AAAA-MM-DD" usando o dia local do usu\u00e1rio
// (toISOString usaria o fuso UTC e poderia errar o dia).
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Transforma o per\u00edodo escolhido em datas "de" e "at\u00e9" para a API.
function getPeriodRange(period, customFrom, customTo) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    if (period === "thisMonth") {
        return {
            from: formatDateInput(new Date(year, month, 1)),
            to: formatDateInput(new Date(year, month + 1, 0))
        };
    }

    if (period === "lastMonth") {
        return {
            from: formatDateInput(new Date(year, month - 1, 1)),
            to: formatDateInput(new Date(year, month, 0))
        };
    }

    if (period === "last30") {
        // Hoje + os 29 dias anteriores = 30 dias.
        return {
            from: formatDateInput(new Date(year, month, today.getDate() - 29)),
            to: formatDateInput(today)
        };
    }

    if (period === "custom") {
        return { from: customFrom, to: customTo };
    }

    return { from: "", to: "" };
}

function formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
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
    const [transactions, setTransactions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loadError, setLoadError] = useState("");
    const [editingId, setEditingId] = useState(null);

    // Filtros da lista. "searchTerm" é o que o usuário digita; "debouncedSearch"
    // é o valor que de fato vai para a API (só muda 300 ms depois de parar de digitar).
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterAccount, setFilterAccount] = useState("");
    const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
    const [period, setPeriod] = useState("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    // Sempre que esse número muda, a lista é buscada de novo na API
    // (usado depois de criar, editar ou excluir).
    const [refreshKey, setRefreshKey] = useState(0);

    const isIncome = type === "income";
    const isCashPayment = paymentMethod === CASH_PAYMENT_METHOD;

    // Receita pode ir para a Carteira; despesa em dinheiro só usa a Carteira;
    // as demais formas de pagamento nunca mostram a Carteira.
    const accountOptions = isIncome
        ? [WALLET_ACCOUNT, ...ACCOUNTS]
        : isCashPayment
            ? [WALLET_ACCOUNT]
            : ACCOUNTS;

    const { from: dateFrom, to: dateTo } = getPeriodRange(
        period,
        customFrom,
        customTo
    );

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        filterType !== "" ||
        filterCategory !== "" ||
        filterAccount !== "" ||
        filterPaymentMethod !== "" ||
        period !== "all";

    // Resumo do resultado filtrado. Somamos em centavos (inteiros) para
    // evitar erros de arredondamento dos números com vírgula do JavaScript.
    let incomeCents = 0;
    let expenseCents = 0;

    transactions.forEach((transaction) => {
        const cents = Math.round(Number(transaction.amount) * 100);

        if (transaction.type === "income") {
            incomeCents += cents;
        } else {
            expenseCents += cents;
        }
    });

    const totalIncome = incomeCents / 100;
    const totalExpense = expenseCents / 100;
    const balance = (incomeCents - expenseCents) / 100;

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
        if (newType === "expense" && account === WALLET_ACCOUNT) {
            setAccount("");
        }
    }

    function handlePaymentMethodChange(method) {
        setPaymentMethod(method);

        if (method === CASH_PAYMENT_METHOD) {
            setAccount(WALLET_ACCOUNT);
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

            // Busca a lista de novo na API para ela respeitar os filtros ativos.
            setRefreshKey((current) => current + 1);

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

    // Debounce: espera 300 ms sem digitar antes de enviar a busca para a API.
    // Se o usuário digitar de novo antes disso, o timer anterior é cancelado.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Busca as transações já filtradas pela API. Roda de novo sempre que
    // algum filtro muda (ou depois de criar, editar ou excluir).
    useEffect(() => {
        const controller = new AbortController();

        async function loadTransactions() {
            const params = new URLSearchParams();

            if (debouncedSearch) params.set("search", debouncedSearch);
            if (filterType) params.set("type", filterType);
            if (filterCategory) params.set("category", filterCategory);
            if (filterAccount) params.set("account", filterAccount);
            if (filterPaymentMethod) params.set("payment_method", filterPaymentMethod);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);

            try {
                const response = await fetch(
                    `http://localhost:3000/transactions?${params}`,
                    { signal: controller.signal }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao buscar transações");
                }

                setTransactions(data);
                setLoadError("");
            } catch (error) {
                // Pedido cancelado porque um filtro mudou: é normal, ignora.
                if (error.name === "AbortError") {
                    return;
                }

                console.error("Erro ao buscar transações:", error);

                setTransactions([]);
                setLoadError(
                    error instanceof TypeError
                        ? "Não foi possível conectar ao servidor."
                        : error.message
                );
            }
        }

        loadTransactions();

        // Se os filtros mudarem antes da resposta chegar, cancela este pedido
        // para uma resposta antiga não sobrescrever a mais nova.
        return () => controller.abort();
    }, [
        debouncedSearch,
        filterType,
        filterCategory,
        filterAccount,
        filterPaymentMethod,
        dateFrom,
        dateTo,
        refreshKey
    ]);

    // Total de transações cadastradas (sem filtros), para o "X de Y".
    useEffect(() => {
        async function loadTotalCount() {
            try {
                const response = await fetch(
                    "http://localhost:3000/transactions/count"
                );

                const data = await response.json();

                setTotalCount(data.total);
            } catch (error) {
                console.error("Erro ao contar transações:", error);
            }
        }

        loadTotalCount();
    }, [refreshKey]);

    function handleFilterTypeChange(value) {
        setFilterType(value);

        // Receita não tem categoria nem forma de pagamento: limpa esses filtros.
        if (value === "income") {
            setFilterCategory("");
            setFilterPaymentMethod("");
        }
    }

    function clearFilters() {
        setSearchTerm("");
        setDebouncedSearch("");
        setFilterType("");
        setFilterCategory("");
        setFilterAccount("");
        setFilterPaymentMethod("");
        setPeriod("all");
        setCustomFrom("");
        setCustomTo("");
    }

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

            // Busca a lista de novo na API para ela respeitar os filtros ativos.
            setRefreshKey((current) => current + 1);
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
                            {transactions.length} de {totalCount} transações
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="clear-filters-button"
                            onClick={clearFilters}
                        >
                            Limpar filtros
                            <span>×</span>
                        </button>
                    )}

                </div>

                <div className="transactions-filters">

                    <div className="filters-row">

                        <div className="filter-field filter-search">
                            <label>
                                Buscar
                            </label>

                            <input
                                type="text"
                                placeholder="Descrição ou observação..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>

                        <div className="filter-field filter-type">
                            <label>
                                Tipo
                            </label>

                            <div className="filter-type-options">

                                <button
                                    type="button"
                                    onClick={() => handleFilterTypeChange("")}
                                    className={filterType === "" ? "selected" : ""}
                                >
                                    Todas
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleFilterTypeChange("expense")}
                                    className={filterType === "expense" ? "selected expense-selected" : ""}
                                >
                                    Despesas
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleFilterTypeChange("income")}
                                    className={filterType === "income" ? "selected income-selected" : ""}
                                >
                                    Receitas
                                </button>

                            </div>
                        </div>

                    </div>

                    <div className="filters-row">

                        {filterType !== "income" && (
                            <div className="filter-field">
                                <label>
                                    Categoria
                                </label>

                                <select
                                    value={filterCategory}
                                    onChange={(event) => setFilterCategory(event.target.value)}
                                >
                                    <option value="">
                                        Todas
                                    </option>

                                    {CATEGORIES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="filter-field">
                            <label>
                                Conta
                            </label>

                            <select
                                value={filterAccount}
                                onChange={(event) => setFilterAccount(event.target.value)}
                            >
                                <option value="">
                                    Todas
                                </option>

                                {[WALLET_ACCOUNT, ...ACCOUNTS].map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {filterType !== "income" && (
                            <div className="filter-field">
                                <label>
                                    Forma de pagamento
                                </label>

                                <select
                                    value={filterPaymentMethod}
                                    onChange={(event) => setFilterPaymentMethod(event.target.value)}
                                >
                                    <option value="">
                                        Todas
                                    </option>

                                    {PAYMENT_METHODS.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="filter-field">
                            <label>
                                Período
                            </label>

                            <select
                                value={period}
                                onChange={(event) => setPeriod(event.target.value)}
                            >
                                {PERIOD_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {period === "custom" && (
                            <>
                                <div className="filter-field">
                                    <label>
                                        De
                                    </label>

                                    <input
                                        type="date"
                                        value={customFrom}
                                        onChange={(event) => setCustomFrom(event.target.value)}
                                    />
                                </div>

                                <div className="filter-field">
                                    <label>
                                        Até
                                    </label>

                                    <input
                                        type="date"
                                        value={customTo}
                                        onChange={(event) => setCustomTo(event.target.value)}
                                    />
                                </div>
                            </>
                        )}

                    </div>

                </div>

                <div className="transactions-summary">

                    <div className="summary-card">
                        <span>Receitas</span>

                        <strong className="income-value">
                            {formatCurrency(totalIncome)}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>Despesas</span>

                        <strong className="expense-value">
                            {formatCurrency(totalExpense)}
                        </strong>
                    </div>

                    <div className="summary-card">
                        <span>Saldo</span>

                        <strong className={balance < 0 ? "expense-value" : "income-value"}>
                            {formatCurrency(balance)}
                        </strong>
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

                    {loadError ? (

                        <div className="empty-state">

                            <h3>
                                Não foi possível carregar as transações
                            </h3>

                            <p>
                                {loadError}
                            </p>

                        </div>

                    ) : transactions.length === 0 && !hasActiveFilters ? (

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

                    ) : transactions.length === 0 ? (

                        <div className="empty-state">

                            <h3>
                                Nenhuma transação encontrada
                            </h3>

                            <p>
                                Nenhuma movimentação corresponde aos filtros
                                selecionados. Ajuste os filtros ou limpe-os
                                para ver todas as transações.
                            </p>

                            <button onClick={clearFilters}>
                                Limpar filtros
                            </button>

                        </div>

                    ) : (

                        transactions.map((transaction, index) => (

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

                                    {formatCurrency(Number(transaction.amount))}
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

                                        {CATEGORIES.map((category) => (
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

                                        {PAYMENT_METHODS.map((method) => (
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