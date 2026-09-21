# ADR-010: Infra de staging em serviços com camada gratuita (Render + Supabase + CloudAMQP)

**Data:** 2026-09-21
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

A **PC-092** (api#42) pedia deploy automático de staging após merge na `develop`, com ambiente
acessível por URL. A tentativa original mirava AWS ECS Fargate; uma sessão anterior já havia
avaliado ECS Fargate, App Runner e EC2+RDS no Free Tier e revertido tudo — a conta AWS usada é
nova, sem nenhuma infraestrutura provisionada, e nenhuma das opções fechava em custo zero
**garantido**: mesmo o Free Tier tem tetos (750h/mês de EC2 t2.micro, RDS separado) fáceis de
estourar sem querer, e provisionar do zero (VPC, ECR, ALB, RDS) exigiria Terraform/IaC só para
não repetir erro manual. O projeto é uma conta pessoal de estudante — o orçamento real é US$0.

## Decisão

Usar três serviços com camada gratuita **permanente** (não Free Tier por tempo/crédito), sem
Terraform: **Render** (API), **Supabase** (Postgres) e **CloudAMQP** (RabbitMQ). Nenhum exige
cartão de crédito válido para o plano free, e a configuração inteira é feita nos painéis — sem
IaC.

### Render — Web Service via Dockerfile

- Plano Free (0.1 CPU / 512 MB), branch `develop`, auto-deploy nativo a cada push (**"On
  Commit"**) — não foi necessário nenhum workflow de GitHub Actions novo para CD; o próprio Render
  observa o repositório.
- O build precisa resolver `@petcardorg/shared`, pacote privado do GitHub Packages, o que exige
  `NODE_AUTH_TOKEN`. O Render suporta `RUN --mount=type=secret` do BuildKit apontando para um
  "Secret File" do próprio painel — o token nunca fica gravado nas camadas da imagem (diferente de
  usar `ARG`, que o Docker grava em `docker history`).
- `prisma` foi movido de `devDependencies` para `dependencies`: o Render free não tem
  "pre-deploy command" separado do start, então `docker/entrypoint.sh` roda
  `npx prisma migrate deploy` a cada boot, antes de subir o processo — o CLI precisa sobreviver ao
  `npm prune --omit=dev` da imagem final.
- Região `Ohio (US East)` — o Render não oferece região na América do Sul no plano free; foi a
  opção geograficamente mais próxima do Brasil entre as disponíveis (Oregon, Frankfurt, Ohio,
  Singapore, Virginia).

### Supabase — Postgres + PostGIS

- Projeto dedicado (`petcard-staging`, organização própria `PetCard`, separada dos projetos
  pessoais do autor) — o plano free permite só 2 projetos ativos por conta, o que já exigiu pausar
  um projeto pessoal não relacionado para abrir vaga.
- Extensão `postgis` habilitada uma única vez via SQL Editor (`create extension if not exists
  postgis;`) — não faz parte de nenhuma migration do Prisma.
- Connection string no modo **Session pooler** (porta 5432), não Transaction pooler nem conexão
  direta: o painel do Supabase indica que o Transaction pooler e a conexão direta usam IPv6 por
  padrão nessa configuração de conta, exigindo um add-on pago de IPv4 para redes IPv4-only como a
  do Render. O Session pooler é "IPv4 proxied for free" e, como roda em modo sessão (não
  transaction), suporta prepared statements normalmente — permite usar a mesma URL tanto para
  runtime quanto para `prisma migrate deploy`, sem precisar de uma `DIRECT_URL` separada no schema.

### CloudAMQP — RabbitMQ (Little Lemur, free)

- O plano free dá exatamente **1 vhost** por instância. Como a PC-093 (produção) vai compartilhar
  a mesma instância mais adiante, o isolamento entre ambientes é feito **por nome de fila/DLQ**, via
  env var (`RABBITMQ_QR_CODE_QUEUE=qr-code.generate.staging` etc.), não por vhost — que não existe
  como opção separada nesse plano.
- **Pendência conhecida, não resolvida aqui:** os nomes das exchanges de dead-letter
  (`QR_CODE_DLX`, `NOTIFICATION_PUSH_DLX`, `CALENDAR_SYNC_DLX` em
  `src/modules/queue/queue.constants.ts`) são constantes fixas no código, não vêm de env var. Uma
  exchange `direct` roteia por routing key para **todas** as filas ligadas a ela — se a futura prod
  (PC-093) declarar uma DLQ com nome diferente mas ligada à mesma exchange fixa com a mesma routing
  key (`"dead"`), mensagens mortas de um ambiente vão parar na fila do outro. Resolver isso (tornar
  o nome da exchange configurável, ou dar um routing key por ambiente) fica para quando a PC-093
  for implementada — hoje só staging existe, então não há colisão real ainda.

### AWS S3 — mantido, fora da decisão de custo zero garantido

O upload de fotos (perfil de pet/vet/tutor, foto de clínica) já usa o SDK da AWS S3 diretamente,
sem presigned URL — o backend sobe o arquivo e devolve uma URL pública fixa
(`https://bucket.s3.region.amazonaws.com/key`). Decisão: manter S3, com um bucket dedicado de
staging (`petcard-uploads-staging`, us-east-1) e um usuário IAM próprio
(`petcard-api-s3-staging`), com policy customizada restrita a esse bucket (`PutObject`,
`GetObject`, `DeleteObject` só em `petcard-uploads-staging/*`) — nunca as credenciais nem a policy
do bucket de produção. O bucket precisou de uma policy de leitura pública (`s3:GetObject` para
`Principal: "*"`) restrita ao próprio bucket, já que os objetos são servidos por URL direta sem
autenticação (mesmo padrão do bucket de produção).

Diferente de Render/Supabase/CloudAMQP, o S3 **não é custo zero garantido** — é cobrado por
armazenamento e requisição, ainda que o valor esperado para um app de demonstração seja poucos
centavos por mês. Avaliou-se trocar por Cloudflare R2 (S3-compatible, camada gratuita permanente
de 10GB), mas optou-se por manter S3 para não introduzir mais uma conta/credencial nesta etapa,
aceitando o custo residual.

## Consequências

**A favor**

- As três peças centrais (API, banco, fila) ficam em camada gratuita permanente, sem cartão
  obrigatório e sem IaC — consistente com o orçamento zero do projeto.
- Nenhum workflow de CI/CD novo: o Render observa `develop` nativamente.
- Isolamento de staging/prod na mesma instância CloudAMQP é possível via nome de fila, sem
  depender de vhost dedicado.

**Contra, e assumido**

- **Cold start do plano free do Render:** o serviço "dorme" após ~15 min de inatividade; a
  primeira requisição depois disso pode levar bem mais que o normal para responder (o próprio
  Render avisa "delay requests by 50 seconds or more"). Isso é esperado e não é bug — mas vai
  aparecer nos prints/vídeo da Fase 3 como um UC "lento" na primeira tentativa. Rodar um request de
  aquecimento antes de gravar evidências evita esse artefato na demo.
- **Sem região no Brasil no Render free** — latência extra (Ohio, não São Paulo) para todo
  tráfego. Aceitável para uma demo, não para produção real.
- **DLX compartilhado entre staging e a futura prod** (ver seção CloudAMQP acima) — pendência
  registrada, não bloqueia nada hoje porque só staging existe.
- **S3 não é gratuito** — custo residual de poucos centavos/mês, aceito conscientemente em troca
  de não introduzir mais uma conta nesta etapa.
- Bucket de staging com leitura pública por política (não por ACL) — qualquer objeto colocado
  nele é publicamente legível por URL direta; é o mesmo modelo do bucket de produção, não uma
  regressão, mas vale lembrar na hora de decidir o que sobe para lá.

## Alternativas consideradas

**AWS ECS Fargate / App Runner / EC2+RDS Free Tier.** Rejeitadas (decisão já tomada antes deste
ADR, registrada aqui por completude): nenhuma fecha em custo zero garantido numa conta nova sem
infraestrutura provisionada, e o provisionamento do zero exigiria IaC só para reduzir risco de erro
manual — desproporcional para o escopo de uma demo de TCC.

**CloudAMQP Transaction pooler / conexão direta do Supabase, em vez do Session pooler.** O
Transaction pooler é a opção usualmente recomendada para aplicações serverless/stateless, mas nesta
conta especificamente o painel indica IPv6 por padrão com add-on pago para IPv4 — o Session pooler
resolve com o mesmo custo zero e sem exigir uma `DIRECT_URL` extra para migrations.

**Cloudflare R2 no lugar do S3.** Fecharia em custo zero garantido e é S3-compatible (o SDK
`@aws-sdk/client-s3` funcionaria trocando só endpoint/credenciais). Não escolhida agora para não
somar mais uma conta/credencial à configuração desta issue; fica como opção se o custo do S3 se
tornar um problema real.
