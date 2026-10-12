# ADR-013: Comprovantes anexados a registros de saúde

**Data:** 2026-09-29
**Status:** Proposta
**Autores:** Camila Martins

## Contexto

Vacina, vermífugo e medicação são hoje **texto digitado**: o tutor (ou o veterinário) escreve o nome, a data e a dose, e a carteira digital exibe o que foi escrito. Nada distingue "foi aplicada" de "alguém digitou que foi aplicada". Para o uso que a carteira tem de fato — apresentar a um hotel, a uma clínica, a uma companhia aérea, a um órgão de saúde — o que vale é o documento: a foto da carteirinha carimbada, a receita, o PDF do laudo.

A api#117 já resolveu o problema de **autoria** (quem registrou, com CRMV, e quem apagou). Este ADR trata do problema vizinho, o de **comprovação**: anexar ao registro o documento que o sustenta, e deixar claro se um profissional o conferiu.

Restrições que já existiam e que a solução precisa respeitar:

- **Dado de saúde não é público.** O único armazenamento existente (`UploadService.uploadFile`) devolve URL pública e serve fotos de pet e de perfil. Comprovante não pode seguir esse modelo: quem conhecesse o endereço leria a carteirinha.
- **Nada clínico se apaga.** Vacina, vermífugo, medicação e nota usam exclusão lógica (`deletedAt`) e a `AcaoClinica` mantém a trilha (api#117, ADR-009). O anexo herda a regra.
- **A carteira pública (`GET /cards/:token`, via QR, sem login) reaproveita os DTOs dos registros.** Adicionar um campo ao DTO de vacina não pode vazá-lo ali.
- **O veterinário só age sobre pet com o qual tem vínculo `PetAtendido`**, e o CRMV precisa estar verificado (api#113).

## Decisão

### 1. Modelo: uma tabela, exatamente uma FK preenchida

Nova tabela `anexo_clinico`, com três FKs opcionais (`vaccine_record_id`, `deworming_record_id`, `medication_record_id`) e um `CHECK` que exige **exatamente uma** preenchida. Cada anexo aponta para um registro de verdade, com integridade referencial e `ON DELETE CASCADE` — o que uma coluna polimórfica `entidade + entidade_id`, como a da `AcaoClinica`, não daria. A `AcaoClinica` pode ser polimórfica porque é log append-only; o anexo é dado vivo.

Cada anexo guarda `s3_key`, nome original (só para exibição), `mime_type`, `tamanho_bytes` e o **SHA-256 do conteúdo**, gravado no envio — para poder demonstrar depois que o arquivo guardado é o que foi enviado.

### 2. Armazenamento privado, leitura por link temporário

O objeto vai para `anexos/{petId}/{uuid}.{ext}` no bucket existente. **O nome enviado pelo cliente nunca compõe a chave.** O banco guarda só a chave; não existe URL pública. Para abrir o arquivo, o cliente pede `GET /anexos/:id/arquivo`, a API confere o acesso ao pet e devolve um **link pré-assinado de 5 minutos**, com `Content-Type` e nome de download forçados na própria assinatura.

### 3. Upload pela API (multipart), não por URL pré-assinada de escrita

A alternativa clássica é a API devolver uma URL de PUT e o app enviar direto ao S3. Descartada aqui porque, num envio direto, **a API nunca vê o arquivo** e não consegue conferir o conteúdo. A validação já existente (`UploadService`) confere os **bytes iniciais** contra o tipo declarado — `Content-Type` é dado escrito pelo cliente, não fato. O comprovante segue o mesmo caminho: JPEG, PNG, WebP e PDF, assinatura conferida, teto de 10 MB imposto no multer (antes de o arquivo ir inteiro para a memória) e no máximo 10 comprovantes por registro. O custo é o arquivo passar pela API; para o teto de 10 MB é aceitável.

### 4. Verificação é um atestado de veterinário, gravado com nome e CRMV

- Anexo enviado por **veterinário** (já autenticado, com CRMV verificado e vínculo com o pet) nasce **verificado**: enviar é conferir.
- Anexo enviado pelo **tutor** nasce **não verificado**. Um veterinário com vínculo com o pet o verifica em `POST /anexos/:id/verificacao`.
- `verificado_por_nome` e `verificado_por_crmv` ficam **gravados na linha**, não só por FK — a evidência sobrevive à exclusão da conta, mesmo mecanismo do ADR-009. Um `CHECK` no banco garante que data, nome e CRMV são todos nulos ou todos preenchidos.
- A verificação é **idempotente e não se sobrescreve**: quem chega depois recebe o atestado de quem verificou primeiro (o `UPDATE` filtra `verificado_em IS NULL`, o que também fecha a corrida entre dois veterinários).
- Não existe "desverificar". Remover o anexo é o caminho, e a remoção fica na trilha.

Verificado **não** significa "o documento é autêntico" — significa "um profissional identificado, com CRMV, disse que conferiu". O app rotula exatamente assim: "Verificado por *nome* (*CRMV*)".

### 5. Exclusão lógica, com a mesma assimetria dos registros

`DELETE /anexos/:id` marca `deleted_at`; a linha e o **objeto no bucket permanecem**. O tutor remove qualquer comprovante do próprio pet — inclusive um já verificado; o veterinário remove só o que ele enviou. É a regra de `assertPodeRemover`, reaproveitada. O anexo removido some da carteira e do link de leitura, mas o **histórico clínico** continua mostrando o que foi anexado a cada registro, também nos registros excluídos.

### 6. Trilha de auditoria sobre o registro comprovado

Três valores novos em `AcaoClinicaTipo`: `ANEXO_ADICIONADO`, `ANEXO_REMOVIDO`, `ANEXO_VERIFICADO`. A ação é gravada com `entidade`/`entidadeId` do **registro** (vacina, vermífugo ou medicação) e o `anexo_id` em `detalhes`, na mesma transação da escrita. Assim as ações de comprovante aparecem na linha do tempo do próprio registro, sem entidade nova no histórico.

### 7. Carteira pública não expõe comprovante

`anexos` é **opcional** nos DTOs de vacina, vermífugo e medicação (`@petcardorg/shared` 0.23.0) e **ausente** na carteira pública. O contrato deixa claro que só a resposta autenticada o traz.

## Alternativas descartadas

1. **Uma coluna `comprovanteUrl` em cada registro.** Uma foto só, três colunas repetidas, sem metadados, sem verificação e com URL pública.
2. **URL pré-assinada de escrita (upload direto ao S3).** Explicado em (3): a API deixaria de poder validar o conteúdo.
3. **URL pública com nome aleatório ("segredo por obscuridade").** Vaza por histórico de navegador, log de proxy ou compartilhamento do link, e não morre nunca. O link de 5 minutos morre sozinho.
4. **Verificar só pelo fato de o veterinário ser o autor do registro.** Exclui o caso mais comum: o tutor anexa a carteirinha de uma vacina que **outra clínica** aplicou, e o veterinário de hoje a confere na consulta.
5. **Apagar o objeto do S3 ao remover o anexo.** Contradiz a regra de que nada clínico se perde, e desfaz a evidência que a trilha diz existir.

## Consequências

**A favor**

- A carteira passa a poder mostrar o documento, e o selo separa "o tutor disse" de "um veterinário conferiu".
- Nenhum comprovante é público; a leitura passa sempre pela checagem de acesso ao pet.
- A validação de conteúdo e a regra de exclusão são as mesmas que o projeto já usa — nenhum mecanismo novo para aprender.

**Custos e riscos assumidos**

- **Objetos órfãos.** Excluir a conta do tutor apaga o pet e, por cascata, as linhas de `anexo_clinico`; os **objetos continuam no bucket**, sem linha que os referencie. É o mesmo comportamento das fotos de pet hoje. Resolver exige uma rotina de limpeza (ciclo de vida do bucket por prefixo, ou um job que compara chaves), fora do escopo desta decisão. Registrado para a LGPD: ao implementar a limpeza, o prazo de retenção precisa ser decidido junto.
- **Se o `INSERT` falha depois do upload**, a API tenta remover o objeto; se a remoção também falhar, sobra um objeto sem dono e um log de erro.
- **Só imagem no app do tutor.** O mobile seleciona pela galeria (`expo-image-picker`, já no projeto); PDF é aceito pela API e enviável pela web. Suportar PDF e câmera no mobile pede `expo-document-picker` e a permissão de câmera no `app.config.ts` — mudança nativa, deixada para uma próxima versão do app.
- **HEIC não é aceito.** A galeria do iOS converte para JPEG por padrão no `expo-image-picker`; um HEIC que chegue mesmo assim é recusado com mensagem clara.

## Requisito de infraestrutura

O prefixo `anexos/` do bucket **não pode** ter leitura pública. A política do bucket deve liberar leitura pública, se for o caso, apenas para os prefixos de foto (`pets/`, `tutors/`, `vets/`). A credencial da API precisa de `s3:GetObject` (para assinar a leitura) e `s3:PutObject` no prefixo `anexos/`. Sem `s3:DeleteObject` em `anexos/`, a limpeza pós-falha descrita acima não funciona — aceitável, e coerente com "nada clínico se apaga".

## Referências

- api#117 (trilha clínica) · ADR-009 (autoria sobrevive à exclusão da conta) · api#113 (CRMV verificado) · ADR-006 (cobertura de confiança)
- `petcard-api/src/modules/anexo/` · `prisma/migrations/20260929230000_anexo_clinico_comprovantes/`
