# Matriz de paridade: evidência original → comportamento web → implementação → validação

Status: CONFIRMADO / INFERIDO / UNKNOWN (sobre o original) · DECISÃO WEB (sobre esta versão).
Evidência = seção do `CLONE_SPEC.md` (análise estática/desmontagem do APK `com.bimiboo.coloring` 1.116). Nenhuma execução dinâmica do original.
Colunas "Implementação" e "Validação" apontam para código e testes deste repositório.

| # | Original (status, evidência) | Comportamento web (decisão) | Implementação | Validação |
|---|---|---|---|---|
| 1 | Cenas Intro→Menu→Galeria→Pintura (CONFIRMADO §2) | Entrada → Temas → Páginas do tema → Pintura; Galeria e Área dos responsáveis | `src/ui/screens/*`, `src/ui/router.ts` | E2E 01 |
| 2 | 9 temas (CONFIRMADO, enum IAPProductTypes) | 9 temas com nomes próprios nos 3 idiomas | `src/catalog/themes/*` | `catalog.test.ts` |
| 3 | 15 páginas/tema (CONFIRMADO, catálogo) | 135 desenhos vetoriais originais, assuntos distintos | `src/catalog/themes/*` | `catalog.test.ts` (contagem, regiões, distância) |
| 4 | Só "Animals" grátis; demais pagos via CDN (CONFIRMADO §3.1/§4) | DECISÃO WEB: tudo liberado e empacotado; sem compras, sem restaurar compras | — (ausência deliberada) | revisão de código: nenhum fluxo de compra |
| 5 | Ferramentas Marker…Pattern (CONFIRMADO, enum BrushTypes) | 7 ferramentas com assinaturas visuais distintas | `src/engine/tools.ts`, `patterns.ts` | `tools.test.ts`, E2E 02–03 |
| 6 | Paletas Color/Shine/Pattern (CONFIRMADO) | 24 cores, 6 brilhos, 8 padrões; paleta segue a ferramenta | `src/engine/tools.ts`, `src/ui/components/Palette.tsx` | E2E 02 |
| 7 | Bloqueio de cores pela compra "tools" (CONFIRMADO §3.2) | DECISÃO WEB: todas as cores liberadas | — | revisão |
| 8 | Camadas para não vazar (INFERIDO §3.2) | Mapa de regiões do contorno; traço preso à região inicial; contorno por cima | `src/engine/regions.ts`, `session.ts` | `regions.test.ts`, `session.test.ts`, E2E 04 |
| 9 | Desfazer (CONFIRMADO) / Refazer (não encontrado) | Desfazer e refazer, 1 passo por gesto | `src/engine/history.ts` | `history.test.ts`, E2E 05 |
| 10 | Limpar tudo (CONFIRMADO) sem confirmação conhecida | Limpar com confirmação; desfazível | `Paint.tsx`, `session.clear()` | E2E 05 |
| 11 | Salvar PNG + ícone e limpar a tela (CONFIRMADO §3.3) | Autosave da obra editável + miniatura; "Pronto!" salva e celebra; continua editável | `src/persistence/artworks.ts`, `Paint.tsx` | `artworks.test.ts`, E2E 06 |
| 12 | Nenhuma exportação/compartilhamento (CONFIRMADO ausência) | Exportar PNG composto (fundo + pintura + contorno) | `session.exportCompositePNG` | E2E 07 |
| 13 | Rate-us por salvamentos 6/30 (CONFIRMADO §3.10) | DECISÃO WEB: removido | — | revisão |
| 14 | Música on/off (CONFIRMADO) | Música, efeitos e volume, persistidos; áudio sintetizado original | `src/audio/audio.ts`, `prefs.ts` | `audio.test.ts`, `prefs.test.ts`, E2E 11 |
| 15 | ~43 idiomas, padrão do sistema (CONFIRMADO §3.4) | pt-BR (padrão), en, es completos | `src/i18n/*` | `i18n.test.ts`, E2E 11 |
| 16 | Portão parental math/ano com A/B (CONFIRMADO §3.5) | Portão aritmético; erro → nova pergunta; 3 erros → 10 s | `src/ui/parentalGate.ts`, `ParentalGate.tsx` | `parentalGate.test.ts`, E2E 12 |
| 17 | Área para pais com links sociais/apps (CONFIRMADO §3.6) | Configurações, explicação do armazenamento local, apagar dados, créditos; sem links externos | `Parents.tsx` | E2E 12 |
| 18 | Vitrine promocional shelf.bimiboo.net (CONFIRMADO §3.7) | DECISÃO WEB: não reproduzida | — | revisão (nenhuma URL do fornecedor) |
| 19 | Notificações locais (CONFIRMADO §3.9) | DECISÃO WEB: não reproduzidas | — | revisão |
| 20 | Firebase Analytics sempre ligado (CONFIRMADO §5) | DECISÃO WEB: sem analytics/rastreamento | — | revisão de dependências |
| 21 | A/B test remoto e `PlayerPrefs.DeleteAll` (CONFIRMADO §6) | DECISÃO WEB: não reproduzidos | — | revisão |
| 22 | Download de packs via CDN com checksum (CONFIRMADO §3.1) | DECISÃO WEB: PWA com precache total; offline após 1ª carga | `vite.config.ts` (VitePWA), `src/pwa/*` | E2E 10 |
| 23 | Orientação paisagem + regras de runtime (INFERIDO/UNKNOWN §2) | Layout responsivo retrato/paisagem; obra preservada na rotação | `Paint.tsx`, `session.resize()` | `session.test.ts`, E2E 08 |
| 24 | Ajuste de escala do padrão (CONFIRMADO nome) | Espessura P/M/G; escala do padrão fixa | `tools.ts` | `tools.test.ts` |
| 25 | Partículas e sons ao pintar (CONFIRMADO) | Sons sintetizados; celebração discreta; respeita reduced-motion | `audio.ts`, `Celebration` | revisão visual |
