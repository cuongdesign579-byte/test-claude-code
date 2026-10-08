import {Img, staticFile, useCurrentFrame} from 'remotion';
import {enter} from '../anim';
import {LOGOS} from '../figma/layout';
import {T} from '../timeline';

export const Logos: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {LOGOS.map((logo, i) => {
        const s = enter(frame, T.logos + i * T.logosStagger, 20);
        return (
          <Img
            key={logo.src}
            src={staticFile(logo.src)}
            style={{
              position: 'absolute',
              left: logo.x,
              top: logo.y,
              width: logo.w,
              height: logo.h,
              opacity: Math.min(1, s * 1.2),
              filter: `blur(${Math.max(0, 1 - s) * 6}px)`,
              transform: `translateY(${(1 - s) * 22}px)`,
            }}
          />
        );
      })}
    </>
  );
};
