# ADR-012: Domínio de produção em subdomínios gratuitos e web na Vercel

**Data:** 2026-09-23
**Status:** Aceita
**Autores:** Ricardo Temporal

## Contexto

A **PC-105** (docs#20) pede, entre outros critérios, DNS configurado e HTTPS ativo para o deploy
final, além do deploy do `petcard-web` num provedor. O ADR-010 já havia fixado o orçamento do
projeto em US$0 garantido para a API/banco/fila; essa mesma restrição se aplica ao domínio e ao
front-end — o projeto é uma conta pessoal de estudante, sem orçamento para domínio pago nem para
upgrade de plano.

A API de produção já roda no Render, em subdomínio gratuito (`petcard-api.onrender.com`, ver
ADR-010/011). Faltava decidir (a) se o projeto compraria um domínio próprio para unificar API e
web sob um nome só, e (b) em que provedor o `petcard-web` (SPA Vite) seria hospedado.

## Decisão

### Sem domínio próprio — subdomínios gratuitos do Render e da Vercel

Produção usa `https://petcard-api.onrender.com` (já existente) e `https://petcard-web.vercel.app`
(novo, criado nesta issue). Nenhum dos dois exige configuração de DNS além da já provida pelo
provedor — o próprio provedor emite certificado TLS automaticamente para seu subdomínio, então
"DNS configurado" e "HTTPS ativo" (critérios da PC-105) ficam satisfeitos pela infraestrutura do
Render/Vercel, sem exigir um registrador de domínio ou um painel de DNS separado.

Consequência direta: as 5 env vars de produção da API que dependiam de domínio (ver ADR-011) usam
esses dois subdomínios — `CORS_ORIGINS`, `PUBLIC_CARD_BASE_URL` e `PUBLIC_COLLAR_BASE_URL` apontam
para `petcard-web.vercel.app`; `APP_DEEP_LINK_BASE` e `GOOGLE_CALENDAR_REDIRECT_URI` apontam para
`petcard-api.onrender.com`.

### Web na Vercel, não no Render

O `petcard-web` é uma SPA estática (Vite + React, build `tsc -b && vite build`, sem servidor
próprio). Duas opções gratuitas existiam: um segundo Web Service no Render (mesmo padrão já usado
pela API) ou a Vercel.

Escolhida a Vercel:

- O plano free do Render "dorme" o serviço após ~15 min de inatividade (cold start de até ~50s,
  documentado como consequência assumida no ADR-010 para a API). Hospedar a SPA também no Render
  duplicaria esse artefato exatamente na porta de entrada da demo — o usuário abriria o link do
  vídeo/apresentação e esperaria quase um minuto só para carregar a tela de login.
- A Vercel serve estático por CDN global, sem processo de servidor "dormindo": não há cold start
  para o `index.html`/assets, só para a primeira chamada à API (que já é esperada e mitigada com um
  request de aquecimento antes de gravar evidências, ver ADR-010).
- Detecção automática de projeto Vite, sem config adicional (`vercel.json` não foi necessário).
- Já é o critério de aceite literal da PC-105 ("Web deploy na Vercel") — não é uma escolha nova
  desta ADR, só o motivo prático por trás da escolha já feita no escopo da issue.

Variável de build na Vercel: `VITE_API_URL=https://petcard-api.onrender.com` — em produção não
existe o proxy do Vite (`vite.config.ts`) que resolve `/api` em desenvolvimento, então a SPA precisa
da URL absoluta da API.

## Consequências

**A favor**

- Custo zero garantido, consistente com a restrição de fundo do ADR-010 — nenhum registrador de
  domínio, nenhum cartão de crédito.
- HTTPS e "DNS" (no sentido de nome resolvível publicamente) vêm de graça dos dois provedores, sem
  trabalho extra de configuração.
- Elimina o cold start da SPA na demo, que seria o pior lugar possível para esse artefato aparecer.

**Contra, e assumido**

- URLs de produção não são memoráveis nem "profissionais" (`petcard-web.vercel.app` em vez de um
  domínio próprio) — aceitável para uma entrega de TCC, não seria para um produto real.
- Trocar de subdomínio no futuro (se um domínio próprio for comprado depois da entrega) exige
  atualizar as 5 env vars da API de novo e a config de CORS — não é automático.
- Continua existindo cold start na **API** (Render), só não na web — o request de aquecimento
  antes de gravar evidências (PC-106) continua necessário.

## Alternativas consideradas

**Domínio próprio (ex.: `petcard.com.br` ou `.app`).** Rejeitada por custo recorrente não-zero,
violando a restrição de orçamento do ADR-010. Fica como possibilidade pós-entrega, fora do escopo
da M7.

**`petcard-web` também no Render (Web Service ou Static Site).** Rejeitada pelo cold start
duplicado na porta de entrada da demo, como descrito acima. O Static Site do Render (diferente do
Web Service usado pela API) não sofre cold start, mas a Vercel ainda venceu por já ser o critério de
aceite explícito da PC-105 e por ter detecção automática de Vite sem configuração adicional.

**Cloudflare Pages.** Também gratuito e sem cold start para estático, cogitado como alternativa
equivalente à Vercel. Não escolhida por não ser o provedor pedido na PC-105 e por introduzir mais
uma conta/credencial sem ganho concreto sobre a Vercel para este escopo.
