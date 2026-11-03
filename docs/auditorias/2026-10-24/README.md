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

Atualizado em **2026-11-03**. Status: ⬜ pendente · 🟨 em andamento · 🟦 em PR · ✅ em develop · 🚀 em produção · ⏸️ bloqueado

| Fase | Pacote | Repo(s) | Itens | Status | Issue |
|------|--------|---------|-------|--------|-------|
| 1 | **P1** Demo segura | api, web, mobile | API-01 · WEB-01, 02, 03, 08 · MOB-02, 03 | 🚀 em produção (release de 2026-11-03) | [#58](https://github.com/PetCardOrg/petcard-docs/issues/58) |
| 1 | **P2** Identidade e CRMV | api | API-05, 06, 07 | 🚀 em produção (api#181; aceite web do API-06 pelo WEB-16, web#69) | [#59](https://github.com/PetCardOrg/petcard-docs/issues/59) |
| 1 | **P3** Lembretes confiáveis | api | API-03, 02 (+15) | 🚀 em produção (api#182, api#183); workflow "Lembretes diários" rodado em produção em 2026-11-03 (verde) | [#60](https://github.com/PetCardOrg/petcard-docs/issues/60) |
| 2 | **P4** Rede de segurança do shared | shared | SH-05, 01, 04 | 🚀 em produção (shared#81, api#184) | [#61](https://github.com/PetCardOrg/petcard-docs/issues/61) |
| 2 | **P5** Contratos do shared (0.24.1) | shared | SH-02, 03, 08 | ✅ publicado: **0.24.1** no registry (shared#85, `develop → main`, 2026-11-03). Sai direto como 0.24.1 porque o SH-06 mudou `src/` antes; a 0.24.0 nunca foi publicada | [#62](https://github.com/PetCardOrg/petcard-docs/issues/62) |
| 3 | **P6** Reautenticação e contratos | api, web, mobile | API-20, 04, 23, 24 · WEB-14 · MOB-14 | 🚀 em produção (api#195, web#72, mobile#105 e APK testado em aparelho, 2026-11-03) | [#63](https://github.com/PetCardOrg/petcard-docs/issues/63) |
| 3 | **P7** Robustez da API | api | API-08, 10 | 🚀 em produção (api#185) | [#64](https://github.com/PetCardOrg/petcard-docs/issues/64) |
| 3 | **P8** Filas | api | API-11, 09 | 🚀 em produção (api#186) | [#65](https://github.com/PetCardOrg/petcard-docs/issues/65) |
| 4 | **P9** Correções da web | web | WEB-04, 05, 06, 07, 13, 15, 16 | ✅ completo (#66 fechada): WEB-04, 06, 07, 13, 15, 16 🚀 (web#69); WEB-05 ✅ em develop (web#73, testado à mão) | [#66](https://github.com/PetCardOrg/petcard-docs/issues/66) |
| 4 | **P10** Enxugar a web | web | WEB-09, 11, 12 | 🚀 em produção (web#70: WEB-09, 11); WEB-12 🚫 pela D4 (código mantido) | [#67](https://github.com/PetCardOrg/petcard-docs/issues/67) |
| 5 | **P11** Correções do mobile | mobile | MOB-07, 01, 04, 05, 08, 09, 12, 13 (+15) | 🟨 em produção (mobile#98: MOB-07, 04, 05, 08, 09, 12, 13 🚀); MOB-01 🟦 mobile#106; MOB-15 é configuração do EAS | [#68](https://github.com/PetCardOrg/petcard-docs/issues/68) |
| 5 | **P12** Enxugar o mobile | mobile | MOB-06, 10, 11 | 🚀 em produção (mobile#99, #100, #101) | [#69](https://github.com/PetCardOrg/petcard-docs/issues/69) |
| 6 | **P13** Desejáveis | api, shared, web, mobile | API-12–19, 21, 25, 26, 27 · SH-06 · MOB-16, 17 | ✅ completo (#70 fechada), tudo 🚀; API-22 e WEB-17 foram para o P15 | [#70](https://github.com/PetCardOrg/petcard-docs/issues/70) |
| 6 | **P15** Contratos do shared 0.25.0 | shared, api, web | SH-09 · API-28 · WEB-17 · API-22 | 🟨 contratos em shared#86 (0.25.0, SH-09 🟦); release espera liberação; depois API e web | [#109](https://github.com/PetCardOrg/petcard-docs/issues/109) |
| 6 | **P14** Breaking v1.0.0 | shared (+consumidores) | SH-07, SH-08 (`auth0_id`) | ⬜ (só com PC-108) | [#71](https://github.com/PetCardOrg/petcard-docs/issues/71) |

**Totais:** 69 itens (API 28 · shared 8 · web 16 · mobile 17, contando os derivados; o WEB-10 foi distribuído entre os outros itens). **Concluídos: 57** (56 🚀 em produção, 1 ✅ em develop) · descartados: 1 (WEB-12).

---

## Usando com o Claude Code

A skill está em [`.claude/skills/auditoria/SKILL.md`](../../../.claude/skills/auditoria/SKILL.md) deste repo. Como o Claude costuma ser aberto na pasta raiz `PetCard/` (que não é um repo), copie a skill para lá uma vez:

```bash
# na pasta PetCard/
mkdir -p .claude/skills && cp -r petcard-docs/.claude/skills/auditoria .claude/skills/
```

Depois é só digitar `/auditoria` (ou "continuar a auditoria"). Para um pacote específico: `/auditoria P2`. Para só ver o status: `/auditoria status`.

**Pré-requisito:** `gh` autenticado com acesso à org `PetCardOrg` (`gh auth status`).
