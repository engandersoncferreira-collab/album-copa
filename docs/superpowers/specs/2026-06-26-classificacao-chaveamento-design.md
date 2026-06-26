# Classificação dos grupos + Chaveamento automático — Bolão Copa 2026

**Data:** 2026-06-26
**Arquivo afetado:** `index.html` (app ativo)
**Status:** Aprovado o desenho; aguardando revisão do spec.

## Objetivo

Adicionar à aba **Bolão** duas capacidades, ambas derivadas dos placares oficiais
que o admin já digita (`bolaoResultados`):

1. Uma aba **📊 Classificação** mostrando a tabela de cada grupo (ordem das seleções)
   e o ranking dos melhores terceiros.
2. **Auto-preenchimento do Chaveamento** a partir da classificação dos grupos e dos
   resultados do mata-mata, seguindo a estrutura e os critérios oficiais da FIFA 2026.

Fonte oficial dos critérios e do chaveamento: FIFA / regulamento da Copa 2026
(estrutura R32 jogos 73–88 e tabela das 495 combinações de terceiros).

## Decisões tomadas (confirmadas com o usuário)

- **Automação total + override do admin:** auto-preenche 1º, 2º e os 8 melhores
  terceiros; o admin ainda pode sobrescrever qualquer confronto manualmente.
- **Critérios FIFA de desempate + override:** pontos → confronto direto → saldo
  geral → gols marcados; empates remanescentes (cartões/ranking FIFA, que o app
  não rastreia) são resolvidos por **override manual do admin**.
- **Corrigir o bracket para o oficial 2026:** reescrever `BOLAO_CHAVE` com a
  estrutura oficial, removendo a rodada de semifinal duplicada. Seguro agora pois
  não há apostas de mata-mata (o mata-mata começa 04/jul; hoje é 26/jun).

## Estado atual relevante

- `GRUPOS` — 12 grupos A–L, 4 seleções `[nome, sigla]`.
- `BOLAO_JOGOS` — 72 jogos de grupo gerados (id `<G>_R<r>_<n>`, campos `grupo,casa,vis,data,hora`).
- `BOLAO_CHAVE` — mata-mata **placeholder/incorreto** (confrontos genéricos, fase
  `semifinal` duplicada). Será reescrito.
- `bolaoResultados` — placares oficiais `{ id: {c, v, pen?} }` em `bolao_meta/dados.resultados`.
- `bolaoChaveEq` — times do bracket `{ "<id>_c": SIGLA, "<id>_v": SIGLA }` em
  `bolao_meta/dados.chave`. Hoje preenchido **manualmente**; passará a ser
  **computado + override**.
- Pontuação, ranking, pagamento, lock de apostas — **não mudam**.

## Arquitetura

```
resultados oficiais (admin, bolaoResultados)
        │
        ├─► computeStandings(grupo)  ──► tabela do grupo (Pos,P,V,E,D,GP,GC,SG,Pts)
        │            │
        │            └─► rankThirds() ──► 12 terceiros ordenados, 8 classificados
        │
        └─► computeBracketTeams()  ──► mapa { "<id>_c": SIGLA, ... }
                     │  1º/2º diretos + terceiros via tabela FIFA 495
                     │  + progressão dos vencedores do mata-mata
                     └─► override: bolaoChaveEqManual vence
```

### Componentes (funções puras, sem efeitos colaterais)

1. **`computeStandings(grupo)`** → array ordenado de 4 entradas
   `{cod, P, V, E, D, gp, gc, sg, pts, pos}`.
   - Soma os 6 jogos do grupo a partir de `bolaoResultados`.
   - Jogo sem resultado não conta (tabela parcial é válida).
   - Ordenação (critérios FIFA, nesta ordem):
     1. Pontos (V=3, E=1, D=0).
     2. **Confronto direto** entre os empatados: pontos → SG → gols marcados
        *apenas* nos jogos entre eles.
     3. Saldo de gols geral.
     4. Gols marcados geral.
     5. **Override do admin** (`bolaoDesempate[grupo]` — ordem manual de siglas);
        na ausência, ordem alfabética estável + flag `provisorio:true`.

2. **`rankThirds()`** → array dos 12 terceiros ordenados, marcando os 8 melhores
   (`classificado:true`). Critérios entre grupos: pontos → SG → gols marcados →
   override do admin (`bolaoDesempate.thirds`). Não há confronto direto (nunca se
   enfrentaram). Só rankeia terceiros de grupos com os 3 jogos definidos; enquanto
   incompleto, marca `parcial:true`.

3. **`THIRD_PLACE_TABLE`** — objeto JS embutido com as **495 combinações** oficiais.
   Chave = string ordenada dos 8 grupos classificados (ex.: `"EFGHIJKL"`);
   valor = `{ "1A":"E", "1B":"J", "1D":"I", "1E":"F", "1G":"H", "1I":"G", "1K":"L", "1L":"K" }`
   (slot do vencedor → letra do grupo do terceiro).
   - Slots de vencedores que pegam terceiros: **1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L**.
   - **Já extraída e validada** do template oficial (495/495, integridade ok),
     artefato em `scratchpad/thirdplace_lookup.json` (~42 KB).

4. **`computeBracketTeams()`** → `{ "<id>_c": SIGLA, "<id>_v": SIGLA }`
   - Resolve `1X`/`2X` de cada grupo via `computeStandings`.
   - Se houver 8 terceiros classificados, consulta `THIRD_PLACE_TABLE` pela
     combinação ordenada e aloca cada `3X` ao seu slot de vencedor.
   - Para jogos de mata-mata com resultado oficial, avança o vencedor ao próximo
     slot (dependências `W74→89`, etc.; empate usa `res.pen`).
   - Retorna apenas os slots já determináveis (o resto fica como placeholder).

5. **Merge com override** — `bolaoChaveEq = { ...computeBracketTeams(), ...manualOverrides }`.
   O admin enxerga o valor computado como *placeholder* e só digita para sobrescrever.
   Persistência: salvar **apenas os overrides** em `bolao_meta/dados.chaveOverride`
   (mantém `chave` legado para retrocompat de leitura).

### Estrutura oficial do bracket (reescrita de `BOLAO_CHAVE`)

IDs mantêm o padrão `R32_01..16`, `R16_01..08`, `QF_01..04`, `SF_01..02`,
`3RD`, `FIN`. Datas/horários oficiais convertidos para **horário de Brasília (−03:00)**.

**Rodada de 32 (jogos 73–88):**

| ID | nº | Casa | Visitante |
|----|----|------|-----------|
| R32_01 | 73 | 2A | 2B |
| R32_02 | 74 | 1E | 3º (C/D/F/G/H) |
| R32_03 | 75 | 1F | 2C |
| R32_04 | 76 | 1C | 2F |
| R32_05 | 77 | 1I | 3º (C/D/F/G/H) |
| R32_06 | 78 | 2E | 2I |
| R32_07 | 79 | 1A | 3º (C/E/F/H/I) |
| R32_08 | 80 | 1L | 3º (E/H/I/J/K) |
| R32_09 | 81 | 1D | 3º (B/E/F/I/J) |
| R32_10 | 82 | 1G | 3º (A/E/H/I/J) |
| R32_11 | 83 | 2K | 2L |
| R32_12 | 84 | 1H | 2J |
| R32_13 | 85 | 1B | 3º (E/F/G/I/J) |
| R32_14 | 86 | 1J | 2H |
| R32_15 | 87 | 1K | 3º (D/E/I/J/L) |
| R32_16 | 88 | 2D | 2G |

**Progressão (oitavas → final):**

- R16: 89=W74×W77 · 90=W73×W75 · 91=W76×W78 · 92=W79×W80 · 93=W83×W84 ·
  94=W81×W82 · 95=W86×W88 · 96=W85×W87
- QF: 97=W89×W90 · 98=W93×W94 · 99=W91×W92 · 100=W95×W96
- SF: 101=W97×W98 · 102=W99×W100
- 3º lugar: 103=L101×L102 · Final: 104=W101×W102

Os rótulos `cL`/`vL` de cada jogo passam a referenciar esses slots
(`1A`, `2B`, `3CDFGH`, `W74`, `L101`, ...) para exibição quando o time ainda
não está definido.

### Aba "📊 Classificação"

- Novo botão no menu do bolão, **entre Grupos e Chaveamento**:
  `secs = [grupos, classificacao, chave, ranking, pagamento]`.
- `renderBolaoClassificacao()`:
  - 12 cartões de grupo, cada um com tabela Pos·Seleção(bandeira)·P·V·E·D·GP·GC·SG·Pts.
  - 1º/2º com destaque verde (classificados), 3º âmbar ("disputa de melhor terceiro").
  - Mini-tabela **"Ranking dos 3º colocados"**: 12 terceiros ordenados, os 8 melhores
    destacados, com aviso quando `parcial`/`provisorio`.
  - Estado vazio enquanto não há resultados.
  - Reaproveita `flagImg`, `nomeSel`, faixas de cor existentes.

### Painel admin

- Os inputs "Times do Chaveamento" passam a mostrar o valor **computado** como
  placeholder; preencher = override.
- Nova seção **"Desempates manuais"**: aparece só quando `computeStandings`/`rankThirds`
  sinalizam empate não resolvido por critérios; admin ordena as siglas em conflito.
  Persiste em `bolao_meta/dados.desempate`.

## Modelo de dados (Firestore `bolao_meta/dados`)

- `resultados` — inalterado.
- `chave` — legado (leitura retrocompat).
- `chaveOverride` (novo) — `{ "<id>_c": SIGLA }` só com overrides do admin.
- `desempate` (novo) — `{ "<grupo>": [siglas...], "thirds": [grupos...] }`.

## Tratamento de erros / bordas

- Tabela parcial (jogos sem resultado): standings exibem o que dá; bracket só
  preenche slots determináveis.
- Empates não resolvidos: ordem provisória + aviso visual; admin desempata.
- Combinação de terceiros incompleta (<8 definidos): slots de terceiros ficam como
  placeholder até fechar a fase de grupos.
- Override do admin nunca é sobrescrito pelo cálculo.

## Testes / verificação

- **Dados:** validação das 495 combinações (cada alocação é permutação dos 8 grupos) — **já feita**.
- **Standings:** cenários de empate (2 e 3 times) conferidos contra a ordem FIFA.
- **Bracket:** com um conjunto de resultados oficiais completo, conferir que
  `computeBracketTeams` reproduz os confrontos esperados (incluindo terceiros) e
  que a progressão até a final segue as dependências.
- **Override:** valor manual do admin prevalece e persiste.
- Verificação visual da nova aba (estado vazio, parcial, completo).

## Fora de escopo (YAGNI)

- Cartões/fair-play e ranking FIFA como desempate automático (admin resolve).
- Mudanças em pontuação, ranking, pagamento ou regras de lock de aposta.
- Migração dos arquivos `Album_Copa_2026_Panini*.html` (legados).
