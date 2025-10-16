# SIMS – Backend (Node/Express + MongoDB)

API do **Software Incident Management System**.

## Stack
- Node 18+, Express 5
- MongoDB Atlas + Mongoose 8
- Dotenv, CORS

## Setup
```bash
git clone <repo>
cd backend
npm i
cp .env.example .env
# edita .env e coloca a tua connection string do Atlas
npm run dev


## Modelo dos Dados

{
  "_id": "ObjectId",
  "title": "Erro 500 no /login",
  "description": "logs no pod auth-2",
  "category": "Infra|Aplicacao|Seguranca|Rede",
  "severity": "Low|Medium|High|Critical",
  "status": "new|ack|in_progress|resolved|closed",
  "assignee": "ObjectId|null",
  "createdBy": "ObjectId",
  "tags": ["auth","prod"],
  "timeline": [{ "at": "Date", "by": "ObjectId", "action": "status_change", "note": "ack" }],
  "sla": { "targetHours": 24, "breached": false, "resolvedAt": "Date?" },
  "createdAt": "Date",
  "updatedAt": "Date"
}


# Criar
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Erro 500","category":"Aplicacao","severity":"High","createdBy":"650000000000000000000001"}'

# Listar (filtros: status, assignee, search; paginação: page, limit)
curl "http://localhost:3000/api/incidents?status=new&page=1&limit=20"

# Obter por ID
curl "http://localhost:3000/api/incidents/<id>"

# Atualizar estado
curl -X PATCH "http://localhost:3000/api/incidents/<id>/status" \
  -H "Content-Type: application/json" -d '{"status":"ack"}'


## Indice para perfomance

npm run sync-indexes
