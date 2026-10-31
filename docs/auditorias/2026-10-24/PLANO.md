# Plano de execução — Auditoria 2026-10

O trabalho está dividido em **6 fases** e **14 pacotes** (P1…P14). Um pacote é a menor unidade que vira PR: normalmente 1 PR por repo tocado, cada item num commit próprio.

**Por que esta ordem:**
1. **Primeiro o que quebra a demo e a produção** e não depende de nada (P1–P3): rate limit, cold start, tomada de conta, CRMV.
2. **Depois o `shared`**, porque contratos (DTOs) precisam ser publicados *antes* de API e clientes os usarem.
3. **Depois as mudanças cross-repo de contrato** (P6), com deploy coordenado de API + web + mobile.
4. **Refactors só depois das correções da mesma área**, porque o PR de correção traz os testes que protegem o refactor.
5. **Breaking changes de tipo (P14) só com a release v1.0.0 (PC-108).**

**Prazo de referência:** os pacotes **P1 e P2** devem estar em produção **antes da gravação do vídeo (PC-106)**.

---

## Mapa de dependências

```
P1 (api+web+mobile, independentes) ─┐
P2 (api: identidade/CRMV) ──────────┤
P3 (api: lembretes) ────────────────┤
                                    ▼
P4 (shared: testes+CI) ──► P5 (shared: contratos, publica 0.24.0)
                                    │
                                    ▼
          P6 (api+web+mobile: senha_atual, devices DELETE, null em PATCH)  ← deploy coordenado
           │            │                     │
           ▼            ▼                     ▼
    P7, P8 (api)   P9 ──► P10 (web)     P11 ──► P12 (mobile)
                                    │
                                    ▼
              P13 (desejáveis api + SH-06)   P14 (breaking, só na v1.0.0)
```

---

## Fases e pacotes

### Fase 1 — Críticos independentes
| Pacote | Repo(s) | Itens | Observação |
|--------|---------|-------|------------|
| **P1** Demo segura | api, web, mobile | API-01 · WEB-01, WEB-02, WEB-03, WEB-08 · MOB-02, MOB-03 | 3 PRs independentes, todos pequenos. **Começar por aqui.** |
| **P2** Identidade e CRMV | api | API-05, API-06, API-07 | API-07: conferir `CRMV_PROVIDER` no Render **antes** do merge. API-06 depende da decisão D3. |
| **P3** Lembretes confiáveis | api | API-03, API-02 (+API-15 nos arquivos de reminder) | D1 decidida: Render gratuito, então disparo externo. Fazer o API-03 primeiro. |

### Fase 2 — `petcard-shared`
| Pacote | Repo | Itens | Observação |
|--------|------|-------|------------|
| **P4** Rede de segurança | shared | SH-05 → SH-01 → SH-04 | Sem mudança em `src/`, então não precisa de bump. Aplicar a lição do SH-01 aos outros repos (ver nota no item). |
| **P5** Contratos | shared | SH-02, SH-03, SH-08 (`MaxLength`) | Bump **minor** → `0.24.0`, merge `develop` → `main`, confirmar o publish. |

### Fase 3 — Contratos cross-repo e API restante
| Pacote | Repo(s) | Itens | Observação |
|--------|---------|-------|------------|
| **P6** Reautenticação e contratos | api, web, mobile | API-20, API-04, API-23, API-24 · WEB-14 · MOB-14 | Atualizar `@petcardorg/shared` para `^0.24.0` nos 3. **Merge e deploy juntos** (API primeiro, clientes logo depois). D2 precisa estar decidida. |
| **P7** Robustez da API | api | API-08, API-10 | |
| **P8** Filas | api | API-11 → API-09 | Refactor primeiro (commit próprio), depois o backoff. |

### Fase 4 — `petcard-web`
| Pacote | Itens | Observação |
|--------|-------|------------|
| **P9** Correções | WEB-04, WEB-05 (exige API-24), WEB-06, WEB-07, WEB-13 | |
| **P10** Enxugar | WEB-09, WEB-11, WEB-12 | WEB-12 depende da D4. |

### Fase 5 — `petcard-mobile`
| Pacote | Itens | Observação |
|--------|-------|------------|
| **P11** Correções | MOB-07 (testes primeiro) → MOB-01 (exige API-23 em produção), MOB-04, MOB-05, MOB-08, MOB-09, MOB-12, MOB-13 | Validar push/Google em aparelho real no fim. |
| **P12** Enxugar | MOB-06 (uma tela por commit), MOB-10, MOB-11 | |

### Fase 6 — Desejáveis e breaking
| Pacote | Itens | Observação |
|--------|-------|------------|
| **P13** Desejáveis | API-12, API-13, API-14, API-16, API-17, API-18, API-19, API-21, API-22, API-25, API-26 · SH-06 | API-17 tem risco: testar o sync do calendário de ponta a ponta. |
| **P14** Breaking v1.0.0 | SH-07, SH-08 (`auth0_id`) | Só junto da PC-108. Bump **major**. |

### Fechamento
- Rodar o [roteiro de testes manuais](../../qa/) (16 UCs) depois de P6 e depois de P12.
- Escrever a **auditoria delta** (`docs/auditorias/AAAA-MM-DD-delta.md`), como já foi feito em 2026-07: resolvido, pendente e novo.

---

## Decisões pendentes (registrar a resposta aqui e no LOG)

| ID | Pergunta | Bloqueia | Recomendação | Decisão |
|----|----------|----------|--------------|---------|
| D1 | A produção do Render está no plano gratuito (dorme) ou pago (sempre ligado)? | API-02 | Supor gratuito: disparo externo por GitHub Actions `schedule` + execução no boot | **Gratuito (dorme)**: API-02 segue crítico. Decidido em 2026-10-28 pelo alvaro-unifor |
| D2 | Conta só-Google: como reautenticar para trocar e-mail ou excluir a conta? | API-04, MOB-14 | `id_token` do Google recente (o app já tem o fluxo) | **`id_token` do Google obtido na hora**: o app reabre o login Google e manda o token na própria requisição (nada é guardado); a API exige token recente e do mesmo `sub`. Os DTOs do tutor aceitam `senha_atual` **ou** `google_id_token`. Decidido em 2026-10-30 pelo alvaro-unifor |
| D3 | Comparação do nome do CRMV: exata normalizada ou tolerante? | API-06 | Primeiro e último nome iguais, sem acento nem caixa | **Primeiro + último nome**, sem acento nem caixa (nomes do meio ignorados). Decidido em 2026-10-28 pelo alvaro-unifor |
| D4 | Existe QR impresso com caminho sem `#` (`/card/xxx`)? | WEB-12 | Se ninguém souber, manter o código | — |
| D5 | Onde acompanhar o status: issues do GitHub ou Trello? | todos | Issues do GitHub no `petcard-docs` (ver README) | **Issues do GitHub** (sem Trello). Decidido em 2026-10-28 pelo alvaro-unifor |
