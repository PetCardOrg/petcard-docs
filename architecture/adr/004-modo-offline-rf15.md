# ADR-004: Modo offline (RF15) fora do escopo do MVP — limitação consciente

**Data:** 2026-06-01
**Status:** Aceita
**Autores:** Ricardo Temporal, Álvaro Araújo, Camila Martins

## Contexto

O TAP lista, entre os requisitos funcionais, o **RF15**:

> "O aplicativo deve permitir a visualização offline dos dados básicos da carteira de vacinação já sincronizados anteriormente."

No cronograma original, o RF15 estava previsto para a Sprint 5 (Integrações e Notificações), junto com sincronização de Calendar, push e ajustes de processamento assíncrono.

Na auditoria de reta final (2026-06-01), constatou-se que o RF15 **não foi implementado** e que, diferente dos demais requisitos, **nunca chegou a virar issue** no backlog (M0–M7) — ou seja, saiu do radar de execução sem uma decisão registrada. Este ADR existe para tornar essa decisão **explícita e honesta**, em vez de deixá-la como uma lacuna silenciosa.

### O que existe hoje

- A carteira digital (identidade do pet, resumo de saúde, QR Code e link público) é carregada **online**, via `GET /cards/pets/:petId`, a cada vez que a tela é aberta.
- Não há camada de persistência local de dados de domínio no app: o `petcard-mobile` usa apenas `expo-secure-store` para o token de sessão. Não há `AsyncStorage`/MMKV, cache de respostas, detecção de conectividade (`NetInfo`) nem fila de reconciliação.
- A página pública da carteira (acesso via QR pelo veterinário) também é online por natureza.

## Decisão

**O RF15 (modo offline) fica fora do escopo do MVP entregue neste TCC**, declarado aqui como limitação consciente. O aplicativo opera **online-first**: requer conectividade para exibir a carteira e os registros de saúde.

Motivos:

- **Custo desproporcional ao tempo restante.** Offline confiável não é "guardar a última resposta": exige escolher e integrar um armazenamento local, definir o que é cacheável, invalidação/expiração, detecção de conectividade, indicação de "dado desatualizado" na UI e — se houver escrita offline — fila de reconciliação e resolução de conflito. É um eixo de engenharia próprio, não um ajuste pontual.
- **Risco de regressão perto da defesa.** Introduzir cache e estados offline a poucos dias da apresentação adiciona caminhos de falha (dados velhos, divergência entre cache e servidor) justamente nos fluxos que serão demonstrados ao vivo.
- **Coerência com o histórico do projeto (YAGNI).** Segue o mesmo princípio já adotado no [ADR-002](002-m4-integracoes-externas.md) ao descopar a sincronização bidirecional do Google Calendar: não introduzir abstração sem demanda real dentro do escopo do MVP.
- **Impacto de produto contornável na demonstração.** O caminho crítico (tutor consulta a carteira, veterinário acessa via QR, exportação em PDF) funciona online. Para portabilidade sem rede, o **RF12 — exportação em PDF** (entregue, ver issue PC-110) cobre parcialmente o caso de uso de "comprovação em viagem": o tutor gera o PDF com conectividade e o carrega offline.

## Alternativas Consideradas

### A. Implementar offline completo agora (rejeitada)

Cache de leitura + `NetInfo` + indicação de staleness + (eventual) escrita offline. É a entrega fiel ao RF15, mas o esforço e o risco perto da defesa são incompatíveis com a janela de tempo e com o foco atual de estabilização (sem novas features).

### B. Cache "ingênuo" da última resposta (rejeitada)

Persistir apenas o último JSON da carteira e reexibir sem rede. Barato, mas entrega uma falsa sensação de offline: dados podem estar arbitrariamente desatualizados, sem expiração nem sinalização ao usuário, o que é pior para um app de saúde do que assumir a limitação abertamente.

### C. Declarar como limitação consciente + cobrir o caso de viagem via PDF (escolhida)

Assume-se a ausência do offline de forma transparente no relatório/defesa e usa-se o PDF (RF12) como mitigação para o cenário de "carteira acessível sem rede". Honesto, sem risco de regressão, e o caso de uso mais citado no TAP (comprovação em viagem) fica coberto.

## Consequências

### Positivas

- **Transparência com a banca:** a lacuna do RF15 passa a ser uma decisão documentada e justificada, não um esquecimento.
- **Estabilidade da demo preservada:** nenhum caminho novo de falha introduzido na reta final.
- **Mitigação real:** o PDF (RF12) atende o subcaso de portabilidade offline da carteira.

### Negativas

- **RF15 não é atendido:** sem conectividade, o app não exibe a carteira nem os registros de saúde (exceto um PDF previamente exportado).
- **Divergência TAP × entrega:** registrada aqui e a ser refletida no relatório final e na matriz de rastreabilidade de requisitos.

### Evolução futura

Caso o projeto continue além do TCC, o caminho recomendado é o cache de leitura com `NetInfo` + expiração + selo visual de "dados de {data}", priorizando os dados básicos da carteira de vacinação exatamente como o RF15 descreve. O schema atual já é suficiente para isso; falta apenas a camada de persistência e os estados de UI.
