import "./Transactions.css";

export default function Transactions() {
    return (
        <div className="new-transaction-container">
            <div className="page-header">
                <h1>Nova transação</h1>
                <p>Adicione uma nova movimentação</p>
            </div>

            <form className="transaction-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Tipo</label>

                        <div className="type-options">
                            <button type="button">
                                Despesa
                            </button>

                            <button type="button">
                                Receita
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>

                        <input
                            type="text"
                            placeholder="Ex: Supermercado Extra"
                        />
                    </div>

                    <div className="form-group">
                        <label>Valor</label>

                        <input
                            type="text"
                            placeholder="R$ 0,00"
                        />
                    </div>

                </div>

                <div className="form-group">
                    <label>Categoria</label>

                    <select>
                        <option>Selecione uma categoria</option>
                    </select>
                </div>

                <div className="form-row">

                    <div className="form-group">
                        <label>Data</label>
                        <input type="date" />
                    </div>

                    <div className="form-group">
                        <label>Conta</label>

                        <select>
                            <option>Selecione uma conta</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Forma de pagamento</label>

                        <select>
                            <option>Selecione</option>
                        </select>
                    </div>

                </div>

                <div className="form-group">
                    <label>Observação (opcional)</label>

                    <textarea
                        placeholder="Adicione uma observação"
                    ></textarea>
                </div>

                <div className="checkbox-row">
                    <input type="checkbox" />
                    <label>Transação recorrente</label>
                </div>

                <div className="form-actions">
                    <button type="button">
                        Cancelar
                    </button>

                    <button type="submit">
                        Salvar transação
                    </button>
                </div>
            </form>

        </div>
    )
}