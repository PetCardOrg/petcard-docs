# 🐾 PetCard — Documentação Central
 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
 
Repositório central de documentação, gestão de projeto e artefatos acadêmicos do ecossistema PetCard.
 
**Projeto de TCC** — Ciência da Computação (2026)
 
## Ecossistema PetCard
 
| Repositório | Descrição | Status |
|---|---|---|
| [petcard-api](https://github.com/PetCardOrg/petcard-api) | Backend NestJS | [![CI](https://github.com/PetCardOrg/petcard-api/actions/workflows/ci.yml/badge.svg)](https://github.com/PetCardOrg/petcard-api/actions) |
| [petcard-web](https://github.com/PetCardOrg/petcard-web) | Painel do Veterinário (React.js) | [![CI](https://github.com/PetCardOrg/petcard-web/actions/workflows/ci.yml/badge.svg)](https://github.com/PetCardOrg/petcard-web/actions) |
| [petcard-mobile](https://github.com/PetCardOrg/petcard-mobile) | App do Tutor (React Native / Expo) | [![CI](https://github.com/PetCardOrg/petcard-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/PetCardOrg/petcard-mobile/actions) |
| [petcard-shared](https://github.com/PetCardOrg/petcard-shared) | DTOs e tipos compartilhados | [![Publish](https://github.com/PetCardOrg/petcard-shared/actions/workflows/publish.yml/badge.svg)](https://github.com/PetCardOrg/petcard-shared/actions) |
| **petcard-docs** | ← Você está aqui | — |
 
## O que tem neste repositório
 
- **Gestão do Projeto** — GitHub Project Board centralizado com todas as issues do ecossistema
- **CONTRIBUTING.md** — Guia unificado de contribuição (branches, commits, PRs)
- **Architecture Decision Records (ADRs)** — Registro das decisões arquiteturais
- **Diagramas** — Diagramas de arquitetura, containers e deployment
- **Artefatos do TCC** — TAP, relatório, apresentação de defesa
- **Infraestrutura** — Terraform e scripts de deploy (quando aplicável)
 
## Links Rápidos
 
| Recurso | Link |
|---|---|
| Kanban Board | [PetCard — Kanban](https://github.com/orgs/PetCardOrg/projects/1) |
| Guia de Contribuição | [CONTRIBUTING.md](CONTRIBUTING.md) |
 
## Arquitetura
 
| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo + TypeScript |
| Web (Vet) | React.js 19 + Vite 8 + TypeScript |
| Backend | NestJS 11 + Node.js 20 LTS |
| Banco | PostgreSQL 16 + PostGIS 3.4 |
| Cache | Redis 7 (provisionado no compose, não consumido em código) |
| Fila | RabbitMQ 3 |
| Storage | AWS S3 |
| Auth | JWT próprio (HS256 + bcrypt) — Auth0 abandonado em M0 (ver ADR-003) |
| ORM | Prisma 6 |
| Push | Firebase Cloud Messaging |