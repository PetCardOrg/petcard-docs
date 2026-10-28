# Auditoria do `petcard-shared`

Pacote `@petcardorg/shared` v0.22.0 · Auditoria feita em 24/10/2026 · Somente leitura: nada foi alterado nem executado.

## O que este repositório faz

É um pacote de tipos. Reúne os DTOs (formatos de entrada e saída da API), os enums e as regras de validação que a API, a web e o mobile usam em comum. São cerca de 900 linhas de DTOs, 3 arquivos de validadores, um script de build e 2 workflows de GitHub Actions.

**Carga assumida:** poucos usuários, equipe de 3 pessoas, releases raros. Aqui o risco não é desempenho. O risco é uma regra ou um tipo errado que se espalha para os 3 consumidores de uma vez.

## Resumo

| # | Grupo | Achado |
| --- | --- | --- |
| 1 | Deve corrigir | O lint do CI nunca reprova (`--fix`) |
| 2 | Deve corrigir | Limite de 72 bytes da senha conta caracteres, não bytes |
| 3 | Deve corrigir | Trocar o e-mail não pede a senha atual |
| 4 | Deve corrigir | Versão sem bump não publica e ninguém é avisado |
| 5 | Deve corrigir | Regras de validação sem nenhum teste no repo |
| 6 | Bom ter | `IsAfterDate` e `IsOnOrAfterDate` são cópias quase idênticas |
| 7 | Bom ter | Tipos de resposta dizem `Date`, mas o JSON entrega texto |
| 8 | Bom ter | `photo_url` sem limite de tamanho e `auth0_id` sobrando |

**Veredito:** o repositório é pequeno e está saudável. Corrigir primeiro o 1 (lint do CI), depois o 2 (senha em bytes) e o 4 (checagem de versão).

**Lean:** −30 linhas, −0 dependências possíveis.

---

## Deve corrigir

### 1. O lint do CI nunca reprova
`package.json` (script `lint`) e `.github/workflows/ci.yml`

- **O que é:** o CI roda `npm run lint` a cada push e PR para barrar código fora do padrão.
- **Problema:** o script `lint` é `eslint ... --fix`. Ele conserta o arquivo dentro da máquina do CI e termina com sucesso. Como o Prettier roda dentro do ESLint, um arquivo mal formatado passa no CI e o erro nunca chega ao repositório. Não há checagem de formatação separada.
- **Fix:** adicionar `"lint:check": "eslint \"src/**/*.ts\""` e usar esse script no `ci.yml`. O `lint` com `--fix` fica só para uso local.
- **Se pular:** o CI dá falsa segurança, e código fora do padrão chega à `develop` e à `main`.

### 2. O limite de 72 bytes da senha conta caracteres, não bytes
`src/validators/strong-password.validator.ts`, linhas 22–35

- **O que é:** o bcrypt ignora em silêncio tudo que passa de 72 **bytes** da senha. O `MaxLength(72)` existe para evitar isso.
- **Problema:** `MaxLength` do class-validator conta caracteres. Um `ç`, um `ã` ou um emoji ocupa de 2 a 4 bytes. Uma senha de 60 caracteres com acentos ou emoji pode passar de 72 bytes. A validação aceita, e o bcrypt usa só os 72 primeiros bytes. A senha fica mais fraca do que o usuário imagina, e o fim dela não conta no login.
- **Fix:** trocar o `MaxLength` por uma checagem de bytes: `new TextEncoder().encode(v).length <= 72`. `TextEncoder` existe no Node, no navegador e no React Native, e dispensa `Buffer`.
- **Se pular:** é um caso raro hoje, mas o dado é clínico e a regra só parece proteger.

### 3. Trocar o e-mail não pede a senha atual
`src/dtos/veterinario/update-veterinario.dto.ts`, linhas 26–30, e `src/dtos/tutor/update-tutor.dto.ts`, linhas 18–23

- **O que é:** trocar a senha do vet já exige `senha_atual`, por causa do risco de token roubado (o token vale 7 dias e fica em `localStorage`).
- **Problema:** o e-mail é a identidade da conta e pode ser trocado só com o token. Cenário: o token vaza, o atacante troca o e-mail para o dele e usa a recuperação de senha. É o mesmo ataque que a `senha_atual` evita. Isso depende de a API mandar o link de recuperação para o e-mail novo, o que não foi verificado.
- **Fix:** aplicar o mesmo `@ValidateIf` com `senha_atual` quando `email` vier no corpo, ou exigir confirmação do e-mail novo.
- **Se pular:** a proteção da senha pode ser contornada pelo e-mail.

### 4. Versão sem bump não publica e ninguém é avisado
`.github/workflows/publish.yaml`, linhas 33–44

- **O que é:** a publicação roda no push para `main` e pula se a versão já existe no registry.
- **Problema:** se um PR muda um DTO e esquece de subir o `version`, ele entra na `main`, o publish pula sem erro e os consumidores não recebem a mudança. O `CLAUDE.md` cita a regra, mas nenhum passo a verifica. Além disso, um erro de rede no `npm view` também cai em `exists=false`, e o publish falha de forma confusa.
- **Fix:** no `ci.yml`, em PR, comparar o `version` com o da `develop` e falhar se `src/` mudou e a versão não. Dá uns 5 linhas de shell.
- **Se pular:** um fix pode ficar sem publicar sem que ninguém perceba. Vale checar isso antes da release v1.0.0 (PC-108).

### 5. Regras de validação sem nenhum teste no repo
`src/validators/*`

- **O que é:** aqui moram `IsStrongPassword`, `normalizeEmail` e as regras de data (`IsNotFutureDate`, `IsAfterDate`, `IsOnOrAfterDate`, `HasDosageQuantity`). Elas decidem o que entra no banco de dados clínicos.
- **Problema:** o repo não tem teste nem runner, "por design". Mas essas regras são lógica pura e arriscada: segurança de senha, datas de vacina e identidade por e-mail. Se alguém mexer no regex ou na comparação, nada falha aqui. Não foi verificado se a API testa essas regras nos consumidores.
- **Fix:** um único arquivo de teste com `node:test` (embutido no Node 20, sem dependência nova), com uns 10 casos, rodando no CI. Exemplos: senha sem número reprovada; `normalizeEmail("  A@B.COM ")`; `next_dose_at` igual a `applied_at` reprovada; `end_date` igual a `start_date` aprovada.
- **Se pular:** um erro de regra só aparece em produção, nos 3 apps ao mesmo tempo.

---

## Bom ter

### 6. `IsAfterDate` e `IsOnOrAfterDate` são cópias quase idênticas
`src/validators/clinical-date.validators.ts`, linhas 62–120

- **O que é:** duas funções de cerca de 30 linhas cada, que só diferem em `>` contra `>=` e na mensagem.
- **Fix:** uma função interna `compareToRelated(property, name, ok, message)`, e os dois decoradores viram uma linha cada. Corta uns 30 linhas e não muda o contrato público. O `registerDecorator` repetido 4 vezes também pode usar o mesmo helper.
- **Se pular:** nada quebra, só é preciso lembrar de mudar as duas juntas.

### 7. Tipos de resposta dizem `Date`, mas o JSON entrega texto
23 campos, por exemplo `tutor-response.dto.ts`, linha 11, e `acao-clinica-response.dto.ts`, linha 17

- **O que é:** os DTOs de resposta tipam o que a web e o mobile recebem por HTTP.
- **Problema:** pela rede, `Date` vira string ISO. Na web ou no mobile, `created_at.getTime()` passa no TypeScript e quebra na execução. Nenhum consumidor errou isso até onde foi visto, mas o tipo está mentindo.
- **Fix:** num bump minor, trocar para `string`. Mudar o tipo é breaking para os consumidores, então só vale fazer junto com a v1.0.0.
- **Se pular:** fica uma armadilha para o próximo dev.

### 8. `photo_url` sem limite de tamanho e `auth0_id` sobrando
`create-pet.dto.ts`, `update-pet.dto.ts` (linha 46) e `tutor-response.dto.ts` (linha 4)

- **Problema:** `photo_url` do pet usa `@IsUrl()` sem `@MaxLength`, ao contrário dos DTOs de tutor e vet, que limitam a 2048. Uma URL enorme passa no DTO e só é barrada pelo limite de corpo da API. O `auth0_id` vem de um login abandonado (M0-#7) e não foi encontrado uso dele em `petcard-api`, `petcard-web` e `petcard-mobile`, se esses repos estiverem nos caminhos esperados.
- **Fix:** adicionar `@MaxLength(2048)` nos dois `photo_url`. Remover `auth0_id` do tipo de resposta numa mudança breaking, junto da v1.0.0.

Nenhum achado menor foi deixado de fora.

---

## O que não foi verificado

- Os DTOs de histórico clínico, notas clínicas e carteira digital: só foram amostrados.
- O uso real dos DTOs na API, na web e no mobile.
- Se `npm run build` e o lint passam hoje. Nada foi executado.
