import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {canvas, fonts, ink} from '../tokens';
import {ALL_CARDS, CardAt} from '../ui/cards';

// Entry de desarrollo para verificar las tarjetas de src/v4/ui/cards.tsx:
//   CardsGrid      → las 9 tarjetas (variante 0) en una grilla
//   CardsVariants  → una fila por tipo con sus 3 variantes
//   CardsWall      → 40 tarjetas repartidas con CardAt, escaladas como el muro de la referencia

const Label: React.FC<{children: string; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', fontFamily: fonts.mono, fontSize: 18, color: ink.text3, letterSpacing: '0.06em', ...style}}>{children}</div>
);

const Grid: React.FC = () => {
  const cols = 3;
  const cw = 340;
  const x0 = (canvas.width - cols * cw) / 2 + 10;
  let y = 300;
  const items: React.ReactNode[] = [];
  let rowH = 0;
  ALL_CARDS.forEach((c, i) => {
    const col = i % cols;
    if (col === 0 && i > 0) {
      y += rowH + 70;
      rowH = 0;
    }
    rowH = Math.max(rowH, c.h);
    const x = x0 + col * cw;
    items.push(
      <React.Fragment key={c.name}>
        <Label style={{left: x, top: y - 28}}>{`${c.name} · ${c.w}x${c.h}`}</Label>
        <div style={{position: 'absolute', left: x, top: y}}>
          <c.Component variant={0} />
        </div>
      </React.Fragment>,
    );
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <Label style={{left: 60, top: 120, fontSize: 28, color: ink.text2}}>v4 · cards.tsx · variante 0</Label>
      {items}
    </AbsoluteFill>
  );
};

const Variants: React.FC = () => {
  const s = 0.8;
  const x0 = 24;
  let y = 60;
  const items: React.ReactNode[] = [];
  ALL_CARDS.forEach((c) => {
    for (let v = 0; v < c.variants; v++) {
      items.push(
        <div key={`${c.name}-${v}`} style={{position: 'absolute', left: x0 + v * 262, top: y, transform: `scale(${s})`, transformOrigin: 'top left'}}>
          <c.Component variant={v} />
        </div>,
      );
    }
    y += c.h * s + 44;
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      {items}
    </AbsoluteFill>
  );
};

// 40 tarjetas en 4 columnas, escaladas a 0.74 (como la referencia a 1080 px de ancho).
const Wall: React.FC = () => {
  const n = 40;
  const cols = 4;
  const s = 0.74;
  const cw = 252;
  const rh = 136;
  const x0 = (canvas.width - cols * cw) / 2 + 8;
  const y0 = 300;
  return (
    <AbsoluteFill>
      <Backdrop />
      <Label style={{left: 60, top: 180, fontSize: 28, color: ink.text2}}>CardAt · 40 índices</Label>
      {Array.from({length: n}, (_, i) => {
        const {node, w, h} = CardAt({index: i});
        const col = i % cols;
        const r = Math.floor(i / cols);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x0 + col * cw + ((cw - w * s) / 2),
              top: y0 + r * rh + ((rh - h * s) / 2),
              transform: `scale(${s})`,
              transformOrigin: 'top left',
            }}
          >
            {node}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="CardsGrid" component={Grid} durationInFrames={60} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    <Composition id="CardsVariants" component={Variants} durationInFrames={60} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    <Composition id="CardsWall" component={Wall} durationInFrames={60} fps={canvas.fps} width={canvas.width} height={canvas.height} />
  </>
);

registerRoot(Root);
