# ADR-007: Remoção do campo `role` vestigial em `Tutor`

**Data:** 2026-08-26
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

O model `Tutor` em `petcard-api/prisma/schema.prisma` tem um campo `role Role @default(TUTOR)`, com o enum `Role { TUTOR, VET }`. `Veterinario`, porém, é uma tabela totalmente separada desde a **PC-083** (`9f801b5`, 29/05) — sem FK, sem relação nenhuma com `Tutor` — e nunca teve campo `role` próprio.

Investigação (sem tocar em código/schema) mostrou a origem: `role` entrou no schema em `f29e977` (13/04, MVP1) — **antes** de `Veterinario` existir como tabela. É vestígio de um design de usuário unificado (papel dentro do próprio `Tutor`) que foi abandonado a favor de tabelas separadas, e o campo nunca foi limpo depois do pivô.

### O achado que eleva isso de cosmético para bug de RBAC

O campo não é inofensivo hoje. Dois pontos concretos:

1. **`prisma/seed.ts`** cria uma conta demo `Tutor` para "Dra. Camila Ferreira" (`camila.ferreira@vet.example.com`) com `role: Role.VET` — a mesma pessoa que já tem sua própria linha em `Veterinario` com o mesmo e-mail. O comentário no próprio seed (linha 29-31) diz *"não são tutores com papel VET"*, mas a linha 25 contradiz.
2. **`auth.service.ts`**, no `login()` de tutor (linha ~93), assina o JWT lendo o campo do banco: `this.signToken(tutor.id, tutor.email, tutor.role as Role)` — em vez de hardcodar `Role.TUTOR`. `loginVeterinario()` já não faz isso: assina `Role.VET` fixo, sem depender de coluna nenhuma (`Veterinario` nem tem `role`).

Combinando os dois: logar em `POST /auth/login` (rota de **tutor**) com `camila.ferreira@vet.example.com` / `petcard123` produz um JWT `role: VET` cujo `sub` é o id do **Tutor**, não do `Veterinario`. Esse token passa em qualquer rota gateada só por `@Auth(Role.VET)` — ex. `veterinario.controller.ts` (`me/crmv`, `me`, `dashboard/pets`) e `tutor.controller.ts:61` — sem que a pessoa tenha passado pela verificação de CRMV da ADR-005. Rotas com `@AuthCrmvVerificado(Role.VET)` devem falhar depois (o guard busca CRMV pelo `sub`, que não bate com nenhum `Veterinario`), mas o comportamento downstream exato (404 limpo vs. erro menos claro) não foi verificado em runtime.

Nenhum outro caminho de escrita seta `role` num `Tutor`: `RegisterDto` e os DTOs de atualização de perfil não têm esse campo, e nenhum `tutor.create`/`tutor.update` no código toca nele. O problema está contido no seed, mas o seed é exatamente o que roda para preparar as contas de demo/UC (`docs/qa/roteiro-testes-manuais.md`) — inclusive as usadas na Fase 3 (PC-094).

## Decisão

Duas direções foram avaliadas:

1. **Remover `role` de `Tutor`, manter `Veterinario` como tabela separada** — só tira o vestígio, sem mexer na separação já estabelecida na PC-083.
2. **Unificar `Tutor` e `Veterinario` numa única tabela** (ex. `users`), usando `role` como diferenciador.

**Decisão: opção 1.** `Tutor` e `Veterinario` já divergem estruturalmente o bastante para que uma tabela única exigisse nullable-hell (CRMV, `crmvVerifiedAt`/`crmvSituacao`, `petsAtendidos` de um lado; `pets`, `appointments`, `notifications`, `deviceTokens`, `googleOAuthToken` do outro) e um refactor cross-repo — guards, DTOs no `@petcardorg/shared`, telas de `petcard-web`/`petcard-mobile`, seeds, migrations de toda FK que aponta pra `tutor_id`/`veterinario_id`. Não há ganho que justifique esse raio de mudança numa M7 que já está com Fase 1 quase fechada; é o tipo de refactor amplo que o `CLAUDE.md` da raiz já lista como fora de escopo.

### O que muda

- **Schema:** remover `role` de `model Tutor` (migration `drop column`). O `enum Role` continua existindo — é usado no claim do JWT e nos guards (`Role.TUTOR`/`Role.VET`), só deixa de ser uma coluna do `Tutor`.
- **`auth.service.ts`:** `login()` passa a assinar `Role.TUTOR` fixo, no mesmo padrão que `loginVeterinario()` já assina `Role.VET` fixo. Nenhum outro trecho depende do campo (confirmado por busca em `src/` e `test/`).
- **`prisma/seed.ts`:** a conta demo da Dra. Camila Ferreira deixa de existir como `Tutor` — só a linha em `Veterinario` permanece. Ajustar o array `tutors` para remover o campo `role` de todas as entradas (ou removê-lo do array inteiramente, já que só existia por causa desse campo).
- **Testes:** `jwt.strategy.spec.ts`, `roles.guard.spec.ts` e `secure-by-default.spec.ts` não dependem de `Tutor.role` (usam `role` só no payload do JWT mockado), não deveriam quebrar. Adicionar um teste de regressão para `login()` confirmando que o token sai sempre `Role.TUTOR`, independente do que estivesse no banco antes da migration.

## Consequências

**A favor:**

- Fecha o caminho de escalonamento de privilégio descrito acima: nenhuma conta de tutor pode mais sair do login com `role: VET`, porque a informação deixa de existir no banco e o código para de confiar nela.
- Remove uma conta de demo confusa e duplicada (mesma pessoa como `Tutor` e `Veterinario`) que não tinha uso real — os UCs de veterinário já usam a linha em `Veterinario`.
- Mudança pequena e contida: uma migration, uma linha de `auth.service.ts`, um ajuste no seed. Não toca em `Veterinario`, RBAC, CRMV, nem nos três repos de cliente.

**Contra e limitações — declaradas:**

- Não resolve a duplicação de estilo entre os dois fluxos de auth (login/cadastro separados para tutor e vet) — essa duplicação é intencional e já documentada no `petcard-api/CLAUDE.md`, não é o problema que este ADR endereça.
- A tabela `Tutor` fica sem nenhum sinal de papel — se um caso de uso futuro precisar de múltiplos papéis de tutor (ex. "tutor administrador"), isso volta como decisão nova, não reaproveita este campo.
- Exige migration de banco em ambientes já rodando (staging, se a Fase 2 já tiver subido antes desta correção) — coordenar para não colidir com dado de demo já semeado lá.

## Referências

- `petcard-api/prisma/schema.prisma` (`model Tutor`, `model Veterinario`, `enum Role`)
- `petcard-api/src/modules/auth/auth.service.ts` (`login`, `loginVeterinario`, `registerVeterinario`)
- `petcard-api/prisma/seed.ts` (contas de demo dos UCs)
- ADR-005 (verificação de CRMV e acesso clínico) — a verificação que este achado permite contornar em rotas sem `@AuthCrmvVerificado`
- Commits: `f29e977` (origem do campo, MVP1) · `9f801b5` (PC-083, separação em `Veterinario`)
