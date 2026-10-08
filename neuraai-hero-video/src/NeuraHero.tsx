import '@fontsource/onest/400.css';
import {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut} from './anim';
import {FRAME} from './figma/layout';
import {DURATION} from './timeline';
import {Background} from './scenes/Background';
import {Badge} from './scenes/Badge';
import {Buttons} from './scenes/Buttons';
import {Cursor} from './scenes/Cursor';
import {Headline} from './scenes/Headline';
import {Logos} from './scenes/Logos';
import {Subtitle} from './scenes/Subtitle';
import {Soundtrack} from './Soundtrack';

// The 1200×644 Figma frame is laid out in Figma units and scaled to the 1920×1080 canvas.
const BASE_SCALE = 1.6;
const SETTLE = 150;

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading Onest'));
  useEffect(() => {
    document.fonts.load('400 18px Onest').then(() => continueRender(handle));
  }, [handle]);
};

export const NeuraHero: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();

  // Camera: starts close on the headline with a slight 3D tilt, settles on the full
  // layout by ~5 s, then pushes in very slowly for the rest of the shot.
  const settle = interpolate(frame, [0, SETTLE], [0, 1], {...clamp, easing: easeInOut});
  const push = interpolate(frame, [SETTLE, DURATION], [0, 1], clamp);
  const camera = interpolate(settle, [0, 1], [1.26, 1]) * (1 + 0.03 * push);
  const focusY = interpolate(settle, [0, 1], [212, FRAME.height / 2]) + 6 * push;
  const tilt = interpolate(settle, [0, 1], [9, 0]);

  const k = BASE_SCALE * camera;
  const left = 960 - (FRAME.width / 2) * k;
  const top = 540 - focusY * k;

  return (
    <AbsoluteFill>
      <Soundtrack />
      <Background camera={camera} />
      <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: '50% 40%'}}>
        <AbsoluteFill style={{transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 50%'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: FRAME.width,
              height: FRAME.height,
              transformOrigin: '0 0',
              transform: `translate(${left}px, ${top}px) scale(${k})`,
            }}
          >
            <Badge />
            <Headline />
            <Subtitle />
            <Buttons />
            <Logos />
            <Cursor />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
