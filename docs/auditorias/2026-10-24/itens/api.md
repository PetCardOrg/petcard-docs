# Itens — `petcard-api`

> Origem: [auditoria original](../originais/auditoria-petcard-api.md) (feita na `develop@c5ea009`).
> **Revalidado em 2026-10-28 contra `main@9483562`: todos os itens continuam presentes.**
> Formato de cada item e regras de fechamento: [COMO-CONTINUAR.md](../COMO-CONTINUAR.md).

Legenda de severidade: 🔴 corrigir já · 🟠 deveria corrigir · 🟡 desejável · ⚪ menor

---

## 🔴 Corrigir já

### API-01 · Rate limit conta o IP do proxy, não o do usuário
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-api#180
- **Onde:** `src/main.ts` (não há `trust proxy` em nenhum arquivo do `src/`).
- **Problema:** atrás do proxy do Render, todo mundo tem o mesmo `req.ip` e divide um balde só. O 11º login por minuto, somando todos os usuários, recebe 429.
- **Correção:** `app.getHttpAdapter().getInstance().set('trust proxy', 1)` antes do `listen`. Usar `1` (um hop) e não `true`, para o cliente não forjar `X-Forwarded-For`.
- **Aceite:**
  - [x] `trust proxy` = 1 configurado no bootstrap.
  - [x] Teste (e2e ou unit do bootstrap) provando que dois `X-Forwarded-For` distintos caem em baldes distintos.
  - [x] Nota no `README`/`CLAUDE.md` da API explicando o motivo.
- **Resolução:** `trust proxy` = 1 em `src/common/http/trust-proxy.ts`, aplicado no início do `bootstrap`. Teste de integração `trust-proxy.spec.ts` (baldes distintos por IP; forjar o início do XFF não escapa). Nota no `CLAUDE.md` da API. **Pendente:** validar em produção com dois aparelhos em redes diferentes depois do `develop → main`; se o segundo for bloqueado, há mais de um proxy e o número sobe para 2.

### API-02 · Lembretes diários dependem do servidor estar acordado às 9h
- **Status:** ⬜ pendente · **Fase:** 1 · **Pacote:** P3 · **PR:** —
- **Onde:** `src/modules/reminder/dose-reminder.service.ts:44`, `src/modules/reminder/appointment-reminder.service.ts:39` (`@Cron EVERY_DAY_AT_9AM`); script pronto em `scripts/run-reminders.ts`.
- **Problema:** no plano gratuito do Render o processo dorme; cron dentro do processo não executa e não há recuperação.
- **Decisão D1 (2026-10-28):** produção no plano **gratuito** do Render (dorme), então o item segue 🔴.
- **Correção:** disparo externo (workflow `schedule` do GitHub Actions chamando um endpoint protegido por segredo, ou Render Cron Job rodando `scripts/run-reminders.ts`) **e** uma execução no boot (`onApplicationBootstrap`), pois a reivindicação torna repetições seguras.
- **Aceite:**
  - [ ] Disparo externo documentado e configurado (anotar onde fica o segredo).
  - [ ] Execução no boot, com teste provando idempotência (rodar 2× não duplica push).
  - [ ] Comentários de ECS/CloudWatch substituídos (resolve junto o API-15 nesses dois arquivos).
- **Resolução:** —

### API-03 · Lembrete se perde se o RabbitMQ falhar na publicação
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P3 · **PR:** PetCardOrg/petcard-api#182
- **Onde:** `src/modules/notification/notification.service.ts` (`schedulePush`, bloco `try/catch` do `publisher.publish`), teste `notification.service.spec.ts` (~linha 140) que trava o comportamento atual.
- **Problema:** a falha de publicação só vai para o log; a função devolve a linha como se tivesse sido enviada, o lembrete grava `lastNotifiedAt` e nunca tenta de novo. A linha fica `PENDING` para sempre.
- **Correção:** devolver só as notificações publicadas; marcar as que falharam como `FAILED` (`markFailed(id, 'ENQUEUE_FAILED')`). Se nenhuma foi publicada, devolver `[]` para o lembrete soltar a reivindicação.
- **Aceite:**
  - [x] Teste antigo reescrito: publicação que falha → status `FAILED` e não entra no retorno.
  - [x] Teste do reminder: retorno vazio → reivindicação liberada (`lastNotifiedAt` não grava).
- **Resolução:** api#182 (mergeado em 2026-10-29). `schedulePush` marca `FAILED` (`ENQUEUE_FAILED`) a notificação que não entrou na fila e devolve só as publicadas; retorno vazio faz o `DoseReminderService` soltar a reivindicação (`lastNotifiedAt` volta ao valor anterior).

### API-04 · Token roubado permite tomar a conta do tutor
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P6 · **PR:** —
- **Depende de:** SH-03 (DTO com `senha_atual`) publicado no `@petcardorg/shared`.
- **Onde:** `src/modules/tutor/tutor.controller.ts:36` (`PATCH me`), `:46` (`DELETE me`), `tutor.service.ts` (`updateById`, `removeById`). Modelo a copiar: `veterinario.service.ts:111` (`assertSenhaAtualConfere`).
- **Problema:** trocar o e-mail e apagar a conta só exigem o token (7 dias, em `localStorage` na web). Atacante troca o e-mail → "esqueci a senha" → dono da conta.
- **Correção:** exigir `senha_atual` para trocar `email` e para `DELETE /tutors/me`. Conta só-Google (sem senha): exigir `id_token` do Google recente (validar com o mesmo verificador do `googleLogin`). Trocar o e-mail também deve zerar `emailVerifiedAt` e invalidar sessões (`passwordChangedAt`/equivalente).
- **⚠️ Decisão pendente (D2):** conta só-Google: `id_token` recente ou confirmação por e-mail?
- **Aceite:**
  - [ ] `PATCH /tutors/me` com `email` e sem `senha_atual` → 400/401; com senha errada → 401.
  - [ ] `DELETE /tutors/me` idem.
  - [ ] Caminho da conta só-Google coberto por teste.
  - [ ] **Vet também:** troca de e-mail em `PATCH /veterinarios/me` passa a exigir `senha_atual` (hoje só a troca de senha exige — ver SH-03).
  - [ ] Clientes atualizados para pedir a senha nesses fluxos: MOB-14 (tutor) e WEB-14 (vet). **Publicar a API e os clientes juntos**, senão a troca de e-mail quebra.
  - [ ] OpenAPI/Postman regenerados (`scripts/generate-openapi.ts`).
- **Resolução:** —

### API-05 · Login Google herda a senha de quem cadastrou o e-mail antes
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/modules/auth/auth.service.ts` `googleLogin` (bloco `else if (tutor.googleId !== googleId || tutor.emailVerifiedAt === null)`, ~linha 162).
- **Problema:** qualquer um cadastra `vitima@x.com` com senha própria (login não exige e-mail verificado). Quando a vítima entra com Google, as contas se unem e a senha do atacante continua valendo.
- **Correção:** ao vincular conta com `emailVerifiedAt === null`, gravar `password: null` e `passwordChangedAt: new Date()` (derruba sessões do atacante).
- **Aceite:**
  - [x] Teste: tutor com senha e e-mail não verificado + `googleLogin` → `password` nulo e sessões antigas rejeitadas.
  - [x] Teste: tutor **já verificado** + `googleLogin` → senha preservada.
- **Resolução:** api#181 (mergeado em 2026-10-28). Vínculo Google de e-mail não verificado zera a senha e renova `passwordChangedAt`.

### API-06 · Qualquer CRMV real passa, quem quer que o digite
- **Status:** 🟨 em develop, falta o aceite web (WEB-16) · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/modules/veterinario/crmv/infosimples-crmv.validator.ts:129` (devolve `nome`, mas ninguém compara), `crmv-verification.service.ts:179`, `auth.service.ts` (`registerVeterinario`, ~linha 281).
- **Problema:** CRMV é público; nome do titular não é comparado com o nome cadastrado.
- **Correção:** comparar `registro.nome` com o nome do cadastro, normalizando (minúsculas, sem acento, espaços colapsados). Se diferente → `valid: false` com motivo claro. Mesma regra na revalidação.
- **Decisão D3 (2026-10-28):** primeiro e último nome iguais após normalização (sem acento, sem caixa, espaços colapsados); nomes do meio ignorados.
- **Aceite:**
  - [x] Função pura `nomesConferem(a, b)` com testes (acentos, caixa, nome do meio omitido, nome diferente).
  - [x] Cadastro e revalidação usam a função.
  - [ ] Mensagem de erro amigável chega à web (`VetRegisterPage`).
- **Resolução:** api#181 (mergeado em 2026-10-28). `nomesConferem` (D3) no `verify()`, usado em cadastro e revalidação. **Aceite web em aberto:** mensagem amigável na `VetRegisterPage` fica no WEB-16 (P9).

### API-07 · Variável ausente em produção liga o verificador de CRMV falso
- **Status:** ✅ em develop · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/config/…/crmv.config.ts` (`provider: process.env.CRMV_PROVIDER ?? 'stub'`), `veterinario.module.ts`.
- **Correção:** com `NODE_ENV=production`, `CRMV_PROVIDER` obrigatório (falhar no boot como já fazem `JWT_SECRET`/CORS/SMTP). `stub` só se explícito, com `logger.warn` alto no boot.
- **Aceite:**
  - [x] Teste no `config.spec.ts`: produção sem a variável → erro; produção com `stub` explícito → sobe com aviso.
  - [x] **Antes do merge:** confirmar no painel do Render que `CRMV_PROVIDER` está definido (senão o deploy quebra). Registrar no LOG.
- **Resolução:** api#181 (mergeado em 2026-10-28). Produção sem `CRMV_PROVIDER` (ou valor desconhecido) falha no boot; `stub` explícito sobe com aviso. Variável conferida no Render pelo alvaro-unifor antes do merge.

---

## 🟠 Deveria corrigir

### API-08 · Agendamento salvo, mas a API responde 500
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P7 · **PR:** —
- **Onde:** `src/modules/appointment/appointment.service.ts:76,139,154` (`calendarSyncPublisher.publish` sem try/catch). Modelo: `PetService.enqueueQrCodeGeneration`.
- **Correção:** capturar e logar a falha; a linha fica `PENDING_*` e o `syncAllPending` recupera.
- **Aceite:** [ ] teste: publisher lança → create/update respondem 2xx e linha fica `PENDING_*`.
- **Resolução:** —

### API-09 · Retentativas da fila sem espera
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P8 (depois do API-11) · **PR:** —
- **Onde:** `notification-push.consumer.ts:112`, `queue/qr-code.consumer.ts:70`, `calendar/calendar-sync.consumer.ts:154`.
- **Correção:** `await sleep(1000 * 2 ** retryCount)` antes de republicar (seguro com `prefetchCount: 1`). Fazer **no `retryOrDlq` compartilhado do API-11**, não 3 vezes.
- **Aceite:** [ ] teste do helper com timers falsos verificando o backoff; [ ] DLQ sem leitor documentada (ou criar item para um leitor).
- **Resolução:** —

### API-10 · Upload sem throttle e arquivos nunca apagados
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P7 · **PR:** —
- **Onde:** `src/modules/upload/upload.controller.ts:30` (`@Post('image')` sem `@Throttle`), `upload.service.ts` (`deleteFile` sem chamador).
- **Correção:** `@Throttle` na rota (seguir o padrão `@SkipThrottle` dos outros controllers); chamar `deleteFile` ao trocar foto de pet/tutor/vet e ao excluir pet, tutor ou vet (falha no delete só loga).
- **Aceite:** [ ] teste de throttle; [ ] testes de troca/exclusão chamando `deleteFile` com a chave antiga.
- **Resolução:** —

### API-11 · Configuração das filas copiada em 4 lugares
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P8 · **PR:** —
- **Onde:** `main.ts` (~60-110), `queue.module.ts` (~25-95), `rabbitmq-topology.service.ts`, 3 consumidores (`retryOrDlq`).
- **Correção:** helper `rmqOptions(queue, dlx, dlqKey)` e um `retryOrDlq` compartilhado. Refactor puro: sem mudar comportamento (o backoff entra no API-09, commit separado).
- **Aceite:** [ ] suíte unitária e e2e verdes sem mudar testes de comportamento.
- **Resolução:** —

---

## 🟡 Desejável

| ID | Item | Onde | Correção | Status |
|----|------|------|----------|--------|
| API-12 | Container roda como root | `Dockerfile` | `USER node` antes do `ENTRYPOINT`; checar permissões de escrita | ⬜ |
| API-13 | Erro de serviço externo vaza ou vira 500 | `places.service.ts` (~175), `infosimples-crmv.validator.ts` (~99) | logar corpo, responder genérico; `try/catch` no `response.json()` → 502 | ⬜ |
| API-14 | Lembrete de dose triplicado | `dose-reminder.service.ts` | mapa modelo → delegate Prisma (~-60 linhas) | ⬜ |
| API-15 | Comentários citam ECS/CloudWatch | `dose-reminder.service.ts`, `appointment-reminder.service.ts`, `.env.example`, `config/mail.config.ts` | atualizar para Render | ⬜ |
| API-16 | Dev deps sem uso | `package.json` (`ts-loader`, `source-map-support`) | remover, rodar build e testes | ⬜ |
| API-17 | `googleapis` enorme para 1 uso | `google-calendar.service.ts` | `@googleapis/calendar` + `google-auth-library`. **Risco médio**: testar sync de calendário de ponta a ponta | ⬜ |

## ⚪ Menores (deixados de fora do relatório, numerados aqui)

| ID | Item | Correção sugerida | Status |
|----|------|-------------------|--------|
| API-18 | Corrida de leitura/escrita no consumo do token de redefinição | `updateMany` condicional (`where: { id, usedAt: null }`) e checar `count` | ⬜ |
| API-19 | Cadastro/troca de e-mail disputam a unique → 500 | capturar `P2002` → 409 | ⬜ |
| API-20 | Limite de 72 bytes da senha conta caracteres | **a API tem cópia própria** em `src/common/crypto/password.validators.ts` (`MaxLength`). Corrigir aqui junto com SH-02 (ou passar a usar o validador do shared) | ⬜ |
| API-21 | Cadastro revela quais e-mails existem | avaliar custo/benefício (UX vs enumeração); no mínimo documentar a decisão | ⬜ |
| API-22 | `Historico` sem paginação | paginação por cursor, alinhada com o DTO do shared | ⬜ |

## ➕ Itens derivados (descobertos ao cruzar as auditorias)

### API-23 · Rota para descadastrar token de push (necessária ao MOB-01)
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P6 · **PR:** —
- **Onde:** `src/modules/notification/devices.controller.ts` só tem `@Post()`.
- **Correção:** `DELETE /devices/:token` autenticado, que só remove token do próprio tutor (idempotente: 204 mesmo se não existir). Opcional: remover tokens que o FCM devolve como `UNREGISTERED` no consumidor.
- **Aceite:** [ ] testes de controller e service (dono, não-dono, inexistente); [ ] OpenAPI regenerado.
- **Resolução:** —

### API-24 · PATCH de registros clínicos precisa aceitar `null` para limpar campo (necessário ao WEB-05)
- **Status:** ⬜ pendente · **Fase:** 3 · **Pacote:** P6 · **PR:** —
- **Contexto:** os DTOs do shared usam `@IsOptional()`, que já deixa `null` passar na validação. Falta confirmar que os services (`vaccine`, `deworming`, `medication`, `vet-note`) repassam `null` ao Prisma e não o descartam.
- **Aceite:** [ ] teste por service: `PATCH { next_dose_at: null }` grava `NULL`; [ ] campos obrigatórios continuam rejeitando `null`.
- **Resolução:** —

---

## Não verificado pela auditoria (cobrir ao trabalhar na área)
- Suíte E2E (precisa de Postgres) e CI.
- Configuração real de Render/Supabase/CloudAMQP (`CRMV_PROVIDER`, plano).
- Portas SMTP no Render (hoje o envio é via API HTTP da Brevo, PR #178, então provavelmente já resolvido).
- Migrations, `medication`, `deworming`, `geocoding.service.ts`, DTOs fora de auth/coleira, `prisma/seed.ts`.
