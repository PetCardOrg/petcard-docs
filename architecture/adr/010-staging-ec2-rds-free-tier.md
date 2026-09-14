# ADR-010: Staging em EC2 + RDS (Free Tier), não ECS Fargate + ALB

**Data:** 2026-09-13 (revisada em 2026-09-14)
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

O DAS (`docs/das.md`) descreve a plataforma como "backend executado em containers Docker no Amazon ECS (Fargate)", com diagrama de VPC com subnet pública e privada, ECS Fargate, RDS e ElastiCache cada um na sua subnet. Esse desenho é conceitual: nenhum nome de cluster, VPC, subnet, ALB ou qualquer outro recurso concreto foi criado. A PC-092 (api#42, "CD para staging") partiu do zero — sem Dockerfile, sem IaC, sem nenhum recurso AWS provisionado além da conta em si, criada momentos antes desta decisão.

Diante disso, a pergunta deixou de ser "como automatizar o deploy no ECS Fargate já existente" e passou a ser "qual arquitetura de deploy faz sentido agora, com o projeto formado, mantida por uma conta pessoal de estudante que não pode gastar dinheiro com isso". A Parte 1 do TCC já foi defendida com o diagrama do DAS, mas isso não é motivo suficiente para manter uma decisão de infraestrutura mais cara do que o necessário — trocar de ideia com um motivo registrado é melhor do que seguir o plano original por inércia.

A conta AWS é **nova**, o que a torna elegível ao Free Tier (12 meses de determinados recursos gratuitos, dentro de limites de uso). Isso muda o critério de decisão: a pergunta não é mais "qual arquitetura é mais barata", é **"qual arquitetura cabe inteira dentro do Free Tier, custando US$0"**.

## Decisão

**A API de staging roda numa única instância EC2, com RabbitMQ no mesmo host via docker-compose, e um RDS Postgres gerenciado — os três recursos dentro dos limites do Free Tier.**

- **EC2** (`t3.micro`, 750h/mês grátis): roda a API e o RabbitMQ como dois serviços do mesmo `docker-compose.yml` (o mesmo padrão do compose local do projeto, só que com a API como serviço a mais). RabbitMQ persiste em um volume Docker no próprio disco da instância.
- **RDS Postgres** (`db.t3.micro`, 750h/mês + 20GB grátis): banco gerenciado, com backup automático incluso — evita perder os dados da demo por um erro manual.
- **Sem NAT Gateway, sem ALB, sem App Runner, sem ECS Fargate, sem EFS.** Nenhum desses entra no Free Tier clássico da AWS (Fargate e App Runner são sempre pay-per-use; NAT Gateway e ALB têm custo fixo por hora desde a primeira hora).
- **Elastic IP** associado à instância — resolve o problema de "a URL só existe depois que o recurso é criado" (a alocação do EIP é um passo separado da criação da instância, então o `user_data` já nasce sabendo o IP público) e mantém a URL estável entre reinícios.
- **Alarme de orçamento (`aws_budgets_budget`)** configurado para US$1/mês, com aviso por e-mail em 80% do gasto real e 100% do gasto previsto. Não é opcional: os termos exatos do Free Tier mudam com frequência e não há garantia de que o que está documentado aqui continua valendo — o alarme é o freio de segurança contra esse risco, independente de qualquer suposição sobre elegibilidade.

### Alternativa intermediária considerada e descartada: AWS App Runner

Antes de chegar nesta decisão, a primeira revisão deste ADR (2026-09-13) trocava ECS Fargate+ALB por **App Runner** — um serviço gerenciado que expõe HTTPS público nativamente e alcança RDS/RabbitMQ via VPC Connector, sem precisar de ALB nem NAT Gateway. Reduzia o custo de ~US$48-52/mês (NAT+ALB) para ~US$30-40/mês.

Essa análise foi refeita no dia seguinte quando ficou claro que o critério real não era "mais barato", era "gratuito": **App Runner não é elegível ao Free Tier em nenhuma configuração** — é sempre cobrado por vCPU/memória ativos, mesmo em uso baixíssimo. O mesmo vale para RabbitMQ como serviço ECS Fargate (~US$9/mês) e para o EFS que o acompanhava. Nenhuma dessas peças tinha como chegar a US$0, então a arquitetura inteira foi trocada por uma que coubesse no Free Tier — daí EC2 (que É Free Tier-eligible) rodando tudo via docker-compose, em vez de serviços gerenciados por peça.

### O que muda em relação ao DAS

| | DAS (conceitual) | Staging real |
| --- | --- | --- |
| Compute da API | ECS Fargate | **EC2 única, docker-compose** |
| Exposição pública | ALB | **Elastic IP direto na instância (HTTP puro, sem TLS)** |
| RabbitMQ | não detalhado | **container no mesmo host da API**, não um serviço AWS separado |
| Banco | RDS (subnet privada) | RDS, mesma VPC, sem NAT (subnet pública, sem acesso externo por security group) |
| Redis/ElastiCache | "capacidade reservada" | **fora do staging** — nenhum código consome, provisionar custaria sem uso funcional |

O DAS deve ser atualizado (PC-099/relatório final) para refletir esta arquitetura em vez de ECS Fargate+ALB — pendência anotada para a Fase 4.

### Alternativas descartadas

1. **Manter ECS Fargate + ALB**, como planejado originalmente. Descartada: não é Free Tier-eligible (Fargate é sempre pay-per-use), custaria ~US$48-52/mês fixos (NAT+ALB) só de infraestrutura ociosa.
2. **App Runner** (ver seção acima). Descartada por não ser Free Tier-eligible, mesmo sendo mais barata que ECS Fargate+ALB.
3. **Amazon MQ gerenciado para RabbitMQ.** Mesma razão: sem Free Tier, custo fixo (~US$15-20/mês) só pelo broker.
4. **Railway/Render/Fly.io (sair da AWS).** Têm camadas gratuitas genuínas e seriam operacionalmente mais simples (deploy tipo `git push`), mas cada uma com limitação que preocupa para um ambiente que precisa estar de pé de forma confiável até a gravação da PC-106: Postgres gratuito do Render expira em 90 dias, Railway não tem mais camada gratuita permanente. Descartada também por já existir um investimento de conhecimento em AWS (S3 já é usado em código) que se perderia.

## Consequências

**A favor:**

- Custo-alvo de **US$0/mês**, dentro do Free Tier — a conta tem ainda US$100 em créditos como margem de segurança adicional, não como orçamento a gastar.
- Bem menos Terraform e menos peças móveis do que qualquer versão com serviços gerenciados por componente (sem VPC Connector, sem Service Discovery, sem EFS, sem cluster ECS).
- `docker-compose.yml` da instância é essencialmente o mesmo já usado em desenvolvimento local — reduz a distância entre "como roda na minha máquina" e "como roda em staging".
- Alarme de orçamento cobre o risco de eu (ou a documentação da AWS) estar errado sobre os limites exatos do Free Tier.

**Contra e limitações — declaradas:**

- **Diverge do DAS já defendido na Parte 1** (duas vezes, inclusive: primeiro para App Runner, depois para EC2). Fica documentado aqui; o DAS precisa ser atualizado antes do relatório final.
- **Sem alta disponibilidade.** Uma instância, uma zona — se ela cair, o staging cai até reiniciar manualmente. Aceitável para um ambiente que existe só para os UCs da Fase 3 e o vídeo da PC-106, não para produção.
- **HTTP puro, sem TLS.** Resolver isso (Caddy/nginx com Let's Encrypt na frente) é extensão possível e não foi feito para não complicar a configuração dentro do Free Tier.
- **RabbitMQ sem backup dedicado** — dado vive num volume Docker no disco da instância. Perder a instância perde a fila de mensagens (não perde dado clínico, que está no RDS com backup automático).
- **O Free Tier tem prazo (12 meses) e limites de uso** que, se estourados, passam a cobrar. O `budget.tf` avisa antes de isso virar valor relevante, mas não impede automaticamente — a resposta ao alarme é manual.
- Se a PC-093 (CD para produção) decidir usar arquitetura gerenciada em produção (ECS Fargate, RDS Multi-AZ, etc.), a divergência staging/produção deve ficar registrada como decisão própria daquele momento, não como inconsistência não intencional.

## Referências

- `petcard-api/infra/terraform/staging/` — implementação desta decisão (PC-092, api#42)
- `petcard-api/infra/terraform/staging/README.md` — passo a passo de provisionamento e observações sobre o Free Tier
- `docs/das.md` — diagrama conceitual original (ECS Fargate + ALB), a atualizar
- ADR-006 (cobertura de confiança) — precedente de ADR registrando desvio do plano original com justificativa, em vez de silenciosamente
