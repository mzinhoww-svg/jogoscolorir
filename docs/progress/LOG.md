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
