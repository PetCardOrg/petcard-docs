# Log de sessões — Auditoria 2026-10

Entradas mais recentes **no topo**. Toda sessão termina com uma entrada aqui. A próxima sessão começa lendo a primeira entrada.

**Modelo:**

```markdown
## AAAA-MM-DD — <quem> — <pacote(s)>
- **Feito:** …
- **PRs:** PetCardOrg/petcard-<repo>#<n> (status)
- **Decisões:** … (copiar também para a tabela do PLANO)
- **Descobertas / itens derivados:** …
- **Bloqueios:** …
- **Próximo passo:** <ação exata, com pacote, repo e item>
```

---

## 2026-10-31 — alvaro-unifor (com Claude) — P9 (merge) e P2 (fechamento)
- **Feito:** web#69 e docs#83 mergeados; CI da `develop` da web verde em `bcfaf93`. WEB-04, 06, 07, 13, 15 e 16 ✅ em develop, marcados na #66. O WEB-16 cumpre o último aceite do API-06: depois do cadastro, o dashboard mostra que o nome não confere. **API-06 ✅, P2 completo, #59 fechada.** A #66 continua aberta só pelo WEB-05.
- **PRs:** PetCardOrg/petcard-web#69 (mergeado) · PetCardOrg/petcard-docs#83 (mergeado)
- **Decisões:** nenhuma.
- **Bloqueios:** P6 (e o WEB-05) dependem da publicação da 0.24.0, que precisa de um PR `develop → main` novo no shared quando liberarem a `main`.
- **Próximo passo:** **P10** (#67) no `petcard-web`, branch `refactor/aud-p10-enxugar` a partir da `develop` atualizada: WEB-09 (`toDto` também na criação e `RecordCard` extraído para as 3 abas do `VetPetProfilePage`, refactor sem mudar comportamento, coberto pelos testes do P9) e WEB-11 (`SPECIES_COLORS`, `formatDate` e o PATCH `/veterinarios/me` em `src/utils/` e numa função só). O **WEB-12** só depois de perguntar a D4 ao time (há QR impresso com caminho sem `#`?).

## 2026-10-31 — alvaro-unifor (com Claude) — P9
- **Feito:** #66 atribuída e comentada. Branch `fix/aud-p9-correcoes` na web, 1 commit por item, todos com teste visto falhando antes:
  - **WEB-04:** `deleteError` no topo da aba (fora do modal), limpo ao trocar de aba ou ao tentar de novo. Vale para registro e nota.
  - **WEB-06:** `src/utils/datas.ts` (`hojeLocal`, `diaIsoLocal`) no `emptyForm`, no `isValidDate` e na regra de aplicação no futuro. Teste às 23h30 de São Paulo.
  - **WEB-07:** o dashboard tem um efeito só (`[termo, página]`) e uma trava pela última busca; a mesma trava no `load` do prontuário. Foi usada a trava, e não `AbortController`: o `apiFetch` ficou como estava.
  - **WEB-13:** a mensagem padrão do bloqueio de CRMV passou a ser traduzida na exibição; `t` saiu das dependências do `load`.
  - **WEB-15:** os três textos fixos do achador agora são neutros (pt-BR e en-US).
  - **WEB-16:** `CrmvAviso` com aviso próprio e link **Corrigir meu nome**; o dashboard repassa a situação do status, então o aviso pós-cadastro mostra o motivo.
  - Verificação: `lint` ✅ · `test:cov` 224 ✅ (86 / 83,7 / 77 / 86) · `build` ✅.
- **PRs:** PetCardOrg/petcard-web#69 (aberto, review pedido a camilampinheiro)
- **Decisões:** nenhuma nova.
- **Descobertas / itens derivados:**
  - **WEB-17** (P13): a web reconhece o nome divergente pelo **texto** da situação, copiado da API. O código estável no contrato depende de release do shared.
  - **O shared#83 (release 0.24.0) foi fechado sem merge em 2026-10-30**, e não está mais aberto como o painel e o LOG diziam. Quando liberarem a `main`, a release precisa de um PR `develop → main` novo. Painel corrigido.
  - Para a API, só verificação **aprovada** é reaproveitada: depois de corrigir o nome, "Verificar" consulta o conselho de novo, sem `force`.
- **Bloqueios:** P6 (e o WEB-05) dependem da publicação da 0.24.0.
- **Próximo passo:** depois do merge do web#69, marcar WEB-04/06/07/13/15/16 ✅ (em `itens/web.md`, no painel e na #66) e o aceite web do API-06 (fechar a **#59**). A #66 continua aberta por causa do WEB-05. Enquanto o P6 estiver parado, seguir para o **P10** (#67) na web, branch `refactor/aud-p10-enxugar` a partir da `develop` atualizada (precisa do web#69 mergeado, porque os testes do P9 cobrem o refactor): WEB-09 (`toDto` na criação e `RecordCard` nas 3 abas), WEB-11 (duplicações). O WEB-12 só depois de confirmar a D4 com o time. Quando liberarem a `main` do shared: novo PR `develop → main`, confirmar a 0.24.0, fechar a #62 e começar o P6.

## 2026-10-31 — alvaro-unifor (com Claude) — P7 e P8 (fechamento)
- **Feito:** api#185, api#186 e docs#82 mergeados. Antes do merge foi conferido que os dois PRs da API não têm arquivo em comum e que, juntos, passam 791 testes e o build. CI da `develop` verde depois dos dois. API-08, API-10, API-11 e API-09 ✅ em develop. **P7 e P8 completos; #64 e #65 fechadas.**
- **PRs:** PetCardOrg/petcard-api#185 (mergeado) · PetCardOrg/petcard-api#186 (mergeado) · PetCardOrg/petcard-docs#82 (mergeado)
- **Decisões:** nenhuma. Segue sem `develop → main`: o shared#83 está aberto e o P6, parado.
- **Bloqueios:** P6 depende da publicação da 0.24.0 (shared#83).
- **Próximo passo:** **P9** (#66) no `petcard-web`, branch `fix/aud-p9-correcoes` a partir da `develop`, **sem o WEB-05** (depende do API-24, do P6): WEB-04, WEB-06, WEB-07, WEB-13 e o derivado **WEB-16** (mensagem de nome divergente do CRMV, que fecha o aceite do API-06 e permite fechar a #59). Quando liberarem o `develop → main` do shared: mergear o shared#83, confirmar a 0.24.0, fechar a #62 e começar o P6.

## 2026-10-30 — alvaro-unifor (com Claude) — P8 (e CI do P7)
- **Feito:**
  - **P7:** o CI do api#185 reprovou no e2e: o mock do `UploadService` em `test/utils/e2e-app.ts` não tinha `discardFile`. Corrigido num commit a mais (`test(e2e): …`); CI verde.
  - **P8:** #65 atribuída e comentada. Branch `refactor/aud-p8-filas` na API:
    - **API-11** (refactor puro, commit próprio): `rmq.ts` com `FILAS`, `rmqOptions`, `retryOrDlq`/`getRetryCount` e `RETRY_HEADER` únicos; `main.ts`, `queue.module.ts`, topologia e os 3 consumidores passam a usá-los. Testes dos consumidores sem alteração (36 ✅).
    - **API-09:** espera `1000 * 2 ** retryCount` antes de republicar; `rmq.spec.ts` com timers falsos; specs dos consumidores trocam a espera por `spyOn(backoff, 'esperar')`. DLQ sem leitor documentada no `rmq.ts` e no `CLAUDE.md`.
  - Verificação: `lint` ✅ · `npm test` 772 ✅ · `build` ✅ · **e2e local 81 ✅** (Postgres e RabbitMQ do `docker/`) · boot do `dist` com RabbitMQ real (banco `petcard_test`, `FCM_ENABLED=false`, CRMV `stub`, SMTP em porta morta): 3 consumidores, 3 `DLX/DLQ ready`, filas com os mesmos argumentos, sem `PRECONDITION_FAILED`. Containers desligados no fim. CI do api#186 verde.
- **PRs:** PetCardOrg/petcard-api#185 (aberto, CI verde) · PetCardOrg/petcard-api#186 (aberto, CI verde) · review pedido a camilampinheiro nos dois
- **Decisões:** nenhuma nova. Segue valendo: sem `develop → main`; P6 parado até a 0.24.0.
- **Descobertas:**
  - Dá para rodar o e2e local: `docker start petcard-postgres petcard-rabbitmq` (o banco `petcard_test` já existe). O `gas-postgres` de outro projeto usa a porta 5434, sem conflito.
  - O `.env` de dev tem `FCM_ENABLED=true` e SMTP real, e o boot dispara lembretes entre 9h e 21h: para subir a API local sem efeito colateral, sobrescrever `DATABASE_URL` (banco de teste), `FCM_ENABLED=false`, `CRMV_PROVIDER=stub` e o SMTP na linha de comando.
- **Bloqueios:** P6 depende da publicação da 0.24.0 (shared#83).
- **Próximo passo:** **P9** (#66) no `petcard-web`, branch `fix/aud-p9-correcoes` a partir da `develop`, **sem o WEB-05** (depende do API-24, do P6): WEB-04, WEB-06, WEB-07, WEB-13 e o derivado **WEB-16** (mensagem de nome divergente do CRMV, que fecha o aceite do API-06 e permite fechar a #59). Em paralelo: depois dos merges do api#185 e do api#186, marcar API-08/10/11/09 ✅ e fechar a #64 e a #65; quando liberarem o `develop → main` do shared, mergear o shared#83, confirmar a 0.24.0, fechar a #62 e começar o P6.

## 2026-10-30 — alvaro-unifor (com Claude) — P7
- **Feito:** #64 atribuída e comentada. Branch `fix/aud-p7-robustez` na API, 1 commit por item:
  - **API-08:** `enqueueCalendarSync` captura a falha de publicação em `create`/`update`/`remove`; a linha fica `PENDING_*` e o `syncAllPending` recupera. No `remove` o evento fica órfão (vira o API-25).
  - **API-10:** `POST /upload/image` limitado a 10/min **por usuário** (`UserThrottlerGuard` pelo `sub`, balde `auth` com teto `LIMITE_DE_UPLOAD`). `UploadService.discardFile` (melhor esforço) na troca de foto e na exclusão de pet/tutor/vet, incluindo as fotos dos pets na exclusão do tutor. `tutor.service.spec.ts` novo.
  - Verificação: `npm run lint` sem diff fora do escopo · `npm test` 787 ✅ · `npm run build` ✅. E2E não rodado (sem Postgres local).
- **PRs:** PetCardOrg/petcard-api#185 (aberto, review pedido a camilampinheiro)
- **Decisões:** **sem `develop → main` por enquanto** (pedido do alvaro-unifor). O shared#83 (release 0.24.0) fica aberto sem merge, e o **P6 fica parado** até a 0.24.0 ser publicada. O P7 andou antes do P6 porque não usa contrato do shared; a seta P6 → P7 do mapa é de ordem, não de dependência técnica.
- **Descobertas / itens derivados:**
  - **API-25** (P13): excluir agendamento com a fila fora deixa o evento órfão no Google; corrigir com exclusão lógica (`PENDING_DELETE`).
  - **API-26** (P13): anexos privados e PNGs de QR ficam no S3 na exclusão em cascata de pet/tutor.
  - Um throttler **nomeado novo** obrigaria todos os `@SkipThrottle` existentes a incluí-lo (o guard avalia todos); por isso o upload reusa o balde `auth` com teto próprio.
  - O contrato em `petcard-docs/docs/api/openapi.json` não foi regenerado (só ganha o 429 do upload).
- **Bloqueios:** P6 depende da publicação da 0.24.0 (shared#83).
- **Próximo passo:** **P8** (#65) na API, branch `refactor/aud-p8-filas` a partir da `develop`: primeiro o **API-11** (helper `rmqOptions` e `retryOrDlq` compartilhado, refactor puro, commit próprio) e depois o **API-09** (backoff `1000 * 2 ** retryCount` dentro do `retryOrDlq`, teste com timers falsos). Em paralelo: depois do merge do api#185, marcar API-08/10 ✅ e fechar a #64; quando liberarem o `develop → main` do shared, mergear o shared#83, confirmar a 0.24.0 e fechar a #62.

## 2026-10-30 — alvaro-unifor (com Claude) — P5 (merge e release)
- **Feito:** shared#82 e docs#81 mergeados. SH-02, SH-03 e SH-08 (`MaxLength`) ✅ em develop; checklist da #62 marcado. PR de release `develop → main` aberto, levando P4 + P5 para a 0.24.0.
- **PRs:** PetCardOrg/petcard-shared#82 (mergeado) · PetCardOrg/petcard-docs#81 (mergeado) · PetCardOrg/petcard-shared#83 (aberto, `develop → main`)
- **Decisões:** nenhuma.
- **Bloqueios:** nenhum.
- **Próximo passo:** depois do merge do shared#83, conferir o workflow *Publish Package* na `main` e rodar `npm view @petcardorg/shared version` (deve dar `0.24.0`). Marcar a caixa do publish e a de status na #62, anotar no painel e **fechar a #62**. Em seguida, **P6** (#63): branch `fix/aud-p6-reautenticacao` na API a partir da `develop`, `npm install @petcardorg/shared@^0.24.0` e começar pelo API-20/API-04 (a API verifica `google_id_token` com a mesma lógica do login Google, exigindo `iat` recente e `sub` igual ao da conta).

## 2026-10-30 — alvaro-unifor (com Claude) — P5
- **Feito:** D2 decidida. #62 atribuída e comentada. Branch `fix/aud-p5-contratos` no `petcard-shared`, 1 commit por item:
  - **SH-02:** validador `maxBytes` (bytes UTF-8 contados por code point; o build não tem os tipos do `TextEncoder`) no lugar do `MaxLength` da senha. O `todo` virou 3 testes (acento, limite exato, emoji).
  - **SH-03:** vet exige `senha_atual` também com `email`. `UpdateTutorDto` ganhou `senha_atual?`/`google_id_token?` (um dos dois obrigatório com `email`). `DeleteTutorDto` novo (um dos dois obrigatório), exportado no barrel. O `todo` virou teste e entrou `test/tutor-reauth.test.ts`.
  - **SH-08:** `MaxLength(2048)` no `photo_url` de `CreatePetDto`/`UpdatePetDto`.
  - `chore(release): 0.24.0`.
  - Verificação: `build` ✅ · `lint:check` ✅ · `npm test` 41 ✅, 0 `todo` · CI do PR verde, com o `check-version-bump.sh` aceitando 0.23.0 → 0.24.0 (fecha de vez o aceite do SH-04).
- **PRs:** PetCardOrg/petcard-shared#82 (aberto, review pedido a camilampinheiro)
- **Decisões:** **D2 = `id_token` do Google obtido na hora**, enviado na própria requisição de trocar e-mail ou excluir a conta, sem guardar nada. A API exige token recente e do mesmo `sub`. Registrada no PLANO.
- **Descobertas:**
  - Os 3 consumidores estão em `^0.23.0`, que em 0.x **não** inclui a 0.24.0: nada muda neles até o P6 subir a dependência.
  - O nome da regra da senha mudou de `maxLength` para `maxBytes`; nenhum consumidor depende dele (`grep`).
  - Com `core.autocrlf=true`, `prettier --check` acusa os 47 arquivos por CRLF; usar `--end-of-line auto` para conferir localmente (o `lint:check` não sofre com isso).
- **Bloqueios:** nenhum.
- **Próximo passo:** depois do merge do shared#82, abrir o PR `develop → main` do `petcard-shared`, conferir o `publish.yaml` e rodar `npm view @petcardorg/shared version` (deve dar `0.24.0`). Aí marcar SH-02/03/08 ✅ (+ a caixa do publish) em `itens/shared.md`, no painel e na #62, e **fechar a #62**. Em seguida, **P6** (#63): branch `fix/aud-p6-reautenticacao` na API a partir da `develop`, `npm install @petcardorg/shared@^0.24.0` e começar pelo API-20/API-04 (a API verifica `google_id_token` com a mesma lógica do login Google, exigindo `iat` recente e `sub` igual ao da conta).

## 2026-10-30 — alvaro-unifor (com Claude) — P4 (fechamento)
- **Feito:** shared#81, api#184 e docs#79 mergeados. SH-05, SH-01 e SH-04 ✅ em develop; CI do shared verde na `develop` (25 testes + 2 `todo`). **P4 completo; issue #61 fechada.**
- **PRs:** PetCardOrg/petcard-shared#81 (mergeado) · PetCardOrg/petcard-api#184 (mergeado) · PetCardOrg/petcard-docs#79 (mergeado)
- **Decisões:** nenhuma. O P5 **não foi iniciado** (a #62 segue sem responsável).
- **Descobertas:** o login Google existe só para tutor; vet sempre tem senha. Então a D2 afeta só o `UpdateTutorDto`/`DeleteTutorDto`: com `id_token`, o DTO aceita `senha_atual` **ou** `google_id_token` (a API decide qual vale pela conta); com confirmação por e-mail, o DTO só ganha `senha_atual` e surge um fluxo novo. A regra do vet (`senha_atual` exigida com `email`) não depende da D2.
- **Bloqueios:** **D2 em aberto**, bloqueia a parte do tutor no SH-03.
- **Próximo passo:** decidir a **D2** com o usuário (registrar no PLANO e no LOG). Depois, **P5** (#62) no `petcard-shared`, branch `fix/aud-p5-contratos` a partir da `develop`: SH-02 (senha em bytes; transformar o `todo` em teste), SH-03 (vet + tutor conforme a D2 + `DeleteTutorDto`; idem), SH-08 (`MaxLength(2048)` no `photo_url`), bump **minor → 0.24.0**, `develop → main` e confirmar o publish. SH-02 e SH-08 podem andar antes da D2.

## 2026-10-30 — alvaro-unifor (com Claude) — P4
- **Feito:** #61 atribuída e comentada. Branch `test/aud-p4-rede-de-seguranca` no `petcard-shared`, 1 commit por item:
  - **SH-05:** 25 testes com `node:test` em `test/` (fora do `dist`), rodando no CI; senha em bytes (SH-02) e `senha_atual` com e-mail (SH-03) ficam como `todo` até o P5. Mutação de conferência: trocar `>` por `>=` no `IsAfterDate` faz 1 teste falhar.
  - **SH-01:** `lint:check` sem `--fix` no CI.
  - **SH-04:** `scripts/check-version-bump.sh` no CI de PR; `publish.yaml` só trata `E404` como versão nova (testado contra o GitHub Packages: existente, inexistente, token inválido).
  - Linha de base pedida em `itens/shared.md`: na `develop` (`f5b1b3e`), `npm run build` e o ESLint sem `--fix` **passavam**. O `dist` gerado depois da mudança ficou byte a byte igual ao de antes.
  - Verificação final: `build` ✅ · `lint:check` ✅ · `npm test` 25 ✅ + 2 todo.
- **PRs:** PetCardOrg/petcard-shared#81 (aberto, review pedido a camilampinheiro) · PetCardOrg/petcard-api#184 (aberto, a parte do SH-01 na API)
- **Decisões:** nenhuma nova. D2 e D4 seguem em aberto (não bloqueiam o P5).
- **Descobertas / itens derivados:**
  - SH-01 nos outros repos: só a **API** rodava `npm run lint` (com `--fix`) no CI; **web** (`eslint .`) e **mobile** (`eslint . --ext .ts,.tsx`) já estavam certos. O lint da API passa sem `--fix` na `develop` atual.
  - O TypeScript 6 não carrega mais `@types/*` por padrão: o `tsconfig.json` do shared passou a declarar `types: ["node"]` e o `tsconfig.build.json` fixa `types: []`, para o pacote seguir sem tipos de Node.
  - O `@Type` do class-transformer exige `reflect-metadata` carregado; nos consumidores ele vem do Nest. Os testes carregam com `node --require reflect-metadata`.
  - No Node 22+, `node --test <diretório>` não funciona (o argumento é glob): o script usa `.test-dist/test/*.test.js` sem aspas, que o `sh` do CI (Node 20) expande.
  - O `package-lock.json` do shared estava com a versão raiz em 0.21.0; o PR corrige.
- **Bloqueios:** nenhum.
- **Próximo passo:** depois do merge do shared#81 e do api#184, marcar SH-05/01/04 ✅ em `itens/shared.md`, no painel e na #61 e **fechar a #61** (o aceite do SH-04 se confirma de vez no primeiro PR do P5, que muda `src/`). Em seguida, **P5** (#62) no `petcard-shared`, branch `fix/aud-p5-contratos` a partir da `develop`: SH-02 (senha em bytes; transformar o `todo` em teste), SH-03 (`senha_atual` com e-mail + `DeleteTutorDto`; idem), SH-08 (`MaxLength(2048)` no `photo_url`), bump **minor → 0.24.0**, depois `develop → main` e confirmar o publish.

## 2026-10-30 — alvaro-unifor (com Claude) — P3 (fechamento)
- **Feito:** api#183 e docs#77 mergeados. API-02 e API-15 (arquivos de reminder) ✅ em develop. **P3 completo em develop; issue #60 fechada.**
  - Validação no staging (deploy automático da `develop`): `REMINDERS_TRIGGER_SECRET` criado no Render de staging; `POST /internal/reminders/run` → 204 e log dos dois serviços (0 lembretes na janela). O boot às 23h de Fortaleza pulou a execução, como projetado.
  - Repository secrets `REMINDERS_TRIGGER_SECRET` e `REMINDERS_API_URL` (`https://petcard-api.onrender.com`) orientados no GitHub da API.
- **PRs:** PetCardOrg/petcard-api#183 (mergeado) · PetCardOrg/petcard-docs#77 (mergeado)
- **Decisões:** staging usa um segredo **diferente** do de produção e não entra no workflow agendado (só tem o boot e o disparo manual).
- **Descobertas / itens derivados:**
  - O staging roda com `NODE_ENV=production` (vem do `Dockerfile`), então qualquer variável "obrigatória em produção" também derruba o staging. Ao adicionar uma, cadastrar nos dois Renders **antes** do merge na `develop`.
  - No PowerShell 5.1, `curl` é apelido do `Invoke-WebRequest`: usar `curl.exe` nos exemplos para o time.
  - FCM desligado no staging (`FCM_ENABLED=false`): lembrete ponta a ponta só dá para ver em produção ou ligando o FCM lá.
- **Bloqueios / pendente fora do código:** `REMINDERS_TRIGGER_SECRET` já cadastrado no Render de produção e os repository secrets no GitHub (alvaro-unifor). Falta o `develop → main` da API; depois do deploy, rodar Actions → "Lembretes diários" → *Run workflow* e conferir que fica verde.
- **Próximo passo:** **P4** (#61) no `petcard-shared`, branch `test/aud-p4-rede-de-seguranca` a partir da `develop`: SH-05 (testes) → SH-01 (lint do CI sem `--fix`) → SH-04 (checagem de versão). Sem mudança em `src/`, então sem bump.

## 2026-10-29 — alvaro-unifor (com Claude) — P3 (API-02 e API-15 em PR)
- **Feito:** o API-02 e o API-15 estavam commitados localmente (branch `fix/aud-p3-lembretes`, sem push) desde antes do merge do api#182; a versão local do API-03 ficou obsoleta e foi descartada. Branch nova `fix/aud-p3-disparo-externo` a partir da `develop`, com cherry-pick dos dois commits (conflito só no `dose-reminder.service.spec.ts`: ficaram o teste do API-03 e o da idempotência). Assumi a #60 junto com a camila, com aviso na issue.
  - API-02: workflow `reminders.yml` (12:00 UTC + `workflow_dispatch`) → `POST /internal/reminders/run` com `X-Reminders-Secret`; execução no boot (9h–21h de Fortaleza); `REMINDERS_TRIGGER_SECRET` obrigatório em produção.
  - API-15: comentários dos dois arquivos de reminder.
  - `npm run lint` sem diff · `npm test` 768 ✅ · `npm run build` ✅. E2E não rodado (sem Postgres local).
- **PRs:** PetCardOrg/petcard-api#183 (aberto, aguardando review)
- **Decisões:** disparo externo pelo GitHub Actions (e não por Render Cron Job, que é pago).
- **Descobertas / itens derivados:** o API-15 ainda cita CloudWatch no `.env.example` (~122) e no `config/mail.config.ts` (~48); fica para o P13, onde o item está listado.
- **Bloqueios:** antes do deploy, criar `REMINDERS_TRIGGER_SECRET` no Render (sem ela o boot de produção falha) e os secrets `REMINDERS_TRIGGER_SECRET` e `REMINDERS_API_URL` no repo da API.
- **Próximo passo:** depois do merge do api#183, marcar API-02 e API-15 (reminder) ✅ em `itens/api.md`, no painel e na #60, e **fechar a #60** (o aceite "configurado" do API-02 só se confirma com as variáveis no Render/Actions e uma execução manual do workflow depois do `develop → main`). Em seguida, **P4** (#61) no `petcard-shared`: rede de segurança (testes, lint do CI sem `--fix`, checagem de versão).

## 2026-10-29 — camila — P3 (API-03 em develop)
- **Feito:** #60 atribuída e comentada. Branch `fix/aud-p3-lembretes` (petcard-api, a partir da `develop`). **API-03** implementado em 1 commit (`b9b8ab4`): `schedulePush` marca `FAILED` (`ENQUEUE_FAILED`) a notificação cuja publicação falhou e devolve só as publicadas; retorno vazio faz o lembrete soltar a reivindicação. Testes: o antigo (que travava o comportamento errado) foi reescrito, mais um de falha parcial entre aparelhos e um do reminder. `npm test` 753 ✅, `build` ✅.
- **PRs:** PetCardOrg/petcard-api#182 (mergeado em 2026-10-29)
- **Descobertas / itens derivados:**
  - `npm run build` falhou no `auth-token.service.ts` até rodar `npx prisma generate` (client do Prisma desatualizado na máquina; não é regressão).
  - `npm run lint` (com `--fix`) reformatou 4 arquivos fora do escopo (`anexo.service.ts`, `routes-decorated.spec.ts`, `calendar-sync.message.ts`, `test/utils/acao-clinica.ts`), diferença de versão do prettier; revertidos, não entram no PR. Reforça o item do `--fix` no lint.
- **Bloqueios:** nenhum.
- **Próximo passo:** em branch nova a partir da `develop`, **API-02** (disparo externo documentado + execução no boot com teste de idempotência 2×; D1 = Render gratuito) e **API-15** nos dois arquivos de reminder (trocar comentários de ECS/CloudWatch). Depois PR para a `develop` da API e atualização de `itens/api.md`, do painel e da #60 (a #60 só fecha com API-02 e API-15).

## 2026-10-29 — camila — P2 (fechamento do status) e arranque do P3
- **Feito:** api#181 conferido como **mergeado em 2026-10-28** (`44760dc` na `develop`; testes de API-05/06/07 presentes no diff). `itens/api.md` e o painel atualizados: API-05 e API-07 ✅ em develop; API-06 🟨 (falta só o aceite web, WEB-16 no P9). Os 5 repos sincronizados (`develop` local em fast-forward; nenhum commit local perdido).
- **PRs:** PetCardOrg/petcard-docs (branch `docs/aud-status-2026-10-29`, ainda a abrir). Nenhum PR de auditoria aberto nos 5 repos.
- **Decisões:** nenhuma nova. D2 e D4 seguem em aberto (não bloqueiam o P3).
- **Bloqueios:** nenhum.
- **Próximo passo:** mergeado o PR de status, **fechar a #59 com comentário** (ressalva: aceite web do API-06 vive no WEB-16, P9) ou mantê-la aberta até lá, a critério do time. Em seguida, **P3** (#60) no `petcard-api`, branch `fix/aud-p3-lembretes` a partir da `develop`: começar pelo **API-03** (lembrete perdido quando a publicação no RabbitMQ falha), depois API-02 (disparo externo + execução no boot; D1 = Render gratuito) e API-15 nos arquivos de reminder.

## 2026-10-28 — alvaro-unifor (com Claude) — P2
- **Feito:** API-05, API-06 e API-07 implementados (1 commit cada) e em PR.
  - API-05: vincular Google a conta de e-mail não verificado zera a senha e renova o `passwordChangedAt`.
  - API-06: `nomesConferem` (D3: primeiro + último nome) aplicado no `verify()`, que serve ao cadastro e à revalidação. Situação gravada: "Nome do cadastro não confere com o titular do CRMV".
  - API-07: boot falha em produção sem `CRMV_PROVIDER` ou com valor desconhecido; `stub` explícito sobe com aviso.
- **PRs:** PetCardOrg/petcard-api#181 (aberto, aguardando review)
- **Decisões:** D3 registrada no PLANO. `CRMV_PROVIDER` confirmado no Render pelo alvaro-unifor.
- **Descobertas / itens derivados:** WEB-16, a mensagem da web para nome divergente (P9). É o 3º aceite do API-06, que fica em aberto até lá.
- **Bloqueios:** nenhum. Antes do deploy, conferir que o valor no Render é exatamente `infosimples` ou `stub`.
- **Próximo passo:** depois do merge do api#181, marcar API-05/06/07 em `itens/api.md`, no painel e na #59 e fechá-la (o aceite web do API-06 segue no WEB-16). Em seguida, o **P3** (#60) no `petcard-api`: começar pelo **API-03** (lembrete perdido quando a publicação no RabbitMQ falha), depois API-02 (disparo externo + execução no boot; D1 = Render gratuito).

## 2026-10-28 — alvaro-unifor (com Claude) — P1 (fechamento)
- **Feito:** PetCardOrg/petcard-mobile#97 e PetCardOrg/petcard-docs#73 mergeados. MOB-02/03 ✅ em develop. **P1 completo em develop; issue #58 fechada.**
- **Pendente fora do código:** `develop → main` da API e da web antes da gravação (PC-106) e o teste do API-01 com dois aparelhos em produção; cadastrar as variáveis do MOB-15 no EAS antes de qualquer build production.
- **Decisões:** **D3** = primeiro + último nome, normalizados (alvaro-unifor). `CRMV_PROVIDER` **confirmado como definido** no Render de produção (alvaro-unifor), o que libera o merge do API-07.
- **Próximo passo:** abrir o **P2** (#59) no `petcard-api`, começando pelo **API-05**, branch `fix/aud-p2-identidade-crmv`; depois API-06 (D3 decidida) e API-07.

## 2026-10-28 — alvaro-unifor (com Claude) — P1
- **Feito:**
  - **API-01** ✅ em develop: `trust proxy` = 1 (`src/common/http/trust-proxy.ts`), teste de integração e nota no `CLAUDE.md`.
  - **WEB-01, WEB-02, WEB-03, WEB-08** ✅ em develop: sessão sobrevive ao cold start, aviso do achador com estado de falha, Voltar sem prender o vet, template `caminho` nos services.
  - **MOB-02, MOB-03** 🟦 em PR: upload de foto com 60s; build preview/production falha sem `EXPO_PUBLIC_API_URL` (variável conferida no EAS).
- **PRs:** PetCardOrg/petcard-api#180 (mergeado) · PetCardOrg/petcard-web#68 (mergeado) · PetCardOrg/petcard-mobile#97 (aberto, aguardando review)
- **Decisões:** nenhuma nova.
- **Descobertas / itens derivados:**
  - WEB-15: textos fixos da LostPetPage afirmam o aviso antes de ele sair (P9).
  - MOB-15: ambiente production do EAS sem a chave do Maps e os client IDs do Google (P11; é configuração, não código).
  - Lint do mobile no Windows: o checkout com `core.autocrlf=true` gera milhares de erros `␍` do prettier; não é regressão (o lint-staged normaliza no commit). Para ver os erros reais: `npx eslint --rule 'prettier/prettier: off' <arquivos>`.
- **Bloqueios:** nenhum. A validação do API-01 em produção depende do `develop → main` da API.
- **Próximo passo:** depois do merge do mobile#97, marcar MOB-02/03 como ✅ em `itens/mobile.md`, no painel e na issue #58, e **fechar a #58**. Em seguida, abrir o **P2** (#59) no `petcard-api`, começando pelo **API-05** (zerar senha ao vincular conta Google não verificada); o API-06 depende da decisão **D3**, a perguntar antes.

## 2026-10-28 — alvaro-unifor (com Claude) — Fase 0 (preparação)
- **Feito:**
  - `main` e `develop` locais dos 5 repos sincronizados com o remoto (fast-forward; nenhum commit local perdido). Não existe branch `production`: `main` é a produção.
  - Os 4 relatórios (`originais/`) foram **revalidados contra a `main` atual**: todos os achados continuam presentes (API `9483562`, shared `b4bb3c2` v0.23.0, web `df20d98`, mobile `e0def80`).
  - Criada esta estrutura: especificação por item (`itens/`), plano em 14 pacotes (`PLANO.md`) e protocolo (`COMO-CONTINUAR.md`).
- **Descobertas / itens derivados:**
  - API-23: a API não tem rota para descadastrar token de push (bloqueia MOB-01).
  - API-24: confirmar que o PATCH clínico grava `null` (bloqueia WEB-05).
  - API-20: a API tem **cópia própria** do validador de senha (`src/common/crypto/password.validators.ts`), então o SH-02 sozinho não corrige a API.
  - WEB-14 / MOB-14: as telas precisam pedir `senha_atual` quando o API-04 entrar.
  - O lint com `--fix` no CI (SH-01) também aparece no `package.json` da API.
- **Decisões:** D1 = Render no plano gratuito (API-02 segue crítico). D5 = status nas issues do GitHub, sem Trello.
- **Bloqueios:** D2, D3 e D4 em aberto (ver PLANO). Nenhuma bloqueia o P1.
- **Próximo passo:** abrir o **P1**, começando por `petcard-api` → **API-01** (`trust proxy`), branch `fix/aud-p1-trust-proxy`.
