# Auditoria 2026-10 — correções para robustez

Execução das 4 auditorias de leitura feitas em **24/10/2026** (`petcard-api`, `petcard-shared`, `petcard-web`, `petcard-mobile`). O objetivo é deixar o código o mais robusto e confiável possível antes da banca e da release v1.0.0.

**Vai retomar o trabalho? Leia [COMO-CONTINUAR.md](COMO-CONTINUAR.md) e depois a primeira entrada do [LOG.md](LOG.md).**

| Documento | Para quê |
|-----------|----------|
| [COMO-CONTINUAR.md](COMO-CONTINUAR.md) | Protocolo passo a passo: sincronizar, escolher o próximo item, branch, testes, PR, atualizar o status |
| [PLANO.md](PLANO.md) | Fases, pacotes, dependências e decisões pendentes |
| [LOG.md](LOG.md) | Diário das sessões: o que foi feito e qual é o próximo passo |
| [itens/api.md](itens/api.md) · [itens/shared.md](itens/shared.md) · [itens/web.md](itens/web.md) · [itens/mobile.md](itens/mobile.md) | Especificação de cada item: onde, problema, correção, critérios de aceite, resolução |
| [originais/](originais/) | Os 4 relatórios como foram entregues (não editar) |

**Status ao vivo:** issues com a label [`auditoria-2026-10`](https://github.com/PetCardOrg/petcard-docs/issues?q=label%3Aauditoria-2026-10) no `petcard-docs`, 1 por pacote.

---

## Painel

Atualizado em **2026-11-02**. Status: ⬜ pendente · 🟨 em andamento · 🟦 em PR · ✅ em develop · 🚀 em produção · ⏸️ bloqueado

| Fase | Pacote | Repo(s) | Itens | Status | Issue |
|------|--------|---------|-------|--------|-------|
| 1 | **P1** Demo segura | api, web, mobile | API-01 · WEB-01, 02, 03, 08 · MOB-02, 03 | ✅ em develop (falta `develop → main` de api e web antes do vídeo) | [#58](https://github.com/PetCardOrg/petcard-docs/issues/58) |
| 1 | **P2** Identidade e CRMV | api | API-05, 06, 07 | ✅ em develop (api#181; aceite web do API-06 pelo WEB-16, web#69) | [#59](https://github.com/PetCardOrg/petcard-docs/issues/59) |
| 1 | **P3** Lembretes confiáveis | api | API-03, 02 (+15) | ✅ em develop (api#182, api#183); variáveis cadastradas; falta `develop → main` da API e rodar o workflow uma vez | [#60](https://github.com/PetCardOrg/petcard-docs/issues/60) |
| 2 | **P4** Rede de segurança do shared | shared | SH-05, 01, 04 | ✅ em develop (shared#81, api#184) | [#61](https://github.com/PetCardOrg/petcard-docs/issues/61) |
| 2 | **P5** Contratos do shared (0.24.0) | shared | SH-02, 03, 08 | ✅ em develop (shared#82); release 0.24.0 sem PR: o shared#83 (`develop → main`) foi fechado sem merge em 2026-10-30, e a release precisa de um PR novo quando liberarem a `main` | [#62](https://github.com/PetCardOrg/petcard-docs/issues/62) |
| 3 | **P6** Reautenticação e contratos | api, web, mobile | API-20, 04, 23, 24 · WEB-14 · MOB-14 | ⬜ | [#63](https://github.com/PetCardOrg/petcard-docs/issues/63) |
| 3 | **P7** Robustez da API | api | API-08, 10 | ✅ em develop (api#185) | [#64](https://github.com/PetCardOrg/petcard-docs/issues/64) |
| 3 | **P8** Filas | api | API-11, 09 | ✅ em develop (api#186) | [#65](https://github.com/PetCardOrg/petcard-docs/issues/65) |
| 4 | **P9** Correções da web | web | WEB-04, 05, 06, 07, 13, 15, 16 | 🟨 em develop (web#69: WEB-04, 06, 07, 13, 15, 16 ✅; WEB-05 espera o API-24 do P6) | [#66](https://github.com/PetCardOrg/petcard-docs/issues/66) |
| 4 | **P10** Enxugar a web | web | WEB-09, 11, 12 | ✅ em develop (web#70: WEB-09, 11); WEB-12 🚫 pela D4 (código mantido) | [#67](https://github.com/PetCardOrg/petcard-docs/issues/67) |
| 5 | **P11** Correções do mobile | mobile | MOB-07, 01, 04, 05, 08, 09, 12, 13 (+15) | 🟨 em develop (mobile#98: MOB-07, 04, 05, 08, 09, 12, 13 ✅); MOB-01 espera o API-23 (P6) em produção; MOB-15 é configuração do EAS | [#68](https://github.com/PetCardOrg/petcard-docs/issues/68) |
| 5 | **P12** Enxugar o mobile | mobile | MOB-06, 10, 11 | ✅ em develop (mobile#99, #100, #101) | [#69](https://github.com/PetCardOrg/petcard-docs/issues/69) |
| 6 | **P13** Desejáveis | api, shared, web, mobile | API-12–19, 21, 22, 25, 26, 27 · SH-06 · WEB-17 · MOB-16, 17 | 🟨 MOB-16, MOB-17 (mobile#102), API-27 (api#187), API-18, API-19 (api#188), API-12, API-15 e API-16 (api#189), API-21 (D6), API-13 (api#190), API-14 (api#191), API-25 e API-26 (api#192) ✅ · API-22 ⏸️ (release do shared) | [#70](https://github.com/PetCardOrg/petcard-docs/issues/70) |
| 6 | **P14** Breaking v1.0.0 | shared (+consumidores) | SH-07, SH-08 (`auth0_id`) | ⬜ (só com PC-108) | [#71](https://github.com/PetCardOrg/petcard-docs/issues/71) |

**Totais:** 68 itens (API 27 · shared 8 · web 16 · mobile 17, contando os derivados; o WEB-10 foi distribuído entre os outros itens). **Concluídos (✅ em develop): 50** · descartados: 1 (WEB-12).

---

## Usando com o Claude Code

A skill está em [`.claude/skills/auditoria/SKILL.md`](../../../.claude/skills/auditoria/SKILL.md) deste repo. Como o Claude costuma ser aberto na pasta raiz `PetCard/` (que não é um repo), copie a skill para lá uma vez:

```bash
# na pasta PetCard/
mkdir -p .claude/skills && cp -r petcard-docs/.claude/skills/auditoria .claude/skills/
```

Depois é só digitar `/auditoria` (ou "continuar a auditoria"). Para um pacote específico: `/auditoria P2`. Para só ver o status: `/auditoria status`.

**Pré-requisito:** `gh` autenticado com acesso à org `PetCardOrg` (`gh auth status`).
