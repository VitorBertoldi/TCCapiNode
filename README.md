# DevOps - API CRUD com Node.js, Prisma e Azure

## 📌 Introdução
Este repositório contém o projeto de uma API RESTful desenvolvida com Node.js, Express e Prisma ORM, conectada a um banco de dados SQL Server no Azure. O objetivo é demonstrar práticas de DevOps, integrando versionamento Git com Azure DevOps, CI/CD, e deploy automatizado.

## 🚀 Getting Started

### ✅ Pré-requisitos
- Node.js 18+
- Conta no Azure
- Git
- Banco de dados SQL Server (hospedado no Azure)


📚 Documentação Swagger
Acesse:

bash
Copy
Edit
GET /swagger
🛠️ Build e Testes
Scripts:
bash
Copy
Edit
npm run dev      # Inicia o servidor
npm test         # Executa testes (caso aplicável)
🔁 Gitflow & Branches
main: Produção

develop: Desenvolvimento ativo

release: Versão de staging

🧪 Azure DevOps Pipeline
Pipeline com 3 estágios:

Build: Valida a aplicação

Test: Executa testes

Deploy: Simula deploy via App Service

Arquivo de pipeline:

Copy
Edit
azure-pipelines.yml

👥 Contribuintes
João Vitor Dadas de Oliveira
Vitor Bertoldi
Gabriel Fernandes




