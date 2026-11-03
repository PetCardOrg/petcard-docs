# Itens — `petcard-api`

> Origem: [auditoria original](../originais/auditoria-petcard-api.md) (feita na `develop@c5ea009`).
> **Revalidado em 2026-10-28 contra `main@9483562`: todos os itens continuam presentes.**
> Formato de cada item e regras de fechamento: [COMO-CONTINUAR.md](../COMO-CONTINUAR.md).

Legenda de severidade: 🔴 corrigir já · 🟠 deveria corrigir · 🟡 desejável · ⚪ menor

---

## 🔴 Corrigir já

### API-01 · Rate limit conta o IP do proxy, não o do usuário
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P1 · **PR:** PetCardOrg/petcard-api#180
- **Onde:** `src/main.ts` (não há `trust proxy` em nenhum arquivo do `src/`).
- **Problema:** atrás do proxy do Render, todo mundo tem o mesmo `req.ip` e divide um balde só. O 11º login por minuto, somando todos os usuários, recebe 429.
- **Correção:** `app.getHttpAdapter().getInstance().set('trust proxy', 1)` antes do `listen`. Usar `1` (um hop) e não `true`, para o cliente não forjar `X-Forwarded-For`.
- **Aceite:**
  - [x] `trust proxy` = 1 configurado no bootstrap.
  - [x] Teste (e2e ou unit do bootstrap) provando que dois `X-Forwarded-For` distintos caem em baldes distintos.
  - [x] Nota no `README`/`CLAUDE.md` da API explicando o motivo.
- **Resolução:** `trust proxy` = 1 em `src/common/http/trust-proxy.ts`, aplicado no início do `bootstrap`. Teste de integração `trust-proxy.spec.ts` (baldes distintos por IP; forjar o início do XFF não escapa). Nota no `CLAUDE.md` da API. **Pendente:** validar em produção com dois aparelhos em redes diferentes depois do `develop → main`; se o segundo for bloqueado, há mais de um proxy e o número sobe para 2.

### API-02 · Lembretes diários dependem do servidor estar acordado às 9h
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P3 · **PR:** PetCardOrg/petcard-api#183
- **Onde:** `src/modules/reminder/dose-reminder.service.ts:44`, `src/modules/reminder/appointment-reminder.service.ts:39` (`@Cron EVERY_DAY_AT_9AM`); script pronto em `scripts/run-reminders.ts`.
- **Problema:** no plano gratuito do Render o processo dorme; cron dentro do processo não executa e não há recuperação.
- **Decisão D1 (2026-10-28):** produção no plano **gratuito** do Render (dorme), então o item segue 🔴.
- **Correção:** disparo externo (workflow `schedule` do GitHub Actions chamando um endpoint protegido por segredo, ou Render Cron Job rodando `scripts/run-reminders.ts`) **e** uma execução no boot (`onApplicationBootstrap`), pois a reivindicação torna repetições seguras.
- **Aceite:**
  - [x] Disparo externo documentado e configurado (anotar onde fica o segredo). Documentado no `.env.example` e no `CLAUDE.md`. Segredo: variável `REMINDERS_TRIGGER_SECRET` no Render (staging e produção, valores diferentes) e repository secrets `REMINDERS_TRIGGER_SECRET` + `REMINDERS_API_URL` no `petcard-api` (Actions; só produção). Validado no staging em 2026-10-30.
  - [x] Execução no boot, com teste provando idempotência (rodar 2× não duplica push).
  - [x] Comentários de ECS/CloudWatch substituídos (resolve junto o API-15 nesses dois arquivos).
- **Resolução:** api#183 (mergeado em 2026-10-30). Workflow `reminders.yml` (12:00 UTC + `workflow_dispatch`) chama `POST /internal/reminders/run` com `X-Reminders-Secret` (comparação em tempo constante; 404 sem segredo configurado). Execução no boot logo depois do `listen` (`main.ts`), só entre 9h e 21h de Fortaleza. `REMINDERS_TRIGGER_SECRET` obrigatório em produção (mín. 32 caracteres). Testes: boot e disparo simultâneos não duplicam push (dose e agendamento). Staging (2026-10-30): disparo manual → 204, os dois serviços rodaram (0 lembretes na janela; FCM desligado no staging); boot às 23h pulou a execução, como esperado. Variável no Render de produção e repository secrets cadastrados (2026-10-30). **Pendente:** `develop → main` da API e, depois do deploy, rodar o workflow "Lembretes diários" uma vez manualmente.

### API-03 · Lembrete se perde se o RabbitMQ falhar na publicação
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P3 · **PR:** PetCardOrg/petcard-api#182
- **Onde:** `src/modules/notification/notification.service.ts` (`schedulePush`, bloco `try/catch` do `publisher.publish`), teste `notification.service.spec.ts` (~linha 140) que trava o comportamento atual.
- **Problema:** a falha de publicação só vai para o log; a função devolve a linha como se tivesse sido enviada, o lembrete grava `lastNotifiedAt` e nunca tenta de novo. A linha fica `PENDING` para sempre.
- **Correção:** devolver só as notificações publicadas; marcar as que falharam como `FAILED` (`markFailed(id, 'ENQUEUE_FAILED')`). Se nenhuma foi publicada, devolver `[]` para o lembrete soltar a reivindicação.
- **Aceite:**
  - [x] Teste antigo reescrito: publicação que falha → status `FAILED` e não entra no retorno.
  - [x] Teste do reminder: retorno vazio → reivindicação liberada (`lastNotifiedAt` não grava).
- **Resolução:** api#182 (mergeado em 2026-10-29). `schedulePush` marca `FAILED` (`ENQUEUE_FAILED`) a notificação que não entrou na fila e devolve só as publicadas; retorno vazio faz o `DoseReminderService` soltar a reivindicação (`lastNotifiedAt` volta ao valor anterior).

### API-04 · Token roubado permite tomar a conta do tutor
- **Status:** 🚀 em produção (api#195, web#72 e APK do app, 2026-11-03) · **Fase:** 3 · **Pacote:** P6 · **PR:** PetCardOrg/petcard-api#194
- **Depende de:** SH-03 (DTO com `senha_atual`) publicado no `@petcardorg/shared`.
- **Onde:** `src/modules/tutor/tutor.controller.ts:36` (`PATCH me`), `:46` (`DELETE me`), `tutor.service.ts` (`updateById`, `removeById`). Modelo a copiar: `veterinario.service.ts:111` (`assertSenhaAtualConfere`).
- **Problema:** trocar o e-mail e apagar a conta só exigem o token (7 dias, em `localStorage` na web). Atacante troca o e-mail → "esqueci a senha" → dono da conta.
- **Correção:** exigir `senha_atual` para trocar `email` e para `DELETE /tutors/me`. Conta só-Google (sem senha): exigir `id_token` do Google recente (validar com o mesmo verificador do `googleLogin`). Trocar o e-mail também deve zerar `emailVerifiedAt` e invalidar sessões (`passwordChangedAt`/equivalente).
- **Decisão (D2):** `id_token` do Google obtido na hora (ver PLANO).
- **Aceite:**
  - [x] `PATCH /tutors/me` com `email` e sem `senha_atual` → 400/401; com senha errada → 401.
  - [x] `DELETE /tutors/me` idem.
  - [x] Caminho da conta só-Google coberto por teste.
  - [x] **Vet também:** troca de e-mail em `PATCH /veterinarios/me` passa a exigir `senha_atual` (hoje só a troca de senha exige — ver SH-03).
  - [x] Clientes atualizados (web#72 e app pela mobile#105, APK testado em 2026-11-03) para pedir a senha nesses fluxos: MOB-14 (tutor) e WEB-14 (vet). **Publicar a API e os clientes juntos**, senão a troca de e-mail quebra.
  - [x] OpenAPI/Postman regenerados (`scripts/generate-openapi.ts`).
- **Resolução:** commit `a93ce9e`. Tutor: `PATCH /tutors/me` com e-mail **novo** e `DELETE /tutors/me` conferem `senha_atual` (bcrypt); a conta com Google vinculado pode provar com `google_id_token`, validado pelo mesmo verificador do login (`AuthService.verifyGoogleIdToken`, extraído do `googleLogin`), exigindo o mesmo `sub` e `iat` de até **5 minutos**. `senha_atual` em conta sem senha → 401. Trocar o e-mail zera `emailVerifiedAt` e carimba `passwordChangedAt`: **todas as sessões caem, inclusive a de quem trocou** (o app precisa mandar a pessoa entrar de novo, MOB-14). Vet: trocar o e-mail confere `senha_atual` (sem derrubar sessões; o item não pedia). Nos dois, a prova vem antes da checagem de e-mail ocupado, para a rota não revelar quais e-mails têm conta. Mandar o e-mail atual sem mudança não pede prova. Testes: `tutor.reautenticacao.spec.ts` (16), controller do tutor, service do vet e e2e (`conta-do-tutor`, `auth`). Falta o OpenAPI (regenerar depois do merge) e os clientes (WEB-14, MOB-14).

### API-05 · Login Google herda a senha de quem cadastrou o e-mail antes
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/modules/auth/auth.service.ts` `googleLogin` (bloco `else if (tutor.googleId !== googleId || tutor.emailVerifiedAt === null)`, ~linha 162).
- **Problema:** qualquer um cadastra `vitima@x.com` com senha própria (login não exige e-mail verificado). Quando a vítima entra com Google, as contas se unem e a senha do atacante continua valendo.
- **Correção:** ao vincular conta com `emailVerifiedAt === null`, gravar `password: null` e `passwordChangedAt: new Date()` (derruba sessões do atacante).
- **Aceite:**
  - [x] Teste: tutor com senha e e-mail não verificado + `googleLogin` → `password` nulo e sessões antigas rejeitadas.
  - [x] Teste: tutor **já verificado** + `googleLogin` → senha preservada.
- **Resolução:** api#181 (mergeado em 2026-10-28). Vínculo Google de e-mail não verificado zera a senha e renova `passwordChangedAt`.

### API-06 · Qualquer CRMV real passa, quem quer que o digite
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/modules/veterinario/crmv/infosimples-crmv.validator.ts:129` (devolve `nome`, mas ninguém compara), `crmv-verification.service.ts:179`, `auth.service.ts` (`registerVeterinario`, ~linha 281).
- **Problema:** CRMV é público; nome do titular não é comparado com o nome cadastrado.
- **Correção:** comparar `registro.nome` com o nome do cadastro, normalizando (minúsculas, sem acento, espaços colapsados). Se diferente → `valid: false` com motivo claro. Mesma regra na revalidação.
- **Decisão D3 (2026-10-28):** primeiro e último nome iguais após normalização (sem acento, sem caixa, espaços colapsados); nomes do meio ignorados.
- **Aceite:**
  - [x] Função pura `nomesConferem(a, b)` com testes (acentos, caixa, nome do meio omitido, nome diferente).
  - [x] Cadastro e revalidação usam a função.
  - [x] Mensagem de erro amigável chega à web (`VetRegisterPage`).
- **Resolução:** api#181 (mergeado em 2026-10-28). `nomesConferem` (D3) no `verify()`, usado em cadastro e revalidação. Aceite web pelo WEB-16 (PetCardOrg/petcard-web#69, mergeado em 2026-10-31): depois do cadastro, o dashboard mostra que o nome não confere, com o link para corrigi-lo.

### API-07 · Variável ausente em produção liga o verificador de CRMV falso
- **Status:** 🚀 em produção · **Fase:** 1 · **Pacote:** P2 · **PR:** PetCardOrg/petcard-api#181
- **Onde:** `src/config/…/crmv.config.ts` (`provider: process.env.CRMV_PROVIDER ?? 'stub'`), `veterinario.module.ts`.
- **Correção:** com `NODE_ENV=production`, `CRMV_PROVIDER` obrigatório (falhar no boot como já fazem `JWT_SECRET`/CORS/SMTP). `stub` só se explícito, com `logger.warn` alto no boot.
- **Aceite:**
  - [x] Teste no `config.spec.ts`: produção sem a variável → erro; produção com `stub` explícito → sobe com aviso.
  - [x] **Antes do merge:** confirmar no painel do Render que `CRMV_PROVIDER` está definido (senão o deploy quebra). Registrar no LOG.
- **Resolução:** api#181 (mergeado em 2026-10-28). Produção sem `CRMV_PROVIDER` (ou valor desconhecido) falha no boot; `stub` explícito sobe com aviso. Variável conferida no Render pelo alvaro-unifor antes do merge.

---

## 🟠 Deveria corrigir

### API-08 · Agendamento salvo, mas a API responde 500
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P7 · **PR:** PetCardOrg/petcard-api#185
- **Onde:** `src/modules/appointment/appointment.service.ts:76,139,154` (`calendarSyncPublisher.publish` sem try/catch). Modelo: `PetService.enqueueQrCodeGeneration`.
- **Correção:** capturar e logar a falha; a linha fica `PENDING_*` e o `syncAllPending` recupera.
- **Aceite:** [x] teste: publisher lança → create/update respondem 2xx e linha fica `PENDING_*`.
- **Resolução:** helper `enqueueCalendarSync` no `AppointmentService`, no molde do `enqueueQrCodeGeneration`, usado por `create`, `update` e `remove`. No `remove` a exclusão segue mesmo com a fila fora, mas o evento fica órfão no Google (a linha some e o `syncAllPending` não o vê); o log diz qual. A recuperação virou o **API-25**.

### API-09 · Retentativas da fila sem espera
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P8 (depois do API-11) · **PR:** PetCardOrg/petcard-api#186
- **Onde:** `notification-push.consumer.ts:112`, `queue/qr-code.consumer.ts:70`, `calendar/calendar-sync.consumer.ts:154`.
- **Correção:** `await sleep(1000 * 2 ** retryCount)` antes de republicar (seguro com `prefetchCount: 1`). Fazer **no `retryOrDlq` compartilhado do API-11**, não 3 vezes.
- **Aceite:** [x] teste do helper com timers falsos verificando o backoff; [x] DLQ sem leitor documentada (ou criar item para um leitor).
- **Resolução:** `retryOrDlq` espera `1000 * 2 ** retryCount` (1s/2s/4s) antes de republicar. A espera passa por `backoff.esperar`; os specs dos consumidores a substituem com um `spyOn` de uma linha, e `rmq.spec.ts` testa a espera real com timers falsos. A falta de leitor nas DLQs está documentada no `rmq.ts` e no `CLAUDE.md` da API (sem item novo para um leitor).

### API-10 · Upload sem throttle e arquivos nunca apagados
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P7 · **PR:** PetCardOrg/petcard-api#185
- **Onde:** `src/modules/upload/upload.controller.ts:30` (`@Post('image')` sem `@Throttle`), `upload.service.ts` (`deleteFile` sem chamador).
- **Correção:** `@Throttle` na rota (seguir o padrão `@SkipThrottle` dos outros controllers); chamar `deleteFile` ao trocar foto de pet/tutor/vet e ao excluir pet, tutor ou vet (falha no delete só loga).
- **Aceite:** [x] teste de throttle; [x] testes de troca/exclusão chamando `deleteFile` com a chave antiga.
- **Resolução:** `POST /upload/image` limitado a 10 por minuto **por usuário** (`LIMITE_DE_UPLOAD`, balde `auth` com teto próprio + `SkipThrottle` dos outros). O `UserThrottlerGuard` conta pelo `sub` do token, não pelo IP, para uma rede compartilhada não somar todo mundo num teto só. `UploadService.discardFile` (melhor esforço, só loga) é chamado ao trocar a foto de pet/tutor/vet, só quando ela muda, e ao excluir pet/tutor/vet; a exclusão do tutor apaga também as fotos dos pets, que saem em cascata. Anexos e PNGs de QR na cascata ficaram de fora: **API-26**.

### API-11 · Configuração das filas copiada em 4 lugares
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P8 · **PR:** PetCardOrg/petcard-api#186
- **Onde:** `main.ts` (~60-110), `queue.module.ts` (~25-95), `rabbitmq-topology.service.ts`, 3 consumidores (`retryOrDlq`).
- **Correção:** helper `rmqOptions(queue, dlx, dlqKey)` e um `retryOrDlq` compartilhado. Refactor puro: sem mudar comportamento (o backoff entra no API-09, commit separado).
- **Aceite:** [x] suíte unitária e e2e verdes sem mudar testes de comportamento.
- **Resolução:** `src/modules/queue/rmq.ts`: lista `FILAS` (chaves de fila/DLX/DLQ das 3 filas) lida por `main.ts`, `queue.module.ts` e `rabbitmq-topology.service.ts`; `rmqOptions` com a parte comum; `retryOrDlq`/`getRetryCount` compartilhados, com ganchos `onRetry`/`onExhausted` para os logs e o `markFailed` de cada consumidor; `RETRY_HEADER` único. No commit do refactor, os testes dos consumidores passaram sem alteração (36 ✅); e2e local 81 ✅; boot com RabbitMQ real sem `PRECONDITION_FAILED` e filas com os mesmos argumentos.

---

## 🟡 Desejável

| ID | Item | Onde | Correção | Status |
|----|------|------|----------|--------|
| API-12 | Container roda como root | `Dockerfile` | `USER node` antes do `ENTRYPOINT`; checar permissões de escrita | ✅ api#189 (commit `fb57b54`; validado com Docker: `uid=1000(node)`, as 29 migrations e o boot sem EACCES) |
| API-13 | Erro de serviço externo vaza ou vira 500 | `places.service.ts` (~175), `infosimples-crmv.validator.ts` (~99) | logar corpo, responder genérico; `try/catch` no `response.json()` → 502 | ✅ api#190 (commit `d0152d6`: helper `readPlacesResponse` loga status e corpo do Google e responde a mensagem genérica; JSON inválido → 502 no Places e na Infosimples) |
| API-14 | Lembrete de dose triplicado | `dose-reminder.service.ts` | mapa modelo → delegate Prisma (~-60 linhas) | ✅ api#191 (commit `af8c5bc`: um `processReminders` e um delegate por modelo no claim/release; -41 linhas; testes do reminder sem alteração) |
| API-15 | Comentários citam ECS/CloudWatch | `dose-reminder.service.ts`, `appointment-reminder.service.ts`, `.env.example`, `config/mail.config.ts` | atualizar para Render | ✅ reminder em develop (api#183); `.env.example`, `mail.config.ts` e o teste em api#189 (commit `d64e785`: logs do Render) |
| API-16 | Dev deps sem uso | `package.json` (`ts-loader`, `source-map-support`) | remover, rodar build e testes | ✅ api#189 (commit `6e67db7`; lock editado só com as remoções, porque o `npm uninstall` no Windows podava `@emnapi/*`; o `source-map-support` fica no lock pelo `terser`) |
| API-17 | `googleapis` enorme para 1 uso | `google-calendar.service.ts` | `@googleapis/calendar` + `google-auth-library`. **Risco médio**: testar sync de calendário de ponta a ponta | ✅ api#193 (commit `c65f21f`: `@googleapis/calendar@^16`, a última na mesma base de hoje, `googleapis-common@8` e `google-auth-library@10`; a 19 e a 20 exigem Node 22. `OAuth2Client` direto do `google-auth-library`. Lock editado à mão. Testado de ponta a ponta com conta Google de teste: agendamento criado, movido e excluído; vacina com próxima dose criada e excluída) |

## ⚪ Menores (deixados de fora do relatório, numerados aqui)

| ID | Item | Correção sugerida | Status |
|----|------|-------------------|--------|
| API-18 | Corrida de leitura/escrita no consumo do token de redefinição | `updateMany` condicional (`where: { id, usedAt: null }`) e checar `count` | ✅ api#188 (commit `1be60c5`: `count === 0` → o mesmo 400 de link inválido) |
| API-19 | Cadastro/troca de e-mail disputam a unique → 500 | capturar `P2002` → 409 | ✅ api#188 (commit `6b43182`: `PrismaUniqueFilter` global, `APP_FILTER` no `AppModule`; mesma mensagem da checagem, por e-mail ou CRMV; outros erros do Prisma seguem 500) |
| API-20 | Limite de 72 bytes da senha conta caracteres | **a API tem cópia própria** em `src/common/crypto/password.validators.ts` (`MaxLength`). Corrigir aqui junto com SH-02 (ou passar a usar o validador do shared) | 🚀 em produção (PetCardOrg/petcard-api#194): `de2754f`. `Buffer.byteLength` no decorator e na função `isStrongPassword` (formulário web de redefinição), com a mesma mensagem do shared. A cópia fica: o shared não exporta a versão em função |
| API-21 | Cadastro revela quais e-mails existem | avaliar custo/benefício (UX vs enumeração); no mínimo documentar a decisão | ✅ decidido (D6): **manter** o 409 "Email already registered" do cadastro de tutor e de vet. A mensagem clara vale mais para a UX, e o cadastro já tem rate limit. Sem mudança de código |
| API-22 | `Historico` sem paginação | paginação por cursor, alinhada com o DTO do shared | 🟦 em PR (P15, api#196): contrato `9cbb5c3` (shared 0.25.0); API `68bc601`, `GET /pets/:petId/historico-clinico?limit=&cursor=`, opcional (sem `limit`, tudo). Cada tabela busca até `limit + 1` depois do cursor; o desempate dentro da tabela segue a ordem do banco (a collation `en_US` ignora o hífen do UUID). e2e com empate no mesmo instante |

## ➕ Itens derivados (descobertos ao cruzar as auditorias)

### API-23 · Rota para descadastrar token de push (necessária ao MOB-01)
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P6 · **PR:** PetCardOrg/petcard-api#194
- **Onde:** `src/modules/notification/devices.controller.ts` só tem `@Post()`.
- **Correção:** `DELETE /devices/:token` autenticado, que só remove token do próprio tutor (idempotente: 204 mesmo se não existir). Opcional: remover tokens que o FCM devolve como `UNREGISTERED` no consumidor.
- **Aceite:** [x] testes de controller e service (dono, não-dono, inexistente); [x] OpenAPI regenerado (docs/api, 2026-11-03).
- **Resolução:** commit `5584ff6`. `DELETE /devices/:token` (só TUTOR, 204) chama `NotificationService.unregisterDevice`, um `deleteMany` por `token` **e** `tutorId`: token de outro tutor ou inexistente não casa e responde 204 igual. O app manda o token com `encodeURIComponent` (o FCM tem `:`). A parte opcional já existia: o consumidor apaga o token quando o FCM devolve `UNREGISTERED`.

### API-24 · PATCH de registros clínicos precisa aceitar `null` para limpar campo (necessário ao WEB-05)
- **Status:** 🚀 em produção · **Fase:** 3 · **Pacote:** P6 · **PR:** PetCardOrg/petcard-api#194
- **Contexto:** os DTOs do shared usam `@IsOptional()`, que já deixa `null` passar na validação. Falta confirmar que os services (`vaccine`, `deworming`, `medication`, `vet-note`) repassam `null` ao Prisma e não o descartam.
- **Aceite:** [x] teste por service: `PATCH { next_dose_at: null }` grava `NULL`; [x] campos obrigatórios continuam rejeitando `null`.
- **Resolução:** commit `0921112`. O problema existia nas datas: `next_dose_at` (vacina, vermífugo) e `end_date` (medicação) viravam `undefined` com `null` e o valor antigo ficava. Os textos opcionais (`notes`, `veterinarian_name`, `prescricao`, `observacoes`) já gravavam `NULL`. E os obrigatórios **não** rejeitavam `null`: o `@IsOptional` deixa passar, o nome nulo virava 500 no Prisma e a data aplicada nula era ignorada. Novo `health/campos-anulaveis.ts`: `dataAnulavel` e `assertObrigatoriosNaoNulos` (400 com a lista dos campos), usados nos 3 services de saúde e no de nota clínica (`diagnostico`). Testes de integração nos 3 controllers (passam pelo `ValidationPipe`) e de service na nota. O sync do Google Agenda já apaga o evento quando a data some. A correção de raiz no DTO virou o SH-09.

### API-25 · Excluir agendamento com a fila fora deixa o evento órfão no Google
- **Status:** 🚀 em produção · **Fase:** 6 · **Pacote:** P13 · **PR:** PetCardOrg/petcard-api#192
- **Origem:** API-08 (P7). O `remove` publica o DELETE e apaga a linha; se a publicação falha, nada mais sabe do `google_event_id`.
- **Correção:** exclusão lógica: marcar `PENDING_DELETE` (o status já existe no enum), esconder a linha das listagens e deixar o worker ou o `syncAllPending` apagar o evento e a linha.
- **Aceite:** [x] teste: publisher lança no DELETE → a linha fica `PENDING_DELETE`, some das listagens e o `syncAllPending` apaga o evento.
- **Resolução:** só quando a publicação falha: com a fila no ar, o `remove` segue apagando a linha. A linha `PENDING_DELETE` some de `findAllForTutor`, `findUpcoming`, `findOne`/`update`/`remove` (404) e do lembrete de consulta; o `syncAllPending` apaga o evento e depois a linha (se o Google falhar, ela fica para a próxima); `syncAppointment` ignora a linha, para um CREATE/UPDATE ainda na fila não a ressuscitar; `disconnect` descarta as exclusões pendentes. Sem migration (o status já existia). Commit `a2af1f9`.

### API-26 · Anexos e PNGs de QR ficam no S3 quando pet ou tutor é excluído
- **Status:** 🚀 em produção · **Fase:** 6 · **Pacote:** P13 · **PR:** PetCardOrg/petcard-api#192
- **Origem:** API-10 (P7). `Anexo` sai em cascata com o pet (`onDelete: Cascade`), mas o `removePrivate` só roda na exclusão avulsa do anexo (`anexo.service.ts`). Os PNGs de QR da carteira e da coleira (`qr-code.consumer.ts`, `uploadBuffer`) também não são apagados.
- **Correção:** antes de excluir pet ou tutor, ler as chaves dos anexos e as URLs dos QRs; depois, apagar por melhor esforço (`removePrivate` / `discardFile`).
- **Aceite:** [x] teste: excluir pet com anexo e QR chama a remoção das duas chaves.
- **Resolução:** `pet-arquivos.ts` lê, antes do delete, foto, URLs dos QRs da carteira e da coleira e chaves dos anexos (inclusive os com exclusão lógica, que também saem em cascata); depois do delete, `discardFile` / `discardPrivate` (novo no `UploadService`, por melhor esforço). Usado no `PetService.remove` e no `TutorService.removeById`. Commit `5db311d`.

### API-27 · Agendamento aceita `scheduled_at` no passado
- **Status:** 🚀 em produção · **Fase:** 6 · **Pacote:** P13 · **PR:** PetCardOrg/petcard-api#187
- **Origem:** MOB-13 (P11). O mobile passou a recusar no formulário, mas `CreateAppointmentDto` e `UpdateAppointmentDto` (`src/modules/appointment/dto/`) só têm `@IsDateString()`, e o service não confere.
- **Correção:** recusar `scheduled_at` no passado na criação e na remarcação, com a mesma regra do mobile: na edição, só quando o horário muda. Considerar uma folga de alguns minutos para relógio de aparelho atrasado.
- **Aceite:** [x] teste: `POST` com data de ontem → 400; [x] `PATCH` só do título num compromisso passado → 200.
- **Resolução:** `recusarHorarioNoPassado` no `AppointmentService`, com 5 minutos de folga: na criação sempre, na edição só quando o `scheduled_at` muda (o app reenvia o horário atual). Os testes com datas fixas de 2026 já passadas foram para 2099 ou para um relógio fixo, sem mudar as assertivas. Commit `083bb41`.

### API-28 · Excluir a conta de veterinário não pede a senha
- **Status:** 🟦 em PR (api#196, web#74) · **Fase:** 3 · **Pacote:** P15 · **PR:** PetCardOrg/petcard-api#196, PetCardOrg/petcard-web#74
- **Origem:** API-04 (P6). O título do P6 fala em "excluir conta (tutor e vet)", mas o aceite do API-04 e o SH-03 só cobriram o e-mail do vet: `DELETE /veterinarios/me` (`veterinario.controller.ts`, `removeMe`) ainda apaga a conta só com o token.
- **Correção:** `DeleteVeterinarioDto { senha_atual }` no shared (release nova) e `assertSenhaAtualConfere` no `VeterinarioService.remove`. Na web, pedir a senha no fluxo de exclusão.
- **Aceite:** [x] `DELETE /veterinarios/me` sem senha → 400, com senha errada → 401; [x] web pede a senha.
- **Resolução:** contrato no shared: `DeleteVeterinarioDto { senha_atual }` (`ead3abb`, shared#86). API `e274cc8`: `remove` confere a senha (`assertSenhaAtualConfere`) antes de apagar; testes de service, de integração da rota (400 sem senha) e e2e (400, 401 e a conta fica; 204 com a senha). Web `34bf6a5`: a confirmação da exclusão pede a senha atual; senha errada mostra a mensagem sem deslogar. **Publicar API e web juntas.**

### API-29 · `tsc` com os testes acusa 6 erros de tipo nos specs
- **Status:** ⬜ pendente · **Fase:** 6 · **Pacote:** a definir · **PR:** —
- **Origem:** P15, ao conferir a compilação da API contra o shared 0.25.0. O `tsc --noEmit -p tsconfig.json` (que inclui os specs) acusa 6 erros, os mesmos com o shared 0.24.1; o `tsconfig.build.json` (sem specs) passa, e o Jest não faz checagem completa de tipos, então ninguém via.
- **Onde:** `calendar/__tests__/google-calendar.service.spec.ts:24,28` (spread sem tupla), `card/__tests__/card.service.spec.ts:239,385` (cast de `CarteiraDigitalPublicResponseDto` para `Record<string, unknown>`), `health/vaccine/__tests__/vaccine.service.spec.ts:190,211` (`veterinario` fora do tipo do mock do Prisma).
- **Correção:** ajustar os 6 pontos e incluir `tsc --noEmit -p tsconfig.json` no `npm run lint` ou no CI, para os specs voltarem a ser checados.
- **Aceite:** [ ] `tsc --noEmit -p tsconfig.json` sem erro; [ ] checagem no CI.
- **Resolução:** —

---

## Não verificado pela auditoria (cobrir ao trabalhar na área)
- Suíte E2E (precisa de Postgres) e CI.
- Configuração real de Render/Supabase/CloudAMQP (`CRMV_PROVIDER`, plano).
- Portas SMTP no Render (hoje o envio é via API HTTP da Brevo, PR #178, então provavelmente já resolvido).
- Migrations, `medication`, `deworming`, `geocoding.service.ts`, DTOs fora de auth/coleira, `prisma/seed.ts`.
