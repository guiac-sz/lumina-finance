# Lumina
 
Aplicação full stack de controle financeiro pessoal: registre receitas e despesas, encontre qualquer movimentação em segundos e acompanhe para onde o seu dinheiro está indo.
 
Projeto de portfólio desenvolvido para praticar o ciclo completo de uma aplicação web: interface em React, API REST em Node.js/Express e persistência em PostgreSQL.

## Funcionalidades

### Disponível
 
- [x] Cadastro de transações (receita ou despesa) com categoria, conta, forma de pagamento e observação
- [x] Listagem de transações
- [x] Exclusão de transações
- [x] Busca de transações por descrição

### Em desenvolvimento (v1)
 
- [ ] Edição de transações
- [ ] Filtros por tipo, categoria e período
- [ ] Visão geral com dados reais: saldo, receitas, despesas e economia do mês
- [ ] Gráfico de despesas por categoria

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
| Front-end | React, React Router, Vite, CSS       |
| Back-end  | Node.js, Express                     |
| Banco     | PostgreSQL (driver `pg`)             |
| Outros    | Git e GitHub (branches e pull requests) |

## Estrutura
 
```
lumina-finance/
├── backend/          # API REST (Express + PostgreSQL)
│   ├── src/server.js # rotas da API
│   ├── db.js         # conexão com o banco
│   └── .env.example  # modelo das variáveis de ambiente
└── frontend/         # interface em React (Vite)
    └── src/
        ├── components/
        └── pages/
```
 
## Endpoints da API
 
| Método | Rota                | Descrição                 |
| ------ | ------------------- | ------------------------- |
| GET    | `/transactions`     | Lista todas as transações |
| POST   | `/transactions`     | Cria uma transação        |
| DELETE | `/transactions/:id` | Exclui uma transação      |
 
## Como executar localmente
 
**Pré-requisitos:** Node.js 20+ e PostgreSQL instalados.
 
```bash
# 1. Clone o repositório
git clone https://github.com/guiac-sz/lumina-finance.git
cd lumina-finance
 
# 2. Banco de dados: crie o banco e as tabelas
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
npm run dev            # interface em http://localhost:5173
```
 
## Status
 
Em desenvolvimento. Acompanhe o progresso pelos commits e pull requests.
