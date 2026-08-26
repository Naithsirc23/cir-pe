# Servicio local privado de CIR Projects — Fase 1

Este servicio conserva la información privada de CIR Projects en SQLite y ofrece únicamente rutas de lectura. Debe ejecutarse en tu computador Linux, no en Vercel ni en una instancia temporal. La API se vincula de forma fija a `127.0.0.1:8002`; Tailscale Serve es la única capa que debe permitir acceso desde tus otros dispositivos.

> La Fase 1 no modifica categorías, orden ni seguimiento a través de la red. Su objetivo es comprobar la base local, el contrato de lectura y la conectividad privada antes de habilitar escritura en una etapa posterior.

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

Cada proyecto debe usar el valor numérico de `githubId`. Puedes localizarlo tras la sincronización con `curl http://127.0.0.1:8002/api/projects` cuando la API esté activa, o directamente en la respuesta pública de GitHub. Ejecuta la importación local después de editar el archivo:

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
CIR_PRIVATE_PORT=8002
CIR_PRIVATE_DB_PATH=/home/cris/GITHUBS/DASHBOARDCIR/private-service/data/cir-projects.sqlite
CIR_GITHUB_USERNAME=Naithsirc23
CIR_PRIVATE_ALLOWED_ORIGINS=https://cir-projects-dashboard.vercel.app
CIR_PRIVATE_ORGANIZATION_PATH=/home/cris/.config/cir-private-api/organization.json
EOF
chmod 600 ~/.config/cir-private-api/env
```

La configuración está preparada para el usuario `cris` y la ruta `/home/cris/GITHUBS/DASHBOARDCIR`. No pongas secretos en `CIR_PRIVATE_ALLOWED_ORIGINS`; solo admite orígenes web públicos permitidos. Si se usa un token de GitHub, añade una línea `GITHUB_TOKEN=...` con permisos mínimos y conserva `chmod 600`.

## 5. Probar la API exclusivamente en localhost

Primero carga las variables locales y arranca el servicio en una terminal.

```bash
set -a
source ~/.config/cir-private-api/env
set +a
pnpm private:api
```

En una segunda terminal se validan los endpoints.

```bash
curl http://127.0.0.1:8002/api/health
curl http://127.0.0.1:8002/api/categories
curl 'http://127.0.0.1:8002/api/projects?limit=20'
curl -X PATCH -i http://127.0.0.1:8002/api/projects
```

Los tres primeros comandos deben devolver JSON. El último debe responder `405 Method Not Allowed` y `Allow: GET, OPTIONS`, confirmando que el servicio sigue en modo de solo lectura.

## 6. Mantener el servicio activo con systemd de usuario

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

## 7. Publicar solo dentro de tu tailnet mediante Tailscale Serve

Después de confirmar el healthcheck local, conecta el host a Tailscale y configura el proxy. No uses Funnel, no abras puertos en el router y no cambies el bind de la API.

```bash
tailscale status
tailscale serve --bg 8002
tailscale serve status
```

`tailscale serve status` mostrará un hostname `https://<nodo>.<tailnet>.ts.net` y el proxy hacia `http://127.0.0.1:8002`. Desde un teléfono o computador autorizado en la misma tailnet:

```bash
curl https://<nodo>.<tailnet>.ts.net/api/health
```

Para retirar el acceso privado sin borrar la base ni detener la API, ejecuta:

```bash
tailscale serve off
```

## 8. Pruebas de aceptación

| Escenario | Resultado correcto |
|---|---|
| Host Linux | `curl http://127.0.0.1:8002/api/health` responde JSON |
| Otro equipo personal con Tailscale | La URL `*.ts.net/api/health` responde JSON HTTPS |
| Equipo fuera de la tailnet | No puede alcanzar la API privada |
| Cualquier `PATCH`, `POST` o `DELETE` | Respuesta `405` |
| Origen distinto de Vercel | Sin encabezado CORS de autorización |

## 9. Límites de la Fase 1

La base almacena `categories.position` y `projects.position` para el orden manual, junto con categoría, siguiente tarea, bloqueo y notas. En esta fase la API los **lee** y un comando local importa la organización; la escritura y el arrastrar/soltar desde la PWA se agregarán después de validar Tailscale, las ACL y la auditoría. La integración del frontend con `VITE_CIR_PRIVATE_API_URL` también se deja para la siguiente fase, evitando publicar la URL privada o activar edición antes de que la red sea comprobada.

## Referencias

[1]: https://tailscale.com/docs/reference/tailscale-cli/serve "Tailscale — comando Serve"
[2]: https://tailscale.com/docs/reference/examples/serve "Tailscale — ejemplos de Serve"
