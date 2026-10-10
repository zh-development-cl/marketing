import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {Moving} from '../fx/MotionBlur';
import {BlurIn, Pop, StepTitle, Typewriter, spreadWords} from '../fx/text';
import {keyframes, outQuart, tween} from '../fx/ease';
import {accent, fonts, ink, shadow} from '../tokens';

// Prueba de humo de la base v4: fondo con grano, motion blur por velocidad, texto palabra por palabra.
const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <StepTitle n="01" title="entender" at={2} />
      <Moving
        x={(f) => keyframes(f, [[0, -500], [25, 300], [60, 300], [80, 1200]])}
        y={(f) => 820 + Math.sin(f / 9) * 6}
        rotate={(f) => tween(f, 0, 25, -18, 0, outQuart)}
      >
        <div style={{width: 320, height: 160, borderRadius: 14, background: '#FBFAF6', boxShadow: shadow.card, padding: 16, fontFamily: fonts.ui, color: '#1C1F26', fontSize: 16}}>
          <div style={{fontWeight: 700}}>FACTURA ELECTRÓNICA · N° 1043</div>
          <div style={{marginTop: 8, color: '#6B7280'}}>Cliente · Comercial Andes</div>
          <div style={{marginTop: 4}}>Total · <b>$ 384.900</b></div>
        </div>
      </Moving>
      <div style={{position: 'absolute', left: 120, top: 1100, width: 840}}>
        <Typewriter words={spreadWords('imagina que esta es **tu empresa**', 10, 5)} size={52} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center'}}>
        <Pop at={30}>
          <div style={{padding: '26px 48px', borderRadius: 999, background: accent.button, color: '#fff', fontFamily: fonts.sans, fontWeight: 600, fontSize: 40, boxShadow: shadow.glow(accent.glow, 50)}}>
            Agenda tu llamada de 30 min →
          </div>
        </Pop>
      </div>
      <BlurIn at={40} style={{position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontFamily: fonts.mono, color: ink.text2, fontSize: 26}}>
        frame {frame}
      </BlurIn>
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Smoke" component={Smoke} durationInFrames={120} fps={30} width={1080} height={1920} />);
