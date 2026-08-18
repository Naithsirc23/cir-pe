# CIR Projects

Dashboard personal para visualizar y organizar los repositorios de desarrollo de `Naithsirc23`.

## Uso personal sin autenticación

La aplicación no requiere registro, OAuth, cookies de sesión ni token de GitHub para cargar los repositorios públicos de `Naithsirc23`. Al abrir el dashboard, consulta la API pública de GitHub y muestra los proyectos directamente.

## Variables de entorno

| Variable | Requerida | Uso |
|---|---:|---|
| `GITHUB_TOKEN` | No | Amplía el límite de la API de GitHub y permite sincronizar repositorios privados de la misma cuenta. |
| `DATABASE_URL` | No | Habilita persistencia de carpetas, notas, estados, prioridades y avances. Sin ella, los repositorios públicos siguen siendo visibles en modo de solo lectura. |

> No se requieren variables de OAuth, como `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` o `JWT_SECRET`, para el modo personal básico.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Para generar una compilación de producción, ejecuta `pnpm build`; para validar la suite, ejecuta `pnpm test`.
