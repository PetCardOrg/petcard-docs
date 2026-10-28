# Auditoria do `petcard-mobile`

**Data:** 24/10/2026 · **Branch auditada:** `develop` (commit `614709f`) · **Tipo:** relatório de leitura, nenhum código foi alterado.

## O que este repositório faz

O `petcard-mobile` é o app do tutor (React Native + Expo + TypeScript). Cuida de login, pets, vacinas, vermífugos, medicação, agendamentos, mapa de clínicas, carteira digital com exportação em PDF e push quando o QR da coleira de um pet é lido. Ele conversa com a `petcard-api`.

**Carga assumida:** muitos tutores, cada um no próprio celular com um único login. A carga pesada fica na API, não no app.

## Resumo

| # | Grupo | Achado | Onde |
| --- | --- | --- | --- |
| 1 | Precisa corrigir | Push continua chegando após logout | `AuthContext.tsx`, `device.service.ts` |
| 2 | Precisa corrigir | Timeout de 10 s também vale para upload de foto | `api.ts`, `upload.service.ts` |
| 3 | Precisa corrigir | Build sem URL da API aponta para `localhost` em silêncio | `api.ts` |
| 4 | Deveria corrigir | `refreshUser` pode não salvar o usuário | `AuthContext.tsx` |
| 5 | Deveria corrigir | Notificação antiga reabre a tela após novo login | `usePetScanNotificationNavigation.ts` |
| 6 | Deveria corrigir | Três telas de saúde são quase cópias | `screens/HealthRecords/*` |
| 7 | Deveria corrigir | Login Google e registro de push sem teste | `useGoogleAuth.ts`, `usePushNotifications.ts` |
| 8 | Deveria corrigir | Mensagens fixas em português ignoram o i18n | `PetsContext.tsx`, `useGoogleAuth.ts`, `PetScansScreen.tsx` |
| 9 | Bom ter | `@expo/ngrok` sem uso | `package.json` |
| 10 | Bom ter | Login e cadastro ignoram o `auth.service` | `AuthContext.tsx` |

**Veredito:** saudável para um app de TCC. Corrigir primeiro o 1, depois o 2 e o 3 antes do build da demo (PC-106).

**Enxuto:** de -150 a -800 linhas (principalmente o item 6), -1 dependência possível.

---

## Precisa corrigir

### 1. O push continua chegando no celular depois do logout

`src/contexts/AuthContext.tsx:L129-L133`, `src/services/device.service.ts`

- **O que é:** depois do login, o app envia o token de push do aparelho para a API. Quando o QR da coleira é lido, a API manda para esse token a localização de quem achou o pet.
- **Problema:** o `logout` só apaga o armazenamento local. O app não tem chamada para remover o token na API, e o `device.service.ts` só tem `register`. O mesmo acontece quando um 401 força o logout.
- **Correção:** criar `deviceService.unregister(token)` (um `DELETE /devices/:token` ou similar) e chamá-lo antes de `clearSession()` no `logout`, ignorando erros. Confirmar que a API também descarta tokens do lado dela (essa parte não foi lida).
- **Se não corrigir:** quem faz logout, ou cujo celular é vendido ou emprestado, continua recebendo alertas de "seu pet foi encontrado" com localização.

### 2. O timeout de 10 s vale também para upload de foto

`src/services/api.ts:L4`, `src/services/upload.service.ts`

- **O que é:** existe um único cliente axios, com timeout de 10 s, usado em tudo, inclusive em `/upload/image`.
- **Problema:** o seletor de imagem usa `quality: 0.8`, mas não limita o tamanho. Uma foto de celular moderno pode ter vários MB. Em rede móvel fraca, 10 s não bastam: o upload falha e a foto do perfil ou do pet não salva.
- **Correção:** passar `{ timeout: 60000 }` na chamada de upload. Opcionalmente redimensionar com `expo-image-manipulator`, mas só o timeout já resolve o caso comum.
- **Se não corrigir:** o upload de foto falha em redes lentas e o usuário culpa o app.

### 3. Build de produção sem URL da API aponta para `localhost` em silêncio

`src/services/api.ts:L3,L12`

- **O que é:** o `baseURL` é `process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'`.
- **Problema:** se a variável do EAS faltar em um build, o app compila normalmente. Em execução toda requisição dá erro de rede, sem dizer o motivo. O `app.config.ts` já avisa sobre a chave do Maps ausente, mas não sobre isto.
- **Correção:** em `api.ts`, lançar erro (ou `console.error`) quando a URL faltar e `!__DEV__`. Ou falhar o build no `app.config.ts`, como já é feito para o Maps.
- **Se não corrigir:** o APK ou IPA da demo parece quebrado e custa tempo para diagnosticar.

---

## Deveria corrigir

### 4. O `refreshUser` pode não salvar o usuário

`src/contexts/AuthContext.tsx:L226-L241`

- **O que é:** depois de verificar o e-mail ou editar o perfil, ele busca o usuário em `/tutors/me` e grava o resultado.
- **Problema:** ele atribui `next` dentro do callback de `setUser(prev => …)` e lê `next` logo depois. O React não garante que esse callback rode na hora. Quando roda depois, `next` ainda é `null` e o `SecureStore` não é atualizado. Na próxima abertura a frio volta o `email_verified: false` antigo e o banner de verificação reaparece.
- **Correção:** montar o novo usuário a partir dos dados buscados, sem usar o callback: `const merged = {...userRef.current, …}`, depois `setUser(merged)` e gravar `merged`. Uma cópia de `user` em `useRef` basta.
- **Se não corrigir:** um usuário já verificado vê o banner "verifique seu e-mail" após reiniciar o app, de forma intermitente.

### 5. Tocar na notificação de "pet encontrado" pode levar o usuário àquela tela de novo

`src/hooks/usePetScanNotificationNavigation.ts:L38-L45`, `src/navigation/AppNavigator.tsx:L95-L97`

- **O que é:** ao montar, o hook chama `getLastNotificationResponseAsync()` para tratar a abertura do app pelo toque.
- **Problema:** essa chamada continua devolvendo a última notificação tocada. O hook vive no `MainNavigator`, que é recriado a cada logout e login. Ao sair e entrar de novo com o mesmo tutor, o app pula para "PetScans" outra vez, sem o usuário ter tocado em nada novo.
- **Correção:** guardar o id da notificação já tratada em uma variável de módulo (`response.notification.request.identifier`) e ignorá-la se repetir. Ou chamar `Notifications.clearLastNotificationResponse()` depois de tratar.
- **Se não corrigir:** o app muda de tela sozinho depois de um novo login, o que confunde numa demo.

### 6. As três telas de saúde são quase cópias

`src/screens/HealthRecords/VaccineScreen.tsx`, `DewormingScreen.tsx`, `MedicationScreen.tsx` (636, 636 e 709 linhas)

- **O que é:** cada tela tem lista, modal de formulário, edição e exclusão para um tipo de registro diferente.
- **Problema:** trocando o nome do tipo de registro, Vacina e Vermífugo diferem em cerca de 150 das 636 linhas. Uma correção em uma (seletor de pet, aviso de registro de vet, parse de data) precisa ser repetida à mão nas outras, e a divergência só cresce.
- **Correção:** mover lista, modal e fluxo de exclusão compartilhados para um único componente que recebe campos e service por props. Cada tela vira uma configuração fina. Fazer uma tela por vez, usando o `selecaoDePet.test.tsx` existente como proteção.
- **Se não corrigir:** cerca de 800 linhas mantidas três vezes, com bugs corrigidos só em um lugar.

### 7. Lógica sensível sem teste: login com Google e registro de push

`src/hooks/useGoogleAuth.ts`, `src/hooks/usePushNotifications.ts`

- **O que é:** o login com Google troca o ID token por uma sessão. O hook de push registra e re-registra o token do aparelho.
- **Problema:** nenhum dos dois tem teste que falhe se o token deixar de ser enviado ou se o tratamento de 401 quebrar. São fluxos que já quebraram antes.
- **Correção:** um teste por hook com services mockados. Google: sucesso chama `loginWithGoogle` e `id_token` ausente define o erro. Push: registra uma vez e re-registra quando o token rotaciona.
- **Se não corrigir:** uma regressão aqui só aparece quando alguém testa em aparelho real.

### 8. Várias mensagens ao usuário estão fixas em português e ignoram o i18n

`src/contexts/PetsContext.tsx:L37-L40`, `src/hooks/useGoogleAuth.ts:L57,L66,L74`, formatação de data em `src/screens/Home/PetScansScreen.tsx`

- **O que é:** o app suporta pt-BR e en-US via `i18next`.
- **Problema:** essas strings e o locale `'pt-BR'` nas datas ignoram o idioma escolhido. Quem usa inglês vê idiomas misturados.
- **Correção:** mover as strings para o `common.json` e usar `t()`. Usar locale `undefined` em `toLocaleDateString`.
- **Se não corrigir:** o modo em inglês parece inacabado.

---

## Bom ter

### 9. `@expo/ngrok` é uma dependência sem uso

`package.json:L23`

- **O que é:** ferramenta de túnel usada por `expo start --tunnel`.
- **Problema:** nada no código a usa, e ela está em `dependencies`.
- **Correção:** apagar a linha, ou movê-la para `devDependencies` se houver uso de túnel.
- **Se não corrigir:** um pacote a mais em cada instalação e em cada `npm audit`.

### 10. Login e cadastro ignoram o `auth.service` que já existe

`src/contexts/AuthContext.tsx:L96,L133`

- **O que é:** o `authService` já tem `forgotPassword`, `googleLogin` e `resendVerification`.
- **Problema:** `login` e `register` chamam `api.post` direto, e `login` e `loginWithGoogle` repetem o mesmo bloco de try, erro e gravação de sessão.
- **Correção:** adicionar `login` e `register` ao `auth.service.ts` e juntar os três fluxos em um helper como `startSession(fn)`. Economiza cerca de 25 linhas.
- **Se não corrigir:** três cópias do mesmo tratamento de erro para manter em sincronia.

---

## Fora do relatório

Ficaram de fora 3 itens menores: telas grandes como `AppointmentsScreen` (935 linhas), alguns blocos `catch {}` que escondem erros e a falta de rejeição de agendamento com data no passado.

## O que não foi verificado

- O lado da API: se os tokens de push são descartados no logout e qual o limite de tamanho de upload.
- A saída do `npm audit`.
- O comportamento em aparelho real (push, login Google, mapas).
- O corpo de `ClinicSearchScreen`, `PetDetailsScreen`, `DigitalWalletScreen`, `ProfileScreen` e `PetRegistrationScreen`, que foram lidos só em parte ou por grep.
- Nenhum teste foi executado.
