# zh-reuniones

El conector «ZH Reuniones»: un servidor MCP en Vercel (https://zh-reuniones.vercel.app) que recibe
las transcripciones de las reuniones de Google Meet y se las entrega al CRM a través del conector de
claude.ai (capacidad `mcp`). Las transcripciones las hace **TranscripTonic**, una extensión gratis y
de código abierto de Chrome que guarda los subtítulos de Meet con el nombre de quien habla y, al
terminar cada reunión, los manda a este servidor (su «webhook»). No hace falta Google Workspace
Business Standard ni Google Cloud. La puesta en marcha está en `docs/reuniones-transcripcion.md`.

Las transcripciones esperan en una base Upstash Redis del proyecto (se crea en Vercel → Storage) y se
borran solas a los 14 días. Los clientes OAuth, los códigos y las llaves son fichas firmadas (JWT
con HMAC): eso no se guarda.

## Herramientas (MCP)

| Herramienta | Entrada | Respuesta |
|---|---|---|
| `transcripciones` | `{dias?: 1-30 (14)}` | `{transcripciones: [{id, titulo, codigo, software, inicio, fin, estado: "lista", participantes, intervenciones}]}`, sin el texto. `titulo` es el de la reunión en Meet (el del evento del calendario o el código de Meet); `codigo`, el código si el título lo es. |
| `leer_transcripcion` | `{id}`: `tt-…` | `{id, titulo, participantes, intervenciones, texto}`: una línea por intervención, «Nombre: lo que dijo», y el chat de la reunión al final. |

Una falla conocida vuelve con `isError: true`, el mensaje en `content` y
`structuredContent: {error, mensaje}`, con `error` = `sin_almacen` (falta crear la base),
`no_existe` (ya se borró), `sin_id` o `almacen` (la base no respondió).

## Rutas

| Ruta | Qué hace |
|---|---|
| `/` | Estado: qué falta configurar, la dirección del conector y el enlace a la dirección para TranscripTonic. |
| `/api/transcripcion?t=<token>` | El webhook de TranscripTonic (POST, cuerpo «advanced» o «simple»). El token sale de `CLAVE_EQUIPO`. La misma reunión mandada otra vez reemplaza a la anterior; una sin nada transcrito no se guarda. |
| `/api/equipo` | Con la clave del equipo, muestra la dirección del webhook para pegarla en la extensión. |
| `/mcp` | El conector (JSON-RPC por POST, sin sesión). Sin llave válida: 401 con `WWW-Authenticate` y `resource_metadata`. |
| `/.well-known/oauth-protected-resource[/mcp]`, `/.well-known/oauth-authorization-server` | Descubrimiento (RFC 9728 y RFC 8414). |
| `/api/oauth/register` | Registro dinámico (RFC 7591): solo las direcciones de regreso de claude.ai, claude.com y locales. |
| `/api/oauth/authorize` | Pide la clave del equipo y entrega un código de 5 minutos con PKCE S256. Desde el décimo intento equivocado en una hora, la misma dirección queda bloqueada una hora. |
| `/api/oauth/token` | Llave de acceso de 1 hora y de renovación de 60 días. Si cambia la clave del equipo, ninguna sirve más. |

Sin `CLAVE_EQUIPO` (o con menos de 16 caracteres), las rutas de conexión y el webhook responden 503
con lo que falta.

## Variables de entorno

| Variable | Qué es |
|---|---|
| `CLAVE_EQUIPO` | La clave del equipo (Sensitive, 16 caracteres o más). Con ella se conecta el conector en claude.ai y de ella salen el token del webhook y la firma de las llaves. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | La base Upstash Redis; las deja Vercel al crearla y conectarla al proyecto (también sirven `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`). |
| `AUTH_SECRET` | Opcional: se suma a la clave del equipo para firmar las llaves. |
| `BASE_URL` | Opcional; si no está, la dirección sale de la solicitud. |

## Desarrollo y despliegue

```bash
cd reuniones && npm test     # node --test, con la base simulada y datos inventados
```

El proyecto de Vercel es `zh-reuniones` (equipo zh-dev-projects), con Node 22 y sin paso de
compilación: cada archivo de `api/` es una función. No está unido al repositorio (la app de GitHub
de Vercel no tiene acceso a este repo): se despliega subiendo los archivos de esta carpeta, con la
CLI (`vercel deploy --prod` desde `reuniones/`) o con la herramienta de despliegue de Vercel.
