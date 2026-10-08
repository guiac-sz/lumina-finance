import "./Overview.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";
import { API_URL } from "../../utils/api";

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

// "2026-10" vira "Outubro de 2026".
function formatMonthLabel(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    const label = new Date(year, monthNumber - 1, 1).toLocaleDateString(
        "pt-BR",
        { month: "long", year: "numeric" }
    );

    return label.charAt(0).toUpperCase() + label.slice(1);
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

                )}

            </div>
        </div>
    );
}
