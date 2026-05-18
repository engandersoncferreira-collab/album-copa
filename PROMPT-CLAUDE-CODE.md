# 🚀 Prompt para iniciar no Claude Code

> Copie todo o conteúdo abaixo da linha pontilhada e cole no Claude Code após executar `claude` no terminal do VS Code.

---

Olá Claude! Estou começando um trabalho no projeto **Álbum Copa do Mundo 2026 Panini** nesta pasta. Antes de fazer qualquer coisa, preciso que você:

## 📚 Passo 1: Leia o contexto

1. Leia o arquivo **`CONTEXTO-CONVERSA.md`** completo — ele contém todo o histórico do projeto, decisões de design, estrutura de dados e funcionalidades já implementadas
2. Leia o arquivo **`index.html`** atual para entender a implementação existente
3. Leia o arquivo **`firebase-credenciais.txt`** que tem as credenciais do Firebase

## 🎯 Passo 2: Entenda a missão

Migrar o sistema atual de `localStorage` para **Firebase Firestore**, permitindo sincronização automática em tempo real entre os dispositivos da família (eu, minha esposa e meu filho).

## ✅ Requisitos obrigatórios

### Funcionalidades a manter

- ✅ As 4 abas atuais: Dashboard, Controle, Trocas, Imprimir
- ✅ Design em **azul e branco** (sem amarelo dominante — só badges e detalhes)
- ✅ Identidade visual atual (cores, tipografia, componentes)
- ✅ Multi-usuário (Anderson, Esposa, Filho)
- ✅ Toque longo no mobile para diminuir (-1)
- ✅ Modo impressão com 4 opções (em branco, com progresso, faltam, repetidas)
- ✅ Responsividade (celular 7 colunas, tablet 10, desktop 20)

### Novas funcionalidades a implementar

#### 1. Sincronização em tempo real via Firebase Firestore

- Cada usuário tem seu próprio documento no Firestore
- Mudanças refletem em **todos os dispositivos em < 2 segundos**
- Coleção sugerida: `colecoes/{nomeUsuario}` com os dados da coleção

#### 2. Autenticação simples por PIN da família

- Tela de login inicial: campo único para PIN de 4 dígitos
- PIN definido na primeira vez (salvo no Firestore em `config/pin`)
- Após primeiro acesso, salva no localStorage para não pedir sempre
- Botão "Sair" no menu para resetar
- Usa autenticação anônima do Firebase (já habilitada) por baixo

#### 3. Indicador visual de status

No header, ao lado do nome do usuário, mostrar um pequeno indicador:

- 🟢 **Sincronizado** — tudo OK
- 🟡 **Salvando...** — escrita em progresso
- 🔴 **Offline** — sem internet
- ⚪ **Conectando...** — carregando

#### 4. Modo offline com fallback

- Se não tiver internet, continua funcionando com localStorage
- Quando voltar online, sincroniza automaticamente
- Usar `enableIndexedDbPersistence()` do Firestore para cache offline

#### 5. Histórico de quem atualizou

- Cada mudança grava: usuário, timestamp e o que foi alterado
- Aba nova **"Histórico"** com últimas 50 atualizações
- Ex: *"Filho marcou figurinha BRA-5 às 14:32"*

## 🛠️ Como implementar

### Estrutura proposta de arquivos

```
Album-copa/
├── index.html              # Arquivo principal (HTML + CSS + JS inline)
├── firebase-config.js      # Credenciais separadas (mais limpo)
├── CONTEXTO-CONVERSA.md
├── README.md               # Atualize com instruções de uso
└── .gitignore              # Não commitar credenciais sensíveis
```

> ⚠️ **Importante:** mantenha o `index.html` como **arquivo único standalone** (CSS e JS inline), porque é hospedado no GitHub Pages. As credenciais do Firebase podem ficar inline mesmo — são públicas e seguras (a segurança vem das regras do Firestore).

### Estrutura de dados sugerida no Firestore

```
/colecoes/{nomeUsuario}
  - figurinhas: { "A-MEX-1": 1, "A-MEX-2": 2, ... }
  - ultimaAtualizacao: timestamp
  - dispositivoOrigem: "iPhone do Filho" (opcional)

/config/familia
  - pin: "1234" (hash recomendado)
  - usuariosAtivos: ["Anderson", "Esposa", "Filho"]

/historico/{autoId}
  - usuario: "Filho"
  - acao: "marcou" | "desmarcou" | "resetou"
  - figurinha: "BRA-5"
  - timestamp: serverTimestamp
```

### Regras de segurança do Firestore (sugestão)

Depois de implementar, vou precisar atualizar as regras no console do Firebase para algo como:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

(você pode me lembrar disso no final)

## 📋 Plano de execução sugerido

Antes de começar a codar, **me apresente um plano em etapas** do que você vai fazer, mais ou menos assim:

1. Backup do `index.html` atual como `index-v1-localstorage.html`
2. Estrutura de autenticação por PIN
3. Migração dos dados para Firestore
4. Listener em tempo real
5. Indicador de status
6. Histórico de mudanças
7. Testes em ambiente local
8. Instruções para deploy no GitHub Pages

**Espere minha confirmação antes de começar a implementar.**

## 💬 Comunicação

- Use **português brasileiro** em comentários, mensagens e variáveis amigáveis ao usuário
- Variáveis e nomes técnicos podem ficar em inglês (camelCase)
- Seja objetivo, sem enrolação
- Quando terminar uma etapa, mostre o que mudou e pergunte se posso testar antes de seguir

## 🎯 Vamos começar?

Por favor:
1. Leia os arquivos mencionados
2. Faça um resumo do que entendeu
3. Apresente o plano de execução
4. Aguarde minha confirmação

---

**Anderson** · João Monlevade, MG
