# ADR-014: Estudo — migrar staging e produção para uma VPS

**Data:** 2026-10-17
**Status:** Proposta (em discussão — decisão do time)
**Autores:** Álvaro Bezerra

## Contexto

Os ADRs 010–012 montaram staging e produção em camadas gratuitas de quatro provedores, com a
restrição de orçamento de **US$0 garantido**:

| Peça | Hoje | Limitação que aparece no uso |
| --- | --- | --- |
| API (staging e prod) | Render Free, Docker, região Ohio | Dorme após ~15 min; primeira requisição leva 50 s ou mais. 0,1 CPU / 512 MB. Sem região no Brasil. |
| Postgres + PostGIS | Supabase Free, dois projetos em **duas contas** diferentes | Limite de 2 projetos ativos por conta; projeto free pausa quando fica inativo; Session pooler obrigatório (IPv4). |
| RabbitMQ | CloudAMQP Little Lemur, **uma instância** para os dois ambientes | Um vhost só: o isolamento entre ambientes depende de sufixo `.staging`/`.prod` em nove variáveis (ADR-011). |
| Mídia | AWS S3, bucket por ambiente | Já é pago (centavos/mês). |
| Web | Vercel | Sem problema: estático por CDN, sem cold start. |

Na prática, o cold start da API é o que mais pesa: aparece na demo, no vídeo e em qualquer
teste manual (ADR-010 e 012 já registram o "request de aquecimento" como paliativo). Somam-se a
isso as contas espalhadas (Render, duas no Supabase, CloudAMQP, AWS, Vercel) e as cinco variáveis
de produção que dependem de domínio.

A pergunta deste estudo: **vale trocar Render + Supabase + CloudAMQP por uma VPS?**

## O que uma VPS mudaria

O `docker/docker-compose.yml` da API já sobe Postgres/PostGIS, RabbitMQ e Redis localmente, e o
`Dockerfile` de produção (PC-092) já roda `prisma migrate deploy` no boot. A topologia numa VPS é
basicamente esse compose, mais um proxy reverso com TLS:

```
                 ┌──────────────────────── VPS ────────────────────────┐
 Vercel (web) ──▶│ Caddy (TLS automático, Let's Encrypt)               │
 App mobile ────▶│   api.<dominio>          → petcard-api (prod)       │
                 │   api-staging.<dominio>  → petcard-api (staging)    │
                 │ postgis/postgis:16-3.4  (um banco por ambiente)     │
                 │ rabbitmq:3-management   (um vhost por ambiente)     │
                 │ redis (já no compose; segue sem uso em código)      │
                 └─────────────────────────────────────────────────────┘
                 S3 (mídia) e Vercel (web) continuam como estão
```

**Ganhos**

- **Fim do cold start.** O processo fica sempre de pé.
- **Latência:** com um provedor em São Paulo, saem os ~130–150 ms de ida e volta até Ohio em
  cada chamada do app.
- **Vhost por ambiente no RabbitMQ.** O isolamento por sufixo do ADR-011 deixa de ser
  necessário (pode ficar, sem custo).
- **Uma conta, um painel** para API, banco e fila, em vez de quatro contas.
- **Recursos:** 4–8 GB de RAM contra 512 MB do Render Free. Dá folga para os dois ambientes e
  para o build.
- **Sem limite de projetos nem pausa do banco.**

**Custos e riscos**

- **Deixa de ser US$0** (exceto Oracle Always Free, ver abaixo). Revoga a restrição de fundo do
  ADR-010 e precisa de cartão em nome de alguém do time.
- **Operação vira responsabilidade nossa:** atualizações de segurança do SO, firewall, SSH só por
  chave, `fail2ban`, renovação de TLS (o Caddy automatiza), monitoramento e logs. Hoje os
  provedores cuidam disso.
- **Backup é nosso.** O Supabase faz backup diário no plano free; numa VPS precisa de `pg_dump`
  agendado para fora da máquina (o S3 já existe e serve, por centavos).
- **Ponto único de falha:** staging e produção na mesma máquina. Uma VPS caída derruba os dois.
- **Domínio:** o TLS automático precisa de um nome. Sem domínio próprio (ADR-012), dá para usar
  um DNS gratuito (DuckDNS, `sslip.io`/`nip.io` com o IP). Com domínio próprio (~R$40/ano
  `.com.br`), as cinco variáveis de domínio do ADR-012 mudam uma única vez.

## Opções de provedor

Preços de outubro de 2026, levantados em comparadores e nos sites dos provedores. **Mudam com
frequência** (a Hetzner reajustou preços duas vezes em 2026): conferir na hora de contratar.

| Provedor | Plano de referência | Preço aprox. | Região BR | Observação |
| --- | --- | --- | --- | --- |
| **Hostinger** | KVM 2: 2 vCPU, 8 GB, 100 GB NVMe | R$ 35/mês na promoção com fidelidade; ~R$ 90/mês na renovação | Sim (São Paulo) | Fatura em reais. O preço baixo depende de contrato longo pago adiantado. |
| **Contabo** | Cloud VPS 10: 4 vCPU, 8 GB, 75 GB NVMe | ~€ 4,50/mês (+ taxa de região fora da UE) | Verificar | Muito recurso pelo preço; desempenho de disco e CPU variável (overselling). |
| **Hetzner** | CX23: 2 vCPU, 4 GB, 40 GB | ~€ 4/mês + IPv4 | Não (UE/EUA) | Painel e API muito bons; sem Brasil, a latência fica parecida com a de hoje. |
| **Magalu Cloud** | VM pequena | Em reais, sob consulta | Sim | Nuvem nacional, cobra em reais. Ecossistema mais novo. |
| **Oracle Cloud** | Always Free Ampere A1 (ARM) | Grátis | Sim (São Paulo/Vinhedo) | Único que mantém US$0. A cota relatada em 2026 caiu para 2 OCPU / 12 GB, e há relatos frequentes de "sem capacidade" em São Paulo e de contas ociosas encerradas. Imagem precisa ser `arm64`. |

Dimensionamento: **4 GB** de RAM aguentam os dois ambientes apertado (Postgres, RabbitMQ e duas
APIs Node). **8 GB** dão folga. 2 vCPU bastam.

## Impacto no CD (ADR-011)

O gate de aprovação continua no GitHub Environment `production`. Muda só o último passo:

| Hoje | Na VPS |
| --- | --- |
| Staging: Render observa `develop` ("On Commit"). | Workflow em push na `develop`: build da imagem → push no GHCR → `ssh` na VPS → `docker compose pull && up -d` do serviço de staging. |
| Produção: job aprovado chama o Deploy Hook do Render. | Mesmo job aprovado; em vez do `curl` no hook, o mesmo `ssh` + `compose up -d` do serviço de produção. |
| `NODE_AUTH_TOKEN` como Secret File do Render (BuildKit). | O build roda no Actions; o token fica em secret do GitHub e já usa `--mount=type=secret`. A VPS só puxa a imagem pronta. |

Secrets novos: chave SSH de deploy (por ambiente) e o host. As variáveis da API vão para
arquivos `.env` por ambiente na VPS, fora do repositório.

## Plano de migração (se aprovado)

1. Contratar a VPS, endurecer (usuário sem root, SSH por chave, `ufw` liberando 22/80/443,
   `unattended-upgrades`, `fail2ban`).
2. Subir o compose (Postgres/PostGIS, RabbitMQ com dois vhosts, Caddy) e as duas APIs.
3. **Staging primeiro:** restaurar um `pg_dump` do Supabase de staging, apontar o workflow da
   `develop` para a VPS e rodar o roteiro de UCs (PC-094) contra ele.
4. Backup: `pg_dump` diário para o S3, com retenção de 7 dias, e **um restore testado**.
5. Produção: janela curta. Dump do Supabase de prod → restore → trocar `VITE_API_URL` na Vercel,
   `GOOGLE_CALENDAR_REDIRECT_URI` no Google Cloud Console e as variáveis de domínio
   (ADR-012) → novo build do app mobile com a URL da API.
6. Manter Render/Supabase/CloudAMQP desligados, mas sem apagar, por duas semanas como plano de
   volta.

Esforço estimado: 1–2 dias de trabalho para staging e mais meio dia para produção, sem contar
domínio.

## Recomendação

- **Se o orçamento US$0 é inegociável até a entrega:** manter a arquitetura atual. Para o cold
  start, a mitigação já documentada (request de aquecimento antes de demo e gravações) é o
  suficiente para a banca. A Oracle Always Free só vale a pena se alguém tiver tempo para brigar
  com capacidade de ARM e aceitar o risco de a conta ser recuperada.
- **Se o time aceita ~R$ 35–90/mês:** migrar para **uma VPS em São Paulo com 8 GB**
  (Hostinger KVM 2 é a opção mais simples com região BR e fatura em reais), seguindo o plano
  acima, **staging antes de produção**. Fazer **antes da gravação das evidências finais
  (PC-094/PC-106)** ou só **depois da defesa**. Migrar no meio da gravação é o pior momento.
- Em qualquer caso, **S3 e Vercel ficam onde estão**: funcionam bem e não têm o problema que
  motiva a troca.

## Alternativas consideradas

**Plano pago do Render (Starter, sem sleep).** Resolve só o cold start, por ~US$ 7/mês **por
serviço** (staging e produção = 2×). Continua sem região no Brasil e não resolve o espalhamento de
contas nem os limites do Supabase/CloudAMQP. Mais caro que uma VPS para menos ganho.

**Ping periódico para manter o Render acordado.** Paliativo comum, mas consome as 750 h/mês do
plano free (dois serviços acordados direto passam do limite) e vai contra o espírito do plano
gratuito. Não recomendado.

**Kubernetes/ECS.** Desproporcional para o escopo, como o ADR-010 já concluiu.
