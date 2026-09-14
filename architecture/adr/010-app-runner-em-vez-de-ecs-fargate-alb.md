# ADR-010: App Runner em vez de ECS Fargate + ALB para staging

**Data:** 2026-09-13
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

O DAS (`docs/das.md`) descreve a plataforma como "backend executado em containers Docker no Amazon ECS (Fargate)", com diagrama de VPC com subnet pública e privada, ECS Fargate, RDS e ElastiCache cada um na sua subnet. Esse desenho é conceitual: nenhum nome de cluster, VPC, subnet, ALB ou qualquer outro recurso concreto foi criado. A PC-092 (api#42, "CD para staging") partiu do zero — sem Dockerfile, sem IaC, sem nenhum recurso AWS provisionado além da conta em si.

Diante disso, a pergunta deixou de ser "como automatizar o deploy no ECS Fargate já existente" e passou a ser "qual arquitetura de deploy faz sentido agora, com o projeto formado, num staging de baixo tráfego mantido por uma conta pessoal de estudante". A Parte 1 do TCC já foi defendida com o diagrama do DAS, mas isso não é motivo suficiente para manter uma decisão de infraestrutura mais cara e mais complexa de operar do que o necessário — trocar de ideia com um motivo registrado é melhor do que seguir o plano original por inércia.

ECS Fargate + ALB, do jeito que o DAS desenha, custaria pelo menos dois itens fixos que não existiam nos requisitos: um **NAT Gateway** (~US$32/mês) para as tasks em subnet privada alcançarem a internet (pull de imagem do ECR, logs), e um **Application Load Balancer** (~US$16-20/mês) para expor a API com uma URL estável. Nenhum dos dois agrega valor funcional a um staging que existe só para os UCs da Fase 3 e o vídeo da PC-106 — o tráfego é baixíssimo e esporádico.

## Decisão

**A API de staging roda em AWS App Runner, não em ECS Fargate atrás de um ALB.**

App Runner é um serviço gerenciado que builda/roda o container a partir de uma imagem no ECR, expõe HTTPS público com URL própria (`https://<id>.us-east-1.awsapprunner.com`) sem precisar de ALB, e escala sozinho. Para alcançar recursos privados da VPC (RDS, RabbitMQ) sem expor nada publicamente e sem NAT Gateway, ele usa um **VPC Connector** — uma interface de rede que só faz tráfego de saída de dentro da VPC, sem depender de rota de internet.

RabbitMQ continua rodando dentro da VPC, mas não em Amazon MQ gerenciado (~US$15-20/mês de broker fixo, ocioso a maior parte do tempo) — vai como **serviço ECS Fargate** próprio, com EFS montado para persistir a fila entre reinícios de task, alcançável pelo App Runner via Cloud Map (namespace de DNS privado). App Runner não roda workload que não seja HTTP, então RabbitMQ não podia ir para lá também.

### O que muda em relação ao DAS

| | DAS (conceitual) | Staging real |
| --- | --- | --- |
| Compute da API | ECS Fargate | **App Runner** |
| Exposição pública | ALB | **URL nativa do App Runner** |
| Acesso a RDS/RabbitMQ | subnet privada + NAT | **VPC Connector** (sem NAT) |
| RabbitMQ | não detalhado | ECS Fargate + EFS (Amazon MQ descartado por custo) |
| Redis/ElastiCache | "capacidade reservada" | **fora do staging** — nenhum código consome, provisionar custaria sem uso funcional (decisão à parte, não motiva ADR próprio: é extensão direta da narrativa de capacidade reservada já registrada) |

O DAS deve ser atualizado (PC-099/relatório final) para refletir App Runner em vez de ECS Fargate+ALB — pendência anotada para a Fase 4.

### Alternativas descartadas

1. **Manter ECS Fargate + ALB, como planejado originalmente.** Alinhado ao que a banca já viu na Parte 1, mas mantém dois custos fixos (NAT + ALB, ~US$48-52/mês) sem ganho funcional para um staging de baixíssimo tráfego, além de exigir bem mais Terraform (target group, listener, regras de roteamento, subnets públicas e privadas de verdade). Descartada porque o TCC não perde nada em rigor técnico ao registrar essa mudança com justificativa — perderia mais em coerência se mantivesse uma arquitetura cara "porque já foi assim" sem necessidade real.
2. **AWS Lightsail Containers.** Mais barato e simples ainda, mas modelo de rede mais rígido (menos controle sobre VPC Connector-like para RDS privado) e menos alinhado ao vocabulário "ECS/orquestração de containers" que o resto do DAS já usa — pareceria um serviço à parte, não uma variação do plano original.
3. **EC2 único rodando Docker Compose.** Custo mínimo, mas abre mão de qualquer coisa parecida com orquestração/deploy gerenciado — pior escolha pedagógica para um TCC sobre uma plataforma que documenta ECS desde a Parte 1, e reintroduz responsabilidade operacional (patch de SO, reinício de processo) que o restante da arquitetura evita.
4. **Amazon MQ gerenciado para o RabbitMQ**, em vez de Fargate+EFS. Menos Terraform e menos operação, mas custo fixo (~US$15-20/mês) só pelo broker, mesmo staging ficando ocioso a maior parte do tempo — descartado pelo mesmo critério de custo que motivou a troca principal.

## Consequências

**A favor:**

- Elimina os dois maiores custos fixos do plano original (NAT + ALB, ~US$48-52/mês), reduzindo o custo do staging a algo em torno de US$30-40/mês.
- Menos Terraform para escrever e manter: sem target group, sem listener, sem regra de roteamento, sem subnet privada dedicada.
- URL pública e certificado HTTPS gerenciados pelo App Runner — não precisa de ACM nem de configuração de domínio para satisfazer o critério de aceite "ambiente acessível via URL de staging".
- App Runner reimplanta sozinho ao detectar uma imagem nova na tag `staging` do ECR (`auto_deployments_enabled`), o que cobre boa parte do critério "deploy automático após merge na develop" sem lógica extra no workflow.

**Contra e limitações — declaradas:**

- **Diverge do DAS já defendido na Parte 1.** Fica documentado aqui, e o DAS precisa ser atualizado antes do relatório final (PC-099/PC-107) para não deixar a documentação inconsistente com o que está no ar.
- **App Runner tem menos controle fino de rede do que ECS Fargate atrás de um ALB próprio** — não dá para, por exemplo, aplicar WAF diretamente na frente dele com a mesma flexibilidade de um ALB. Aceitável para staging; se a PC-093 (CD para produção) decidir manter ECS Fargate+ALB em produção por esse motivo, a divergência staging/produção deve ficar registrada como decisão própria, não como esquecimento.
- **RabbitMQ em Fargate+EFS é operacionalmente mais manual que Amazon MQ** (sem patch automático do broker, backup é o snapshot do EFS). Aceito porque o volume de mensagens em staging é mínimo e o ganho de custo é direto.
- **Cold start:** App Runner pode escalar a zero instâncias ativas em períodos sem tráfego; a primeira requisição depois de um período ocioso pode ter latência maior. Irrelevante para os UCs manuais da Fase 3 e para o vídeo da PC-106, que não dependem de tempo de resposta sob carga.

## Referências

- `petcard-api/infra/terraform/staging/` — implementação desta decisão (PC-092, api#42)
- `petcard-api/infra/terraform/staging/README.md` — passo a passo de provisionamento e estimativa de custo
- `docs/das.md` — diagrama conceitual original (ECS Fargate + ALB), a atualizar
- ADR-006 (cobertura de confiança) — precedente de ADR registrando desvio do plano original com justificativa, em vez de silenciosamente
