# Pinta Mundo

Jogo de colorir para crianças pequenas, feito para a web (PWA): 9 temas, 135 desenhos originais, 7 ferramentas,
autosave, galeria, exportação PNG, português do Brasil, inglês e espanhol, área dos responsáveis com portão, e uso offline
após a primeira visita. Sem anúncios, cadastro, rastreamento ou cobrança.

**Jogar:** https://jogoscolorir.vercel.app

## Fluxo
Entrada → escolha do tema → escolha do desenho → pintura → "Pronto!" (salva) → reabrir em "Meus desenhos".

## Ferramentas
Marcador, lápis, pincel, balde, spray, brilho e padrões. Cada uma tem um resultado visual próprio. A pintura fica presa à
região onde o traço começa, então não vaza para as áreas vizinhas, e o contorno fica sempre por cima. Há 3 espessuras,
24 cores, 6 brilhos e 8 padrões. Desfazer e refazer contam um passo por gesto. Limpar pede confirmação.

## Onde ficam os desenhos
No IndexedDB deste navegador, neste aparelho. Nada é enviado à internet. Limpar os dados do site apaga os desenhos.
Para guardar uma cópia, exporte o PNG.

## Arquitetura
| Pasta | Responsabilidade |
|---|---|
| `src/catalog` | Temas, desenhos em DSL vetorial (1000×1000 lógico), render do contorno |
| `src/engine` | Mapa de regiões, ferramentas, padrões, histórico, sessão de pintura (Canvas 2D) |
| `src/persistence` | IndexedDB versionado (obras), preferências (localStorage), `Result` de erros |
| `src/audio` | Sons e música sintetizados com WebAudio |
| `src/i18n` | Dicionários pt-BR / en / es tipados |
| `src/ui` | Telas React, portão parental, fila de salvamento |
| `src/pwa` | Service worker (Workbox), atualização segura |

## Desenvolvimento
Veja `docs/DEPLOY.md`. Comandos principais: `npm ci`, `npm run dev`, `npm test`, `npm run test:e2e`, `npm run build`.

## Documentação
- Especificação comportamental reconciliada: `docs/spec/behavior-spec.md`
- Design da versão web: `docs/superpowers/specs/2026-10-20-pinta-mundo-web-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-10-20-pinta-mundo-web.md`
- Decisões e progresso: `docs/progress/LOG.md`
- Matriz de paridade: `docs/PARITY_MATRIX.md`
- Autoria e licenças: `docs/ASSETS_LICENSE.md`
- Relatório de validação: `docs/VALIDATION_REPORT.md`

## Material de análise
`CLONE_SPEC.md`, `re/` e `apk/` documentam a análise do aplicativo original (`com.bimiboo.coloring`), que serviu
apenas como referência de comportamento. Nada disso entra no app publicado. Esta versão não reproduz arte, sons, textos,
marcas nem código daquele aplicativo, e não afirma fidelidade integral a ele, porque o original não foi executado.
