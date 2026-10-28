# Como continuar — protocolo de execução da auditoria

Este é o passo a passo que **qualquer pessoa ou sessão do Claude** segue para retomar o trabalho de onde parou. Ele foi escrito para ser executado literalmente.

> Atalho no Claude Code: com a skill instalada (ver [README](README.md#usando-com-o-claude-code)), basta digitar **`/auditoria`** ou "continuar a auditoria".

---

## Onde fica cada coisa (fontes da verdade)

| O quê | Onde | Quem atualiza |
|-------|------|---------------|
| **Status ao vivo** (quem está fazendo o quê, o que já foi feito) | Issues do GitHub em `PetCardOrg/petcard-docs` com a label `auditoria-2026-10`, **1 issue por pacote** (P1…P14), com os itens como checklist | Quem trabalha, na hora |
| **Especificação** de cada item (onde, problema, correção, aceite) | `itens/<repo>.md` | Ao descobrir algo novo e ao fechar o item |
| **Ordem, dependências, decisões** | [PLANO.md](PLANO.md) | Quando uma decisão é tomada |
| **Histórico de sessões** (o que foi feito, próximo passo) | [LOG.md](LOG.md) | No fim de toda sessão |
| Relatórios originais (não editar) | `originais/` | ninguém |

Se o status da issue e o do arquivo `itens/*.md` divergirem, **a issue vale** e o arquivo é corrigido no próximo PR de docs.

### Status de um item
`⬜ pendente` · `🟨 em andamento (branch)` · `🟦 em PR (#n)` · `✅ em develop` · `🚀 em produção (main)` · `⏸️ bloqueado (motivo)` · `🚫 descartado (motivo)`

Um item só fica ✅ quando **todos os checkboxes de aceite** estão marcados e o PR foi mergeado na `develop`.

---

## Passo 0 — Sincronizar

A raiz `PetCard/` contém os 5 repos lado a lado. `main` é **produção** (deploy automático); `develop` é integração. Não existe branch `production`.

```bash
cd PetCard
for d in petcard-*/; do
  (cd "$d" && git fetch --all --prune -q \
    && git status -sb | head -1)
done
```

- Repo com mudança local não commitada: **parar e perguntar** antes de trocar de branch.
- Atualizar `develop` e `main` locais **só por fast-forward** (`git merge --ff-only`). Nunca `reset --hard` sem checar se há commits locais não publicados (`git log origin/develop..develop`).

## Passo 1 — Descobrir onde estamos

1. Ler a última entrada do [LOG.md](LOG.md): ela diz qual é o próximo passo.
2. Ver o board ao vivo:
   ```bash
   gh issue list -R PetCardOrg/petcard-docs --label auditoria-2026-10 --state all \
     --json number,title,state,assignees --jq '.[] | "\(.state)\t#\(.number)\t\(.assignees|map(.login)|join(","))\t\(.title)"'
   ```
3. Ver se há PR de auditoria aberto esperando review:
   ```bash
   for r in api shared web mobile docs; do gh pr list -R PetCardOrg/petcard-$r --search "AUD in:title" ; done
   ```

## Passo 2 — Escolher o que fazer

Nesta ordem:
1. Uma issue **atribuída a você** e ainda aberta: continue nela.
2. Um PR seu com review pedindo mudança: resolva.
3. A issue aberta **sem responsável** com o **menor número de pacote** cujas dependências (ver [PLANO.md](PLANO.md#mapa-de-dependências)) estejam satisfeitas.
4. Se o pacote depende de uma **decisão pendente** (D1…D5), pergunte ao usuário antes de codar a parte bloqueada. A parte não bloqueada pode seguir.

Ao pegar: `gh issue edit <n> -R PetCardOrg/petcard-docs --add-assignee @me` e um comentário "Iniciando P<n> — branch `<nome>`".

## Passo 3 — Branch

Sempre a partir da `develop` **atualizada** do repo:

```bash
git checkout develop && git pull --ff-only
git checkout -b <tipo>/aud-p<N>-<slug>     # ex.: fix/aud-p1-trust-proxy
```

`<tipo>` segue o CONTRIBUTING: `fix/`, `refactor/`, `test/`, `chore/`, `feature/`, `docs/`.

## Passo 4 — Implementar, item por item

Para **cada item** do pacote:

1. **Reler a especificação** em `itens/<repo>.md`.
2. **Revalidar no código.** As linhas citadas podem ter mudado; localize pelo nome da função. Se o problema já não existe, marque `🚫 descartado (já corrigido em <commit>)` e siga.
3. **Escrever o teste que falha primeiro**, reproduzindo o problema descrito.
4. Corrigir com o **mínimo necessário** e no estilo do código ao redor (comentários em pt-BR, mesma densidade).
5. Rodar a verificação do repo (tabela abaixo). Tudo verde.
6. **1 commit por item**, Conventional Commits, com o ID no fim:
   `fix(auth): zera senha ao vincular conta Google não verificada (AUD API-05)`
7. Marcar os checkboxes de aceite do item.

**Não expandir o escopo.** Se aparecer outro problema: registrar como item derivado no `itens/<repo>.md` (próximo ID livre, seção "Itens derivados"), avisar no PR e seguir.

### Verificação por repo

| Repo | Comandos (todos precisam passar) | Observações |
|------|----------------------------------|-------------|
| `petcard-api` | `npm run lint` · `npm test` · `npm run build` | `lint` tem `--fix` e **altera arquivos**: revisar o diff. E2E (`npm run test:e2e`) precisa de Postgres (`docker/`). Mudou rota/DTO → `scripts/generate-openapi.ts`. |
| `petcard-shared` | `npm run build` · `npm run lint` (ou `lint:check` depois do SH-01) · `npm test` (depois do SH-05) | Mudou `src/` → **bump de versão**. |
| `petcard-web` | `npm run lint` · `npm test` · `npm run build` | `build` inclui `tsc -b`. |
| `petcard-mobile` | `npm run lint` · `npm run typecheck` · `npm test` | Push, Google e mapas: validar em aparelho no fim da Fase 5. |

## Passo 5 — Pull Request

- Base: **`develop`**. Título: `fix(<escopo>): <resumo> [AUD P<N>]`.
- Corpo: lista dos itens (`AUD API-05 — …`), como testar, e `Relates to PetCardOrg/petcard-docs#<issue do pacote>`.
- Pedir review de 1 colega (regra do CONTRIBUTING). **Não mergear sem review humano.**
- Sem `Co-Authored-By` nem menção a IA em commits e PRs.

## Passo 6 — Atualizar o status (sempre, mesmo se a sessão parar no meio)

1. **Issue do pacote:** marcar os itens concluídos no checklist e comentar com o link do PR.
2. **Merge em `develop` não fecha issue sozinho:** quando todos os itens do pacote estiverem em `develop`, fechar a issue manualmente com um comentário.
3. **Docs:** no `petcard-docs`, numa branch `docs/aud-status-<data>`:
   - atualizar `Status`, `PR` e `Resolução` dos itens em `itens/<repo>.md`;
   - atualizar o painel do [README](README.md#painel);
   - adicionar a entrada da sessão no [LOG.md](LOG.md).
   Abrir o PR para `develop`. Pode juntar várias sessões num PR só, desde que o LOG não fique desatualizado mais de 1 dia.

## Passo 7 — Encerrar a sessão

Adicionar ao [LOG.md](LOG.md) (modelo no arquivo): data, quem, pacote, o que foi feito, PRs, decisões tomadas, **próximo passo exato**. É isso que a próxima sessão vai ler primeiro.

---

## Release do shared

1. PR na `develop` do shared com bump de versão (`minor` para contrato novo, `patch` para correção, `major` para breaking).
2. PR `develop → main` do shared. Após o merge, o `publish.yaml` publica no GitHub Packages.
3. Confirmar: `npm view @petcardorg/shared version` mostra a nova versão (precisa de `.npmrc` autenticado).
4. Nos consumidores: `npm install @petcardorg/shared@^<versão>`, commit `chore(deps): atualiza @petcardorg/shared para <versão> (AUD P<N>)`.

## Deploy coordenado (P6)

As mudanças do P6 quebram clientes antigos (passa a exigir `senha_atual`). Sequência:
1. PRs de API, web e mobile aprovados e mergeados na `develop`.
2. `develop → main` da **API** primeiro, depois a **web** (Vercel, imediato).
3. Mobile: novo build EAS. Até os usuários atualizarem, a troca de e-mail no app antigo retorna erro; o resto do app funciona. Avisar o time.
