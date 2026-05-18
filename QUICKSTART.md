# 🚀 Guia Rápido: Primeiros Passos com Firebase

## 1️⃣ Criar projeto Firebase (5 min)

```
→ console.firebase.google.com
→ "Create Project"
→ Nome: album-copa-2026
→ Desabilitar Google Analytics
→ "Create Project"
```

## 2️⃣ Ativar Email/Password Auth (2 min)

```
Authentication
→ "Get Started"
→ Email/Password
→ "Enable"
→ "Save"
```

## 3️⃣ Criar Firestore Database (2 min)

```
Firestore Database
→ "Create Database"
→ Região: us-central1 (ou mais perto de você)
→ Rules: "Start in test mode"
→ "Create"
```

## 4️⃣ Obter Credenciais (2 min)

```
⚙️ Settings → "Your apps"
→ Criar app Web
→ Copiar objeto firebaseConfig
```

## 5️⃣ Adicionar ao HTML (1 min)

Editar `Album_Copa_2026_Panini.html`:

```javascript
// Procure por (linha ~600):
const firebaseConfig = {
  apiKey: "...",  ← SUBSTITUA POR SEUS VALORES
  ...
};
```

## 6️⃣ Configurar Regras Firestore (2 min)

```
Firestore Database → Rules
→ Copiar regras do README.md
→ "Publish"
```

## 7️⃣ Testar

```
→ Abrir Album_Copa_2026_Panini.html no navegador
→ Clique em "Criar conta"
→ Preencha dados
→ "Criar conta e entrar"
→ ✅ Se funcionou, está pronto!
```

## ⚠️ Checklist

- [ ] Projeto Firebase criado
- [ ] Auth habilitado
- [ ] Firestore criado
- [ ] firebaseConfig no HTML
- [ ] Regras Firestore configuradas
- [ ] Primeira conta testada

## 🆘 Algo deu errado?

**Erro: "Firebase não está definido"**
→ Credenciais não preenchidas corretamente

**Erro ao criar conta: "auth/email-already-in-use"**
→ E-mail já registrado em outra conta

**"Offline" ao abrir**
→ Normal! Continua funcionando. Sincroniza quando voltar online.

---

**Pronto para começar!** 🎉
