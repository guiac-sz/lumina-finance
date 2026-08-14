import "./Transactions.css";
import { useState } from "react";

export default function Transactions() {
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    return (
        <div className="new-transaction-container">
            <div className="page-header">
                
                <div>
                    <h1>Lista de transações</h1>
                    <p>Aqui você pode visualizar todas as suas transações</p>
                </div>

                <button className="new-transaction-button" onClick={() => setIsPanelOpen(true)}>
                    + Nova Transação
                </button>

            </div>

            

            {isPanelOpen && (
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
                        <button type="button" onClick={() => setIsPanelOpen(false)}>
                            Voltar
                        </button>

                        <button type="submit">
                            Salvar transação
                        </button>
                    </div>
                </form>

            )}

            {/* <form className="transaction-form">
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
            </form> */}

        </div>
    )
}