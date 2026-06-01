# ADR-003: Interface do Veterinário (M5) — Escrita Reversa + Painel Web

**Data:** 2026-05-29
**Status:** 🚧 Proposta (rascunho) — pendente de sessão de arquitetura M5
**Autores:** Ricardo Temporal (demais a confirmar na sessão)

> Este documento é um **rascunho**. As seções "Decisões já fechadas" registram o que Ricardo definiu em 2026-05-29; as quatro "Pendências" estão abertas, com uma recomendação por pendência, para serem discutidas e fechadas em sessão antes de começar a codar. Ao fechar, mudar o status para **Aceita** e remover este aviso.

## Contexto

A Milestone M5 dá ao veterinário uma interface web própria e abre a **escrita reversa**: até aqui o histórico de saúde do pet só era alimentado pelo tutor (CRUDs de M1) ou por integrações de saída (M4). M5 inverte o fluxo — o veterinário autenticado adiciona **notas clínicas** (diagnóstico + prescrição) que entram no histórico do pet e disparam push para o tutor.

O escopo levantado das issues (`M5 - Interface Veterinario (Web)`):

- **`petcard-api`:** PC-075 (CRUD Veterinário), PC-076 (módulo VetNote / escrita reversa), PC-077 (push ao tutor na nova nota), PC-083 (migrations `veterinario` + `nota_clinica`).
- **`petcard-web`:** PC-078 (login do vet), PC-079 (dashboard de pets atendidos), PC-080 (perfil do pet com histórico completo), PC-081 (formulário de nota clínica), PC-082 (scanner de QR).
- **`petcard-shared`:** PC-084 (DTOs `Veterinario`/`NotaClinica`), PC-085 (release `0.9.0`).

M5 introduz decisões que não apareceram em M0-M4:

- É a primeira vez que existe **um segundo tipo de principal** além do tutor — o veterinário é uma entidade própria, não um tutor com flag.
- É a primeira **área autenticada no `petcard-web`**: hoje a SPA só serve a carteira pública (`pages/PublicCard`), o `apiFetch` (`src/services/api.ts`) é GET-only e sem header de `Authorization`, e não há lib de auth, rotas protegidas nem gerenciamento de estado.
- A escrita reversa cria dados clínicos que o tutor **pode ler mas não pode editar** — uma regra de propriedade nova.

## Decisões já fechadas (2026-05-29, com Ricardo)

### F1. Identidade do veterinário: tabela `veterinario` dedicada

O veterinário é uma **entidade própria** (`veterinario`), com CRMV único e vínculo com clínica — **não** é um `Tutor` com `role = VET`. O `enum Role { VET, TUTOR }` existente em `Tutor` deixa de ser o mecanismo de identidade do vet (ver pendência P1 sobre o destino desse enum). Segue PC-083.

### F2. Autenticação do vet via JWT próprio

O login do veterinário (PC-078) usa o **mesmo JWT próprio (HS256 + bcrypt)** do resto do sistema. A menção a "Auth0" na issue PC-078 está **desatualizada** — Auth0 foi abandonado em M0 (recomendação #7 da auditoria) e **não será reintroduzido**.

## Pendências (a fechar na sessão)

### P1. Como o JWT identifica o principal com duas tabelas

**Problema.** Hoje o `JwtStrategy` resolve o principal a partir de `tutor` (fonte única `tutor.role`, propagado em `request.user.role`), e `@CurrentUser` / `@Roles` / `RolesGuard` assumem esse formato. Com `veterinario` em tabela separada (F1), o token precisa dizer **qual tabela** o `sub` referencia.

**Opções:**

- **(A) Claim `type` no JWT + resolução por tipo no `JwtStrategy`.** O token carrega `sub` (id) + `type: 'tutor' | 'vet'`. O `JwtStrategy` busca na tabela correspondente e popula `request.user` com `{ id, type, role }`. Um único guard, mudança mínima.
- **(B) Tabela `account`/`credential` única com FK polimórfica.** Login e senha centralizados numa tabela de credencial que aponta para `tutor` ou `veterinario`. Mais "correto" em domínios grandes, mas é uma refatoração do auth de M1 inteiro.
- **(C) `VetJwtStrategy` + guard separados.** Estratégia e guard dedicados para a rota do vet. Isola, mas duplica pipeline de auth e complica rotas que sirvam ambos.

**Recomendação:** **(A)**. Custo baixo, mantém um único guard e não mexe no auth do tutor já entregue. Sub-decisão: o `Role.VET` legado vira `type='vet'` mapeado para `role=VET` na borda (para `@Roles(Role.VET)` seguir funcionando), e o `Role.VET` em `Tutor` é marcado como morto/depreciado — confirmar se removemos o valor do enum agora ou deixamos para M6.

### P2. `nota_clinica` como entidade nova vs `veterinarianName` legado

**Problema.** `VaccineRecord` e `DewormingRecord` já têm `veterinarianName String?` (texto livre). PC-076/PC-083 introduzem `nota_clinica`. Precisamos decidir se a nota é entidade nova e o que fazer com o campo legado.

**Opções:**

- **(A) `nota_clinica` é entidade nova; `veterinarianName` legado fica como está.** Nova tabela `nota_clinica` (`id, petId FK, veterinarioId FK, diagnostico, prescricao, observacoes, createdAt`), imutável pelo tutor. Os campos `veterinarianName` continuam existindo como texto livre nos registros de vacina/vermífugo, sem migração. A timeline do perfil (PC-080) **mescla** as duas fontes para exibição.
- **(B) Migrar `veterinarianName` para FK `veterinario`.** Normaliza, mas exige backfill/heurística de match por nome (dados sujos) e mexe em registros de milestones anteriores — risco alto, valor baixo para o TCC.

**Recomendação:** **(A)**. YAGNI: a nota estruturada nasce limpa e ligada à entidade `veterinario`; o texto livre legado não precisa ser reescrito, só convive na visualização.

### P3. De onde vem "pets atendidos" do dashboard

**Problema.** O dashboard (PC-079) lista "pets atendidos recentemente" com busca por nome do pet/tutor e paginação. Falta definir a fonte do vínculo vet↔pet.

**Opções:**

- **(A) Derivado das notas clínicas.** "Pets atendidos" = `DISTINCT petId` em `nota_clinica WHERE veterinarioId = :atual`, ordenado pela nota mais recente. Sem tabela nova; o vínculo nasce naturalmente quando o vet escreve a primeira nota.
- **(B) Tabela de vínculo explícita** (`atendimento`/`vinculo_vet_pet`). Permite vincular antes de escrever nota, mas adiciona modelo e fluxo de criação sem demanda clara no escopo de M5.
- **(C) Escopo por clínica.** Vet vê todos os pets ligados à sua clínica. Depende de pet↔clínica, relação que **não existe** hoje — fora de escopo de M5.

**Recomendação:** **(A)** para o MVP. Resolve PC-079 com o que P2 já cria. Busca por nome do pet/tutor via `where` + `ILIKE`; paginação no padrão dos outros endpoints. (B) fica como evolução se surgir o caso "vet quer ver o pet antes de atender".

### P4. Sessão e estado no `petcard-web`

**Problema.** A área autenticada nasce agora. Decidir armazenamento do token, proteção de rotas e se entra lib de estado/query.

**Opções e direção recomendada:**

- **Armazenamento do token:** o caminho mais seguro é access token em memória + refresh token em cookie `httpOnly`, mas **depende de a API expor refresh** (a confirmar — M1 entregou JWT próprio, sem endpoint de refresh documentado). Para o MVP do TCC, se não houver refresh: **access token com TTL razoável em `localStorage`**, assumindo o tradeoff de XSS de forma consciente e documentada. Decisão final atrelada ao que a API oferece.
- **Proteção de rotas:** wrapper `<RequireAuth>` em volta das rotas privadas no `react-router-dom` v7 (`main.tsx`), redirecionando para `/login` quando não autenticado.
- **Estado:** **React Context** para a sessão (token + dados do vet). **Sem Redux, sem React Query** — login + dashboard + perfil + form não justificam (YAGNI). Reavaliar só se aparecer estado de servidor compartilhado e complexo.
- **HTTP:** estender `apiFetch` (`src/services/api.ts`) para anexar `Authorization: Bearer` e suportar `POST/PATCH` com body — hoje é GET-only. Manter o padrão `services/*.service.ts` (espelhar `card.service.ts`) para vet/nota/pet.
- **i18n:** toda string nova entra em `pt-BR` **e** `en-US`, sem texto hardcoded.

**Recomendação:** seguir a direção acima; a única trava real é **confirmar se a API tem refresh token** — isso decide entre `localStorage` simples e o esquema memória + cookie `httpOnly`.

## Alternativas Consideradas

Resumidas dentro de cada pendência (opções B/C rejeitadas ou adiadas em P1-P3). Pontos transversais:

- **Reusar `Tutor` + `Role.VET` para o vet (rejeitada).** Já descartada em F1: misturaria dois domínios distintos (tutor de pet × profissional com CRMV/clínica) numa tabela só, e o vínculo com clínica e o CRMV único ficariam mal modelados.
- **Auth0 só para a web do vet (rejeitada).** Já descartada em F2: reintroduziria uma dependência abandonada e um segundo modelo de identidade, contradizendo o JWT próprio do resto do sistema.
- **Adotar React Query/Redux no web "para já deixar pronto" (rejeitada).** Contraria YAGNI; o escopo de M5 não tem estado de servidor que justifique. Pode entrar depois por uso concreto.

## Consequências

### Positivas

- **Segundo principal com custo baixo** (P1-A): o auth do tutor entregue em M1 não é refatorado; o vet entra por um claim de tipo.
- **Escrita reversa estruturada** (P2-A): `nota_clinica` nasce limpa e ligada à entidade `veterinario`, sem arrastar dados legados.
- **Sem tabelas/abstrações especulativas** (P3-A, P4): vínculo vet↔pet derivado das notas; sessão web mínima. Coerente com o histórico de YAGNI do projeto.
- **Reuso da fila de push de M4** (PC-077): a notificação ao tutor publica em `notification.push` (DLX/DLQ + `x-retry-count`); o service da nota só publica, o worker envia — sem engenharia nova.

### Negativas / riscos

- **`Role.VET` legado em `Tutor` vira código morto** até ser removido (P1) — risco de confusão se não for depreciado explicitamente nesta milestone.
- **`localStorage` para o token** (P4, caso sem refresh) carrega risco de XSS — precisa ser registrado como limitação consciente do MVP e a sanitização/CSP do web revisada.
- **Timeline mesclando duas fontes** (P2): `nota_clinica` (estruturada) + `veterinarianName` (texto livre) exige cuidado de ordenação/exibição no PC-080 para não parecer inconsistente.

### Mitigações

- Marcar `Role.VET` como deprecado no schema/coment e abrir item para remoção em M6.
- Se ficar `localStorage`: documentar o tradeoff aqui, garantir TTL curto no JWT e revisar CSP/escape no `petcard-web`.
- PC-080: normalizar as duas fontes num mesmo formato de item de timeline na camada de serviço do web antes de renderizar.

## Próximos passos

1. Fechar P1-P4 em sessão; atualizar status para **Aceita**.
2. Refletir as decisões fechadas na seção correspondente do `petcard-api/CLAUDE.md`.
3. Confirmar com o backend (Álvaro) se a API expõe refresh token (trava de P4).
4. PC-084/PC-085: publicar `@petcardorg/shared@0.9.0` com os DTOs antes de api/web consumirem.
