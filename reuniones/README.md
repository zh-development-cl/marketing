# zh-reuniones

El conector «ZH Reuniones»: un servidor MCP en Vercel (https://zh-reuniones.vercel.app) que recibe
las transcripciones de las reuniones de Google Meet y se las entrega al CRM a través del conector de
claude.ai (capacidad `mcp`). Las transcripciones las hace **TranscripTonic**, una extensión gratis y
de código abierto de Chrome que guarda los subtítulos de Meet con el nombre de quien habla y, al
terminar cada reunión, los manda a este servidor (su «webhook»). No hace falta Google Workspace
Business Standard ni Google Cloud. La puesta en marcha está en `docs/reuniones-transcripcion.md`.

Todo se guarda en un almacén privado de **Vercel Blob** (`zh-reuniones`, conectado al proyecto) y
las transcripciones se borran solas a los 14 días. Los clientes OAuth, los códigos y las llaves son
fichas firmadas (JWT con HMAC): eso no se guarda.

## Herramientas (MCP)

| Herramienta | Entrada | Respuesta |
|---|---|---|
| `transcripciones` | `{dias?: 1-30 (14)}` | `{transcripciones: [{id, titulo, codigo, software, inicio, fin, estado: "lista", participantes, intervenciones}]}`, sin el texto. `titulo` es el de la reunión en Meet (el del evento del calendario o el código de Meet); `codigo`, el código si el título lo es. |
| `leer_transcripcion` | `{id}`: `tt-…` | `{id, titulo, participantes, intervenciones, texto}`: una línea por intervención, «Nombre: lo que dijo», y el chat de la reunión al final. |

Una falla conocida vuelve con `isError: true`, el mensaje en `content` y
`structuredContent: {error, mensaje}`, con `error` = `sin_almacen` (el almacén no está conectado),
`no_existe` (ya se borró), `sin_id` o `almacen` (el almacén no respondió).

## Rutas

| Ruta | Qué hace |
|---|---|
| `/` | Estado: si el almacén y la clave del equipo están listos, el botón para crear la clave o ver la dirección para TranscripTonic, y la dirección del conector. |
| `/api/equipo` | La primera vez, el formulario para **crear la clave del equipo** (16 a 200 caracteres, escrita dos veces). Después, con la clave, la dirección del webhook para pegarla en la extensión. |
| `/api/transcripcion?t=<token>` | El webhook de TranscripTonic (POST, cuerpo «advanced» o «simple»). El token sale de la clave del equipo. La misma reunión mandada otra vez reemplaza a la anterior; una sin nada transcrito o de hace más de 14 días no se guarda. |
| `/mcp` | El conector (JSON-RPC por POST, sin sesión). Sin llave válida: 401 con `WWW-Authenticate` y `resource_metadata`. |
| `/.well-known/oauth-protected-resource[/mcp]`, `/.well-known/oauth-authorization-server` | Descubrimiento (RFC 9728 y RFC 8414). |
| `/api/oauth/register` | Registro dinámico (RFC 7591): solo las direcciones de regreso de claude.ai, claude.com y locales. |
| `/api/oauth/authorize` | Pide la clave del equipo y entrega un código de 5 minutos con PKCE S256. Desde el décimo intento equivocado en una hora, la misma dirección queda bloqueada una hora. |
| `/api/oauth/token` | Llave de acceso de 1 hora y de renovación de 60 días. Si se crea otra clave del equipo, ninguna sirve más. |

Mientras no exista la clave del equipo, las rutas de conexión y el webhook responden 503 con dónde
crearla.

## El almacén

| Archivo | Qué es |
|---|---|
| `config/clave.json` | La clave del equipo: solo su resumen con sal (scrypt), la fecha y un secreto al azar del servidor, del que salen la firma de las llaves y el token del webhook. La clave no se guarda. |
| `indice.json` | Las transcripciones de los últimos 14 días, sin el texto: lo único que lee el CRM para saber qué llegó. |
| `transcripciones/<id>.json` | Cada transcripción con su texto. |

**Cambiar la clave del equipo:** borrar `config/clave.json` en Vercel → Storage → zh-reuniones y
crear otra en https://zh-reuniones.vercel.app. Las llaves del conector y la dirección del webhook
cambian: cada socio vuelve a conectar el conector y pega la dirección nueva en la extensión.

**Límites del plan gratis (Hobby):** 2.000 escrituras y listados y 10.000 lecturas fuera del caché
al mes; si se pasan, Vercel bloquea el almacén 30 días. Por eso el CRM lee solo `indice.json`, casi
siempre desde el caché de Vercel (sus lecturas no se cobran), y cada reunión que llega hace dos
escrituras y un listado (el que barre los archivos de más de 14 días). Los cambios del índice se
escriben con su ETag, para que dos reuniones que llegan a la vez no se pisen. Mirar el almacén en el
panel de Vercel también cuenta como operaciones.

## Variables de entorno

| Variable | Qué es |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | La deja Vercel al conectar el almacén al proyecto. |
| `BASE_URL` | Opcional; si no está, la dirección sale de la solicitud. |

## Desarrollo y despliegue

```bash
cd reuniones && npm test     # node --test, con un almacén en memoria y datos inventados
```

El proyecto de Vercel es `zh-reuniones` (equipo zh-dev-projects), con Node 22 y sin paso de
compilación: cada archivo de `api/` es una función y la única dependencia es `@vercel/blob`. No está
unido al repositorio (la app de GitHub de Vercel no tiene acceso a este repo): se despliega subiendo
los archivos de esta carpeta, con la CLI (`vercel deploy --prod` desde `reuniones/`) o con la
herramienta de despliegue de Vercel.
