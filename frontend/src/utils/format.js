// Funções de formatação usadas em mais de uma tela.

// Formata um número como moeda brasileira (ex: 1500.5 vira "R$ 1.500,50").
export function formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
