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
