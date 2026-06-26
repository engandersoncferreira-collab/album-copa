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
