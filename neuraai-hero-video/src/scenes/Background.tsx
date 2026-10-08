import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {progress} from '../anim';
import {FPS} from '../timeline';

// White page (as in Figma) with a faint grid and a slow-breathing brand glow
// behind the headline, so the motion has depth without changing the design.
export const Background: React.FC<{camera: number}> = ({camera}) => {
  const frame = useCurrentFrame();
  const appear = 0.3 + 0.7 * progress(frame, 0, 40);
  const t = frame / FPS;
  const breathe = 1 + 0.06 * Math.sin(t * 1.3);
  const drift = Math.sin(t * 0.8) * 40;
  // Background moves at ~40% of the camera zoom for a parallax feel.
  const parallax = 1 + (camera - 1) * 0.4;

  return (
    <AbsoluteFill style={{backgroundColor: '#FFFFFF', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${parallax})`}}>
        <AbsoluteFill
          style={{
            opacity: appear,
            backgroundImage:
              'linear-gradient(to right, rgba(30,32,34,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,32,34,0.045) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            backgroundPosition: 'center center',
            maskImage: 'radial-gradient(ellipse 55% 60% at 50% 42%, #000 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 60% at 50% 42%, #000 0%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 960 - 760 + drift,
            top: 330 - 380,
            width: 1520,
            height: 760,
            borderRadius: '50%',
            opacity: appear,
            transform: `scale(${breathe})`,
            background: 'radial-gradient(closest-side, rgba(0,109,255,0.11), rgba(0,109,255,0.04) 55%, rgba(0,109,255,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 560 - drift * 1.5,
            top: 120,
            width: 700,
            height: 460,
            borderRadius: '50%',
            opacity: appear * 0.9,
            background: 'radial-gradient(closest-side, rgba(124,92,255,0.07), rgba(124,92,255,0) 100%)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
