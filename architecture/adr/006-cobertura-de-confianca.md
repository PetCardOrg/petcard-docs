# ADR-006: Cobertura de confiança no lugar de percentual de cobertura

**Data:** 2026-08-20
**Status:** Aceita
**Autores:** Ricardo Temporal, Camila Martins, Álvaro Araújo

## Contexto

A **M6 (Testes + QA)** entregou suítes automatizadas nos três repositórios de código e instalou catracas de cobertura no CI: api **84/80/93/85**, web **80/75/78/80** e mobile **14/7/17/14** (statements/branches/functions/lines). A regra registrada era simples: *catraca não abaixa*. Todo trabalho que derrubasse o número cobria junto.

A catraca cumpriu o papel dela. Ela impediu que módulos inteiros entrassem sem teste durante a M5 e a M6, e produziu o número que a auditoria de julho cobrava.

Só que a métrica também **produziu teste**. O caso mais claro é o `src/config/__tests__/config.spec.ts` da api: 21 casos escritos em 2026-07-16 para fechar 46 branches que estavam em 0%, quase todos verificando que uma factory de configuração devolve o valor que acabou de ler de `process.env`. Esse arquivo sozinho sustentava **12 pontos percentuais** de cobertura de funções da api. Removê-lo derruba as quatro catracas de uma vez.

O mesmo padrão apareceu no mobile (`resource-services.test.ts`, nove casos afirmando que um wrapper de uma linha chama `axios.get` na URL certa) e na web (services que só montam um `fetch`, componentes visuais estáticos verificados por texto renderizado).

Testes assim têm um custo assimétrico: não pegam defeito — porque não há regra ali para quebrar — mas quebram em toda refatoração de estrutura, e precisam ser reescritos junto. Eles encarecem a mudança sem proteger o produto.

## Decisão

**A pergunta que autoriza um teste passa a ser:** *se este teste quebrar no futuro, isso significa que uma regra de negócio real quebrou, ou que o usuário final foi diretamente impactado?* Se a resposta for não, o teste não é escrito.

### O que cada camada cobre

- **Unitário** — lógica de negócio, algoritmo, formatação crítica, função pura. Não se testa wrapper que repassa dado, controller que só chama service, getter/setter nem componente visual estático.
- **Integração** — contrato de API, guard, middleware, fluxo com mais de um service. Mockar tudo por dentro transforma o teste de integração em unitário disfarçado; mocka-se apenas o externo real (S3, Places, provedor de CRMV).
- **E2E** — apenas fluxo vital, contra Postgres real. Erro secundário e caminho alternativo descem para o teste de integração, onde são baratos e não deixam a suíte lenta.

`describe` passa a agrupar por comportamento de negócio e caso de borda, não por estrutura do arquivo.

### As catracas descem, de propósito

| Repo | Antes | Depois | Cobertura real após a poda |
| --- | --- | --- | --- |
| api | 84/80/93/85 | **83/78/90/85** | 84,7 / 79,1 / 91,4 / 86,3 |
| web | 80/75/78/80 | **84/80/73/84** | 85,4 / 82,2 / 74,3 / 85,4 |
| mobile | 14/7/17/14 | **19/14/19/19** | 19,9 / 15,0 / 19,7 / 20,4 |

A catraca continua existindo e continua bloqueando o CI — o que muda é o que ela significa. Ela deixa de ser meta e volta a ser **freio de regressão**: impede que uma entrega remova cobertura existente sem que alguém perceba, sem exigir que se invente teste para alcançar um número.

Note que na web a cobertura de funções **caiu** (78 → 73) enquanto statements e lines **subiram** (80 → 84): removemos funções pequenas e muito testadas e mantivemos as que carregam regra. No mobile todas as métricas subiram, porque saíram testes de componente visual cujo código também saía do numerador — a suíte encolheu e ficou mais densa.

## Consequências

**A favor**

- 66 casos removidos (api 27 unitários e 5 E2E, mobile 27, web 12) sem perder verificação de nenhuma regra de negócio.
- A suíte fica mais rápida e, principalmente, mais estável diante de refatoração — o custo de mudar o produto cai.
- O que sobra é legível como especificação: cada teste nomeia uma regra.

**Contra, e assumido**

- O número de cobertura deixa de ser comparável com o que a M6 reportou. Este ADR é a explicação dessa descontinuidade, e os badges passam a refletir a medida nova.
- O mobile perdeu a única verificação automatizada de que os services chamam as URLs certas da api. A rota em si continua coberta pelo E2E da api; um erro de digitação na URL do lado do mobile passaria a aparecer só na execução manual dos casos de uso (PC-094). Aceito: são nove wrappers de uma linha, estáveis desde a M4.
- Cobertura menor pode ser lida como qualidade menor por quem olhar só o número. A defesa precisa apresentar a métrica junto do critério — é o ponto deste registro.

## Alternativas consideradas

**Manter tudo e aplicar a regra só daqui pra frente.** Preservava o número da M6 sem custo nenhum, e a proporção de teste útil melhoraria sozinha com o tempo. Rejeitada porque deixaria o `config.spec.ts` sustentando a catraca da api: qualquer poda futura continuaria bloqueada pelo mesmo impedimento, e a regra nova conviveria com um contraexemplo grande dentro do próprio repositório.

**Remover as catracas.** Rejeitada. Sem freio, cobertura cai silenciosamente — e a M6 mostrou que a catraca é eficaz justamente contra isso. O problema nunca foi existir um piso; foi o piso ter virado meta.
