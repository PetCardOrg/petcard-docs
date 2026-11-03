# Auditoria do `petcard-api`

Auditoria feita sobre a branch `develop` (commit `c5ea009`). Relatório de leitura: nenhum código foi alterado.

## O que o repositório faz

O `petcard-api` é o backend NestJS do PetCard, uma carteira digital de saúde para pets. Tutores (donos) e veterinários verificados usam o sistema por um app mobile e um app web.

Ele guarda pets, vacinas, vermífugos, medicações, notas do vet e uma trilha de auditoria. Também serve a carteira pública por QR, a página da coleira (para quem acha um pet perdido), lembretes por push, sincronização com o Google Agenda e os fluxos de login por e-mail.

**Carga assumida:** algumas centenas de usuários, uma instância pequena. A documentação diz que a produção roda no plano gratuito do Render, com CloudAMQP (fila de mensagens hospedada).

**Resultado dos testes:** a suíte unitária passa (59 suítes, 655 testes).

## Resumo

| # | Grupo | Achado | Onde |
|---|-------|--------|------|
| 1 | Corrigir já | Limite de requisições conta o proxy, não o usuário | `src/main.ts` |
| 2 | Corrigir já | Lembretes só rodam se o servidor estiver acordado às 9h | `dose-reminder.service.ts`, `appointment-reminder.service.ts` |
| 3 | Corrigir já | Lembrete se perde se o RabbitMQ estiver fora no envio | `notification.service.ts` |
| 4 | Corrigir já | Token roubado permite tomar a conta do tutor de vez | `tutor.service.ts`, `tutor.controller.ts` |
| 5 | Corrigir já | Login com Google herda a senha de um atacante | `auth.service.ts` |
| 6 | Corrigir já | Qualquer CRMV real passa na verificação | `infosimples-crmv.validator.ts` |
| 7 | Corrigir já | Em produção, falta de variável liga o verificador de CRMV falso | `crmv.config.ts` |
| 8 | Deveria corrigir | Agendamento salvo, mas a API responde 500 | `appointment.service.ts` |
| 9 | Deveria corrigir | Tentativas da fila sem espera | três consumidores |
| 10 | Deveria corrigir | Upload sem limite e arquivos nunca apagados | `upload.controller.ts`, `upload.service.ts` |
| 11 | Deveria corrigir | Configuração de fila copiada em quatro lugares | `main.ts`, `queue.module.ts` e outros |
| 12 a 17 | Desejável | Melhorias pequenas | ver abaixo |

**Veredito:** o código é sólido no básico (guards seguros por padrão, tokens com hash e uso único, acesso do vet por vínculo com o pet, trilha de auditoria). Corrigir o achado 1 primeiro, porque quebra o login de todo mundo em produção. Depois os 4 a 7 (tomada de conta e bloqueio de CRMV) e os 2 e 3 (lembretes).

---

## Corrigir já

### 1. O limite de requisições conta o proxy, não o usuário
`src/main.ts` (não há `trust proxy` em lugar nenhum)

- **O que é:** Login, cadastro, carteira pública e coleira têm limite por IP (10 por minuto; reenvio de e-mail e verificação de CRMV permitem 3).
- **Problema:** O limitador lê `req.ip`, e o Express só usa o IP real do cliente se `trust proxy` estiver ligado. Atrás do proxy do Render, todos os usuários parecem o mesmo endereço e dividem um único balde. O 11º login em um minuto, somando todo mundo, recebe 429. Uma pessoa consegue travar todos os outros, e a demo ou a gravação do vídeo podem quebrar.
- **Correção:** Adicionar `app.set('trust proxy', 1)` antes do `listen` (a configuração é acessada por `app.getHttpAdapter().getInstance()`).
- **Se ignorar:** Usuários reais levam "muitas requisições" em produção, e o limite por IP não protege nada.

### 2. Os lembretes só rodam se o servidor estiver acordado às 9h
`dose-reminder.service.ts`, `appointment-reminder.service.ts`

- **O que é:** Dois `@Cron` dentro do processo web enviam os lembretes diários.
- **Problema:** No plano gratuito do Render o serviço dorme quando fica ocioso, e processo dormindo não executa cron. Não existe recuperação quando ele acorda. A documentação registra cerca de 13 segundos de cold start nesse plano.
- **Correção:** Disparar `scripts/run-reminders.ts` de fora, por exemplo com um workflow agendado do GitHub Actions ou um cron job do Render. Como paliativo, rodar uma vez também no boot (a lógica de reivindicação torna repetições seguras). Se a produção estiver num plano pago sempre ligado, este item vira "desejável".
- **Se ignorar:** Pushes de vacina e de consulta quase nunca saem no horário, e ninguém vê erro.

### 3. Um lembrete se perde se o RabbitMQ estiver fora na hora do envio
`notification.service.ts:80-130`

- **O que é:** `schedulePush` grava a notificação e depois a publica na fila.
- **Problema:** Se a publicação falha, o erro só vai para o log e a função ainda devolve as linhas. O código do lembrete entende "linhas devolvidas" como "enviado" e mantém `lastNotifiedAt`, então o registro nunca é tentado de novo. A linha fica `PENDING` sem nada que a varra. Um teste (`notification.service.spec.ts:140`) trava esse comportamento.
- **Correção:** Devolver só as linhas que foram publicadas e marcar como `FAILED` as que não foram. Se nenhuma foi publicada, devolver `[]` para o lembrete soltar a reivindicação.
- **Se ignorar:** Um soluço do broker às 9h descarta os lembretes do dia sem avisar.

### 4. Um token roubado permite tomar a conta do tutor de forma definitiva
`tutor.service.ts` (`updateById`, `removeById`), `tutor.controller.ts`

- **O que é:** O token do tutor vale 7 dias e a web o guarda em `localStorage`. A troca de senha do vet já exige a senha atual, com comentário explicando o motivo.
- **Problema:** `PATCH /tutors/me` troca o e-mail e `DELETE /tutors/me` apaga a conta e todos os dados dos pets, tendo só o token como prova. O atacante troca o e-mail para o dele, usa "esqueci a senha" e passa a ser dono da conta. A redefinição ainda invalida as sessões do dono verdadeiro.
- **Correção:** Exigir `senha_atual` para trocar o e-mail e para excluir, como no fluxo do vet. Para contas só-Google, exigir um ID token do Google recente.
- **Se ignorar:** Um token vazado vira perda permanente da conta.

### 5. O login com Google pode herdar a senha de um atacante
`auth.service.ts`, `googleLogin` (em torno das linhas 100-125)

- **O que é:** O login com Google vincula a uma conta existente com o mesmo e-mail.
- **Problema:** Qualquer pessoa pode cadastrar `vitima@x.com` com uma senha própria, porque o login não exige e-mail verificado. Quando a vítima entra depois com Google, as contas se unem e a senha do atacante continua funcionando.
- **Correção:** Ao vincular uma conta com `emailVerifiedAt` nulo, gravar `password: null` e `passwordChangedAt: new Date()`. Isso também derruba as sessões abertas do atacante.
- **Se ignorar:** A conta da vítima, com os dados de saúde dos pets, fica acessível para quem se cadastrou primeiro.

### 6. Qualquer CRMV real passa na verificação, quem quer que o digite
`infosimples-crmv.validator.ts:107-125`, `auth.service.ts` (`registerVeterinario`)

- **O que é:** CRMV é o número de registro profissional do vet, e a verificação dele protege todos os dados clínicos (ADR-005).
- **Problema:** O provedor devolve o nome do titular, mas ninguém o compara com o nome informado no cadastro. Números de CRMV são públicos, então qualquer pessoa se cadastra como vet com um número real e ativo e fica "verificada".
- **Correção:** Em `validate`, comparar `registro.nome` com o nome cadastrado (ignorando maiúsculas e acentos). Se forem diferentes, devolver `valid: false`. Fazer o mesmo na revalidação.
- **Se ignorar:** O bloqueio só barra quem não conhece nenhum número de CRMV.

### 7. Em produção, a falta de uma variável liga o verificador de CRMV falso sem aviso
`crmv.config.ts:9`, `veterinario.module.ts`

- **O que é:** `CRMV_PROVIDER` tem padrão `stub`, que aceita qualquer CRMV bem formado.
- **Problema:** `JWT_SECRET`, CORS, SMTP e a URL base da API se recusam a subir em produção quando faltam. O CRMV não, então uma variável esquecida desliga o bloqueio em silêncio.
- **Correção:** Em produção, tornar `CRMV_PROVIDER` obrigatório. Permitir `stub` só quando for definido explicitamente, com um aviso alto no boot.
- **Se ignorar:** O bloqueio de segurança pode estar desligado sem ninguém perceber.

---

## Deveria corrigir

### 8. Agendamento salvo, mas a API responde 500
`appointment.service.ts` (criar e atualizar)

- **O que é:** O serviço grava a linha e depois publica a mensagem de sincronização com o calendário.
- **Problema:** Se o RabbitMQ estiver fora, a publicação lança erro depois de a linha já ter sido salva. O app mostra erro, o usuário tenta de novo e o agendamento é criado duas vezes. O `PetService` já trata esse caso com try/catch.
- **Correção:** Capturar e registrar o erro de publicação, como `PetService.enqueueQrCodeGeneration` faz. A linha fica `PENDING_*` e o `syncAllPending` recupera depois.
- **Se ignorar:** Agendamentos duplicados a cada queda do broker.

### 9. As tentativas da fila acontecem sem espera
`notification-push.consumer.ts`, `qr-code.consumer.ts`, `calendar-sync.consumer.ts`

- **O que é:** Em caso de falha, cada consumidor republica a mensagem até 3 vezes e depois a manda para a fila de mensagens mortas.
- **Problema:** As 3 tentativas ocorrem em milissegundos, então uma queda curta do FCM ou do S3 gasta todas de uma vez. As filas de mensagens mortas não têm leitor, e essas mensagens se perdem.
- **Correção:** Esperar antes de republicar, por exemplo `await sleep(1000 * 2 ** retryCount)`. Funciona porque o `prefetchCount` é 1.
- **Se ignorar:** Falhas passageiras viram pushes `FAILED` definitivos.

### 10. Upload sem limite de requisições e arquivos nunca apagados
`upload.controller.ts`, `upload.service.ts:133`

- **O que é:** Qualquer usuário logado pode enviar imagens de 5 MB para o S3.
- **Problema:** O cadastro é aberto e a rota não tem throttle. `deleteFile` existe e tem teste, mas nada no app o chama. Trocar uma foto, ou excluir um pet, tutor ou vet, deixa o objeto antigo no bucket para sempre.
- **Correção:** Adicionar `@Throttle` na rota de upload. Chamar `deleteFile` ao trocar a foto ou remover a conta.
- **Se ignorar:** A conta do S3 cresce sem limite, e contas excluídas deixam fotos para trás (problema de LGPD).

### 11. A mesma configuração de fila está copiada em quatro lugares
`main.ts:60-110`, `queue.module.ts:25-95`, `rabbitmq-topology.service.ts`, os três consumidores

- **O que é:** Três filas, cada uma com opções quase idênticas repetidas em cada arquivo. As três funções `retryOrDlq` também são quase cópias.
- **Problema:** Adicionar uma fila, ou corrigir as tentativas (achado 9), exige editar cerca de 10 pontos.
- **Correção:** Criar um helper `rmqOptions(queue, dlx, dlqKey)` para `main.ts` e `queue.module.ts`, e um `retryOrDlq` compartilhado.
- **Se ignorar:** As cópias vão divergir com o tempo.

---

## Desejável

12. **O container roda como root** (`Dockerfile`): adicionar `USER node` antes do `ENTRYPOINT`. Uma falha em dependência rodaria como root.
13. **Erros de serviços externos vazam ou derrubam** (`places.service.ts:~175`, `infosimples-crmv.validator.ts:99`): o corpo do erro do Google vai para o cliente, e uma resposta não-JSON da Infosimples gera 500 em vez de 502. Registrar o corpo no log, devolver mensagem genérica e envolver `response.json()` em try/catch.
14. **O lembrete de dose se repete** (`dose-reminder.service.ts`): três cópias quase iguais da função de processamento mais dois `switch` de 3 casos. Um mapa de nome do modelo para o delegate do Prisma encolheria isso (cerca de 60 linhas).
15. **Comentários desatualizados:** `dose-reminder.service.ts`, `appointment-reminder.service.ts` e `.env.example` ainda citam ECS e CloudWatch, mas a stack é Render.
16. **Duas dependências de desenvolvimento sem uso:** `ts-loader` e `source-map-support` só aparecem no `package.json`. Remover.
17. **`googleapis` é enorme para um único uso:** `google-calendar.service.ts` usa só `google.auth.OAuth2` e o Calendar. `@googleapis/calendar` mais o `google-auth-library` já instalado reduziria o tamanho de instalação e o build no Render. Esta troca tem algum risco.

### Itens menores deixados de fora (5)

- O consumo do token de redefinição tem corrida de leitura e escrita.
- Cadastro e troca de e-mail disputam a constraint única (500 em vez de 409).
- O limite de senha de 72 bytes conta caracteres, não bytes.
- O cadastro revela quais e-mails já existem.
- O `Historico` não tem paginação.

---

## Enxuto

Cerca de -150 linhas (de 400 a 600 se o helper de filas e o colapso do lembrete de dose forem ambos feitos) e -2 dependências (`ts-loader`, `source-map-support`), mais 1 troca opcional (`googleapis`).

## Não verificado

- Os repos web, mobile e shared.
- A suíte E2E (precisa de Postgres) e os resultados do CI.
- A configuração real do Render, Supabase e CloudAMQP: não sei o plano de produção nem se `CRMV_PROVIDER` está definido lá.
- A política de portas SMTP do Render (o e-mail de saída pode estar bloqueado no plano gratuito).
- A pasta de migrations, os serviços `medication` e `deworming` (li o `vaccine`, que eles espelham), `geocoding.service.ts`, os DTOs fora de auth e coleira, e `prisma/seed.ts`.
