"""Arma crm/dev/preview.html para revisar el CRM fuera de claude.ai.

Imita el esqueleto que agrega el Artifact al publicar (charset, viewport con
viewport-fit=cover y el reset mínimo) e inyecta mock-claude.js antes de la página,
igual que en claude.ai, donde window.claude existe antes de cualquier script.

Uso:  python3 crm/dev/build_preview.py   y abrir crm/dev/preview.html en el navegador.
"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
page = (HERE.parent / "index.html").read_text(encoding="utf-8")
mock = (HERE / "mock-claude.js").read_text(encoding="utf-8")

skeleton = (
    '<!doctype html><html lang="es"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    "<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);"
    "padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}"
    "img{max-width:100%}[hidden]{display:none!important}</style>"
    "<script>" + mock + "</script></head><body>" + page + "</body></html>"
)
out = HERE / "preview.html"
out.write_text(skeleton, encoding="utf-8")
print(out)
