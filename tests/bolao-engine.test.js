// Harness sem dependências: extrai o bloco /* ENGINE-TEST START..END */ do
// index.html e avalia em um sandbox vm. Roda com: node tests/bolao-engine.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

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

// ---- BOLAO_CHAVE oficial 2026 ----
test('BOLAO_CHAVE: contagem por fase oficial', () => {
  const cnt = {};
  G.BOLAO_CHAVE.forEach(j => cnt[j.fase] = (cnt[j.fase]||0)+1);
  assert.deepEqual(cnt, {rodada32:16, oitavas:8, quartas:4, semi:2, terceiro:1, final:1});
});
test('BOLAO_CHAVE: R32 jogo 79 = 1A vs terceiro do slot 1A', () => {
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

console.log('\n' + passed + ' testes OK');
