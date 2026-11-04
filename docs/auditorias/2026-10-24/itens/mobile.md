# Itens — `petcard-mobile`

> Origem: [auditoria original](../originais/auditoria-petcard-mobile.md) (feita na `develop@614709f`).
> **Revalidado em 2026-10-28 contra `main@e0def80`: todos os itens continuam presentes.**
> Regra do repo: CI roda `test:cov`; **CI verde é o DoD**. Rodar também `npm run typecheck` e `npm run lint`.

Legenda: 🔴 precisa corrigir · 🟠 deveria corrigir · 🟡 bom ter · ⚪ menor

---

## 🔴 Precisa corrigir

### MOB-01 · Push continua chegando após logout
- **Status:** 🚀 na `main` (release de 2026-11-04), mobile#107; chega aos aparelhos no próximo build EAS · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#106
- **Depende de:** API-23 (`DELETE /devices/:token`) em produção.
- **Onde:** `src/contexts/AuthContext.tsx` (`logout`, ~linha 187; `clearSession`, ~49; logout forçado por 401, ~73 e ~87), `src/services/device.service.ts` (só `register`).
- **Correção:** `deviceService.unregister(token)` chamado **antes** de `clearSession()` (precisa do Bearer), com erro ignorado e timeout curto. No logout por 401 o token já não vale: a limpeza fica com a API (tokens `UNREGISTERED`/órfãos, ver API-23).
- **Aceite:** [x] teste: `logout` chama `unregister` e depois limpa a sessão, mesmo se `unregister` falhar.
- **Resolução:** commit `e2d443d`. `device.service` guarda o último token registrado; `unregisterCurrent()` manda `DELETE /devices/:token` (`encodeURIComponent`, timeout de 3 s, erro ignorado) e esquece o token. O `logout` chama antes do `clearSession()`, com o Bearer ainda salvo; falhando, o logout segue. O logout forçado por 401 não mudou (a API limpa o token quando o FCM o recusa). Testes: a ordem no `AuthContext` (o descadastro roda com o token de sessão ainda salvo), o logout com o descadastro falhando e o `device.service` (URL codificada, sem token não chama, falha engolida). Falta validar em aparelho.

### MOB-02 · Timeout de 10s vale também para upload de foto
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-mobile#97
- **Onde:** `src/services/api.ts:4` (`API_TIMEOUT_MS = 10000`), `src/services/upload.service.ts` (sem `timeout` próprio).
- **Correção:** `{ timeout: 60000 }` na chamada de upload. Opcional: redimensionar com `expo-image-manipulator` (limite da API: 5 MB, ver API-10).
- **Aceite:** [x] teste: o upload chama `api.post` com `timeout: 60000`.
- **Resolução:** `UPLOAD_TIMEOUT_MS` (60s) movido para `api.ts` e usado por foto e anexo. Teste `upload.service.test.ts`. Commit `4ac21fd`.

### MOB-03 · Build sem `EXPO_PUBLIC_API_URL` aponta para `localhost` em silêncio
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-mobile#97
- **Onde:** `src/services/api.ts:3,13`.
- **Correção:** falhar o build no `app.config.ts` quando o perfil EAS for `preview`/`production` e a variável faltar (igual já é feito para a chave do Maps), e `console.error` em runtime se `!__DEV__` e a URL for o fallback.
- **Aceite:** [x] teste do `app.config.ts` (ou script) cobrindo a falha; [x] `eas.json` conferido.
- **Resolução:** `app.config.ts` lança erro nos perfis `preview`/`production` sem `EXPO_PUBLIC_API_URL`; `console.error` em runtime fora do dev. Teste `app.config.test.ts`. `eas.json` conferido; a variável existe nos ambientes preview e production do EAS. Commit `16fa3fd`.

### MOB-14 · Pedir senha atual ao trocar e-mail e ao excluir conta (derivado do SH-03/API-04)
- **Status:** 🚀 em produção (mobile#105; APK gerado e testado em aparelho em 2026-11-03) · **Fase:** 3 · **Pacote:** P6 · **PR:** PetCardOrg/petcard-mobile#104
- **Onde:** `ProfileScreen` (edição e exclusão de conta), `tutor.service.ts`.
- **Correção:** campo "senha atual" ao mudar e-mail e na confirmação da exclusão; conta só-Google reautentica com Google (decisão D2).
- **Aceite:** [x] testes dos dois fluxos (exclusão; a troca de e-mail não se aplica, ver Resolução); [x] publicar junto com o API-04; [x] validar o Google em aparelho (APK testado pelo usuário, 2026-11-03).
- **Resolução:** commit `260569e` (e `f5f70a4`, shared `^0.24.1`). Depois das duas confirmações, o `ConfirmarExclusaoModal` pede a **senha atual** e, com o Google configurado, oferece **Confirmar com Google**: o app não sabe se a conta tem senha ou só Google, então oferece os dois e a API confere. `useGoogleIdToken` reabre o consentimento e devolve o `id_token` sem abrir sessão. `deleteCurrentTutor` manda o `DeleteTutorDto`. O interceptor do axios deslogava em todo 401 autenticado; o 401 da prova de identidade ficou de fora (`isFalhaDeReautenticacao`, pelas mensagens da API, que citam a "senha atual"), e o erro aparece no modal. **Troca de e-mail: não se aplica.** O app não tem edição de e-mail (o perfil só edita nome, telefone e foto); decidido com o usuário não criar essa edição agora. Por isso também não há o "entrar de novo depois de trocar o e-mail".

---

## 🟠 Deveria corrigir

### MOB-04 · `refreshUser` pode não salvar o usuário
- **Status:** 🚀 em produção · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `AuthContext.tsx` (`refreshUser`, `next = {...}` dentro de `setUser(prev => …)`, ~linha 214).
- **Correção:** `userRef` com o usuário atual; montar `merged` fora do updater, `setUser(merged)` e gravar `merged` no `SecureStore`.
- **Aceite:** [x] teste: após `refreshUser`, o `SecureStore` recebe `email_verified: true`.
- **Resolução:** `refreshUser` monta o usuário atualizado fora do updater do `setUser` e grava o mesmo objeto no `SecureStore`. Teste confere `email_verified: true` no que foi salvo. Commit `3aaf1ee`.

### MOB-05 · Notificação antiga reabre a tela após novo login
- **Status:** 🚀 em produção · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/hooks/usePetScanNotificationNavigation.ts:43` (`getLastNotificationResponseAsync`), `src/navigation/AppNavigator.tsx` (~95-97).
- **Correção:** guardar em variável de módulo o `response.notification.request.identifier` já tratado e ignorar repetição (ou `clearLastNotificationResponseAsync()` depois de tratar, se a versão do expo-notifications tiver).
- **Aceite:** [x] teste: montar o hook 2× com a mesma resposta navega 1×.
- **Resolução:** O identificador da resposta já tratada fica guardado no módulo, e a mesma notificação não navega de novo depois de um novo login. Commit `c70c937`.

### MOB-06 · Três telas de saúde quase idênticas (640 / 640 / 713 linhas)
- **Status:** 🚀 em produção · **Fase:** 5 · **Pacote:** P12 (**por último no mobile**) · **PR:** PetCardOrg/petcard-mobile#101
- **Onde:** `src/screens/HealthRecords/VaccineScreen.tsx`, `DewormingScreen.tsx`, `MedicationScreen.tsx`.
- **Correção:** componente genérico (lista + modal + exclusão) configurado por props; migrar **uma tela por PR/commit**, com `selecaoDePet.test.tsx` como rede.
- **Aceite:** [x] comportamento idêntico (testes existentes verdes, sem mudar assertivas); [x] -~800 linhas.
- **Resolução:** `TelaDeRegistroDeSaude` configurada por tela (campos, textos do i18n, card, service). Antes, `telasDeSaude.test.tsx` fixou as três telas com 31 testes (commit `801116f`); depois, uma tela por commit: vacina com o componente (`a0977c6`), vermífugo (`6a44dd0`) e medicação (`2041909`). As telas foram de 1993 para 1031 linhas (−962). As diferenças que já existiam ficaram: o rótulo do botão de exclusão e, na medicação, o selo, o modal a 90% e o detalhe em linha cheia. O "Concluída" fora do i18n virou o MOB-17.

### MOB-07 · Login Google e registro de push sem teste
- **Status:** 🚀 em produção · **Fase:** 5 · **Pacote:** P11 (**fazer antes do MOB-01**) · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/hooks/useGoogleAuth.ts`, `src/hooks/usePushNotifications.ts`.
- **Aceite:** [x] Google: sucesso chama `loginWithGoogle`; `id_token` ausente define erro; [x] Push: registra 1× e re-registra ao rotacionar token.
- **Resolução:** Testes de `useGoogleAuth` (token nos params ou na autenticação, sem token, API recusando, cancelamento) e de `usePushNotifications` (registra 1×, re-registra ao rotacionar, sem sessão, permissão negada). Commit `00eb65a`.

### MOB-08 · Mensagens fixas em português ignoram o i18n
- **Status:** 🚀 em produção · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#98
- **Onde:** `src/contexts/PetsContext.tsx` (~37-40), `src/hooks/useGoogleAuth.ts` (~57, 66, 74), datas em `src/screens/Home/PetScansScreen.tsx`.
- **Correção:** strings para `common.json` (pt-BR e en-US) + `t()`; `toLocaleDateString(undefined, …)` ou o idioma do i18n.
- **Resolução:** chaves `login.googleError`, `googleNoToken`, `googleFailed`, `home.loadError` e `permissionError` em pt-BR e en-US. O `PetsContext` guarda a chave e só traduz na exibição, para seguir a troca de idioma. `formatarInstante` recebe o idioma do i18n. Um teste por arquivo, em en-US, falhava antes. Commit `c011916`.

---

## 🟡 Bom ter / ⚪ menores

| ID | Item | Correção | Pacote | Status |
|----|------|----------|--------|--------|
| MOB-09 | `@expo/ngrok` sem uso em `dependencies` (`package.json:23`) | remover ou mover para dev | P11 | ✅ mobile#98 (commit `e1ed64d`: movido para `devDependencies`, porque o `expo start --tunnel` usa; no lock, só as marcações `dev`/`peer`) |
| MOB-10 | `login`/`register` ignoram o `auth.service`; 3 cópias do bloco de sessão | `authService.login/register` + helper `startSession(fn)` | P12 | ✅ mobile#99 (commit `bddd99e`: `authService.login/register`; o `startSession` reúne loading, erro e gravação da sessão do login, do Google e do cadastro) |
| MOB-11 | Telas grandes (`AppointmentsScreen` ~935 linhas) | dividir por responsabilidade, se sobrar tempo | P12 | ✅ mobile#100 (commit `8d36b25`: 16 testes fixam a tela antes; commit `725172b`: `AppointmentCard`, `CalendarBanner` + `useGoogleCalendar`, `AppointmentFormModal` e `horarioDoAgendamento`; a tela foi de 971 para 235 linhas, e os testes passam iguais) |
| MOB-12 | Blocos `catch {}` que escondem erro | listar com `grep -rn "catch {}" src` e tratar ou comentar o porquê | P11 | ✅ mobile#98 (commit `800994d`: nenhum `catch {}` literal; dos 9 sem tratamento, 8 já explicavam o motivo e o do idioma passou a explicar. A falha escondida no cadastro virou o MOB-16) |
| MOB-13 | Agendamento aceita data no passado | validação no formulário (e conferir no DTO do shared/API) | P11 | ✅ mobile#98 (commit `4bd63ac`: `horarioNoPassado`, por minuto; na edição só vale se data ou hora mudaram. O DTO é da API, não do shared, e não valida: virou o API-27) |

---

## Itens derivados

### MOB-15 · Ambiente `production` do EAS sem chave do Maps e client IDs do Google (derivado do MOB-03)
- **Status:** 🟦 em PR (mobile#108, a parte de código); configuração do EAS pendente, com o usuário · **Fase:** 5 · **Pacote:** P11 · **PR:** PetCardOrg/petcard-mobile#108
- **Onde:** variáveis de ambiente do projeto no EAS (expo.dev). Em 2026-10-28, `eas env:list --environment production` mostrava só `EXPO_PUBLIC_API_URL`; o `preview` tem também `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- **Problema:** um build `production` sai com o mapa em branco (o `app.config.ts` só avisa) e sem login Google.
- **Correção:** cadastrar as variáveis no ambiente production (não é código). Avaliar transformar o aviso do Maps em erro nos perfis de distribuição, como no MOB-03.
- **Revalidação em 2026-11-04:** o usuário cadastrou no production a chave do Maps e os client IDs iOS e web, e liberou o `NODE_AUTH_TOKEN` para o production (sem ele, o `npm ci` do builder não baixa o `@petcardorg/shared`). Faltava um client ID **Android** em qualquer lugar: nem o preview, nem o `.env` local tinham valor, então nenhum build Android teve o botão do Google (`isGoogleAuthConfigured` o esconde sem aviso). O usuário criou o client Android (pacote `com.petcardorg.mobile`, SHA-1 da keystore do EAS) no projeto `683304030553`. A conta Google do PetCard precisa da verificação em duas etapas para abrir o Google Cloud desde 9/10/2026.
- **Aceite:** [ ] variáveis presentes no `env:list` de production (falta `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, também no preview); [ ] build production abre o mapa e faz login Google em aparelho; [x] build de distribuição falha sem a chave do Maps ou o client ID da plataforma (mobile#108).
- **Resolução:** código `afe36e0` (branch `fix/aud-p11-variaveis-distribuicao`): nos perfis `preview` e `production`, o `app.config.ts` reprova o build e lista o que falta entre `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` e o client ID do Google da plataforma (`EAS_BUILD_PLATFORM`). Configuração: pendente.

### MOB-16 · Cadastro esconde do tutor a falha ao enviar foto ou telefone (derivado do MOB-12)
- **Status:** 🚀 em produção · **Fase:** 6 · **Pacote:** P13 · **PR:** PetCardOrg/petcard-mobile#102
- **Onde:** `src/contexts/AuthContext.tsx` (`register`, `catch` depois de `uploadService.uploadImage` / `tutorService.updateCurrentTutor`, ~linha 179).
- **Problema:** a conta é criada, mas se a foto ou o telefone falham o `catch` só segue em frente. O tutor escolheu uma foto e não fica sabendo que ela não foi salva.
- **Correção:** o `register` devolve se os extras falharam, e a tela mostra um aviso ("conta criada; complete foto/telefone no perfil") sem derrubar o cadastro.
- **Aceite:** [x] teste: upload lança → cadastro conclui e o aviso aparece.
- **Resolução:** o `register` do `AuthContext` devolve `{ extrasPendentes }`, e a `RegisterScreen` mostra "Conta criada. Não conseguimos salvar a foto ou o telefone agora. Você pode completar pelo Perfil." (pt-BR e en-US). Commit `fd8c240`.

### MOB-17 · Selo "Concluída" da medicação fora do i18n (derivado do MOB-06)
- **Status:** 🚀 em produção · **Fase:** 6 · **Pacote:** P13 · **PR:** PetCardOrg/petcard-mobile#102
- **Onde:** `src/screens/HealthRecords/MedicationScreen.tsx` (`selo` da configuração).
- **Problema:** "Em andamento" vem do i18n (`healthRecords.medication.ongoing`), mas "Concluída" é texto fixo: em inglês, o selo sai em português.
- **Correção:** chave `healthRecords.medication.finished` em pt-BR e en-US.
- **Aceite:** [x] teste: com o idioma em en-US, a medicação encerrada mostra o texto em inglês.
- **Resolução:** chave `healthRecords.medication.finished` ("Concluída" / "Finished"). Commit `7c189dd`.
---

## Não verificado pela auditoria
- Lado da API (tokens no logout → API-23; limite de upload → 5 MB).
- `npm audit`; comportamento em aparelho real (push, Google, mapas) → validar no roteiro de QA (`docs/qa/`) ao fechar a Fase 5.
- `ClinicSearchScreen`, `PetDetailsScreen`, `DigitalWalletScreen`, `ProfileScreen`, `PetRegistrationScreen` (lidos em parte).
- **Atenção:** existe um `git stash` local em uma máquina ("bump versoes expo", da branch `feat/calendar-tela-de-sucesso`). Não é deste trabalho; não aplicar sem falar com o dono.
