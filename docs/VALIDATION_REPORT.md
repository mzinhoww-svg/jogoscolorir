# Relatório de validação — Pinta Mundo

Data: 2026-10-20. Branch `feat/pinta-mundo`, commit validado `3ba0487` (preview Vercel `dpl_B5Cx9jT2j8gJ8bquab7zyjcU8G1E`).
Os números de produção ficam na seção "Produção", preenchida após o merge.

## Verificações técnicas (executadas localmente, Node 22, Chromium 1194)
| Verificação | Comando | Resultado |
|---|---|---|
| Instalação limpa | `npm ci` | ok |
| Lint | `npm run lint` | 0 erros |
| Tipos | `npm run typecheck` | 0 erros |
| Unitários | `npm test` | 17 arquivos, **405/405** |
| Build | `npm run build` | ok; precache 39 entradas (1123 KiB) |
| E2E local | `npm run test:e2e` | **14/14** (repeat-each 2: 26/26 antes da última leva) |
| E2E no preview Vercel | Playwright com `baseURL` do preview + link de acesso temporário | **14/14** |
| Artefato público | `find dist` | 37 arquivos; sem APK, `.so`, `re/`, `CLONE_SPEC` |

## Cobertura exigida
| Exigência | Teste |
|---|---|
| Coordenadas e redimensionamento | `transform.test.ts`, `session.test.ts` (dpr 1/2/3, resize no meio do traço) |
| Preenchimento, bordas e recortes | `regions.test.ts` (anel com furo), `session.test.ts`, E2E 4 |
| Máscaras das ferramentas | `session.test.ts` (traço não cruza região; toque na linha → região vizinha; região 0 ignorada) |
| Desfazer/refazer | `history.test.ts`, E2E 5 (igualdade exata de pixels) |
| Salvamento e recuperação | `artworks.test.ts`, `saveQueue.test.ts`, E2E 6 (hash do canvas após recarregar; contagem de traços no IndexedDB) |
| Preferências e idiomas | `prefs.test.ts`, `i18n.test.ts` (3 idiomas, mesmas chaves, 135 nomes), E2E 11 |
| Portão parental | `parentalGate.test.ts`, E2E 11–12 |
| Falha de armazenamento | `artworks.test.ts` (unavailable/quota), E2E falha síncrona e assíncrona (nunca exibe "Salvo") |
| Integridade do catálogo | `catalog.test.ts`: 135 páginas, 15/tema, ids únicos, ≥4 regiões ≥600 px, linhas ≤25%, pares distintos ≥8% |
| 7 ferramentas distintas | `tools.test.ts` + E2E 2+3 (asserções por ferramenta; cada par difere em ≥2 métricas) |
| PNG válido | E2E 7 (assinatura, IHDR 1000×1000, opaco, fundo branco, contorno e cor presentes) |
| Orientação | E2E 8 |
| Toque em celular | E2E 9 (CDP touch events, dpr 3, sem rolagem com documento rolável) |
| Offline após cache | E2E 10 (página aberta pela primeira vez já offline) |
| Atualização segura | `applyUpdate.test.ts` (recusa em `#/pintar`, com fila suja, flush falho; nova tentativa automática) |

## Inspeção visual
Capturas em 360×640, 640×360, 390×844, 768×1024, 1024×768 e 1440×900 (Home, Temas, Páginas, Pintura, Galeria, Pais).
Folhas de contato dos 9 temas revisadas pelo controlador; 6 páginas fracas foram redesenhadas.

## Limitações reais
- Não houve execução dinâmica do aplicativo original; nenhuma fidelidade visual ou comportamental integral é afirmada.
- Testado só em Chromium (desktop e emulação móvel). Safari/iOS e Firefox não foram executados neste ambiente.
- Sem teste em aparelho físico; toque testado por emulação CDP.
- Áudio verificado por testes com AudioContext simulado; a audição real não foi verificada.
- Em 360×640 e 640×360 a paleta é uma faixa rolável.
- Alguns desenhos têm pontinhos onde linhas quase se tocam (robots-10, fairytale-01, fairytale-15).
- Atualização bloqueada por desenho não salvo: se a criança abrir a pintura durante a gravação, a atualização espera o botão manual.
