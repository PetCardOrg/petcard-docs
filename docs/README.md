# Documentação e artefatos do TCC

Artefatos acadêmicos e técnicos centrais do PetCard, versionados aqui como fonte única. As decisões arquiteturais pontuais ficam nos [ADRs](../architecture/adr/).

## Artefatos

| Documento | Descrição |
|---|---|
| [TAP](tap.md) | Termo de Abertura do Projeto — objetivo, escopo (RF/RNF), cronograma |
| [DAS](das.md) | Documento de Arquitetura de Software — stack, camadas, entidades, casos de uso |

## Auditorias técnicas

Revisões de qualidade cruzando planejado (TAP/DAS) × implementado × confiável para a banca.

| Data | Documento | Foco |
|---|---|---|
| 2026-06-01 | [Auditoria completa](auditorias/2026-06-01.md) | Auditoria de reta final da Parte 1 (5 repos) |
| 2026-07-01 | [Auditoria delta](auditorias/2026-07-01-delta.md) | O que a de 01/06 apontou: resolvido, pendente e novo |
| 2026-10-24 | [Auditoria 2026-10 + plano de execução](auditorias/2026-10-24/README.md) | 4 auditorias de leitura (api, shared, web, mobile) e o plano em 14 pacotes para corrigir; status nas issues `auditoria-2026-10` |

## QA

| Documento | Descrição |
|---|---|
| [Roteiro de testes manuais](qa/roteiro-testes-manuais.md) | Passos e resultado esperado dos 16 casos de uso (UC01–UC16), revalidado a cada marco |

## API

| Artefato | Descrição |
|---|---|
| [Collection Postman](api/README.md) | Collection + environment do Postman com os 53 endpoints, gerados do contrato OpenAPI (PC-097/PC-098) |
