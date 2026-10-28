# Auditoria do petcard-web

**Repositório:** `PetCardOrg/petcard-web` (branch `develop`, commit `8359bb0`)
**Data:** 2026-10-24

## O que o repositório faz

É a SPA web do PetCard (Vite + React 19). O veterinário entra com login, vê os pets que atende, lê a carteira pelo QR e registra vacina, vermífugo, medicação e nota clínica. Há também duas páginas públicas: a carteira do pet e a página de "achei o pet" da coleira.

**Carga assumida:** uso baixo e concorrente, de poucos veterinários e de qualquer pessoa que leia o QR de uma coleira. A API fica no plano grátis do Render, com cold start (a API "dorme" e demora para acordar) de cerca de 13s, valor registrado no `CLAUDE.md` da raiz.

**Estado atual:** o lint passa, os 147 testes passam e o `npm audit` mostra 0 vulnerabilidades. Os problemas abaixo vêm da leitura do código.

## Resumo

| # | Gravidade | Problema | Arquivo |
| --- | --- | --- | --- |
| 1 | Deve corrigir | Cold start desloga o veterinário | `src/contexts/AuthContext.tsx:37`, `src/services/api.ts:4` |
| 2 | Deve corrigir | Página "achei o pet" diz que avisou o tutor mesmo quando o aviso falhou | `src/pages/LostPet/LostPetPage.tsx:130` |
| 3 | Deve corrigir | Botão Voltar prende o veterinário na carteira | `src/pages/PublicCard/PublicCardPage.tsx:247,263` |
| 4 | Deve corrigir | Erro ao excluir um registro nunca aparece | `src/pages/VetPetProfile/VetPetProfilePage.tsx:263,406` |
| 5 | Deve corrigir | Não dá para limpar campos opcionais ao editar | `src/pages/VetPetProfile/VetPetProfilePage.tsx:322` |
| 6 | Convém corrigir | Data "hoje" errada à noite (fuso) | `src/pages/VetPetProfile/healthRecordValidation.ts:29` |
| 7 | Convém corrigir | Respostas atrasadas sobrescrevem as novas | `src/pages/VetDashboard/VetDashboardPage.tsx` |
| 8 | Convém corrigir | Parâmetros da URL sem `encodeURIComponent` | `src/services/*.ts` |
| 9 | Convém corrigir | Componente de 1056 linhas com blocos repetidos | `src/pages/VetPetProfile/VetPetProfilePage.tsx` |
| 10 | Convém corrigir | Falta teste dos casos de borda acima | — |
| 11 | Opcional | Código duplicado (cores, datas, PATCH) | vários |
| 12 | Opcional | Provável código morto na Vercel | `src/main.tsx:34-48` |
| 13 | Opcional | Troca de idioma refaz a busca do perfil | `VetPetProfilePage.tsx` |

**Veredicto:** código saudável, bem comentado e com testes e segurança em dia. Os itens 1 e 2 devem ser resolvidos antes de gravar o vídeo da PC-106. Depois vêm o 3, o 4 e o 5.

---

## Deve corrigir

### 1. Cold start desloga o veterinário

- **Onde:** `src/contexts/AuthContext.tsx:37`, `src/services/api.ts:4`
- **O que é:** ao abrir o app com um token salvo, o `AuthProvider` pede o perfil à API para confirmar a sessão.
- **Problema:** qualquer erro nessa chamada apaga o token, inclusive timeout e erro 500. O timeout é de 10s e o cold start medido é de 13s. A primeira abertura depois de um tempo parado desloga o vet sem motivo.
- **Correção:** limpar o token só quando o erro for 401. Falhas de rede e 5xx devem manter o token. Subir o timeout para cerca de 30s, ou fazer um request de aquecimento antes da demo, também ajuda.
- **Se não corrigir:** a gravação da PC-106 e a defesa podem começar com a tela de login sem motivo.

### 2. Página "achei o pet" diz que avisou o tutor mesmo quando o aviso falhou

- **Onde:** `src/pages/LostPet/LostPetPage.tsx:130`
- **O que é:** a página lê a localização e chama `registrarLeitura`, que manda o aviso ao tutor.
- **Problema:** se essa chamada falhar (timeout no cold start, 429 ou 500), o erro é engolido de propósito. Mas a linha seguinte mostra "localização enviada, avisamos o tutor" sempre que houve coordenadas. Quem achou o pet vê sucesso e vai embora, e o tutor não recebe nada.
- **Correção:** fazer `registrarLeitura` devolver sucesso ou falha, e marcar `"enviada"` só quando deu certo. No erro, usar o estado de repetir que já existe (`"sem_permissao"`) ou criar um estado `"falhou"`.
- **Se não corrigir:** é a função de segurança do pet perdido, e ela falha sem ninguém ver.

### 3. Botão Voltar prende o veterinário na carteira

- **Onde:** `src/pages/PublicCard/PublicCardPage.tsx:247,263`
- **O que é:** depois do login, a carteira lê `acessoVet` no estado do histórico, entra sozinha e navega para `/vet/pets/:id`.
- **Problema:** esse estado continua no histórico. Ao apertar Voltar no prontuário, a carteira reabre com `acessoVet` ainda ligado, entra de novo e joga o vet de volta no prontuário. Ele não consegue sair por Voltar.
- **Correção:** navegar com `{ replace: true }` quando `pediuAcessoVet` for verdadeiro, ou limpar o estado antes de entrar.
- **Se não corrigir:** a demo do fluxo QR → login → prontuário trava no primeiro Voltar.

### 4. Erro ao excluir um registro nunca aparece

- **Onde:** `src/pages/VetPetProfile/VetPetProfilePage.tsx:263,406`
- **O que é:** `handleDelete` e `handleDeleteNote` apagam um registro clínico e guardam a falha em `recordError`.
- **Problema:** `recordError` só é mostrado dentro do modal de registro (linha 1044). Na exclusão não há modal aberto, então um 403, 500 ou timeout não mostra nada. O vet acha que apagou, mas o dado continua lá.
- **Correção:** mostrar o erro também fora do modal, num aviso no topo da aba, ou usar um estado `deleteError` separado.
- **Se não corrigir:** o vet acha que apagou um dado clínico que continua no sistema.

### 5. Não dá para limpar campos opcionais ao editar

- **Onde:** `VetPetProfilePage.tsx:322` (`toDto`) e o PATCH da nota clínica
- **O que é:** na edição, `toDto` monta o corpo do PATCH. Campos vazios são omitidos ou ficam `undefined`, e o JSON os descarta.
- **Problema:** para a API, "campo ausente" significa "não mexer". Se o vet apaga a próxima dose, a data de fim, as observações ou a prescrição, o valor antigo continua gravado e a tela volta com o dado velho depois do `load()`.
- **Correção:** na edição, mandar `null` (ou `""`, conforme o DTO aceitar) nos campos limpos. Antes, conferir se o DTO do `@petcardorg/shared` aceita `null`.
- **Se não corrigir:** o vet não consegue corrigir erro de digitação em campos opcionais. Para dado clínico, isso é um problema real.

---

## Convém corrigir

### 6. Data "hoje" errada à noite

- **Onde:** `src/pages/VetPetProfile/healthRecordValidation.ts:29` e a validação `appliedInFuture`
- **O que é:** `new Date().toISOString().split("T")[0]` dá a data em UTC.
- **Problema:** no Brasil (UTC−3), depois das 21h, "hoje" vira o dia seguinte. A vacina nasce com data de amanhã no formulário e passa na validação "não pode ser no futuro". O repositório já corrigiu esse tipo de erro na exibição (`diaLocal`) e o `vitest.config.ts` já fixa `TZ`, mas este ponto ficou de fora. Os testes rodam de dia e não pegam o caso.
- **Correção:** uma função `hojeLocal()` com `toLocaleDateString("sv-SE")`, usada no formulário e na validação. Um teste com a hora fixada às 23h em `America/Sao_Paulo` cobre o caso.
- **Se não corrigir:** registros com data errada, à noite ou de madrugada.

### 7. Respostas atrasadas sobrescrevem as novas

- **Onde:** `VetDashboardPage.tsx` (efeitos de `[page]` e `[search]`) e `VetPetProfilePage.tsx` (`load`)
- **O que é:** a lista do dashboard busca ao digitar na busca e ao trocar de página.
- **Problema:** nenhuma chamada é cancelada. Se a resposta de "a" chegar depois da de "ab", a lista mostra o resultado errado. Além disso, a primeira carga busca duas vezes (o efeito de página e o de debounce), e voltar da página 3 para a 1 faz a busca sair em dobro.
- **Correção:** usar a trava `cancelado` que o `LostPetPage` já tem, ou um `AbortController`, e unir os dois efeitos em um só.
- **Se não corrigir:** é raro, mas em rede lenta a lista mostra dados trocados e gasta chamadas à toa.

### 8. Parâmetros da URL sem `encodeURIComponent`

- **Onde:** `card.service.ts`, `coleira.service.ts`, `pet-profile.service.ts`
- **O que é:** o `:token` ou `:id` da URL entra direto no caminho da API, por exemplo `/pets/${petId}`.
- **Problema:** o React Router decodifica o parâmetro. Um link como `#/vet/pets/..%2Fveterinarios%2Fme` faz o navegador chamar outro caminho da API com o Bearer do vet logado. Só saem GET, mas o caminho é decidido pelo link.
- **Correção:** `encodeURIComponent` num ponto único, no `apiFetch` ou nos serviços.
- **Se não corrigir:** risco baixo, e a correção custa uma linha por serviço.

### 9. Componente de 1056 linhas com blocos repetidos

- **Onde:** `src/pages/VetPetProfile/VetPetProfilePage.tsx`
- **O que é:** um componente só cuida de carga, 4 formulários, editar e excluir, histórico e três listas de abas quase idênticas.
- **Problema:** as abas de vacina, vermífugo e medicação repetem o mesmo bloco de cartão. `handleRecordSubmit` repete a montagem de DTO que `toDto` já faz, e as correções dos itens 4 e 5 precisam mexer nos dois lugares.
- **Correção:** usar `toDto` também na criação e extrair um `RecordCard` reutilizável para as três abas. Dividir por tarefa, não por quantidade de linhas.
- **Se não corrigir:** cada ajuste futuro fica caro e sujeito a esquecimento.

### 10. Falta teste dos casos de borda acima

- **Problema:** nenhum teste cobre: o `AuthProvider` com erro de rede (item 1), a falha do aviso na página da coleira (item 2), o Voltar da carteira (item 3), a exclusão com erro (item 4) e a edição com campo limpo (item 5).
- **Correção:** um teste por item, junto com cada correção.
- **Se não corrigir:** os bugs podem voltar sem a CI avisar.

---

## Opcional

### 11. Código duplicado

- `SPECIES_COLORS` existe em `VetDashboardPage.tsx:30` e `VetPetProfilePage.tsx:44`.
- `formatDate` existe 3 vezes: `PublicCardPage.tsx:28`, `VetPetProfilePage.tsx:226` e `VetDashboardPage.tsx:140`.
- `updateVeterinario` e `corrigirMeuCrmv` fazem o mesmo PATCH em `/veterinarios/me`.
- Um módulo em `utils/` (cores e datas) e uma função única de PATCH resolvem.

### 12. Provável código morto na Vercel

- **Onde:** `normalizePublicCardLocation` em `src/main.tsx:34-48`
- Não há `vercel.json` no repositório. Um QR com caminho sem `#` (`/card/xxx`) recebe 404 do servidor antes de o JavaScript rodar. Os QR atuais usam `#/card` e `#/achei`, conforme os padrões da API, então a função só serve para QR antigo, se ainda existir. Se não houver nenhum, dá para apagar o bloco (cerca de 30 linhas).

### 13. Troca de idioma refaz a busca do perfil

- **Onde:** `VetPetProfilePage.tsx`
- `load` depende de `t`. Trocar o idioma refaz as 5 chamadas do perfil e mostra o esqueleto de carregamento de novo. Tirar `t` das dependências resolve.

---

## Resumo de enxugamento

Lean: −cerca de 150 linhas, 0 dependências possíveis (itens 9, 11 e 12).

## O que não foi verificado

- Não li por inteiro `VetProfilePage.tsx`, `VetRegisterPage.tsx`, `HealthRecordModal.tsx`, o CSS nem os arquivos de tradução.
- Não rodei a aplicação nem testei contra a API real.
- Os itens 1 e 2 dependem do cold start medido, que veio do `CLAUDE.md` da raiz e não de uma medição própria.
- Não confirmei como o Render nem a API tratam rate limit na rota `/coleira/:token/leitura` (relevante para o item 2).
