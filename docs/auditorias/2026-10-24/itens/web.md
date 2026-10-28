# Itens — `petcard-web`

> Origem: [auditoria original](../originais/auditoria-petcard-web.md) (feita na `develop@8359bb0`).
> **Revalidado em 2026-10-28 contra `main@df20d98`: todos os itens continuam presentes.** `VetPetProfilePage.tsx` agora tem 1104 linhas, então as linhas citadas podem ter deslocado: localizar pelo nome da função.
> Regra do repo: **CI verde é o DoD**; `npm run build` (`tsc -b && vite build`) precisa passar.

Legenda: 🔴 deve corrigir · 🟠 convém corrigir · 🟡 opcional

O **WEB-10 (testes) não é um item separado**: cada item 🔴 abaixo já inclui o seu teste no aceite.

---

## 🔴 Deve corrigir

### WEB-01 · Cold start desloga o veterinário
- **Status:** ⬜ pendente · **Fase:** 1 · **Pacote:** P1 · **PR:** —
- **Onde:** `src/contexts/AuthContext.tsx:37-38` (`.catch(() => localStorage.removeItem(TOKEN_KEY))`), `src/services/api.ts:4` (`API_TIMEOUT_MS = 10000`).
- **Problema:** qualquer erro na validação do perfil (timeout, 500) apaga o token; o cold start do Render (~13s) é maior que o timeout.
- **Correção:** apagar o token **só em 401**. Rede/5xx/timeout mantêm o token e mostram estado "reconectando/tentar de novo". Timeout da validação inicial ~30s (parâmetro `timeoutMs` do `apiFetch` já existe).
- **Aceite:** [ ] teste: erro de rede mantém token; [ ] teste: 401 limpa token; [ ] teste: 500 mantém token.
- **Resolução:** —

### WEB-02 · "Achei o pet" diz que avisou o tutor mesmo quando falhou
- **Status:** ⬜ pendente · **Fase:** 1 · **Pacote:** P1 · **PR:** —
- **Onde:** `src/pages/LostPet/LostPetPage.tsx:124-130` (`await registrarLeitura(...)` com erro engolido, depois `setLocalizacao(coordenadas ? "enviada" : ...)`), tipo `EstadoLocalizacao` na linha 28.
- **Correção:** `registrarLeitura` devolve sucesso/falha; novo estado `"falhou"` com botão "tentar de novo" (timeout maior por causa do cold start). Textos no i18n.
- **Aceite:** [ ] teste: falha da chamada → não mostra "avisamos o tutor"; [ ] teste: retry com sucesso → "enviada".
- **Resolução:** —

### WEB-03 · Botão Voltar prende o vet na carteira
- **Status:** ⬜ pendente · **Fase:** 1 · **Pacote:** P1 · **PR:** —
- **Onde:** `src/pages/PublicCard/PublicCardPage.tsx:193` (state `acessoVet: true`), `:220` (`lerRedirecionamentoVet(location.state).acessoVet`) e a navegação para `/vet/pets/:id`.
- **Correção:** `navigate(..., { replace: true })` quando entra por `acessoVet`, ou limpar o state antes (`navigate(location.pathname, { replace: true, state: null })`).
- **Aceite:** [ ] teste com `MemoryRouter`: QR → login → prontuário → Voltar não volta ao prontuário.
- **Resolução:** —

### WEB-04 · Erro ao excluir registro nunca aparece
- **Status:** ⬜ pendente · **Fase:** 4 · **Pacote:** P9 · **PR:** —
- **Onde:** `VetPetProfilePage.tsx`, `handleDelete` e `handleDeleteNote` (gravam em `recordError`, que só é exibido dentro do modal).
- **Correção:** estado `deleteError` com aviso visível na aba (fora do modal), limpo ao trocar de aba ou numa nova ação.
- **Aceite:** [ ] teste: delete com 403/500 mostra a mensagem e o item continua na lista.
- **Resolução:** —

### WEB-05 · Não dá para limpar campo opcional ao editar
- **Status:** ⬜ pendente · **Fase:** 4 · **Pacote:** P9 · **PR:** —
- **Depende de:** API-24 (API grava `null`).
- **Onde:** `VetPetProfilePage.tsx` `toDto` e o PATCH da nota clínica.
- **Correção:** na **edição**, campo opcional esvaziado → `null` no corpo. Na **criação**, continua omitido.
- **Aceite:** [ ] teste: editar e apagar `next_dose_at` envia `null`; [ ] teste manual contra a API local confirma que o dado some após `load()`.
- **Resolução:** —

### WEB-14 · Pedir senha atual ao trocar e-mail do vet (derivado do SH-03/API-04)
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P6 · **PR:** —
- **Onde:** `VetProfilePage.tsx` (formulário de perfil).
- **Correção:** ao alterar o e-mail, mostrar o campo "senha atual" e enviar `senha_atual`. Tratar 401 com mensagem clara.
- **Aceite:** [ ] teste do formulário; [ ] publicar junto com o API-04.
- **Resolução:** —

---

## 🟠 Convém corrigir

### WEB-06 · "Hoje" errado à noite (UTC × local)
- **Status:** ⬜ pendente · **Fase:** 4 · **Pacote:** P9 · **PR:** —
- **Onde:** `src/pages/VetPetProfile/healthRecordValidation.ts:29`, `:48`, `:100` (`toISOString().split("T")[0]`); testes `healthRecordValidation.test.ts:14-15` usam o mesmo padrão.
- **Correção:** `hojeLocal()` com `toLocaleDateString("sv-SE")` (ou reaproveitar o `diaLocal` existente) num `utils/datas.ts`; usar no formulário e na validação.
- **Aceite:** [ ] teste com `vi.setSystemTime` às 23h em `America/Sao_Paulo` (o `vitest.config.ts` já fixa `TZ`).
- **Resolução:** —

### WEB-07 · Respostas atrasadas sobrescrevem as novas
- **Status:** ⬜ pendente · **Fase:** 4 · **Pacote:** P9 · **PR:** —
- **Onde:** `VetDashboardPage.tsx` (efeitos de `[page]` e `[search]`), `VetPetProfilePage.tsx` (`load`).
- **Correção:** um único efeito `[page, search]` com `AbortController` (ou a trava `cancelado` do `LostPetPage`); `apiFetch` aceitar `signal`.
- **Aceite:** [ ] teste: resposta de "a" chegando depois da de "ab" é descartada; [ ] primeira carga faz 1 chamada.
- **Resolução:** —

### WEB-08 · Parâmetros de URL sem `encodeURIComponent`
- **Status:** ⬜ pendente · **Fase:** 1 · **Pacote:** P1 · **PR:** —
- **Onde:** `src/services/card.service.ts`, `coleira.service.ts`, `pet-profile.service.ts` (só `crmv.service.ts:68` codifica).
- **Correção:** `encodeURIComponent` em cada segmento dinâmico (helper `path\`/pets/${id}\`` ou na assinatura dos services).
- **Aceite:** [ ] teste: id `..%2Fveterinarios%2Fme` gera URL com o segmento codificado.
- **Resolução:** —

### WEB-09 · `VetPetProfilePage` com 1104 linhas e blocos repetidos
- **Status:** ⬜ pendente · **Fase:** 4 · **Pacote:** P10 (**depois do P9**) · **PR:** —
- **Correção:** `toDto` também na criação; extrair `RecordCard` para as 3 abas. Refactor sem mudar comportamento, coberto pelos testes do P9.
- **Resolução:** —

---

## 🟡 Opcional

| ID | Item | Correção | Pacote | Status |
|----|------|----------|--------|--------|
| WEB-11 | Duplicação: `SPECIES_COLORS` (2×), `formatDate` (3×), PATCH `/veterinarios/me` (`updateVeterinario` × `corrigirMeuCrmv`) | `src/utils/` + uma função de PATCH | P10 | ⬜ |
| WEB-12 | Provável código morto `normalizePublicCardLocation` (`src/main.tsx:34-48`); não há `vercel.json` | **Antes de apagar:** confirmar com o time se existe QR impresso com caminho sem `#` (D4) | P10 | ⬜ |
| WEB-13 | Trocar idioma refaz as 5 chamadas do perfil (`load` depende de `t`) | tirar `t` das dependências | P9 | ⬜ |

---

## Não verificado pela auditoria
- `VetProfilePage.tsx`, `VetRegisterPage.tsx`, `HealthRecordModal.tsx`, CSS, traduções (ler ao mexer).
- Execução real contra a API; rate limit de `/coleira/:token/leitura` (relevante para o WEB-02, ver API-01).
