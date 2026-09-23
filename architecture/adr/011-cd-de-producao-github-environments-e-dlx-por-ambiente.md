# ADR-011: CD de produção com GitHub Environments e isolamento de DLX por ambiente

**Data:** 2026-09-23
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

A **PC-093** (api#43) pedia CD para produção com dois critérios de aceite: deploy só a partir da
`main` e aprovação manual obrigatória no GitHub. A PC-092 (ADR-010) já tinha resolvido staging com
o auto-deploy nativo do Render ("On Commit"), mas esse recurso **não tem conceito de aprovação** —
qualquer push na branch observada dispara deploy direto. Produção precisava de um mecanismo
diferente.

Compartilhar CloudAMQP com staging (decisão já registrada no ADR-010) também deixou de ser só uma
pendência teórica: com produção passando a existir de verdade, a exchange de dead-letter fixa no
código (`QR_CODE_DLX` etc.) virou um risco real de vazamento de mensagem morta entre ambientes.

## Decisão

### Aprovação manual via GitHub Environments + Deploy Hook

Sem suporte nativo do Render para aprovação, a solução ficou em duas metades:

- **GitHub Environment `production`**, com **required reviewers** (Álvaro e Camila) configurado no
  painel do repo (Settings → Environments) — não é algo expresso no YAML do workflow, é estado do
  repositório.
- **Workflow `.github/workflows/cd-production.yml`**, gatilho `push` restrito a `branches: [main]`
  mais `workflow_dispatch` (usado só para validar o pipeline sem depender de um push real). O job
  `deploy` referencia `environment: production` — é essa referência que faz o GitHub Actions
  pausar o run e exigir aprovação antes de rodar qualquer step. Depois de aprovado, o job chama o
  **Deploy Hook** do Render (URL secreta gerada por serviço, guardada como
  `RENDER_DEPLOY_HOOK_PROD` no secret do Environment, não em secret de repositório — escopo mais
  estrito) via `curl -X POST`.

O serviço `petcard-api` (produção, separado de `petcard-api-staging`) foi criado com
**Auto-Deploy desligado** — o único gatilho de deploy é o Deploy Hook chamado pelo workflow
aprovado, nunca o push direto observado pelo Render.

### Validação sem promover o merge develop→main

`workflow_dispatch` via CLI/API só pode disparar um workflow que já existe na branch **default**
do repositório (`main`) — a tentativa inicial de rodar a partir da branch de feature falhou com
404. Isso forçou uma escolha: esperar a PC-105 para testar de verdade, ou colocar só o arquivo do
workflow na `main` adiantado.

Optou-se por um **PR mínimo direto para `main`** contendo *apenas* `cd-production.yml` (PR #167),
sem nenhum outro código — commit isolado, sem diff nenhum quando o merge grande da PC-105
acontecer. É uma exceção deliberada e documentada ao "develop → main segurado", diferente da
exceção já registrada do petcard-docs#47 (aquela foi um descuido; esta é intencional e
autocontida a um arquivo de infraestrutura de CI, não a código de produto).

A validação em si rodou em duas etapas:

1. Um `workflow_dispatch` disparado pelo autor (Ricardo) ficou preso em "Waiting" — o painel
   confirmou **"Review needed from alvaro-unifor or camilampinheiro"**, sem opção de auto-aprovar.
   Prova que a aprovação não pode vir de quem não está na lista de reviewers.
2. Um segundo `workflow_dispatch`, aprovado de fato pelo Álvaro, completou o job `deploy` e o log
   mostrou a resposta do Render: `{"deploy":{"id":"dep-daq2dmm0tbcc73dathpg"}}` — o Deploy Hook
   funcionou ponta a ponta.

O deploy resultante **falhou no build** (`open Dockerfile: no such file or directory`) — resultado
esperado, não um defeito do pipeline: o `Dockerfile` de produção (PC-092) só existe na `develop`,
e é exatamente esse código que continua segurado até a PC-105 promover `develop → main` de
verdade. O objetivo desta validação era o mecanismo de aprovação + disparo, não um deploy
funcional — isso só faz sentido depois que a `main` tiver o app real.

### Um efeito colateral encontrado: push também dispara o workflow

O merge do PR #167 para `main` **também disparou o workflow via `push`**, além do
`workflow_dispatch` manual — porque o arquivo já existia no momento do push. Isso é o
comportamento correto e esperado do trigger `push: branches: [main]` (é literalmente o gatilho que
a PC-105 vai usar de verdade), mas gerou um run duplicado nesta validação, cancelado manualmente
sem consequência (o gate de aprovação também o teria bloqueado).

### Isolamento de DLX por ambiente (correção retroativa ao ADR-010)

A pendência registrada no ADR-010 — exchanges de dead-letter fixas no código
(`src/modules/queue/queue.constants.ts`) — foi resolvida antes de produção passar a existir de
verdade, como o próprio ADR-010 já previa que seria necessário. As três exchanges saíram das
constantes e viraram configuração:

```
RABBITMQ_QR_CODE_DLX=qr-code.dlx           (staging: .staging · produção: .prod)
RABBITMQ_NOTIFICATION_PUSH_DLX=notification.push.dlx
RABBITMQ_CALENDAR_SYNC_DLX=calendar.sync.dlx
```

A routing key (`"dead"`) continua fixa — o isolamento é por nome de exchange, não por routing key,
seguindo o mesmo padrão já usado para os nomes de fila (`RABBITMQ_QR_CODE_QUEUE` etc.). Produção
usa sufixo `.prod` explícito nas nove variáveis de fila/DLQ/DLX (simétrico ao `.staging` do
staging) — descartada a alternativa de deixar produção sem sufixo (nome "nu"), para não haver
ambiente privilegiado e reduzir o risco de um erro de configuração em qualquer um dos dois lados
colidir silenciosamente com o outro.

### Infra de produção provisionada

- **Render:** Web Service `petcard-api` (branch `main`, Docker, plano free, Auto-Deploy off, região
  Ohio — mesma do staging).
- **Supabase:** projeto `petcard-prod`, em **conta separada** da conta que hospeda
  `petcard-staging` — o plano free permite só 2 projetos ativos por conta administradora, e os dois
  slots da conta original já estavam ocupados (staging + um projeto pessoal pausado). PostGIS
  habilitado via SQL Editor; Data API do Supabase desligada na criação (a API fala com o Postgres
  só via Prisma, nunca via `supabase-js`/PostgREST — deixar a API REST autogerada ligada seria
  superfície de ataque exposta sem uso sobre dado clínico). Connection string no modo **Session
  pooler**, mesmo motivo do staging (IPv4 sem addon pago).
- **CloudAMQP:** mesma instância Little Lemur do staging (plano free permite só 1 instância por
  conta) — isolamento por nome de fila/DLX com sufixo `.prod`, não por vhost dedicado.
- **S3:** bucket dedicado `petcard-uploads-prod` (us-east-1, mesmo padrão do staging: ACLs
  desabilitadas, bloqueio de acesso público desligado + bucket policy própria restrita a
  `s3:GetObject` público) e usuário IAM dedicado `petcard-api-s3-prod` com policy inline restrita
  a `PutObject`/`GetObject`/`DeleteObject` só nesse bucket — sem reaproveitar o usuário/policy do
  staging nem do bucket informal `petcard-uploads-dev` que já existia na conta.

## Consequências

**A favor**

- Aprovação manual é garantida pelo GitHub (Environment protection rule), não por convenção ou
  disciplina de equipe — testado e confirmado que um não-reviewer não consegue aprovar.
- Deploy de produção só é possível a partir da `main`, nunca de outra branch, e só depois de
  aprovação — os dois critérios de aceite da PC-093 estão satisfeitos e validados, não só
  implementados.
- O vazamento de DLQ entre staging e produção deixou de ser uma pendência hipotética — está
  corrigido antes de produção rodar código de verdade.
- A validação do gate não exigiu adiantar nenhum código de produto para a `main` — só o arquivo do
  workflow, que já vai estar lá sem diff quando a PC-105 acontecer.

**Contra, e assumido**

- **Exceção ao "develop → main segurado":** o PR #167 quebrou a regra geral de só entrar em `main`
  pela PC-105/PC-108. Diferente da exceção já registrada do petcard-docs#47 (que foi um descuido
  não-intencional), esta foi deliberada, documentada e escopada a um único arquivo de CI sem
  relação com código de produto — mas ainda assim é uma exceção, e outra pessoa retomando este
  histórico precisa saber que ela existe.
- **Produção não tem deploy funcional ainda** — só foi provado que o mecanismo de aprovação +
  disparo funciona. O primeiro deploy de verdade só vai acontecer (e só pode ser testado de
  verdade) depois que a PC-105 promover o código.
- **Reaproveitar CloudAMQP entre ambientes** continua sendo uma dependência de disciplina de nome
  de fila — o isolamento por exchange configurável reduz o risco de vazamento de DLQ, mas não
  impede alguém de esquecer o sufixo `.prod`/`.staging` numa variável nova amanhã.
- **`FCM_ENABLED=true` em produção, `false` em staging** — assimetria intencional (produção tem
  credenciais reais de um projeto Firebase compartilhado com o app mobile; staging nunca teve). Vale
  registro para não confundir quem comparar as duas configurações lado a lado.
- **`CRMV_PROVIDER=infosimples` em produção, `stub` em staging** — também assimetria intencional:
  staging usa stub de propósito para não gastar dinheiro em teste/demo; produção usa o provedor
  real. Consequência prática: qualquer teste ou UC rodado contra produção que valide CRMV vai gerar
  custo real por chamada.
- Cinco variáveis de ambiente do serviço de produção (`CORS_ORIGINS`, `PUBLIC_CARD_BASE_URL`,
  `PUBLIC_COLLAR_BASE_URL`, `APP_DEEP_LINK_BASE`, `GOOGLE_CALENDAR_REDIRECT_URI`) ficaram com
  placeholder — dependem de domínios que só vão existir depois do deploy final (PC-105, AWS ECS +
  Vercel). Preencher antes disso não teria valor real.

## Alternativas consideradas

**Aprovação manual nativa do Render.** Investigado e descartado: o Render não tem um conceito de
"required approval" antes de um deploy disparado por push observado — só existe o Deploy Hook
(disparo por URL, sem aprovação embutida) e o auto-deploy on/off. A aprovação teve que vir de fora,
do GitHub Environments.

**Aguardar a PC-105 para validar o workflow.** Rejeitada como caminho único: teria deixado o
mecanismo de aprovação sem nenhuma prova de que funciona até o dia da promoção real de código, que
é tarde demais para descobrir um problema de configuração. O PR mínimo (só o workflow, sem código)
resolveu isso sem violar o espírito da regra de segurar `develop → main`.

**Routing key por ambiente em vez de exchange configurável (correção do DLX).** O ADR-010 já
cogitava as duas opções. Exchange configurável foi escolhida por seguir o mesmo padrão já usado
para os nomes de fila (uma env var por recurso), em vez de introduzir um mecanismo novo (routing
key dinâmica) só para as DLQs.
