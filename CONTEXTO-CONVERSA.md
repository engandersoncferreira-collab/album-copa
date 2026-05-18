# 📒 Projeto: Álbum Copa do Mundo 2026 · Panini

> **Arquivo de contexto para Claude Code**
> Caminho local: `C:\Users\Anderson\Claude-projetos\Album-copa`
> Última atualização: 15 de maio de 2026

---

## 🎯 Visão geral do projeto

Aplicação web para controle da coleção do álbum de figurinhas da **Copa do Mundo FIFA 2026 da Panini**, desenvolvida para a família Anderson (pai), esposa e filho. O projeto teve várias iterações começando como uma planilha Excel e evoluindo para um app web standalone.

### Objetivos

1. **Marcar figurinhas** que cada usuário tem na coleção
2. **Acompanhar progresso** geral e por grupo de seleções
3. **Listar figurinhas repetidas** para troca
4. **Imprimir** versões em A4 (planilha em branco, com progresso, lista de faltas, lista de repetidas)
5. **Multi-usuário** no mesmo dispositivo (Anderson, esposa, filho)
6. **Funcionar offline** (HTML standalone)
7. **Permitir sincronização** entre dispositivos

---

## 👤 Contexto do usuário

- **Sr. Anderson** — João Monlevade, Minas Gerais, Brasil
- Bilíngue: Português e Inglês
- Trabalha na **Enjatec** (Calderaria, Usinagem, Manutenção e Montagem Industrial)
- Família: ele, esposa e um filho (que coleciona as figurinhas)

### Identidade visual Enjatec (usada como referência inicial)

| Cor | Hex | Uso |
|---|---|---|
| Azul Petróleo Base | `#0F4C5C` | Primária |
| Azul Petróleo Escuro | `#0B3F4A` | Primária escura |
| Amarelo Principal | `#F4C430` | Accent / destaques |
| Amarelo Hover | `#E0B52A` | Accent hover |
| Selection/Active | `#2F6F7E` | Estados ativos |
| Hover Leve | `#3C8597` | Hover |
| Background | `#F5F7FA` | Fundo |
| Cards | `#FFFFFF` | Cards |
| Border | `#E5E7EB` | Bordas |

**Tipografia:** Montserrat (Semibold para títulos, Medium para subtítulos, Regular para corpo)

**Distribuição de cores:** 70% azuis · 20% neutros · 10% amarelo

> ⚠️ A pedido do usuário, o app final usa **apenas tons de azul e branco** (sem amarelo dominante), mantendo o amarelo apenas em pequenos detalhes (badge de repetidas, botão Imprimir do modo impressão).

---

## 📂 Estrutura do álbum (994 figurinhas no total)

### Grupos das seleções (48 seleções × 20 figurinhas = 960)

| Grupo | Seleções |
|---|---|
| **A** | México (MEX), África do Sul (RSA), Coréia do Sul (KOR), Rep. Tcheca (CZE) |
| **B** | Canadá (CAN), Bósnia (BIH), Catar (QAT), Suíça (SUI) |
| **C** | Brasil (BRA), Marrocos (MAR), Haiti (HAI), Escócia (SCO) |
| **D** | Estados Unidos (USA), Paraguai (PAR), Austrália (AUS), Turquia (TUR) |
| **E** | Alemanha (GER), Curaçao (CUW), Costa do Marfim (CIV), Equador (ECU) |
| **F** | Holanda (NED), Japão (JPN), Suécia (SWE), Tunísia (TUN) |
| **G** | Bélgica (BEL), Egito (EGY), Irã (IRN), Nova Zelândia (NZL) |
| **H** | Espanha (ESP), Cabo Verde (CPV), Arábia Saudita (KSA), Uruguai (URU) |
| **I** | França (FRA), Senegal (SEN), Iraque (IRQ), Noruega (NOR) |
| **J** | Argentina (ARG), Argélia (ALG), Áustria (AUT), Jordânia (JOR) |
| **K** | Portugal (POR), Congo (COD), Uzbequistão (UZB), Colômbia (COL) |
| **L** | Inglaterra (ENG), Croácia (CRO), Gana (GHA), Panamá (PAN) |

### Especiais

- **FWC (FIFA World Cup History):** 20 figurinhas numeradas de 00 a 19
- **Coca-Cola (CC):** 14 figurinhas numeradas de CC1 a CC14

> ⚠️ **Nota importante:** A Panini ainda não confirmou oficialmente a contagem definitiva do álbum 2026. A estrutura acima foi baseada em uma referência do "Mundo das Figurinhas" fornecida pelo usuário. Caso a Panini divulgue números diferentes, a estrutura precisa ser ajustada.

---

## 🗂️ Histórico de iterações

### Iteração 1: Planilha Excel (xlsx)
- **Arquivo:** `Controle_Figurinhas_Copa_2026.xlsx`
- **3 abas:** Dashboard, Controle, Repetidas
- **Cores:** Identidade Enjatec completa (azul + amarelo)
- **6.178 fórmulas** sem erros
- Status: ✅ Aprovada pelo usuário

### Iteração 2: Primeiro widget interativo (chat)
- React/HTML com `window.storage` do Claude
- **Cores:** Azul Petróleo Enjatec
- Problema: layout sem formatação ao salvar HTML, clique fechava o grupo

### Iteração 3: Widget refeito (chat)
- CSS autocontido, correção do bug de propagação
- Atualização localizada (não re-renderiza tudo)
- Status: ✅ Aprovado parcialmente

### Iteração 4: Adição do modo impressão (chat)
- Aba "Imprimir" com 4 opções
- Layout A4 otimizado
- Responsivo para celular/tablet (10 colunas em tablet, 7 em celular)
- Toque longo no celular para diminuir (com vibração)
- Problema: HTML aparecia como código ao salvar no Drive

### Iteração 5 (FINAL): HTML standalone
- **Arquivo:** `Album_Copa_2026_Panini.html` (46 KB)
- **Apenas tons de azul e branco** (sem amarelo dominante)
- Multi-usuário (perfis separados no mesmo dispositivo)
- Sincronização manual (exportar/importar via código base64)
- Backup em arquivo JSON
- Salvamento em `localStorage`
- Status: ✅ Funcionando, hospedado no GitHub Pages

---

## 🎨 Design system atual (versão final em azul/branco)

### Paleta de cores final

```css
/* Primárias */
--azul-petroleo: #0F4C5C;
--azul-escuro: #0B3F4A;
--azul-medio: #185FA5;
--azul-claro: #378ADD;
--azul-suave: #85B7EB;
--azul-bg: #E6F1FB;
--azul-fundo: #DBEAFE;
--azul-borda: #BFDBFE;

/* Neutros */
--branco: #FFFFFF;
--bg-app: #F5F7FA;
--bg-card: #F8FAFC;
--bg-suave: #F1F5F9;
--borda: #E5E7EB;
--texto: #1F2937;
--texto-sec: #6B7280;
--texto-leve: #94A3B8;

/* Accent (uso pontual) */
--amarelo: #F4C430;     /* só badge de repetidas e botão imprimir */
--amarelo-escuro: #E0B52A;
--erro: #B91C1C;
--erro-bg: #FEE2E2;
```

### Tipografia

- **Fonte:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Hero h1: 22px, weight 700
- Section title: 14px, weight 700
- Body: 13px, weight 400/600
- Small: 11-12px

### Componentes principais

1. **Hero** - Header com gradient `#0F4C5C → #0B3F4A`, badge FIFA, círculos decorativos
2. **Tabs** - Pill-style, scroll horizontal em mobile
3. **KPIs** - Cards 4 colunas (2 em mobile)
4. **Progress card** - Card grande com gradient e barra amarela
5. **Cards de grupo** - Header com gradient, expandível
6. **Figurinhas** - Grid 20 colunas (10 tablet, 7 mobile), aspect-ratio 1:1
7. **Modal** - Overlay com backdrop blur

### Estados das figurinhas

| Estado | Cor de fundo | Cor do texto | Borda |
|---|---|---|---|
| Não tenho | `#fff` | `#94A3B8` | `#E5E7EB` |
| Tenho | gradient `#185FA5 → #0F4C5C` | `#fff` | `#0F4C5C` |
| Repetida | gradient `#DBEAFE → #BFDBFE` | `#1E3A8A` | `#378ADD` + badge amarelo |

---

## 🛠️ Funcionalidades implementadas

### Dashboard
- ✅ 4 KPIs (Total, Coladas, Faltam, Repetidas)
- ✅ Barra de progresso geral com %
- ✅ Lista de todos os grupos + especiais com barra de progresso individual
- ✅ Estatísticas por grupo (tenho, falta, repetidas)

### Controle
- ✅ Cards expansíveis por grupo
- ✅ Clique para marcar +1
- ✅ Toque longo (mobile) ou botão direito (desktop) para diminuir -1
- ✅ Vibração no mobile ao diminuir
- ✅ Contador por seleção e por grupo (atualizado em tempo real)
- ✅ Botões: Expandir todos, Recolher todos, Limpar tudo
- ✅ Legenda visual de cores

### Trocas
- ✅ Lista automática de figurinhas com qtd > 1
- ✅ Ordenação por grupo e seleção
- ✅ KPI total de repetidas e diferentes

### Imprimir (4 opções)
1. **Planilha completa em branco** - tabela A4 com todas as figurinhas vazias
2. **Planilha com progresso atual** - tabela A4 com marcações atuais
3. **Lista do que falta** - grid de 3 colunas com figurinhas faltantes
4. **Lista de repetidas** - grid de 3 colunas com figurinhas para troca

Cada opção:
- Abre em nova aba
- Header com data + progresso atual + nome do usuário
- Botões "🖨️ Imprimir" e "✕ Fechar"
- CSS `@media print` para esconder botões ao imprimir
- Otimizado para A4 (margens 1cm)

### Multi-usuário
- ✅ Botão "👤 Convidado" no header
- ✅ Modal para criar/trocar usuário
- ✅ Lista de usuários existentes no dispositivo
- ✅ Dados isolados por usuário no `localStorage`
- ✅ Nome do usuário aparece no progresso e nas impressões

### Sincronização (manual)
- ✅ Exportar como código base64 (copiar para WhatsApp)
- ✅ Baixar arquivo .json de backup
- ✅ Importar de outro dispositivo
- ✅ Validação de formato ao importar
- ✅ Confirmação antes de substituir dados

---

## 💾 Estrutura de dados

### LocalStorage Keys

```javascript
// Usuário atual selecionado
"album_user_atual" = "Anderson" | "Esposa" | "Filho" | etc.

// Dados de cada usuário (chave dinâmica)
"album_copa2026_v1_Anderson" = { ... }
"album_copa2026_v1_Esposa" = { ... }
"album_copa2026_v1_Filho" = { ... }
```

### Formato dos dados (JSON)

```json
{
  "A-MEX-1": 1,        // Grupo A, México, figurinha 1, tenho 1
  "A-MEX-2": 2,        // 2 repetidas
  "C-BRA-5": 3,        // Brasil figurinha 5, tenho 3
  "FWC-FWC-0": 1,      // FWC 00
  "CC-CC-3": 2         // Coca-Cola 3, 1 repetida
}
```

### Formato de export/import

```json
{
  "v": 1,
  "usuario": "Filho",
  "data": "2026-05-15T18:36:00.000Z",
  "dados": { ... }
}
```

Codificado em **base64** para facilitar copy/paste no WhatsApp.

---

## ⚠️ Problema atual e próximos passos

### Problema atual
**Sincronização manual é tediosa.** Usuário pediu que a esposa pudesse atualizar o álbum e ele ver automaticamente, mas:
- Como cada dispositivo salva localmente, não há sincronização automática
- Precisa exportar código → enviar no WhatsApp → importar no outro dispositivo

### Próxima iteração (NÃO IMPLEMENTADA AINDA)
Usuário quer **sincronização automática em tempo real** via:
- **Firebase Realtime Database** ou **Firestore** (Google, grátis até 1GB)
- Alternativa: Supabase (PostgreSQL, grátis)
- Alternativa: Google Sheets como banco (mais complicado)

### Tarefa para o Claude Code
1. Migrar `localStorage` para Firebase/Firestore
2. Criar lógica de sync em tempo real
3. Manter compatibilidade com modo offline (fallback para localStorage)
4. Adicionar autenticação simples (PIN da família ou Google Sign-in)
5. Indicador visual de "sincronizado" / "salvando" / "offline"

---

## 🚀 Hospedagem atual

- **GitHub Pages** (gratuito)
- Repositório: deve estar em `https://github.com/<usuario>/album-copa`
- URL pública: `https://<usuario>.github.io/album-copa/`
- Arquivo único: `index.html`

### Como atualizar
1. Editar `index.html` direto no GitHub (lápis ✏️)
2. Commit → publicação automática em ~1 minuto

---

## 📋 Estrutura de pastas sugerida para o Claude Code

```
C:\Users\Anderson\Claude-projetos\Album-copa\
├── README.md                          # Este arquivo
├── CONTEXTO-CONVERSA.md              # Histórico desta conversa
├── index.html                         # Versão atual standalone
├── /firebase/                         # Próxima versão com Firebase
│   ├── index.html
│   ├── firebase-config.js
│   └── ...
├── /backup-planilhas/
│   └── Controle_Figurinhas_Copa_2026.xlsx
└── /referencias/
    └── controle-figurinhas-copa-2026-MF.pdf
```

---

## 🎯 Decisões de design importantes

1. **Apenas azul e branco** - usuário explicitamente pediu, evitar amarelo dominante
2. **Mobile-first** - filho usa principalmente celular/tablet
3. **Toque longo no mobile** - substitui o botão direito do desktop para -1
4. **Vibração de feedback** - quando diminui no mobile (30ms)
5. **Salvamento automático** - sem botão "salvar", tudo é instantâneo
6. **Não re-renderizar tudo** - atualização localizada da figurinha + contadores
7. **Confirmação antes de ações destrutivas** - resetar coleção, importar dados

---

## 🐛 Bugs já resolvidos

1. ❌ ~~Layout sem formatação ao salvar HTML do widget~~ → CSS autocontido
2. ❌ ~~Clique na figurinha fechava o grupo~~ → `e.stopPropagation()`
3. ❌ ~~Re-render completo a cada clique (lento)~~ → Update localizado
4. ❌ ~~Código aparecia na tela ao abrir no Drive~~ → Hospedar no GitHub Pages
5. ❌ ~~Sem suporte a toque longo no mobile~~ → Implementado com `touchstart`
6. ❌ ~~KPIs apertados no celular~~ → 2 colunas em mobile
7. ❌ ~~Figurinhas pequenas no celular~~ → Grid adaptativo (7 em mobile, 10 em tablet)

---

## 💡 Ideias futuras (backlog)

- [ ] **Sincronização automática via Firebase** (PRIORIDADE ALTA)
- [ ] **PWA** - instalar como app no celular (manifest.json + service worker)
- [ ] **Modo escuro** - já que tem azul forte, ficaria ótimo
- [ ] **Estatísticas avançadas** - gastos, eficiência (figurinhas únicas por pacote)
- [ ] **Histórico de trocas** - registrar com quem trocou e quando
- [ ] **Comparação entre usuários** - "Você está 12% à frente do seu filho"
- [ ] **Notificações** - quando alguém da família completar um grupo
- [ ] **Quiz/jogos** - aprender sobre as seleções
- [ ] **Foto de cada figurinha** - galeria visual quando completar
- [ ] **Compartilhamento via QR code** - alternativa ao copy/paste do código
- [ ] **Modo "banca"** - lista priorizada do que comprar primeiro

---

## 📞 Contato/contexto Anderson

- Localização: João Monlevade, MG, Brasil
- Empresa: Enjatec (Calderaria, Usinagem, Manutenção e Montagem Industrial)
- Preferências de comunicação:
  - Direto e objetivo
  - Markdown bem formatado (headings, tabelas, blockquotes)
  - Scannável - clareza à primeira vista
  - Adaptativo, com humor leve quando apropriado
  - LaTeX apenas para matemática complexa

---

## 🔑 Prompt sugerido para começar no Claude Code

> Estou trabalhando no projeto **Álbum Copa 2026 Panini** localizado em `C:\Users\Anderson\Claude-projetos\Album-copa`. Leia o arquivo `CONTEXTO-CONVERSA.md` para entender todo o histórico.
>
> Próxima tarefa: **migrar o sistema de `localStorage` para Firebase Realtime Database**, permitindo sincronização automática entre os dispositivos da família (eu, esposa e meu filho). Mantenha:
> - Design atual em azul e branco
> - Todas as 4 abas (Dashboard, Controle, Trocas, Imprimir)
> - Multi-usuário
> - Funcionamento offline com fallback para localStorage
> - Indicador visual de status de sincronização

---

*Documento gerado em 15/05/2026 a partir da conversa Claude · Anthropic*
