// Listas usadas no formulário e nos filtros da tela de Transações.

export const CATEGORIES = [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Lazer"
];

export const ACCOUNTS = [
    "Nubank",
    "Bradesco",
    "Caixa Econômica Federal",
    "Banco do Brasil"
];

export const PAYMENT_METHODS = [
    "Cartão de crédito",
    "Cartão de débito",
    "Pix",
    "Dinheiro"
];

// Conta especial: só existe para dinheiro em espécie e para receitas.
export const WALLET_ACCOUNT = "Carteira";

// Forma de pagamento que trava a conta em "Carteira".
export const CASH_PAYMENT_METHOD = "Dinheiro";

// Descrição curta de cada conta, mostrada no saldo por conta da visão geral.
// Conta que não estiver aqui aparece sem descrição.
export const ACCOUNT_DESCRIPTIONS = {
    "Nubank": "Conta digital",
    "Bradesco": "Conta corrente",
    "Caixa Econômica Federal": "Conta corrente",
    "Banco do Brasil": "Conta corrente",
    [WALLET_ACCOUNT]: "Dinheiro em espécie"
};
