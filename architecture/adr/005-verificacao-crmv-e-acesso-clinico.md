# ADR-005: Verificação de CRMV atrás de uma porta, e acesso clínico pelo QR

**Data:** 2026-08-15
**Status:** Aceita
**Autores:** Ricardo Temporal, Camila Martins, Álvaro Araújo

## Contexto

A **api#114** retirou da carteira pública os dados que revelam condição de saúde — notas clínicas (diagnóstico, prescrição, observações) e medicações em uso. A carteira servida por `GET /cards/:token` é alcançável **sem autenticação**: basta possuir o link do QR. Expor tratamento em curso nesse canal é vazamento de dado sensível.

Com isso, porém, abriu-se um vão: **ninguém mais enxerga o histórico clínico pelo QR**, nem o veterinário que está atendendo o animal — que é justamente quem precisa. O UC15 ("Acessar carteira via QR Code") pressupõe veterinário logado.

A **api#113** pede restringir o acesso ao QR a veterinários verificados, validando o CRMV "via API externa".

### O obstáculo

**Não existe API oficial do CFMV para terceiros.** O Conselho Federal e os conselhos regionais mantêm páginas web de consulta de profissionais, sem contrato REST documentado, versionado ou com garantia de disponibilidade.

As saídas possíveis eram: raspar a página de consulta (frágil, sujeita a captcha e a mudanças de HTML, com risco de quebrar durante a defesa); verificar manualmente por um administrador (confiável, mas não é validação externa); ou usar um intermediário comercial que automatiza a consulta oficial.

## Decisão

### 0. O enforcement acompanha o caminho que a interface usa

Restringir apenas a carteira do QR não bastava: a tela do veterinário lê notas
e medicações por `/pets/:id/clinical-notes` e `/pets/:id/medications`. Enquanto
esses endpoints exigiam só o papel `VET`, a restrição não existia no fluxo real.
A verificação passou a valer neles também, e na criação de nota clínica. O tutor
continua acessando o próprio pet sem verificação — a exigência recai apenas sobre
quem entra como veterinário.

### 1. A verificação libera o extra; o QR não fica trancado

A rota pública `GET /cards/:token` **permanece anônima e mínima**, com a curadoria da api#114 intacta. Acrescentou-se `GET /cards/:token/clinico`, que devolve a mesma carteira acrescida de medicações e notas clínicas, exigindo papel `VET` **e** CRMV verificado.

Rejeitou-se trancar a rota pública inteira. Isso tornaria a curadoria da api#114 redundante, quebraria o acesso anônimo que o `petcard-web` implementa em duas rotas (`/card/:token` e `/:token`) e eliminaria a leitura de emergência por quem não tem conta. **É o registro profissional que abre o dado sensível, não a posse do link.**

### 2. A validação fica atrás de uma porta

O acesso à base externa é mediado pela interface `CrmvValidator` (`validate(crmv, uf) → { valid, situacao, nome }`), com dois adaptadores escolhidos por configuração (`CRMV_PROVIDER`):

- **`InfosimplesCrmvValidator`** — consulta o cadastro do CFMV pela [API da Infosimples](https://infosimples.com/consultas/cfmv-cadastro/), que automatiza a consulta pública oficial e devolve o campo `situacao`. Serviço **pago por chamada** — a própria resposta traz `price` (R$ 0,24 na consulta observada), com franquia mínima mensal de R$ 100,00.
- **`StubCrmvValidator`** — determinístico, sem chamada externa. É o padrão.

O provedor é detalhe de configuração. Se a Infosimples mudar de contrato, encarecer ou sair do ar, troca-se o adaptador sem tocar em regra de negócio.

### 3. O stub é o padrão, não um atalho

CI e demonstração **não podem** depender de crédito, rede ou de um terceiro. Um teste que gasta dinheiro a cada execução é um teste que ninguém roda; uma gravação de vídeo que depende de saldo é uma gravação que falha na hora errada. O stub aceita todo CRMV bem formado e recusa um número reservado (`00000`), o que permite demonstrar **os dois caminhos** — aprovação e recusa — sem rede.

### 4. A verificação é persistida e vence

O resultado é gravado em `Veterinario.crmvVerifiedAt` e `crmvSituacao`. Verificar a cada requisição seria caro (a consulta é paga) e lento.

A verificação **expira** (`CRMV_TTL_DAYS`, padrão 180): um registro pode ser suspenso depois de concedido, e uma verificação eterna guardaria uma afirmação que envelhece. Vencido o prazo, o veterinário é tratado como não verificado até revalidar.

## Consequências

**A favor:**

- Dado clínico sensível deixa de depender só da posse de um link.
- O caminho de emergência (identificação, vacinas, vermífugos) segue aberto a qualquer um com o QR.
- O ponto de integração externa é testável sem rede e trocável sem refactor.
- Rende argumento de defesa: separação entre porta e adaptador diante de um serviço externo instável e pago.

**Contra e limitações — declaradas:**

- **Em produção, a verificação real depende de um fornecedor pago.** Sem `INFOSIMPLES_TOKEN`, a API responde 503 na verificação, e nenhum veterinário fica verificado.
- **A validação confere o registro, não a identidade.** Nada garante que quem cadastrou o CRMV é seu titular. Uma verificação de identidade real (documento, prova de vida) está fora do escopo do TCC.
- **A situação é lida por heurística de texto** (`Ativo`/`Regular` na string devolvida). Se o provedor mudar o vocabulário, a regra precisa acompanhar.
- O `accessed_by_crmv` na resposta registra quem acessou, mas **não há trilha de auditoria persistida** dos acessos clínicos — candidato natural para a api#117 (histórico de ações clínicas).
- **A documentação da API exige login**, então o adaptador nasceu de contrato inferido e precisou ser corrigido quando o contrato real apareceu: o sucesso é `code: 200` (não 600) e os registros ficam em `data[].resultados[]` (não em `data[]`). Fica o registro de que integrações assim pedem uma consulta real antes de considerar o adaptador pronto.

## Referências

- api#113 (restringir QR a veterinário verificado), api#114 (dados clínicos na carteira pública), api#115 (RBAC seguro por padrão)
- `petcard-shared` 0.11.0 — `CarteiraDigitalClinicaResponseDto`
- [Infosimples — CFMV / Cadastro](https://infosimples.com/consultas/cfmv-cadastro/) · [Preços](https://infosimples.com/consultas/precos/)
