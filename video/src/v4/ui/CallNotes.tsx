import React from 'react';
import {staticFile} from 'remotion';
import {accent, apps, fonts} from '../tokens';

// Hoja "Notas de la llamada" (900 x 460 + 12 px de hojas apiladas detrás), mismo papel que ui/Paper.tsx: cabecera
// ZH + etiqueta, título en serif, tres renglones con regla tenue. Cada renglón muestra `typed` caracteres del texto
// (la escena los hace crecer letra a letra), un cursor opcional, un marcador azul translúcido que crece con `mark`
// (0..1) y, a la derecha, una "prueba" (`proof`: una mini tarjeta ya envuelta en Pop). No anima por sí sola.

export const CALLNOTES_W = 900;
export const CALLNOTES_H = 460;
export const CALLNOTES_STACK = 12;

export type NoteLine = {
  text: string; // "1. cotizaciones repetidas por WhatsApp"
  typed: number; // caracteres visibles (0 = renglón vacío)
  mark?: number; // 0..1 ancho del marcador (tras completarse)
  proof?: React.ReactNode; // mini tarjeta a la derecha (la escena la escala y la anima)
  proofRotate?: number; // grados de inclinación de la prueba
  proofDy?: number; // desplazamiento vertical de la prueba (px) para que no tape a la de arriba
};

export type CallNotesProps = {
  lines: NoteLine[];
  cursorLine?: number; // índice del renglón con cursor (-1 = ninguno)
  cursorOn?: boolean; // visible (la escena lo hace parpadear cuando no escribe)
  label?: string; // etiqueta de la cabecera, arriba a la derecha
  title?: string; // "Notas de la llamada"
  style?: React.CSSProperties;
};

const PAD = 48;
const ACCENT = accent.button;
const INK = apps.paperInk;
const MUTED = apps.paperMuted;
const LINE = apps.paperLine;
const INK_SOFT = '#3A3F4A';
const ROW_TOP = 182;
const ROW_H = 84;

const serif: React.CSSProperties = {fontFamily: fonts.serif, fontWeight: 400, color: INK, lineHeight: 1, letterSpacing: '-0.01em'};
const heavy = (px: number, color: string = INK): React.CSSProperties => ({WebkitTextStroke: `${px}px ${color}`, color});
const caps: React.CSSProperties = {fontFamily: fonts.ui, fontWeight: 500, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED};
const abs = (left: number, top: number, extra?: React.CSSProperties): React.CSSProperties => ({position: 'absolute', left, top, ...extra});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const Monogram: React.FC = () => (
  <div style={{position: 'relative', width: 32, height: 32, borderRadius: 8, background: INK, flexShrink: 0}}>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em', color: '#FFFFFF', paddingTop: 1}}>
      ZH
    </div>
    <div style={{position: 'absolute', right: -3, top: -3, width: 10, height: 10, borderRadius: 5, background: ACCENT, boxShadow: `0 0 0 2px ${apps.paper}`}} />
  </div>
);

export const CallNotes: React.FC<CallNotesProps> = ({lines, cursorLine = -1, cursorOn = true, label = 'Llamada de diagnóstico · 30 min', title = 'Notas de la llamada', style}) => {
  return (
    <div style={{position: 'relative', width: CALLNOTES_W, height: CALLNOTES_H, ...style}}>
      {/* Hojas apiladas detrás */}
      {[2, 1].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 6 * k,
            top: 6 * k,
            width: CALLNOTES_W,
            height: CALLNOTES_H,
            borderRadius: 3,
            background: k === 2 ? '#ECEAE2' : '#F4F2EB',
            boxShadow: `0 ${18 + 6 * k}px ${36 + 10 * k}px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.16), inset -1px 0 0 rgba(0,0,0,0.05)`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 3,
          background: `linear-gradient(176deg, #FDFCFA 0%, ${apps.paper} 45%, #F6F4EE 100%)`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.4) inset, 0 0 0 0.5px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          fontFamily: fonts.ui,
          color: INK,
        }}
      >
        <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('fx/grain.png')})`, backgroundSize: '420px 420px', opacity: 0.045, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.035) 100%)', pointerEvents: 'none'}} />

        {/* Cabecera */}
        <div style={abs(PAD, 34, {right: PAD, height: 36, display: 'flex', alignItems: 'center', gap: 12})}>
          <Monogram />
          <div style={{...serif, fontSize: 27, letterSpacing: '0', paddingTop: 2, ...heavy(0.35)}}>ZH Development</div>
          <div style={{...caps, marginLeft: 'auto', paddingTop: 2}}>{label}</div>
        </div>
        <div style={abs(PAD, 86, {right: PAD, height: 1, background: LINE})} />

        {/* Título */}
        <div style={abs(PAD, 106, {...serif, fontSize: 46, ...heavy(0.8, INK_SOFT)})}>{title}</div>
        <div style={abs(PAD, 164, {width: 44, height: 3, background: ACCENT, borderRadius: 2})} />

        {/* Renglones */}
        {lines.map((ln, i) => {
          const top = ROW_TOP + i * ROW_H;
          const shown = ln.text.slice(0, Math.max(0, Math.min(ln.text.length, Math.floor(ln.typed))));
          const started = shown.length > 0;
          const prefix = shown.slice(0, 2);
          const body = shown.slice(2).replace(/^\s/, '');
          const m = clamp01(ln.mark ?? 0);
          const cursor = cursorLine === i;
          return (
            <React.Fragment key={i}>
              {/* regla tenue del renglón */}
              <div style={abs(PAD, top + ROW_H - 10, {right: PAD, height: 1, background: LINE})} />
              {started || cursor ? (
                <div style={abs(PAD, top, {height: ROW_H - 10, display: 'flex', alignItems: 'center'})}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 10px 6px 8px',
                      margin: '-6px -10px -6px -8px',
                      borderRadius: 6,
                      backgroundImage: `linear-gradient(rgba(77,124,255,0.20), rgba(77,124,255,0.20)), linear-gradient(${ACCENT}, ${ACCENT})`,
                      backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundSize: `${m * 100}% 100%, ${m * 100}% 3px`,
                      backgroundPosition: 'left top, left bottom',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{...serif, fontSize: 32, color: ACCENT, ...heavy(0.4, ACCENT), marginRight: 12, verticalAlign: '-1px'}}>{prefix}</span>
                    <span style={{fontFamily: fonts.ui, fontWeight: 500, fontSize: 28, letterSpacing: '-0.012em', color: INK}}>{body}</span>
                  </span>
                  {cursor ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 3,
                        height: 36,
                        marginLeft: 4,
                        borderRadius: 1.5,
                        background: ACCENT,
                        opacity: cursorOn ? 1 : 0,
                        boxShadow: cursorOn ? `0 0 8px rgba(48,107,255,0.6)` : undefined,
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
              {ln.proof ? (
                <div style={abs(CALLNOTES_W - PAD + 8 - 180, top + (ln.proofDy ?? 0), {width: 180, height: ROW_H - 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center'})}>
                  <div style={{transform: `scale(0.52) rotate(${ln.proofRotate ?? 0}deg)`, transformOrigin: '100% 50%'}}>{ln.proof}</div>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
