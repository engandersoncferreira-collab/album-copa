# 🛠️ Histórico de Problemas e Soluções — Álbum Copa 2026

Registro de incidentes resolvidos no app, para consulta futura. Se um problema
parecido voltar, comece por aqui.

---

## 📅 13/06/2026 — App offline: "Erro ao carregar usuários" + bolinha vermelha

### Sintomas observados
- 🔴 **Bolinha vermelha** ao lado do nome do usuário no topo (header).
- Painel **Admin → Usuários** mostrando **"Erro ao carregar usuários"**.
- Ranking do bolão com nomes aparecendo como **"?"**.
- Apostas do bolão **não carregavam**.

### Causa raiz
As **Regras de Segurança do Firestore (Firestore Rules)** estavam **bloqueando todo o acesso**.

O projeto havia sido criado no **"modo de teste"** do Firebase. Esse modo gera
regras temporárias do tipo:

```
allow read, write: if request.time < timestamp.date(2026, 1, XX);
```

que **expiram em ~30 dias**. Depois da data, o Firebase passa a **negar toda
leitura e escrita** com o erro `permission-denied`.

### Como os sintomas se conectam
Todos vinham da **mesma causa** (Firebase recusando acesso):

| Sintoma | Origem no código |
|---|---|
| Bolinha vermelha (offline) | `setStatusSync('offline')` quando o `onSnapshot` de `colecoes/{uid}` dá erro (`inicializarSincronizacao`) |
| "Erro ao carregar usuários" | `db.collection('users').get()` negado no painel admin (`adminVerUsuarios`) |
| Nomes "?" no ranking | leitura dos docs de `users` de outros participantes negada |
| Apostas não carregam | leitura de `bolao_apostas/{uid}` negada (`carregarBolao`) |

### ✅ IMPORTANTE: nenhum dado foi perdido
Bloquear acesso **≠ apagar dado**. Os documentos continuaram intactos no
servidor do Firebase. Além disso, todo salvamento usa `set(..., {merge:true})`,
que só **adiciona/atualiza** campos — nunca zera o documento.

### Solução aplicada
1. Criado o arquivo **`firestore.rules`** (na raiz do projeto) com regras
   **permanentes e seguras** para todas as coleções
   (`users`, `colecoes`, `bolao_apostas`, `bolao_meta`, `chats`,
   `contato_dev`, `bloqueios`).
2. Ajustado o `index.html` para o painel admin **mostrar o erro real do Firebase**
   na tela (antes a exceção era engolida) — facilita diagnóstico futuro.
3. **Publicadas as regras no Console do Firebase** (passo manual obrigatório).

### Como publicar as regras (passo manual — não é automático!)
> ⚠️ Ter o `firestore.rules` no repositório **não basta**. É preciso colar e
> publicar no Console.

1. Acesse **https://console.firebase.google.com** → projeto do Álbum.
2. Menu lateral: **Firestore Database**.
3. Aba **Regras** (no topo).
4. Apague tudo da caixa.
5. Cole **todo** o conteúdo de `firestore.rules`.
6. Clique em **Publicar**. Em ~1 minuto entra no ar.

### Detalhe sobre o painel Admin
As regras usam o campo `role == 'admin'` no documento `users/{uid}`. Quem se
cadastra entra como `role: "user"` por padrão. Para que banir/reativar/ver
mensagens funcionem, o admin precisa ter o campo `role` editado para `"admin"`
manualmente (Console → Firestore → Dados → coleção `users` → seu documento).

### Como verificar que funcionou
- Recarregue o app com **Ctrl+F5**.
- 🟢 Bolinha do header fica **verde**.
- Usuários, apostas e ranking (com nomes) **carregam normalmente**.

### Commit relacionado
`26bd4ca` — *fix: corrige acesso ao Firebase (bolinha vermelha/offline e erro ao carregar usuarios)*

---

## 🔑 Referência rápida — bolinha de status no header

A cor da bolinha ao lado do nome indica o estado da sincronização com o Firebase:

| Cor | Estado | Significado |
|---|---|---|
| 🟢 Verde | `sincronizado` | Tudo certo, sincronizando |
| 🟡 Amarelo | `salvando` | Salvando uma alteração |
| 🔴 Vermelho | `offline` | **Sem acesso ao Firebase** (geralmente regras ou conexão) |
| ⚪ Cinza | `conectando` | Conectando |

Bolinha vermelha persistente ⇒ quase sempre é **regra do Firestore** (republicar
`firestore.rules`) ou problema de conexão/credenciais.
