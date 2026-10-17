# zh-reuniones

El conector «ZH Reuniones»: un servidor MCP en Vercel (https://zh-reuniones.vercel.app) que prende
la transcripción automática de Google Meet en las reuniones de la cuenta de ZH y lee las
transcripciones, con el nombre de quien habla. El CRM lo usa a través del conector de claude.ai
(capacidad `mcp`). La puesta en marcha está en `docs/reuniones-transcripcion.md`.

No guarda nada: los clientes OAuth, los códigos y las llaves son fichas firmadas (JWT con HMAC), y
las transcripciones se piden a Google en cada llamada.

## Herramientas (MCP)

| Herramienta | Entrada | Respuesta |
|---|---|---|
| `preparar_reunion` | `{meet}`: enlace o código de Meet | `{codigo, transcripcion: "automatica", yaEstaba}`. Prende `autoTranscriptionGeneration` del espacio (`PATCH spaces/{space}`). |
| `transcripciones` | `{dias?: 1-30 (14), codigos?: [...]}` | `{transcripciones: [{id, codigo, inicio, fin, estado: "lista" \| "procesando", doc}]}`: las de reuniones terminadas, con el documento de Google Docs. |
| `leer_transcripcion` | `{id}`: `conferenceRecords/…/transcripts/…` | `{id, participantes, intervenciones, texto}`: una línea por intervención, «Nombre: lo que dijo». |

Una falla conocida vuelve con `isError: true`, el mensaje en `content` y
`structuredContent: {error, mensaje}`, con `error` = `ajena` (la reunión no es de la cuenta),
`sin_transcripcion` (Google no lo permite: edición de Workspace o reunión ajena), `sin_enlace`,
`sin_id`, `google_reconectar` (falta o venció la autorización de la cuenta) o `google`.

## Rutas

| Ruta | Qué hace |
|---|---|
| `/` | Estado: qué falta configurar y la dirección del conector. |
| `/mcp` | El conector (JSON-RPC por POST, sin sesión). Sin llave válida: 401 con `WWW-Authenticate` y `resource_metadata`. |
| `/.well-known/oauth-protected-resource[/mcp]`, `/.well-known/oauth-authorization-server` | Descubrimiento (RFC 9728 y RFC 8414). |
| `/api/oauth/register` | Registro dinámico (RFC 7591): solo las direcciones de regreso de claude.ai, claude.com y locales. |
| `/api/oauth/authorize` → `/api/oauth/google` | Inicio de sesión con Google (solo `EQUIPO` y `GOOGLE_CUENTA`) y código de 5 minutos con PKCE S256. |
| `/api/oauth/token` | Llave de acceso de 1 hora y de renovación de 60 días. Quien sale de `EQUIPO` deja de renovar. |
| `/api/google/conectar` → `/api/google/callback` | Conectar la cuenta de ZH (solo `GOOGLE_CUENTA`, con todos los permisos): muestra una vez la llave para `GOOGLE_REFRESH_TOKEN`. |

Sin `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, las rutas de inicio de sesión responden 503 con lo
que falta.

## Variables de entorno

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CUENTA` (la cuenta de ZH), `EQUIPO` (correos de
quienes pueden usar el conector, separados por comas), `GOOGLE_REFRESH_TOKEN` (la autorización de
la cuenta de ZH), `AUTH_SECRET` (opcional; si no está, las fichas se firman con el secreto de
Google) y `BASE_URL` (opcional; si no está, la dirección sale de la solicitud).

## Desarrollo y despliegue

```bash
cd reuniones && npm test     # node --test, con Google simulado y correos inventados
```

El proyecto de Vercel es `zh-reuniones` (equipo zh-dev-projects), con Node 22 y sin paso de
compilación: cada archivo de `api/` es una función. No está unido al repositorio (la app de GitHub
de Vercel no tiene acceso a este repo): se despliega subiendo los archivos de esta carpeta, con la
CLI (`vercel deploy --prod` desde `reuniones/`) o con la herramienta de despliegue de Vercel.
