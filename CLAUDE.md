# Marketing de ZH Development

Lee `README.md`: ahí está qué hay en el repositorio.

## Reglas

- **Este repositorio es público.** Nunca guardes datos de leads o clientes (nombres, teléfonos,
  correos, transcripciones, montos) ni claves. Los datos del CRM viven en la base del artifact.
- Marca, tono y tokens: `docs/brief.md`. El diseño de los correos sale del mismo sistema que los
  correos de la agenda de la landing (`api/agenda.js` en `zh-development-cl/landing`).
- CRM: `crm/README.md`. Para leer o escribir leads, llamadas y borradores usa la skill
  `.claude/skills/zh-crm`. Claude redacta; los socios revisan y envían.
- Propuestas, precios y casos comerciales viven en `zh-development-cl/propuestaszh` (privado).
