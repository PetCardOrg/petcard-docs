# Roteiro de Testes Manuais — 16 Casos de Uso (UC01–UC16)

> **Propósito.** Roteiro de QA manual para revalidar, de ponta a ponta, os 16 casos de uso do PetCard (definidos no [DAS §4](../das.md)). É a mitigação registrada na [Auditoria de 2026-06-01 (risco nº 7)](../auditorias/2026-06-01.md) — a camada visual de web e mobile não é coberta por teste automatizado de UI, então os fluxos que a banca vê são validados manualmente por este roteiro. **Referência da PC-094.**
>
> **Cadência.** Revalidar **a cada marco** (fechamento de milestone e antes de qualquer defesa/gravação). O vídeo de backup (PC-106) deve ser gravado seguindo exatamente estes passos.

## Como usar

1. Suba o ambiente conforme os [pré-requisitos](#pré-requisitos-de-ambiente).
2. Execute cada UC na ordem (eles se encadeiam: UC01 cria a conta que UC02 usa, etc.).
3. Marque o status na [planilha de execução](#registro-de-execução) ao final, com data, versão (commit) e executor.

**Legenda de status:** ✅ passou · ❌ falhou · ⚠️ passou com ressalva · ⬜ não executado · ⏭️ fora de escopo do ambiente atual

## Pré-requisitos de ambiente

Todos os repositórios no branch **`develop`**.

**API (`petcard-api`)**
- `docker compose -f docker/docker-compose.yml up -d` (PostgreSQL+PostGIS, Redis, RabbitMQ).
- `.env` preenchido a partir do `.env.example` (ver variáveis sensíveis abaixo).
- `npx prisma migrate deploy` e `npx prisma db seed` (popula tutores, vet, pets e prontuário de teste).
- `npm run start:dev` (API em `http://localhost:3000`; Swagger em `/docs`).

**Web do veterinário (`petcard-web`)**
- `npm run dev` (Vite em `http://localhost:5173`); `VITE_API_URL` apontando para a API.

**Mobile do tutor (`petcard-mobile`)**
- `npx expo start`; `EXPO_PUBLIC_API_URL` apontando para a API (IP da máquina, não `localhost`, se em dispositivo físico).
- Permissões de **localização** e **notificações** concedidas ao app antes de começar.

**Variáveis/toggles que afetam UCs específicos**
- `GOOGLE_MAPS_API_KEY` — necessária para UC09/UC10 (busca de clínicas via Google Places) e para o seed de clínicas.
- `GOOGLE_CALENDAR_CLIENT_ID/SECRET/REDIRECT_URI` — necessárias para UC12 (OAuth do Google Calendar).
- `FCM_ENABLED=true` + credenciais Firebase — necessárias para UC16 (push real). Com `false` (default de dev), o envio é _no-op_ com warning.
- `DOSE_REMINDER_ENABLED=true` + `DOSE_REMINDER_WINDOW_DAYS` — controlam o cron de lembrete de dose (UC13).

**Contas de teste (do seed, senha `petcard123`)**
| Papel | E-mail | Uso |
|---|---|---|
| Tutor | `ana.silva@example.com` | Tutor principal (já tem pets + prontuário) |
| Tutor | `bruno.costa@example.com` | Segundo tutor (múltiplos pets) |
| Veterinário | `camila.ferreira@vet.example.com` | Web do vet (UC14/UC15) |

## Matriz dos casos de uso

| UC | Caso de uso | Ator | Plataforma |
|---|---|---|---|
| UC01 | Cadastrar-se no sistema | Tutor | Mobile |
| UC02 | Autenticar-se (login) | Tutor / Vet | Mobile / Web |
| UC03 | Cadastrar pet | Tutor | Mobile |
| UC04 | Registrar vacina | Tutor / Vet | Mobile |
| UC05 | Registrar vermifugação | Tutor | Mobile |
| UC06 | Registrar medicação | Tutor | Mobile |
| UC07 | Gerar QR Code (carteira digital) | Tutor | Mobile |
| UC08 | Compartilhar link exclusivo | Tutor | Mobile |
| UC09 | Buscar clínicas por geolocalização | Tutor | Mobile |
| UC10 | Filtrar clínicas | Tutor | Mobile |
| UC11 | Realizar chamada direta para clínica | Tutor | Mobile |
| UC12 | Sincronizar com Google Calendar | Tutor | Mobile |
| UC13 | Receber alertas escalonados | Tutor | Mobile (cron API) |
| UC14 | Adicionar nota clínica (escrita reversa) | Veterinário | Web |
| UC15 | Acessar carteira via QR Code | Veterinário | Web |
| UC16 | Receber notificações push | Tutor | Mobile |

---

## UC01 — Cadastrar-se no sistema

- **Ator/Plataforma:** Tutor · Mobile
- **Pré-condição:** app aberto na tela de Login, sem sessão ativa.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Na tela de Login, tocar em **"Criar conta"**. | Abre a tela de Cadastro. |
| 2 | Preencher nome, e-mail novo e senha; confirmar. | Cadastro aceito; usuário autenticado e redirecionado para a Home ("Meus pets"). |
| 3 | Tentar cadastrar de novo com o mesmo e-mail. | Erro tratado de e-mail já em uso (sem crash). |

**Observações:** o token é persistido em `expo-secure-store`; fechar e reabrir o app deve manter a sessão (ver UC02).

## UC02 — Autenticar-se (login)

- **Ator/Plataforma:** Tutor (Mobile) e Veterinário (Web) — logins separados.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | **Mobile:** logar com `ana.silva@example.com` / `petcard123`. | Entra na Home com os pets já cadastrados no seed. |
| 2 | **Mobile:** logar com senha errada. | Mensagem "Email ou senha incorretos"; permanece na tela de login. |
| 3 | **Mobile:** matar e reabrir o app após logar. | Sessão restaurada sem novo login. |
| 4 | **Web:** logar com `camila.ferreira@vet.example.com` / `petcard123`. | Entra no dashboard do veterinário. |
| 5 | **Web:** tentar acessar rota protegida sem sessão. | Redirecionado ao login (`ProtectedRoute`). |

## UC03 — Cadastrar pet

- **Ator/Plataforma:** Tutor · Mobile
- **Pré-condição:** tutor logado (UC02).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Na Home, tocar em **"Adicionar"** (FAB/botão). | Abre a tela de Cadastro de Pet. |
| 2 | Preencher nome, espécie, sexo, raça e data de nascimento; salvar. | Pet criado; volta à Home com o novo cartão na lista. |
| 3 | (Opcional) Adicionar foto via seletor de imagem. | Foto enviada ao S3 e exibida no cartão/detalhe. |
| 4 | Abrir o pet recém-criado. | Tela de detalhes com idade calculada corretamente a partir da data de nascimento. |

## UC04 — Registrar vacina

- **Ator/Plataforma:** Tutor · Mobile
- **Pré-condição:** um pet cadastrado (UC03).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No detalhe do pet, abrir a seção de **Vacinas**. | Lista de vacinas do pet (com dados do seed, se for a Ana). |
| 2 | Adicionar uma vacina (nome, data, próxima dose). | Registro criado e listado; data formatada DD/MM/AAAA. |
| 3 | Definir uma **próxima dose** futura. | Registro exibe a próxima dose (base para UC13). |

## UC05 — Registrar vermifugação

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** pet cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a seção de **Vermífugos** do pet. | Lista de vermifugações. |
| 2 | Adicionar registro (produto, data, próxima dose). | Registro criado e listado. |

## UC06 — Registrar medicação

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** pet cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a seção de **Medicações** do pet. | Lista de medicações. |
| 2 | Adicionar registro (medicamento, dosagem, período). | Registro criado e listado. |

## UC07 — Gerar QR Code (carteira digital)

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** pet cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No pet, abrir a **Carteira Digital**. | Tela com identidade do pet e resumo de saúde. |
| 2 | Aguardar a geração do QR (fila assíncrona). | QR Code renderizado. Se ainda não gerado, aparece o _placeholder_ e atualiza em seguida. |
| 3 | Tocar em **"Regenerar QR"** e confirmar. | Novo QR solicitado; tela atualiza com a versão mais recente. |

**Observações:** o QR é gerado por _worker_ RabbitMQ (fila `qr-code.generate` com DLQ/retry). Um pequeno atraso na primeira geração é esperado.

## UC08 — Compartilhar link exclusivo

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** carteira com QR gerado (UC07).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Na Carteira Digital, tocar em **"Compartilhar"**. | Abre a _share sheet_ do sistema com o link público da carteira. |
| 2 | Tocar em **"Exportar PDF"**. | PDF da carteira gerado (`expo-print`) e oferecido para compartilhamento (RF12). |
| 3 | Abrir o link compartilhado em um navegador. | Página pública da carteira (`/cards/:token`) carrega sem exigir login. |

**Observações:** exportar/compartilhar exige dispositivo físico (o simulador pode não ter _sharing_ disponível — a tela trata isso com aviso).

## UC09 — Buscar clínicas por geolocalização

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** permissão de localização concedida; `GOOGLE_MAPS_API_KEY` válida.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a aba **Clínicas**. | App obtém a posição atual e lista clínicas próximas (Google Places). |
| 2 | Verificar os cartões de clínica. | Nome, distância e ações (ligar/rotas) exibidos. |

**Observações:** sem GPS/permissão, a busca não roda — conceder permissão e ter _location_ mock no emulador antes da demo.

## UC10 — Filtrar clínicas

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** UC09 funcionando.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Ativar o filtro **"Aberto agora"**. | Lista refeita só com clínicas abertas. |
| 2 | Ajustar o raio de busca. | Lista atualiza conforme o raio (`radiusKm`). |

## UC11 — Realizar chamada direta para clínica

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** clínica com telefone na lista (UC09).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Em um cartão de clínica, tocar em **Ligar**. | Abre o discador do sistema com o número preenchido (`tel:`). |

**Observações:** requer dispositivo com capacidade de chamada; no simulador o discador pode não abrir.

## UC12 — Sincronizar com Google Calendar

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** variáveis `GOOGLE_CALENDAR_*` configuradas; agendamento cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a aba **Agendamentos** e criar um agendamento. | Agendamento listado. |
| 2 | Iniciar a **conexão com o Google** (botão de conectar). | Abre o consentimento OAuth do Google no navegador; ao autorizar, status muda para "conectado". |
| 3 | Acionar **Sincronizar**. | Agendamentos enviados ao Google Calendar; contador de itens sincronizados retornado. |
| 4 | Conferir no Google Calendar. | Eventos aparecem na agenda do usuário. |

**Limitação conhecida:** a sincronização é **unidirecional** (PetCard → Google); a volta (Google → PetCard, PC-065) foi descopada (ADR-002). Tokens OAuth são cifrados em repouso (AES-256-GCM).

## UC13 — Receber alertas escalonados

- **Ator/Plataforma:** Tutor · disparo pelo cron da API · **Pré-condição:** `DOSE_REMINDER_ENABLED=true`; dose com `next_dose_at` dentro da janela (`DOSE_REMINDER_WINDOW_DAYS`); device registrado (UC16).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Cadastrar vacina/vermífugo com próxima dose dentro da janela (UC04/05). | Registro com `next_dose_at` na janela. |
| 2 | Executar o cron de lembrete (aguardar o agendamento ou disparar manualmente). | Um push de lembrete é enfileirado/enviado por dose na janela. |

**Limitação conhecida:** o TAP previa alertas **escalonados** (24h/1h/15min). O implementado é um **lembrete de dose** por janela de dias (`DOSE_REMINDER_WINDOW_DAYS`), não o escalonamento fino — registrar como atendimento parcial na defesa.

## UC14 — Adicionar nota clínica (escrita reversa)

- **Ator/Plataforma:** Veterinário · Web · **Pré-condição:** vet logado (UC02); carteira de um pet acessível (UC15).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No perfil do pet (acessado via scan/QR), abrir o formulário de **nota clínica**. | Formulário disponível para o vet. |
| 2 | Preencher e salvar a nota. | Nota registrada e associada ao pet; validação de campos na borda. |
| 3 | Como **tutor** (mobile), abrir o pet. | A nota do veterinário aparece no histórico do pet (escrita reversa). |

**Observações:** o vet só escreve em pet cujo acesso foi obtido por token/QR; a verificação de propriedade/escopo foi endurecida na auditoria de M5.

## UC15 — Acessar carteira via QR Code

- **Ator/Plataforma:** Veterinário · Web · **Pré-condição:** vet logado; um QR/token de carteira (do UC07).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No dashboard, abrir **Escanear** (VetScan). | Ativa a câmera/scanner (`html5-qrcode`). |
| 2 | Escanear o QR da carteira do pet. | Token extraído (aceita URL da carteira ou UUID cru) e o perfil do pet é aberto. |
| 3 | (Alternativa sem câmera) Abrir `/#/cards/<token>` diretamente. | Página pública da carteira carrega em modo somente-leitura. |

**Observações:** a rota pública `GET /cards/:token` tem _rate-limit_ (throttle) configurável.

## UC16 — Receber notificações push

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** dispositivo **físico**; `FCM_ENABLED=true` + credenciais Firebase; permissão de notificação concedida.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Logar no app e conceder permissão de notificações. | Device token registrado no backend (`/devices`). |
| 2 | Disparar um evento que gera push (ex.: lembrete de dose — UC13). | Notificação recebida no dispositivo (banner/lista). |

**Limitação conhecida:** com `FCM_ENABLED=false` (default de dev) o envio é _no-op_; testar push exige o toggle ligado, credenciais válidas e **dispositivo físico** (o emulador não recebe FCM real). Para a demo, gravar o vídeo de backup (PC-106) deste fluxo.

---

## Registro de execução

Preencher a cada rodada de revalidação (um bloco por marco).

**Rodada:** `____________` · **Data:** `__/__/____` · **Commit(s):** `____________` · **Executor:** `____________`

| UC | Status | Observações |
|---|---|---|
| UC01 | ⬜ | |
| UC02 | ⬜ | |
| UC03 | ⬜ | |
| UC04 | ⬜ | |
| UC05 | ⬜ | |
| UC06 | ⬜ | |
| UC07 | ⬜ | |
| UC08 | ⬜ | |
| UC09 | ⬜ | |
| UC10 | ⬜ | |
| UC11 | ⬜ | |
| UC12 | ⬜ | |
| UC13 | ⬜ | |
| UC14 | ⬜ | |
| UC15 | ⬜ | |
| UC16 | ⬜ | |

**Resumo da rodada:** `___ / 16` ✅ · pendências: `____________`
