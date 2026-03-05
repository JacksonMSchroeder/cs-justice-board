# ⚖️ CS: Justiça - Sistema de Documentação e Combate à Violência Virtual

## 🔗 Link do Projeto
🚀 **Confira o projeto rodando aqui:** [https://cs-justice-board.onrender.com/](https://cs-justice-board.onrender.com/)

<div align="center">
  <img src="./cs-justice-backend/static/assets/allpagescs.gif" alt="Demonstração das Páginas" width="800">
</div>

---

## 🔐 Sistema de Login via Valve (Steam OpenID)

O projeto implementa autenticação segura via Steam, garantindo que apenas usuários reais da plataforma possam interagir com o sistema de denúncias.

| Antes do Login | Após Autenticação |
| :---: | :---: |
| <img src="./cs-justice-backend/static/assets/nolog.png" width="400"> | <img src="./cs-justice-backend/static/assets/yeslog.png" width="400"> |

<br>

### ⚡ Integração com Supabase & Moderação
<div align="center">
  <img src="./cs-justice-backend/static/assets/supacs.png" alt="Painel Supabase" width="800">
</div>

*O projeto utiliza o **Supabase (PostgreSQL)** para gestão de dados e o **Supabase Storage** para armazenamento seguro de evidências, contando com um sistema de moderação onde as denúncias só aparecem no mural após aprovação administrativa.*

---

## 🏛️ Sobre o Projeto
Este é um **Projeto Pessoal de Estudo Avançado**, desenvolvido para aplicar conceitos de *Fullstack Development* em um problema real: a toxicidade no cenário de E-sports. O objetivo é criar uma solução de domínio público para conscientização, instrução e apoio a vítimas de crimes de injúria e racismo em ambientes de jogos online.

### ⚖️ Referencial Técnico e Social
O projeto foi estruturado com base em pilares reais de justiça e tecnologia:
* **Base Legal:** Lei nº 14.532/2023 (Equiparação da Injúria Racial ao crime de Racismo) e o Código Penal Brasileiro.
* **Público-Alvo:** Jogadores de Counter-Strike e comunidades competitivas de E-sports.
* **Objetivo de Estudo:** Implementação de integrações complexas de API, segurança de dados e gestão de arquivos em nuvem.

---

## 🚀 Funcionalidades e Diferenciais Técnicos
* **Identificação Inteligente (Steam API):** Lógica que processa inputs dinâmicos, convertendo automaticamente URLs de perfis e Vanity URLs em SteamID64 via requisições assíncronas.
* **Mural de Registros Moderado:** Interface de visualização que exibe apenas denúncias aprovadas no banco de dados, garantindo a integridade do conteúdo exibido (UX Design).
* **Monitoramento de Status (VAC):** Integração em tempo real com os servidores da Valve para verificar banimentos ativos nos perfis reportados.
* **Gestão de Provas em Nuvem:** Implementação de upload de imagens diretamente para o **Supabase Storage**, vinculando evidências visuais de forma segura aos registros do banco.
* **Autenticação Steam OpenID:** Sistema de login que utiliza a identidade oficial da Valve para garantir que apenas usuários reais possam realizar denúncias.

---

## 🛠️ Stack Tecnológica (Fullstack)
* **Backend:** Node.js com framework Express.
* **Segurança:** Implementação de **Helmet.js** para proteção contra ataques XSS e controle rigoroso de *Content Security Policy* (CSP).
* **Banco de Dados & Storage:** **Supabase** (PostgreSQL) para persistência de dados e armazenamento de mídia.
* **Integrações:** API Web da Steam (ISteamUser) para coleta de metadados e verificação de conta.
* **Deploy:** Hospedagem via Render com fluxo de deploy contínuo.

---

## 🧠 Desafios Superados
* **Manipulação de APIs:** Tratamento de dados brutos da Steam para exibição amigável.
* **Segurança em Uploads:** Uso do **Multer** para processar buffers de imagem em memória antes do envio para o Supabase.
* **Lógica de Tradução de URL:** Criação de regex para extração de IDs únicos de links da comunidade Steam.

---

## 🖥️ Design Responsivo
Interface desenvolvida com foco em **Mobile First**, garantindo total funcionalidade em Smartphones e Desktops.

**Desenvolvedor:** Jackson Miranda Schroeder  
**Foco:** Análise e Desenvolvimento de Sistemas / Fullstack Development  
**Objetivo:** Contribuição social através da tecnologia e democratização do acesso à justiça digital.

---

## 📓 Diário de Bordo & Lições Aprendidas

Este projeto nasceu de uma experiência real de toxicidade em uma partida, onde presenciei ataques racistas. Diante da impunidade e da necessidade de praticar programação, decidi transformar a indignação em código. Abaixo, registro os principais desafios e "viradas de chave" durante o desenvolvimento:

### 🛡️ O Desafio da Segurança (Helmet.js)
O **Helmet** foi o meu maior adversário e, ao mesmo tempo, meu maior mestre. Ele bloqueou imagens, scripts e até o login da Steam.
* **Lição:** Segurança não se "taca" no código; se estuda. Tive que aprender profundamente sobre **CSP (Content Security Policy)** para entender que precisava liberar exceções específicas para as APIs da Valve e do Supabase no `connect-src` e `img-src`.

### 🚩 Gestão de Erros e a "Cilada" do Commit
No início, cometi o erro de usar o Commit como ambiente de teste. Fazia uma alteração "boba", commitava sem testar, dava erro, e o ciclo se repetia.
* **O Aprendizado:** O commit deve ser certeiro. Hoje adoto o mantra: **TESTAR, TESTAR e TESTAR** no ambiente local antes de qualquer deploy. O histórico de commits é a identidade do desenvolvedor; ele deve ser limpo e profissional.

### 🔍 Atenção aos Detalhes (O Bug Invisível)
Passei dois dias tentando entender por que o Mural e o Login não funcionavam, sem o console acusar erro nenhum.
* **A Descoberta:** O erro não estava no código, mas na estrutura do banco de dados no Supabase. Uma coluna duplicada e oculta pelo scroll horizontal estava quebrando toda a lógica de recebimento de dados. 
* **Lição:** Nem todo bug está no código. Às vezes, o erro está na infraestrutura ou no detalhe mais bobo da interface do DB.

### 🚀 Evolução da Arquitetura
O projeto começou dividido entre pastas de Front e Back, o que tornava a manutenção exaustiva. 
* **Solução:** Unifiquei o projeto criando uma pasta `static` dentro do backend. Isso facilitou a gestão de rotas e o deploy no Render.

### 💡 Nota sobre Segurança de Dados (.env)
No início, deixei o arquivo `.env` exposto. Foi um erro crítico que serviu de aprendizado definitivo: **A primeira coisa ao iniciar um projeto de backend é configurar o `.gitignore`.** Informação sensível não pode subir para o repositório, nunca.

---
> "Este projeto me ensinou que ser um desenvolvedor Fullstack é muito mais do que escrever código; é saber investigar problemas silenciosos e ter a resiliência de recomeçar uma lógica do zero quando necessário."