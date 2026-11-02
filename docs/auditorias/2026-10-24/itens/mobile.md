# Itens — `petcard-mobile`

> Origem: [auditoria original](../originais/auditoria-petcard-mobile.md) (feita na `develop@614709f`).
> **Revalidado em 2026-10-28 contra `main@e0def80`: todos os itens continuam presentes.**
> Regra do repo: CI roda `test:cov`; **CI verde é o DoD**. Rodar também `npm run typecheck` e `npm run lint`.

Legenda: 🔴 precisa corrigir · 🟠 deveria corrigir · 🟡 bom ter · ⚪ menor

---

## 🔴 Precisa corrigir

### MOB-01 · Push continua chegando após logout
- **Status:** ⬜ pendente · **Fase:** 5 · **Pacote:** P11 · **PR:** —
- **Depende de:** API-23 (`DELETE /devices/:token`) em produção.
- **Onde:** `src/contexts/AuthContext.tsx` (`logout`, ~linha 187; `clearSession`, ~49; logout forçado por 401, ~73 e ~87), `src/services/device.service.ts` (só `register`).
- **Correção:** `deviceService.unregister(token)` chamado **antes** de `clearSession()` (precisa do Bearer), com erro ignorado e timeout curto. No logout por 401 o token já não vale: a limpeza fica com a API (tokens `UNREGISTERED`/órfãos, ver API-23).
- **Aceite:** [ ] teste: `logout` chama `unregister` e depois limpa a sessão, mesmo se `unregister` falhar.
- **Resolução:** —

### MOB-02 · Timeout de 10s vale também para upload de foto
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-mobile#97
- **Onde:** `src/services/api.ts:4` (`API_TIMEOUT_MS = 10000`), `src/services/upload.service.ts` (sem `timeout` próprio).
- **Correção:** `{ timeout: 60000 }` na chamada de upload. Opcional: redimensionar com `expo-image-manipulator` (limite da API: 5 MB, ver API-10).
- **Aceite:** [x] teste: o upload chama `api.post` com `timeout: 60000`.
- **Resolução:** `UPLOAD_TIMEOUT_MS` (60s) movido para `api.ts` e usado por foto e anexo. Teste `upload.service.test.ts`. Commit `4ac21fd`.

### MOB-03 · Build sem `EXPO_PUBLIC_API_URL` aponta para `localhost` em silêncio
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-mobile#97
- **Onde:** `src/services/api.ts:3,13`.
- **Correção:** falhar o build no `app.config.ts` quando o perfil EAS for `preview`/`production` e a variável faltar (igual já é feito para a chave do Maps), e `console.error` em runtime se `!__DEV__` e a URL for o fallback.
- **Aceite:** [x] teste do `app.config.ts` (ou script) cobrindo a falha; [x] `eas.json` conferido.
- **Resolução:** `app.config.ts` lança erro nos perfis `preview`/`production` sem `EXPO_PUBLIC_API_URL`; `console.error` em runtime fora do dev. Teste `app.config.test.ts`. `eas.json` conferido; a variável existe nos ambientes preview e production do EAS. Commit `16fa3fd`.

### MOB-14 · Pedir senha atual ao trocar e-mail e ao excluir conta (derivado do SH-03/API-04)
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P6 · **PR:** —
- **Onde:** `ProfileScreen` (edição e exclusão de conta), `tutor.service.ts`.
- **Correção:** campo "senha atual" ao mudar e-mail e na confirmação da exclusão; conta só-Google reautentica com Google (decisão D2).
- **Aceite:** [ ] testes dos dois fluxos; [ ] publicar junto com o API-04.
- **Resolução:** —

---

## 🟠 Deveria corrigir

### MOB-04 · `refreshUser` pode não salvar o usuário
- **Status:** ✅ em develop · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `AuthContext.tsx` (`refreshUser`, `next = {...}` dentro de `setUser(prev => …)`, ~linha 214).
- **Correção:** `userRef` com o usuário atual; montar `merged` fora do updater, `setUser(merged)` e gravar `merged` no `SecureStore`.
- **Aceite:** [x] teste: após `refreshUser`, o `SecureStore` recebe `email_verified: true`.
- **Resolução:** `refreshUser` monta o usuário atualizado fora do updater do `setUser` e grava o mesmo objeto no `SecureStore`. Teste confere `email_verified: true` no que foi salvo. Commit `3aaf1ee`.

### MOB-05 · Notificação antiga reabre a tela após novo login
- **Status:** ✅ em develop · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/hooks/usePetScanNotificationNavigation.ts:43` (`getLastNotificationResponseAsync`), `src/navigation/AppNavigator.tsx` (~95-97).
- **Correção:** guardar em variável de módulo o `response.notification.request.identifier` já tratado e ignorar repetição (ou `clearLastNotificationResponseAsync()` depois de tratar, se a versão do expo-notifications tiver).
- **Aceite:** [x] teste: montar o hook 2× com a mesma resposta navega 1×.
- **Resolução:** O identificador da resposta já tratada fica guardado no módulo, e a mesma notificação não navega de novo depois de um novo login. Commit `c70c937`.

### MOB-06 · Três telas de saúde quase idênticas (640 / 640 / 713 linhas)
- **Status:** ⬜ pendente · **Fase:** 5 · **Pacote:** P12 (**por último no mobile**) · **PR:** —
- **Onde:** `src/screens/HealthRecords/VaccineScreen.tsx`, `DewormingScreen.tsx`, `MedicationScreen.tsx`.
- **Correção:** componente genérico (lista + modal + exclusão) configurado por props; migrar **uma tela por PR/commit**, com `selecaoDePet.test.tsx` como rede.
- **Aceite:** [ ] comportamento idêntico (testes existentes verdes, sem mudar assertivas); [ ] -~800 linhas.
- **Resolução:** —

### MOB-07 · Login Google e registro de push sem teste
- **Status:** ✅ em develop · **Fase:** 5 · **Pacote:** P11 (**fazer antes do MOB-01**) · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/hooks/useGoogleAuth.ts`, `src/hooks/usePushNotifications.ts`.
- **Aceite:** [x] Google: sucesso chama `loginWithGoogle`; `id_token` ausente define erro; [x] Push: registra 1× e re-registra ao rotacionar token.
- **Resolução:** Testes de `useGoogleAuth` (token nos params ou na autenticação, sem token, API recusando, cancelamento) e de `usePushNotifications` (registra 1×, re-registra ao rotacionar, sem sessão, permissão negada). Commit `00eb65a`.

### MOB-08 · Mensagens fixas em português ignoram o i18n
- **Status:** ✅ em develop · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/contexts/PetsContext.tsx` (~37-40), `src/hooks/useGoogleAuth.ts` (~57, 66, 74), datas em `src/screens/Home/PetScansScreen.tsx`.
- **Correção:** strings para `common.json` (pt-BR e en-US) + `t()`; `toLocaleDateString(undefined, …)` ou o idioma do i18n.
- **Resolução:** chaves `login.googleError`, `googleNoToken`, `googleFailed`, `home.loadError` e `permissionError` em pt-BR e en-US. O `PetsContext` guarda a chave e só traduz na exibição, para seguir a troca de idioma. `formatarInstante` recebe o idioma do i18n. Um teste por arquivo, em en-US, falhava antes. Commit `c011916`.

---

## 🟡 Bom ter / ⚪ menores

| ID | Item | Correção | Pacote | Status |
|----|------|----------|--------|--------|
| MOB-09 | `@expo/ngrok` sem uso em `dependencies` (`package.json:23`) | remover ou mover para dev | P11 | ✅ mobile#98 (commit `e1ed64d`: movido para `devDependencies`, porque o `expo start --tunnel` usa; no lock, só as marcações `dev`/`peer`) |
| MOB-10 | `login`/`register` ignoram o `auth.service`; 3 cópias do bloco de sessão | `authService.login/register` + helper `startSession(fn)` | P12 | ✅ mobile#99 (commit `bddd99e`: `authService.login/register`; o `startSession` reúne loading, erro e gravação da sessão do login, do Google e do cadastro) |
| MOB-11 | Telas grandes (`AppointmentsScreen` ~935 linhas) | dividir por responsabilidade, se sobrar tempo | P12 | 🟦 mobile#100 (commit `8d36b25`: 16 testes fixam a tela antes; commit `725172b`: `AppointmentCard`, `CalendarBanner` + `useGoogleCalendar`, `AppointmentFormModal` e `horarioDoAgendamento`; a tela foi de 971 para 235 linhas, e os testes passam iguais) |
| MOB-12 | Blocos `catch {}` que escondem erro | listar com `grep -rn "catch {}" src` e tratar ou comentar o porquê | P11 | ✅ mobile#98 (commit `800994d`: nenhum `catch {}` literal; dos 9 sem tratamento, 8 já explicavam o motivo e o do idioma passou a explicar. A falha escondida no cadastro virou o MOB-16) |
| MOB-13 | Agendamento aceita data no passado | validação no formulário (e conferir no DTO do shared/API) | P11 | ✅ mobile#98 (commit `4bd63ac`: `horarioNoPassado`, por minuto; na edição só vale se data ou hora mudaram. O DTO é da API, não do shared, e não valida: virou o API-27) |

---

## Itens derivados

### MOB-15 · Ambiente `production` do EAS sem chave do Maps e client IDs do Google (derivado do MOB-03)
- **Status:** ⬜ pendente · **Fase:** 5 · **Pacote:** P11 · **PR:** —
- **Onde:** variáveis de ambiente do projeto no EAS (expo.dev). Em 2026-10-28, `eas env:list --environment production` mostrava só `EXPO_PUBLIC_API_URL`; o `preview` tem também `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- **Problema:** um build `production` sai com o mapa em branco (o `app.config.ts` só avisa) e sem login Google.
- **Correção:** cadastrar as variáveis no ambiente production (não é código). Avaliar transformar o aviso do Maps em erro nos perfis de distribuição, como no MOB-03.
- **Aceite:** [ ] variáveis presentes no `env:list` de production; [ ] build production abre o mapa e faz login Google em aparelho.
- **Resolução:** —

### MOB-16 · Cadastro esconde do tutor a falha ao enviar foto ou telefone (derivado do MOB-12)
- **Status:** ⬜ pendente · **Fase:** 6 · **Pacote:** P13 · **PR:** —
- **Onde:** `src/contexts/AuthContext.tsx` (`register`, `catch` depois de `uploadService.uploadImage` / `tutorService.updateCurrentTutor`, ~linha 179).
- **Problema:** a conta é criada, mas se a foto ou o telefone falham o `catch` só segue em frente. O tutor escolheu uma foto e não fica sabendo que ela não foi salva.
- **Correção:** o `register` devolve se os extras falharam, e a tela mostra um aviso ("conta criada; complete foto/telefone no perfil") sem derrubar o cadastro.
- **Aceite:** [ ] teste: upload lança → cadastro conclui e o aviso aparece.
- **Resolução:** —
---

## Não verificado pela auditoria
- Lado da API (tokens no logout → API-23; limite de upload → 5 MB).
- `npm audit`; comportamento em aparelho real (push, Google, mapas) → validar no roteiro de QA (`docs/qa/`) ao fechar a Fase 5.
- `ClinicSearchScreen`, `PetDetailsScreen`, `DigitalWalletScreen`, `ProfileScreen`, `PetRegistrationScreen` (lidos em parte).
- **Atenção:** existe um `git stash` local em uma máquina ("bump versoes expo", da branch `feat/calendar-tela-de-sucesso`). Não é deste trabalho; não aplicar sem falar com o dono.
