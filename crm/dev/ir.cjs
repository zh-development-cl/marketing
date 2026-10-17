/* Ir a una vista del CRM en las pruebas, como lo haría una persona: toca la sección del menú (el
   lateral en el computador o la barra de abajo en el teléfono), la pestaña si la sección tiene
   (Hoy y Clientes) y «Tabla» o «Tablero» en Leads y Clientes. */
const SECCION = { hoy: "Hoy", borradores: "Hoy", metricas: "Hoy", llamar: "Llamar", leads: "Leads", embudo: "Leads", clientes: "Clientes", embudoClientes: "Clientes", proyectos: "Clientes", soporte: "Clientes", cobros: "Clientes", ajustes: "Ajustes" };
const PESTANA = { hoy: "Para hoy", borradores: "Borradores", metricas: "Métricas", clientes: "Clientes", embudoClientes: "Clientes", proyectos: "Proyectos", soporte: "Soporte", cobros: "Cobros" };
const VISTA = { leads: "Tabla", embudo: "Tablero", clientes: "Tabla", embudoClientes: "Tablero" };

async function irA(page, vista) {
  if (!SECCION[vista]) throw new Error("vista desconocida: " + vista);
  const lateral = page.locator(".side .nav");
  const barra = (await lateral.isVisible()) ? lateral : page.locator("nav.tabs");
  await barra.locator("button", { hasText: new RegExp("^" + SECCION[vista]) }).first().click();
  if (PESTANA[vista]) await page.locator(".subnav button", { hasText: new RegExp("^" + PESTANA[vista]) }).click();
  if (VISTA[vista]) {
    const b = page.locator(".page-head .seg button", { hasText: VISTA[vista] });
    if ((await b.getAttribute("aria-pressed")) !== "true") await b.click();
  }
}

module.exports = { irA };
