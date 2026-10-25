# Argus Constructores — frontend

```bash
npm install
npm start            # http://localhost:4200, proxies /api to http://localhost:8080
npm run test:ci      # single headless run (npm test = watch mode)
npm run lint
npm run typecheck
npm run build        # dist/argus-constructores-frontend
```

Deployment: the build is environment-independent; serve `dist/` and replace
`assets/app-config.json` (`resourceServer.baseUrl`) per environment.
