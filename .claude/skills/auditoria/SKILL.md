---
name: auditoria
description: Continua a execução da auditoria 2026-10 do PetCard (correções nos repos petcard-api, petcard-shared, petcard-web e petcard-mobile). Use quando o usuário pedir para continuar, retomar ou ver o status da auditoria, ou digitar /auditoria [P<n> | status].
---

# Auditoria 2026-10 — continuar de onde parou

Os documentos canônicos ficam em `petcard-docs/docs/auditorias/2026-10-24/`. **Eles mandam sobre este arquivo.** Este arquivo é só o roteiro de arranque.

Argumentos: `$ARGUMENTS`. Vazio = escolher o próximo pacote. `P<n>` = trabalhar nesse pacote. `status` = só reportar o status, sem alterar nada.

## Arranque (sempre)

1. Localizar a raiz que contém os repos `petcard-*` (normalmente o diretório atual ou o pai).
2. **Sincronizar** os 5 repos sem destruir nada: `git fetch --all --prune` e `git status -sb` em cada um. Se algum tiver mudança não commitada, avisar antes de trocar de branch. Atualizar a `develop`/`main` locais só com `--ff-only`.
3. Ler, nesta ordem:
   - `COMO-CONTINUAR.md` (protocolo; seguir à risca);
   - a primeira entrada do `LOG.md` (o "próximo passo");
   - `PLANO.md` (dependências e decisões D1…D5).
   Usar a `develop` atualizada do `petcard-docs` (ou a branch de status mais recente, se houver PR de docs aberto).
4. Ver o status ao vivo:
   `gh issue list -R PetCardOrg/petcard-docs --label auditoria-2026-10 --state all --json number,title,state,assignees`
   e os PRs abertos com `AUD` no título nos 5 repos.
5. Reconciliar: se issue/PR e `itens/*.md` divergirem, a issue vale. Anotar a divergência para corrigir no PR de status.

Se o argumento for `status`: responder com um resumo (pacotes concluídos, em andamento, próximo, decisões pendentes) e **parar aqui**.

## Trabalho

6. Escolher o pacote pelas regras do Passo 2 do COMO-CONTINUAR. Dizer ao usuário em uma linha qual pacote e item vai atacar e por quê.
7. Se o pacote tem decisão pendente (D1…D5) que bloqueia o item, **perguntar ao usuário** e registrar a resposta no PLANO e no LOG.
8. Atribuir a issue e comentar que começou (`gh issue edit … --add-assignee @me`).
9. Para cada item: reler a especificação → revalidar no código atual → teste que falha → correção mínima → verificação do repo (tabela do COMO-CONTINUAR) → 1 commit por item com `(AUD <ID>)`.
10. Abrir PR para `develop` no padrão do COMO-CONTINUAR. Push e abertura de PR são ações visíveis ao time: confirmar com o usuário na primeira vez da sessão. **Nunca mergear.**
11. Atualizar o status: checklist e comentário na issue; `itens/*.md`, painel do README e LOG numa branch `docs/aud-status-<data>` do `petcard-docs`, com PR para a `develop`.

## Regras

- Branch sempre a partir da `develop` atualizada.
- Sem `Co-Authored-By` nem menção a IA em commits e PRs.
- Não expandir escopo: problema novo vira item derivado no `itens/<repo>.md`.
- Nunca `reset --hard`, `push --force` ou `stash drop` sem pedido explícito.
- Terminar **toda** sessão com uma entrada no LOG contendo o próximo passo exato, mesmo que o trabalho tenha parado no meio.
