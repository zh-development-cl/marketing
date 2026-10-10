import React from 'react';
import {Img} from 'remotion';
import {accent, fonts, ink, radius, shadow, status} from '../tokens';

// Barra de llamada (píldora oscura ≈ 840 x 110): avatar, "Lorenzo, de ZH" + "llamada con Tu Empresa" y el contador
// mm:ss a la derecha. `done` lo pinta en verde ok (cuando llega a 30:00). No anima: la escena pasa `seconds`.

export type CallBarProps = {
  seconds: number; // segundos transcurridos; se muestra mm:ss
  done?: boolean; // contador en verde (status.ok) con leve glow
  name?: string; // "Lorenzo, de ZH"
  sub?: string; // "llamada con Tu Empresa"
  avatarSrc?: string; // URL (staticFile) de la foto; si falta, círculo azul con la inicial
  initial?: string; // inicial del avatar sin foto (por defecto la primera letra de `name`)
  width?: number; // 840
  style?: React.CSSProperties;
};

export const CALLBAR_W = 840;
export const CALLBAR_H = 110;

export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const CallBar: React.FC<CallBarProps> = ({seconds, done = false, name = 'Lorenzo, de ZH', sub = 'llamada con Tu Empresa', avatarSrc, initial, width = CALLBAR_W, style}) => {
  const letter = (initial ?? name.trim().charAt(0) ?? 'L').toUpperCase();
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: CALLBAR_H,
        borderRadius: radius.pill,
        background: 'linear-gradient(180deg, rgba(27,31,39,0.97) 0%, rgba(15,18,24,0.97) 100%)',
        boxShadow: `${shadow.card}, inset 0 1px 0 rgba(255,255,255,0.09), 0 0 0 1px rgba(255,255,255,0.07)`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 42px 0 18px',
        gap: 20,
        fontFamily: fonts.ui,
        color: ink.text,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{position: 'relative', width: 74, height: 74, flexShrink: 0}}>
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            overflow: 'hidden',
            background: `linear-gradient(145deg, #6A95FF 0%, ${accent.button} 60%, #1F4FD6 100%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarSrc ? (
            <Img src={avatarSrc} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
          ) : (
            <span style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 36, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1, marginTop: -2}}>{letter}</span>
          )}
        </div>
        {/* punto "en línea" */}
        <div style={{position: 'absolute', right: 1, bottom: 1, width: 16, height: 16, borderRadius: 8, background: status.ok, boxShadow: '0 0 0 3px #14171D'}} />
      </div>

      <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3}}>
        <div style={{fontWeight: 700, fontSize: 28, letterSpacing: '-0.015em', lineHeight: 1.15, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{name}</div>
        <div style={{fontWeight: 400, fontSize: 23, color: ink.text2, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{sub}</div>
      </div>

      <div
        style={{
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: done ? status.ok : '#FFFFFF',
          textShadow: done ? '0 0 22px rgba(61,214,140,0.45)' : undefined,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {formatClock(seconds)}
      </div>
    </div>
  );
};
