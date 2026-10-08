import "./Overview.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { ACCOUNT_DESCRIPTIONS } from "../../constants/transactions";
import { formatCurrency } from "../../utils/format";
import { API_URL } from "../../utils/api";

const INCOME_COLOR = "#1f8a70";
const EXPENSE_COLOR = "#dc4c4c";

// Mês atual no formato "AAAA-MM" (o mesmo formato que a API usa).
function getCurrentMonth() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${today.getFullYear()}-${month}`;
}

// Anda para frente ou para trás em meses: ("2026-01", -1) vira "2025-12".
// O próprio Date cuida da virada de ano.
function shiftMonth(month, amount) {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + amount, 1);
    const newMonth = String(date.getMonth() + 1).padStart(2, "0");

    return `${date.getFullYear()}-${newMonth}`;
}

// "2026-10" vira "outubro" (usado no texto "vs. setembro").
function getMonthName(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
        month: "long"
    });
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// "2026-10" vira "Outubro de 2026".
function formatMonthLabel(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    return capitalize(
        new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        })
    );
}

// "2026-05" vira "Mai" (nome curto, para o eixo do gráfico).
function formatShortMonth(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    // O navegador devolve "mai." com ponto: tira o ponto.
    return capitalize(
        new Date(year, monthNumber - 1, 1)
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", "")
    );
}

// Valores do eixo vertical: "R$ 500", "R$ 2 mil", "R$ 1,5 mil".
function formatAxisValue(value) {
    if (value >= 1000) {
        const thousands = (value / 1000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1
        });

        return `R$ ${thousands} mil`;
    }

    return `R$ ${value}`;
}

// Caixinha que aparece ao passar o mouse sobre um mês do gráfico.
function ChartTooltip({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const row = payload[0].payload;
    const balance = Math.round((row.income - row.expense) * 100) / 100;

    return (
        <div className="overview-tooltip">

            <b>{row.fullLabel}</b>

            <div className="overview-tooltip-row">
                <i style={{ background: INCOME_COLOR }}></i>
                Receitas: <b>{formatCurrency(row.income)}</b>
            </div>

            <div className="overview-tooltip-row">
                <i style={{ background: EXPENSE_COLOR }}></i>
                Despesas: <b>{formatCurrency(row.expense)}</b>
            </div>

            <div className="overview-tooltip-muted">
                Saldo do mês: {formatCurrency(balance)}
            </div>

        </div>
    );
}

// "2026-10-07" vira "07/10/2026". Só troca a ordem do texto: não usa Date,
// assim o fuso horário não consegue mudar o dia.
function formatDate(date) {
    return date.split("-").reverse().join("/");
}

// Iniciais para o avatar da conta: "Nubank" vira "NU" e "Banco do Brasil"
// vira "BB" (ignora palavras pequenas como "do" e "de").
function getInitials(name) {
    const words = name
        .split(" ")
        .filter((word) => !["de", "da", "do", "das", "dos", "e"].includes(word.toLowerCase()));

    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
}

function formatPercent(value) {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

// Variação percentual contra o mês anterior. Se o mês anterior foi zero
// não existe base de comparação (seria divisão por zero): devolve null.
function calcVariation(current, previous) {
    if (previous === 0) {
        return null;
    }

    return ((current - previous) / previous) * 100;
}

// Selo com a variação. Nas despesas, queda é boa (lowerIsBetter): fica verde.
function VariationBadge({ current, previous, lowerIsBetter, previousMonthName }) {
    const variation = calcVariation(current, previous);

    if (variation === null) {
        return (
            <>
                <span className="overview-delta neutral">—</span>
                vs. {previousMonthName}
            </>
        );
    }

    const isStable = Math.abs(variation) < 0.05;
    const isGood = lowerIsBetter ? variation < 0 : variation > 0;

    let style = "neutral";

    if (!isStable) {
        style = isGood ? "good" : "bad";
    }

    return (
        <>
            <span className={`overview-delta ${style}`}>
                {isStable ? "" : variation > 0 ? "▲ " : "▼ "}
                {formatPercent(Math.abs(variation))}
            </span>
            vs. {previousMonthName}
        </>
    );
}

function KpiCard({ label, icon, iconColor, isLoading, value, valueStyle, children }) {
    return (
        <div className="overview-card overview-kpi">

            <div className="overview-kpi-top">
                <span className="overview-kpi-label">
                    {label}
                </span>

                <span className={`overview-kpi-icon ${iconColor}`}>
                    {icon}
                </span>
            </div>

            {isLoading ? (
                <>
                    <div className="overview-skeleton overview-skeleton-value"></div>
                    <div className="overview-skeleton overview-skeleton-foot"></div>
                </>
            ) : (
                <>
                    <div className={`overview-kpi-value ${valueStyle || ""}`}>
                        {value}
                    </div>

                    {children}
                </>
            )}

        </div>
    );
}

export default function Overview() {
    const currentMonth = getCurrentMonth();

    const [month, setMonth] = useState(currentMonth);

    // Guarda a resposta junto com o mês a que ela pertence. Assim sabemos que
    // está carregando sempre que o mês escolhido ainda não tem resposta.
    const [result, setResult] = useState(null);

    // Muda para forçar uma nova busca (botão "Tentar novamente").
    const [reloadKey, setReloadKey] = useState(0);

    const isLoading = result === null || result.month !== month;
    const summary = isLoading ? null : result.summary;
    const error = isLoading ? "" : result.error;

    useEffect(() => {
        const controller = new AbortController();

        async function loadSummary() {
            try {
                const response = await fetch(
                    `${API_URL}/summary?month=${month}`,
                    { signal: controller.signal }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao carregar o resumo");
                }

                setResult({ month, summary: data, error: "" });
            } catch (fetchError) {
                // Pedido cancelado porque o mês mudou: é normal, ignora.
                if (fetchError.name === "AbortError") {
                    return;
                }

                console.error("Erro ao carregar o resumo:", fetchError);

                setResult({
                    month,
                    summary: null,
                    error: fetchError instanceof TypeError
                        ? "Não foi possível conectar ao servidor."
                        : fetchError.message
                });
            }
        }

        loadSummary();

        // Se o mês mudar antes da resposta chegar, cancela este pedido para
        // uma resposta antiga não aparecer no mês errado.
        return () => controller.abort();
    }, [month, reloadKey]);

    function handleRetry() {
        setResult(null);
        setReloadKey((current) => current + 1);
    }

    const income = summary ? summary.currentMonth.income : 0;
    const expense = summary ? summary.currentMonth.expense : 0;
    const previousIncome = summary ? summary.previousMonth.income : 0;
    const previousExpense = summary ? summary.previousMonth.expense : 0;
    const currentBalance = summary ? summary.currentBalance : 0;

    // Economia = receitas - despesas (arredondado para não sobrar 0,000000001).
    const savings = Math.round((income - expense) * 100) / 100;

    // Sem receita no mês não existe "% guardado" (seria divisão por zero).
    const savedPercent = income > 0 ? (savings / income) * 100 : null;
    const progress = savedPercent === null
        ? 0
        : Math.min(Math.max(savedPercent, 0), 100);

    const previousMonthName = getMonthName(shiftMonth(month, -1));

    // Dados do gráfico: um item por mês, com o nome curto para o eixo e o
    // nome completo para o tooltip (com o ano se for diferente do escolhido).
    const selectedYear = month.slice(0, 4);
    const isCurrentMonth = month === currentMonth;

    const chartData = summary
        ? summary.monthlyTotals.map((item) => {
            const [itemYear] = item.month.split("-");
            const fullName = capitalize(getMonthName(item.month));
            const isPartial = item.month === currentMonth;

            return {
                ...item,
                label: formatShortMonth(item.month) + (isPartial ? "*" : ""),
                fullLabel: (itemYear === selectedYear
                    ? fullName
                    : `${fullName} de ${itemYear}`) + (isPartial ? " (parcial)" : "")
            };
        })
        : [];

    // Despesas por categoria. A lista já vem ordenada da API (maior primeiro).
    // A barra de cada categoria é proporcional à maior delas.
    const expensesByCategory = summary ? summary.expensesByCategory : [];
    const maxCategoryTotal = Math.max(
        0,
        ...expensesByCategory.map((item) => item.total)
    );

    // Últimas transações e saldo por conta (não dependem do mês escolhido).
    const recentTransactions = summary ? summary.recentTransactions : [];
    const balanceByAccount = summary ? summary.balanceByAccount : [];

    // Para a nota "em andamento (até 08/10)".
    const today = new Date();
    const todayLabel = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`;

    return (
        <div className="overview-container">
            <div className="overview-page">

                <div className="overview-header">

                    <div>
                        <span className="overview-label">
                            PAINEL
                        </span>

                        <h1>
                            Visão geral
                        </h1>

                        <p>
                            Acompanhe sua saúde financeira mês a mês.
                        </p>
                    </div>

                    <div className="overview-header-actions">

                        <div
                            className="overview-month-picker"
                            aria-label="Mês selecionado"
                        >
                            <button
                                type="button"
                                aria-label="Mês anterior"
                                onClick={() => setMonth(shiftMonth(month, -1))}
                            >
                                ‹
                            </button>

                            <span>
                                {formatMonthLabel(month)}
                            </span>

                            {/* Não deixa avançar além do mês atual */}
                            <button
                                type="button"
                                aria-label="Próximo mês"
                                disabled={month >= currentMonth}
                                onClick={() => setMonth(shiftMonth(month, 1))}
                            >
                                ›
                            </button>
                        </div>

                        <Link to="/transactions" className="overview-primary-button">
                            <span>+</span>
                            Nova transação
                        </Link>

                    </div>

                </div>

                {error ? (

                    <div className="overview-card overview-error" role="alert">

                        <h3>
                            Não foi possível carregar o resumo
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button type="button" onClick={handleRetry}>
                            Tentar novamente
                        </button>

                    </div>

                ) : (

                    <>

                        <section className="overview-kpi-grid">

                            <KpiCard
                                label="Saldo atual"
                                icon="$"
                                iconColor="blue"
                                isLoading={isLoading}
                                value={formatCurrency(currentBalance)}
                                valueStyle={currentBalance < 0 ? "negative" : ""}
                            >
                                <div className="overview-kpi-foot">
                                    em todas as contas
                                </div>
                            </KpiCard>

                            <KpiCard
                                label="Receitas do mês"
                                icon="↑"
                                iconColor="green"
                                isLoading={isLoading}
                                value={formatCurrency(income)}
                            >
                                <div className="overview-kpi-foot">
                                    <VariationBadge
                                        current={income}
                                        previous={previousIncome}
                                        lowerIsBetter={false}
                                        previousMonthName={previousMonthName}
                                    />
                                </div>
                            </KpiCard>

                            <KpiCard
                                label="Despesas do mês"
                                icon="↓"
                                iconColor="red"
                                isLoading={isLoading}
                                value={formatCurrency(expense)}
                            >
                                <div className="overview-kpi-foot">
                                    <VariationBadge
                                        current={expense}
                                        previous={previousExpense}
                                        lowerIsBetter={true}
                                        previousMonthName={previousMonthName}
                                    />
                                </div>
                            </KpiCard>

                            <KpiCard
                                label="Economia do mês"
                                icon="%"
                                iconColor="blue"
                                isLoading={isLoading}
                                value={formatCurrency(savings)}
                                valueStyle={savings < 0 ? "negative" : ""}
                            >
                                <div className="overview-kpi-foot">
                                    {savedPercent === null
                                        ? "sem receitas neste mês"
                                        : savings < 0
                                            ? "despesas maiores que as receitas"
                                            : `${formatPercent(savedPercent)} das receitas guardadas`}
                                </div>

                                <div className="overview-progress" aria-hidden="true">
                                    <div style={{ width: `${progress}%` }}></div>
                                </div>
                            </KpiCard>

                        </section>

                        <section className="overview-row">

                            <div className="overview-card">

                                <div className="overview-panel-head">

                                    <div>
                                        <h2>
                                            Receitas x despesas
                                        </h2>

                                        <p>
                                            Últimos 6 meses
                                        </p>
                                    </div>

                                    <div className="overview-legend">
                                        <span>
                                            <i style={{ background: INCOME_COLOR }}></i>
                                            Receitas
                                        </span>

                                        <span>
                                            <i style={{ background: EXPENSE_COLOR }}></i>
                                            Despesas
                                        </span>
                                    </div>

                                </div>

                                <div className="overview-panel-body">

                                    {isLoading ? (

                                        <div className="overview-skeleton overview-skeleton-chart"></div>

                                    ) : (

                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart
                                                data={chartData}
                                                barGap={2}
                                                margin={{ top: 22, right: 8, bottom: 0, left: 0 }}
                                            >
                                                <CartesianGrid vertical={false} stroke="#eef0f4" />

                                                <XAxis
                                                    dataKey="label"
                                                    tickLine={false}
                                                    axisLine={{ stroke: "#dfe2e8" }}
                                                    tick={{ fontSize: 12, fill: "#8b92a2" }}
                                                />

                                                <YAxis
                                                    width={84}
                                                    domain={[0, (dataMax) => (dataMax > 0 ? dataMax : 1000)]}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={formatAxisValue}
                                                    tick={{ fontSize: 11.5, fill: "#9096a5" }}
                                                />

                                                <Tooltip
                                                    content={<ChartTooltip />}
                                                    cursor={{ fill: "#4f6ef7", fillOpacity: 0.05 }}
                                                    wrapperStyle={{ outline: "none" }}
                                                />

                                                <Bar
                                                    dataKey="income"
                                                    name="Receitas"
                                                    fill={INCOME_COLOR}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={24}
                                                />

                                                <Bar
                                                    dataKey="expense"
                                                    name="Despesas"
                                                    fill={EXPENSE_COLOR}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={24}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>

                                    )}

                                    {isCurrentMonth && (
                                        <div className="overview-chart-note">
                                            * {capitalize(getMonthName(month))} em andamento (até {todayLabel})
                                        </div>
                                    )}

                                </div>

                            </div>

                            <div className="overview-card">

                                <div className="overview-panel-head">

                                    <div>
                                        <h2>
                                            Despesas por categoria
                                        </h2>

                                        <p>
                                            {formatMonthLabel(month)}
                                        </p>
                                    </div>

                                </div>

                                <div className="overview-panel-body">

                                    {isLoading ? (

                                        <div className="overview-cat-list">
                                            <div className="overview-skeleton overview-skeleton-category"></div>
                                            <div className="overview-skeleton overview-skeleton-category"></div>
                                            <div className="overview-skeleton overview-skeleton-category"></div>
                                        </div>

                                    ) : expensesByCategory.length === 0 ? (

                                        <div className="overview-empty">

                                            <strong>
                                                Nenhuma despesa em {formatMonthLabel(month)}
                                            </strong>

                                            <p>
                                                Quando você registrar despesas neste mês,
                                                elas aparecem aqui por categoria.
                                            </p>

                                        </div>

                                    ) : (

                                        <>

                                            <div className="overview-cat-list">

                                                {expensesByCategory.map((item) => (
                                                    <div className="overview-cat-row" key={item.category}>

                                                        <div className="overview-cat-line">
                                                            <span className="overview-cat-name">
                                                                {item.category}
                                                            </span>

                                                            <span className="overview-cat-value">
                                                                {formatCurrency(item.total)}

                                                                <small>
                                                                    {formatPercent((item.total / expense) * 100)}
                                                                </small>
                                                            </span>
                                                        </div>

                                                        {/* Barra proporcional à maior categoria (a maior ocupa 100%) */}
                                                        <div className="overview-cat-track">
                                                            <div
                                                                className="overview-cat-fill"
                                                                style={{ width: `${(item.total / maxCategoryTotal) * 100}%` }}
                                                            ></div>
                                                        </div>

                                                    </div>
                                                ))}

                                            </div>

                                            <div className="overview-cat-total">
                                                <span>Total de despesas</span>

                                                <strong>{formatCurrency(expense)}</strong>
                                            </div>

                                        </>

                                    )}

                                </div>

                            </div>

                        </section>

                        <section className="overview-row">

                            <div className="overview-card">

                                <div className="overview-panel-head overview-panel-head-table">

                                    <div>
                                        <h2>
                                            Últimas transações
                                        </h2>

                                        <p>
                                            As 5 movimentações mais recentes
                                        </p>
                                    </div>

                                    <Link to="/transactions" className="overview-text-link">
                                        Ver todas →
                                    </Link>

                                </div>

                                {isLoading ? (

                                    <div className="overview-panel-body">
                                        <div className="overview-list-skeleton">
                                            <div className="overview-skeleton overview-skeleton-row"></div>
                                            <div className="overview-skeleton overview-skeleton-row"></div>
                                            <div className="overview-skeleton overview-skeleton-row"></div>
                                            <div className="overview-skeleton overview-skeleton-row"></div>
                                            <div className="overview-skeleton overview-skeleton-row"></div>
                                        </div>
                                    </div>

                                ) : recentTransactions.length === 0 ? (

                                    <div className="overview-panel-body">
                                        <div className="overview-empty">

                                            <strong>
                                                Nenhuma transação cadastrada ainda
                                            </strong>

                                            <p>
                                                Suas movimentações mais recentes
                                                aparecem aqui.
                                            </p>

                                            <Link to="/transactions">
                                                + Adicionar transação
                                            </Link>

                                        </div>
                                    </div>

                                ) : (

                                    <div className="overview-table-wrap">
                                        <table className="overview-tx-table">

                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Descrição</th>
                                                    <th className="overview-hide-sm">Categoria</th>
                                                    <th className="overview-hide-sm">Conta</th>
                                                    <th className="overview-num">Valor</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {recentTransactions.map((transaction) => {
                                                    const isIncomeRow = transaction.type === "income";

                                                    return (
                                                        <tr key={transaction.id}>

                                                            <td>
                                                                {formatDate(transaction.date)}
                                                            </td>

                                                            <td>
                                                                <div className="overview-tx-desc">
                                                                    <span className="overview-tx-icon">
                                                                        {isIncomeRow ? "↑" : "↓"}
                                                                    </span>

                                                                    {transaction.description}
                                                                </div>
                                                            </td>

                                                            <td className="overview-hide-sm">
                                                                {transaction.category ? (
                                                                    <span className="overview-badge">
                                                                        {transaction.category}
                                                                    </span>
                                                                ) : (
                                                                    <span className="overview-empty-value">—</span>
                                                                )}
                                                            </td>

                                                            <td className="overview-hide-sm">
                                                                {transaction.account || "—"}
                                                            </td>

                                                            <td className={`overview-num ${isIncomeRow ? "overview-income" : "overview-expense"}`}>
                                                                {isIncomeRow ? "+ " : "- "}
                                                                {formatCurrency(transaction.amount)}
                                                            </td>

                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                        </table>
                                    </div>

                                )}

                            </div>

                            <div className="overview-card">

                                <div className="overview-panel-head">

                                    <div>
                                        <h2>
                                            Saldo por conta
                                        </h2>

                                        <p>
                                            Considerando todas as transações
                                        </p>
                                    </div>

                                </div>

                                <div className="overview-panel-body">

                                    {isLoading ? (

                                        <div className="overview-list-skeleton">
                                            <div className="overview-skeleton overview-skeleton-account"></div>
                                            <div className="overview-skeleton overview-skeleton-account"></div>
                                            <div className="overview-skeleton overview-skeleton-account"></div>
                                        </div>

                                    ) : balanceByAccount.length === 0 ? (

                                        <div className="overview-empty">

                                            <strong>
                                                Nenhuma conta com movimentações
                                            </strong>

                                            <p>
                                                Os saldos de cada conta aparecem aqui
                                                assim que você registrar transações.
                                            </p>

                                        </div>

                                    ) : (

                                        <>

                                            <div className="overview-acc-list">

                                                {balanceByAccount.map((item) => (
                                                    <div className="overview-acc-row" key={item.account}>

                                                        <span className="overview-acc-avatar">
                                                            {getInitials(item.account)}
                                                        </span>

                                                        <span className="overview-acc-name">
                                                            {item.account}

                                                            {ACCOUNT_DESCRIPTIONS[item.account] && (
                                                                <small>
                                                                    {ACCOUNT_DESCRIPTIONS[item.account]}
                                                                </small>
                                                            )}
                                                        </span>

                                                        <span className={`overview-acc-value ${item.balance < 0 ? "negative" : ""}`}>
                                                            {formatCurrency(item.balance)}
                                                        </span>

                                                    </div>
                                                ))}

                                            </div>

                                            <div className="overview-acc-total">
                                                <span>Saldo total</span>

                                                <strong>{formatCurrency(currentBalance)}</strong>
                                            </div>

                                        </>

                                    )}

                                </div>

                            </div>

                        </section>

                    </>

                )}

            </div>
        </div>
    );
}
