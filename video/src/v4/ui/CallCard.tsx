import React from 'react';
import {Img, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {accent, fonts, ink, shadow, status} from '../tokens';
import {formatClock} from './CallBar';

// Tarjeta de videollamada (900 x 520, esquinas 28): cabecera "Llamada de diagnóstico" + píldora "30 min"; dos
// recuadros de video (foto de Lorenzo con chip "Lorenzo · ZH Development" y barras de nivel cuando habla; recuadro
// oscuro "TE" / "Tu Empresa" con la cámara apagada); abajo el contador mono grande mm:ss, los controles (mic, cámara,
// colgar en rojo) y una píldora de estado ("Notas en vivo" → "Diagnóstico listo"). No anima por sí sola: la escena
// pasa `seconds`, `done` (0..1, resorte) y `tick` (frame) para las barras de nivel.

export const CALLCARD_W = 840;
export const CALLCARD_H = 520;
export const CALLCARD_H3 = 446; // alto con tres recuadros chicos (Lorenzo · Nico · Tu Empresa)
export const CALLCARD_HV = 520; // alto en modo video: recuadro grande (792 x 320) + fila compacta

// Grabación real de la llamada (video silenciado). `from`: frame local de la escena en que arranca el clip (frame 0
// del archivo); `label`/`label2`: chip con el nombre de quien habla, cruzado con `labelMix` (0 → label, 1 → label2).
// Con `src2` + `switchAt` (frame del clip) el segundo clip entra en fundido de `fadeDur` frames sobre el primero
// (la vista de orador del Meet corta en seco; aquí se cruza suave).
export type CallVideo = {src: string; src2?: string; switchAt?: number; fadeDur?: number; from?: number; startFrom?: number; label: string; label2?: string; labelMix?: number; objectPosition?: string};

export type CallCardProps = {
  seconds: number; // segundos transcurridos (mm:ss)
  done?: number; // 0..1 progreso del estado "30:00": contador verde con pulso y píldora "Diagnóstico listo"
  speaking?: boolean | number; // barras de nivel sobre el recuadro de quien habla (0..1 las funde)
  tick?: number; // frame (determinista) para mover las barras de nivel
  name?: string; // 'Lorenzo · ZH Development'
  company?: string; // 'Tu Empresa'
  initials?: string; // 'TE'
  avatarSrc?: string; // staticFile('people/lorenzo.jpg')
  // Captura real de la llamada (foto o video de un Meet con Lorenzo y Nico): ocupa el ancho completo en vez de los dos
  // recuadros. `startFrom` = frame del video desde el que se reproduce (silenciado).
  media?: {kind: 'image' | 'video'; src: string; startFrom?: number; label?: string; objectPosition?: string};
  // Tres (o más) recuadros chicos en fila, como un Meet con varios participantes: foto (src) o iniciales.
  tiles?: Array<{src?: string; initials?: string; label: string; objectPosition?: string}>;
  // Modo video: la grabación ocupa el ancho; con `join` 0..1 el recuadro de la grabación se angosta y el de "Tu
  // Empresa" entra por la derecha (se une a la llamada); `joinToast` 0..1 muestra el aviso "Tu Empresa se unió".
  video?: CallVideo;
  join?: number;
  joinToast?: number;
  style?: React.CSSProperties;
};

const PAD = 24;
const TILE_W = (CALLCARD_W - PAD * 2 - 16) / 2; // 418
const TILE_H = 290;
const TILE_H3 = 214; // alto de los recuadros cuando son tres en fila
const TILE_HV = 320; // alto del recuadro de video en modo video
const TE_W = 236; // ancho del recuadro "Tu Empresa" cuando se une
const TILE_TOP = 80;

const ICON = '#FFFFFF';

const MicIcon: React.FC<{size?: number}> = ({size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{display: 'block'}}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill={ICON} stroke="none" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
    <path d="M12 18v3M9 21h6" />
  </svg>
);

const CamIcon: React.FC<{size?: number; off?: boolean; color?: string}> = ({size = 30, off = false, color = ICON}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{display: 'block'}}>
    <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" fill={off ? 'none' : color} stroke={color} />
    <path d="M15.5 10.5 21 7.5v9l-5.5-3" fill={off ? 'none' : color} />
    {off ? <path d="M3.5 3.5l17 17" stroke={color} strokeWidth="2.4" /> : null}
  </svg>
);

const HangUpIcon: React.FC<{size?: number}> = ({size = 32}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={ICON} aria-hidden style={{display: 'block'}}>
    <path d="M3.3 13.2c-.6-.6-.6-1.6-.1-2.3C5.3 8.3 8.5 7 12 7s6.7 1.3 8.8 3.9c.5.7.5 1.7-.1 2.3l-1.7 1.7c-.6.6-1.6.6-2.3.1l-1.9-1.5c-.5-.4-.8-1-.7-1.6l.1-1.2c-1.3-.5-2.8-.5-4.2 0l.1 1.2c.1.6-.2 1.2-.7 1.6l-1.9 1.5c-.7.5-1.7.5-2.3-.1l-1.9-1.7z" />
  </svg>
);

const ClockIcon: React.FC<{size?: number; color?: string}> = ({size = 20, color = ink.text2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" aria-hidden style={{display: 'block'}}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

const LockIcon: React.FC<{size?: number; color?: string}> = ({size = 20, color = ink.text2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" aria-hidden style={{display: 'block'}}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill={color} stroke="none" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const CheckIcon: React.FC<{size?: number; color?: string}> = ({size = 22, color = status.ok}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{display: 'block'}}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

// Segundo clip de la grabación: entra en fundido sobre el primero (frame relativo a su Sequence).
const VideoFadeIn: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const k = Math.max(0, Math.min(1, f / Math.max(1, dur)));
  const e = k * k * (3 - 2 * k); // smoothstep
  return <div style={{position: 'absolute', inset: 0, opacity: e}}>{children}</div>;
};

// Chip con nombre en la esquina inferior izquierda de un recuadro de video.
const NameChip: React.FC<{text: string; compact?: boolean}> = ({text, compact}) => (
  <div
    style={{
      position: 'absolute',
      left: compact ? 8 : 12,
      bottom: compact ? 8 : 12,
      maxWidth: compact ? 236 : TILE_W - 24,
      transform: compact ? 'scale(0.86)' : undefined,
      transformOrigin: 'left bottom',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 14px 7px 10px',
      borderRadius: 999,
      background: 'rgba(8,10,14,0.72)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px rgba(0,0,0,0.35)',
      boxSizing: 'border-box',
    }}
  >
    <MicIcon size={20} />
    <div style={{fontSize: 26, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.015em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{text}</div>
  </div>
);

// Barras de nivel (quién habla): cuatro barras que oscilan de forma determinista con `tick`.
const LevelBars: React.FC<{tick: number; on: boolean | number}> = ({tick, on: onRaw}) => {
  const k = typeof onRaw === 'number' ? Math.max(0, Math.min(1, onRaw)) : onRaw ? 1 : 0;
  const on = k > 0.01;
  return (
  <div
    style={{
      position: 'absolute',
      right: 12,
      top: 12,
      height: 36,
      padding: '0 10px',
      borderRadius: 999,
      background: 'rgba(8,10,14,0.72)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      opacity: k,
    }}
  >
    {[0, 1, 2, 3].map((i) => {
      const a = 0.5 + 0.5 * Math.sin(tick * 0.78 + i * 1.9);
      const b = 0.6 + 0.4 * Math.sin(tick * 0.33 + i * 0.7);
      const h = on ? 6 + 16 * a * b * k : 6;
      return <div key={i} style={{width: 5, height: h, borderRadius: 3, background: status.ok, boxShadow: `0 0 6px ${status.ok}`}} />;
    })}
  </div>
  );
};

const RoundButton: React.FC<{children: React.ReactNode; danger?: boolean; width?: number; size?: number}> = ({children, danger = false, width, size = 64}) => (
  <div
    style={{
      width: width ?? size,
      height: size,
      borderRadius: size / 2,
      background: danger ? 'linear-gradient(180deg, #F0575C 0%, #D9363B 100%)' : 'rgba(255,255,255,0.08)',
      boxShadow: danger ? '0 8px 22px rgba(229,72,77,0.45), inset 0 1px 0 rgba(255,255,255,0.28)' : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

export const CallCard: React.FC<CallCardProps> = ({
  seconds,
  done = 0,
  speaking = false,
  tick = 0,
  name = 'Lorenzo · ZH',
  company = 'Tu Empresa',
  initials = 'TE',
  avatarSrc,
  media,
  tiles,
  video,
  join = 0,
  joinToast = 0,
  style,
}) => {
  const d = Math.max(0, Math.min(1.3, done));
  const isDone = d > 0.01;
  const compact = Boolean(video); // fila inferior más baja para dejar sitio al video
  const j = Math.max(0, Math.min(1, join));
  const toast = Math.max(0, Math.min(1, joinToast));
  const mix = Math.max(0, Math.min(1, video?.labelMix ?? 0));
  const AREA_W = CALLCARD_W - PAD * 2;
  // Pulso del contador al llegar a 30:00: sube a ~1.1 a mitad del resorte y vuelve a 1.
  const pulse = 1 + 0.42 * Math.max(0, d * (1 - Math.min(1, d)));
  return (
    <div
      style={{
        position: 'relative',
        width: CALLCARD_W,
        height: video ? CALLCARD_HV : tiles ? CALLCARD_H3 : CALLCARD_H,
        boxSizing: 'border-box',
        borderRadius: 28,
        background: 'linear-gradient(180deg, #161B26 0%, #0F131B 100%)',
        boxShadow: `${shadow.cardFar}, ${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.09), 0 0 0 1px rgba(255,255,255,0.07)`,
        overflow: 'hidden',
        fontFamily: fonts.ui,
        color: ink.text,
        ...style,
      }}
    >
      {/* Cabecera */}
      <div style={{position: 'absolute', left: PAD, right: PAD, top: 22, height: 44, display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: status.ok, boxShadow: `0 0 10px ${status.ok}`}} />
        <div style={{fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', color: ink.text}}>Llamada de diagnóstico</div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)'}}>
          <ClockIcon size={20} />
          <span style={{fontSize: 26, fontWeight: 500, color: ink.text2, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums'}}>30 min</span>
        </div>
      </div>

      {video ? (
        <>
          {/* Grabación real de la llamada: se angosta cuando "Tu Empresa" se une */}
          <div style={{position: 'absolute', left: PAD, top: TILE_TOP, width: AREA_W - j * (TE_W + 16), height: TILE_HV, borderRadius: 18, overflow: 'hidden', background: '#1A2030', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
            <Sequence from={video.from ?? 0} layout="none">
              <OffthreadVideo src={video.src} muted startFrom={video.startFrom ?? 0} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: video.objectPosition ?? '50% 30%', display: 'block'}} />
            </Sequence>
            {video.src2 !== undefined ? (
              <Sequence from={(video.from ?? 0) + (video.switchAt ?? 0)} layout="none">
                <VideoFadeIn dur={video.fadeDur ?? 10}>
                  <OffthreadVideo src={video.src2} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: video.objectPosition ?? '50% 30%', display: 'block'}} />
                </VideoFadeIn>
              </Sequence>
            ) : null}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)'}} />
            <div style={{position: 'absolute', inset: 0, opacity: 1 - mix}}>
              <NameChip text={video.label} />
            </div>
            {video.label2 ? (
              <div style={{position: 'absolute', inset: 0, opacity: mix}}>
                <NameChip text={video.label2} />
              </div>
            ) : null}
            <LevelBars tick={tick} on={speaking} />
          </div>
          {/* "Tu Empresa" se une: entra por la derecha */}
          {j > 0.001 ? (
            <div style={{position: 'absolute', left: PAD + AREA_W - TE_W + (1 - j) * (TE_W + 48), top: TILE_TOP, width: TE_W, height: TILE_HV, borderRadius: 16, overflow: 'hidden', opacity: j, background: 'radial-gradient(ellipse 70% 60% at 50% 42%, #243049 0%, #171C28 60%, #11151E 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
              <div style={{position: 'absolute', left: TE_W / 2 - 50, top: TILE_HV / 2 - 50 - 18, width: 100, height: 100, borderRadius: 50, background: `linear-gradient(145deg, #6A95FF 0%, ${accent.button} 60%, #1F4FD6 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 26px rgba(0,0,0,0.45), 0 0 34px rgba(48,107,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontWeight: 700, fontSize: 42, letterSpacing: '-0.03em', color: '#FFFFFF', transform: `scale(${0.6 + 0.4 * j})`}}>
                {initials}
              </div>
              <div style={{position: 'absolute', right: 10, top: 10, width: 32, height: 32, borderRadius: 16, background: 'rgba(8,10,14,0.72)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <CamIcon size={18} off color={ink.text2} />
              </div>
              <NameChip text={company} compact />
            </div>
          ) : null}
          {/* Aviso "se unió" */}
          {toast > 0.001 ? (
            <div style={{position: 'absolute', left: PAD, width: AREA_W - j * (TE_W + 16), top: TILE_TOP + 14, display: 'flex', justifyContent: 'center', opacity: toast, transform: `translateY(${(1 - toast) * -10}px)`, pointerEvents: 'none'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 14px', borderRadius: 999, background: 'rgba(8,10,14,0.78)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 24px rgba(0,0,0,0.4)'}}>
                <div style={{width: 10, height: 10, borderRadius: 5, background: status.ok, boxShadow: `0 0 8px ${status.ok}`}} />
                <span style={{fontSize: 24, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>{company} se unió a la llamada</span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {tiles
        ? tiles.map((t, i) => {
            const n = tiles.length;
            const w = (CALLCARD_W - PAD * 2 - 16 * (n - 1)) / n;
            const left = PAD + i * (w + 16);
            return (
              <div key={i} style={{position: 'absolute', left, top: TILE_TOP, width: w, height: TILE_H3, borderRadius: 16, overflow: 'hidden', background: t.src ? '#1A2030' : 'radial-gradient(ellipse 70% 60% at 50% 42%, #243049 0%, #171C28 60%, #11151E 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
                {t.src ? (
                  <>
                    <Img src={t.src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: t.objectPosition ?? '50% 45%', display: 'block'}} />
                    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)'}} />
                  </>
                ) : (
                  <>
                    <div style={{position: 'absolute', left: w / 2 - 44, top: TILE_H3 / 2 - 44 - 14, width: 88, height: 88, borderRadius: 44, background: `linear-gradient(145deg, #6A95FF 0%, ${accent.button} 60%, #1F4FD6 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 26px rgba(0,0,0,0.45), 0 0 34px rgba(48,107,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontWeight: 700, fontSize: 38, letterSpacing: '-0.03em', color: '#FFFFFF'}}>
                      {t.initials}
                    </div>
                    <div style={{position: 'absolute', right: 10, top: 10, width: 32, height: 32, borderRadius: 16, background: 'rgba(8,10,14,0.72)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <CamIcon size={18} off color={ink.text2} />
                    </div>
                  </>
                )}
                <NameChip text={t.label} compact />
                {i === 0 ? <LevelBars tick={tick} on={speaking} /> : null}
              </div>
            );
          })
        : null}

      {media && !tiles ? (
        /* Captura real de la llamada (foto o video), a todo el ancho */
        <div style={{position: 'absolute', left: PAD, top: TILE_TOP, width: CALLCARD_W - PAD * 2, height: TILE_H, borderRadius: 18, overflow: 'hidden', background: '#1A2030', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
          {media.kind === 'video' ? (
            <OffthreadVideo src={media.src} muted startFrom={media.startFrom ?? 0} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: media.objectPosition ?? '50% 50%', display: 'block'}} />
          ) : (
            <Img src={media.src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: media.objectPosition ?? '50% 50%', display: 'block'}} />
          )}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)'}} />
          <NameChip text={media.label ?? name} />
          <LevelBars tick={tick} on={speaking} />
        </div>
      ) : null}

      {/* Recuadro A: Lorenzo (foto) */}
      {media || tiles || video ? null : (
      <div style={{position: 'absolute', left: PAD, top: TILE_TOP, width: TILE_W, height: TILE_H, borderRadius: 18, overflow: 'hidden', background: '#2A3140', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'}}>
        {avatarSrc ? <Img src={avatarSrc} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%', display: 'block', filter: 'brightness(0.95) contrast(1.04) saturate(0.95)'}} /> : null}
        {/* el fondo blanco de la foto se integra a la paleta oscura: tinte frío multiplicado */}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #5C6B85 0%, #3B4761 100%)', mixBlendMode: 'multiply', opacity: 0.38}} />
        {/* viñeta de cámara: bordes más oscuros y un leve tinte frío */}
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 80% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,30,50,0.10) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.38) 100%)'}} />
        <NameChip text={name} />
        <LevelBars tick={tick} on={speaking} />
      </div>
      )}

      {/* Recuadro B: Tu Empresa (sin cámara, iniciales) */}
      {media || tiles || video ? null : (
      <div
        style={{
          position: 'absolute',
          left: PAD + TILE_W + 16,
          top: TILE_TOP,
          width: TILE_W,
          height: TILE_H,
          borderRadius: 18,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 70% 60% at 50% 42%, #243049 0%, #171C28 60%, #11151E 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: TILE_W / 2 - 64,
            top: TILE_H / 2 - 64 - 14,
            width: 128,
            height: 128,
            borderRadius: 64,
            background: `linear-gradient(145deg, #6A95FF 0%, ${accent.button} 60%, #1F4FD6 100%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 14px 30px rgba(0,0,0,0.45), 0 0 40px rgba(48,107,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 54,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
          }}
        >
          {initials}
        </div>
        <div style={{position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: 18, background: 'rgba(8,10,14,0.72)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <CamIcon size={20} off color={ink.text2} />
        </div>
        <NameChip text={company} />
      </div>
      )}

      {/* Fila inferior: contador · controles · estado */}
      <div style={{position: 'absolute', left: PAD, right: PAD, top: video ? TILE_TOP + TILE_HV + 18 : tiles ? TILE_TOP + TILE_H3 + 24 : 392, height: compact ? 84 : 104, display: 'flex', alignItems: 'center'}}>
        <div style={{width: 250, flexShrink: 0}}>
          <div
            style={{
              display: 'inline-block',
              fontFamily: fonts.mono,
              fontWeight: 600,
              fontSize: compact ? 52 : 60,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: isDone ? status.ok : '#FFFFFF',
              textShadow: isDone ? `0 0 ${Math.round(22 * Math.min(1, d))}px rgba(61,214,140,0.55)` : undefined,
              transform: `scale(${pulse})`,
              transformOrigin: '0% 50%',
            }}
          >
            {formatClock(seconds)}
          </div>
        </div>

        <div style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
          <RoundButton size={compact ? 56 : 64}>
            <MicIcon size={compact ? 26 : 30} />
          </RoundButton>
          <RoundButton size={compact ? 56 : 64}>
            <CamIcon size={compact ? 26 : 30} />
          </RoundButton>
          <RoundButton danger width={compact ? 88 : 100} size={compact ? 56 : 64}>
            <HangUpIcon size={compact ? 30 : 34} />
          </RoundButton>
        </div>

        <div style={{width: 250, flexShrink: 0, position: 'relative', height: 50}}>
          {/* "Notas en vivo" (antes) */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 16px 0 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
              opacity: isDone ? 0 : 1,
            }}
          >
            <div style={{width: 10, height: 10, borderRadius: 5, background: status.danger, boxShadow: `0 0 8px ${status.danger}`}} />
            <span style={{fontSize: 26, fontWeight: 500, color: ink.text2, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>Notas en vivo</span>
          </div>
          {/* "Diagnóstico listo" (al llegar a 30:00) */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px 0 12px',
              borderRadius: 999,
              background: 'rgba(61,214,140,0.14)',
              boxShadow: 'inset 0 0 0 1px rgba(61,214,140,0.35), 0 0 24px rgba(61,214,140,0.18)',
              opacity: Math.min(1, d * 2.2),
              transform: `scale(${0.7 + 0.3 * Math.min(1.08, d)})`,
              transformOrigin: '100% 50%',
            }}
          >
            <CheckIcon size={22} />
            <span style={{fontSize: 26, fontWeight: 600, color: status.ok, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>Diagnóstico listo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
