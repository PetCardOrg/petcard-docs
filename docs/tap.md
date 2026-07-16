# PetCard

# Controle de Versões

# Versão Data Autor Notas da Revisão

## 2.0 26/02/

```
Álvaro Araújo, Camila
Martins e Ricardo
Temporal
Criação de requisitos e escolha de stakeholders.
1 Objetivos deste documento
Autorizar o início do projeto, atribuir principais responsáveis e documentar requisitos iniciais,
principais entregas, premissas e restrições.
2 Identificação do Projeto
Nome do Projeto : PetCard
Código do Projeto : PC-2026-TCC
3 Objetivos
Descrição Geral: Desenvolvimento de uma plataforma móvel centralizadora para a gestão
inteligente da saúde de animais de estimação, resolvendo a fragmentação do histórico médico
e a baixa aderência a tratamentos preventivos. O projeto visa transformar a experiência do tutor
e do veterinário através de uma "Carteira Digital" que facilita o acesso a informações em tempo
real.
Metas e Objetivos:
● Implementar uma carteira de saúde digital (PetCard) acessível via QR Code ou link,
permitindo o compartilhamento instantâneo do histórico médico completo do pet.
● Integrar funcionalidades de geolocalização para busca, filtragem e contato direto com
clínicas veterinárias próximas à localização do tutor.
● Estabelecer um canal de comunicação bidirecional onde médicos veterinários possam
adicionar notas e observações clínicas diretamente ao perfil do animal, notificando o
tutor instantaneamente.
● Sincronizar a agenda de consultas do aplicativo com o Google Calendar,
implementando um sistema de notificações escalonadas (24h, 1h e 15min antes do
evento).
● Alcançar um alto nível de automação em lembretes de vacinação, vermifugação e
medicações para garantir a saúde preventiva do animal.
4 Escopo do Projeto
O escopo deste projeto compreende o desenvolvimento integral de uma solução
multiplataforma composta por um aplicativo móvel para tutores e uma interface web responsiva
dedicada aos profissionais veterinários. O desenvolvimento do aplicativo móvel foca na
centralização da jornada de saúde do animal, permitindo o registro e monitoramento rigoroso
de protocolos de imunização, tratamentos antiparasitários e cronogramas medicamentosos.
Para viabilizar a portabilidade e o acesso ágil a essas informações, será implementado o
sistema de Identidade Médica Dinâmica, que gera uma carteira digital acessível via QR Code
ou link exclusivo. A escolha por uma interface web simplificada para o acesso veterinário
justifica-se pela necessidade técnica de reduzir a fricção na adoção da ferramenta pelo
```
# Termo de Abertura do Projeto Página 1 de 6


# PetCard

```
profissional, permitindo que este realize anotações clínicas e prescrições sem a
obrigatoriedade de instalação de software adicional, garantindo que o tutor receba atualizações
via notificações push em tempo real. Adicionalmente, o sistema incorporará inteligência
geográfica através da integração com APIs de mapas para localizar e filtrar centros de
atendimento próximos, priorizando a agilidade em cenários de emergência. A gestão de
compromissos será assegurada por uma integração técnica com o ecossistema do Google
Calendar, permitindo a sincronização de agendas e o disparo de alertas escalonados,
funcionalidade essencial para mitigar o risco de esquecimento de consultas críticas. Ficam
explicitamente excluídos deste escopo o desenvolvimento de módulos de transação comercial
(e-commerce), intermediação de pagamentos financeiros, funcionalidades de interação social
entre usuários e sistemas complexos de gestão administrativa ou financeira para clínicas
veterinárias.
5 Justificativa do Projeto
A relevância do PetCard fundamenta-se na latente ineficiência dos métodos tradicionais de
registro de saúde animal, que se baseia majoritariamente em documentos físicos suscetíveis a
perdas e danos. Essa fragmentação da informação médica não apenas dificulta o trabalho do
veterinário em situações de urgência, mas também compromete a continuidade de tratamentos
preventivos essenciais. O projeto propõe solucionar o problema da negligência involuntária dos
tutores, oferecendo automação e inteligência em lembretes, o que impacta diretamente na
longevidade e bem-estar dos animais de estimação. Ao centralizar dados médicos,
agendamentos e localização de serviços em uma única interface, o PetCard otimiza o tempo de
resposta em emergências e promove uma gestão de saúde proativa. Do ponto de vista
acadêmico e profissional, o desenvolvimento desta solução justifica-se pelo desafio técnico de
integrar diversos ecossistemas tecnológicos, como geolocalização e serviços de agenda
externa, proporcionando à equipe a oportunidade de aplicar conceitos complexos de
engenharia de software em um produto com viabilidade comercial e forte impacto social no
setor pet.
6 Principais requisitos das principais entregas/produtos
Requisitos Funcionais (RF):
● RF01: O sistema deve permitir a gestão completa de prontuários médicos, incluindo
registros detalhados de vacinas, vermifugação e medicações preventivas.
● RF02: O aplicativo deve gerar uma "Carteira Digital" acessível via QR Code ou link
dinâmico para compartilhamento instantâneo.
● RF03: Deve existir uma interface web simplificada para veterinários (acessada via link
do QR Code) com permissão para adicionar notas e observações de atendimento.
● RF04: O sistema deve integrar serviços de geolocalização para busca e filtragem de
clínicas veterinárias próximas à posição atual do tutor.
● RF05: O aplicativo deve permitir a realização de chamadas telefônicas diretas para as
clínicas listadas através da interface do mapa.
● RF06: O sistema deve sincronizar agendamentos de consultas com o Google Calendar
do tutor.
```
# Termo de Abertura do Projeto Página 2 de 6


# PetCard

```
● RF07: O aplicativo deve disparar notificações push escalonadas para lembretes de
consultas.
● RF08: A busca por clínicas deve incluir filtros.
● RF09: O tutor deve conseguir realizar o upload e armazenamento de fotos de receitas
médicas e resultados de exames diretamente no prontuário do pet.
● RF10: O sistema deve permitir traçar rotas de navegação para a clínica selecionada
através de integração com aplicativos externos (Google Maps/Waze).
● RF11: O aplicativo deve suportar o cadastro e a gestão individual de múltiplos perfis de
pets para um mesmo tutor.
● RF12: Deve ser possível exportar a carteira digital de saúde em formato PDF para fins
de impressão ou comprovação em viagens.
● RF13: O sistema deve manter um log (histórico) cronológico imutável de todas as
observações clínicas adicionadas por médicos veterinários.
● RF14: O tutor deve poder gerenciar seus dados de perfil e informações de contato de
emergência.
● RF15: O aplicativo deve permitir a visualização offline dos dados básicos da carteira de
vacinação já sincronizados anteriormente.
Requisitos Não Funcionais (RNF):
● RNF01: A interface do usuário (UI) deve ser intuitiva, priorizando a facilidade de
navegação e acessibilidade.
● RNF02: O acesso via QR Code deve ser protegido por tokens de sessão temporários
para garantir a privacidade dos dados.
● RNF03: A integração com APIs de mapas deve garantir baixa latência, retornando
resultados de busca em menos de 2 segundos.
● RNF04: O sistema deve garantir a persistência e integridade dos dados históricos
através de backups automatizados.
● RNF05: A arquitetura do backend deve ser escalável para suportar o crescimento
simultâneo de milhares de perfis de pets.
● RNF06: A interface web para veterinários deve ser totalmente responsiva para
funcionar corretamente em tablets e smartphones.
● RNF07: O sistema deve manter um índice de disponibilidade (uptime) superior a 99,5%
para garantir o acesso em emergências.
● RNF08: O ambiente de desenvolvimento deve ser portável e orquestrado via
containers (Docker) para facilitar o deploy.
● RNF09: O sistema deve utilizar comunicação criptografada (HTTPS/TLS) para todas as
transações de dados entre cliente e servidor.
● RNF10: O processamento de notificações e sincronismo com o Google Calendar deve
ocorrer de forma assíncrona para não comprometer a performance do app.
```
# Termo de Abertura do Projeto Página 3 de 6


# PetCard

```
7 Cronograma Resumido
Fase ou Grupo
de Processos Marcos^ Previsão^
Iniciação Projeto Aprovado Semana 01
Planejamento Plano de Gerenciamento de Projetos Aprovado Semana 03
Sprint 1 Fundamentação e Infraestrutura: Definição da UI/UX ( RNF01 )
e configuração do ambiente orquestrado com Docker ( RNF08 ).
Semana 05
Sprint 2 Core do PetCard: Cadastro de pets ( RF11 ), prontuário médico
( RF01 ), perfil do tutor ( RF14 ) e exportação de PDF ( RF12 ).
Semana 07
Sprint 3 Identidade Digital e Segurança: Geração de QR Code ( RF02 ),
interface web para veterinários ( RF03 ), logs clínicos ( RF13 ) e
implementação de segurança HTTPS/TLS ( RNF09 ), Sessão
Temporária ( RNF02 ) e Responsividade ( RNF06 ).
Semana 09
Sprint 4 Geolocalização e Serviços: Busca de clínicas ( RF04 ),
chamadas diretas ( RF05 ), filtros de plantão ( RF08 ) e integração
com rotas ( RF10 ). Foco em baixa latência ( RNF03 ). Semana^11
Sprint 5 Integrações e Notificações: Sincronização com Google
Calendar ( RF06 ), notificações push escalonadas ( RF07 ) e modo
offline ( RF15 ). Ajustes de Processamento Assíncrono ( RNF10 ),
Backups ( RNF04 ), Escalabilidade ( RNF05 ) e Uptime ( RNF07 ).
Semana 13
Artigo científico Entrega validada Semana 14
Apresentação
final
```
Projeto Entregue e Encerrado (^) Semana 15
Contrato Encerrado

# Termo de Abertura do Projeto Página 4 de 6


# PetCard

```
8 Partes interessadas do projeto (Stakeholders)
```
# Patrocinador: Professor Orientador (Responsável pela validação acadêmica, orientação

# técnica e aprovação das fases do projeto).

# Equipe do Projeto:

# ● Álvaro Araújo: Gerente de Projeto e Desenvolvedor Backend (Responsável pela

# coordenação geral, arquitetura de sistemas e integração de APIs).

# ● Camila Martins: Designer UI/UX e Desenvolvedora Frontend (Responsável pela

# interface do usuário, usabilidade do app e experiência da carteira digital).

# ● Ricardo Temporal: Engenheiro de Software e DBA (Responsável pela modelagem do

# banco de dados, segurança da informação e implementação de notificações).

# Outros Stakeholders:

# ● Tutores de Pets: Usuários finais que utilizam o app para gestão de saúde e

# geolocalização.

# ● Médicos Veterinários: Usuários da interface web que inserem notas clínicas via QR

# Code.

# ● Instituição de Ensino: Entidade que avalia o rigor técnico e a entrega do projeto final.

```
Empresa Participante Função
Universidade Professor Orientador Patrocinador / Orientador
Equipe PetCard Álvaro Araújo Gerente de Projeto /
Backend
Equipe PetCard Camila Martins UI/UX Designer / Frontend
Equipe PetCard Ricardo Temporal Engenheiro de Software /
DBA
Clínicas Pet Médicos Veterinários Usuários Externos
(Feedback Clínico)
Mercado Pet Tutores Clientes Finais (Usuários do
App)
9 Restrições
[Relacione as restrições do projeto, ou seja, limitação aplicável ao projeto, a qual afetará seu
desempenho. Limitações reais: orçamento, recursos, tempo de alocação, ... Ex.: Orçamento de
R$1.500.000,00]
10 Riscos
[Descreva os principais riscos do projeto. ]
[Principais Riscos: Identifique os riscos mais relevantes que podem afetar o projeto.
Plano de Mitigação: Esboce as estratégias para minimizar esses riscos.]
```
# Termo de Abertura do Projeto Página 5 de 6


# PetCard

```
11 Critérios de Sucesso
[Indicadores de Sucesso: Defina como o sucesso do projeto será medido.
Critérios de Aceitação: Especifique os critérios que devem ser atendidos para que o projeto
seja considerado concluído com êxito.]
```
# Aprovações

# Participante Assinatura Data

```
Patrocinador do Projeto
Gerente do Projeto
```
# Termo de Abertura do Projeto Página 6 de 6


