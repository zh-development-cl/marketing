# Transcripción de reuniones con Google Meet (TranscripTonic y ZH Reuniones)

Qué hace, cómo se pone en marcha (una sola vez) y qué hacer si algo falla.

## Qué hace

- **TranscripTonic**, una extensión gratis y de código abierto de Chrome, guarda los **subtítulos
  de Google Meet** de cada reunión, con el nombre de quien habla. No entra ningún bot a la reunión
  y no hace falta Google Workspace Business Standard: los subtítulos de Meet son gratis en
  cualquier cuenta.
- Al terminar la reunión, la extensión manda la transcripción a **ZH Reuniones** (nuestro servidor
  en Vercel), que la guarda 14 días. También descarga un archivo de texto en el computador, de
  respaldo.
- La reunión aparece en el CRM, en **Hoy → «Reuniones transcritas»**, unida a su lead o cliente por
  la hora y el título del evento del calendario. Si el CRM no sabe de quién es, se **asigna**; si la
  unió a quien no era, «No es de aquí»; una interna o de prueba se **descarta**.
- **Registrar** abre la ficha con la transcripción y Claude arma lo que corresponde:
  - **Lead** (la reunión de diagnóstico o la que siga): el plan, con qué pasó, la etapa, las tareas
    de ZH, la próxima reunión (con Meet, en el calendario de `contacto@`, que es la cuenta con que
    trabaja Lorenzo, e invitando a los correos de Ajustes → «Correos del equipo», hoy el de
    Nicolás) y la confirmación por WhatsApp o correo.
  - **Cliente**: el acta, con los acuerdos, lo pendiente de cada lado, las tareas de ZH (con día y
    responsable), la próxima reunión y las solicitudes para Soporte.
  - Nada se guarda ni se agenda hasta que tú confirmas o corriges.
- Si Lorenzo y Nicolás tienen la extensión y están en la misma reunión, llegan dos copias: el CRM
  muestra una, la más completa.

**Lo importante:** se transcribe solo lo que ve el Chrome de alguien que tiene la extensión. Tiene
que estar en la reunión desde el computador, en Chrome (no en el celular). Si entra solo Nicolás,
la extensión tiene que estar en su Chrome.

## Cómo está armado

```
Meet (subtítulos) → TranscripTonic (Chrome) → ZH Reuniones (Vercel, 14 días) ← conector «ZH Reuniones» en claude.ai ← CRM
```

- **ZH Reuniones** es un servidor chico en Vercel (proyecto `zh-reuniones`,
  https://zh-reuniones.vercel.app; el código está en `reuniones/`). Recibe las transcripciones en
  una dirección secreta (la que se pega en la extensión), las guarda en una base de Vercel (Upstash
  Redis) y se las entrega al CRM como conector MCP de claude.ai.
- Para conectar el conector se usa la **clave del equipo** (`CLAVE_EQUIPO` en Vercel). De ella sale
  también la dirección secreta de la extensión.
- Las transcripciones se **borran solas a los 14 días**. El CRM guarda el análisis y, solo si se
  marca «Guardar también la transcripción completa», el texto, en la base privada del artifact.
  Nada de esto va al repositorio, que es público.
- **Costos:** la extensión es gratis, la base usa el plan Free de Upstash y el servidor, el plan
  Hobby de Vercel. Las condiciones de Hobby dicen que es para uso no comercial: para una
  herramienta de la empresa correspondería el plan Pro (también para la landing).

## Puesta en marcha (una vez)

### 1. Vercel: la base y la clave del equipo

En vercel.com → equipo zh-dev-projects → proyecto **zh-reuniones**:

1. **Storage** → **Create Database** → **Upstash** (Redis) → plan **Free** → crear y conectarla al
   proyecto `zh-reuniones` (todos los entornos). Vercel agrega solas `KV_REST_API_URL` y
   `KV_REST_API_TOKEN`.
2. **Settings → Environment Variables** → agregar `CLAVE_EQUIPO`, de tipo **Sensitive**, para
   Production y Preview: una clave larga (16 caracteres o más) que inventen los socios. No la
   pegues en un chat ni en el repositorio; compártela entre ustedes por un medio privado.
3. **Deployments** → el último → **Redeploy**.
4. En https://zh-reuniones.vercel.app las dos líneas tienen que decir «Listo».

### 2. La extensión (en el Chrome de cada uno)

1. Instalar **TranscripTonic** desde la Chrome Web Store
   (https://chromewebstore.google.com/detail/ciepnfnceimjehngolkijpnbappkkiag).
2. Abrirla (su ícono en la barra de Chrome; fíjala con la pieza de rompecabezas): marcar **Google
   Meet**, elegir **Auto mode** y, si no quieres ver los subtítulos, **Hide captions on the meeting
   UI**.
3. En https://zh-reuniones.vercel.app → **Ver la dirección para TranscripTonic** → escribir la clave
   del equipo → copiar la dirección.
4. En la extensión → **webhooks →**:
   - pegar la dirección en **Webhook URL** → **Save** (si Chrome pide permiso para esa dirección,
     aceptar);
   - marcar **Automatically post transcript to webhook URL, after each meeting**;
   - elegir **Advanced webhook body**;
   - dejar marcada también la descarga del archivo después de cada reunión, de respaldo.
5. La primera vez, revisar que los subtítulos de Meet estén en español: en una reunión, ⋮ →
   **Settings** → **Captions** → **Meeting language** → Spanish.

### 3. El conector en claude.ai (cada socio)

1. claude.ai → Configuración → Conectores → **Agregar conector personalizado**:
   - Nombre: **ZH Reuniones** (exacto: el CRM lo busca por ese nombre).
   - URL: `https://zh-reuniones.vercel.app/mcp`
   - Conectar: se abre una página de ZH Reuniones que pide la clave del equipo. Si claude.ai dice
     que solo un administrador puede agregar conectores, lo agrega quien administra la
     organización y cada uno toca «Conectar».
2. En el conector, deja las dos herramientas en **Permitir siempre** («Transcripciones de las
   reuniones» y «Leer una transcripción»): el CRM no puede usar las que piden aprobación cada vez.
3. Abre el CRM → Ajustes → **Transcripción de reuniones**. Si dice «Falta tu permiso», toca
   «Permitir ZH Reuniones». Tiene que decir «Conectado».

### 4. Probar

1. Crea un lead de prueba con tu correo personal y agéndale desde el CRM una reunión con Meet para
   dentro de unos minutos.
2. Entra a la reunión desde Chrome (con la extensión), conversa un par de minutos y sal.
3. En unos segundos la reunión aparece en Hoy → «Reuniones transcritas», unida al lead de prueba.
   Toca **Registrar** y revisa el plan. Si no aparece, toca «Actualizar» en Ajustes → Transcripción
   de reuniones.

## En el día a día

- El CRM anota las reuniones con Meet de leads y clientes de los próximos 14 días (para saber de
  quién es cada transcripción que llegue después). Las transcripciones se buscan al abrir el CRM y
  cada 10 minutos, y se pueden registrar hasta 14 días después de que llegan.
- **Consentimiento:** la invitación que crea el CRM dice que la reunión se transcribe, pero Google
  no avisa en la reunión: dilo al empezar («vamos a transcribir para registrar los acuerdos»). Si
  alguien no quiere, pasa la extensión a «Manual mode» antes de la reunión (así no la transcribe) y
  se registra a mano.
- **Sin la extensión** (desde el celular, o en una reunión presencial), queda «Transcribir en vivo»
  en el CRM o pegar las notas en «Registrar reunión».
- Si una transcripción no llegó (sin internet, o se cerró Chrome antes de tiempo), en la extensión →
  **Last 10 meetings** se puede volver a mandar; también está «Recover last meeting».

## Si algo falla

Ajustes → Transcripción de reuniones dice qué pasa:

| Mensaje | Qué hacer |
|---|---|
| «ZH Reuniones no está conectado en tu cuenta de claude.ai» | Paso 3. |
| «Falta tu permiso para que este CRM use ZH Reuniones» | Tocar «Permitir ZH Reuniones». |
| «…Falta crear la base de ZH Reuniones en Vercel» | Paso 1.1 y Redeploy. |
| «Falta la clave del equipo de ZH Reuniones en Vercel» (al conectar) | Paso 1.2 y Redeploy. |
| La extensión avisa «Could not post webhook!» | Revisar en https://zh-reuniones.vercel.app que todo diga «Listo», volver a copiar la dirección (paso 2.3) y mandar la reunión otra vez desde «Last 10 meetings». |

Si se cambia la clave del equipo, cada socio vuelve a conectar el conector (paso 3) y pega la
dirección nueva en la extensión (paso 2.3).

Para revisar el servidor: https://zh-reuniones.vercel.app (estado) y, en Vercel, los registros del
proyecto. El detalle técnico está en `reuniones/README.md`.
