# Itens — `petcard-shared`

> Origem: [auditoria original](../originais/auditoria-petcard-shared.md) (feita na v0.22.0).
> **Revalidado em 2026-10-28 contra `main@b4bb3c2` (v0.23.0): todos os itens continuam presentes.**
> Qualquer mudança em `src/` exige **bump de versão** e só chega aos consumidores depois do publish (push na `main`). Ver o fluxo de release em [COMO-CONTINUAR.md](../COMO-CONTINUAR.md#release-do-shared).

Legenda: 🔴 corrigir já · 🟠 deveria corrigir · 🟡 desejável

---

## 🟠 Deve corrigir

### SH-01 · Lint do CI nunca reprova (`--fix`)
- **Status:** ⬜ pendente · **Fase:** 2 · **Pacote:** P4 · **PR:** —
- **Onde:** `package.json` (`"lint": "eslint \"src/**/*.ts\" --fix"`), `.github/workflows/ci.yml:22` (`npm run lint`).
- **Correção:** script `lint:check` sem `--fix`, usado no CI. `lint` com `--fix` fica para uso local.
- **Aceite:** [ ] CI usa `lint:check`; [ ] PR de teste com arquivo mal formatado reprova (descrever no PR, sem commitar o arquivo ruim).
- **Também vale para:** a API tem o mesmo padrão (`"lint": "eslint ... --fix"` em `petcard-api/package.json:15`). Conferir o `ci.yml` da API, da web e do mobile e corrigir no mesmo espírito (anotar no LOG o que for encontrado).
- **Resolução:** —

### SH-02 · Limite de 72 bytes da senha conta caracteres
- **Status:** ⬜ pendente · **Fase:** 2 · **Pacote:** P5 · **PR:** —
- **Onde:** `src/validators/strong-password.validator.ts` (~22-35, `MaxLength(PASSWORD_MAX_LENGTH)`).
- **Correção:** validador de bytes com `new TextEncoder().encode(v).length <= 72` (existe em Node, browser e React Native). Mensagem: explicar que acentos/emoji contam mais.
- **Aceite:** [ ] teste (SH-05) com 60 caracteres acentuados > 72 bytes reprovado; 72 ASCII aprovado.
- **Par na API:** API-20 (a API tem cópia própria do validador).
- **Resolução:** —

### SH-03 · Trocar e-mail não pede a senha atual
- **Status:** ⬜ pendente · **Fase:** 2 · **Pacote:** P5 · **PR:** —
- **Onde:** `src/dtos/tutor/update-tutor.dto.ts` (~18-23), `src/dtos/veterinario/update-veterinario.dto.ts` (~26-30; `senha_atual` já existe na linha ~45, mas só é exigida para senha).
- **Correção:** `@ValidateIf(o => o.email !== undefined || o.password !== undefined)` em `senha_atual` (vet); adicionar `senha_atual?` ao `UpdateTutorDto` com a mesma regra; criar `DeleteTutorDto { senha_atual?: string; google_id_token?: string }` para o `DELETE /tutors/me`.
- **Desbloqueia:** API-04, MOB-14, WEB-14.
- **Aceite:** [ ] DTOs atualizados e exportados no barrel; [ ] teste (SH-05) da regra condicional.
- **Resolução:** —

### SH-04 · Versão sem bump não publica e ninguém é avisado
- **Status:** ⬜ pendente · **Fase:** 2 · **Pacote:** P4 · **PR:** —
- **Onde:** `.github/workflows/publish.yaml` (~33-44).
- **Correção:**
  1. No `ci.yml`, em PR: se `git diff origin/<base>...HEAD -- src/` não está vazio e o `version` é igual ao da base → falha com mensagem clara.
  2. No `publish.yaml`: distinguir "versão existe" de "erro de rede" no `npm view` (checar se a saída é igual à versão; qualquer outro erro → falha).
- **Aceite:** [ ] PR que muda `src/` sem bump reprova; [ ] PR só de docs passa.
- **Resolução:** —

### SH-05 · Regras de validação sem nenhum teste
- **Status:** ⬜ pendente · **Fase:** 2 · **Pacote:** P4 · **PR:** —
- **Onde:** `src/validators/*` (`IsStrongPassword`, `normalizeEmail`, `IsNotFutureDate`, `IsAfterDate`, `IsOnOrAfterDate`, `HasDosageQuantity`).
- **Correção:** `node:test` (embutido no Node 20+, sem dependência nova) com ~10+ casos, script `test`, rodando no CI. Atualizar o `CLAUDE.md` do shared ("Sem testes por design" deixa de valer).
- **Casos mínimos:** senha sem número reprova; `normalizeEmail("  A@B.COM ")` → `a@b.com`; `next_dose_at == applied_at` reprova; `end_date == start_date` aprova; data futura reprova; senha > 72 bytes reprova; `senha_atual` exigida quando vem `email`.
- **Fazer primeiro no P4**, para servir de rede de segurança para SH-02, SH-03 e SH-06.
- **Resolução:** —

---

## 🟡 Bom ter

### SH-06 · `IsAfterDate` e `IsOnOrAfterDate` são quase cópias
- **Status:** ⬜ pendente · **Fase:** 6 · **Pacote:** P13 · **PR:** —
- **Onde:** `src/validators/clinical-date.validators.ts` (~62-120).
- **Correção:** helper interno `compareToRelated(property, name, ok, message)`; contrato público intacto. Exige SH-05 pronto.
- **Resolução:** —

### SH-07 · Tipos de resposta dizem `Date`, o JSON entrega `string`
- **Status:** ⬜ pendente · **Fase:** 6 (**só junto da v1.0.0 / PC-108**) · **Pacote:** P14 · **PR:** —
- **Onde:** 23 campos, ex.: `tutor-response.dto.ts:11`, `acao-clinica-response.dto.ts:17`.
- **Correção:** trocar para `string` (breaking). Antes, `grep` nos 3 consumidores por `.getTime()`/métodos de `Date` nesses campos.
- **Resolução:** —

### SH-08 · `photo_url` sem `MaxLength` e `auth0_id` sobrando
- **Status:** ⬜ pendente · **Fase:** 2 (`MaxLength`) / 6 (`auth0_id`, breaking) · **Pacote:** P5 / P14 · **PR:** —
- **Onde:** `create-pet.dto.ts:44`, `update-pet.dto.ts:47` (`photo_url` sem `@MaxLength`); `tutor-response.dto.ts:5` (`auth0_id!: string`).
- **Correção:** `@MaxLength(2048)` nos dois `photo_url` (não-breaking, P5). Remover `auth0_id` junto com SH-07 (breaking, P14), depois de confirmar com `grep` que nenhum consumidor usa.
- **Resolução:** —

---

## Não verificado pela auditoria
- DTOs de histórico clínico, nota clínica e carteira digital (só amostrados).
- Se `npm run build` e o lint passam hoje → **rodar no início do P4 e anotar no LOG.**
