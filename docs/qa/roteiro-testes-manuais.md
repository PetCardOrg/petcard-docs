# Roteiro de Testes Manuais — 16 Casos de Uso (UC01–UC16)

> **Propósito.** Roteiro de QA manual para revalidar, de ponta a ponta, os 16 casos de uso do PetCard (definidos no [DAS §4](../das.md)). É a mitigação registrada na [Auditoria de 2026-06-01 (risco nº 7)](../auditorias/2026-06-01.md) — a camada visual de web e mobile não é coberta por teste automatizado de UI, então os fluxos que a banca vê são validados manualmente por este roteiro. **Referência da PC-094.**
>
> **Cadência.** Revalidar **a cada marco** (fechamento de milestone e antes de qualquer defesa/gravação). O vídeo de backup (PC-106) deve ser gravado seguindo exatamente estes passos.
>
> **Revisões.** 2026-07-15 — versão inicial (PC-094). 2026-10-14 — atualização para o estado da `develop` após a Sprint 3: autenticação do tutor (ADR-008), CRMV e acesso clínico (ADR-005), autoria e histórico clínico (ADR-009, api#117), lembretes de agendamento (api#111), comprovantes de saúde (ADR-013) e funcionalidades extras (seção [Funcionalidades extras](#funcionalidades-extras-fora-dos-16-ucs)). Os passos novos foram escritos a partir dos ADRs, dos textos de tela (`i18n`) e do código; **ainda não foram percorridos em uma rodada completa** — a primeira execução deve confirmar os resultados esperados marcados com _(confirmar)_.

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
- `DOSE_REMINDER_ENABLED=true` + `DOSE_REMINDER_WINDOW_DAYS` (padrão 3) — controlam o cron de lembrete de dose de vacina, vermífugo e medicação (UC13).
- `APPOINTMENT_REMINDER_ENABLED=true` + `APPOINTMENT_REMINDER_WINDOW_HOURS` (padrão 24) — controlam o cron de lembrete de agendamento (UC13). Os dois crons rodam **todo dia às 9h**.
- `SMTP_HOST` (e `SMTP_*`) — e-mail de verificação de conta e de recuperação de senha (UC01/UC02). **Sem `SMTP_HOST`, a API não envia e-mail: o link é escrito no log do console da API** (`[MAIL:dev] ... Link: ...`). É o modo esperado para a demo; copie o link do log para o navegador. `APP_DEEP_LINK_BASE` (padrão `http://localhost:3000/auth`) é a base desses links — as páginas de redefinição e verificação são servidas pela própria API.
- `GOOGLE_AUTH_CLIENT_IDS` (API) + `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` (mobile) — login/cadastro com Google (UC01/UC02). **Sem elas, o botão "Entrar com Google" fica oculto** e o passo correspondente deve ser marcado ⏭️.
- `CRMV_PROVIDER=stub` (padrão) — verificação de CRMV sem chamada externa: aceita todo CRMV bem formado e **recusa o número `00000`** (UC14/UC15, ADR-005). Com `infosimples` exige `INFOSIMPLES_TOKEN` e é pago por consulta; não usar nas rodadas de revalidação.
- `PUBLIC_CARD_BASE_URL` — base do link público da carteira (UC07/UC08/UC15). Precisa conter `#`, porque a web usa `HashRouter` (ex.: `http://localhost:5173/#/card`), e o valor vai **entre aspas** no `.env` (sem aspas o dotenv corta tudo a partir do `#`). Sem isso, o link compartilhado e o QR não abrem a carteira. A API avisa no log quando o valor não tem `#`.
- `AWS_*` / `AWS_S3_BUCKET` — o bucket precisa estar acessível para foto do pet e para os **comprovantes** (UC04–UC06, ADR-013). O prefixo `anexos/` não pode ter leitura pública; a credencial precisa de `s3:PutObject` e `s3:GetObject` nele. Sem S3 disponível, os passos de anexo ficam ⏭️.

**Contas de teste (do seed, senha `petcard123`)**
| Papel | E-mail | Uso |
|---|---|---|
| Tutor | `ana.silva@example.com` | Tutor principal (já tem pets + prontuário). Já nasce com e-mail verificado — não mostra o aviso de verificação. |
| Tutor | `bruno.costa@example.com` | Segundo tutor (múltiplos pets) |
| Veterinário | `camila.ferreira@vet.example.com` | Web do vet — CRMV `CRMV-SP 12345`, aceito pelo stub (UC14/UC15) |
| Veterinário | `marcos.andrade@vet.example.com` | Web do vet — CRMV `CRMV-SP 00000`, **recusado pelo stub**: demonstra o bloqueio de dado clínico (UC15) |

O seed também cria os vínculos veterinário–pet (`PetAtendido`) que alimentam a lista "Pets Atendidos" do painel web.

## Matriz dos casos de uso

| UC | Caso de uso | Ator | Plataforma |
|---|---|---|---|
| UC01 | Cadastrar-se no sistema | Tutor / Vet | Mobile / Web |
| UC02 | Autenticar-se (login e recuperação de senha) | Tutor / Vet | Mobile / Web |
| UC03 | Cadastrar pet | Tutor | Mobile |
| UC04 | Registrar vacina (com comprovante) | Tutor / Vet | Mobile / Web |
| UC05 | Registrar vermifugação (com comprovante) | Tutor / Vet | Mobile / Web |
| UC06 | Registrar medicação (com comprovante) | Tutor / Vet | Mobile / Web |
| UC07 | Gerar QR Code (carteira digital) | Tutor | Mobile |
| UC08 | Compartilhar link exclusivo | Tutor | Mobile |
| UC09 | Buscar clínicas por geolocalização | Tutor | Mobile |
| UC10 | Filtrar clínicas | Tutor | Mobile |
| UC11 | Realizar chamada direta para clínica | Tutor | Mobile |
| UC12 | Sincronizar com Google Calendar | Tutor | Mobile |
| UC13 | Receber alertas (dose e agendamento) | Tutor | Mobile (cron API) |
| UC14 | Adicionar nota clínica (escrita reversa) | Veterinário | Web |
| UC15 | Acessar carteira via QR Code | Veterinário | Web |
| UC16 | Receber notificações push | Tutor | Mobile |

Funcionalidades fora dos 16 UCs do DAS, mas entregues e visíveis à banca, estão na seção [Funcionalidades extras](#funcionalidades-extras-fora-dos-16-ucs) (X01–X03).

---

## UC01 — Cadastrar-se no sistema

- **Ator/Plataforma:** Tutor · Mobile (passos 1–9) e Veterinário · Web (passos 10–12)
- **Pré-condição:** app aberto na tela de Login, sem sessão ativa.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Na tela de Login, tocar em **"Criar conta"**. | Abre a tela de Cadastro. |
| 2 | Preencher nome e e-mail novo; digitar a senha `abc` e sair do campo. | A senha é rejeitada. A regra aparece: mínimo de 8 caracteres, uma letra maiúscula, um número e um caractere especial (o app mostra a checklist de requisitos). |
| 3 | Digitar senhas válidas mas **diferentes** em "Senha" e "Confirmar senha". | Erro "As senhas não coincidem."; cadastro não é enviado. |
| 4 | Preencher uma senha forte (ex.: `Petcard@123`) igual nos dois campos e confirmar. | Cadastro aceito; usuário autenticado e redirecionado para a Home. |
| 5 | Observar o topo da Home. | Banner **"Confirme seu e-mail"** com o botão **"Reenviar e-mail"** (a verificação é _soft_: não bloqueia o uso do app — ADR-008). |
| 6 | Abrir o log do console da API (sem `SMTP_HOST`) e copiar o link de verificação (`[MAIL:dev] ... Link: ...`); abri-lo em um navegador. | A API serve uma página confirmando a verificação do e-mail. Voltando ao app e atualizando, o banner some. |
| 7 | Tocar em **"Reenviar e-mail"** (antes de verificar, em outra conta nova). | Mensagem "E-mail reenviado. Verifique sua caixa de entrada."; um novo link aparece no log da API. O link anterior deixa de valer (uso único; só o mais recente funciona). |
| 8 | Tentar cadastrar de novo com o mesmo e-mail. | Erro tratado de e-mail já em uso (sem crash). |
| 9 | (Se `GOOGLE_AUTH_CLIENT_IDS` configurado) Tocar em **"Cadastrar com Google"** e escolher uma conta. | Conta criada já com e-mail verificado (sem banner) e usuário na Home. Sem as variáveis, o botão não aparece: marcar ⏭️. |
| 10 | **Web:** abrir `/#/vet/register` e preencher nome, CRMV (ex.: `CRMV-SP 54321`), e-mail novo, telefone (opcional) e senha com confirmação. | Conta de veterinário criada; o registro no conselho é validado durante o cadastro (stub aceita o CRMV). |
| 11 | **Web:** repetir o cadastro com senhas diferentes. | Erro "As senhas não coincidem." |
| 12 | **Web:** repetir o cadastro com o mesmo e-mail ou CRMV. | Erro "Já existe uma conta com esse e-mail ou CRMV." |

**Observações:** o token é persistido em `expo-secure-store`; fechar e reabrir o app deve manter a sessão (ver UC02). O e-mail **não é enviado de verdade** no modo de log — a evidência é o link saindo no console da API (ADR-008). O link de verificação de e-mail vale 24 h (o de redefinição de senha, 60 min). O cadastro do tutor e o do veterinário usam tabelas e logins separados.

## UC02 — Autenticar-se (login)

- **Ator/Plataforma:** Tutor (Mobile) e Veterinário (Web) — logins separados.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | **Mobile:** logar com `ana.silva@example.com` / `petcard123`. | Entra na Home com os pets já cadastrados no seed. |
| 2 | **Mobile:** logar com senha errada. | Mensagem "Email ou senha incorretos"; permanece na tela de login. |
| 3 | **Mobile:** matar e reabrir o app após logar. | Sessão restaurada sem novo login. |
| 4 | **Web:** logar com `camila.ferreira@vet.example.com` / `petcard123`. | Entra no dashboard do veterinário. |
| 5 | **Web:** tentar acessar rota protegida sem sessão. | Redirecionado ao login (`ProtectedRoute`). |
| 6 | **Web:** logar com senha errada. | Mensagem "E-mail ou senha inválidos."; permanece no login. |
| 7 | **Mobile:** na tela de Login, tocar em **"Esqueci minha senha"**, informar o e-mail da Ana e enviar. | Mensagem neutra "Se houver uma conta com esse e-mail, enviamos um link..." (a mesma resposta vale para e-mail inexistente — a API não revela quais e-mails existem). |
| 8 | Copiar do log da API o link de redefinição e abri-lo no navegador; definir uma senha **fraca**. | Senha recusada pelas mesmas regras do cadastro (8+ caracteres, maiúscula, número, especial). |
| 9 | No mesmo link, definir uma senha forte nova. | Senha alterada. Logar no app com a senha nova funciona; a antiga não. Reabrir o mesmo link ainda mostra o formulário (a API só valida o token ao enviar), mas definir uma senha por ele é recusado com a página "Link expirado — Este link de redefinição já foi usado ou passou da validade" (uso único; vale 60 min). _Depois do teste, restaurar a senha para `petcard123` ou rodar o seed._ |
| 10 | **Mobile:** errar a senha repetidas vezes seguidas, em sequência rápida. | Após o limite de tentativas, a API passa a recusar com excesso de requisições (_rate limit_ por IP nas rotas de autenticação: login, cadastro e recuperação de senha; padrão de **10 tentativas por minuto**, ajustável por `AUTH_THROTTLE_LIMIT`; resposta HTTP 429) _(confirmar a mensagem exibida no app)_. Aguardar a janela para voltar a logar. |
| 11 | (Se `GOOGLE_AUTH_CLIENT_IDS` configurado) **Mobile:** tocar em **"Entrar com Google"**. | Login pela conta Google; se o e-mail já existir como conta, ela é vinculada. Sem as variáveis o botão não aparece: ⏭️. |
| 12 | **Web (veterinário):** logar com `marcos.andrade@vet.example.com` / `petcard123`. | Entra no painel, mas o CRMV não é aceito pelo stub (ver UC15 para o bloqueio de dado clínico). |

**Observações:** o login do tutor **não** exige senha forte — quem tinha uma senha curta antes continua entrando; a regra vale só ao definir senha nova. Conta criada só com Google não tem senha: o login por e-mail/senha a recusa. Não há refresh token: redefinir a senha não invalida sessões já abertas, que expiram sozinhas (limitação declarada no ADR-008).

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

- **Ator/Plataforma:** Tutor · Mobile; Veterinário · Web (passos 7 e 10)
- **Pré-condição:** um pet cadastrado (UC03). Passos 4–12 exigem S3 acessível (ver pré-requisitos).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No detalhe do pet, abrir a seção de **Vacinas**. | Lista de vacinas do pet (com dados do seed, se for a Ana). |
| 2 | Adicionar uma vacina (nome, data, próxima dose). | Registro criado e listado; data formatada DD/MM/AAAA. |
| 3 | Definir uma **próxima dose** futura. | Registro exibe a próxima dose (base para UC13). |
| 4 | No registro criado, tocar em **"Anexar foto"** e escolher uma imagem JPEG/PNG/WebP da galeria (conceder a permissão da galeria se pedida). | Comprovante anexado e listado em **"Comprovantes"** com o selo **"Aguardando verificação do veterinário"** (anexo de tutor nasce não verificado — ADR-013). |
| 5 | Tentar anexar um arquivo inválido (ex.: imagem acima de 10 MB, ou formato não aceito). | Erro tratado ("O arquivo excede o limite de 10 MB." / "Formato não aceito. Use uma foto JPEG, PNG ou WebP."), sem crash. |
| 6 | Tocar em **"Abrir comprovante"**. | A imagem abre por link temporário (5 min); o endereço não é público. |
| 7 | **Web:** logar como `camila.ferreira@vet.example.com`, abrir o pet da Ana (via "Pets Atendidos"), aba **Vacinas**, e no comprovante tocar em **"Marcar como verificado"**. | O selo passa a **"Verificado por Dra. Camila Ferreira (CRMV-SP 12345)"**. A verificação não pode ser desfeita. |
| 8 | **Mobile:** recarregar o detalhe do pet. | O comprovante mostra o mesmo selo de verificado, com nome e CRMV de quem conferiu. |
| 9 | **Mobile:** remover um comprovante já verificado. | Diálogo avisa que foi verificado por um veterinário e que o arquivo e a verificação ficam guardados no histórico; ao confirmar, o comprovante sai da carteira. |
| 10 | **Web (vet):** em **Vacinas**, tocar em **"Nova vacina"**, preencher e salvar; depois anexar um comprovante (JPEG, PNG, WebP **ou PDF**). | Registro criado assinado com o nome e o CRMV do veterinário. O comprovante enviado por veterinário **já nasce verificado**. |
| 11 | **Mobile (tutor):** abrir a vacina criada pelo veterinário e tentar **editar ou apagar**. | Diálogo "Registro do veterinário" avisa quem registrou; a alteração ou exclusão fica marcada no histórico do pet. |
| 12 | Abrir o link público da carteira (`/#/card/<token>`) do pet. | A carteira mostra as vacinas, mas **não** exibe comprovantes (ADR-013 §7). |

## UC05 — Registrar vermifugação

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** pet cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a seção de **Vermífugos** do pet. | Lista de vermifugações. |
| 2 | Adicionar registro (produto, data, próxima dose). | Registro criado e listado. |
| 3 | Anexar, abrir e remover um comprovante (**"Anexar foto"**, **"Abrir comprovante"**, **"Remover comprovante"**). | Mesmo comportamento do UC04 (passos 4–6): nasce "Aguardando verificação do veterinário"; abre por link temporário. |
| 4 | **Web (vet):** na aba **Vermifugações** do pet, tocar em **"Nova vermifugação"**, salvar, e verificar o comprovante do tutor. | Registro assinado com nome e CRMV; selo "Verificado por …" aparece também no mobile. |

## UC06 — Registrar medicação

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** pet cadastrado.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir a seção de **Medicações** do pet. | Lista de medicações. |
| 2 | Adicionar registro (medicamento, dosagem, período). | Registro criado e listado. |
| 3 | Anexar um comprovante (ex.: foto da receita). | Mesmo comportamento do UC04 (passos 4–6). |
| 4 | **Web (vet):** na aba **Medicações**, tocar em **"Novo medicamento"** (tela "Prescrever medicamento") e salvar. | Medicação criada com o nome do veterinário exibido no registro, visível no mobile do tutor. |

**Observações (UC04–UC06):** cada registro aceita no máximo 10 comprovantes. "Verificado" significa que um profissional identificado, com CRMV, conferiu o documento — não que o documento seja autêntico (ADR-013). O PDF é aceito pela API e pela web; o app mobile só envia imagens da galeria.

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
| 3 | Abrir o link compartilhado em um navegador. | Página pública da carteira (`/#/card/<token>` na web) carrega sem exigir login. |

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
| 1 | Abrir a aba **Agenda** e verificar o cartão de Google Agenda. | Mostra "Google Agenda não conectado" com o botão **"Conectar"**. |
| 2 | Tocar em **"Conectar"**. | Abre o consentimento OAuth do Google no navegador; ao autorizar, o cartão passa a "Google Agenda conectado — novos agendamentos vão direto para a sua agenda". |
| 3 | Criar um agendamento (título, data, hora, pet; no campo **Local**, digitar parte do nome de uma clínica). | Aparecem sugestões de local conforme digita; se não houver, "Nenhum local encontrado. Você pode digitar o endereço mesmo assim." O agendamento é criado ("Agendamento criado com sucesso!") e listado. |
| 4 | Conferir no Google Calendar (após alguns segundos — a sincronização é assíncrona, pela fila `calendar.sync`). | O evento aparece na agenda do usuário. |
| 5 | Editar o horário e depois excluir o agendamento no app. | A edição e a exclusão se refletem no Google Calendar. |
| 6 | Tocar em **"Desconectar"** no cartão do Google Agenda e confirmar. | Status volta a "não conectado"; novos agendamentos deixam de sincronizar. |

**Limitação conhecida:** a sincronização é **unidirecional** (PetCard → Google); a volta (Google → PetCard, PC-065) foi descopada (ADR-002). Tokens OAuth são cifrados em repouso (AES-256-GCM).

## UC13 — Receber alertas (dose e agendamento)

- **Ator/Plataforma:** Tutor · disparo pelo cron da API · **Pré-condição:** device registrado (UC16). Para dose: `DOSE_REMINDER_ENABLED=true` e dose com próxima dose dentro da janela (`DOSE_REMINDER_WINDOW_DAYS`, padrão 3 dias). Para agendamento: `APPOINTMENT_REMINDER_ENABLED=true` e consulta dentro de `APPOINTMENT_REMINDER_WINDOW_HOURS` (padrão 24 h).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Cadastrar vacina/vermífugo com próxima dose dentro da janela (UC04/05) e/ou medicação com início de tratamento na janela (UC06). | Registro com a data na janela. |
| 2 | Cadastrar um agendamento (UC12) para daqui a menos de 24 h. | Agendamento listado na aba **Agenda**. |
| 3 | Aguardar o cron (**todo dia às 9h**, fuso do tutor para formatar as datas). | Um push de lembrete é enfileirado por dose na janela e **um único** push por agendamento (o agendamento é marcado como notificado e não repete). |
| 4 | Reagendar a consulta (UC12, passo 5) e aguardar o próximo ciclo. | Reagendar libera um aviso novo para o novo horário. |
| 5 | Excluir o pet, o registro ou o agendamento antes do ciclo seguinte. | Não há mais lembrete para o item excluído ("limpeza ao excluir") _(confirmar)_. |

**Observações:** não existe endpoint para disparar o cron manualmente; sem esperar as 9h, a evidência alternativa é rodar os testes do módulo (`npx jest src/modules/reminder` em `petcard-api`) e mostrar o resultado, deixando o disparo real para a gravação do dia seguinte (PC-106). O lembrete de agendamento é **único** (uma consulta só ocorre uma vez); o de dose é recorrente a cada janela.

**Limitação conhecida:** o TAP previa alertas **escalonados** (24h/1h/15min). O implementado é **um lembrete por janela** (dose: dias; agendamento: horas), não o escalonamento fino — registrar como atendimento parcial na defesa.

## UC14 — Adicionar nota clínica (escrita reversa)

- **Ator/Plataforma:** Veterinário · Web · **Pré-condição:** vet logado (UC02); carteira de um pet acessível (UC15).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No perfil do pet (acessado via scan/QR ou pela lista "Pets Atendidos"), abrir a aba **Notas Clínicas** e tocar em **"Nova Nota"**. | Formulário "Nova Nota Clínica" (Diagnóstico, Prescrição, Observações). Exige CRMV verificado (ver UC15). |
| 2 | Preencher e salvar a nota. | Nota registrada e associada ao pet, **assinada com o nome e o CRMV do veterinário**; validação de campos na borda. |
| 3 | Na própria nota, tocar em **"Editar"**, alterar e salvar. | Nota atualizada; a edição aparece no histórico. |
| 4 | Abrir a aba **Histórico**. | Linha do tempo imutável ("Registro imutável: inclui o que foi excluído da carteira e quem realizou cada ação"), com "Registrado"/"Editado" e o autor. |
| 5 | Como **tutor** (mobile), abrir o pet. | A nota do veterinário aparece no histórico do pet (escrita reversa), com nome e CRMV de quem a escreveu. No detalhe do pet, **"Histórico clínico"** lista as ações ("Registrado por…", "Alterado por…"). |
| 6 | Como **vet**, apagar um registro (nota, vacina etc.) com **"Apagar"** e confirmar. | O registro sai da carteira do tutor, mas **permanece no histórico clínico** marcado como excluído (nada clínico se apaga). |
| 7 | (Opcional, destrutivo — usar um veterinário descartável do UC01) Escrever uma nota, depois excluir a conta do veterinário. | A nota **continua** na carteira, assinada com o nome e o CRMV gravados, sem botão de editar/excluir (nota órfã é imutável — ADR-009). |

**Observações:** o vet só escreve em pet com o qual tem vínculo (ler o QR cria o vínculo `PetAtendido`); a verificação de propriedade/escopo foi endurecida na auditoria de M5 e a trilha de ações clínicas veio com a api#117. O vet pode **tirar um pet da lista** ("Tirar {pet} da lista"): isso só remove o vínculo da lista, o histórico continua guardado e ler o QR de novo traz o pet de volta.

## UC15 — Acessar carteira via QR Code

- **Ator/Plataforma:** Veterinário · Web · **Pré-condição:** vet logado; um QR/token de carteira (do UC07).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No dashboard, abrir **Escanear** (VetScan). | Ativa a câmera/scanner (`html5-qrcode`). |
| 2 | Escanear o QR da carteira do pet. | Token extraído (aceita URL da carteira ou UUID cru) e o perfil do pet é aberto. |
| 3 | (Alternativa sem câmera) Abrir `/#/card/<token>` (ou `/#/<token>`) diretamente, **sem login**. | Página pública da carteira carrega em modo somente-leitura, mostrando identificação, **vacinas e vermifugações**. **Medicações e notas clínicas não aparecem** (dado de saúde sensível — api#114). |
| 4 | Na página pública, observar o convite **"É veterinário? Entre para ver o histórico clínico completo deste pet."** e tocar em **"Sou veterinário"**, logado como `camila.ferreira@vet.example.com` (CRMV verificado). | Abre o prontuário completo do pet (medicações e notas clínicas incluídas), e o pet entra em "Pets Atendidos". |
| 5 | Repetir o passo 4 logado como `marcos.andrade@vet.example.com` (CRMV `00000`, recusado). | Mensagem "Seu CRMV precisa estar verificado para acessar dados clínicos."; o painel mostra "CRMV não verificado" com **"Verificar meu CRMV"**. Ao verificar, o stub recusa ("O registro não foi aceito") e oferece **"Corrigir meu CRMV"** _(confirmar)_. |
| 6 | Em "Corrigir meu CRMV", trocar para `CRMV-SP 12345` e **"Salvar e verificar"**. | Verificação aceita; o acesso clínico é liberado (a verificação vale `CRMV_TTL_DAYS`, padrão 180 dias) _(confirmar)_. _Restaurar o seed depois._ |
| 7 | Sem login, abrir `GET /cards/:token/clinico` (ex.: no Swagger ou navegador). | Recusado (401/403): só veterinário com CRMV verificado vê o extra clínico (ADR-005). |

**Observações:** a rota pública `GET /cards/:token` tem _rate-limit_ (throttle) configurável. O QR **não** é trancado: quem tem o link vê o essencial (leitura de emergência); é o registro profissional que abre o dado sensível (ADR-005). Se `camila.ferreira` aparecer sem CRMV verificado, use **"Verificar meu CRMV"** antes do passo 4.

## UC16 — Receber notificações push

- **Ator/Plataforma:** Tutor · Mobile · **Pré-condição:** dispositivo **físico**; `FCM_ENABLED=true` + credenciais Firebase; permissão de notificação concedida.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Logar no app e conceder permissão de notificações. | Device token registrado no backend (`/devices`). |
| 2 | Disparar um evento que gera push (ex.: lembrete de dose — UC13). | Notificação recebida no dispositivo (banner/lista). |

**Limitação conhecida:** com `FCM_ENABLED=false` (default de dev) o envio é _no-op_; testar push exige o toggle ligado, credenciais válidas e **dispositivo físico** (o emulador não recebe FCM real). Para a demo, gravar o vídeo de backup (PC-106) deste fluxo.

---

## Funcionalidades extras (fora dos 16 UCs)

Funcionalidades entregues depois do DAS, que não são um UC numerado mas aparecem na demonstração. Mesmo formato dos UCs.

## X01 — QR da coleira (pet perdido)

- **Ator/Plataforma:** Tutor · Mobile; quem achou o pet · Web (sem login) · **Pré-condição:** pet cadastrado; RabbitMQ no ar (a geração do QR é assíncrona).

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | No detalhe do pet, abrir **"QR da coleira"**. Se ainda não existe, tocar em **"Gerar QR da coleira"**. | "Geração solicitada"; em poucos segundos o QR aparece. É um QR **diferente** do da carteira digital (UC07). |
| 2 | Tocar em **"Compartilhar"**. | Share sheet com a mensagem "Encontrou {pet}? Abra este link para falar comigo: …". |
| 3 | Abrir o link (`/#/achei/<token>`) em um navegador, **sem login**. | Página "Você encontrou {pet}!" com o nome do tutor e o botão **"Ligar para {telefone}"** (ou aviso de que o tutor não cadastrou telefone) e os passos "O que fazer agora". |
| 4 | Conceder a localização quando o navegador pedir. | "Pronto! {pet} recebeu um aviso com a sua localização." |
| 5 | Repetir o passo 3 negando a localização. | A página avisa que o tutor foi notificado, mas sem a localização, e oferece **"Compartilhar minha localização"**. |
| 6 | **Mobile:** observar as notificações do tutor e abrir o pet → **"Onde encontraram"**. | O tutor recebe o aviso de que alguém leu a coleira (push, se UC16 estiver habilitado). A lista mostra "QR da coleira lido", com **"Abrir no mapa"** e a precisão (ou "Quem encontrou não compartilhou a localização."). |
| 7 | Abrir um token inexistente (`/#/achei/xxxx`). | "Coleira não encontrada". |

## X02 — Perfil do tutor e exclusão de conta

- **Ator/Plataforma:** Tutor · Mobile.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Aba **Perfil**, tocar em editar; trocar nome, telefone e foto; **"Salvar"**. | "Perfil atualizado com sucesso!" |
| 2 | Trocar o **idioma** (Português/English). | Textos do app mudam de idioma. |
| 3 | (Conta descartável do UC01) **"Excluir conta"** → "Continuar" → "Excluir definitivamente". | A conta e **todos os pets, o prontuário e a carteira** são excluídos de forma permanente (os anexos ficam órfãos no bucket — limitação conhecida, ADR-013); o usuário volta ao login e não consegue mais logar. |

## X03 — Perfil do veterinário (web)

- **Ator/Plataforma:** Veterinário · Web.

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir `/#/vet/profile`, editar nome, CRMV, e-mail e telefone e salvar. | Volta à visualização com mensagem de sucesso. |
| 2 | No painel `/#/vet/dashboard`, buscar um pet por nome do pet ou do tutor e paginar a lista. | "Pets Atendidos" filtra e pagina; o link **"Escanear QR"** abre o leitor (UC15). |
| 3 | **"Tirar {pet} da lista"** e confirmar. | O pet some da lista; o histórico clínico é mantido e ler o QR de novo o traz de volta. |

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
| X01 | ⬜ | |
| X02 | ⬜ | |
| X03 | ⬜ | |

**Resumo da rodada:** `___ / 16` ✅ (UCs) · `___ / 3` ✅ (extras) · pendências: `____________`
