# Classificação dos grupos + Chaveamento automático — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao bolão uma aba de Classificação da fase de grupos e fazer o Chaveamento se auto-preencher a partir dos resultados oficiais, seguindo a estrutura e os critérios da FIFA 2026, com override do admin.

**Architecture:** Toda a lógica nova é um conjunto de **funções puras** embutidas no `index.html` dentro de um bloco delimitado por sentinelas `/* ENGINE-TEST START */ … /* ENGINE-TEST END */`. Um harness Node (`tests/bolao-engine.test.js`, sem dependências) extrai esse bloco com `vm` e roda asserts reais — fonte única de verdade, arquivo único preservado. As funções recebem `resultados`/`desempate`/`overrides` como argumentos (testáveis); wrappers finos passam o estado global. A UI consome `computeBracketTeams()` e `computeStandings()`.

**Tech Stack:** HTML/JS vanilla (ES5-ish, como o resto do arquivo), Firebase Firestore (compat), Node `vm` + `node:assert/strict` para testes.

## Global Constraints

- **Arquivo de produção:** todo o app vive em `index.html` (raiz). Não criar build nem módulos externos carregados pelo browser.
- **Estilo de código:** seguir o existente — `var`, funções nomeadas, strings concatenadas, sem frameworks. Português nos rótulos de UI.
- **Não-destrutivo:** nunca apagar/zerar documentos. Todo save no Firestore usa `set(..., {merge:true})`. Só adicionar campos novos (`chaveOverride`, `desempate`) em `bolao_meta/dados`.
- **Sem regressão:** não alterar pontuação, ranking, pagamento, nem o lock de apostas (`lockJogo`/`kickoffJogo`).
- **Fuso:** todos os horários em Brasília (−03:00), como o resto do app.
- **Override sempre vence:** valor digitado pelo admin prevalece sobre o computado.
- **Critérios FIFA de desempate (grupo):** pontos → confronto direto (pts→SG→gols entre empatados) → SG geral → gols geral → override admin → ordem alfabética (provisória).
- **Critérios FIFA (terceiros entre grupos):** pontos → SG → gols → override admin → ordem do grupo (provisória). Sem confronto direto.
- Mensagem de commit termina com: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

- **Modify `index.html`:**
  - Bloco engine (sentinelas) com `THIRD_PLACE_TABLE`, `THIRD_SLOT_GROUPS`, `pontosJogo`, `computeStandings`, `rankThirds`, `resolveSlotToken`, `computeBracketTeams` — inserido logo após a definição de `BOLAO_CHAVE`/dados, antes de `auth.onAuthStateChanged`.
  - Reescrever `BOLAO_CHAVE` para a estrutura oficial 2026 (tokens de slot + datas/horários Brasília).
  - Novos globais: `bolaoChaveOverride = {}`, `bolaoDesempate = {}`.
  - `renderBolao()` menu: incluir `classificacao`. `renderBolaoSec()`: rotear.
  - Nova `renderBolaoClassificacao()`.
  - `renderBolaoChave()`: usar `getBracketTeams()` (computed+override) no lugar de `bolaoChaveEq`.
  - `carregarBolao()`/leitura de `bolao_meta`: carregar `chaveOverride` e `desempate`.
  - Painel admin: inputs de times viram override (placeholder = computado); nova seção "Desempates manuais"; `adminBolaoSalvar()` grava `chaveOverride`/`desempate`.
- **Create `tests/bolao-engine.test.js`** — harness Node.
- **Create `tests/thirdplace_lookup.json`** — já copiado (artefato validado, 495 combos).
- **Create `tests/gen-third-table.js`** — gera o literal JS de `THIRD_PLACE_TABLE` a partir do JSON.

---

### Task 1: Harness de teste + tabela das 495 combinações de terceiros

**Files:**
- Create: `tests/gen-third-table.js`
- Create: `tests/bolao-engine.test.js`
- Modify: `index.html` (inserir sentinelas + `THIRD_PLACE_TABLE` + `THIRD_SLOT_GROUPS`)
- Test artifact: `tests/thirdplace_lookup.json` (já existe)

**Interfaces:**
- Produces:
  - `THIRD_PLACE_TABLE` — objeto `{ "<8 letras ordenadas>": { "1A":"E","1B":"J","1D":"I","1E":"F","1G":"H","1I":"G","1K":"L","1L":"K" } }`, 495 chaves. Slots de vencedores que pegam terceiros: `1A,1B,1D,1E,1G,1I,1K,1L`. Valor = letra do grupo do terceiro.
  - `THIRD_SLOT_GROUPS` — `{ "1A":["C","E","F","H","I"], ... }`: para cada slot de vencedor, o conjunto ordenado de grupos que podem fornecer seu terceiro (derivado da tabela; usado só para rótulos de UI).
- Consumes: nada.

- [ ] **Step 1: Gerar o literal JS da tabela a partir do artefato validado**

Create `tests/gen-third-table.js`:

```js
// Gera, a partir de tests/thirdplace_lookup.json (495 combos já validados),
// o literal JS minificado de THIRD_PLACE_TABLE e o derivado THIRD_SLOT_GROUPS.
// Uso: node tests/gen-third-table.js
const fs = require('fs');
const path = require('path');
const lk = JSON.parse(fs.readFileSync(path.join(__dirname, 'thirdplace_lookup.json'), 'utf8'));
const keys = Object.keys(lk);
if (keys.length !== 495) throw new Error('esperado 495 combos, veio ' + keys.length);
const SLOTS = ['1A','1B','1D','1E','1G','1I','1K','1L'];
// integridade: cada valor é permutação dos 8 grupos da chave
for (const k of keys) {
  const v = lk[k];
  const got = SLOTS.map(s => v[s]).sort().join('');
  if (got !== k.split('').sort().join('')) throw new Error('integridade falhou em ' + k);
}
// deriva THIRD_SLOT_GROUPS
const slotGroups = {}; SLOTS.forEach(s => slotGroups[s] = new Set());
for (const k of keys) for (const s of SLOTS) slotGroups[s].add(lk[k][s]);
const slotGroupsObj = {}; SLOTS.forEach(s => slotGroupsObj[s] = [...slotGroups[s]].sort());
const tableLit = 'var THIRD_PLACE_TABLE=' + JSON.stringify(lk) + ';';
const slotLit = 'var THIRD_SLOT_GROUPS=' + JSON.stringify(slotGroupsObj) + ';';
fs.writeFileSync(path.join(__dirname, 'third-table.lit.js'), tableLit + '\n' + slotLit + '\n');
console.log('OK 495 combos; THIRD_SLOT_GROUPS:', JSON.stringify(slotGroupsObj));
```

- [ ] **Step 2: Rodar o gerador (valida integridade) e inspecionar a saída**

Run: `node tests/gen-third-table.js`
Expected: imprime `OK 495 combos; THIRD_SLOT_GROUPS: {"1A":["C","E","F","H","I"],...}` e cria `tests/third-table.lit.js`. Falha (throw) se a tabela divergir.

- [ ] **Step 3: Inserir as sentinelas + a tabela no `index.html`**

No `index.html`, localizar a linha `var GRUPOS = {` (≈625) e inserir IMEDIATAMENTE ACIMA dela a sentinela de abertura:

```js
/* ENGINE-TEST START */
```

Localizar a linha `auth.onAuthStateChanged((user) => {` (≈777) e inserir IMEDIATAMENTE ACIMA dela a sentinela de fechamento, precedida do conteúdo de `tests/third-table.lit.js` (colar o conteúdo literal das duas linhas `var THIRD_PLACE_TABLE=…;` e `var THIRD_SLOT_GROUPS=…;`):

```js
// ===== Engine do Bolão (classificação + chaveamento automático) — funções puras =====
var THIRD_PLACE_TABLE={...};   /* colar literal gerado no Step 2 */
var THIRD_SLOT_GROUPS={...};   /* colar literal gerado no Step 2 */
/* ENGINE-TEST END */
```

(Tudo entre as sentinelas — `GRUPOS`, `FLAGS`, `flagImg`, `BOLAO_SCHED`, `BOLAO_JOGOS`, `BOLAO_CHAVE`, `CIDADES_BR`, os `var currentUser…`, `PIX_*`, `QR_PIX_B64` e a tabela — é puro/dado, sem acesso a DOM/Firebase, logo avaliável em Node.)

- [ ] **Step 4: Escrever o harness de teste com a primeira asserção (tabela)**

Create `tests/bolao-engine.test.js`:

```js
// Harness sem dependências: extrai o bloco /* ENGINE-TEST START..END */ do
// index.html e avalia em um sandbox vm. Roda com: node tests/bolao-engine.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\* ENGINE-TEST START \*\/([\s\S]*?)\/\* ENGINE-TEST END \*\//);
if (!m) throw new Error('Sentinelas ENGINE-TEST não encontradas no index.html');
const sandbox = {};
vm.createContext(sandbox);
// stubs mínimos para código não-DOM dentro do bloco
vm.runInContext('var window={};var navigator={};var document={};', sandbox);
vm.runInContext(m[1], sandbox);

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }

// ---- Tabela dos terceiros ----
test('THIRD_PLACE_TABLE tem 495 combinações', () => {
  assert.equal(Object.keys(sandbox.THIRD_PLACE_TABLE).length, 495);
});
test('THIRD_PLACE_TABLE: alocação é permutação dos grupos da chave', () => {
  const SLOTS = ['1A','1B','1D','1E','1G','1I','1K','1L'];
  for (const k of Object.keys(sandbox.THIRD_PLACE_TABLE)) {
    const v = sandbox.THIRD_PLACE_TABLE[k];
    assert.equal(SLOTS.map(s => v[s]).sort().join(''), k.split('').sort().join(''), 'chave ' + k);
  }
});
test('THIRD_PLACE_TABLE: linha conhecida EFGHIJKL', () => {
  assert.deepEqual(sandbox.THIRD_PLACE_TABLE['EFGHIJKL'],
    {'1A':'E','1B':'J','1D':'I','1E':'F','1G':'H','1I':'G','1K':'L','1L':'K'});
});

console.log('\n' + passed + ' testes OK');
```

- [ ] **Step 5: Rodar os testes**

Run: `node tests/bolao-engine.test.js`
Expected: 3 testes ✓, termina com `3 testes OK`.

- [ ] **Step 6: Commit**

```bash
git add tests/ index.html
git commit -m "feat(bolao): embute tabela oficial dos 8 melhores terceiros (495 combinacoes) + harness de teste

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `computeStandings` — classificação de um grupo com desempate FIFA

**Files:**
- Modify: `index.html` (adicionar funções dentro do bloco ENGINE-TEST, após a tabela)
- Test: `tests/bolao-engine.test.js`

**Interfaces:**
- Consumes: `GRUPOS`, `BOLAO_JOGOS` (globais do bloco).
- Produces:
  - `pontosJogo(gc, gv)` → `[ptsCasa, ptsVis]`.
  - `computeStandings(grupo, RES, DES)` → array de 4 entradas ordenadas
    `{cod, nome, P, V, E, D, gp, gc, sg, pts, pos, provisorio}` (pos 1..4).
    `RES` = mapa de resultados `{ '<jogoId>': {c,v} }`; `DES` = `{ '<grupo>': [siglas em ordem] }`.

- [ ] **Step 1: Escrever os testes (falhando)**

Adicionar em `tests/bolao-engine.test.js`, antes do `console.log` final:

```js
const G = sandbox; // alias
// helper: monta RES a partir de pares [jogoId, c, v]
function mkRes(arr){ const r={}; arr.forEach(([id,c,v])=>r[id]={c,v}); return r; }

test('computeStandings: ordenação simples por pontos', () => {
  // Grupo A: MEX, RSA, KOR, CZE. IDs A_R*: ver BOLAO_JOGOS.
  // Faz MEX ganhar tudo, CZE perder tudo.
  const ids = G.BOLAO_JOGOS.filter(j => j.grupo === 'A');
  // monta resultados: casa sempre 2x0 quando casa é MEX, etc. Mais simples: define por jogo.
  const RES = {};
  ids.forEach(j => {
    // MEX (t0) vence; CZE (t3) perde; RSA(t1) > KOR(t2)
    const rank = {MEX:4, RSA:3, KOR:2, CZE:1};
    const dc = rank[j.casa] - rank[j.vis];
    RES[j.id] = dc > 0 ? {c:1,v:0} : dc < 0 ? {c:0,v:1} : {c:0,v:0};
  });
  const st = G.computeStandings('A', RES, {});
  assert.deepEqual(st.map(t => t.cod), ['MEX','RSA','KOR','CZE']);
  assert.equal(st[0].pos, 1);
  assert.equal(st[0].V, 3);
  assert.equal(st[3].D, 3);
});

test('computeStandings: empate em pontos resolvido por saldo geral', () => {
  // dois times 6 pts: decide saldo. Construímos: KOR e RSA com 6 pts, KOR saldo maior.
  const ids = G.BOLAO_JOGOS.filter(j => j.grupo === 'A');
  const RES = {};
  ids.forEach(j => {
    const pair = [j.casa, j.vis];
    // MEX perde tudo; CZE perde tudo; RSA e KOR ganham dos fracos; entre si empatam 0x0
    const strong = {RSA:1, KOR:1}, weak = {MEX:1, CZE:1};
    if (strong[j.casa] && weak[j.vis]) RES[j.id] = {c:1,v:0};
    else if (weak[j.casa] && strong[j.vis]) RES[j.id] = {c:0,v:1};
    else if (strong[j.casa] && strong[j.vis]) RES[j.id] = {c:0,v:0}; // RSA x KOR empate
    else RES[j.id] = {c:0,v:0}; // MEX x CZE
  });
  // Dá a KOR um saldo maior: quando KOR é casa contra fraco faz 3x0
  ids.forEach(j => { if (j.casa === 'KOR') RES[j.id] = {c:3,v:0}; if (j.vis === 'KOR' && (j.casa==='MEX'||j.casa==='CZE')) RES[j.id] = {c:0,v:3}; });
  const st = G.computeStandings('A', RES, {});
  // KOR e RSA empatam em pontos no topo; KOR tem saldo maior
  assert.equal(st[0].cod, 'KOR');
});

test('computeStandings: empate total usa override do admin', () => {
  // Todos 0x0: 4 times com 3 pts cada (cada um empata? não). Forçamos empate total
  // simples: nenhum jogo -> todos 0 pts, empate total -> override define a ordem.
  const st = G.computeStandings('A', {}, {A:['CZE','KOR','RSA','MEX']});
  assert.deepEqual(st.map(t => t.cod), ['CZE','KOR','RSA','MEX']);
  assert.ok(st.every(t => t.provisorio === false));
});

test('computeStandings: empate total sem override é provisório (alfabético por grupo)', () => {
  const st = G.computeStandings('A', {}, {});
  assert.ok(st.every(t => t.provisorio === true));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/bolao-engine.test.js`
Expected: FALHA com `TypeError: G.computeStandings is not a function`.

- [ ] **Step 3: Implementar as funções**

Inserir no bloco ENGINE-TEST do `index.html` (após `THIRD_SLOT_GROUPS`):

```js
function pontosJogo(gc, gv) { return gc > gv ? [3, 0] : gc < gv ? [0, 3] : [1, 1]; }

// Mini-tabela de confronto direto entre um subconjunto de siglas.
function _h2h(subset, grupo, RES) {
  var inSet = {}; subset.forEach(function(c){ inSet[c] = {pts:0, sg:0, gp:0}; });
  BOLAO_JOGOS.filter(function(j){ return j.grupo === grupo; }).forEach(function(j){
    if (!inSet[j.casa] || !inSet[j.vis]) return; // só jogos entre os empatados
    var r = RES[j.id]; if (!r || r.c == null || r.v == null) return;
    var p = pontosJogo(r.c, r.v);
    inSet[j.casa].pts += p[0]; inSet[j.vis].pts += p[1];
    inSet[j.casa].sg += (r.c - r.v); inSet[j.vis].sg += (r.v - r.c);
    inSet[j.casa].gp += r.c; inSet[j.vis].gp += r.v;
  });
  return inSet;
}

function computeStandings(grupo, RES, DES) {
  RES = RES || {}; DES = DES || {};
  var times = GRUPOS[grupo].map(function(t){
    return {cod:t[1], nome:t[0], P:0, V:0, E:0, D:0, gp:0, gc:0, sg:0, pts:0, pos:0, provisorio:false};
  });
  var idx = {}; times.forEach(function(t){ idx[t.cod] = t; });
  BOLAO_JOGOS.filter(function(j){ return j.grupo === grupo; }).forEach(function(j){
    var r = RES[j.id]; if (!r || r.c == null || r.v == null) return;
    var c = idx[j.casa], v = idx[j.vis];
    c.P++; v.P++; c.gp += r.c; c.gc += r.v; v.gp += r.v; v.gc += r.c;
    if (r.c > r.v) { c.V++; v.D++; c.pts += 3; }
    else if (r.c < r.v) { v.V++; c.D++; v.pts += 3; }
    else { c.E++; v.E++; c.pts++; v.pts++; }
  });
  times.forEach(function(t){ t.sg = t.gp - t.gc; });

  var ovr = DES[grupo] || null; // ordem manual de siglas (desempate total)
  function ovrIdx(cod){ return ovr ? ovr.indexOf(cod) : -1; }

  // Ordena: pts desc; dentro do mesmo pts aplica h2h, depois sg/gp gerais, override, alfabético.
  times.sort(function(a, b){
    if (b.pts !== a.pts) return b.pts - a.pts;
    return 0; // resolvido por grupo de empate abaixo
  });
  // resolve grupos de pts iguais
  var out = []; var i = 0;
  while (i < times.length) {
    var j = i; while (j < times.length && times[j].pts === times[i].pts) j++;
    var grp = times.slice(i, j);
    if (grp.length > 1) {
      var h = _h2h(grp.map(function(t){ return t.cod; }), grupo, RES);
      grp.sort(function(a, b){
        var ha = h[a.cod], hb = h[b.cod];
        if (hb.pts !== ha.pts) return hb.pts - ha.pts;
        if (hb.sg !== ha.sg) return hb.sg - ha.sg;
        if (hb.gp !== ha.gp) return hb.gp - ha.gp;
        if (b.sg !== a.sg) return b.sg - a.sg;
        if (b.gp !== a.gp) return b.gp - a.gp;
        // ainda empatado: override do admin
        var ia = ovrIdx(a.cod), ib = ovrIdx(b.cod);
        if (ia !== -1 && ib !== -1) return ia - ib;
        a.provisorio = b.provisorio = true; // sem critério oficial -> provisório
        return a.cod < b.cod ? -1 : 1; // alfabético estável
      });
    }
    grp.forEach(function(t){ out.push(t); });
    i = j;
  }
  out.forEach(function(t, k){ t.pos = k + 1; });
  return out;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node tests/bolao-engine.test.js`
Expected: todos os testes ✓ (3 da Task 1 + 4 novos = 7).

- [ ] **Step 5: Commit**

```bash
git add index.html tests/bolao-engine.test.js
git commit -m "feat(bolao): computeStandings com criterios de desempate FIFA

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `rankThirds` — ranking dos 12 terceiros e os 8 classificados

**Files:**
- Modify: `index.html` (bloco ENGINE-TEST)
- Test: `tests/bolao-engine.test.js`

**Interfaces:**
- Consumes: `GRUPOS`, `BOLAO_JOGOS`, `computeStandings`.
- Produces: `rankThirds(RES, DES)` → array de até 12 entradas
  `{grupo, cod, pts, sg, gp, classificado, parcial, provisorio}`, ordenado do melhor
  para o pior. `classificado=true` nos 8 primeiros (quando há ≥8 grupos com fase
  completa). `DES.thirds` = array de letras de grupo em ordem manual (desempate).

- [ ] **Step 1: Escrever os testes (falhando)**

Adicionar em `tests/bolao-engine.test.js`:

```js
// Helper: gera RES "grupo completo" onde a ordem final é t0>t1>t2>t3 com pontos controlados.
function grupoCompleto(grupo, golsTerceiro) {
  // Faz t0 e t1 vencerem; define o 3º (t2) com 'golsTerceiro' de saldo.
  const ids = G.BOLAO_JOGOS.filter(j => j.grupo === grupo);
  const order = G.GRUPOS[grupo].map(t => t[1]); // [t0,t1,t2,t3]
  const rank = {}; order.forEach((c, i) => rank[c] = order.length - i); // t0 maior
  const RES = {};
  ids.forEach(j => {
    const dc = rank[j.casa] - rank[j.vis];
    if (dc > 0) RES[j.id] = {c:2, v:0};
    else RES[j.id] = {c:0, v:2};
  });
  // ajusta gols do 3º colocado (t2) para empatar testes de saldo
  return RES;
}

test('rankThirds: 12 grupos completos -> 8 classificados', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  const r = G.rankThirds(RES, {});
  assert.equal(r.length, 12);
  assert.equal(r.filter(x => x.classificado).length, 8);
  assert.ok(r.every(x => x.parcial === false));
  // ordenado desc por pts depois sg
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i-1].pts > r[i].pts || (r[i-1].pts === r[i].pts && r[i-1].sg >= r[i].sg));
  }
});

test('rankThirds: grupo incompleto marca parcial e não classifica ninguém ainda', () => {
  const r = G.rankThirds({}, {});
  assert.ok(r.length === 0 || r.every(x => x.classificado === false));
});

test('rankThirds: empate de pts/sg/gp resolvido por override de grupos', () => {
  // dois terceiros idênticos: override define qual vem antes
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  const r = G.rankThirds(RES, {thirds:['L','A','B','C','D','E','F','G','H','I','J','K']});
  // entre terceiros empatados, a ordem segue 'thirds'
  const empatados = r.filter(x => x.pts === r[0].pts && x.sg === r[0].sg && x.gp === r[0].gp);
  if (empatados.length > 1) {
    const pos = empatados.map(x => ['L','A','B','C','D','E','F','G','H','I','J','K'].indexOf(x.grupo));
    for (let i = 1; i < pos.length; i++) assert.ok(pos[i] > pos[i-1]);
  }
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/bolao-engine.test.js`
Expected: FALHA com `G.rankThirds is not a function`.

- [ ] **Step 3: Implementar**

Inserir no bloco ENGINE-TEST:

```js
// Um grupo está "completo" quando seus 6 jogos têm resultado.
function _grupoCompleto(grupo, RES) {
  return BOLAO_JOGOS.filter(function(j){ return j.grupo === grupo; })
    .every(function(j){ var r = RES[j.id]; return r && r.c != null && r.v != null; });
}

function rankThirds(RES, DES) {
  RES = RES || {}; DES = DES || {};
  var ovr = (DES.thirds || null);
  function ovrIdx(g){ return ovr ? ovr.indexOf(g) : -1; }
  var arr = [];
  Object.keys(GRUPOS).forEach(function(g){
    var completo = _grupoCompleto(g, RES);
    var st = computeStandings(g, RES, DES);
    var t = st[2]; // 3º colocado
    if (!t) return;
    arr.push({grupo:g, cod:t.cod, pts:t.pts, sg:t.sg, gp:t.gp,
              classificado:false, parcial:!completo, provisorio:false});
  });
  arr.sort(function(a, b){
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    if (b.gp !== a.gp) return b.gp - a.gp;
    var ia = ovrIdx(a.grupo), ib = ovrIdx(b.grupo);
    if (ia !== -1 && ib !== -1) return ia - ib;
    a.provisorio = b.provisorio = true;
    return a.grupo < b.grupo ? -1 : 1;
  });
  // Só marca os 8 classificados quando os 12 grupos estão completos
  var todosCompletos = Object.keys(GRUPOS).every(function(g){ return _grupoCompleto(g, RES); });
  if (todosCompletos) for (var k = 0; k < 8 && k < arr.length; k++) arr[k].classificado = true;
  return arr;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node tests/bolao-engine.test.js`
Expected: 10 testes ✓.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/bolao-engine.test.js
git commit -m "feat(bolao): rankThirds ranqueia os 12 terceiros e marca os 8 classificados

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Reescrever `BOLAO_CHAVE` para a estrutura oficial 2026

**Files:**
- Modify: `index.html` (substituir `const BOLAO_CHAVE = [...]`, ≈705-721)
- Test: `tests/bolao-engine.test.js`

**Interfaces:**
- Produces: `BOLAO_CHAVE` reescrito. Cada jogo: `{id, fase, num, cL, vL, data, hora}`.
  Tokens de slot em `cL`/`vL`:
  - `1A`..`2L`/`3X` — colocado de grupo.
  - `T1A`,`T1B`,`T1D`,`T1E`,`T1G`,`T1I`,`T1K`,`T1L` — terceiro alocado ao slot do vencedor.
  - `W#<id>` — vencedor do jogo `<id>`. `L#<id>` — perdedor do jogo `<id>`.
  - Fases: `rodada32`(16), `oitavas`(8), `quartas`(4), `semi`(2), `terceiro`(1), `final`(1). **Sem `semifinal` duplicada.**

- [ ] **Step 1: Escrever os testes (falhando)**

Adicionar em `tests/bolao-engine.test.js`:

```js
test('BOLAO_CHAVE: contagem por fase oficial', () => {
  const cnt = {};
  G.BOLAO_CHAVE.forEach(j => cnt[j.fase] = (cnt[j.fase]||0)+1);
  assert.deepEqual(cnt, {rodada32:16, oitavas:8, quartas:4, semi:2, terceiro:1, final:1});
});
test('BOLAO_CHAVE: R32 jogo 7 = 1A vs terceiro do slot 1A', () => {
  const j = G.BOLAO_CHAVE.find(x => x.num === 79 && x.fase === 'rodada32');
  assert.equal(j.cL, '1A'); assert.equal(j.vL, 'T1A');
});
test('BOLAO_CHAVE: oitava 89 = vencedores dos jogos 74 e 77', () => {
  const r32 = id => G.BOLAO_CHAVE.find(x => x.num === id && x.fase === 'rodada32').id;
  const j = G.BOLAO_CHAVE.find(x => x.num === 89 && x.fase === 'oitavas');
  assert.equal(j.cL, 'W#' + r32(74)); assert.equal(j.vL, 'W#' + r32(77));
});
test('BOLAO_CHAVE: 3º lugar usa perdedores das semis; final usa vencedores', () => {
  const sf = n => G.BOLAO_CHAVE.find(x => x.fase === 'semi' && x.num === n).id;
  const ter = G.BOLAO_CHAVE.find(x => x.fase === 'terceiro');
  const fin = G.BOLAO_CHAVE.find(x => x.fase === 'final');
  assert.equal(ter.cL, 'L#' + sf(1)); assert.equal(ter.vL, 'L#' + sf(2));
  assert.equal(fin.cL, 'W#' + sf(1)); assert.equal(fin.vL, 'W#' + sf(2));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/bolao-engine.test.js`
Expected: FALHA nas novas asserções (estrutura antiga).

- [ ] **Step 3: Substituir `BOLAO_CHAVE`**

Substituir o bloco `const BOLAO_CHAVE = [ ... ];` (≈705-721) por:

```js
// Mata-mata OFICIAL Copa 2026 (jogos 73–104). Horários em Brasília (−03:00).
// Tokens: 1X/2X/3X=colocado; T1X=terceiro alocado ao slot do vencedor 1X;
// W#id / L#id = vencedor/perdedor de outro jogo.
const BOLAO_CHAVE = [
  // Rodada de 32 (73–88)
  {id:'R32_01',fase:'rodada32',num:73,cL:'2A',vL:'2B',data:'2026-06-28',hora:'16:00'},
  {id:'R32_02',fase:'rodada32',num:74,cL:'1E',vL:'T1E',data:'2026-06-29',hora:'17:30'},
  {id:'R32_03',fase:'rodada32',num:75,cL:'1F',vL:'2C',data:'2026-06-29',hora:'22:00'},
  {id:'R32_04',fase:'rodada32',num:76,cL:'1C',vL:'2F',data:'2026-06-29',hora:'14:00'},
  {id:'R32_05',fase:'rodada32',num:77,cL:'1I',vL:'T1I',data:'2026-06-30',hora:'18:00'},
  {id:'R32_06',fase:'rodada32',num:78,cL:'2E',vL:'2I',data:'2026-06-30',hora:'14:00'},
  {id:'R32_07',fase:'rodada32',num:79,cL:'1A',vL:'T1A',data:'2026-06-30',hora:'22:00'},
  {id:'R32_08',fase:'rodada32',num:80,cL:'1L',vL:'T1L',data:'2026-07-01',hora:'13:00'},
  {id:'R32_09',fase:'rodada32',num:81,cL:'1D',vL:'T1D',data:'2026-07-01',hora:'21:00'},
  {id:'R32_10',fase:'rodada32',num:82,cL:'1G',vL:'T1G',data:'2026-07-01',hora:'17:00'},
  {id:'R32_11',fase:'rodada32',num:83,cL:'2K',vL:'2L',data:'2026-07-02',hora:'20:00'},
  {id:'R32_12',fase:'rodada32',num:84,cL:'1H',vL:'2J',data:'2026-07-02',hora:'16:00'},
  {id:'R32_13',fase:'rodada32',num:85,cL:'1B',vL:'T1B',data:'2026-07-03',hora:'00:00'},
  {id:'R32_14',fase:'rodada32',num:86,cL:'1J',vL:'2H',data:'2026-07-03',hora:'19:00'},
  {id:'R32_15',fase:'rodada32',num:87,cL:'1K',vL:'T1K',data:'2026-07-03',hora:'22:30'},
  {id:'R32_16',fase:'rodada32',num:88,cL:'2D',vL:'2G',data:'2026-07-03',hora:'15:00'},
  // Oitavas (89–96)
  {id:'R16_01',fase:'oitavas',num:89,cL:'W#R32_02',vL:'W#R32_05',data:'2026-07-04',hora:'18:00'},
  {id:'R16_02',fase:'oitavas',num:90,cL:'W#R32_01',vL:'W#R32_03',data:'2026-07-04',hora:'14:00'},
  {id:'R16_03',fase:'oitavas',num:91,cL:'W#R32_04',vL:'W#R32_06',data:'2026-07-05',hora:'17:00'},
  {id:'R16_04',fase:'oitavas',num:92,cL:'W#R32_07',vL:'W#R32_08',data:'2026-07-05',hora:'21:00'},
  {id:'R16_05',fase:'oitavas',num:93,cL:'W#R32_11',vL:'W#R32_12',data:'2026-07-06',hora:'16:00'},
  {id:'R16_06',fase:'oitavas',num:94,cL:'W#R32_09',vL:'W#R32_10',data:'2026-07-06',hora:'21:00'},
  {id:'R16_07',fase:'oitavas',num:95,cL:'W#R32_14',vL:'W#R32_16',data:'2026-07-07',hora:'13:00'},
  {id:'R16_08',fase:'oitavas',num:96,cL:'W#R32_13',vL:'W#R32_15',data:'2026-07-07',hora:'17:00'},
  // Quartas (97–100)
  {id:'QF_01',fase:'quartas',num:97,cL:'W#R16_01',vL:'W#R16_02',data:'2026-07-09',hora:'17:00'},
  {id:'QF_02',fase:'quartas',num:98,cL:'W#R16_05',vL:'W#R16_06',data:'2026-07-10',hora:'16:00'},
  {id:'QF_03',fase:'quartas',num:99,cL:'W#R16_03',vL:'W#R16_04',data:'2026-07-11',hora:'18:00'},
  {id:'QF_04',fase:'quartas',num:100,cL:'W#R16_07',vL:'W#R16_08',data:'2026-07-11',hora:'22:00'},
  // Semifinais (101–102)
  {id:'SF_01',fase:'semi',num:1,cL:'W#QF_01',vL:'W#QF_02',data:'2026-07-14',hora:'16:00'},
  {id:'SF_02',fase:'semi',num:2,cL:'W#QF_03',vL:'W#QF_04',data:'2026-07-15',hora:'16:00'},
  // 3º lugar (103) e Final (104)
  {id:'3RD',fase:'terceiro',num:1,cL:'L#SF_01',vL:'L#SF_02',data:'2026-07-18',hora:'18:00'},
  {id:'FIN',fase:'final',num:1,cL:'W#SF_01',vL:'W#SF_02',data:'2026-07-19',hora:'16:00'}
];
```

Nota: o token `num` para R32/oitavas/quartas é o número oficial do jogo (73–100); para semis/3º/final volta a ser sequencial dentro da fase, como o resto do app usa só para exibição.

- [ ] **Step 4: Rodar e ver passar**

Run: `node tests/bolao-engine.test.js`
Expected: 14 testes ✓.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/bolao-engine.test.js
git commit -m "feat(bolao): bracket oficial Copa 2026 (jogos 73-104, sem semifinal duplicada)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `computeBracketTeams` — auto-preenchimento + override

**Files:**
- Modify: `index.html` (bloco ENGINE-TEST: `resolveSlotToken`, `computeBracketTeams`)
- Test: `tests/bolao-engine.test.js`

**Interfaces:**
- Consumes: `GRUPOS`, `BOLAO_CHAVE`, `computeStandings`, `rankThirds`, `THIRD_PLACE_TABLE`.
- Produces:
  - `vencedorJogo(id, RES, teams)` → sigla vencedora (empate usa `RES[id].pen` = 'c'|'v'); `null` se indefinido.
  - `computeBracketTeams(RES, DES, OVR)` → `{ '<id>_c': SIGLA, '<id>_v': SIGLA }`
    com TODOS os slots determináveis. `OVR` (override do admin, mesmo formato)
    sempre prevalece. Slots indetermináveis ficam ausentes.

- [ ] **Step 1: Escrever os testes (falhando)**

Adicionar em `tests/bolao-engine.test.js`:

```js
test('computeBracketTeams: 1º/2º diretos preenchem R32', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  const teams = G.computeBracketTeams(RES, {}, {});
  // R32_01 = 2A vs 2B
  const st = (g) => G.computeStandings(g, RES, {});
  assert.equal(teams['R32_01_c'], st('A')[1].cod); // 2A
  assert.equal(teams['R32_01_v'], st('B')[1].cod); // 2B
  // R32_04 = 1C vs 2F
  assert.equal(teams['R32_04_c'], st('C')[0].cod); // 1C
});

test('computeBracketTeams: terceiros alocados via tabela das 495', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  const teams = G.computeBracketTeams(RES, {}, {});
  const ranked = G.rankThirds(RES, {});
  const quals = ranked.filter(x => x.classificado).map(x => x.grupo).sort().join('');
  const combo = G.THIRD_PLACE_TABLE[quals];
  assert.ok(combo, 'combinação ' + quals + ' deve existir na tabela');
  // R32_07 (num 79) = 1A vs T1A -> terceiro do grupo combo['1A']
  const terceiroGrupoA = combo['1A'];
  assert.equal(teams['R32_07_v'], G.computeStandings(terceiroGrupoA, RES, {})[2].cod);
});

test('computeBracketTeams: avança vencedor para a oitava', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  // resolve R32_02 com placar (casa vence)
  RES['R32_02'] = {c:1, v:0};
  RES['R32_05'] = {c:0, v:2};
  const teams = G.computeBracketTeams(RES, {}, {});
  // R16_01 cL = W#R32_02 = casa do R32_02
  assert.equal(teams['R16_01_c'], teams['R32_02_c']);
  assert.equal(teams['R16_01_v'], teams['R32_05_v']);
});

test('computeBracketTeams: override do admin prevalece', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  const teams = G.computeBracketTeams(RES, {}, {'R32_01_c':'XXX'});
  assert.equal(teams['R32_01_c'], 'XXX');
});

test('computeBracketTeams: empate na oitava usa pen', () => {
  let RES = {};
  for (const g of Object.keys(G.GRUPOS)) Object.assign(RES, grupoCompleto(g));
  RES['R32_02'] = {c:1, v:1, pen:'v'}; // empate, passa o visitante
  RES['R32_05'] = {c:2, v:0};
  const teams = G.computeBracketTeams(RES, {}, {});
  assert.equal(teams['R16_01_c'], teams['R32_02_v']); // visitante avançou
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node tests/bolao-engine.test.js`
Expected: FALHA com `G.computeBracketTeams is not a function`.

- [ ] **Step 3: Implementar**

Inserir no bloco ENGINE-TEST:

```js
function vencedorJogo(id, RES, teams) {
  var r = RES[id]; if (!r || r.c == null || r.v == null) return null;
  var c = teams[id + '_c'], v = teams[id + '_v'];
  if (c == null || v == null) return null;
  if (r.c > r.v) return c;
  if (r.c < r.v) return v;
  return r.pen === 'c' ? c : r.pen === 'v' ? v : null; // empate sem pen = indefinido
}
function perdedorJogo(id, RES, teams) {
  var r = RES[id]; if (!r || r.c == null || r.v == null) return null;
  var c = teams[id + '_c'], v = teams[id + '_v'];
  if (c == null || v == null) return null;
  if (r.c > r.v) return v;
  if (r.c < r.v) return c;
  return r.pen === 'c' ? v : r.pen === 'v' ? c : null;
}

function computeBracketTeams(RES, DES, OVR) {
  RES = RES || {}; DES = DES || {}; OVR = OVR || {};
  // 1) slots de grupo 1X/2X/3X
  var slot = {};
  Object.keys(GRUPOS).forEach(function(g){
    var st = computeStandings(g, RES, DES);
    if (st[0]) slot['1' + g] = st[0].cod;
    if (st[1]) slot['2' + g] = st[1].cod;
    if (st[2]) slot['3' + g] = st[2].cod;
  });
  // 2) combinação dos terceiros (só quando há 8 classificados)
  var ranked = rankThirds(RES, DES);
  var quals = ranked.filter(function(x){ return x.classificado; }).map(function(x){ return x.grupo; });
  var combo = (quals.length === 8) ? THIRD_PLACE_TABLE[quals.slice().sort().join('')] : null;

  var teams = {};
  function resolve(token) {
    if (/^[123][A-L]$/.test(token)) return slot[token] || null;
    if (/^T1[A-L]$/.test(token)) {
      if (!combo) return null;
      var grp = combo[token.slice(1)]; // 'T1E' -> '1E'
      return grp ? (slot['3' + grp] || null) : null;
    }
    if (token.indexOf('W#') === 0) return vencedorJogo(token.slice(2), RES, teams);
    if (token.indexOf('L#') === 0) return perdedorJogo(token.slice(2), RES, teams);
    return null;
  }
  // BOLAO_CHAVE já está em ordem de fase -> dependências resolvidas em sequência
  BOLAO_CHAVE.forEach(function(j){
    var c = (OVR[j.id + '_c'] != null && OVR[j.id + '_c'] !== '') ? OVR[j.id + '_c'] : resolve(j.cL);
    var v = (OVR[j.id + '_v'] != null && OVR[j.id + '_v'] !== '') ? OVR[j.id + '_v'] : resolve(j.vL);
    if (c) teams[j.id + '_c'] = c;
    if (v) teams[j.id + '_v'] = v;
  });
  return teams;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node tests/bolao-engine.test.js`
Expected: 19 testes ✓.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/bolao-engine.test.js
git commit -m "feat(bolao): computeBracketTeams auto-preenche o chaveamento + override admin

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wrappers globais + carregar override/desempate do Firestore

**Files:**
- Modify: `index.html` — `carregarBolao()` / leitura de `bolao_meta/dados`; novos globais; `adminBolao()` leitura.
- Test: verificação manual (estado/leitura).

**Interfaces:**
- Consumes: `computeBracketTeams`, `computeStandings`, `rankThirds`.
- Produces:
  - Globais: `var bolaoChaveOverride = {};` `var bolaoDesempate = {};`
  - `getBracketTeams()` → `computeBracketTeams(bolaoResultados, bolaoDesempate, bolaoChaveOverride)`.
  - `getStandings(grupo)` → `computeStandings(grupo, bolaoResultados, bolaoDesempate)`.
  - `getThirds()` → `rankThirds(bolaoResultados, bolaoDesempate)`.

- [ ] **Step 1: Adicionar globais e wrappers**

Perto dos outros globais do bolão (≈743-748, `var bolaoChaveEq = {};`), adicionar:

```js
var bolaoChaveOverride = {}; // override manual do admin por slot {id_c:SIGLA}
var bolaoDesempate = {};     // desempates manuais {grupo:[siglas], thirds:[grupos]}
```

Logo após as funções engine (mas FORA do bloco ENGINE-TEST, pois usam estado global), adicionar:

```js
function getBracketTeams() { return computeBracketTeams(bolaoResultados, bolaoDesempate, bolaoChaveOverride); }
function getStandings(grupo) { return computeStandings(grupo, bolaoResultados, bolaoDesempate); }
function getThirds() { return rankThirds(bolaoResultados, bolaoDesempate); }
```

- [ ] **Step 2: Carregar os novos campos ao ler `bolao_meta/dados`**

Localizar onde `bolaoChaveEq=md.chave||{};` é setado na leitura do meta (≈2181) e adicionar nas mesmas leituras (tanto em `carregarBolao` quanto em `adminBolao`):

```js
bolaoChaveOverride = md.chaveOverride || {};
bolaoDesempate = md.desempate || {};
// retrocompat: se existir 'chave' legado e não houver override, usa como override inicial
if (Object.keys(bolaoChaveOverride).length === 0 && md.chave) bolaoChaveOverride = md.chave;
```

(No `adminBolao`, a variável local equivalente é `chave=meta.chave||{}`; adicionar `var chaveOverride=meta.chaveOverride||chave; var desempate=meta.desempate||{};` e setar os globais.)

- [ ] **Step 3: Verificação manual da leitura**

Abrir o app logado, ir no Bolão. Confirmar no console do navegador:
Run (DevTools console): `getBracketTeams()` e `getStandings('C')`
Expected: retornam objetos sem erro (vazios/parciais se ainda não há resultados). Sem exceções.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(bolao): wrappers globais e leitura de chaveOverride/desempate do Firestore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Aba "📊 Classificação"

**Files:**
- Modify: `index.html` — `renderBolao()` menu, `renderBolaoSec()`, nova `renderBolaoClassificacao()`.
- Test: verificação visual.

**Interfaces:**
- Consumes: `getStandings`, `getThirds`, `flagImg`, `nomeSel`, `GRUPOS`.
- Produces: `renderBolaoClassificacao()` que escreve em `#bolao-cnt`.

- [ ] **Step 1: Incluir o botão no menu e rota**

Em `renderBolao()` (≈1948), trocar a linha `secs` por:

```js
var secs=[{id:'grupos',l:'⚽ Grupos'},{id:'classificacao',l:'📊 Classificação'},{id:'chave',l:'🏆 Chaveamento'},{id:'ranking',l:'🥇 Ranking'},{id:'pagamento',l:'💰 Pagamento'}];
```

Em `renderBolaoSec()` (≈1964), adicionar antes de `else if (bolaoSec==='chave')`:

```js
  else if (bolaoSec==='classificacao') renderBolaoClassificacao();
```

- [ ] **Step 2: Implementar `renderBolaoClassificacao()`**

Adicionar (perto de `renderBolaoChave`):

```js
function renderBolaoClassificacao() {
  var cont=document.getElementById('bolao-cnt'); if(!cont) return;
  var h='<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:11px 13px;margin-bottom:12px;font-size:12px;color:#475569">';
  h+='<strong style="color:#0F4C5C">📊 Como funciona:</strong> A tabela é calculada automaticamente dos resultados oficiais. '
   + 'Critérios: pontos → confronto direto → saldo → gols. <span style="color:#16A34A;font-weight:700">Verde</span> = classificado (1º/2º); '
   + '<span style="color:#D97706;font-weight:700">âmbar</span> = disputa de melhor 3º.</div>';
  var gs=Object.keys(GRUPOS);
  gs.forEach(function(g){
    var st=getStandings(g);
    h+='<div class="bfase-ttl">Grupo '+g+'</div>';
    h+='<table class="tf" style="margin-bottom:10px"><thead><tr>'
      +'<th style="width:8%">#</th><th style="text-align:left">Seleção</th>'
      +'<th>P</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th></tr></thead><tbody>';
    st.forEach(function(t){
      var cor = t.pos<=2 ? 'background:#ECFDF5' : t.pos===3 ? 'background:#FFFBEB' : '';
      var prov = t.provisorio ? ' <span title="Desempate provisório" style="color:#D97706">⚠</span>' : '';
      h+='<tr style="'+cor+'"><td style="font-weight:700">'+t.pos+'º</td>'
        +'<td style="text-align:left">'+flagImg(t.cod)+' '+esc(t.nome)+prov+'</td>'
        +'<td>'+t.P+'</td><td>'+t.V+'</td><td>'+t.E+'</td><td>'+t.D+'</td>'
        +'<td>'+t.gp+'</td><td>'+t.gc+'</td><td>'+(t.sg>0?'+':'')+t.sg+'</td>'
        +'<td style="font-weight:800;color:#0F4C5C">'+t.pts+'</td></tr>';
    });
    h+='</tbody></table>';
  });
  // Ranking dos terceiros
  var thirds=getThirds();
  h+='<div class="bfase-ttl">🥉 Ranking dos 3º colocados <span style="font-weight:400;color:#94A3B8">(os 8 melhores avançam)</span></div>';
  if(!thirds.length){
    h+='<div class="empty"><p>Aguardando resultados da fase de grupos.</p></div>';
  } else {
    h+='<table class="tf"><thead><tr><th style="width:8%">#</th><th style="text-align:left">Seleção</th><th>Grupo</th><th>Pts</th><th>SG</th><th>GP</th></tr></thead><tbody>';
    thirds.forEach(function(t,i){
      var cor = t.classificado ? 'background:#ECFDF5' : '';
      var prov = (t.provisorio||t.parcial) ? ' <span title="Provisório/parcial" style="color:#D97706">⚠</span>' : '';
      h+='<tr style="'+cor+'"><td style="font-weight:700">'+(i+1)+'º</td>'
        +'<td style="text-align:left">'+flagImg(t.cod)+' '+esc(nomeSel(t.cod))+prov+'</td>'
        +'<td>'+t.grupo+'</td><td style="font-weight:800;color:#0F4C5C">'+t.pts+'</td>'
        +'<td>'+(t.sg>0?'+':'')+t.sg+'</td><td>'+t.gp+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  cont.innerHTML=h;
}
```

- [ ] **Step 3: Verificação visual (webapp-testing ou manual)**

Abrir o app → Bolão → 📊 Classificação. Conferir: 12 tabelas de grupo com 1º/2º em verde, 3º em âmbar; mini-tabela dos terceiros embaixo. Sem resultados, mostra valores zerados e aviso provisório. Recomenda-se usar a skill `webapp-testing` para print + checagem de console sem erros.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(bolao): aba Classificacao da fase de grupos com ranking dos terceiros

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Chaveamento usa times computados (com override)

**Files:**
- Modify: `index.html` — `renderBolaoChave()` (≈2330): trocar leitura de `bolaoChaveEq` por `getBracketTeams()`; rótulos amigáveis para tokens.
- Test: verificação visual + cálculo de campeão/vice (se aplicável).

**Interfaces:**
- Consumes: `getBracketTeams`, `THIRD_SLOT_GROUPS`, `flagImg`.
- Produces: `labelSlot(token)` → texto amigável de um slot não resolvido
  (`1A`→"1º A", `2B`→"2º B", `T1E`→"3º "+grupos possíveis, `W#R32_02`→"Vence J74", `L#SF_01`→"Perde SF1").

- [ ] **Step 1: Implementar `labelSlot` e ligar `renderBolaoChave` ao computado**

Adicionar helper:

```js
function labelSlot(token){
  if(/^([123])([A-L])$/.test(token)){var p=token[0],g=token[1];return (p==='1'?'1º':p==='2'?'2º':'3º')+' '+g;}
  if(/^T1[A-L]$/.test(token)){var gs=(THIRD_SLOT_GROUPS&&THIRD_SLOT_GROUPS[token.slice(1)])||[];return '3º ('+gs.join('/')+')';}
  if(token.indexOf('W#')===0){var jw=BOLAO_CHAVE.filter(function(x){return x.id===token.slice(2);})[0];return 'Vence J'+(jw?jw.num:'?');}
  if(token.indexOf('L#')===0){var jl=BOLAO_CHAVE.filter(function(x){return x.id===token.slice(2);})[0];return 'Perde J'+(jl?jl.num:'?');}
  return token;
}
```

Em `renderBolaoChave()`, no início da iteração de jogos, trocar:

```js
var casaEq=bolaoChaveEq[j.id+'_c']||null;
var visEq=bolaoChaveEq[j.id+'_v']||null;
```

por:

```js
var TEAMS=getBracketTeams();
var casaEq=TEAMS[j.id+'_c']||null;
var visEq=TEAMS[j.id+'_v']||null;
```

(Mover `var TEAMS=getBracketTeams();` para ANTES do `fases.forEach`, calculando uma vez.)
E onde hoje mostra `j.cL`/`j.vL` como texto cru (linhas que renderizam `<span class="bslot">'+j.cL+'</span>`), trocar por `labelSlot(j.cL)` / `labelSlot(j.vL)`. Idem nos pontos finais (campeão/vice) que liam `bolaoChaveEq` — passar a ler `TEAMS`.

- [ ] **Step 2: Atualizar usos remanescentes de `bolaoChaveEq`**

Buscar todos os usos de `bolaoChaveEq` fora do admin (`grep`), e nas telas do usuário substituir por `getBracketTeams()`. Manter `bolaoChaveEq` apenas como nome legado se algo de cálculo de campeão depender; preferir `getBracketTeams()`.

Run: `grep -n "bolaoChaveEq" index.html`
Expected: usos restantes só no painel admin (Task 9) e/ou no cálculo de campeão já migrado para `TEAMS`.

- [ ] **Step 3: Verificação visual**

Abrir Bolão → 🏆 Chaveamento. Com resultados de grupo lançados (pode usar dados de teste no Firestore ou conferir o estado atual), os confrontos da Rodada de 32 devem mostrar os times automaticamente; sem dados, mostram rótulos amigáveis ("1º A", "3º (C/E/F/H/I)", "Vence J74"). Sem erros no console.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(bolao): chaveamento exibe times auto-preenchidos com rotulos amigaveis

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Painel admin — override de times + desempates manuais

**Files:**
- Modify: `index.html` — `adminBolao()` (inputs de chave viram override; nova seção desempate); `adminBolaoSalvar()` (gravar `chaveOverride`/`desempate`).
- Test: verificação manual (gravar/recarregar).

**Interfaces:**
- Consumes: `getBracketTeams`, `getStandings`, `getThirds`, `BOLAO_CHAVE`, `GRUPOS`.
- Produces: persistência em `bolao_meta/dados.chaveOverride` e `.desempate`.

- [ ] **Step 1: Inputs de time como OVERRIDE (placeholder = computado)**

Em `adminBolao()`, na seção "Times do Chaveamento" (≈2561-2569), trocar o `value`/`placeholder` para refletir o computado:

```js
var TEAMS=getBracketTeams();
// ...
h+='<input id="chv_'+j.id+'_c" type="text" maxlength="7" value="'+(bolaoChaveOverride[j.id+'_c']||'')+'" placeholder="'+(TEAMS[j.id+'_c']||labelSlot(j.cL))+'" ...>';
h+='<input id="chv_'+j.id+'_v" type="text" maxlength="7" value="'+(bolaoChaveOverride[j.id+'_v']||'')+'" placeholder="'+(TEAMS[j.id+'_v']||labelSlot(j.vL))+'" ...>';
```

(Atualizar o texto de ajuda da seção: "Deixe em branco para usar o cálculo automático; preencha só para sobrescrever.")

- [ ] **Step 2: Nova seção "Desempates manuais" (condicional)**

Adicionar em `adminBolao()`, após a seção de resultados de grupos:

```js
// Desempates manuais: só mostra grupos/terceiros com empate provisório
var dh='';
Object.keys(GRUPOS).forEach(function(g){
  var st=getStandings(g);
  if(st.some(function(t){return t.provisorio;})){
    dh+='<div style="margin:6px 0"><span style="font-size:11px;font-weight:700;color:#78350F">Grupo '+g+' (ordem):</span> ';
    dh+='<input id="des_'+g+'" type="text" value="'+((bolaoDesempate[g]||[]).join(','))+'" placeholder="'+GRUPOS[g].map(function(t){return t[1];}).join(',')+'" style="width:200px;height:26px;font-size:11px;border:1px solid #E5E7EB;border-radius:6px;padding:0 6px;text-transform:uppercase">';
    dh+='</div>';
  }
});
var th=getThirds();
if(th.some(function(t){return t.provisorio;})){
  dh+='<div style="margin:6px 0"><span style="font-size:11px;font-weight:700;color:#78350F">3º colocados (ordem de grupos):</span> ';
  dh+='<input id="des_thirds" type="text" value="'+((bolaoDesempate.thirds||[]).join(','))+'" placeholder="A,B,C,..." style="width:240px;height:26px;font-size:11px;border:1px solid #E5E7EB;border-radius:6px;padding:0 6px;text-transform:uppercase"></div>';
}
if(dh) h+='<div style="font-size:12px;font-weight:700;color:#0F4C5C;margin:16px 0 8px">⚖️ Desempates manuais <span style="font-weight:400;color:#94A3B8">(só aparece quando os critérios automáticos empatam)</span></div>'+dh;
```

- [ ] **Step 3: Gravar override e desempate em `adminBolaoSalvar`**

Em `adminBolaoSalvar()` (≈2624-2633), trocar a coleta de `chave` para `chaveOverride` (só valores preenchidos) e coletar `desempate`:

```js
var chaveOverride={};
BOLAO_CHAVE.forEach(function(j){
  var cc=document.getElementById('chv_'+j.id+'_c');
  var vc=document.getElementById('chv_'+j.id+'_v');
  if(cc&&cc.value.trim()) chaveOverride[j.id+'_c']=cc.value.trim().toUpperCase();
  if(vc&&vc.value.trim()) chaveOverride[j.id+'_v']=vc.value.trim().toUpperCase();
});
var desempate={};
Object.keys(GRUPOS).forEach(function(g){
  var e=document.getElementById('des_'+g);
  if(e&&e.value.trim()) desempate[g]=e.value.trim().toUpperCase().split(',').map(function(s){return s.trim();}).filter(Boolean);
});
var et=document.getElementById('des_thirds');
if(et&&et.value.trim()) desempate.thirds=et.value.trim().toUpperCase().split(',').map(function(s){return s.trim();}).filter(Boolean);
bolaoChaveOverride=chaveOverride; bolaoDesempate=desempate;
db.collection('bolao_meta').doc('dados').set({resultados:res,chaveOverride:chaveOverride,desempate:desempate,updatedAt:new Date()},{merge:true})
  .then(function(){bolaoResultados=res;toast('✅ Resultados salvos!');})
  .catch(function(){toast('Erro ao salvar');});
```

(Manter `chave` legado intacto no documento — `merge:true` não o apaga.)

- [ ] **Step 4: Verificação manual**

Como admin: lançar resultados de um grupo a ponto de gerar empate; conferir que a seção de desempate aparece; definir a ordem; salvar; recarregar; conferir que a ordem persistiu e a Classificação/Chaveamento refletem. Override de um confronto: digitar uma sigla num slot, salvar, conferir que prevalece sobre o computado.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(bolao): admin override de times do bracket e desempates manuais

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Regressão, limpeza e publicação

**Files:**
- Modify: `index.html` (limpeza de código morto, se houver), `tests/` (gitignore de artefatos temporários se necessário).
- Test: suíte completa + verificação visual ampla.

- [ ] **Step 1: Rodar a suíte completa**

Run: `node tests/bolao-engine.test.js`
Expected: 19 testes ✓.

- [ ] **Step 2: Regressão visual das demais telas do bolão**

Abrir Grupos, Ranking, Pagamento, painel admin — confirmar que nada quebrou (apostas de grupo salvam; ranking carrega; lock de aposta inalterado). Sem erros no console.

- [ ] **Step 3: Conferência de critérios oficiais**

Reler a seção do spec e o desenho contra a FIFA: estrutura R32 (73–88), progressão (89–104), 8 vencedores que pegam terceiros (A,B,D,E,G,I,K,L), ordem de desempate. Corrigir divergências.

- [ ] **Step 4: Commit final + push**

```bash
git add -A
git commit -m "chore(bolao): regressao e limpeza da feature de classificacao/chaveamento

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 5: Confirmar publicação online**

Conferir o site publicado (GitHub Pages / hosting) após o push: nova aba 📊 Classificação visível e chaveamento auto-preenchido. Confirmar com o usuário que os dados (figurinhas + bolão) seguem intactos (operações foram só de leitura/escrita aditiva com `merge:true`).

---

## Self-Review (preenchido)

**1. Cobertura do spec:**
- Aba Classificação → Task 7. ✓
- Desempate FIFA + override → Task 2 (grupo), Task 3 (terceiros), Task 9 (override UI). ✓
- Bracket oficial 2026 → Task 4. ✓
- Tabela 495 combinações → Task 1. ✓
- computeBracketTeams (diretos + terceiros + progressão + override) → Task 5. ✓
- Persistência chaveOverride/desempate → Task 6 (leitura), Task 9 (escrita). ✓
- Não-destrutivo / merge → Global Constraints + Task 9. ✓

**2. Placeholders:** literal da tabela é gerado por comando real (Task 1) a partir de artefato validado; demais passos têm código completo. Sem TBD/TODO.

**3. Consistência de tipos:** `computeStandings(grupo,RES,DES)`, `rankThirds(RES,DES)`, `computeBracketTeams(RES,DES,OVR)`, `getBracketTeams/getStandings/getThirds`, tokens `1X/2X/3X/T1X/W#id/L#id`, slots `*_c`/`*_v` — usados de forma consistente entre tasks 2–9.
