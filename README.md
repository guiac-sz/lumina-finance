# Lumina
 
Aplicação full stack de controle financeiro pessoal: registre receitas e despesas, encontre qualquer movimentação em segundos e acompanhe para onde o seu dinheiro está indo.
 
Projeto de portfólio desenvolvido para praticar o ciclo completo de uma aplicação web: interface em React, API REST em Node.js/Express e persistência em PostgreSQL.

## Funcionalidades

### Disponível
 
- [x] Cadastro de transações (receita ou despesa) com categoria, conta, forma de pagamento e observação
- [x] Listagem de transações
- [x] Edição de transações
- [x] Exclusão de transações
- [x] Busca e filtros: texto (descrição e observação, ignorando acentos), tipo, categoria, conta, forma de pagamento e período
- [x] Visão geral com dados reais, mês a mês:
  - [x] Saldo atual, receitas, despesas e economia do mês, com a variação em relação ao mês anterior
  - [x] Gráfico de receitas x despesas dos últimos 6 meses
  - [x] Despesas por categoria
  - [x] Últimas transações e saldo por conta

### Próximas versões
 
- [ ] Autenticação de usuários (cada pessoa vê apenas as próprias transações)
- [ ] Testes automatizados da API
- [ ] Ambiente com Docker (API + banco com um único comando)
- [ ] Transações recorrentes
- [ ] Importação de extratos em CSV
- [ ] Simulação de cenários financeiros

## Tecnologias
 
| Camada    | Tecnologias                          |
| --------- | ------------------------------------ |
| Front-end | React, React Router, Recharts, Vite, CSS |
| Back-end  | Node.js, Express                     |
| Banco     | PostgreSQL (driver `pg`)             |
| Outros    | Git e GitHub (branches e pull requests) |

## Estrutura
 
```
lumina-finance/
├── backend/          # API REST (Express + PostgreSQL)
│   ├── src/server.js # rotas da API
│   ├── database/     # schema.sql: criação das tabelas
│   ├── db.js         # conexão com o banco
│   └── .env.example  # modelo das variáveis de ambiente
└── frontend/         # interface em React (Vite)
    ├── .env.example  # modelo das variáveis de ambiente (endereço da API)
    └── src/
        ├── components/
        ├── constants/ # listas fixas (categorias, contas, formas de pagamento)
        ├── pages/
        └── utils/     # funções compartilhadas (formatação de moeda, URL da API)
```
 
## Endpoints da API
 
| Método | Rota                     | Descrição                                                              |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| GET    | `/transactions`          | Lista as transações, da mais recente para a mais antiga (aceita filtros) |
| GET    | `/transactions/count`    | Total de transações cadastradas, sem filtros                           |
| POST   | `/transactions`          | Cria uma transação                                                     |
| PUT    | `/transactions/:id`      | Atualiza uma transação                                                 |
| DELETE | `/transactions/:id`      | Exclui uma transação                                                   |
| GET    | `/summary?month=AAAA-MM` | Resumo da visão geral do mês (sem `month`, usa o mês atual)            |

Entradas inválidas devolvem `400` com uma mensagem em português explicando o problema.

### Filtros de `GET /transactions`

Todos os parâmetros são opcionais e podem ser combinados:

| Parâmetro        | Descrição                                                                     |
| ---------------- | ----------------------------------------------------------------------------- |
| `search`         | Texto procurado na descrição e na observação (ignora maiúsculas e acentos)    |
| `type`           | `income` (receita) ou `expense` (despesa)                                     |
| `category`       | Categoria exata                                                               |
| `account`        | Conta exata                                                                   |
| `payment_method` | Forma de pagamento exata                                                      |
| `from` / `to`    | Período, no formato `AAAA-MM-DD` (inclui as duas datas)                       |

```bash
curl "http://localhost:3000/transactions?type=expense&category=Lazer&from=2026-10-01&to=2026-10-31"
```

### Resposta de `GET /summary`

Todos os cálculos (somas e agrupamentos) são feitos no banco de dados. O JSON devolvido tem:

| Campo                | Conteúdo                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `month`              | Mês consultado (`AAAA-MM`)                                                                       |
| `currentBalance`     | Saldo atual: todas as receitas menos todas as despesas, de todos os meses                        |
| `currentMonth`       | `income` e `expense` do mês consultado                                                           |
| `previousMonth`      | `income` e `expense` do mês anterior (usado na variação em %)                                    |
| `monthlyTotals`      | Receitas e despesas dos 6 meses até o consultado, do mais antigo ao mais novo (meses vazios = 0) |
| `expensesByCategory` | Despesas do mês por categoria, da maior para a menor                                             |
| `recentTransactions` | As 5 transações mais recentes (não dependem do mês)                                              |
| `balanceByAccount`   | Saldo de cada conta, considerando todas as transações (a soma é igual a `currentBalance`)         |

```bash
curl "http://localhost:3000/summary?month=2026-10"
```
 
## Como executar localmente
 
**Pré-requisitos:** Node.js 20+ e PostgreSQL instalados. A busca usa a extensão `unaccent`, que acompanha o PostgreSQL (em algumas distribuições Linux ela fica no pacote `postgresql-contrib`).
 
```bash
# 1. Clone o repositório
git clone https://github.com/guiac-sz/lumina-finance.git
cd lumina-finance
 
# 2. Banco de dados: crie o banco, a extensão unaccent e as tabelas
createdb lumina
psql -d lumina -f backend/database/schema.sql
 
# 3. Back-end
cd backend
npm install
cp .env.example .env   # preencha com os dados do seu PostgreSQL
npm run dev            # API em http://localhost:3000
 
# 4. Front-end (em outro terminal)
cd frontend
npm install
cp .env.example .env   # endereço da API (VITE_API_URL)
npm run dev            # interface em http://localhost:5173
```
 
## Status
 
Em desenvolvimento. Acompanhe o progresso pelos commits e pull requests.
