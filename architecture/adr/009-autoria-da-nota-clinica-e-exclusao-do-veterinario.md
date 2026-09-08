# ADR-009: Autoria da nota clínica e exclusão da conta do veterinário

**Data:** 2026-09-08
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

`DELETE /veterinarios/me` (`veterinario.service.ts`, `remove`) apaga a linha do veterinário. O que acontece com o dado clínico que ele produziu é decidido pelo `onDelete` de cada FK em `prisma/schema.prisma`, e hoje as quatro entidades clínicas não concordam entre si:

| Entidade | FK para `Veterinario` | `onDelete` |
| --- | --- | --- |
| `VaccineRecord` | `veterinarioId String?` | `SetNull` |
| `DewormingRecord` | `veterinarioId String?` | `SetNull` |
| `MedicationRecord` | `veterinarioId String?` | `SetNull` |
| **`NotaClinica`** | **`veterinarioId String`** | **`Cascade`** |

A nota clínica é o único registro que **cascateia**. Quando um veterinário exclui a própria conta, todo diagnóstico, prescrição e observação que ele escreveu é apagado do banco — inclusive das carteiras de pets de **outros tutores**, que não participaram da decisão e não são notificados. É perda de dado de saúde, não de dado do veterinário: o tutor perde o histórico do próprio animal porque o profissional encerrou a conta dele.

O efeito colateral agrava: a trilha de auditoria `AcaoClinica` **sobrevive**, porque a api#117 a projetou deliberadamente sem FK para autor nem para entidade (`autorId`, `entidadeId` são colunas soltas, e `autorNome`/`autorCrmv` ficam gravados em texto). Depois da cascata, a trilha continua afirmando "nota criada em tal data, editada em tal outra" apontando para uma `NotaClinica` que não existe mais. A evidência que a api#117 existe para produzir vira referência quebrada — exatamente o que aquela issue queria evitar.

Vale separar de uma decisão já tomada e registrada: a exclusão da conta do **tutor** arrasta os pets dele e, com eles, a `AcaoClinica` correspondente. Isso é intencional (confirmado em 2026-08-24) e é coerente — o dado é do tutor, e o pet deixa de existir no sistema junto com ele. O caso deste ADR é outro: o veterinário **não é dono** do prontuário, é autor de um registro dentro do prontuário de terceiros.

## Decisão

**A nota clínica sobrevive à exclusão da conta de quem a escreveu.** A FK passa a `SetNull` (`veterinarioId String?`), e a atribuição de autoria deixa de depender da linha do veterinário: a nota passa a carregar **`veterinarioNome` e `veterinarioCrmv` gravados em texto no momento em que foi escrita**.

É o mesmo mecanismo que a `AcaoClinica` já usa (`autorNome`, `autorCrmv`) e a mesma ideia do `veterinarianName` em texto livre que `VaccineRecord`/`DewormingRecord`/`MedicationRecord` usam para o profissional de fora do PetCard — aqui aplicado ao profissional de dentro, para o momento em que ele deixa de estar dentro.

### O que muda

- **Schema:** `NotaClinica.veterinarioId` vira `String?` com `onDelete: SetNull`; entram `veterinarioNome String` e `veterinarioCrmv String`, preenchidos na criação da nota. Migration com backfill a partir do `JOIN` com `veterinario` antes de aplicar o `NOT NULL`, para as notas que já existem.
- **Leitura:** nome e CRMV exibidos na carteira clínica, na listagem de notas e no histórico passam a vir das colunas gravadas, não do `JOIN`. Os três `include: { veterinario: ... }` do caminho de nota deixam de existir.
- **Autorização de escrita:** permanece pela FK. `update`/`remove` já exigem `nota.veterinarioId === veterinarioId`; com a FK nula, a comparação falha para todo mundo e a nota órfã fica **imutável** — ninguém herda o direito de editar o que outro profissional assinou.
- **Contrato:** `NotaClinicaResponseDto.veterinario_id` passa a ser opcional (`@petcardorg/shared` 0.22.0), alinhando-se aos três DTOs de registro clínico que já o declaram opcional. `veterinario_nome` e `veterinario_crmv` continuam **obrigatórios** — é o ponto da decisão: a exibição não degrada.

### O que a nota órfã mostra

| Superfície | Antes (cascata) | Depois |
| --- | --- | --- |
| Carteira clínica (`GET /cards/:token/clinica`) | nota some | nota aparece, assinada com o nome e o CRMV de quem escreveu |
| Listagem de notas do pet | nota some | idem, sem botão de editar/excluir (a FK nula reprova a comparação de autoria) |
| Histórico clínico (api#117) | item some, ações órfãs | item presente; `veterinario_id` ausente sinaliza que a conta não existe mais |
| Trilha `AcaoClinica` | aponta para registro inexistente | continua apontando para a nota, que continua lá |

### Alternativas descartadas

1. **Repetir o `SetNull` puro dos outros três registros, sem gravar nome e CRMV.** Resolveria a perda do texto clínico, mas a nota apareceria sem autor nenhum — e nota clínica sem quem assinou tem valor probatório baixo. Os outros três registros toleram isso porque a `AcaoClinica` guarda o autor da ação; a nota merece o mesmo tratamento no próprio registro, já que é ela que carrega diagnóstico e prescrição.
2. **Remover a FK e deixar `veterinarioId String` solto, como `AcaoClinica.autorId`.** Evitaria mexer no `@petcardorg/shared` e manteria o `veterinario_id` sempre presente. Descartada: transforma um ponteiro vivo em ponteiro pendurado por projeto, abre mão da integridade referencial enquanto o veterinário existe, e apaga a distinção — útil — entre "conta ativa" e "conta encerrada". Na `AcaoClinica` a ausência de FK se justifica porque ela é log append-only; a `NotaClinica` é registro vivo, editável pelo autor.
3. **Soft delete do `Veterinario`** (marcar `deletedAt` em vez de apagar a linha). Preservaria toda a atribuição por construção, mas obrigaria a filtrar o excluído em cada consulta, a lidar com a unicidade de `email` e `crmv` de uma conta encerrada, e contradiria o precedente da exclusão de conta do tutor, que é definitiva. Raio de mudança grande demais para o problema.
4. **`Restrict`: impedir a exclusão da conta enquanto houver nota escrita.** Na prática nega a exclusão de conta a qualquer veterinário que tenha trabalhado — o oposto do que a funcionalidade de exclusão de conta se propõe.

## Consequências

**A favor:**

- Fecha a perda de dado de saúde de terceiros: nenhum tutor perde o histórico do pet por uma decisão tomada na conta de outra pessoa.
- Devolve integridade à trilha da api#117 — a evidência aponta para um registro que existe.
- Uniformiza o comportamento das quatro entidades clínicas diante da exclusão do veterinário: nenhuma cascateia.
- A nota órfã fica imutável, o que é a semântica correta: assinatura sem dono não deve ser reescrita.

**Contra e limitações — declaradas:**

- **Nome e CRMV congelam no instante da escrita.** Veterinário que corrige o nome ou muda de registro não vê a correção propagar para notas antigas. É aceito e é a intenção: um registro clínico deve dizer sob qual credencial foi assinado, e a ADR-005 já trata troca de CRMV como evento que derruba a verificação anterior.
- **Duas colunas denormalizadas**, com o custo usual de denormalização. O ganho de leitura (três `JOIN` a menos no caminho mais quente da carteira) compensa em parte.
- **Exige bump do `@petcardorg/shared` (0.22.0) e ordem de merge cross-repo:** shared publicado antes do PR da api, senão o `npm ci` da api quebra com `ETARGET`. O tipo local de nota em `petcard-web` (`src/services/pet-profile.service.ts`) declara `veterinario_id: string` obrigatório e deve acompanhar; sem isso a web só fica com um tipo otimista — a checagem `n.veterinario_id === user.id` já esconde os botões de edição corretamente quando o campo vem ausente.
- **A exclusão da conta do veterinário deixa de ser um apagamento completo do rastro dele.** Nome e CRMV permanecem gravados nas notas que assinou. É deliberado — prontuário é registro de terceiro, não dado pessoal disponível para remoção unilateral — mas é uma escolha que precisa estar dita, e é o que este ADR diz.
- Não altera `VaccineRecord`/`DewormingRecord`/`MedicationRecord`, que continuam ficando **sem autor nenhum** quando o veterinário some (`veterinarioId` nulo e `veterinarianName` nulo, já que este só é preenchido para profissional de fora). A `AcaoClinica` ainda registra quem lançou. Estender o mesmo par de colunas gravadas a esses três registros é melhoria conhecida e não faz parte desta decisão.

## Referências

- `petcard-api/prisma/schema.prisma` (`model NotaClinica`, `model AcaoClinica`, `model Veterinario`)
- `petcard-api/src/modules/veterinario/veterinario.service.ts` (`remove`)
- `petcard-api/src/modules/vet-note/vet-note.service.ts` (autoria em `update`/`remove`)
- `petcard-api/src/modules/card/card.service.ts` (`findClinicaByToken`)
- `petcard-api/src/modules/historico/historico-clinico.service.ts` (api#117)
- ADR-005 (verificação de CRMV e acesso clínico) — troca de CRMV derruba a verificação
- ADR-007 (remoção do `role` vestigial) — precedente de correção de modelo de dados na M7
