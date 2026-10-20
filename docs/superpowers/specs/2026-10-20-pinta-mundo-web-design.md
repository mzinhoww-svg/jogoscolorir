# Design — "Pinta Mundo" (jogo de colorir web)

Status: decisões delegadas pelo usuário (dispensou perguntas e aprovações intermediárias). Todas as escolhas abaixo
são **decisões do agente**, registradas para revisão. Entrada comportamental: `docs/spec/behavior-spec.md`.

## 1. Intenção
Jogo de colorir para crianças pequenas (≈2–6 anos), offline, sem anúncios, sem cadastro, sem rastreamento e sem cobrança.
Fluxo principal: Entrada → tema → desenho → pintura → salvar → reabrir na galeria. Identidade, código, arte, textos e sons 100% próprios.

**Objetivos:** 135 desenhos originais (9 temas × 15); 7 ferramentas visualmente distintas; pintura sem vazamento;
desfazer/refazer por gesto; autosave; galeria; PNG; pt-BR/en/es; portão parental; PWA offline; celular/tablet/desktop.

**Não-objetivos:** replicar o app Unity, compras, vitrine promocional, notificações, avaliação na loja, backend, contas.

**Anti-objetivos:** informar "salvo" quando a gravação falhou; perder pintura em atualização/rotação; sete botões com o
mesmo pincel; desenhos repetidos por cor/rotação/escala; qualquer arquivo/marca/personagem do APK.

## 2. Stack
React 18 + TypeScript (strict) + Vite; Canvas 2D; `vite-plugin-pwa` (Workbox, precache total); IndexedDB via `idb`;
Vitest (+ `@napi-rs/canvas` para testes reais de Canvas 2D em Node); Playwright (Chromium em `/opt/pw-browsers`);
ESLint + Prettier. Fonte "Baloo 2" via `@fontsource` (OFL, empacotada). Deploy estático na Vercel (`vercel.json`: framework vite, `dist`).

## 3. Módulos (fronteiras)
```
src/
  catalog/      temas, páginas (geometria vetorial), DSL de formas, render de contorno, integridade
  engine/       coordenadas, mapa de regiões, máscaras, ferramentas (stamps), histórico, compositor, sessão de pintura
  persistence/  IndexedDB (obras), prefs (localStorage), migrações, Result<T>
  audio/        WebAudio sintetizado (efeitos + música), desbloqueio após gesto
  i18n/         dicionários pt-BR/en/es tipados, nomes de temas/páginas
  ui/           telas React, componentes, layout, portão parental
  pwa/          registro do SW, aviso de atualização
```
O motor não importa React. A UI fala com o motor por uma classe `PaintSession` imperativa (ref), sem re-render por ponto.

## 4. Catálogo e geometria
- Espaço lógico de cada página: **1000 × 1000**. Cada página = `{ id, themeId, index, nameKey, draw(ctx) }`, onde `draw` emite
  apenas contornos (paths fechados ou abertos) através de uma DSL (`circle, ellipse, rect, roundRect, poly, star, heart, path(d)`).
- Regiões são **derivadas do contorno**: contorno rasterizado (traço 7 px, cor escura `#2b2340`, cantos arredondados) →
  pixels com alfa ≥ 50% = "linha"; demais pixels rotulados por componentes 4-conexas (`Int32Array`). O fundo externo
  também é uma região pintável. Furos internos (ex.: rosquinha, janela) viram regiões próprias automaticamente.
- IDs estáveis: `animals-01 … fairytale-15`. Ordem fixa.
- Variedade real: cada página representa um assunto distinto (lista de assuntos por tema fica no código do tema e é validada por teste: nomes únicos e rasters com diferença mínima).
- Integridade (teste): 135 páginas, ids únicos, todas renderizam, ≥ 4 regiões com área ≥ 600 px, nenhuma região "linha" ocupa > 25%,
  pares dentro do tema diferem em ≥ 8% dos pixels de linha.
- Miniaturas de catálogo geradas em runtime (canvas 160 px), cacheadas em memória.

## 5. Motor de pintura
- **Camadas:** fundo branco · camada de pintura (OffscreenCanvas/Canvas 1000²) · traço ao vivo (scratch) · contorno (pré-rasterizado) por cima.
- **Coordenadas:** `ViewTransform` mapeia ponteiro (CSS px) → lógico via retângulo do canvas; backing store do canvas visível =
  tamanho CSS × devicePixelRatio; redesenho ao redimensionar/girar sem tocar a camada de pintura (obra preservada).
- **Máscara por traço:** na `pointerdown` toma-se a região sob o ponto (se cair em linha, procura a região não-linha mais
  próxima em raio 12 px). Máscara = região dilatada 2 px (cobre a borda antisserrilhada sob o contorno). Traço desenhado no
  scratch e composto com `destination-in` pela máscara; ao soltar, composto na pintura. Sem vazamento entre regiões.
- **Ferramentas (assinaturas distintas):**
  | Ferramenta | Comportamento |
  |---|---|
  | Marcador | traço contínuo opaco, ponta redonda, cor sólida |
  | Lápis | fino, textura granulada (stamps de pontos com alfa aleatório, semente determinística) |
  | Pincel | carimbos radiais suaves, largura varia com velocidade/pressão, bordas aquareladas |
  | Balde | preenche a região tocada inteira (máscara completa), animação curta de "onda" (respeita reduced-motion) |
  | Spray | nuvem de gotículas aleatórias no raio |
  | Brilho | gradiente metálico/arco-íris da paleta de brilho + estrelinhas cintilantes estampadas |
  | Padrão | revela um `CanvasPattern` (listras, bolinhas, xadrez, corações, estrelas, ondas, zigue-zague, escamas) gerado em código; toque sem arrastar preenche a região com o padrão |
- **Espessura:** 3 tamanhos (P/M/G) para marcador, lápis, pincel, spray, brilho e padrão; balde sem tamanho.
- **Pressão/caneta:** `pointerType === 'pen'` usa `pressure` no pincel e lápis.
- **Histórico:** cada gesto/preenchimento = 1 entrada `{rect, before: ImageData, after: ImageData}` (recorte do retângulo afetado).
  Limite: 40 entradas **ou** 120 MB estimados; ao exceder, descarta as mais antigas (obra consolidada nunca perdida).
  Limpar = 1 entrada (retângulo total). Novo gesto após desfazer zera o refazer.
- **Robustez:** `pointercancel`/`lostpointercapture` encerram o traço como concluído (não descartado); multi-toque ignora ponteiros
  secundários; `touch-action: none` só no canvas; renderização em `requestAnimationFrame`.

## 6. Persistência
- IndexedDB `pinta-mundo`, versão de schema **1**, store `artworks` (chave `pageId`):
  `{ schema: 1, pageId, paint: Blob(PNG da camada de pintura), thumb: Blob(PNG 256 px composto), updatedAt, createdAt, strokes: number }`.
  Migrações em `onupgradeneeded` + função `migrateRecord(rec)` por campo `schema`.
- Autosave: debounce 700 ms após cada operação, e imediato em `visibilitychange=hidden`/`pagehide`/sair da tela.
- `save()` retorna `Result`; UI só mostra "Salvo" com `ok`. Falha (cota, IDB indisponível, modo privado) → aviso visível, a obra fica em
  memória e novas tentativas continuam. Botão "Pronto!" = salvar já + celebração (só em sucesso).
- Preferências: `localStorage['pinta-mundo:prefs']` `{ v:1, lang, music, sfx, volume }` com validação e padrão.
- Exportação PNG: 1000² composto (branco + pintura + contorno), download via `<a download>`.

## 7. Interface e identidade
- Nome **Pinta Mundo**. Paleta: creme `#FFF7EC`, coral `#FF6B5A`, laranja `#FFA94D`, amarelo `#FFD43B`, menta `#38D9A9`,
  azul `#4DABF7`, roxo `#9775FA`, tinta `#2B2340`. Tipografia Baloo 2. Cantos grandes, sombras suaves, ícones SVG próprios.
- Telas (rotas por hash): `#/` entrada · `#/temas` · `#/tema/:id` · `#/pintar/:pageId` · `#/galeria` · `#/pais`.
- Pintura: canvas quadrado máximo; paisagem → ferramentas à esquerda, paleta à direita; retrato → ferramentas e paleta embaixo.
  Barra superior: voltar, desfazer, refazer, limpar, Pronto!. Alvos ≥ 56 px; ferramenta e cor ativas com anel + elevação.
- Paleta muda com a ferramenta: cores (24) / brilhos (6) / padrões (8, exibidos na cor ativa).
- Progresso: cartões de página com miniatura da obra e selo "continuar"; contador por tema.
- Galeria: obras salvas (mais recentes primeiro), abrir para continuar, exportar PNG, apagar (com confirmação).
- Botão de som (mudo) acessível na barra; demais ajustes na área dos responsáveis.
- `safe-area-inset-*`, `prefers-reduced-motion` (sem confete/ondas), foco visível, `aria-label` traduzidos.

## 8. Áudio
WebAudio sintetizado em código (sem arquivos): clique, troca de cor, balde, brilho, celebração; música de fundo curta em loop
(pentatônica). Contexto criado/retomado no primeiro gesto. Volumes separados (música/efeitos) + mudo, persistidos.

## 9. Área dos responsáveis
Portão: pergunta aritmética aleatória (ex.: "Quanto é 6 + 7?") escrita por extenso no idioma, resposta por teclado numérico; erro →
mensagem e nova pergunta; 3 erros → espera de 10 s. Dentro: idioma, música, efeitos, volume, explicação do armazenamento local
(e como fica no navegador/dispositivo), apagar todos os desenhos (confirmação dupla), atualização do app disponível, créditos/licenças.
Sem links externos.

## 10. PWA / offline
Precache de todo o build (JS com catálogo, fontes, ícones). `registerType: 'prompt'`: nova versão só é aplicada quando o usuário
toca "Atualizar" (oferecido fora da tela de pintura); obra é salva antes do reload. Manifest com ícones próprios.

## 11. Testes (resumo; detalhe no plano)
Unitários: coordenadas, rotulagem/preenchimento com furos, máscaras, ferramentas distintas (diferença de pixels), histórico,
persistência (fake-indexeddb + falha simulada), prefs, i18n completo, portão, integridade do catálogo.
E2E Playwright: os 12 cenários exigidos, com verificação de pixels/IndexedDB.

## 12. Deixado ao construtor
Composição exata de cada desenho; nomes de páginas; ícones; afinação de parâmetros das ferramentas.
