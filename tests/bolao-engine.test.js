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

console.log('\n' + passed + ' testes OK');
