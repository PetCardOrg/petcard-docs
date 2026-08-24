# Collection Postman — PetCard API (PC-098)

Collection e environment do Postman para explorar a **API REST do PetCard**, cobrindo os **59 endpoints** em 16 grupos. Gerados a partir do contrato **OpenAPI** da API (PC-097).

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `petcard-api.postman_collection.json` | Collection (schema Postman v2.1) — 16 pastas por domínio, 59 requests, com corpo de exemplo e exemplo de resposta em cada uma. |
| `petcard-api.postman_environment.json` | Environment **PetCard - Local** — `base_url`, tokens e credenciais do seed. |
| `openapi.json` | Snapshot do contrato OpenAPI que originou a collection (fonte de verdade). |
| `build-collection.js` | Script que regenera a collection/environment a partir do `openapi.json`. |

## Como usar

1. No Postman: **Import** → selecione os dois arquivos (`*.postman_collection.json` e `*.postman_environment.json`).
2. No seletor de environment (canto superior direito), escolha **PetCard - Local**.
3. Suba a API localmente (`npm run start:dev` no `petcard-api`, com Postgres/RabbitMQ via `docker compose`) e rode o seed (`npm run db:seed`).
4. Rode **auth → Login do tutor** (ou **Login do veterinário**). O token JWT é **capturado automaticamente** (script de teste) e salvo em `access_token`.
5. Rode qualquer outro endpoint — todos herdam o `Bearer {{access_token}}` da collection.

### Autenticação

- A collection define **Bearer `{{access_token}}`** no nível raiz; os 52 endpoints protegidos herdam.
- São **públicos** (`noauth`): `GET /` (health), `POST /auth/register`, `POST /auth/login`, `POST /auth/veterinario/register`, `POST /auth/veterinario/login`, `GET /calendar/callback` e `GET /cards/:token` (carteira pública via QR).
- Quem é público **sai do contrato**, não de uma lista no script: `@Auth` compõe `@ApiBearerAuth`, então só rota com `@Public()` fica sem `security` no OpenAPI.
- Os logins gravam o token em variáveis por papel (`tutor_token`, `vet_token`) e no `access_token` ativo — troque de papel apenas re-executando o login correspondente.

### Variáveis de ambiente

| Variável | Valor padrão | Uso |
| --- | --- | --- |
| `base_url` | `http://localhost:3000` | Host da API — aponte para staging/produção quando disponível. |
| `access_token` | *(vazio)* | Token do papel ativo; preenchido pelo login. |
| `tutor_token` / `vet_token` | *(vazio)* | Último token de cada papel. |
| `tutor_email` / `tutor_password` | `ana.silva@example.com` / `petcard123` | Credenciais de tutor do seed. |
| `vet_email` / `vet_password` | `camila.ferreira@vet.example.com` / `petcard123` | Credenciais de veterinário do seed. |

> Os corpos e respostas de exemplo (fora dos logins) usam **valores gerados a partir do schema** — são placeholders com o formato correto, não dados reais. Ajuste ids/valores conforme o seu ambiente.

## Regeneração

Quando a API mudar, regenere em dois passos:

```bash
# 1. No repo petcard-api: gera o contrato OpenAPI (preview mode, sem subir infra)
cd petcard-api
npm run openapi:json          # escreve openapi.json na raiz
cp openapi.json ../petcard-docs/docs/api/openapi.json

# 2. Aqui: converte o OpenAPI em collection + environment
cd ../petcard-docs/docs/api
npm install openapi-to-postmanv2   # ou use npx
node build-collection.js
```

O `build-collection.js` usa o conversor oficial da Postman (`openapi-to-postmanv2`) e reaplica os ajustes do PetCard (host `{{base_url}}`, auth herdada, captura de token nos logins, endpoints públicos em `noauth`). Os UUIDs internos e os valores de exemplo são regenerados a cada execução — a estrutura permanece estável.
