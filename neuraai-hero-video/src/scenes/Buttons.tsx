import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, enter, progress} from '../anim';
import {BTN_PRIMARY, BTN_SECONDARY, HINT, buttonPath} from '../figma/layout';
import {T} from '../timeline';
import {CLICK_POINT} from './cursor-path';

const entrance = (s: number) => ({
  opacity: Math.min(1, s * 1.3),
  transform: `translateY(${(1 - s) * 18}px) scale(${0.86 + 0.14 * s})`,
  filter: `blur(${Math.max(0, 1 - s) * 4}px)`,
});

const PrimaryButton: React.FC = () => {
  const frame = useCurrentFrame();
  const {x, y, w, h} = BTN_PRIMARY;
  const s = enter(frame, T.btnPrimary, 14);
  const hover =
    progress(frame, T.cursorArrive - 6, 10) * (1 - progress(frame, T.click + 22, 14));
  const press = interpolate(frame, [T.click - 3, T.click, T.click + 8], [0, 1, 0], clamp);
  const ripple = progress(frame, T.click, 26);
  const sweep = interpolate(frame, [T.buttonShine, T.buttonShine + 26], [-60, w + 60], {...clamp, easing: easeInOut});
  const path = buttonPath(w, h);
  const enterStyle = entrance(s);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: enterStyle.opacity,
        filter: enterStyle.filter,
        transform: `${enterStyle.transform} translateY(${-2 * hover}px) scale(${1 - press * 0.045})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 12,
          boxShadow: '0 12px 28px -6px rgba(0,109,255,0.55), 0 4px 10px -4px rgba(0,109,255,0.4)',
          opacity: hover,
        }}
      />
      <Img src={staticFile('figma/btn-primary.svg')} style={{position: 'absolute', inset: 0, width: w, height: h}} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="btn-primary-clip">
            <path d={path} />
          </clipPath>
          <linearGradient id="btn-primary-sweep" gradientUnits="userSpaceOnUse" x1={sweep - 30} y1={0} x2={sweep + 30} y2={0} gradientTransform={`rotate(20 ${sweep} 24)`}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.4} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g clipPath="url(#btn-primary-clip)">
          <rect width={w} height={h} fill="#000" opacity={0.1 * hover} />
          <circle
            cx={CLICK_POINT.x - x}
            cy={CLICK_POINT.y - y}
            r={ripple * 170}
            fill="#FFFFFF"
            opacity={ripple > 0 ? (1 - ripple) * 0.35 : 0}
          />
          {frame >= T.buttonShine ? <rect width={w} height={h} fill="url(#btn-primary-sweep)" /> : null}
        </g>
      </svg>
    </div>
  );
};

const SecondaryButton: React.FC = () => {
  const frame = useCurrentFrame();
  const {x, y, w, h} = BTN_SECONDARY;
  const s = enter(frame, T.btnSecondary, 14);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...entrance(s)}}>
      <Img src={staticFile('figma/btn-secondary.svg')} style={{width: w, height: h}} />
    </div>
  );
};

// "Apply the code 'NEURA10' for a 10% discount!"
const Hint: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = progress(frame, T.hint, 22);
  // A brief highlight behind "10% discount!" (x 195–274 in the hint layer) that settles back to the design.
  const glow = interpolate(frame, [T.hint + 16, T.hint + 26, T.hint + 60, T.hint + 80], [0, 1, 1, 0], clamp);
  const glowGrow = progress(frame, T.hint + 16, 14, easeInOut);
  return (
    <div style={{position: 'absolute', left: HINT.x, top: HINT.y, width: HINT.w, height: HINT.h}}>
      <div
        style={{
          position: 'absolute',
          left: 191,
          top: -3,
          width: 87 * glowGrow,
          height: 22,
          borderRadius: 6,
          background: 'rgba(0,109,255,0.1)',
          opacity: glow,
        }}
      />
      <Img
        src={staticFile('figma/hint.svg')}
        style={{
          position: 'absolute',
          inset: 0,
          width: HINT.w,
          height: HINT.h,
          clipPath: `inset(-4px ${(1 - wipe) * 100}% -4px 0)`,
          opacity: wipe,
          transform: `translateY(${(1 - wipe) * 6}px)`,
        }}
      />
    </div>
  );
};

export const Buttons: React.FC = () => (
  <>
    <PrimaryButton />
    <SecondaryButton />
    <Hint />
  </>
);
