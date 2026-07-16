# Documento de Arquitetura de Software

## PetCard — Ecossistema Digital de Saúde Pet

```
Código: PC-2026-TCC | Versão 2.
Modelo de Visão Arquitetural 4+1 de Kruchten
Autores: Álvaro Araújo | Camila Martins | Ricardo Temporal
Data: 17/03/
```

## Histórico de Revisão

```
Data Demanda Autor Descrição Versão
17/03/2026 AA000001 Álvaro, Ricardo e Camila Criação do documento 1.
24/03/2026 AA000002 Equipe PetCard Preenchimento
completo de todas as
visões
```
#### 2.


## Sumário

- 1. Introdução
   - 1.1 Finalidade
   - 1.2 Escopo
   - 1.3 Definições, Acrônimos e Abreviações
   - 1.4 Referências
- 2. Representação Arquitetural
- 3. Requisitos e Restrições Arquiteturais
- 4. Visão de Casos de Uso
   - 4.1 Casos de Uso Significantes para a Arquitetura
- 5. Visão Lógica
   - 5.1 Visão Geral — Arquitetura em Camadas
   - 5.2 Diagrama de Pacotes
- 6. Visão de Implementação
   - 6.1 Diagrama de Classes
   - 6.2 Diagrama de Sequência — UC07 + UC15
- 7. Visão de Implantação
   - 7.1 Topologia de Rede
- 8. Projeto de Banco de Dados
   - 8.1 Modelo Conceitual
   - 8.2 Modelo Lógico
      - 8.2.1 Dicionário de Dados Resumido


## 1. Introdução

### 1.1 Finalidade

Este documento fornece uma visão arquitetural abrangente do sistema PetCard, utilizando o
modelo de visão "4+1" de Kruchten [KRU41] para representar diferentes aspectos do sistema.
O objetivo é capturar e comunicar as decisões arquiteturais significativas, servindo como
referência técnica para a equipe de desenvolvimento e como artefato acadêmico do TCC de
Ciência da Computação.

### 1.2 Escopo

Este documento aplica-se ao ecossistema PetCard, desenvolvido pela equipe Álvaro Araújo,
Camila Martins e Ricardo Temporal. O escopo abrange o aplicativo móvel para tutores (React
Native), a interface web responsiva para médicos veterinários (React.js) e a infraestrutura de
backend em nuvem (NestJS + AWS). Ficam excluídos deste escopo módulos de e-commerce,
pagamentos financeiros, rede social e sistemas de gestão administrativa para clínicas.

### 1.3 Definições, Acrônimos e Abreviações

```
Sigla Descrição
JWT JSON Web Token — Padrão aberto (RFC 7519) para autenticação segura entre
partes.
QoS Quality of Service — Conjunto de requisitos não-funcionais como performance e
disponibilidade.
API Application Programming Interface — Interface de comunicação entre frontend e
servidor.
PostGIS Extensão espacial para PostgreSQL, utilizada para cálculos de geolocalização.
ORM Object-Relational Mapping — Técnica de mapeamento objeto-relacional (Prisma).
DTO Data Transfer Object — Objeto para transferência de dados entre camadas.
CRMV Conselho Regional de Medicina Veterinária — Registro profissional do veterinário.
FCM Firebase Cloud Messaging — Serviço de notificações push do Google.
ECS Elastic Container Service — Serviço de orquestração de contêineres da AWS.
SPA Single Page Application — Aplicação web de página única.
```
### 1.4 Referências

[KRU41] KRUCHTEN, P. The "4+1" View Model of Software Architecture. IEEE Software, v. 12,
n. 6, p. 42-50, Nov. 1995.
[PRISMA] Prisma ORM Documentation. Disponível em: https://www.prisma.io/docs
[NESTJS] NestJS Framework Documentation. Disponível em: https://docs.nestjs.com
[POSTGIS] PostGIS Spatial Database Extension. Disponível em:
https://postgis.net/documentation/


## 2. Representação Arquitetural

A arquitetura do PetCard segue o modelo "4+1" de Kruchten [KRU41], acrescido da Visão de
Dados. As visões utilizadas neste documento são detalhadas na tabela a seguir:
**Visão Público Área Artefatos
Lógica** Analistas Realização dos Casos de
Uso
Diagrama de Classes, Diagrama de
Sequência
**Processo** Integradores Performance,
Escalabilidade, Concorrência
Diagrama de Atividades, Fluxos
Assíncronos (RabbitMQ)
**Implementaçã
o**
Programador
es
Componentes de Software Diagrama de Pacotes, Organização
de Módulos
**Implantação** Gerência de
Configuraçã
o
Nodos físicos Diagrama de Implantação, Topologia
AWS
**Caso de Uso** Todos Requisitos funcionais Diagrama de Casos de Uso
**Dados** DBA /
Especialistas
Persistência de dados MER Conceitual, Modelo Lógico
Relacional


## 3. Requisitos e Restrições Arquiteturais

Esta seção descreve os requisitos de software e restrições que têm impacto significante na
arquitetura do PetCard.
**Requisito Solução Adotada
Linguagem** TypeScript (v5.x) no Frontend e Backend, garantindo tipagem estática,
segurança de código e compartilhamento de tipos via pacote petcard-shared.
**Framework Backend** NestJS 11 sobre Node.js 20 LTS, com arquitetura modular baseada em
Dependency Injection e decorators, facilitando testes unitários e separação de
responsabilidades.
**Framework Frontend** React Native 0.74 (móvel) e React.js 18 + Vite 5 (web veterinário).
Compartilham hooks e lógica de negócio via pacote shared.
**Plataforma** Backend executado em containers Docker no Amazon ECS (Fargate).
Frontend web hospedado na Vercel com CDN global. App móvel distribuído
via Google Play e App Store.
**Segurança** Autenticação e autorização via JWT próprio (HS256), com senhas em
bcrypt. O provedor Auth0/OAuth 2.0 previsto originalmente foi abandonado
em M0 (ver ADR-003): a equipe optou por JWT próprio, sem dependência de
SaaS de identidade. Comunicação via HTTPS com TLS 1.3. Criptografia de
dados sensíveis em repouso com AES-256-GCM (tokens OAuth do Google
Calendar; ver ADR-002 #4). Conformidade com LGPD.
**Persistência** Banco de dados relacional PostgreSQL 16 (AWS RDS Multi-AZ) com
extensão PostGIS 3.4 para consultas geoespaciais. Redis 7 está
provisionado na infraestrutura (docker-compose / ElastiCache), porém
ainda não é consumido em código — não há camada de cache nem sessões em
Redis (o JWT é stateless). Mantido como capacidade reservada.
**Processamento
Assíncrono**
Filas de trabalho com RabbitMQ (DLX/DLQ + retry) para envio de
notificações push, sincronização com Google Calendar e geração de QR
Codes. Workers isolados em containers dedicados.
**Internacionalização
(i18n)**
Suporte a Português (pt-BR) e Inglês (en-US) utilizando i18next, com
detecção automática pelo navegador/dispositivo.
**ORM** Prisma ORM para TypeScript, com migrations versionadas, type-safety
automático e suporte a PostGIS via extensão prisma-postgis.
**Armazenamento de
Arquivos**
AWS S3 para imagens de pets, fotos de perfil e QR Codes gerados. URLs
pré-assinadas com validade de 1 hora para upload seguro.


## 4. Visão de Casos de Uso

Esta seção lista os casos de uso centrais e significantes para a arquitetura do PetCard,
organizados por ator primário.
**ID Caso de Uso Ator Primário
UC01** Cadastrar-se no sistema Tutor
**UC02** Autenticar-se (Login) Tutor / Veterinário
**UC03** Cadastrar Pet Tutor
**UC04** Registrar Vacina Tutor / Veterinário
**UC05** Registrar Vermifugação Tutor
**UC06** Registrar Medicação Tutor
**UC07** Gerar QR Code (Carteira Digital) Tutor
**UC08** Compartilhar Link Exclusivo Tutor
**UC09** Buscar Clínicas por Geolocalização Tutor
**UC10** Filtrar Clínicas Tutor
**UC11** Realizar Chamada Direta para Clínica Tutor
**UC12** Sincronizar com Google Calendar Tutor
**UC13** Receber Alertas Escalonados Tutor
**UC14** Adicionar Nota Clínica (Escrita Reversa) Veterinário
**UC15** Acessar Carteira via QR Code Veterinário
**UC16** Receber Notificações Push Tutor

### 4.1 Casos de Uso Significantes para a Arquitetura

O diagrama de casos de uso a seguir apresenta os casos mais significativos do ponto de vista
arquitetural, com destaque para os fluxos de geração de carteira digital (UC07), escrita reversa
pelo veterinário (UC14), geolocalização de clínicas (UC09) e integração com Google Calendar
(UC12). Os atores externos (Google Calendar API e Google Maps API) estão representados
com linhas tracejadas.


_Figura 1 — Diagrama de Casos de Uso do PetCard_


## 5. Visão Lógica

A visão lógica descreve a organização estrutural do sistema em camadas, pacotes e classes,
revelando como os componentes colaboram para realizar os casos de uso definidos na seção
anterior.

### 5.1 Visão Geral — Arquitetura em Camadas

O PetCard adota uma arquitetura em 5 camadas, seguindo o princípio de separação de
responsabilidades. Cada camada só se comunica com a camada imediatamente inferior,
garantindo baixo acoplamento e alta coesão.
**Camada Componentes
Apresentação** App Mobile (React Native), Interface Web (React.js + Vite), Página Pública da
Carteira Digital, i18next para internacionalização.
**API / Roteamento** API RESTful (NestJS + Express), Middleware de Autenticação (JWT
próprio + Passport), HTTPS / TLS 1.3, Rate Limiting.
**Negócio / Serviços** PetService, HealthService, CardService, GeoService, NotificationService,
CalendarService, VetNoteService, QueueService (RabbitMQ).
**Acesso a Dados** Prisma ORM (TypeScript), Repository Pattern com Data Mappers. A Cache
Layer (Redis Client) estava prevista, mas não foi implementada (sem uso
de Redis no código).
**Infraestrutura** PostgreSQL 16 + PostGIS (AWS RDS), Redis 7 (ElastiCache, provisionado e
não utilizado), AWS S3 (Imagens/QR), AWS ECS Fargate (Containers Docker).


```
Figura 2 — Diagrama de Camadas da Arquitetura PetCard
```
### 5.2 Diagrama de Pacotes

O sistema é organizado em 4 pacotes principais: petcard-mobile (app do tutor), petcard-web
(interface do veterinário), petcard-api (backend NestJS com módulos de domínio) e
petcard-shared (DTOs, tipos e enums compartilhados). Há ainda o petcard-docs (ADRs e
documentação), fora do diagrama original. O pacote petcard-infra (Docker + Terraform para
provisionamento AWS) foi previsto neste DAS, mas não chegou a ser criado: a
infraestrutura local é provida por um docker-compose dentro de petcard-api, e não há IaC
(Terraform) — o deploy AWS permanece não automatizado.


_Figura 3 — Diagrama de Pacotes do PetCard_

> **Nota sobre o contrato compartilhado (petcard-shared).** O pacote é o contrato único
> de DTOs/tipos do ecossistema, publicado no GitHub Packages e alinhado em `^0.9.0` por
> api, web e mobile. Os DTOs do módulo veterinário/nota clínica (M5), que durante a reta
> final da Parte 1 tinham cópia local na `petcard-api`/`petcard-web`, foram **convergidos
> para o shared** (pós-defesa da Parte 1): a API consome `CreateVeterinarioDto`,
> `UpdateVeterinarioDto`, `CreateNotaClinicaDto` e `NotaClinicaResponseDto`, e a web
> consome `CreateNotaClinicaDto`. Permanecem locais apenas os tipos sem equivalente no
> contrato: `DashboardQueryDto` (consulta específica da API), `VeterinarioResponse`
> (`Omit` do tipo Prisma) e os *view models* de resposta da web (subconjuntos em
> snake_case com datas como `string`).


## 6. Visão de Implementação

Esta seção detalha a realização dos casos de uso mais significativos por meio de diagramas de
classes e sequência, evidenciando as interações dinâmicas entre os componentes do sistema.

### 6.1 Diagrama de Classes

O diagrama de classes apresenta as 10 entidades principais do domínio PetCard e seus
relacionamentos. As classes centrais são Tutor, Pet e CarteiraDigital, que formam o núcleo da
Identidade Médica Dinâmica. As classes de saúde (RegistroVacina, Vermifugacao, Medicacao)
e de comunicação (NotaClinica, Notificacao) estendem o ecossistema. A classe Clinica
incorpora o tipo Geography do PostGIS para buscas geoespaciais.
_Figura 4 — Diagrama de Classes do Domínio PetCard_

### 6.2 Diagrama de Sequência — UC07 + UC15

O diagrama de sequência ilustra dois fluxos arquiteturalmente significativos em um único
cenário: (1) o tutor solicita a geração da carteira digital, que percorre Frontend → API Gateway
→ CardService → PostgreSQL → AWS S3; e (2) o veterinário escaneia o QR Code gerado,
acessando a rota pública que retorna o histórico médico completo do pet sem necessidade de
login.


_Figura 5 — Diagrama de Sequência: Geração de Carteira Digital e Acesso Veterinário_


## 7. Visão de Implantação

A visão de implantação descreve a topologia física do sistema, mapeando artefatos de software
para nodos de infraestrutura. O PetCard opera sobre a infraestrutura AWS, organizada em uma
VPC com subnets pública e privada.

### 7.1 Topologia de Rede

```
Nodo Ambiente Artefato Descrição
Smartphone do
Tutor
Android/iOS petcard-mobile.apk (React
Native)
Dispositivo do usuário final
Browser do
Veterinário
Web Browser petcard-web SPA (React.js) Acesso via navegador
moderno
Vercel CDN Cloud (Vercel) Static Assets + SSR Hospedagem do frontend
web com CDN global
Application Load
Balancer
AWS (Subnet
Pública)
HTTPS:443 → TLS 1.3 Balanceamento de carga e
terminação SSL
AWS ECS Fargate AWS (Subnet
Pública)
petcard-api:latest +
petcard-worker:latest
Containers Docker com
auto-scaling
AWS RDS AWS (Subnet
Privada)
PostgreSQL 16 + PostGIS
3.
Banco relacional Multi-AZ
com backup automático
AWS ElastiCache AWS (Subnet
Privada)
Redis 7 (Cluster Mode) Previsto para cache/sessões,
não utilizado no código
AWS S3 AWS Bucket petcard-assets Imagens de pets, QR
Codes, fotos de perfil
Auth0 Externo (SaaS) OAuth 2.0 / JWT Provider Previsto, abandonado em M0
(ADR-003) — auth é JWT próprio
Google Calendar
API
Externo
(Google)
REST API v3 Sincronização de agendas e
alertas escalonados
Google Maps API Externo
(Google)
Geocoding + Places Geolocalização de clínicas
Firebase Cloud
Messaging
Externo
(Google)
FCM v1 API Notificações push para
Android e iOS
```

_Figura 6 — Diagrama de Implantação do PetCard na AWS_


## 8. Projeto de Banco de Dados

O banco de dados do PetCard utiliza PostgreSQL 16 com a extensão PostGIS 3.4 para suporte
a dados geoespaciais. O modelo foi projetado para garantir integridade referencial,
normalização (3FN) e performance em consultas frequentes.

### 8.1 Modelo Conceitual

O Modelo Entidade-Relacionamento (MER) conceitual identifica 10 entidades principais e seus
relacionamentos sem especificação de tipos de dados. Os relacionamentos centrais são: um
Tutor possui N Pets; cada Pet gera uma única Carteira Digital; um Pet recebe N Vacinas, N
Vermifugações e N Medicações; um Veterinário escreve N Notas Clínicas; uma Clínica realiza
N Agendamentos; e cada Agendamento dispara N Notificações.
_Figura 7 — Modelo Conceitual (MER) do PetCard_

### 8.2 Modelo Lógico

O modelo lógico relacional detalha as tabelas com tipos de dados PostgreSQL, chaves
primárias (UUID v4), chaves estrangeiras, índices e constraints. Destaca-se o uso do tipo
GEOGRAPHY(Point, 4326) na tabela clinica para armazenamento de coordenadas compatíveis
com PostGIS, o tipo JSONB para dados flexíveis (horário de funcionamento, dados extras de
notificações) e o tipo TEXT[] (array) para especialidades de clínicas.
**8.2.1 Dicionário de Dados Resumido
Tabela Descrição Campos Principais
tutor** Dados cadastrais do tutor
(dono do pet)
id, nome, email, senha_hash, telefone, foto_url,
created_at, updated_at
**pet** Informações do animal de
estimação
id, tutor_id (FK), nome, especie, raca,
data_nascimento, peso, sexo, foto_url, created_at
**carteira_digita
l**
Identidade Médica Dinâmica
do pet
id, pet_id (FK UNIQUE), qr_code_url,
link_exclusivo (UQ), token_acesso (UQ), ativa,
created_at
**veterinario** Dados do profissional
veterinário
id, nome, email (UQ), senha_hash, crmv (UQ),
especialidade, foto_url, created_at


**registro_vacin
a**
Histórico de vacinações do pet id, pet_id (FK), veterinario_id (FK), nome_vacina,
fabricante, lote, data_aplicacao, data_proxima,
observacoes, created_at
**vermifugacao** Histórico de vermifugações id, pet_id (FK), veterinario_id (FK), medicamento,
data_aplicacao, data_proxima, peso_no_dia,
observacoes, created_at
**medicacao** Tratamentos medicamentosos
ativos
id, pet_id (FK), veterinario_id (FK), nome,
dosagem, frequencia, data_inicio, data_fim,
observacoes, created_at
**nota_clinica** Anotações do veterinário
(escrita reversa)
id, pet_id (FK), veterinario_id (FK), descricao,
diagnostico, prescricao, created_at
**clinica** Estabelecimentos veterinários
geolocalizados
id, nome, endereco, telefone, latitude, longitude,
localizacao (GEOGRAPHY),
horario_funcionamento (JSONB), especialidades
(TEXT[]), avaliacao_media, created_at
**agendamento** Consultas e procedimentos
agendados
id, pet_id (FK), clinica_id (FK), veterinario_id (FK),
data_hora, tipo, status, google_event_id,
created_at
**notificacao** Alertas e lembretes enviados
ao tutor
id, tutor_id (FK), tipo, titulo, mensagem, lida,
dados_extras (JSONB), created_at
_Figura 8 — Modelo Lógico Relacional do PetCard_


