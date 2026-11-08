# Evidências dos requisitos — PetCard

Testes executados de 06 a 08/11/2026 no ambiente de produção (app iOS, web na Vercel e API no Render). E-mail e telefone do tutor cobertos com tarja preta nos prints.

| **Código** | **Requisito (resumo)**                                    | **Classificação** | **Evidência**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|------------|-----------------------------------------------------------|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **RF01**   | Gestão de prontuário com vacinas, vermífugos e medicações | **Atendido**      | Cadastro e listagem de vacina (Gripe), vermífugo (Drontal) e medicação (Predinisolona) no pet Luna, com comprovante anexado em cada um: RF01-vacina-1..3, RF01-vermifugo-1..3, RF01-medicacao-1..3<br>**Prints: Figuras 1 a 9 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **RF02**   | Carteira digital por QR Code ou link                      | **Atendido**      | QR Code da carteira da Luna no app, botão Compartilhar gerando o link e carteira aberta no navegador pelo link (vacina e vermífugo do RF01 visíveis; medicações restritas a vet com CRMV): RF02-1..5<br>**Prints: Figuras 10 a 14 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **RF03**   | Interface web do veterinário com notas de atendimento     | **Atendido**      | Veterinário real cadastrado na web de produção com o CRMV verificado no CFMV pela Infosimples ("Registro ativo no CFMV"): RF03-1 (e-mail com tarja). Painel "Pets Atendidos": RF03-2. Acesso pela carteira pública da Luna com "Sou veterinário": RF03-3 (telefone com tarja). Prontuário completo na área do vet, com histórico imutável: RF03-4. Vacina registrada pelo vet, assinada com nome e CRMV, e comprovante marcado como verificado por ele: RF03-5..6. Nota clínica (diagnóstico, prescrição e observações) criada e salva com nome, CRMV e data: RF03-7..8. Observação: o CRMV só foi encontrado com zero à esquerda ("CE 02605"); com "CE 2605", como sugere o exemplo da tela, o CFMV não devolve dados (code 612 da Infosimples)<br>**Prints: Figuras 15 a 22 (Anexo)** |
| **RF04**   | Busca de clínicas próximas por geolocalização             | **Atendido**      | Mapa com a localização do usuário (Eusébio-CE) e as clínicas veterinárias em volta, no raio de 5 km; detalhe de uma clínica com endereço, telefone, avaliação, status e distância (195 m): RF04-1..2<br>**Prints: Figuras 23 a 24 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **RF05**   | Ligação direta para a clínica                             | **Atendido**      | Botão "Ligar" no detalhe da clínica (Zoomare, Eusébio) abrindo a confirmação de chamada do iPhone com o mesmo número (85) 3404-3404; depois da ligação o app oferece "Adicionar na agenda": RF05-1..2<br>**Prints: Figuras 25 a 26 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **RF06**   | Sincronização das consultas com o Google Calendar         | **Atendido**      | Agenda antes de conectar, Google Agenda conectado (avisos de 1 h e 15 min), formulário da consulta "Vacinação" 07/11/2026 12:00 para a Luna, consulta salva com "Na sua agenda" e o mesmo evento no Google Agenda (que também recebeu a medicação e as próximas doses do RF01): RF06-1..5<br>**Prints: Figuras 27 a 31 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **RF07**   | Notificações push escalonadas                             | **Parcial**       | Lembretes escalonados da consulta "Vacinação" de 07/11/2026 12:00 chegaram no iPhone pelo Google Agenda, sincronizado pelo PetCard (RF06): um aviso 1 h antes (11:00) e outro 15 min antes (11:45), vistos na tela de bloqueio às 12:06 ("há 1h" e "há 21m"): RF07-1. Falta: o push do próprio PetCard não chega no iPhone, porque o app iOS não tem configuração do Firebase (só o Android tem google-services.json) e a API envia pelo FCM; o workflow "Lembretes diários" de 06/11 23:42 rodou com sucesso e nada chegou. O push precisa ser testado com o APK num Android<br>**Prints: Figura 32 (Anexo)**                                                                                                                                                                          |
| **RF08**   | Filtros de raio e de funcionamento das clínicas           | **Atendido**      | Com "Aberto agora" ligado: raio de 500 m sem clínicas ("Nenhuma clínica veterinária encontrada nesta área"), raio de 2 km com 1 clínica aberta (HVPOP, status "Aberto", 1.8 km). Sem o filtro, o raio de 5 km mostra várias clínicas (RF04-1): RF08-1..3<br>**Prints: Figuras 33 a 35 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **RF09**   | Fotos de receitas e exames no prontuário                  | **Atendido**      | Foto anexada em "Comprovantes" na medicação Predinisolona e aberta pelo app por link temporário do armazenamento (S3): RF09-1..2. Os anexos da vacina e do vermífugo aparecem em RF01-vacina-3 e RF01-vermifugo-3<br>**Prints: Figuras 36 a 37 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **RF10**   | Rota até a clínica por aplicativo externo                 | **Atendido**      | Botão "Rotas" no detalhe da clínica HVPOP abrindo o Google Maps com a clínica como destino e o trajeto de carro a partir da localização atual (9 min, 5,4 km): RF10-1..3<br>**Prints: Figuras 38 a 40 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **RF11**   | Vários animais por tutor                                  | **Atendido**      | Cadastro do segundo pet (Zeca, Lulu da Pomerânia), Home com "Meus pets (2)" (Luna e Zeca) e seleção do pet na aba Saúde para registrar vacinas de cada um: RF11-1..3<br>**Prints: Figuras 41 a 43 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **RF12**   | Exportação da carteira em PDF                             | **Atendido**      | Botão "Exportar PDF" na carteira da Luna, PDF de 573 KB gerado e PDF aberto com identidade do pet, resumo de saúde (contagem de vacinas, vermífugos e medicações), QR Code, link público e data de emissão: RF12-1..3. Observação: o PDF traz só o resumo (quantidades), não a lista de cada vacina com datas<br>**Prints: Figuras 44 a 46 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **RF13**   | Histórico imutável das observações clínicas               | **Parcial**       | Histórico clínico da Luna com cada registro, data, quem registrou e quem anexou; após editar a vacina "Gripe" para "Gripe Canina", o histórico marca "Alterado por · Camila Martins": RF13-1..4. Falta: o histórico mostra o valor atual, não o anterior ("Gripe" some da tela); o veterinário autor pode editar e apagar a própria nota clínica (botões Editar e Apagar visíveis em RF03-8)<br>**Prints: Figuras 47 a 50 (Anexo)**                                                                                                                                                                                                                                                                                                                                                     |
| **RF14**   | Perfil e contato de emergência do tutor                   | **Parcial**       | Perfil do tutor antes (sem telefone), formulário de edição (foto, nome, telefone), telefone preenchido e perfil atualizado com o telefone: RF14-1..4. Falta: não existe campo de contato de emergência<br>**Prints: Figuras 51 a 54 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **RF15**   | Visualização offline da carteira                          | **Não atendido**  | Com o modo avião ligado, o app mostra "Não foi possível carregar seus pets. Tente novamente." (os cards visíveis vêm da memória da sessão aberta, não de armazenamento offline): RF15-1. Fora do escopo do MVP, decisão registrada no ADR-004<br>**Prints: Figura 55 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **RNF01**  | Interface intuitiva e acessível                           | **Atendido**      | Troca de idioma no Perfil, de Português para English, traduzindo a interface inteira (títulos, botões e barra de navegação): RNF01-1..2 (e-mail e telefone com tarja). Os prints dos RFs mostram a interface com ícones, rótulos e mensagens claras de sucesso e erro<br>**Prints: Figuras 56 a 57 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **RNF02**  | Tokens de sessão temporários no QR Code                   | **Parcial**       | Confirmação de "Regenerar QR Code", novo QR solicitado, link antigo abrindo "Carteira não encontrada" e link novo abrindo a carteira da Luna: RNF02-1..4 (telefone com tarja). Falta: o token não expira sozinho com o tempo, só é revogado quando o tutor regenera. Bug visto: a confirmação mostra "substitu��do" (acento quebrado no texto do app)<br>**Prints: Figuras 58 a 61 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                            |
| **RNF03**  | Busca de clínicas em menos de 2 segundos                  | **Atendido**      | Gravação de tela analisada quadro a quadro (20 quadros por segundo): toque em "5 km" aos 5,50 s do vídeo ("Atualizando...") e clínicas no mapa aos 6,20 s, ou seja, cerca de 0,7 s com a API já ativa: RNF03.mp4, RNF03-1..2. Observação: a primeira busca depois de a API ficar parada no Render pode demorar bem mais<br>**Prints: Figuras 62 a 63 (Anexo)**<br>**Vídeo: RNF03.mp4**                                                                                                                                                                                                                                                                                                                                                                                                  |
| **RNF04**  | Backups automatizados                                     | **Não atendido**  | Tela Database → Backups do projeto de produção (petcard-prod) no Supabase: o plano gratuito não inclui backups do projeto ("Free Plan does not include project backups"), e não há rotina própria de backup (nenhum workflow com pg_dump nos repositórios): RNF04-1. Isso contradiz o ADR-014 e o DAS, que citam backup diário do Supabase no plano gratuito. Para atender: workflow diário com pg_dump para o S3 (plano descrito no ADR-014)<br>**Prints: Figura 64 (Anexo)**                                                                                                                                                                                                                                                                                                          |
| **RNF05**  | Escalabilidade para milhares de perfis                    | **Para depois**   | Falta: print das filas no RabbitMQ Manager do CloudAMQP (qrCodeQueue, notificationPushQueue, calendarSyncQueue e as filas DLX) e, se houver, o diagrama de arquitetura do DAS. Classificação prevista: Parcial (plano gratuito, sem teste de carga)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **RNF06**  | Interface web responsiva                                  | **Atendido**      | Mesma página da carteira na web em três tamanhos: computador (Chrome em tela cheia), tablet (iPad Mini 768×1024 no modo de dispositivos do Chrome) e celular (iPhone, mesmo print de RNF02-4), com o conteúdo se reorganizando em cada largura: RNF06-1..3 (telefone com tarja). Observação: testado na página pública da carteira; o painel do veterinário não foi testado por falta de conta de vet<br>**Prints: Figuras 65 a 67 (Anexo)**                                                                                                                                                                                                                                                                                                                                            |
| **RNF07**  | Disponibilidade acima de 99,5%                            | **Não atendido**  | Serviço petcard-api no Render no plano Free, com o aviso de que a instância hiberna por inatividade e pode atrasar requisições em 50 segundos ou mais: RNF07-1. Logs da API subindo do zero às 17:28 de 08/11/2026 depois de uma requisição, ou seja, partida a frio após a hibernação: RNF07-2. Sem instância sempre ativa não há como garantir 99,5% de disponibilidade; limitação aceita por custo (ADR-010). Os mesmos logs mostram as filas DLX/DLQ criadas em produção (ver RNF05)<br>**Prints: Figuras 68 a 69 (Anexo)**                                                                                                                                                                                                                                                         |
| **RNF08**  | Ambiente portável em contêineres                          | **Atendido**      | docker compose up -d subindo os 3 contêineres (PostgreSQL com PostGIS, Redis e RabbitMQ) em 0,2 s e docker ps com os três "Up" e as portas expostas; Docker Desktop no Mac com o projeto petcard-api/docker e os 3 serviços rodando: RNF08-1..2. Observação: a imagem do PostGIS é amd64 e roda por emulação no Mac com chip Apple (aviso de plataforma), sem impedir o funcionamento<br>**Prints: Figuras 70 a 71 (Anexo)**                                                                                                                                                                                                                                                                                                                                                            |
| **RNF09**  | Comunicação cifrada (HTTPS/TLS)                           | **Atendido**      | Web (petcard-web.vercel.app) e API (petcard-api-v1yi.onrender.com) abertas no Chrome com o painel de segurança mostrando "A conexão é segura" e "O certificado é válido" nos dois domínios: RNF09-1..4 (telefone com tarja). Conferido também por linha de comando em 06/11/2026: HSTS ativo e http:// da web redirecionando para https:// (308)<br>**Prints: Figuras 72 a 75 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                                 |
| **RNF10**  | Notificações e agenda em segundo plano                    | **Atendido**      | Workflow "Lembretes diários" \#7 disparado manualmente no GitHub Actions (concluído com sucesso às 23:42 de 06/11/2026, conferido pela API do GitHub): RNF10-1. Consulta enviada sozinha ao Google Agenda (fila calendarSyncQueue, RF06-4..5) e QR Code gerado em segundo plano (fila qrCodeQueue, RNF02-2). Observação: o push não chega no iPhone (ver RF07)<br>**Prints: Figura 76 (Anexo)**                                                                                                                                                                                                                                                                                                                                                                                         |

## Anexo — Prints

### RF01 — Gestão de prontuário com vacinas, vermífugos e medicações

| <img src="imagens/image1.jpg" width="170"> | <img src="imagens/image2.jpg" width="170"> | <img src="imagens/image3.jpg" width="170"> | <img src="imagens/image4.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 1 — RF01-vacina-1* | *Figura 2 — RF01-vacina-2* | *Figura 3 — RF01-vacina-3* | *Figura 4 — RF01-vermifugo-1* |
| <img src="imagens/image5.jpg" width="170"> | <img src="imagens/image6.jpg" width="170"> | <img src="imagens/image7.jpg" width="170"> | <img src="imagens/image8.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 5 — RF01-vermifugo-2* | *Figura 6 — RF01-vermifugo-3* | *Figura 7 — RF01-medicacao-1* | *Figura 8 — RF01-medicacao-2* |
| <img src="imagens/image9.jpg" width="170"> |
| :-: |
| *Figura 9 — RF01-medicacao-3* |

### RF02 — Carteira digital por QR Code ou link

| <img src="imagens/image10.jpg" width="170"> | <img src="imagens/image11.jpg" width="170"> | <img src="imagens/image12.jpg" width="170"> | <img src="imagens/image13.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 10 — RF02-1* | *Figura 11 — RF02-2* | *Figura 12 — RF02-3* | *Figura 13 — RF02-4* |
| <img src="imagens/image14.jpg" width="170"> |
| :-: |
| *Figura 14 — RF02-5* |

### RF03 — Interface web do veterinário com notas de atendimento

<img src="imagens/image68.jpg" width="600" />

*Figura 15 — RF03-1*

<img src="imagens/image69.jpg" width="600" />

*Figura 16 — RF03-2*

<img src="imagens/image70.jpg" width="600" />

*Figura 17 — RF03-3*

<img src="imagens/image71.jpg" width="600" />

*Figura 18 — RF03-4*

<img src="imagens/image72.jpg" width="600" />

*Figura 19 — RF03-5*

<img src="imagens/image73.jpg" width="600" />

*Figura 20 — RF03-6*

<img src="imagens/image74.jpg" width="600" />

*Figura 21 — RF03-7*

<img src="imagens/image75.jpg" width="600" />

*Figura 22 — RF03-8*

### RF04 — Busca de clínicas próximas por geolocalização

| <img src="imagens/image15.jpg" width="170"> | <img src="imagens/image16.jpg" width="170"> |
| :-: | :-: |
| *Figura 23 — RF04-1* | *Figura 24 — RF04-2* |

### RF05 — Ligação direta para a clínica

| <img src="imagens/image17.jpg" width="170"> | <img src="imagens/image18.jpg" width="170"> |
| :-: | :-: |
| *Figura 25 — RF05-1* | *Figura 26 — RF05-2* |

### RF06 — Sincronização das consultas com o Google Calendar

| <img src="imagens/image19.jpg" width="170"> | <img src="imagens/image20.jpg" width="170"> | <img src="imagens/image21.jpg" width="170"> | <img src="imagens/image22.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 27 — RF06-1* | *Figura 28 — RF06-2* | *Figura 29 — RF06-3* | *Figura 30 — RF06-4* |
| <img src="imagens/image23.jpg" width="170"> |
| :-: |
| *Figura 31 — RF06-5* |

### RF07 — Notificações push escalonadas

| <img src="imagens/image60.jpg" width="170"> |
| :-: |
| *Figura 32 — RF07-1* |

### RF08 — Filtros de raio e de funcionamento das clínicas

| <img src="imagens/image24.jpg" width="170"> | <img src="imagens/image25.jpg" width="170"> | <img src="imagens/image26.jpg" width="170"> |
| :-: | :-: | :-: |
| *Figura 33 — RF08-1* | *Figura 34 — RF08-2* | *Figura 35 — RF08-3* |

### RF09 — Fotos de receitas e exames no prontuário

| <img src="imagens/image27.jpg" width="170"> | <img src="imagens/image28.jpg" width="170"> |
| :-: | :-: |
| *Figura 36 — RF09-1* | *Figura 37 — RF09-2* |

### RF10 — Rota até a clínica por aplicativo externo

| <img src="imagens/image29.jpg" width="170"> | <img src="imagens/image30.jpg" width="170"> | <img src="imagens/image31.jpg" width="170"> |
| :-: | :-: | :-: |
| *Figura 38 — RF10-1* | *Figura 39 — RF10-2* | *Figura 40 — RF10-3* |

### RF11 — Vários animais por tutor

| <img src="imagens/image32.jpg" width="170"> | <img src="imagens/image33.jpg" width="170"> | <img src="imagens/image34.jpg" width="170"> |
| :-: | :-: | :-: |
| *Figura 41 — RF11-1* | *Figura 42 — RF11-2* | *Figura 43 — RF11-3* |

### RF12 — Exportação da carteira em PDF

| <img src="imagens/image35.jpg" width="170"> | <img src="imagens/image36.jpg" width="170"> | <img src="imagens/image37.jpg" width="170"> |
| :-: | :-: | :-: |
| *Figura 44 — RF12-1* | *Figura 45 — RF12-2* | *Figura 46 — RF12-3* |

### RF13 — Histórico imutável das observações clínicas

| <img src="imagens/image38.jpg" width="170"> | <img src="imagens/image39.jpg" width="170"> | <img src="imagens/image40.jpg" width="170"> | <img src="imagens/image41.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 47 — RF13-1* | *Figura 48 — RF13-2* | *Figura 49 — RF13-3* | *Figura 50 — RF13-4* |

### RF14 — Perfil e contato de emergência do tutor

| <img src="imagens/image42.jpg" width="170"> | <img src="imagens/image43.jpg" width="170"> | <img src="imagens/image44.jpg" width="170"> | <img src="imagens/image45.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 51 — RF14-1* | *Figura 52 — RF14-2* | *Figura 53 — RF14-3* | *Figura 54 — RF14-4* |

### RF15 — Visualização offline da carteira

| <img src="imagens/image46.jpg" width="170"> |
| :-: |
| *Figura 55 — RF15-1* |

### RNF01 — Interface intuitiva e acessível

| <img src="imagens/image47.jpg" width="170"> | <img src="imagens/image48.jpg" width="170"> |
| :-: | :-: |
| *Figura 56 — RNF01-1* | *Figura 57 — RNF01-2* |

### RNF02 — Tokens de sessão temporários no QR Code

| <img src="imagens/image49.jpg" width="170"> | <img src="imagens/image50.jpg" width="170"> | <img src="imagens/image51.jpg" width="170"> | <img src="imagens/image52.jpg" width="170"> |
| :-: | :-: | :-: | :-: |
| *Figura 58 — RNF02-1* | *Figura 59 — RNF02-2* | *Figura 60 — RNF02-3* | *Figura 61 — RNF02-4* |

### RNF03 — Busca de clínicas em menos de 2 segundos

| <img src="imagens/image53.jpg" width="170"> | <img src="imagens/image54.jpg" width="170"> |
| :-: | :-: |
| *Figura 62 — RNF03-1* | *Figura 63 — RNF03-2* |

### RNF04 — Backups automatizados

<img src="imagens/image61.jpg" width="600" />

*Figura 64 — RNF04-1*

### RNF06 — Interface web responsiva

| <img src="imagens/image52.jpg" width="170"> |
| :-: |
| *Figura 65 — RNF06-3* |

<img src="imagens/image55.jpg" width="600" />

*Figura 66 — RNF06-1*

<img src="imagens/image56.jpg" width="600" />

*Figura 67 — RNF06-2*

### RNF07 — Disponibilidade acima de 99,5%

<img src="imagens/image62.jpg" width="600" />

*Figura 68 — RNF07-1*

<img src="imagens/image63.jpg" width="600" />

*Figura 69 — RNF07-2*

### RNF08 — Ambiente portável em contêineres

<img src="imagens/image57.jpg" width="600" />

*Figura 70 — RNF08-1*

<img src="imagens/image58.jpg" width="600" />

*Figura 71 — RNF08-2*

### RNF09 — Comunicação cifrada (HTTPS/TLS)

<img src="imagens/image64.jpg" width="600" />

*Figura 72 — RNF09-1*

<img src="imagens/image65.jpg" width="600" />

*Figura 73 — RNF09-2*

<img src="imagens/image66.jpg" width="600" />

*Figura 74 — RNF09-3*

<img src="imagens/image67.jpg" width="600" />

*Figura 75 — RNF09-4*

### RNF10 — Notificações e agenda em segundo plano

<img src="imagens/image59.jpg" width="600" />

*Figura 76 — RNF10-1*
