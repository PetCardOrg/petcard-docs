/*
 * Gera a collection e o environment Postman do PetCard a partir do OpenAPI.
 *
 * Pré-requisitos:
 *   1. Gerar o spec na API:  (no repo petcard-api)  npm run openapi:json
 *      e copiar o `openapi.json` resultante para este diretório.
 *   2. Instalar o conversor oficial da Postman:
 *      npm install openapi-to-postmanv2   (ou usar npx)
 *
 * Uso:  node build-collection.js
 * Saída: petcard-api.postman_collection.json + petcard-api.postman_environment.json
 */
const fs = require('fs');
const path = require('path');
const Converter = require('openapi-to-postmanv2');

const dir = __dirname;
const openapi = JSON.parse(
  fs.readFileSync(path.join(dir, 'openapi.json'), 'utf8'),
);

const options = {
  folderStrategy: 'Tags',
  requestParametersResolution: 'Example',
  exampleParametersResolution: 'Example',
  parametersResolution: 'Example',
  includeAuthInfoInExample: false,
  requestNameSource: 'Fallback',
  shortValidationErrors: true,
};

Converter.convert({ type: 'json', data: openapi }, options, (err, result) => {
  if (err) throw err;
  if (!result.result) {
    console.error('Conversão falhou:', result.reason);
    process.exit(1);
  }
  const collection = result.output[0].data;
  const walk = (items, cb) =>
    items.forEach((i) => {
      cb(i);
      if (Array.isArray(i.item)) walk(i.item, cb);
    });
  const pathOf = (i) =>
    i.request && i.request.url && Array.isArray(i.request.url.path)
      ? '/' + i.request.url.path.join('/')
      : '';

  // Metadados + variável base_url
  collection.info.name = 'PetCard API';
  collection.variable = [
    { key: 'base_url', value: 'http://localhost:3000', type: 'string' },
  ];

  // Host sempre {{base_url}} — na request e nos exemplos de response
  const fixHost = (url) => {
    if (url && typeof url === 'object') {
      url.host = ['{{base_url}}'];
      delete url.port;
    }
  };
  walk(collection.item, (i) => {
    if (!i.request) return;
    fixHost(i.request.url);
    if (Array.isArray(i.response)) {
      i.response.forEach((r) => r.originalRequest && fixHost(r.originalRequest.url));
    }
  });

  // Auth Bearer no nível da collection (endpoints herdam)
  collection.auth = {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{access_token}}', type: 'string' }],
  };

  // Captura automática do token nos logins + credenciais do seed via env
  const capture = (varName) => ({
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: [
        'if (pm.response.code === 200 || pm.response.code === 201) {',
        '  const body = pm.response.json();',
        '  if (body && body.access_token) {',
        `    pm.collectionVariables.set('${varName}', body.access_token);`,
        "    pm.collectionVariables.set('access_token', body.access_token);",
        '  }',
        '}',
      ],
    },
  });
  const setBody = (i, obj) => {
    i.request.body = {
      mode: 'raw',
      raw: JSON.stringify(obj, null, 2),
      options: { raw: { language: 'json' } },
    };
  };
  walk(collection.item, (i) => {
    const p = pathOf(i);
    if (p === '/auth/login') {
      i.event = [capture('tutor_token')];
      setBody(i, { email: '{{tutor_email}}', password: '{{tutor_password}}' });
    } else if (p === '/auth/veterinario/login') {
      i.event = [capture('vet_token')];
      setBody(i, { email: '{{vet_email}}', password: '{{vet_password}}' });
    }
  });

  // Endpoints públicos: noauth. Demais: herdam o Bearer da collection.
  //
  // Quem é público sai do próprio contrato: `@Auth` compõe `@ApiBearerAuth`,
  // então só rota com `@Public()` fica sem `security` no OpenAPI. Uma lista
  // fixa aqui envelhece calada — foi o que aconteceu com o cadastro de
  // veterinário (público, mandava Bearer à toa) e com a carteira clínica
  // (protegida, era marcada noauth por um regex sobre /cards/:token).
  const protegidos = new Set();
  Object.entries(openapi.paths).forEach(([rota, operacoes]) => {
    Object.entries(operacoes).forEach(([metodo, operacao]) => {
      if (operacao && Array.isArray(operacao.security)) {
        protegidos.add(`${metodo.toUpperCase()} ${rota}`);
      }
    });
  });
  // A collection escreve `:token` onde o OpenAPI escreve `{token}`.
  const chaveDe = (i) =>
    `${i.request.method} ${pathOf(i).replace(/:([^/]+)/g, '{$1}')}`;

  walk(collection.item, (i) => {
    if (!i.request) return;
    if (protegidos.has(chaveDe(i))) {
      delete i.request.auth; // herda {{access_token}} da collection
    } else {
      i.request.auth = { type: 'noauth' };
    }
  });

  fs.writeFileSync(
    path.join(dir, 'petcard-api.postman_collection.json'),
    JSON.stringify(collection, null, 2),
  );

  const env = {
    id: 'petcard-local',
    name: 'PetCard - Local',
    values: [
      { key: 'base_url', value: 'http://localhost:3000', type: 'default', enabled: true },
      { key: 'access_token', value: '', type: 'secret', enabled: true },
      { key: 'tutor_token', value: '', type: 'secret', enabled: true },
      { key: 'vet_token', value: '', type: 'secret', enabled: true },
      { key: 'tutor_email', value: 'ana.silva@example.com', type: 'default', enabled: true },
      { key: 'tutor_password', value: 'petcard123', type: 'secret', enabled: true },
      { key: 'vet_email', value: 'camila.ferreira@vet.example.com', type: 'default', enabled: true },
      { key: 'vet_password', value: 'petcard123', type: 'secret', enabled: true },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_using: 'PetCard PC-098',
  };
  fs.writeFileSync(
    path.join(dir, 'petcard-api.postman_environment.json'),
    JSON.stringify(env, null, 2),
  );

  let folders = 0;
  let reqs = 0;
  walk(collection.item, (i) => {
    if (Array.isArray(i.item)) folders++;
    else if (i.request) reqs++;
  });
  console.log(`Collection gerada: ${folders} pastas, ${reqs} requests`);
});
