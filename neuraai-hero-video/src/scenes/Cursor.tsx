import {useCurrentFrame} from 'remotion';
import {cursorState} from './cursor-path';

export const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const {x, y, opacity, press} = cursorState(frame);
  if (opacity <= 0) return null;

  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      style={{
        position: 'absolute',
        // Tip of the arrow sits at (5.5, 3.2) in the icon's viewBox.
        left: x - 5.5 * (22 / 24),
        top: y - 3.2 * (22 / 24),
        opacity,
        overflow: 'visible',
        transform: `scale(${1 - press * 0.14})`,
        transformOrigin: '5px 3px',
        filter: 'drop-shadow(0 2px 3px rgba(17,24,39,0.28))',
      }}
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
        fill="#1E2022"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
};
