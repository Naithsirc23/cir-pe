# Servicio local privado de CIR Projects — Fase 1

Este servicio conserva la información privada de CIR Projects en SQLite y ofrece lectura y, cuando se habilita explícitamente, organización manual. Debe ejecutarse en tu computador Linux, no en Vercel ni en una instancia temporal. En el host de Cris se vincula de forma fija a `127.0.0.1:8003`, porque el puerto `8002` pertenece a otro servicio local; Tailscale Serve es la única capa que debe permitir acceso desde tus otros dispositivos.

> La lectura privada está disponible por defecto. La organización por red exige una bandera explícita, un origen web permitido y acceso a tu tailnet; así puedes mantener el modo de solo lectura cuando lo prefieras.

## 1. Requisitos del host Linux

| Requisito | Comprobación |
|---|---|
| Node.js 22.5 o posterior | `node --version` |
| pnpm mediante Corepack | `corepack enable && pnpm --version` |
| Tailscale instalado e iniciado | `tailscale status` |
| Directorio de instalación | `/home/cris/GITHUBS/DASHBOARDCIR` |

SQLite utiliza `node:sqlite`, incluido en Node.js moderno; no se instala un motor de base de datos externo. La base se genera por defecto en `private-service/data/cir-projects.sqlite` y está excluida de Git.

## 2. Instalar y preparar la base local

Ejecuta los siguientes comandos en tu computador Linux. La copia local del repositorio es necesaria porque ahí viven el servicio Node, los scripts y la base SQLite; Vercel solo distribuye la interfaz web pública.

```bash
mkdir -p /home/cris/GITHUBS
git clone https://github.com/Naithsirc23/cir-pe.git /home/cris/GITHUBS/DASHBOARDCIR
cd /home/cris/GITHUBS/DASHBOARDCIR
corepack enable
pnpm install --frozen-lockfile
pnpm private:db:init
pnpm private:db:sync-github
```

Si ya existe esa copia local, no ejecutes `git clone` de nuevo. Actualízala así:

```bash
cd /home/cris/GITHUBS/DASHBOARDCIR
git pull --ff-only
pnpm install --frozen-lockfile
```

La sincronización inicial obtiene los repositorios públicos de `Naithsirc23` y no incorpora un token de GitHub. Si en el futuro requieres repositorios privados, configura `GITHUB_TOKEN` solo en el archivo de entorno local, nunca en el frontend ni en Git.

## 3. Definir categorías y orden manual local

La API de la Fase 1 es de lectura, pero puedes organizar el dashboard sin exponer un endpoint de escritura. Copia el ejemplo a una ruta privada fuera del repositorio y edita tus categorías, IDs de GitHub, posiciones y seguimiento.

```bash
cp private-service/organization.example.json ~/.config/cir-private-api/organization.json
chmod 600 ~/.config/cir-private-api/organization.json
```

Cada proyecto debe usar el valor numérico de `githubId`. Puedes localizarlo tras la sincronización con `curl http://127.0.0.1:8003/api/projects` cuando la API esté activa, o directamente en la respuesta pública de GitHub. Ejecuta la importación local después de editar el archivo:

```bash
set -a
source ~/.config/cir-private-api/env
export CIR_PRIVATE_ORGANIZATION_PATH="$HOME/.config/cir-private-api/organization.json"
set +a
pnpm private:db:apply-organization
```

La importación actualiza categorías por nombre, aplica `position` ascendente a categorías y cards, y guarda siguiente tarea, motivo de bloqueo y notas en SQLite. Si un `githubId` no existe o una categoría está mal escrita, falla la transacción sin aplicar cambios parciales. No añadas ese archivo al repositorio.

## 4. Crear el archivo de entorno local

```bash
mkdir -p ~/.config/cir-private-api
chmod 700 ~/.config/cir-private-api
cat > ~/.config/cir-private-api/env <<'EOF'
CIR_PRIVATE_PORT=8003
CIR_PRIVATE_DB_PATH=/home/cris/GITHUBS/DASHBOARDCIR/private-service/data/cir-projects.sqlite
CIR_GITHUB_USERNAME=Naithsirc23
CIR_PRIVATE_ALLOWED_ORIGINS=https://cir-projects-dashboard.vercel.app
CIR_PRIVATE_ORGANIZATION_PATH=/home/cris/.config/cir-private-api/organization.json
CIR_PRIVATE_WRITE_ENABLED=false
CIR_PRIVATE_WRITE_CAPABILITY=cir.pe/cir-projects-organize
EOF
chmod 600 ~/.config/cir-private-api/env
```

La configuración está preparada para el usuario `cris` y la ruta `/home/cris/GITHUBS/DASHBOARDCIR`. No pongas secretos en `CIR_PRIVATE_ALLOWED_ORIGINS`; solo admite orígenes web públicos permitidos. Si se usa un token de GitHub, añade una línea `GITHUB_TOKEN=...` con permisos mínimos y conserva `chmod 600`.

## 5. Habilitar la organización manual desde la PWA

La organización editable está apagada por defecto. Antes de activarla, configura una capacidad de aplicación de Tailscale. Consulta el archivo [`tailscale-policy.example.hujson`](./tailscale-policy.example.hujson) y añade sus secciones a tu política existente sin reemplazarla. Sustituye el usuario de ejemplo por tu usuario real de Tailscale; la regla concede solo TCP 8443 y la capacidad `cir.pe/cir-projects-organize` al nodo `cir-private-api`.

> Las capacidades de aplicación requieren Tailscale 1.92 o posterior. Comprueba la versión con `tailscale version` y actualiza Tailscale antes de continuar si fuera necesario. No actives la bandera de escritura hasta que la política haya sido guardada sin errores.

Cuando la política esté activa, cambia la bandera local, reinicia el servicio y vuelve a crear el listener de Serve aceptando únicamente esa capacidad:

```bash
sed -i 's/^CIR_PRIVATE_WRITE_ENABLED=.*/CIR_PRIVATE_WRITE_ENABLED=true/' ~/.config/cir-private-api/env
systemctl --user restart cir-private-api.service
tailscale serve --https=8443 --accept-app-caps=cir.pe/cir-projects-organize --bg http://127.0.0.1:8003
curl --noproxy '*' https://papakaj-hpnotebook.tailae879d.ts.net:8443/api/health
```

El healthcheck debe informar `"readOnlyMode":false`. La PWA solo permite estas escrituras cuando se cumplen a la vez: el endpoint privado está disponible por Tailscale, el navegador se carga desde `https://cir-projects-dashboard.vercel.app`, `CIR_PRIVATE_WRITE_ENABLED=true` y Serve adjunta la capacidad solicitada en la política. Para volver a bloquear cambios remotos, restablece `false`, reinicia el servicio y aplica de nuevo Serve sin `--accept-app-caps`.

## 6. Probar la API exclusivamente en localhost

Primero carga las variables locales y arranca el servicio en una terminal.

```bash
set -a
source ~/.config/cir-private-api/env
set +a
pnpm private:api
```

En una segunda terminal se validan los endpoints.

```bash
curl http://127.0.0.1:8003/api/health
curl http://127.0.0.1:8003/api/categories
curl 'http://127.0.0.1:8003/api/projects?limit=20'
curl -X POST -i http://127.0.0.1:8003/api/projects
```

Los tres primeros comandos deben devolver JSON. El último debe responder `405 Method Not Allowed`. Con la bandera de escritura desactivada, un `PATCH` o `PUT` responderá `403`.

## 7. Mantener el servicio activo con systemd de usuario

El archivo de unidad ya está preparado para `/home/cris/GITHUBS/DASHBOARDCIR`.

```bash
mkdir -p ~/.config/systemd/user
cp private-service/systemd/cir-private-api.service ~/.config/systemd/user/cir-private-api.service
systemctl --user daemon-reload
systemctl --user enable --now cir-private-api.service
systemctl --user status cir-private-api.service
```

Para que el servicio de usuario siga ejecutándose tras cerrar la sesión, habilita linger una vez:

```bash
sudo loginctl enable-linger "$USER"
```

Los diagnósticos se consultan con `journalctl --user -u cir-private-api.service -f`. Detén el servicio con `systemctl --user disable --now cir-private-api.service`.

## 8. Publicar solo dentro de tu tailnet mediante Tailscale Serve

Después de confirmar el healthcheck local, conecta el host a Tailscale y configura el proxy. No uses Funnel, no abras puertos en el router y no cambies el bind de la API.

```bash
tailscale status
tailscale serve --https=8443 --bg http://127.0.0.1:8003
tailscale serve status
```

El listener `8443` evita competir con London-BOS, que conserva el HTTPS raíz (`443`) de este mismo nodo. `tailscale serve status` mostrará el proxy de CIR Projects hacia `http://127.0.0.1:8003`. Desde un teléfono o computador autorizado en la misma tailnet:

```bash
curl --noproxy '*' -i https://<nodo>.<tailnet>.ts.net:8443/api/health
```

Para retirar el acceso privado sin borrar la base ni detener la API, ejecuta:

```bash
tailscale serve --https=8443 off
```

## 9. Pruebas de aceptación

| Escenario | Resultado correcto |
|---|---|
| Host Linux | `curl http://127.0.0.1:8003/api/health` responde JSON |
| Otro equipo personal con Tailscale | La URL `*.ts.net:8443/api/health` responde JSON HTTPS |
| Equipo fuera de la tailnet | No puede alcanzar la API privada |
| `PATCH` o `PUT` con la escritura desactivada | Respuesta `403` |
| `PATCH` o `PUT` sin la capacidad Tailscale configurada | Respuesta `403` |
| Organización desde la PWA autorizada con escritura activada | Categoría u orden se guardan en SQLite |
| Origen distinto de Vercel | Sin encabezado CORS de autorización |

## 10. Límites y controles

La base almacena `categories.position` y `projects.position` para el orden manual, junto con categoría, siguiente tarea, bloqueo y notas. La PWA ya incorpora `VITE_CIR_PRIVATE_API_URL`: si alcanza la tailnet, usa los datos privados y permite organizar cuando la bandera local está activa; si no, conserva el backend público como fallback. La edición de siguiente tarea, bloqueos, estado y prioridades seguirá en el plano privado en una siguiente etapa.

## Referencias

[1]: https://tailscale.com/docs/reference/tailscale-cli/serve "Tailscale — comando Serve"
[2]: https://tailscale.com/docs/reference/examples/serve "Tailscale — ejemplos de Serve"
