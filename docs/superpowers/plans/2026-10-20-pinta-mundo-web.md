# Pinta Mundo — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jogo de colorir web (PWA estática) com 135 desenhos originais, 7 ferramentas distintas, autosave, galeria, PNG, pt-BR/en/es, portão parental e offline.

**Architecture:** React só para telas; motor de pintura imperativo em TS puro sobre Canvas 2D com camadas (pintura/scratch/contorno) e mapa de regiões derivado do contorno; persistência IndexedDB versionada; Workbox precache.

**Tech Stack:** Vite 5, React 18, TypeScript 5 strict, idb, vite-plugin-pwa, Vitest + @napi-rs/canvas + fake-indexeddb, Playwright, ESLint 9, Prettier.

**Spec:** `docs/superpowers/specs/2026-10-20-pinta-mundo-web-design.md` + `docs/spec/behavior-spec.md`.

## Global Constraints
- Espaço lógico das páginas: 1000×1000. Contorno: largura 7, cor `#2B2340`, `lineJoin/lineCap = 'round'`.
- Linha = pixel com alfa ≥ 128 após rasterizar o contorno; regiões = componentes 4-conexas dos demais pixels.
- Máscara de traço = região dilatada 2 px; raio de busca de região quando o toque cai em linha = 12 px.
- Histórico: máximo 40 entradas ou 120 MB; 1 entrada por gesto/preenchimento/limpeza.
- Autosave debounce 700 ms; salvamento imediato em `visibilitychange=hidden` e `pagehide`.
- IndexedDB `pinta-mundo` v1, store `artworks` keyPath `pageId`; prefs em `localStorage['pinta-mundo:prefs']` `{v:1, lang:'pt-BR'|'en'|'es', music:boolean, sfx:boolean, volume:number 0..1}`; padrão `{v:1, lang:'pt-BR', music:true, sfx:true, volume:0.7}`.
- IDs de página `<themeId>-NN` (NN 01–15). Temas na ordem: `animals, ocean, dinosaurs, space, transport, princess, robots, christmas, fairytale`.
- Nada do APK (arte, sons, textos, código, marcas). Sem links externos fora do portão. Sem analytics.
- Alvos de toque ≥ 56 px CSS. `touch-action: none` apenas no canvas.
- Todo texto visível vem do i18n; os três idiomas completos (checado por tipo e teste).

## Review Focus
1. Toque que começa sobre a linha de contorno → deve pintar a região mais próxima, não nada nem tudo (teste em Task 3).
2. Rotação/redimensionamento no meio de um traço → traço termina, obra intacta (teste Task 3 + E2E 8).
3. IndexedDB indisponível/cota excedida → aviso de falha, nunca "Salvo" (teste Task 4 + UI Task 6).
4. Atualização do SW com pintura aberta → não recarrega sozinha (Task 8).
5. Multi-toque (segundo dedo) durante traço → ignorado, sem traço fantasma (teste Task 3).

---

### Task 1: Scaffold e infraestrutura
**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `.vercelignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/ui/theme.css`, `tests/setup.ts`, `.gitignore`.
**Produces:** scripts `dev, build, preview, lint, typecheck, test, test:e2e`; alias `@/` → `src/`.
- [ ] Vite React-TS + deps; `vercel.json` `{framework:"vite", buildCommand:"npm run build", outputDirectory:"dist"}`.
- [ ] Teste fumaça `tests/unit/smoke.test.ts` (1+1) e `npm run lint && npm run typecheck && npm test && npm run build` verdes.
- [ ] Commit.

### Task 2: Catálogo — DSL, render do contorno, mapa de regiões, integridade
**Files:** `src/catalog/types.ts`, `src/catalog/dsl.ts`, `src/catalog/render.ts`, `src/catalog/index.ts`, `src/catalog/themes/<theme>.ts` (9, inicialmente com 2 páginas de exemplo em `animals`), `src/engine/regions.ts`; tests `tests/unit/regions.test.ts`, `tests/unit/catalog.test.ts`.
**Interfaces (Produces):**
- `type ThemeId = 'animals'|'ocean'|'dinosaurs'|'space'|'transport'|'princess'|'robots'|'christmas'|'fairytale'`
- `interface PageDef { id: string; themeId: ThemeId; index: number; nameKey: string; draw(p: Pen): void }`
- `interface Pen { circle(cx,cy,r); ellipse(cx,cy,rx,ry,rot?); rect(x,y,w,h); roundRect(x,y,w,h,r); poly(pts:[number,number][], closed?:boolean); star(cx,cy,rOuter,rInner,points); heart(cx,cy,size); path(d:string); line(x1,y1,x2,y2) }` (todos `void`)
- `THEMES: { id: ThemeId; nameKey: string; color: string; pages: PageDef[] }[]`; `getPage(id): PageDef | undefined`
- `renderOutline(ctx: CanvasRenderingContext2D, page: PageDef, size: number): void` (escala 1000→size)
- `interface RegionMap { width: number; height: number; labels: Int32Array /*0=linha*/; count: number; areas: Uint32Array }`
- `buildRegionMap(outlineAlpha: Uint8ClampedArray /*RGBA*/, w, h): RegionMap`
- `regionAt(map, x, y, searchRadius=12): number` (0 se nada)
- `regionMask(map, label, dilate=2): Uint8Array` (1 = dentro)
- [ ] Testes regiões: anel (círculo dentro de círculo) → 3 regiões (fora, anel, furo); preencher anel não toca furo; `regionAt` sobre linha retorna vizinha; dilatação cobre exatamente +2 px.
- [ ] Teste catálogo (gerado para todas as páginas existentes): ids únicos/formato, ≥4 regiões ≥600 px, linhas ≤25%, distância entre pares ≥8% dos pixels de linha, `nameKey` existe nos 3 idiomas (após Task 5; até lá skip condicional). Quando Task 7 terminar: exatamente 135 páginas e 15 por tema.
- [ ] Implementar (rotulagem por BFS iterativo com fila `Int32Array`). Commit.

### Task 3: Motor de pintura
**Files:** `src/engine/transform.ts`, `src/engine/tools.ts`, `src/engine/patterns.ts`, `src/engine/history.ts`, `src/engine/session.ts`, `src/engine/canvasFactory.ts`; tests `tests/unit/{transform,tools,history,session}.test.ts`.
**Interfaces:**
- `type ToolId = 'marker'|'pencil'|'brush'|'bucket'|'spray'|'shine'|'pattern'`; `type Size = 's'|'m'|'l'`; `TOOL_SIZES: Record<Size, number>` = `{s:14,m:28,l:48}` (pincel ×1.2, lápis ×0.45, spray ×1.6).
- `COLORS: string[]` (24), `SHINES: {id,stops:string[]}[]` (6: ouro, prata, arco-íris, rosa, azul-gelo, verde-esmeralda), `PATTERNS: PatternId[]` (8: `stripes,dots,checks,hearts,stars,waves,zigzag,scales`); `makePattern(ctx, id, color): CanvasPattern`.
- `class ViewTransform { constructor(rect:{left,top,width,height}, logical=1000); toLogical(clientX, clientY): {x,y}; }`
- `interface Brush { tool: ToolId; color: string; shine: string; pattern: PatternId; size: Size }`
- `stampSegment(ctx, brush, from:{x,y,p}, to:{x,y,p}, rng: () => number): void` (desenha no scratch)
- `class History { push(e:{rect, before:ImageData, after:ImageData}); undo(): Entry|null; redo(): Entry|null; canUndo; canRedo; clear() }` com limites globais.
- `class PaintSession { constructor(opts:{page:PageDef, canvas:HTMLCanvasElement, factory:CanvasFactory, onChange:(s:{canUndo,canRedo,dirty})=>void}); setBrush(b:Partial<Brush>); pointerDown(e:PointerEvent); pointerMove(e); pointerUp(e); pointerCancel(e); undo(); redo(); clear(); resize(); loadPaint(img:ImageBitmap|HTMLImageElement|null); exportPaintPNG(): Promise<Blob>; exportCompositePNG(size:number): Promise<Blob>; dispose() }`
- [ ] Testes: transform (dpr 1/2/3, rect deslocado, cantos); cada ferramenta produz assinatura distinta (cobertura, alfa médio, variância e nº de cores diferem pares-a-pares num quadro 200²); balde preenche só a região; traço iniciado numa região não pinta a vizinha; histórico 1 entrada por gesto, undo/redo restauram pixels, novo gesto zera redo, limite descarta mais antigos; clear desfazível; pointercancel finaliza traço; segundo ponteiro ignorado; resize preserva pintura.
- [ ] Implementar. Commit.

### Task 4: Persistência
**Files:** `src/persistence/result.ts`, `src/persistence/db.ts`, `src/persistence/artworks.ts`, `src/persistence/prefs.ts`; tests `tests/unit/{artworks,prefs}.test.ts` (fake-indexeddb).
**Interfaces:** `type Result<T> = {ok:true,value:T}|{ok:false,error:'unavailable'|'quota'|'unknown', detail?:string}`;
`interface ArtworkRecord { schema:1; pageId; paint:Blob; thumb:Blob; createdAt:number; updatedAt:number; strokes:number }`;
`saveArtwork(rec): Promise<Result<void>>`, `loadArtwork(pageId): Promise<Result<ArtworkRecord|null>>`, `listArtworks(): Promise<Result<ArtworkRecord[]>>` (updatedAt desc), `deleteArtwork(pageId)`, `deleteAll()`, `migrateRecord(raw:unknown): ArtworkRecord|null`;
`loadPrefs(): Prefs`, `savePrefs(p): Result<void>`, `DEFAULT_PREFS`.
- [ ] Testes: round-trip; lista ordenada; falha de `indexedDB.open` → `unavailable`; `QuotaExceededError` → `quota`; registro com schema desconhecido descartado, schema 0 migrado; prefs inválidas → padrão; localStorage lançando → retorna padrão e `savePrefs` `ok:false`.
- [ ] Implementar. Commit.

### Task 5: i18n e áudio
**Files:** `src/i18n/{index.ts,pt-BR.ts,en.ts,es.ts}`, `src/audio/audio.ts`; tests `tests/unit/{i18n,audio}.test.ts`.
**Interfaces:** `type Lang='pt-BR'|'en'|'es'`; `type Dict = typeof ptBR` (en/es tipados `: Dict`); `t(lang, key: DictKey, vars?): string`; `I18nProvider`, `useT()`; nomes `theme.<id>` e `page.<pageId>` (135) obrigatórios.
`audio.unlock()`, `audio.play(name:'click'|'color'|'fill'|'shine'|'celebrate'|'error')`, `audio.setMusic(on)`, `audio.setVolumes({music,sfx,volume})`.
- [ ] Testes: conjuntos de chaves idênticos nos 3; sem string vazia; interpolação; áudio não cria AudioContext antes de `unlock` (mock); sfx desligado → `play` não toca.
- [ ] Implementar. Commit.

### Task 6: Interface
**Files:** `src/ui/router.ts`, `src/ui/screens/{Home,Themes,ThemePages,Paint,Gallery,Parents}.tsx`, `src/ui/components/{BigButton,Icon,Toolbar,Palette,ConfirmDialog,ParentalGate,Toast,Thumb}.tsx`, `src/ui/state/AppState.tsx`, `src/ui/parentalGate.ts`; tests `tests/unit/parentalGate.test.ts`.
**Interfaces:** `makeChallenge(rng): {a,b,op:'+'|'×',answer}`; `checkAnswer(ch, input:string): boolean`; gate bloqueia 10 s após 3 erros.
- [ ] Teste do portão (respostas certas/erradas, bloqueio, nova pergunta após erro).
- [ ] Telas conforme design §7; Paint integra `PaintSession` via ref; autosave com `Result`; toast "Não foi possível salvar" em falha; confirmação de limpar; exportar PNG; galeria; área dos pais.
- [ ] `data-testid` estáveis: `play`, `theme-<id>`, `page-<pageId>`, `tool-<id>`, `color-<i>`, `shine-<id>`, `pattern-<id>`, `size-<s>`, `undo`, `redo`, `clear`, `confirm-yes`, `confirm-no`, `done`, `export`, `paint-canvas`, `nav-gallery`, `gallery-item-<pageId>`, `nav-parents`, `gate-input`, `gate-key-<n>`, `gate-submit`, `gate-error`, `lang-<lang>`, `toggle-music`, `toggle-sfx`, `save-status`.
- [ ] Commit.

### Task 7: Arte — 135 desenhos originais (paralelizável por tema)
**Files:** `src/catalog/themes/<theme>.ts` (15 páginas cada) + chaves `page.<id>` nos 3 idiomas (`src/i18n/pages/<theme>.ts` mesclado pelo índice).
- [ ] Cada página: assunto distinto (lista no topo do arquivo), composição própria, regiões confortáveis (≥4 regiões ≥600 px; detalhes pequenos ≥ 400 px), sem textos.
- [ ] `npm test -- catalog` verde para o tema; inspeção visual das 15 miniaturas (`npm run sheet -- <theme>` gera `artifacts/sheets/<theme>.png`). Commit por tema.

### Task 8: PWA e offline
**Files:** `vite.config.ts` (VitePWA), `public/icons/*` (próprios), `src/pwa/register.ts`, aviso de atualização nas telas Home/Parents.
- [ ] `registerType:'prompt'`, `workbox.globPatterns:['**/*.{js,css,html,svg,png,woff2,webmanifest}']`; nunca recarregar dentro de `#/pintar`. Commit.

### Task 9: E2E Playwright (12 cenários)
**Files:** `tests/e2e/*.spec.ts`, helpers `tests/e2e/helpers.ts` (leitura de pixels via `page.evaluate` no canvas/IndexedDB).
- [ ] Cenários 1–12 do pedido, com verificação de pixels/dados. `npm run test:e2e` verde. Commit.

### Task 10: Documentação, matriz, deploy
**Files:** `README.md`, `docs/PARITY_MATRIX.md`, `docs/ASSETS_LICENSE.md`, `docs/DEPLOY.md`, `docs/VALIDATION_REPORT.md`, `docs/progress/LOG.md`.
- [ ] Revisão final de branch; PR → `claude/blissful-volta-ukpmo1` (branch de produção); preview Vercel testado; merge; produção verificada.
