# Autoria e licenças dos assets

## Conteúdo original deste projeto
Todo o conteúdo abaixo foi criado para o Pinta Mundo, sem copiar, recortar nem converter material do aplicativo original
(`com.bimiboo.coloring`) ou de qualquer outra marca. Nenhum arquivo extraído do APK é usado.

| Asset | Onde | Como foi feito |
|---|---|---|
| 135 desenhos para colorir | `src/catalog/themes/*.ts` | Desenhados em código (DSL vetorial própria, `src/catalog/dsl.ts`) por agentes de IA a partir de uma lista de assuntos genéricos. Nenhum personagem licenciado. |
| Nomes das páginas, textos da interface (pt-BR/en/es) | `src/i18n/` | Redação própria |
| Ícones da interface | `src/ui/components/Icon.tsx` (SVG inline) | Desenho próprio |
| Ícones do app/PWA | `public/icons/*`, gerados por `scripts/icons.ts` | Desenho próprio (SVG renderizado) |
| Logo "Pinta Mundo" | componente da Home | Desenho próprio (formas simples) |
| Padrões (listras, bolinhas…) e brilhos | `src/engine/patterns.ts`, `tools.ts` | Gerados em código |
| Música e efeitos sonoros | `src/audio/audio.ts` | Sintetizados em tempo real com WebAudio (osciladores); nenhum arquivo de áudio |

Licença do conteúdo original: a definir pelo titular do repositório (sugestão: mesma licença do código).

## Terceiros empacotados no app
| Pacote | Licença | Uso |
|---|---|---|
| React, React DOM | MIT | UI |
| idb | ISC | IndexedDB |
| workbox-window / Workbox (via vite-plugin-pwa) | MIT | Service worker / offline |
| Baloo 2 (`@fontsource/baloo-2`) | SIL Open Font License 1.1 | Tipografia, arquivos de fonte empacotados |

Ferramentas só de desenvolvimento (Vite, Vitest, Playwright, ESLint, Prettier, @napi-rs/canvas, fake-indexeddb, tsx) não são distribuídas no build.

## Material de análise no repositório
`apk/coloring-1-116.apk` (Git LFS), `CLONE_SPEC.md` e `re/` são evidências da análise do app original, de terceiros.
**Não fazem parte do produto** e são excluídos do deploy (`.vercelignore`; o build só publica `dist/`).
Observação: o repositório é público e contém o APK de terceiros; o titular deve avaliar removê-lo do repositório/histórico.
