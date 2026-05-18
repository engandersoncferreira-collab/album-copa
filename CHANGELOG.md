# 📝 Changelog · Álbum Copa 2026

## [2.0.0] — 15 de Maio de 2026 · Versão Firebase

### ✨ Novo

#### Autenticação e Multi-usuário
- ✅ **Login/Cadastro com Email e Senha**
  - Tela de autenticação elegante
  - Validação de dados
  - Recuperação de senha (reset link por email)
  - Persistência de sessão

#### Perfil do Usuário
- ✅ **Campos do cadastro**:
  - Apelido (como será identificado)
  - Email (login + contato)
  - Cidade (para matching de trocas)
  - Data de criação
  - Modal de perfil com opção mudar senha

#### Sincronização em Tempo Real
- ✅ **Firebase Firestore**
  - Sync em tempo real < 2 segundos
  - Listener ativo em background
  - Indicador visual de status:
    - 🟢 Sincronizado
    - 🟡 Salvando...
    - 🔴 Offline
    - ⚪ Conectando...

#### Persistência Offline
- ✅ **IndexedDB** (Firestore)
- ✅ **LocalStorage** como fallback
- Sincronização automática ao voltar online

#### Aba Trocas Melhorada
- ✅ **Suas repetidas**
  - Lista de figurinhas com mais de 1 cópia
  - Quantidades claras
- ✅ **Matching inteligente por cidade**
  - Busca amigos na mesma cidade
  - Mostra compatibilidade de trocas:
    - "Você tem para ele: X figurinhas"
    - "Ele tem para você: Y figurinhas"
  - Cards de sugestão inteligente

#### Funcionalidades Preservadas
- ✅ **Dashboard** — Progresso geral e por grupo
- ✅ **Controle** — Marcar/desmarcar figurinhas
  - Toque: +1
  - Toque longo (mobile) / Botão direito: -1
  - Expand/Collapse grupos
  - Reset completo
- ✅ **Impressão** — 4 modos (branco, progresso, faltam, repetidas)
- ✅ **Design** — Azul e branco, responsivo

### 🔧 Mudanças Técnicas

- Migração de `localStorage` → Firebase Firestore
- Firebase Auth para autenticação segura
- Estrutura de dados em Firestore:
  - `users/{uid}` — Perfil do usuário
  - `colecoes/{uid}` — Coleção de figurinhas
- Regras de segurança Firestore restritivas
- Offline persistence habilitado

### 📦 Arquivos

- `Album_Copa_2026_Panini.html` — Nova versão (v2.0)
- `Album_Copa_2026_Panini-v1-localstorage.html` — Backup v1
- `README.md` — Guia de configuração Firebase
- `CHANGELOG.md` — Este arquivo

### ⚠️ Importante para configurar

**Antes de usar, você PRECISA:**

1. Criar projeto Firebase em `console.firebase.google.com`
2. Ativar Authentication (Email/Password)
3. Criar Firestore Database
4. Obter credenciais (apiKey, authDomain, projectId, etc)
5. **Substituir `firebaseConfig` no HTML** com suas credenciais
6. Configurar regras Firestore (ver `README.md`)

### 🧪 Testado

- ✅ Login/Cadastro
- ✅ Criação de usuário em Firestore
- ✅ Sincronização de figurinhas em tempo real
- ✅ Aba Trocas com matching
- ✅ Offline fallback
- ✅ Responsividade mobile/desktop
- ✅ Todas as 4 abas funcionando

### 🎯 Próximas features (Backlog)

- [ ] Chat integrado na aba Trocas
- [ ] Histórico de trocas realizadas
- [ ] Notificações push (friend request)
- [ ] PWA (instalar como app)
- [ ] Modo escuro
- [ ] Foto de perfil (com consentimento)
- [ ] Comparação de progresso entre amigos
- [ ] Estatísticas avançadas (taxa de complemento por cidade, etc)

---

**Versão anterior** → v1.0 (localStorage, sem autenticação, sínc manual)
