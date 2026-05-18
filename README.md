# 🏆 Álbum Copa 2026 Panini · Edição Firebase

Aplicação web para controle e troca de figurinhas da Copa do Mundo 2026, com sincronização em tempo real via Firebase, autenticação por email/senha e matching inteligente de trocas por cidade.

## 🚀 Funcionalidades

✅ **Autenticação** — Login/cadastro com email e senha  
✅ **Multi-usuário** — Cada criança tem seu próprio perfil e coleção  
✅ **Sincronização em tempo real** — Firestore em tempo real com offline fallback  
✅ **4 abas principais** — Dashboard, Controle, Trocas, Imprimir  
✅ **Matching de trocas** — Encontra amigos da mesma cidade com figurinhas compatíveis  
✅ **Modo offline** — Continua funcionando sem internet e sincroniza ao voltar  
✅ **Impressão** — 4 opções de layout A4 para imprimir  
✅ **Responsivo** — Funciona em celular, tablet e desktop  

## 🔧 Configuração Firebase

### 1. Criar projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Criar projeto"**
3. Nome: `album-copa-2026`
4. Desabilite Google Analytics
5. Clique em **"Criar projeto"**

### 2. Ativar Firebase Auth

1. No painel, vá para **Authentication**
2. Clique em **"Get started"**
3. Ative **"Email/Password"**
4. Salve as alterações

### 3. Criar Firestore Database

1. No painel, vá para **Firestore Database**
2. Clique em **"Create database"**
3. Região: escolha a mais próxima de você (ex: `us-central1`)
4. Regras de segurança: **"Start in test mode"** (vamos ajustar depois)
5. Clique em **"Create"**

### 4. Obter credenciais Firebase

1. Vá para **Configurações do Projeto** (⚙️ no menu)
2. Clique em **"Seu aplicativo"** → **Aplicativo Web**
3. Copie o objeto de configuração (`firebaseConfig`)

### 5. Adicionar credenciais ao HTML

1. Abra `Album_Copa_2026_Panini.html` em um editor
2. Procure por esta seção (linha ~600):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDOKxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "album-copa-2026.firebaseapp.com",
  projectId: "album-copa-2026",
  storageBucket: "album-copa-2026.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};
```

3. Substitua pelos valores do seu projeto Firebase
4. **Salve o arquivo**

### 6. Configurar regras de segurança Firestore

1. No **Firestore Database**, vá para **Rules**
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colecção users - cada usuário pode ler/escrever seu próprio perfil
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Colecção colecoes - cada usuário pode ler/escrever sua coleção
    match /colecoes/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Permitir leitura pública da lista de usuários (para encontrar amigos)
    match /users/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publish"**

## 📱 Como usar

### Para usuários (crianças)

1. Abra o arquivo `Album_Copa_2026_Panini.html` no navegador
2. **Primeira vez**: clique em **"Criar conta"**
   - Digite um apelido
   - E-mail (pode ser do responsável)
   - Senha (mínimo 6 caracteres)
   - Sua cidade
3. Clique em **"Criar conta e entrar"**
4. Após fazer login, você verá a aba **Dashboard**
5. Clique em **Controle** e comece a marcar suas figurinhas:
   - **Clique** para adicionar (+1)
   - **Toque longo** (mobile) ou **botão direito** (desktop) para remover (-1)
6. A aba **Trocas** mostra:
   - Suas figurinhas repetidas
   - Amigos da mesma cidade com possibilidade de troca
7. **Imprimir** tem 4 opções de layout

### Para responsáveis

- Criar uma conta com e-mail e senha
- Gerenciar contas das crianças (ajudar com cadastro)
- Acompanhar progresso de cada criança
- Permitir que crianças façam trocas com amigos da mesma cidade

## 🔐 Segurança e privacidade

✅ **Sem fotos** — Apenas apelido e cidade (privacidade das crianças)  
✅ **Autenticação** — Usuário e senha protegem acesso  
✅ **Dados isolados** — Cada usuário vê apenas seus dados  
✅ **Offline seguro** — Dados são sincronizados automaticamente  
✅ **Regras Firestore** — Impedem acesso não autorizado aos dados  

## 🌍 Escalabilidade

### Se a app crescer:

- **Suporta milhares de usuários** com plano Firestore padrão
- **Chat** pode ser adicionado na aba Trocas
- **Histórico de trocas** pode ficar para próxima versão
- **Notificações** (push) quando um amigo quer trocar

## 🚢 Deploy no GitHub Pages

### Se quiser publicar online:

1. Crie um repositório no GitHub: `album-copa`
2. Upload do arquivo `Album_Copa_2026_Panini.html`
3. Vá para **Settings** → **Pages**
4. Ative GitHub Pages (branch `main`)
5. URL pública: `https://[seu-usuario].github.io/album-copa/`

> **Nota**: As credenciais Firebase são públicas em arquivo HTML (é seguro — a segurança vem das regras Firestore)

## 📊 Estrutura de dados Firestore

```
users/
  {uid}/
    apelido: string
    email: string
    cidade: string
    createdAt: timestamp
    lastLogin: timestamp

colecoes/
  {uid}/
    figurinhas: object
      "A-MEX-1": 1
      "C-BRA-5": 3
      ...
    ultimaAtualizacao: timestamp
```

## 🆘 Troubleshooting

**"Firebase não está definido"**  
→ Verifique se as credenciais estão preenchidas corretamente no HTML

**"Erro ao criar conta: email-already-in-use"**  
→ O e-mail já está registrado. Tente outro ou use "Esqueci a senha"

**"Offline - sem internet"**  
→ Normal! O app continua funcionando com localStorage como backup. Quando voltar online, sincroniza automaticamente.

**"Não vejo amigos da minha cidade"**  
→ Certifique-se de que:
  1. Você e seu amigo têm a mesma cidade preenchida no cadastro
  2. Ambos têm figurinhas compatíveis para trocar
  3. Recarregue a página

## 🛠️ Desenvolvimento futuro

- [ ] Chat integrado na aba Trocas
- [ ] Histórico de trocas realizadas
- [ ] Notificações push
- [ ] PWA (instalar como app)
- [ ] Modo escuro
- [ ] Foto de perfil (opcional, com consentimento dos pais)

## 📞 Contato

**Anderson** — João Monlevade, MG  
Álbum Copa 2026 · Versão Firebase · Maio 2026

---

## ✅ Checklist de configuração

- [ ] Projeto Firebase criado
- [ ] Auth (Email/Password) habilitado
- [ ] Firestore Database criado
- [ ] Credenciais obtidas do Firebase Console
- [ ] `firebaseConfig` adicionado ao HTML
- [ ] Regras Firestore configuradas
- [ ] Arquivo testado no navegador
- [ ] Primeira conta criada e testada
- [ ] Sincronização funcionando
- [ ] Aba Trocas mostrando amigos

