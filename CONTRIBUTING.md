# Guia de Contribuição — Ecossistema PetCard

Este guia se aplica a TODOS os repositórios do ecossistema PetCard.

## Repositórios do Ecossistema

| Repositório | Owner | Descrição |
|---|---|---|
| petcard-api | Álvaro | Backend NestJS |
| petcard-web | Ricardo | Painel do Veterinário |
| petcard-mobile | Ricardo | App do Tutor |
| petcard-shared | Álvaro | Pacote npm compartilhado |
| petcard-docs | Camila | Docs + Gestão do Projeto |

## Estratégia de Branches

Todos os repos seguem o modelo **GitHub Flow** simplificado:

main (produção — protegida)
  └── develop (integração — protegida)
        ├── feature/PC-027-modulo-auth
        ├── fix/PC-081-corrige-qrcode
        └── chore/PC-016-husky-setup

### Convenção de Nomes

<tipo>/PC-<numero-issue>-<descricao-curta>

Tipos permitidos: feature/, fix/, chore/, docs/, test/, refactor/

## Fluxo de Trabalho

1. Pegue uma Issue do Kanban (GitHub Projects no petcard-docs) e mova para "In Progress".
2. Vá para o repositório correto da issue.
3. Crie a branch a partir de develop:
   git checkout develop
   git pull origin develop
   git checkout -b feature/PC-027-modulo-auth
4. Faça commits seguindo Conventional Commits:
   feat(auth): implementa JWT strategy com Auth0
   fix(pet): corrige validação de espécie no cadastro
   docs(readme): adiciona instruções do docker-compose
   test(pet): adiciona testes unitários do PetService
   chore(ci): configura workflow de lint
5. Abra um Pull Request para develop:
   - Preencha o template de PR.
   - Vincule a Issue (Closes camilampinheiro/petcard-api#27).
   - Solicite review de pelo menos 1 colega.
6. Após aprovação e CI verde, faça squash-merge.
7. Mova a Issue para "Done" no Kanban.

### Referência Cross-Repo em PRs

Como as issues podem estar em repos diferentes, use a sintaxe completa:
   Closes camilampinheiro/petcard-api#27
   Relates to camilampinheiro/petcard-shared#4

## Regras de Pull Request

- Título segue Conventional Commits.
- Descrição explica O QUE foi feito e POR QUÊ.
- Testes passando no CI (obrigatório).
- Lint sem erros (obrigatório).
- Pelo menos 1 aprovação de code review.
- Sem commits diretos em main ou develop.

## Fluxo de Atualização do @petcard/shared

Quando precisar alterar DTOs, enums ou types compartilhados:

1. Faça a alteração no repo petcard-shared.
2. Incremente a versão no package.json (seguir semver).
3. Faça push — o CI publica automaticamente no GitHub Packages.
4. Nos repos consumidores, atualize a dependência:
   npm update @petcard/shared
5. Verifique se o build continua passando.

## Padrões de Código

### TypeScript (todos os repos)
- Strict mode habilitado ("strict": true).
- Interfaces sobre types quando possível.
- Nomes em inglês para código; comentários podem ser em português.

### Backend (NestJS) — petcard-api
- Um módulo por domínio (ex: pet.module.ts).
- Services contêm lógica de negócio; Controllers apenas roteiam.
- DTOs validados com class-validator.
- Todo endpoint novo precisa de teste unitário no service.

### Frontend (React/React Native) — petcard-web / petcard-mobile
- Componentes funcionais com hooks.
- Separação entre componentes de UI e de domínio.
- Custom hooks para lógica reutilizável.

### Banco de Dados — petcard-api
- Toda alteração de schema via Prisma Migrations (nunca SQL manual).
- Nome de tabelas e colunas em snake_case.

## Ambiente de Desenvolvimento

### Ferramentas Obrigatórias
- VSCode com extensões: ESLint, Prettier, Prisma
- Docker Desktop para serviços locais
- npm como gerenciador de pacotes
- GitHub CLI (gh) para facilitar criação de PRs

### Verificação Pré-commit
O Husky executa automaticamente lint-staged antes de cada commit.
Se o lint falhar, o commit é bloqueado. Corrija antes de prosseguir.

## Comunicação

- Issues para discussões técnicas e bugs.
- Pull Requests para revisão de código.
- GitHub Discussions (no petcard-docs) para decisões arquiteturais.
- Kanban centralizado no GitHub Projects do petcard-docs.