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

## 2026-10-28 — alvaro-unifor (com Claude) — P2
- **Feito:** API-05, API-06 e API-07 implementados (1 commit cada) e em PR.
  - API-05: vincular Google a conta de e-mail não verificado zera a senha e renova o `passwordChangedAt`.
  - API-06: `nomesConferem` (D3: primeiro + último nome) aplicado no `verify()`, que serve ao cadastro e à revalidação. Situação gravada: "Nome do cadastro não confere com o titular do CRMV".
  - API-07: boot falha em produção sem `CRMV_PROVIDER` ou com valor desconhecido; `stub` explícito sobe com aviso.
- **PRs:** PetCardOrg/petcard-api#181 (aberto, aguardando review)
- **Decisões:** D3 registrada no PLANO. `CRMV_PROVIDER` confirmado no Render pelo alvaro-unifor.
- **Descobertas / itens derivados:** WEB-16, a mensagem da web para nome divergente (P9). É o 3º aceite do API-06, que fica em aberto até lá.
- **Bloqueios:** nenhum. Antes do deploy, conferir que o valor no Render é exatamente `infosimples` ou `stub`.
- **Próximo passo:** depois do merge do api#181, marcar API-05/06/07 em `itens/api.md`, no painel e na #59 e fechá-la (o aceite web do API-06 segue no WEB-16). Em seguida, o **P3** (#60) no `petcard-api`: começar pelo **API-03** (lembrete perdido quando a publicação no RabbitMQ falha), depois API-02 (disparo externo + execução no boot; D1 = Render gratuito).

## 2026-10-28 — alvaro-unifor (com Claude) — P1 (fechamento)
- **Feito:** PetCardOrg/petcard-mobile#97 e PetCardOrg/petcard-docs#73 mergeados. MOB-02/03 ✅ em develop. **P1 completo em develop; issue #58 fechada.**
- **Pendente fora do código:** `develop → main` da API e da web antes da gravação (PC-106) e o teste do API-01 com dois aparelhos em produção; cadastrar as variáveis do MOB-15 no EAS antes de qualquer build production.
- **Decisões:** **D3** = primeiro + último nome, normalizados (alvaro-unifor). `CRMV_PROVIDER` **confirmado como definido** no Render de produção (alvaro-unifor), o que libera o merge do API-07.
- **Próximo passo:** abrir o **P2** (#59) no `petcard-api`, começando pelo **API-05**, branch `fix/aud-p2-identidade-crmv`; depois API-06 (D3 decidida) e API-07.

## 2026-10-28 — alvaro-unifor (com Claude) — P1
- **Feito:**
  - **API-01** ✅ em develop: `trust proxy` = 1 (`src/common/http/trust-proxy.ts`), teste de integração e nota no `CLAUDE.md`.
  - **WEB-01, WEB-02, WEB-03, WEB-08** ✅ em develop: sessão sobrevive ao cold start, aviso do achador com estado de falha, Voltar sem prender o vet, template `caminho` nos services.
  - **MOB-02, MOB-03** 🟦 em PR: upload de foto com 60s; build preview/production falha sem `EXPO_PUBLIC_API_URL` (variável conferida no EAS).
- **PRs:** PetCardOrg/petcard-api#180 (mergeado) · PetCardOrg/petcard-web#68 (mergeado) · PetCardOrg/petcard-mobile#97 (aberto, aguardando review)
- **Decisões:** nenhuma nova.
- **Descobertas / itens derivados:**
  - WEB-15: textos fixos da LostPetPage afirmam o aviso antes de ele sair (P9).
  - MOB-15: ambiente production do EAS sem a chave do Maps e os client IDs do Google (P11; é configuração, não código).
  - Lint do mobile no Windows: o checkout com `core.autocrlf=true` gera milhares de erros `␍` do prettier; não é regressão (o lint-staged normaliza no commit). Para ver os erros reais: `npx eslint --rule 'prettier/prettier: off' <arquivos>`.
- **Bloqueios:** nenhum. A validação do API-01 em produção depende do `develop → main` da API.
- **Próximo passo:** depois do merge do mobile#97, marcar MOB-02/03 como ✅ em `itens/mobile.md`, no painel e na issue #58, e **fechar a #58**. Em seguida, abrir o **P2** (#59) no `petcard-api`, começando pelo **API-05** (zerar senha ao vincular conta Google não verificada); o API-06 depende da decisão **D3**, a perguntar antes.

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
- **Decisões:** D1 = Render no plano gratuito (API-02 segue crítico). D5 = status nas issues do GitHub, sem Trello.
- **Bloqueios:** D2, D3 e D4 em aberto (ver PLANO). Nenhuma bloqueia o P1.
- **Próximo passo:** abrir o **P1**, começando por `petcard-api` → **API-01** (`trust proxy`), branch `fix/aud-p1-trust-proxy`.
