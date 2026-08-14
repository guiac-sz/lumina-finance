import "./Overview.css";

export default function Overview() {
    return (
        <div>
            <div className="overview-text">
                <h1>Visão geral</h1>
                <p>Acompanhe sua saúde financeira</p>
            </div>

            <div className="overview-cards">

                <div className="card">
                    <img></img>
                    <h2>Saldo atual</h2>
                    <p>R$ 1.000,00</p>
                    <p>em todas as contas</p>
                </div>

                <div className="card">
                    <img></img>
                    <h2>Receitas</h2>
                    <p>R$ 1.000,00</p>
                    <p>este mês</p>
                </div>

                <div className="card">
                    <img></img>
                    <h2>Despesas</h2>
                    <p>R$ 1.000,00</p>
                    <p>este mês</p>
                </div>

                <div className="card">
                    <img></img>
                    <h2>Economia</h2>
                    <p>R$ 1.000,00</p>
                    <p>este mês</p>
                </div>

            </div>
        </div>
    )
}