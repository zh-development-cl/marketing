import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../brand/tokens';

export type Notification = {
  icon: React.ReactNode;
  app: string;
  title: string;
  body: string;
  time: string;
};

// iPhone con pantalla de bloqueo y notificaciones apiladas que entran una por una.
// Tamaños pensados para verse a escala 0.9 a 0.95 en un lienzo de 1080 px: nada bajo 28 px reales.
export const Phone: React.FC<{
  notifications: Notification[];
  startAt?: number; // frame en que empieza a caer la primera notificación
  gap?: number; // frames entre notificaciones
  scale?: number;
  tone?: 'chaos' | 'calm';
  date?: string;
}> = ({notifications, startAt = 0, gap = 9, scale = 1, tone = 'chaos', date = 'martes 13 de octubre'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const W = 560;
  const H = 1160;
  return (
    <div
      style={{
        width: W,
        height: H,
        borderRadius: 86,
        background: '#0B0D12',
        border: '6px solid #2A2F3A',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), inset 0 0 0 10px #000',
        position: 'relative',
        overflow: 'hidden',
        transform: `scale(${scale})`,
      }}
    >
      {/* Pantalla */}
      <div
        style={{
          position: 'absolute',
          inset: 16,
          borderRadius: 72,
          background:
            tone === 'chaos'
              ? 'linear-gradient(180deg, #1A1F2E 0%, #0B0E16 100%)'
              : `linear-gradient(180deg, #11214A 0%, ${colors.ink0} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 160,
            height: 46,
            borderRadius: 30,
            background: '#000',
          }}
        />
        {/* Hora */}
        <div style={{position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center'}}>
          <div style={{fontFamily: fonts.sans, fontSize: 30, color: 'rgba(255,255,255,0.75)', fontWeight: 500}}>{date}</div>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 124,
              fontWeight: 500,
              color: '#fff',
              lineHeight: 1,
              marginTop: 6,
              letterSpacing: '-0.03em',
            }}
          >
            9:41
          </div>
        </div>
        {/* Notificaciones */}
        <div style={{position: 'absolute', top: 300, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 14}}>
          {notifications.map((n, i) => {
            const t = frame - startAt - i * gap;
            const p = spring({frame: t, fps, config: {damping: 14, stiffness: 140}});
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [-40, 0])}px) scale(${interpolate(p, [0, 1], [0.92, 1])})`,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  padding: '18px 20px',
                  borderRadius: 26,
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {n.icon}
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10}}>
                    <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 30, color: '#fff'}}>{n.app}</div>
                    <div style={{fontFamily: fonts.sans, fontSize: 24, color: 'rgba(255,255,255,0.55)', flex: 'none'}}>{n.time}</div>
                  </div>
                  <div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 30, color: '#fff', marginTop: 2}}>{n.title}</div>
                  <div
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 28,
                      lineHeight: 1.2,
                      color: 'rgba(255,255,255,0.8)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {n.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Barra inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 8,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.7)',
          }}
        />
      </div>
    </div>
  );
};
