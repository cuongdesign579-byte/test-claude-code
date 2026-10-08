import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, enter} from '../anim';
import {COLORS, HEADLINE} from '../figma/layout';
import {HEADLINE_VIEWBOX, HEADLINE_WORDS} from '../figma/headline-words';
import {T} from '../timeline';

const PAD = 4;
// Vertical mask band for each line (headline viewBox units). Words rise into view through it.
const LINE_BANDS = [
  {top: -24, bottom: 60},
  {top: 62, bottom: 146},
];

// "AI Chatbot built for growing businesses" — outlined Satoshi Bold from Figma, word by word.
export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const shine = interpolate(frame, [T.headlineShine, T.headlineShine + 34], [-160, HEADLINE_VIEWBOX.width + 160], {
    ...clamp,
    easing: easeInOut,
  });

  return (
    <>
      {LINE_BANDS.map((band, line) => (
        <div
          key={line}
          style={{
            position: 'absolute',
            left: HEADLINE.x - 40,
            top: HEADLINE.y + band.top,
            width: HEADLINE.w + 80,
            height: band.bottom - band.top,
            overflow: 'hidden',
          }}
        >
          {HEADLINE_WORDS.map((word, i) => {
            if (word.line !== line) return null;
            const s = enter(frame, T.headline + i * T.headlineStagger, 17, 0.9);
            const [bx, by, bw, bh] = word.bbox;
            return (
              <svg
                key={i}
                width={bw + PAD * 2}
                height={bh + PAD * 2}
                viewBox={`${bx - PAD} ${by - PAD} ${bw + PAD * 2} ${bh + PAD * 2}`}
                style={{
                  position: 'absolute',
                  left: 40 + bx - PAD,
                  top: by - PAD - band.top,
                  overflow: 'visible',
                  opacity: Math.min(1, s * 1.4),
                  filter: `blur(${Math.max(0, 1 - s) * 7}px)`,
                  transform: `translateY(${(1 - s) * 78}px) rotate(${(1 - s) * 4}deg)`,
                  transformOrigin: 'left bottom',
                }}
              >
                <path d={word.d} fill={COLORS.textPrimary} />
              </svg>
            );
          })}
        </div>
      ))}
      {/* Light sweep across the settled headline */}
      <svg
        width={HEADLINE_VIEWBOX.width}
        height={HEADLINE_VIEWBOX.height}
        viewBox={`0 0 ${HEADLINE_VIEWBOX.width} ${HEADLINE_VIEWBOX.height}`}
        style={{position: 'absolute', left: HEADLINE.x, top: HEADLINE.y, overflow: 'visible'}}
      >
        <defs>
          <linearGradient
            id="headline-shine"
            gradientUnits="userSpaceOnUse"
            x1={shine - 110}
            y1={0}
            x2={shine + 110}
            y2={0}
            gradientTransform={`rotate(18 ${shine} 68)`}
          >
            <stop offset="0" stopColor={COLORS.brand} stopOpacity={0} />
            <stop offset="0.5" stopColor={COLORS.brand} stopOpacity={0.9} />
            <stop offset="1" stopColor="#7C5CFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        {frame >= T.headlineShine && frame <= T.headlineShine + 34
          ? HEADLINE_WORDS.map((word, i) => <path key={i} d={word.d} fill="url(#headline-shine)" />)
          : null}
      </svg>
    </>
  );
};
