-- Extensão que permite buscar ignorando acentos (usada na busca de transações)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Cria a tabela de transações do Lumina
CREATE TABLE IF NOT EXISTS transactions (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type           VARCHAR(10)   NOT NULL CHECK (type IN ('income', 'expense')),
    description    VARCHAR(255)  NOT NULL,
    amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category       VARCHAR(50),
    date           DATE          NOT NULL,
    account        VARCHAR(50),
    payment_method VARCHAR(50),
    note           TEXT,
    is_recurring   BOOLEAN       NOT NULL DEFAULT false,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);