import {useCurrentFrame} from 'remotion';
import {progress} from '../anim';
import {COLORS, SUBTITLE, SUBTITLE_LINES} from '../figma/layout';
import {T} from '../timeline';

// Paragraph/Paragraph L/Regular — Onest 18/32, revealed word by word.
export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  let index = 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: SUBTITLE.x,
        top: SUBTITLE.y,
        width: SUBTITLE.w,
        fontFamily: 'Onest',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '32px',
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontFeatureSettings: '"ss03" 1',
      }}
    >
      {SUBTITLE_LINES.map((line) => (
        <div key={line} style={{whiteSpace: 'nowrap', height: 32}}>
          {line.split(' ').map((word, i) => {
            const p = progress(frame, T.subtitle + index++ * T.subtitleStagger, 18);
            return (
              <span key={i}>
                {i > 0 ? ' ' : null}
                <span
                  style={{
                    display: 'inline-block',
                    opacity: p,
                    filter: `blur(${(1 - p) * 5}px)`,
                    transform: `translateY(${(1 - p) * 12}px)`,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
