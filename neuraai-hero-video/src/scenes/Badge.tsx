import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, enter, progress} from '../anim';
import {BADGE} from '../figma/layout';
import {T} from '../timeline';

const Twinkle: React.FC<{x: number; y: number; size: number; start: number}> = ({x, y, size, start}) => {
  const frame = useCurrentFrame();
  const life = interpolate(frame, [start, start + 8, start + 22], [0, 1, 0], clamp);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{position: 'absolute', left: x - size / 2, top: y - size / 2, opacity: life, transform: `scale(${0.4 + life * 0.6}) rotate(${life * 45}deg)`}}
    >
      <path d="M5 0C5.4 3.2 6.8 4.6 10 5C6.8 5.4 5.4 6.8 5 10C4.6 6.8 3.2 5.4 0 5C3.2 4.6 4.6 3.2 5 0Z" fill="#FFC53D" />
    </svg>
  );
};

// "✨ NeuraAI 1.0 now available (Beta Access)"
export const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = enter(frame, T.badge, 10, 0.6);
  const wipe = progress(frame, T.badge + 5, 24);

  return (
    <div style={{position: 'absolute', left: BADGE.x, top: BADGE.y, width: BADGE.w, height: BADGE.h}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 1,
          width: 16,
          height: 18,
          fontSize: 14,
          lineHeight: '18px',
          textAlign: 'center',
          fontFamily: '"Apple Color Emoji", "Noto Color Emoji", sans-serif',
          opacity: Math.min(1, pop * 1.5),
          transform: `scale(${pop}) rotate(${(1 - pop) * -120}deg)`,
        }}
      >
        ✨
      </div>
      <Twinkle x={-4} y={2} size={7} start={T.badge + T.twinkles[0]} />
      <Twinkle x={19} y={-3} size={5} start={T.badge + T.twinkles[1]} />
      <Twinkle x={-2} y={18} size={4} start={T.badge + T.twinkles[2]} />
      <Img
        src={staticFile('figma/badge.svg')}
        style={{
          position: 'absolute',
          inset: 0,
          width: BADGE.w,
          height: BADGE.h,
          clipPath: `inset(-4px ${(1 - wipe) * 100}% -4px 0)`,
          opacity: wipe,
          filter: `blur(${(1 - wipe) * 3}px)`,
          transform: `translateX(${(1 - wipe) * -8}px)`,
        }}
      />
    </div>
  );
};
