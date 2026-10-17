# Transcripción de reuniones con Google Meet (ZH Reuniones)

Qué hace, cómo se pone en marcha (una sola vez) y qué hacer si algo falla.

## Qué hace

- En las reuniones por Meet con **leads y clientes** que organiza `contacto@zhdevelopment.cl`, el
  CRM prende sola la **transcripción automática de Google Meet**. No entra ningún bot: Google
  transcribe con el nombre de cada participante y avisa en la reunión que se está transcribiendo.
  La invitación que crea el CRM también lo dice («Usamos la transcripción de Google Meet para
  registrar los acuerdos»).
- Al terminar, Google deja el documento de la transcripción en el Drive de `contacto@` y la reunión
  aparece en el CRM, en **Hoy → «Reuniones transcritas»**.
- **Registrar** abre la ficha con la transcripción y Claude arma lo que corresponde:
  - **Lead** (la reunión de diagnóstico o la que siga): el plan, con qué pasó, la etapa, las tareas
    de ZH, la próxima reunión (con Meet, en el calendario de `contacto@`, invitando a
    Lorenzo y a Nicolás: los correos de Ajustes → «Correos del equipo») y la confirmación por WhatsApp o correo.
  - **Cliente**: el acta, con los acuerdos, lo pendiente de cada lado, las tareas de ZH (con día y
    responsable), la próxima reunión y las solicitudes para Soporte.
  - Nada se guarda ni se agenda hasta que tú confirmas o corriges.
- Una reunión que el CRM no reconoce se **asigna** a un lead o a un cliente; una interna o de prueba
  se **descarta**.

## Cómo está armado

```
Google Meet (contacto@)  ←  zh-reuniones (Vercel)  ←  conector «ZH Reuniones» en claude.ai  ←  CRM
```

- **zh-reuniones** es un servidor chico en Vercel (proyecto `zh-reuniones`,
  https://zh-reuniones.vercel.app; el código está en `reuniones/`). Es un conector MCP para
  claude.ai, con inicio de sesión de Google: solo entra el equipo (`EQUIPO` y `GOOGLE_CUENTA`).
- Usa una sola cuenta de Google, `contacto@zhdevelopment.cl`, con permiso para cambiar la
  configuración de sus reuniones (prender la transcripción) y leer sus transcripciones. Nada más:
  no ve el correo, el Drive ni el calendario.
- **No guarda transcripciones.** Las pide a Google cuando se registran. Google borra los registros
  de una reunión a los 30 días; el documento sigue en el Drive de `contacto@`.
- El CRM lo usa como usa Google Calendar: con el conector de claude.ai de quien lo abre.

## Requisitos

1. **Google Workspace Business Standard o superior** en zhdevelopment.cl (las ediciones más baratas
   no transcriben). La edición es del dominio, no de la cuenta con que se paga: lo que importa es
   que **`contacto@` tenga la licencia**, porque organiza las reuniones y en su Drive quedan las
   transcripciones. Prueba rápida: entrar a meet.google.com con `contacto@`, iniciar una reunión y
   abrir «Actividades» (abajo a la derecha); si aparece «Transcripciones», está listo. Si no: en
   admin.google.com (con la cuenta administradora del dominio) → Usuarios → `contacto@` →
   Licencias, y en Aplicaciones → Google Workspace → Google Meet → configuración de video de Meet →
   Transcripciones, permitir que se transcriba.
2. **Las reuniones las organiza `contacto@`.** Solo se transcriben solas las reuniones de esa
   cuenta. Las que crea el CRM van a su calendario. Si en el CRM una reunión dice «No se
   transcribe», el detalle dice por qué (la organizó otra cuenta, o Google no lo permite). Las
   reservas de la agenda de zhdevelopment.cl hoy se crean en `zh.development.cl@gmail.com`, una
   cuenta personal que no transcribe: para que también se transcriban, la agenda de la landing
   tiene que crearlas en `contacto@` (es un cambio en el repositorio `landing`).
3. **Vercel**: el proyecto está en el plan Hobby, que es para uso no comercial. Para una
   herramienta de la empresa corresponde el plan Pro (también para la landing).

## Puesta en marcha (una vez)

### 1. Google Cloud

Con `contacto@zhdevelopment.cl` (o con la cuenta que administra Workspace), en
https://console.cloud.google.com:

1. Crear un proyecto, por ejemplo «ZH Reuniones».
2. APIs y servicios → Biblioteca → **Google Meet REST API** → Habilitar.
3. Google Auth Platform (pantalla de consentimiento de OAuth):
   - Nombre de la app: **ZH Reuniones**; correo de asistencia: `contacto@zhdevelopment.cl`.
   - Público: **Externo**, porque Nicolás entra con una cuenta de Gmail. Después, **Publicar la app**
     («En producción»): en modo de prueba, Google corta la conexión a los 7 días.
   - Acceso a los datos: agregar `openid`, `email`, `profile`,
     `https://www.googleapis.com/auth/meetings.space.settings` y
     `https://www.googleapis.com/auth/meetings.space.readonly`.
   - Si todo el equipo usara cuentas de zhdevelopment.cl, se puede elegir **Interno** y no hay que
     publicarla.
4. Clientes → Crear cliente → **Aplicación web**, nombre «ZH Reuniones», con estos dos URI de
   redireccionamiento autorizados:
   - `https://zh-reuniones.vercel.app/api/oauth/google`
   - `https://zh-reuniones.vercel.app/api/google/callback`
5. Copiar el **ID de cliente** y el **secreto**. No los pegues en un chat ni en el repositorio.

### 2. Vercel

En vercel.com → equipo zh-dev-projects → proyecto **zh-reuniones** → Settings → Environment
Variables, para Production y Preview:

| Variable | Valor | Tipo |
|---|---|---|
| `GOOGLE_CLIENT_ID` | el ID de cliente del paso 1 | Plain |
| `GOOGLE_CLIENT_SECRET` | el secreto del paso 1 | Sensitive |
| `GOOGLE_CUENTA` | `contacto@zhdevelopment.cl` (ya está) | Plain |
| `EQUIPO` | los correos de Lorenzo y de Nicolás, separados por comas (ya está) | Plain |
| `AUTH_SECRET` | opcional: una clave larga al azar para firmar las llaves del conector (si no está, se usa el secreto de Google; si se agrega o se cambia después, cada uno vuelve a conectar el conector) | Sensitive |

Después: Deployments → el último → **Redeploy**. En https://zh-reuniones.vercel.app la lista dice
qué falta.

### 3. Conectar la cuenta de Google de ZH

1. En https://zh-reuniones.vercel.app → **Conectar la cuenta de Google de ZH** → entrar con
   `contacto@zhdevelopment.cl` → aceptar todos los permisos. Si aparece «Google no verificó esta
   app», es la app propia: Configuración avanzada → Ir a ZH Reuniones.
2. La página muestra una llave **una sola vez**. Pégala en Vercel como `GOOGLE_REFRESH_TOKEN`
   (Sensitive, Production y Preview) y vuelve a desplegar (Redeploy).
3. La página de inicio tiene que decir «Listo» en las tres líneas.

### 4. El conector en claude.ai (cada socio)

1. claude.ai → Configuración → Conectores → **Agregar conector personalizado**:
   - Nombre: **ZH Reuniones** (exacto: el CRM lo busca por ese nombre).
   - URL: `https://zh-reuniones.vercel.app/mcp`
   - Conectar y entrar con tu cuenta de Google del equipo (la de tu correo en `EQUIPO`). Si
     claude.ai dice que solo un administrador puede agregar conectores, lo agrega quien
     administra la organización y cada uno toca «Conectar».
2. En el conector, deja las tres herramientas en **Permitir siempre** («Transcribir una reunión»,
   «Transcripciones de las reuniones» y «Leer una transcripción»): el CRM no puede usar las que
   piden aprobación cada vez.
3. Abre el CRM → Ajustes → **Transcripción de reuniones**. Si dice «Falta tu permiso», toca
   «Permitir ZH Reuniones». Tiene que decir «Conectado».

### 5. Probar

1. Crea un lead de prueba con tu correo personal y agéndale desde el CRM una reunión con Meet para
   dentro de unos minutos. En Hoy → Calendario tiene que decir **«Se transcribe»** (el CRM la
   prepara a los pocos segundos de leer el calendario).
2. Entra a la reunión (Google avisa que se está transcribiendo), conversa un par de minutos y sal.
3. Cuando Google termina el documento (de unos minutos a media hora), aparece en Hoy →
   «Reuniones transcritas». Toca **Registrar** y revisa el plan.

## En el día a día

- El CRM prepara las reuniones de los próximos 14 días, una vez por reunión, apenas aparecen en el
  calendario. También las que se agenden en la próxima reunión de un plan o de un acta.
- Las transcripciones se buscan al abrir el CRM y cada 10 minutos. Se pueden registrar hasta 14
  días después de la reunión.
- **Consentimiento:** Google avisa a todos en la reunión y la invitación lo dice. Si alguien no
  quiere, se detiene en la reunión (Actividades → Transcripciones → Detener) y se registra a mano.
- **Datos:** el servidor no guarda nada. El CRM guarda el análisis y, solo si se marca «Guardar
  también la transcripción completa», el texto, en la base privada del artifact. El documento queda
  en el Drive de `contacto@`. Nada de esto va al repositorio, que es público.

## Si algo falla

Ajustes → Transcripción de reuniones dice qué pasa:

| Mensaje | Qué hacer |
|---|---|
| «ZH Reuniones no está conectado en tu cuenta de claude.ai» | Paso 4. |
| «Falta tu permiso para que este CRM use ZH Reuniones» | Tocar «Permitir ZH Reuniones». |
| «…deja "Transcribir una reunión" en "Permitir siempre"» | Paso 4.2. |
| «La autorización de Google de la cuenta de ZH venció o se revocó» | Paso 3 de nuevo (llave nueva en `GOOGLE_REFRESH_TOKEN` y Redeploy). |
| «Google no dejó prender la transcripción automática…» | Revisar la edición de Workspace y que la reunión sea de `contacto@` (requisitos 1 y 2). |
| «Falta configurar el cliente de Google de ZH Reuniones en Vercel» (al conectar) | Paso 2. |

Para revisar el servidor: https://zh-reuniones.vercel.app (estado) y, en Vercel, los registros del
proyecto. El detalle técnico está en `reuniones/README.md`.
