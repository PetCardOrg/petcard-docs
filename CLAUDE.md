# petcard-docs — Contexto para Claude Code

> **Plano da M7 (cross-repo, board centralizado) vive na raiz: `../CLAUDE.md`.** Aqui só as convenções do docs.

## O que é

Documentação **canônica** e board centralizado da entrega do TCC. **Fonte-única** dos artefatos acadêmicos e técnicos — editar aqui, não em cópias locais.

- **`docs/`** — `tap.md`, `das.md`, `auditorias/`, `qa/` (roteiro dos 16 UCs), `api/` (OpenAPI + collection Postman da PC-098), `README.md` (índice).
- **`architecture/adr/`** — ADRs numerados (`001-multirepo-strategy`, `002-m4-integracoes-externas`, `003-m5-interface-veterinario`, `004-modo-offline-rf15`, `005-verificacao-crmv-e-acesso-clinico`, `006-cobertura-de-confianca`). Próximo número = 007+.
- **`.github/`** — ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE, CONTRIBUTING. É onde vive o **board da M7** (issues PC-094…PC-108).

## Convenções

- ⚠️ **Sem `package.json`, sem lint, sem CI, sem hooks.** Nada roda nos PRs deste repo — a revisão é humana. Cuidar da formatação Markdown na mão.
- **Docs em pt-BR.** Tabelas de índice em `docs/README.md` — ao adicionar artefato, registrar no índice.
- **ADRs:** um arquivo por decisão, numeração sequencial; registrar decisões arquiteturais relevantes **antes de mergear** o código que as implementa. A análise do **api#116** (comunicação criptografada) vira um ADR aqui (alimenta a PC-107).
- **Auditorias:** fechamento de item com checkbox `- [ ]` → `- [x]` + nota de resolução (precedente: P3 da auditoria delta).
- Git flow, commits e regras cross-repo: ver `../CLAUDE.md`. PR mira `develop`. **Merge em `develop` não fecha issue** — fechar manualmente com comentário.

## M7 nesta repo

Concentra a maior parte da entrega (Fases 3 e 4): PC-094 (evidências UCs), PC-096 (READMEs), PC-099 (diagramas DAS), PC-100–104 (capítulos + slides), PC-103 (ABNT), PC-107 (ADRs), **PC-108 (release v1.0.0 — por último)**. PC-098 (Postman) já concluída. Ordem e fases completas em `../CLAUDE.md`.
