# Especificação comportamental reconciliada — versão web

Fonte primária: `CLONE_SPEC.md` (commit `38a7c2a`, análise estática + desmontagem de `libil2cpp.so`) do APK
`apk/coloring-1-116.apk` — pacote `com.bimiboo.coloring` v1.116 (versionCode 746), Unity/IL2CPP,
SHA-256 `1bb17ff5d70eae1a4287d67832deccfc5f24ae23948db4667842756f418d9d95` (objeto LFS real, verificado).

Excluídos como referência:
- `com.bimiboo.kids.drawing` (link da loja): outro produto. Traçado pontilhado, caleidoscópio, neon-glitter e assinaturas **não** são requisitos.
- `uptodown-com.bimiboo.drawing.apk`: é o cliente da loja Uptodown (`com.uptodown` 7.41). Não usado.

Nenhuma execução dinâmica do original foi feita. Esta versão web **não** alega fidelidade visual ou comportamental integral.

Rótulos: **CONFIRMADO** (evidência citada no CLONE_SPEC), **INFERIDO**, **UNKNOWN**, **DECISÃO WEB**.

## 1. Fluxo e telas
| # | Comportamento | Status | Evidência / nota |
|---|---|---|---|
| 1.1 | Fluxo Intro → Menu (escolha de tema) → Galeria do tema (escolha da página) → Pintura | CONFIRMADO | cenas `IntroScene, MainMenu, GalleryMenu, ColoringPage` (CLONE_SPEC §2) |
| 1.2 | O menu lembra o último tema selecionado | CONFIRMADO | pref `SelectedProductType` (§2) |
| 1.3 | Botão Voltar do sistema leva a confirmação de saída | CONFIRMADO (Android) | `QuitGamePopup`; DECISÃO WEB: sem popup de saída; Voltar do navegador navega entre telas |
| 1.4 | Orientação: paisagem por padrão, regras de runtime | INFERIDO/UNKNOWN | §2. DECISÃO WEB: layout responsivo retrato e paisagem |
| 1.5 | Tela de entrada com animação | CONFIRMADO (existe intro Spine) | DECISÃO WEB: tela de entrada curta, original, com botão grande "Jogar" |

## 2. Catálogo
| 2.1 | 9 temas: animais, fundo do mar, dinossauros, alienígenas/espaço, transportes, princesas, robôs, Natal, contos de fadas | CONFIRMADO | enum `IAPProductTypes` |
| 2.2 | 15 páginas por tema (135) | CONFIRMADO | catálogo `Prefabs/<tema>/0…14` |
| 2.3 | Conteúdo dos desenhos originais | UNKNOWN | DECISÃO WEB: 135 desenhos vetoriais **originais**, sem reaproveitar arte |
| 2.4 | Apenas "Animals" gratuito; demais pagos e baixados de CDN | CONFIRMADO | §3.1/§4.2 | DECISÃO WEB: tudo liberado, tudo empacotado no app |

## 3. Pintura
| 3.1 | Ferramentas: Marcador, Lápis, Pincel, Balde, Spray, Brilho, Padrão | CONFIRMADO | enum `BrushTypes` |
| 3.2 | Paletas: Cor, Brilho, Padrão | CONFIRMADO | enum `PaletteTypes` |
| 3.3 | Aparência exata de cada ferramenta, tamanhos, cores | UNKNOWN | DECISÃO WEB: cada ferramenta com assinatura visual própria (ver design) |
| 3.4 | Desfazer | CONFIRMADO | `Paintable.Undo` |
| 3.5 | Refazer | UNKNOWN (não encontrado) | DECISÃO WEB: incluído |
| 3.6 | Limpar tudo | CONFIRMADO | `OnButtonTrash`, `P3dButtonClearAll` | DECISÃO WEB: com confirmação e desfazível |
| 3.7 | Camadas fundo/frente para não vazar entre regiões | INFERIDO | campos `_back/_frontground/LayerSelection` | DECISÃO WEB: mapa de regiões a partir do contorno; traço preso à região inicial |
| 3.8 | Escala de padrão ajustável | CONFIRMADO (existe `ChangePatternTileScale`) | DECISÃO WEB: escala fixa por padrão, espessura ajustável |
| 3.9 | Partículas/sons ao pintar e salvar | CONFIRMADO | `ParticleEffectManager`, sons `click/color/fill` |

## 4. Salvar e galeria
| 4.1 | Salvar gera PNG da tela + miniatura `-icon.png` e reinicia a tela | CONFIRMADO | `<OnSave>d__14.MoveNext` |
| 4.2 | Miniaturas no menu/galeria | CONFIRMADO | `LoadIcons`, `GetCache` |
| 4.3 | Continuar editando uma obra salva | UNKNOWN (o original limpa a tela após salvar) | DECISÃO WEB: obra editável persistida e reabrível |
| 4.4 | Autosave | UNKNOWN | DECISÃO WEB: autosave após cada operação e ao sair |
| 4.5 | Exportar/compartilhar | Não encontrado | DECISÃO WEB: exportar PNG (fundo branco + pintura + contorno) |

## 5. Configurações, idiomas, áudio
| 5.1 | Música de fundo liga/desliga | CONFIRMADO | `bgMusicButtonSwitcher` |
| 5.2 | Seleção de idioma (~43) com padrão do sistema | CONFIRMADO | `Locale.get_GetShortCode` |
| 5.3 | Restaurar compras | CONFIRMADO | DECISÃO WEB: removido (não há compras) |
| 5.4 | DECISÃO WEB: pt-BR (padrão), en, es completos; música, efeitos e volume persistidos | — | |

## 6. Área dos responsáveis
| 6.1 | Portão parental (conta matemática ou ano), A/B | CONFIRMADO | `ParentalGateMath`, `ParentalGateYear` |
| 6.2 | Resposta errada → nova tarefa | CONFIRMADO | `WrongSolutionAnimation` |
| 6.3 | Conteúdo para pais: links sociais, contato, outros apps | CONFIRMADO | §3.6 | DECISÃO WEB: sem links do fornecedor; área com configurações, explicação de armazenamento, apagar dados e créditos |
| 6.4 | DECISÃO WEB: portão matemático (soma/multiplicação com teclado numérico) antes da área e de qualquer link externo | — | |

## 7. Fora do escopo (adaptações registradas)
Compras (IAP), vitrine promocional (shelf), endpoints `cdn.bimiboo.net`/`shelf.bimiboo.net`, A/B tests, Firebase,
notificações locais, pedido de avaliação (6/30 salvamentos), `PlayerPrefs.DeleteAll`. Ver `docs/PARITY_MATRIX.md`.
