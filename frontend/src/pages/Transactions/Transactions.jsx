import "./Transactions.css";
import { useState } from "react";

export default function Transactions() {

    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");
    const [account, setAccount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [note, setNote] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);

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

    async function handleSubmit(event) {
        event.preventDefault();

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

    console.log(transaction);
}

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
                <form 
                className="transaction-form"
                onSubmit={handleSubmit}
                >
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo</label>

                            <div className="type-options">
                                <button 
                                type="button"
                                onClick={() => setType("expense")}
                                className={type === "expense" ? "selected" : ""}
                                >
                                    Despesa
                                </button>

                                <button 
                                type="button"
                                onClick={() => setType("income")}
                                className={type === "income" ? "selected" : ""}
                                >
                                    Receita
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Descrição</label>

                            <input
                                type="text"
                                placeholder="Ex: Supermercado Extra"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Valor</label>

                            <input
                                type="text"
                                placeholder="R$ 0,00"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Categoria</label>

                        <select value={category} onChange={(event) => setCategory(event.target.value)}>
                            <option value="">Selecione uma categoria</option>

                            {categories.map((category) => (
                                <option key={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label>Data</label>
                            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Conta</label>

                            <select value={account} onChange={(event) => setAccount(event.target.value)}>

                                <option value="">Selecione uma conta</option>
                                {accounts.map((account) => (
                                    <option key={account}>
                                        {account}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Forma de pagamento</label>

                            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                                <option value="">Selecione</option>

                                {paymentMethods.map((method) => (
                                    <option key={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Observação (opcional)</label>

                        <textarea
                            placeholder="Adicione uma observação"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        ></textarea>
                    </div>

                    <div className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(event) => setIsRecurring(event.target.checked)}
                        />
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
        </div>
    )
}