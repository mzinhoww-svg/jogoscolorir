# Registro de decisões e progresso — Pinta Mundo

## Contexto verificado (2026-10-20)
- Repo `mzinhoww-svg/jogoscolorir` (público). Branch padrão/produção: `claude/blissful-volta-ukpmo1` (Vercel produção `dpl_HzBiJJuvA4sP5AySqZGRUKNtWAgj` veio dela, commit 38a7c2a).
- Vercel: projeto `jogoscolorir` (`prj_QNInFqTzZeS7P6jUnyXQU9LLf7YE`, team `team_SOZVnHod91BcrmLMYmdmvB8k`), framework null, Node 24.x, SSO protection `all_except_custom_domains`, domínio `jogoscolorir.vercel.app`.
- APK LFS real: sha256 1bb17ff5…9d95. `uptodown-*.apk` = com.uptodown (descartado). `Untitled session(1).md` não encontrado no ambiente.
- Superpowers 7.0.0.

## Decisões
- D1 Stack React+TS+Vite, Canvas 2D, PWA (design §2).
- D2 Branch de trabalho `feat/pinta-mundo` no checkout principal (sem worktree separada: repo novo, sem trabalho concorrente). PR → `claude/blissful-volta-ukpmo1`.
- D3 `vercel.json` explícito (framework vite, dist). `apk/`, `re/` nunca entram em `dist`.
- D4 Arte em DSL vetorial; regiões derivadas do contorno.
- D5 Execução subagent-driven; arte paralelizada por tema.

## Tarefas
| Task | Status | Commit | Verificação |
|---|---|---|---|
| 1 Scaffold | ok | 6c1de69 | lint/tc/test/build |
| 2 Catálogo/regiões | ok | 596871d..ab51641 | regions+catalog |
| 3 Motor | ok | 95016eb..7dc17d1 | 28+ testes |
| 4 Persistência | ok | 257da5b | 19 testes |
| 5 i18n/áudio | ok | b8ad1d3..c7222ed | |
| 6 Interface | ok | 513fe63..ea76fb6 | revisão opus, fila de salvamento |
| 7 Arte 135 páginas | ok | merges eff89ad, 896d9d4, (robots…) + 5dd41ea | catalog 300/300 |
| 8 PWA | ok | 654f0c9..86599e4 | offline E2E |
| 9 E2E | ok | 5f609d1..a25f1ac | 13–14 testes |
| Revisão final + correções | ok | 571d579..7580fd3 | 405 unit, 14 E2E |
| 10 Docs/deploy | ok | PR #1 → 8b4ddb2 | preview 14/14, produção 14/14 |

## Rulings (decisões tomadas sem consulta)
- Branch de trabalho no checkout principal; arte e persistência em worktrees paralelas — custo: merges extras.
- Script de folha de contato escrito pelo controlador (ferramenta, não produto).
- Animação de onda do balde e reduced-motion na UI, não no motor.
- CATALOG_COMPLETE ativado pelo controlador após os 135 desenhos.
- Trailer "Sonnet" em alguns commits de subagentes mantido (sem reescrever histórico).
- Atualização multi-aba e nova tentativa após navegação durante flush: estacionados (seguros, nunca recarregam).

## Próximo passo
Concluído. Sugestões futuras: polir desenhos fracos, testar Safari/iOS, avaliar remover o APK de terceiros do repositório público.
