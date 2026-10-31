# Itens — `petcard-web`

> Origem: [auditoria original](../originais/auditoria-petcard-web.md) (feita na `develop@8359bb0`).
> **Revalidado em 2026-10-28 contra `main@df20d98`: todos os itens continuam presentes.** `VetPetProfilePage.tsx` agora tem 1104 linhas, então as linhas citadas podem ter deslocado: localizar pelo nome da função.
> Regra do repo: **CI verde é o DoD**; `npm run build` (`tsc -b && vite build`) precisa passar.

Legenda: 🔴 deve corrigir · 🟠 convém corrigir · 🟡 opcional

O **WEB-10 (testes) não é um item separado**: cada item 🔴 abaixo já inclui o seu teste no aceite.

---

## 🔴 Deve corrigir

### WEB-01 · Cold start desloga o veterinário
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-web#68
- **Onde:** `src/contexts/AuthContext.tsx:37-38` (`.catch(() => localStorage.removeItem(TOKEN_KEY))`), `src/services/api.ts:4` (`API_TIMEOUT_MS = 10000`).
- **Problema:** qualquer erro na validação do perfil (timeout, 500) apaga o token; o cold start do Render (~13s) é maior que o timeout.
- **Correção:** apagar o token **só em 401**. Rede/5xx/timeout mantêm o token e mostram estado "reconectando/tentar de novo". Timeout da validação inicial ~30s (parâmetro `timeoutMs` do `apiFetch` já existe).
- **Aceite:** [x] teste: erro de rede mantém token; [x] teste: 401 limpa token; [x] teste: 500 mantém token.
- **Resolução:** Só 401 descarta o token; timeout/rede/5xx deixam `semConexao` e o `ProtectedRoute` mostra "Tentar de novo". Validação inicial com `API_COLD_START_TIMEOUT_MS` (30s). Commit `ff78371`.

### WEB-02 · "Achei o pet" diz que avisou o tutor mesmo quando falhou
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-web#68
- **Onde:** `src/pages/LostPet/LostPetPage.tsx:124-130` (`await registrarLeitura(...)` com erro engolido, depois `setLocalizacao(coordenadas ? "enviada" : ...)`), tipo `EstadoLocalizacao` na linha 28.
- **Correção:** `registrarLeitura` devolve sucesso/falha; novo estado `"falhou"` com botão "tentar de novo" (timeout maior por causa do cold start). Textos no i18n.
- **Aceite:** [x] teste: falha da chamada → não mostra "avisamos o tutor"; [x] teste: retry com sucesso → "enviada".
- **Resolução:** Estado `falhou` com botão "Tentar avisar de novo"; `registrarLeitura` com timeout de 30s. Commit `b5c3210`. Textos fixos que ainda afirmam o aviso viraram o WEB-15.

### WEB-03 · Botão Voltar prende o vet na carteira
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-web#68
- **Onde:** `src/pages/PublicCard/PublicCardPage.tsx:193` (state `acessoVet: true`), `:220` (`lerRedirecionamentoVet(location.state).acessoVet`) e a navegação para `/vet/pets/:id`.
- **Correção:** `navigate(..., { replace: true })` quando entra por `acessoVet`, ou limpar o state antes (`navigate(location.pathname, { replace: true, state: null })`).
- **Aceite:** [x] teste com `MemoryRouter`: QR → login → prontuário → Voltar não volta ao prontuário.
- **Resolução:** Na volta do login (`acessoVet`), a ida ao prontuário usa `replace`. Teste com `MemoryRouter` real (`PublicCardPage.voltar.test.tsx`), confirmado falhando sem a correção. Commit `5b303ff`.

### WEB-04 · Erro ao excluir registro nunca aparece
- **Status:** 🟦 em PR · **Fase:** 4 · **Pacote:** P9 · **PR:** PetCardOrg/petcard-web#69
- **Onde:** `VetPetProfilePage.tsx`, `handleDelete` e `handleDeleteNote` (gravam em `recordError`, que só é exibido dentro do modal).
- **Correção:** estado `deleteError` com aviso visível na aba (fora do modal), limpo ao trocar de aba ou numa nova ação.
- **Aceite:** [x] teste: delete com 403/500 mostra a mensagem e o item continua na lista.
- **Resolução:** Estado `deleteError` exibido no topo da aba (`role="alert"`), limpo ao trocar de aba ou ao tentar apagar de novo. Vale para registro e nota clínica. Commit `7b50d13`.

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
- **Status:** 🟦 em PR · **Fase:** 4 · **Pacote:** P9 · **PR:** PetCardOrg/petcard-web#69
- **Onde:** `src/pages/VetPetProfile/healthRecordValidation.ts:29`, `:48`, `:100` (`toISOString().split("T")[0]`); testes `healthRecordValidation.test.ts:14-15` usam o mesmo padrão.
- **Correção:** `hojeLocal()` com `toLocaleDateString("sv-SE")` (ou reaproveitar o `diaLocal` existente) num `utils/datas.ts`; usar no formulário e na validação.
- **Aceite:** [x] teste com `vi.setSystemTime` às 23h em `America/Sao_Paulo` (o `vitest.config.ts` já fixa `TZ`).
- **Resolução:** `src/utils/datas.ts` (`hojeLocal`, `diaIsoLocal`) no `emptyForm`, no `isValidDate` e na regra de aplicação no futuro; os testes deixaram de usar `toISOString`. Commit `f6c0fd4`.

### WEB-07 · Respostas atrasadas sobrescrevem as novas
- **Status:** 🟦 em PR · **Fase:** 4 · **Pacote:** P9 · **PR:** PetCardOrg/petcard-web#69
- **Onde:** `VetDashboardPage.tsx` (efeitos de `[page]` e `[search]`), `VetPetProfilePage.tsx` (`load`).
- **Correção:** um único efeito `[page, search]` com `AbortController` (ou a trava `cancelado` do `LostPetPage`); `apiFetch` aceitar `signal`.
- **Aceite:** [x] teste: resposta de "a" chegando depois da de "ab" é descartada; [x] primeira carga faz 1 chamada.
- **Resolução:** Dashboard com um efeito só (`[termo, página]`, termo já com debounce) e trava pela última busca; a mesma trava no `load` do prontuário (troca de pet). Usada a trava, e não `AbortController`, então o `apiFetch` não mudou. Commit `0313cf9`.

### WEB-08 · Parâmetros de URL sem `encodeURIComponent`
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-web#68
- **Onde:** `src/services/card.service.ts`, `coleira.service.ts`, `pet-profile.service.ts` (só `crmv.service.ts:68` codifica).
- **Correção:** `encodeURIComponent` em cada segmento dinâmico (helper `path\`/pets/${id}\`` ou na assinatura dos services).
- **Aceite:** [x] teste: id `..%2Fveterinarios%2Fme` gera URL com o segmento codificado.
- **Resolução:** Template marcado `caminho` em `api.ts`, aplicado em todos os services com rota dinâmica (card, coleira, pet-profile, anexo, dashboard). Commit `71cf44b`.

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
| WEB-13 | Trocar idioma refaz as 5 chamadas do perfil (`load` depende de `t`) | tirar `t` das dependências | P9 | 🟦 web#69 (commit `7e9a293`: mensagem padrão do bloqueio traduzida só na exibição) |

---

## Itens derivados

### WEB-15 · Textos fixos da página do achador afirmam que o tutor já foi avisado (derivado do WEB-02)
- **Status:** 🟦 em PR · **Fase:** 4 · **Pacote:** P9 · **PR:** PetCardOrg/petcard-web#69
- **Onde:** `src/i18n/locales/*/common.json`: `lostPet.hero.lead` ("Ela já foi avisada de que {{name}} foi encontrado"), `lostPet.steps.three` e `lostPet.contact.noPhone` ("já foi notificado/avisado").
- **Problema:** aparecem antes do envio terminar e continuam na tela quando ele falha (estado `falhou` do WEB-02), contradizendo a mensagem de falha.
- **Correção:** textos neutros ("Ligue para a pessoa abaixo") ou condicionados ao estado do aviso.
- **Aceite:** [x] teste: com o envio falhando, nenhum texto da página diz que o tutor foi avisado.
- **Resolução:** Abertura, aviso de "sem telefone" e passo 3 reescritos de forma neutra (pt-BR e en-US); o estado real do aviso fica no bloco de localização. Teste com e sem telefone. Commit `d694151`.
### WEB-16 · Recusa por nome divergente do CRMV manda "corrigir o CRMV" (derivado do API-06)
- **Status:** 🟦 em PR · **Fase:** 4 · **Pacote:** P9 · **PR:** PetCardOrg/petcard-web#69
- **Onde:** `src/components/CrmvAviso/CrmvAviso.tsx` (`t("crmv.refused", { situacao })`) e o aviso pendente depois do cadastro (`VetRegisterPage` → dashboard).
- **Problema:** com o API-06, a API grava a situação "Nome do cadastro não confere com o titular do CRMV". A web a exibe dentro de "O registro não foi aceito (situação: …). Corrija o CRMV e tente de novo.", mas o que precisa mudar é o nome. No cadastro, o vet só vê o aviso genérico de pendente, sem o motivo.
- **Correção:** mensagem própria quando a situação for a de nome divergente, levando à edição do nome no perfil. Idealmente com um código estável no contrato (shared) em vez de comparar o texto.
- **Aceite:** [x] teste: situação de nome divergente mostra a mensagem própria; [x] o aviso pós-cadastro mostra o motivo.
- **Resolução:** `CrmvAviso` mostra "O nome do seu cadastro não confere…" com o link **Corrigir meu nome** (`/vet/profile`) e recebe a `situacao` que a tela já conhece; o dashboard repassa a do `GET /veterinarios/me/crmv` e, nas outras recusas, mostra a situação do conselho. A comparação é pelo texto copiado da API (`src/utils/crmvSituacao.ts`): o código estável virou o WEB-17. Commit `6edd361`.

### WEB-17 · Situação de nome divergente do CRMV comparada pelo texto (derivado do WEB-16)
- **Status:** ⬜ pendente · **Fase:** 6 · **Pacote:** P13 · **PR:** —
- **Onde:** `petcard-web/src/utils/crmvSituacao.ts` (cópia de `SITUACAO_NOME_DIVERGENTE` de `petcard-api/src/modules/veterinario/crmv/crmv-verification.service.ts`); o status do CRMV (`GET /veterinarios/me/crmv`, `POST …/verificar`) não tem DTO no shared, e a web declara o tipo `CrmvStatus` localmente.
- **Problema:** a web reconhece a recusa por nome divergente comparando o texto da situação. Se a API mudar a frase, o aviso próprio some sem erro e volta o "Corrija o CRMV".
- **Correção:** DTO do status do CRMV no shared com um campo estável (ex.: `motivo: 'NOME_DIVERGENTE' | …`), preenchido pela API; a web passa a usar o campo. Bump minor do shared, então depende da liberação do `develop → main`.
- **Aceite:** [ ] DTO no shared com teste; [ ] API preenche o campo; [ ] web usa o campo e apaga a cópia do texto.
- **Resolução:** —
---

## Não verificado pela auditoria
- `VetProfilePage.tsx`, `VetRegisterPage.tsx`, `HealthRecordModal.tsx`, CSS, traduções (ler ao mexer).
- Execução real contra a API; rate limit de `/coleira/:token/leitura` (relevante para o WEB-02, ver API-01).
