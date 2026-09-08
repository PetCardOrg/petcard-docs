# ADR-008: Fluxo de cadastro e login do tutor — verificação de e-mail, recuperação de senha e login com Google

**Data:** 2026-09-01
**Status:** Aceita
**Autores:** Camila Martins

## Contexto

A issue **mobile#54** (Fase 1, grupo E da M7) pede que o fluxo de autenticação do app do tutor
fique "100%": recuperação de senha ("esqueci minha senha"), senha forte (maiúscula + caractere
especial + número), confirmação de senha no cadastro, verificação de e-mail e cadastro/login com
Google.

Estado antes desta mudança:

- `petcard-api` — `POST /auth/register` e `POST /auth/login` de tutor com e-mail/senha. `RegisterDto`
  só exigia `MinLength(8)` na senha. **Não havia nenhuma infraestrutura de e-mail** no projeto
  (nem SMTP, nem SES, nem fila de e-mail). Não havia login social — o único uso de OAuth do Google
  era o do Google Calendar (`GoogleCalendarService`), que é troca de `code` + refresh token para
  acesso à agenda, não verificação de identidade.
- `petcard-mobile` — `LoginScreen`/`RegisterScreen` só postavam e-mail/senha. A confirmação de
  senha no cadastro **já existia** (campo + checagem de divergência); faltava a regra de força.

Restrição de custo declarada pelo time: a solução **não pode depender de nenhum serviço pago**.

## Decisão

### 1. Envio de e-mail: `nodemailer` + SMTP, com fallback de log em desenvolvimento

Novo módulo `petcard-api/src/modules/mail/` com `MailService`. Se `SMTP_HOST` estiver definido, usa
um transporte SMTP real (`nodemailer.createTransport`). Se **não** estiver — o caso de
desenvolvimento e da demo dos UCs — o serviço entra em **modo de log**: o link do e-mail é escrito
no `Logger` (`[MAIL:dev] ... Link: petcard://...`) em vez de enviado.

Alternativas descartadas:

- **AWS SES** — reaproveitaria as credenciais AWS já usadas no S3, mas exige domínio/identidade
  verificada e saída do sandbox, o que é setup de infra que não cabe no prazo e pode custar.
- **Provedor transacional (SendGrid/Resend/Mailgun)** — todos têm tier grátis limitado, mas
  adicionam uma dependência de conta externa e chave paga em potencial. Fora da restrição de custo.

O `nodemailer` é dependência-zero e MIT; SMTP real pode ser plugado depois (ex. um Gmail com
App Password, ou o SMTP da instituição) apenas preenchendo as variáveis `SMTP_*` — sem mudar código.

### 2. Verificação de e-mail é *soft* (não bloqueia o login)

A conta nasce com `emailVerifiedAt = null`. O `register` dispara o e-mail de verificação em
*best-effort* (try/catch + log, no mesmo padrão da verificação de CRMV da ADR-005 — uma falha de
e-mail não derruba o cadastro). O `login` **continua liberado**; a resposta passa a incluir
`email_verified: boolean`, e o app mostra um aviso persistente (`EmailVerificationBanner`) com um
botão "reenviar" até o e-mail ser confirmado.

Alternativa descartada: **bloquear o login até verificar** (403). Mais rígido, mas quebraria as
contas do seed usadas no roteiro de UCs (PC-094) e adicionaria um passo obrigatório e frágil
(dependente de e-mail) bem no meio da demo. As contas do seed passam a nascer com
`emailVerifiedAt` preenchido, então o roteiro não vê o aviso.

### 3. Tokens de e-mail: uso único, guardados por hash

Novo `model AuthToken` (`purpose` = `EMAIL_VERIFICATION | PASSWORD_RESET`, `tokenHash`,
`expiresAt`, `usedAt`). Só o **SHA-256** do token vai para o banco; o valor em claro só existe no
link enviado por e-mail — mesmo princípio da assinatura do `state` do OAuth do Calendar. Emitir um
token novo invalida os anteriores do mesmo propósito. TTL: 24 h para verificação, 60 min para
reset (configuráveis).

### 4. Senha forte no cadastro e na redefinição

Decorator composto `IsStrongPassword()` (`petcard-api/src/common/crypto/password.validators.ts`):
`MinLength(8)` + `MaxLength(72)` (limite do bcrypt, constantes já existentes) + três `@Matches`
separados (≥1 maiúscula, ≥1 dígito, ≥1 caractere especial), cada um com mensagem própria. Aplicado
a `RegisterDto` e `ResetPasswordDto`. O **`login` continua sem regra de força** — senha antiga
curta ainda entra; a exigência vale para quem define uma senha nova. O app espelha as mesmas regras
em `src/utils/passwordStrength.ts` como validação de conveniência (quem decide é a API).

### 5. Login com Google: verificação de ID token no servidor

Novo `POST /auth/google` recebe o **ID token** que o app obtém via `expo-auth-session` e o valida
com `google-auth-library` (`OAuth2Client.verifyIdToken`), conferindo o `aud` contra a lista
`GOOGLE_AUTH_CLIENT_IDS` (um client ID por plataforma do Expo). Casa a conta por `googleId`, senão
por e-mail (vinculando `googleId` à conta existente), senão cria uma conta nova **já verificada**
(o Google confirma o endereço). `Tutor.password` passou a ser **nullable** para acomodar contas
só-Google; o `login` por e-mail/senha recusa explicitamente conta sem senha.

Distinto do fluxo do Calendar: aqui não há troca de `code`, não há refresh token, não se pede
escopo de dados — só verificação de identidade.

## Consequências

**A favor:**

- Custo zero: nada além de `nodemailer` (dependência-zero) e `google-auth-library` (já vinha
  transitivamente via `googleapis`). O fluxo completo é percorrível em dev sem SMTP.
- A verificação *soft* mantém o roteiro de UCs e a demo simples, sem passo obrigatório dependente
  de caixa de entrada.
- Tokens por hash + uso único + TTL fecham o vetor de link vazado/reusado. Resposta 202 fixa em
  `/auth/password/forgot` evita a rota virar oráculo de e-mails cadastrados.
- As rotas novas herdam o rate-limit por IP das rotas sem sessão (`@Throttle({ auth: {} })`).

**Contra e limitações — declaradas:**

- **Não há refresh token / revogação de sessão** (decisão pré-existente, `petcard-api/CLAUDE.md`).
  Redefinir a senha **não invalida** JWTs já emitidos — eles expiram sozinhos em ≤ 7 dias. Aceitável
  para o escopo do TCC; uma denylist de tokens ou refresh rotativo fica como trabalho futuro.
- O modo de log **não envia e-mail de verdade**. Para a defesa/entrega, ou se preenche `SMTP_*`
  com um provedor grátis, ou as evidências (PC-094) mostram o link saindo no log da API. Precisa
  estar explícito no roteiro.
- O login com Google exige OAuth Client IDs criados no Google Cloud Console (um por plataforma) e
  as variáveis `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` / `GOOGLE_AUTH_CLIENT_IDS` preenchidas nos dois
  lados. Sem elas o botão "Entrar com Google" fica **oculto** — o app não quebra, mas a feature não
  aparece.
- `Tutor.password` nullable relaxa uma invariante do schema; o código compensa recusando login
  sem senha, mas qualquer novo caminho que leia `tutor.password` precisa tratar `null`.
- DTOs de auth ficam **locais na `petcard-api`** (como os já existentes `login.dto.ts` /
  `register.dto.ts`), não no `@petcardorg/shared`. É intencional: evita depender do publish do
  shared (que só roda em push para `main`) e segue o precedente do módulo. O app não precisa dos
  tipos — as telas postam objetos simples.

## Referências

- `petcard-api/src/modules/mail/` (`MailService`, `MailModule`)
- `petcard-api/src/modules/auth/` (`auth-token.service.ts`, `auth.service.ts`, `auth.controller.ts`,
  `dto/{forgot-password,reset-password,verify-email,google-login}.dto.ts`)
- `petcard-api/src/common/crypto/password.validators.ts`
- `petcard-api/src/config/{mail,google-auth}.config.ts`
- `petcard-api/prisma/schema.prisma` (`model AuthToken`, `enum AuthTokenPurpose`, `Tutor.password?`,
  `Tutor.googleId`, `Tutor.emailVerifiedAt`) · migration `20260901112552_fluxo_cadastro_login_tutor`
- `petcard-mobile/src/hooks/useGoogleAuth.ts`, `src/services/auth.service.ts`,
  `src/utils/passwordStrength.ts`, `src/screens/Auth/{ForgotPassword,ResetPassword,VerifyEmail}Screen.tsx`,
  `src/components/EmailVerificationBanner.tsx`
- ADR-005 (verificação de CRMV) — mesmo padrão *best-effort* para efeito colateral externo no cadastro
- `petcard-api/CLAUDE.md` — "Sem refresh token"; rate-limit das rotas de autenticação
- Issue: PetCardOrg/petcard-mobile#54
