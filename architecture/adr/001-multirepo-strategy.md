# ADR-001: Migração de Monorepo para Multirepo

**Data:** 2026-04-02
**Status:** Aceita
**Autores:** Ricardo Temporal, Álvaro Araújo, Camila Martins

## Contexto

O projeto PetCard foi inicialmente estruturado como Monorepo usando pnpm workspaces + Turborepo, com a seguinte organização:

- `apps/api` — Backend NestJS
- `apps/web` — Painel do veterinário (React.js)
- `apps/mobile` — App do tutor (React Native)
- `packages/shared` — DTOs, enums e types compartilhados

Após as primeiras semanas de desenvolvimento, a equipe identificou três problemas práticos:

1. **Confusão estrutural:** a árvore de diretórios profunda dificultava a navegação e o senso de propriedade de cada desenvolvedor.
2. **Colisão de dependências:** conflitos de versão entre pacotes de React Native, React.js e NestJS dentro do mesmo node_modules hoisted.
3. **Complexidade operacional:** Turborepo, pnpm workspaces e filtros adicionavam overhead cognitivo desproporcional para uma equipe de 3 pessoas.

## Decisão

Migramos para uma estratégia **Multirepo** com 5 repositórios independentes:

- `petcard-api` — Backend NestJS
- `petcard-web` — Painel do veterinário (React.js + Vite)
- `petcard-mobile` — App do tutor (React Native / Expo)
- `petcard-shared` — Pacote npm publicado via GitHub Packages
- `petcard-docs` — Documentação central e gestão do projeto

O pacote `@petcardorg/shared` é publicado no GitHub Packages e consumido pelos outros repos como dependência npm convencional.

A gestão do projeto é centralizada em um GitHub Project Board no `petcard-docs`, que agrega issues de todos os repositórios.

## Alternativas Consideradas

### Manter o Monorepo (rejeitada)

Os problemas de colisão de dependências e complexidade do Turborepo persistiriam. A equipe gastaria mais tempo resolvendo problemas de tooling do que desenvolvendo features.

### Git Submodules (rejeitada)

Resolve o isolamento de dependências, mas adiciona complexidade na sincronização. Propenso a erros com `git submodule update` e histórico confuso.

### Copiar arquivos do shared manualmente (rejeitada)

Zero overhead de setup, mas garantia de dessincronização entre repos. Inviável para manter consistência de tipos.

## Consequências

### Positivas

- Isolamento total de dependências entre projetos
- Ownership claro: cada dev é dono do seu repositório
- CI/CD nativamente isolada, sem filtros do Turborepo
- Histórico de commits limpo por componente
- Valor acadêmico: demonstra arquitetura distribuída

### Negativas

- Mudanças em DTOs requerem publicar nova versão do shared e atualizar nos consumidores
- Configurações de lint/prettier duplicadas por repo
- Refactoring cross-repo exige coordenação via issues linkadas

### Mitigações

- GitHub Packages automatiza publicação do shared via CI
- Milestones compartilhados mantêm sincronia entre repos
- GitHub Project Board centraliza visão de progresso