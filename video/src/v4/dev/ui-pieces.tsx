import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import '../../brand/fonts';
import {Backdrop} from '../fx/Grain';
import {prog} from '../fx/ease';
import {canvas, ink, fonts} from '../tokens';
import {Phone, PhoneNotification} from '../ui/Phone';
import {CallBar} from '../ui/CallBar';
import {Watermark} from '../ui/Watermark';
import {Ring} from '../ui/Ring';
import {Cursor} from '../ui/Cursor';

// Entry de desarrollo para verificar las piezas de src/v4/ui (teléfono, barra de llamada, marca de agua, anillo, cursor).
// Render: REMOTION_BROWSER=... npx remotion still src/v4/dev/ui-pieces.tsx <Id> out/dev/<nombre>.png --frame=30 --log=error

const busyNotes = (frame: number): PhoneNotification[] => [
  {app: 'excel', title: 'inventario_FINAL_v3', body: 'Rodrigo modificó 34 celdas', time: 'ahora', progress: prog(frame, 4, 12)},
  {app: 'gmail', title: 'Contabilidad', body: 'Factura 1043 vencida hace 12 días', time: 'ahora', progress: prog(frame, 10, 12)},
  {app: 'whatsapp', title: 'Camila Rojas', body: 'Hola! tienen stock del modelo azul?', time: 'ahora', progress: prog(frame, 16, 12)},
];

const calmNotes = (frame: number): PhoneNotification[] => [
  {app: 'gmail', title: 'Contabilidad', body: 'Pago recibido, factura 1043', time: 'ahora', progress: prog(frame, 4, 12)},
  {app: 'zh', title: 'Agente de Tu Empresa', body: 'Listo Camila, te reservé el azul', time: 'ahora', progress: prog(frame, 10, 12)},
];

const PhoneBusy: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <Phone date="lunes 13 de octubre" time="21:47" notifications={busyNotes(frame)} pending={{count: 12}} tone="busy" style={{position: 'absolute', left: 240, top: 340}} />
      <Watermark />
    </AbsoluteFill>
  );
};

const PhoneCalm: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <Phone date="lunes 13 de octubre" time="21:48" notifications={calmNotes(frame)} pending={{count: 0}} tone="calm" style={{position: 'absolute', left: 240, top: 340}} />
      <Watermark />
    </AbsoluteFill>
  );
};

// Ambos teléfonos a escala 0.8 lado a lado (busy / calm) más la versión sin bisel.
const PhonePair: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <Phone date="lunes 13 de octubre" time="21:47" notifications={busyNotes(frame)} pending={{count: 12}} tone="busy" style={{position: 'absolute', left: 40, top: 120, transform: 'scale(0.78)', transformOrigin: '0 0'}} />
      <Phone date="lunes 13 de octubre" time="21:48" notifications={calmNotes(frame)} pending={{count: 0}} tone="calm" style={{position: 'absolute', left: 560, top: 120, transform: 'scale(0.78)', transformOrigin: '0 0'}} />
      <Phone date="lunes 13 de octubre" time="21:47" notifications={busyNotes(frame).slice(0, 1)} pending={{count: 47}} tone="busy" screenOnly style={{position: 'absolute', left: 300, top: 1160, transform: 'scale(0.55)', transformOrigin: '0 0'}} />
      <Watermark />
    </AbsoluteFill>
  );
};

const Bars: React.FC = () => {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Watermark x={540} y={1700} />
      <CallBar seconds={28 * 60 + 8} style={{position: 'absolute', left: 120, top: 180}} />
      <CallBar seconds={30 * 60} done style={{position: 'absolute', left: 120, top: 330}} />
      <Ring progress={1} label="24h" sub="de respuesta" style={{position: 'absolute', left: 120, top: 560}} />
      <Ring progress={0.62} label="15h" style={{position: 'absolute', left: 500, top: 560}} />
      <Ring progress={1} label="✓" labelColor="#3DD68C" style={{position: 'absolute', left: 120, top: 940}} />
      <Ring progress={0.08} label="2h" style={{position: 'absolute', left: 500, top: 940}} />
      <div style={{position: 'absolute', left: 120, top: 1340, fontFamily: fonts.sans, color: ink.text2, fontSize: 26}}>cursor normal / pressed</div>
      <Cursor style={{position: 'absolute', left: 520, top: 1330}} />
      <Cursor pressed style={{position: 'absolute', left: 600, top: 1330}} />
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 1440,
          width: 520,
          height: 96,
          borderRadius: 999,
          background: '#306BFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: 34,
          color: '#fff',
        }}
      >
        Agenda tus 30 minutos →
      </div>
      <Cursor style={{position: 'absolute', left: 430, top: 1498}} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="PhoneBusy" component={PhoneBusy} durationInFrames={90} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    <Composition id="PhoneCalm" component={PhoneCalm} durationInFrames={90} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    <Composition id="PhonePair" component={PhonePair} durationInFrames={90} fps={canvas.fps} width={canvas.width} height={canvas.height} />
    <Composition id="Bars" component={Bars} durationInFrames={90} fps={canvas.fps} width={canvas.width} height={canvas.height} />
  </>
);

registerRoot(Root);
