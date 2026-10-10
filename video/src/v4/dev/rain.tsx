import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {Rain, orderBetween} from '../fx/Rain';
import {LogoDraw} from '../ui/LogoDraw';
import {hash, keyframes} from '../fx/ease';
import {apps, fonts, shadow} from '../tokens';

// Prueba de la lluvia de tarjetas (con tarjetas de relleno) y del dibujo del logo.
const Placeholder: React.FC<{i: number; w: number; h: number}> = ({i, w, h}) => {
  const kind = i % 4;
  const bgc = [apps.paper, apps.sticky, '#1A1F2B', apps.excelLight][kind];
  const fg = kind === 2 ? '#fff' : '#1C1F26';
  return (
    <div style={{width: w, height: h, borderRadius: 12, background: bgc, boxShadow: shadow.card, padding: 14, fontFamily: kind === 1 ? fonts.hand : fonts.ui, fontSize: kind === 1 ? 26 : 15, color: fg, overflow: 'hidden'}}>
      <div style={{fontWeight: 700}}>{['FACTURA ELECTRÓNICA · N° 1043', 'cobrar a Pérez (otra vez)', 'Camila Rojas · 21:40', 'inventario_FINAL_v3.xlsx'][kind]}</div>
      <div style={{marginTop: 8, opacity: 0.75}}>{['Cliente · Comercial Andes · $ 384.900', '', 'Hola! tienen stock del modelo azul?', 'modelo azul · 12 · 24.990'][kind]}</div>
    </div>
  );
};

const RainTest: React.FC = () => {
  const frame = useCurrentFrame();
  const items = Array.from({length: 28}, (_, i) => {
    const w = 260 + Math.round(hash(i, 9) * 80);
    const h = 120 + Math.round(hash(i, 8) * 50);
    return {w, h, node: <Placeholder i={i} w={w} h={h} />};
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <Rain items={items} start={0} stagger={2} order={orderBetween(70, 100)} />
      <div style={{position: 'absolute', left: 290, top: 1500}}>
        <LogoDraw width={500} draw={keyframes(frame, [[0, 0], [40, 1]])} fill={keyframes(frame, [[35, 0], [55, 1]])} accentIn={keyframes(frame, [[50, 0], [62, 1]])} glow={keyframes(frame, [[50, 0], [80, 1]])} />
      </div>
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="RainTest" component={RainTest} durationInFrames={130} fps={30} width={1080} height={1920} />);
