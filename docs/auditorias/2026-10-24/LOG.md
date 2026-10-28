# Log de sessões — Auditoria 2026-10

Entradas mais recentes **no topo**. Toda sessão termina com uma entrada aqui. A próxima sessão começa lendo a primeira entrada.

**Modelo:**

```markdown
## AAAA-MM-DD — <quem> — <pacote(s)>
- **Feito:** …
- **PRs:** PetCardOrg/petcard-<repo>#<n> (status)
- **Decisões:** … (copiar também para a tabela do PLANO)
- **Descobertas / itens derivados:** …
- **Bloqueios:** …
- **Próximo passo:** <ação exata, com pacote, repo e item>
```

---

## 2026-10-28 — alvaro-unifor (com Claude) — Fase 0 (preparação)
- **Feito:**
  - `main` e `develop` locais dos 5 repos sincronizados com o remoto (fast-forward; nenhum commit local perdido). Não existe branch `production`: `main` é a produção.
  - Os 4 relatórios (`originais/`) foram **revalidados contra a `main` atual**: todos os achados continuam presentes (API `9483562`, shared `b4bb3c2` v0.23.0, web `df20d98`, mobile `e0def80`).
  - Criada esta estrutura: especificação por item (`itens/`), plano em 14 pacotes (`PLANO.md`) e protocolo (`COMO-CONTINUAR.md`).
- **Descobertas / itens derivados:**
  - API-23: a API não tem rota para descadastrar token de push (bloqueia MOB-01).
  - API-24: confirmar que o PATCH clínico grava `null` (bloqueia WEB-05).
  - API-20: a API tem **cópia própria** do validador de senha (`src/common/crypto/password.validators.ts`), então o SH-02 sozinho não corrige a API.
  - WEB-14 / MOB-14: as telas precisam pedir `senha_atual` quando o API-04 entrar.
  - O lint com `--fix` no CI (SH-01) também aparece no `package.json` da API.
- **Bloqueios:** decisões D1–D5 em aberto (ver PLANO).
- **Próximo passo:** abrir o **P1**, começando por `petcard-api` → **API-01** (`trust proxy`), branch `fix/aud-p1-trust-proxy`.
