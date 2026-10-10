import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {canvas, fonts, ink} from '../tokens';
import {Paper} from '../ui/Paper';
import {CalendarCard} from '../ui/CalendarCard';
import {Dashboard} from '../ui/Dashboard';
import {WhatsAppConvo} from '../ui/WhatsAppConvo';
import {SummaryCards} from '../ui/SummaryCards';

// Entry de desarrollo para verificar Paper, CalendarCard, Dashboard, WhatsAppConvo y SummaryCards.
// Render: REMOTION_BROWSER=... npx remotion still src/v4/dev/docs.tsx <Id> out/dev/docs-<id>.png --frame=30 --log=error
//   PaperCover · PaperPlan · Calendar · Panel · Convo · Summary · Impl (dashboard + convo + resumen como en la referencia)

const Label: React.FC<{children: string; x: number; y: number}> = ({children, x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: fonts.mono, fontSize: 18, color: ink.text3, letterSpacing: '0.06em'}}>{children}</div>
);

const PaperCover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Paper page="cover" revealRows={2.4} style={{position: 'absolute', left: 154, top: 440}} />
  </AbsoluteFill>
);

const PaperPlan: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Paper page="plan" barsProgress={1} style={{position: 'absolute', left: 154, top: 440}} />
  </AbsoluteFill>
);

const Calendar: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <CalendarCard struck={9} style={{position: 'absolute', left: 90, top: 560}} />
    <Label x={90} y={1230}>{'struck=6.5'}</Label>
    <CalendarCard struck={6.5} style={{position: 'absolute', left: 90, top: 1260, transform: 'scale(0.55)', transformOrigin: '0 0'}} />
  </AbsoluteFill>
);

const Panel: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Dashboard style={{position: 'absolute', left: 90, top: 520}} />
    <Label x={90} y={1090}>{'progress=0.5'}</Label>
    <Dashboard progress={0.5} style={{position: 'absolute', left: 90, top: 1120, transform: 'scale(0.6)', transformOrigin: '0 0'}} />
  </AbsoluteFill>
);

const Convo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <WhatsAppConvo show={3} style={{position: 'absolute', left: 100, top: 520}} />
    <Label x={100} y={990}>{'show=1'}</Label>
    <WhatsAppConvo show={1} style={{position: 'absolute', left: 100, top: 1020, transform: 'scale(0.6)', transformOrigin: '0 0'}} />
    <Label x={100} y={1300}>{'show=1.5'}</Label>
    <WhatsAppConvo show={1.5} style={{position: 'absolute', left: 100, top: 1330, transform: 'scale(0.6)', transformOrigin: '0 0'}} />
  </AbsoluteFill>
);

const Summary: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <SummaryCards style={{position: 'absolute', left: 90, top: 760}} />
    <Label x={90} y={940}>{'progress=0.5'}</Label>
    <SummaryCards progress={0.5} style={{position: 'absolute', left: 90, top: 970}} />
  </AbsoluteFill>
);

// Composición como la referencia k238: panel arriba, conversación + resumen abajo (a 0.78 para que entre todo).
const Impl: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <div style={{position: 'absolute', left: 60, top: 560, transform: 'scale(1.07)', transformOrigin: '0 0'}}>
      <Dashboard />
      <WhatsAppConvo show={3} style={{position: 'absolute', left: 0, top: 540, transform: 'scale(0.6)', transformOrigin: '0 0'}} />
      <SummaryCards style={{position: 'absolute', left: 0, top: 820}} />
    </div>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <>
    {[
      ['PaperCover', PaperCover],
      ['PaperPlan', PaperPlan],
      ['Calendar', Calendar],
      ['Panel', Panel],
      ['Convo', Convo],
      ['Summary', Summary],
      ['Impl', Impl],
    ].map(([id, C]) => (
      <Composition key={id as string} id={id as string} component={C as React.FC} durationInFrames={60} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    ))}
  </>
);

registerRoot(Root);
