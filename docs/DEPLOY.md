# Desenvolvimento, build e deploy

Requisitos: Node 22+ (Vercel usa 24.x), npm.

```bash
npm ci
npm run dev          # http://localhost:5173 (sem service worker)
npm run lint
npm run typecheck
npm test             # Vitest (unitários, Canvas real via @napi-rs/canvas)
npm run build        # dist/ (inclui sw.js + manifest)
npm run preview      # http://localhost:4173
npm run test:e2e     # Playwright (sobe build+preview sozinho)
npm run sheet -- animals   # folha de contato de um tema em artifacts/sheets/
```

## Vercel
- Projeto existente: `jogoscolorir` (team `mzinhoww-gmailcoms-projects`), ligado a `mzinhoww-svg/jogoscolorir`.
- Branch de produção: a branch padrão do GitHub (`claude/blissful-volta-ukpmo1`). Push/merge nela publica em produção; outras branches geram preview.
- `vercel.json`: framework `vite`, `npm ci`, `npm run build`, saída `dist`. Somente `dist/` é publicado.
- Previews têm Vercel Authentication (SSO); produção em `https://jogoscolorir.vercel.app`.
- Service worker: `registerType: 'prompt'` — usuários recebem "nova versão" e escolhem quando atualizar (nunca dentro da tela de pintura, nem com desenho não salvo).
