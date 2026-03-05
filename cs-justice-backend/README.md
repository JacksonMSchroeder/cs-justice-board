# ⚖️ CS: Justiça - Sistema de Documentação e Combate à Violência Virtual

## 🔗 Link do Projeto
🚀 **Confira o projeto rodando aqui:** [https://cs-justice-board.onrender.com/](https://cs-justice-board.onrender.com/)

<div align="center">
  <img src="cs-justice-backend/static/assets/allpagescs.gif" alt="Demonstração das Páginas" width="800">
</div>

---

## 🔐 Sistema de Login via Valve (Steam OpenID)

O projeto implementa autenticação segura via Steam, garantindo que apenas usuários reais da plataforma possam interagir com o sistema de denúncias.

| Antes do Login | Após Autenticação |
| :---: | :---: |
| <img src="cs-justice-backend/static/assets/nolog.png" width="400" alt="Sem Login"> | <img src="cs-justice-backend/static/assets/yeslog.png" width="400" alt="Com Login"> |

<br>

### ⚡ Integração com Supabase & Moderação
<div align="center">
  <img src="cs-justice-backend/static/assets/supacs.png" alt="Painel Supabase" width="800">
</div>

*O projeto utiliza o **Supabase (PostgreSQL)** para gestão de dados e o **Supabase Storage** para armazenamento seguro de evidências, contando com um sistema de moderação onde as denúncias só aparecem no mural após aprovação administrativa.*

---

## 🏛️ Sobre o Projeto
Este é um **Projeto Pessoal de Estudo Avançado**, desenvolvido para aplicar conceitos de *Fullstack Development* em um problema real: a toxicidade no cenário de E-sports. O objetivo é criar uma solução de domínio público para conscientização, instrução e apoio a vítimas de crimes de injúria e racismo em ambientes de jogos online.

---

## 🛠️ Stack Tecnológica (Fullstack)
* **Backend:** Node.js com framework Express.
* **Segurança:** Implementação de **Helmet.js** para proteção contra ataques XSS.
* **Banco de Dados & Storage:** **Supabase** (PostgreSQL) e Storage.
* **Integrações:** API Web da Steam e Steam OpenID.
* **Deploy:** Hospedagem via Render.

---

## 📓 Diário de Bordo & Lições Aprendidas

### 🛡️ O Desafio da Segurança (Helmet.js)
O **Helmet** bloqueou imagens e scripts da Steam. Aprendi sobre **CSP (Content Security Policy)** para liberar exceções específicas para as APIs da Valve e do Supabase.

### 🚩 Gestão de Erros e a "Cilada" do Commit
No início, usei o Commit como ambiente de teste. O aprendizado: **TESTAR localmente** antes de qualquer deploy. O histórico de commits deve ser limpo.

### 🔍 O Bug Invisível (Supabase)
O erro estava na estrutura do banco de dados: uma coluna duplicada e oculta pelo scroll horizontal que quebrava a lógica de recebimento de dados.

### 🚀 A Guerra das Rotas (README vs Assets)
Ao mover o `README.md` para a raiz para que o GitHub o reconhecesse, quebrei todos os links de imagens.
* **O Problema:** O README procurava os assets na raiz, mas eles moravam dentro de `/cs-justice-backend/static/assets/`.
* **A Solução:** Entender caminhos relativos. Tive que mapear cada `src` para apontar corretamente para dentro da subpasta do backend para o GitHub encontrar os arquivos.

### 💡 Nota sobre Segurança de Dados (.env)
O arquivo `.env` foi exposto no início. Lição definitiva: **Configurar o `.gitignore` antes de qualquer linha de código de backend.**

---
> "Este projeto me ensinou que ser um desenvolvedor Fullstack é saber investigar problemas silenciosos, entender a hierarquia de pastas e ter a resiliência de ajustar rotas até que o último pixel esteja no lugar certo."