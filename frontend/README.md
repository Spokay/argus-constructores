# Argus Constructores — frontend

```bash
npm install
npm start                               # Spanish, http://localhost:4200, proxies /api to :8080
npx ng serve --configuration=en         # English
npm run test:ci                         # single headless run (npm test = watch mode)
npm run lint
npm run typecheck
npx ng extract-i18n                     # refresh src/locale/messages.xlf after changing texts
npm run build                           # dist/argus-constructores-frontend/browser/{es,en}
```

Deployment: serve `browser/es/` under `/es/` and `browser/en/` under `/en/`, redirect `/` to
`/es/`, and fall back to each locale's `index.html` for unknown paths. Each locale reads its own
`assets/app-config.json` (`resourceServer.baseUrl`), replaceable per environment.
