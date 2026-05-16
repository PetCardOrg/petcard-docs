# ADR-002: Integrações Externas (M4) — Firebase Push + Google Calendar

**Data:** 2026-05-16
**Status:** Aceita
**Autores:** Ricardo Temporal, Álvaro Araújo, Camila Martins

## Contexto

A Milestone M4 do PetCard introduz duas integrações externas que fecham o loop de produto sem o tutor precisar abrir o app:

- **Lembretes proativos** de próxima dose (vacina, vermífugo, medicação) chegando como notificação push no celular do tutor.
- **Agendamento de consultas** no Google Calendar do tutor, com lembrete nativo do calendário.

Estas integrações trazem oito decisões arquiteturais novas que não aparecem nas milestones anteriores (M0-M3, todas internas à API ou usando Google Places de forma stateless sem OAuth). Em particular:

- A API precisa **iniciar** comunicação (outbound), diferente do padrão request/response usado até aqui.
- O Google Calendar exige **OAuth delegado por tutor** — uma segunda camada de identidade sobre o Auth0 já existente.
- Falha de serviço externo não pode derrubar fluxos do tutor, mas o sistema precisa de garantias de entrega.
- Credenciais sensíveis (service account do Firebase, tokens OAuth do tutor) demandam tratamento mais cuidadoso que `JWT_SECRET`.

Esta ADR consolida as 8 decisões discutidas em sessão de arquitetura em 2026-05-16, listadas em `petcard-api/CLAUDE.md` na seção "Decisões de arquitetura M4 (fechadas em 2026-05-16)".

## Decisão

### 1. Trigger das notificações de próxima dose: cron diário + idempotência

Job único roda 1x/dia no fuso do tutor, varre `vaccine`, `deworming` e `medication` filtrando por `next_dose_at` dentro da janela X dias (a definir por feature) e `last_notified_at IS NULL OR last_notified_at < next_dose_at - janela`. Cada registro recebe um campo `last_notified_at` que garante idempotência.

### 2. Modelo de device token: tabela dedicada 1:N

Tabela `device_token`:

```
id          uuid PK
tutorId     uuid FK -> tutor.id
token       text UNIQUE
platform    enum('ios','android')
createdAt   timestamptz
lastSeenAt  timestamptz
```

Um tutor pode registrar múltiplos devices (iPad + iPhone). Tokens que o FCM retornar como `UNREGISTERED` ou `INVALID_ARGUMENT` são deletados pelo worker (PC-068).

### 3. Fila de saída para push: RabbitMQ com DLX/DLQ

Cron publica em `notification.push` (exchange + queue + DLX + DLQ, padrão da `qr-code.generate` definido em M2). Worker (PC-068) consome, chama FCM, e em falha:

- Erros transientes → republica com `x-retry-count++` até limite, depois DLQ.
- Erros permanentes (token inválido) → deleta o `device_token` e ACK.

Cron fica rápido e idempotente; latência do FCM não trava o cron.

### 4. Storage de OAuth tokens do Google: tabela criptografada

Tabela `google_oauth_token`:

```
tutorId         uuid PK FK -> tutor.id (UNIQUE)
accessToken     text  -- AES-256-GCM(plain) base64
refreshToken    text  -- AES-256-GCM(plain) base64
expiresAt       timestamptz
scopes          text[]
createdAt       timestamptz
updatedAt       timestamptz
```

Criptografia simétrica AES-256-GCM com nonce aleatório por payload, prepended ao ciphertext. Chave em variável de ambiente `ENCRYPTION_KEY` (32 bytes base64), **separada de `JWT_SECRET`**. Em produção, lida do AWS Secrets Manager no boot (mesmo path da decisão #8).

Rotação de `ENCRYPTION_KEY`: re-encrypt em lote via migration controlada quando necessário; versionar o ciphertext com prefixo (`v1:<nonce>:<ciphertext>`) para suportar transição.

### 5. Fuso horário do tutor

Coluna `timezone` em `tutor` (nullable, default `'America/Fortaleza'`). Exposta em `PATCH /tutor/me`. Lida pelo cron (#1) para decidir "manhã do tutor" e pelo Calendar (criação de eventos) para evitar drift de UTC.

### 6. Política de re-notificação: 1 push por dose (MVP)

Quando uma dose entra na janela, dispara **um único** push. `last_notified_at` impede reenvio. Tutor que não interagiu fica sem reminders subsequentes — assumido como tradeoff aceitável para o MVP do TCC.

Política mais agressiva (escalonado 7d/1d/0d) fica documentada como evolução M5+, mas não entra em M4.

### 7. Padrão de degradação quando integração externa falha

Para qualquer endpoint em que a integração é **efeito colateral** (ex.: criar registro de vacina dispara push agendado, atualizar `appointment` atualiza Calendar):

- Falha do provedor externo → log `ERROR` estruturado + métrica + mensagem na DLQ correspondente.
- A request do tutor retorna sucesso normalmente.

**Exceção:** endpoints cujo objetivo *é* a integração (`POST /auth/google/connect`, `GET /auth/google/callback`) podem retornar `502 Bad Gateway` se o Google estiver indisponível, porque o tutor está explicitamente esperando aquela operação.

### 8. Credenciais Firebase em produção

Service account JSON do Firebase Admin SDK fica no AWS Secrets Manager. ECS Fargate (definido em PC-092) carrega o secret no boot via IAM role anexada à task definition. Falha no fetch do secret → boot da API falha (fail-fast).

Em dev, `.env` aponta para arquivo local fora do repo. `.env.example` documenta a variável com placeholder óbvio (`FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json`).

## Alternativas Consideradas

### Decisão #1 — Job-on-write em vez de cron (rejeitada)

Agendar a notificação no momento em que `next_dose_at` é setado/atualizado seria mais reativo, mas exige scheduler persistente (BullMQ/Redis ou tabela de jobs) e replanejamento toda vez que o tutor edita a dose. Adiciona complexidade sem benefício prático — o lembrete é diário no fuso do tutor, latência de até 24h é aceitável.

### Decisão #2 — Coluna `fcmToken` única no `tutor` (rejeitada)

Mais simples mas elimina multi-device. Tutor com iPad + iPhone só receberia push no último que registrou. Limita o produto sem ganho real.

### Decisão #3 — Chamada FCM síncrona no cron (rejeitada)

Sem worker adicional, código mais curto. Mas latência do FCM × volume de doses × janela do cron pode estourar o tempo do job, e retry vira código manual. A topologia DLX/DLQ já está pronta e foi paga em M2 — não reusá-la seria desperdício.

### Decisão #4 — Tokens OAuth em plaintext (rejeitada)

Mais rápido, mas viola secret hygiene do projeto. Refresh token do Google é uma credencial de longa duração — vazamento seria sério. Banca do TCC certamente apontaria.

### Decisão #4 — Tokens OAuth em AWS Secrets Manager por tutor (rejeitada)

Mais seguro em produção real, mas cada tutor seria um secret separado. Custo (≈ $0.40/secret/mês) e complexidade de gerenciamento são desproporcionais ao escopo do TCC. Encryption-at-rest em coluna do Postgres + `ENCRYPTION_KEY` no Secrets Manager é o suficiente.

### Decisão #5 — UTC fixo + conversão no cliente (rejeitada)

Funciona para exibição mas o servidor não sabe quando é "08:00 da manhã do tutor" para disparar o push em horário razoável. Quebra o caso de uso de lembrete proativo.

### Decisão #6 — Re-notificação em dias consecutivos (adiada para M5+)

Aumentaria adesão clínica (tutor que perde a notificação no D-7 ainda recebe no D-1) mas demanda campo `notification_attempts`, regras de parada e UX cuidadoso para não virar spam. Não é o caminho crítico do MVP.

### Decisão #7 — Falhar a request quando integração falha (rejeitada)

Consistência forte, mas viola o princípio do CLAUDE.md ("falha de serviço externo não derruba a API") e degrada UX dramaticamente — tutor não consegue cadastrar uma dose porque o FCM está com instabilidade. Inaceitável.

### Decisão #7 — Circuit breaker por provedor (rejeitada)

Padrão Resilience4j (abre o circuito após N falhas, pausa por X minutos) é útil em produção mas overkill para TCC. A DLQ já absorve picos de falha, e o volume esperado não justifica a engenharia adicional.

### Decisão #8 — Volume montado com arquivo JSON (rejeitada)

Funciona em EKS/EC2 com volumes EFS/EBS, mas casa mal com ECS Fargate (sem persistência de filesystem entre tasks). Exigiria gerenciamento manual a cada deploy.

### Decisão #8 — Adiar para M6 (rejeitada)

Adiar a decisão deixaria o `.env.example` ambíguo e bloquearia testes de staging em M4. Como Secrets Manager já está no plano de PC-092, vale fechar agora.

## Consequências

### Positivas

- **Reuso de topologia M2:** push e Calendar usam o mesmo padrão DLX/DLQ + retry da `qr-code.generate`, com custo de engenharia próximo de zero.
- **Boundary isolada:** `NotificationModule` e `CalendarModule` expõem facades; trocar FCM por outro provedor (ou Google Calendar por iCal/Outlook) não vaza para o resto da API.
- **Secret hygiene clara:** `ENCRYPTION_KEY` separado de `JWT_SECRET`, service account do Firebase no Secrets Manager. Banca tem o que avaliar.
- **OAuth delegado documentado:** primeira vez que o projeto delega identidade além do Auth0; padrão fica reutilizável para integrações futuras (Apple Health, Strava etc.).

### Negativas

- **Duas filas novas** (`notification.push` e `calendar.sync`) aumentam a superfície operacional do RabbitMQ — monitoramento e alarmes precisam crescer junto.
- **`ENCRYPTION_KEY` é um single point of failure:** perder essa chave significa perder acesso a todos os refresh tokens do Google armazenados. Backup da chave precisa estar em runbook explícito.
- **Tutor com timezone errado recebe push em hora ruim** — UX depende de o tutor manter `tutor.timezone` correto. Mitigado por default `America/Fortaleza` (público-alvo do TCC).

### Mitigações

- Métricas Prometheus para `notification.push.dlq.depth` e `calendar.sync.dlq.depth` configuradas em PC-068 e PC-069. Alarme se DLQ > 0 por mais de 1h.
- Runbook em `petcard-docs/runbooks/encryption-key-rotation.md` (a criar durante M4) descrevendo como gerar nova chave, re-encriptar tokens existentes e rotacionar no Secrets Manager.
- `PATCH /tutor/me` aceita timezone via dropdown padronizado (IANA tz database) na primeira tela de onboarding do mobile, antes de qualquer registro de dose.
