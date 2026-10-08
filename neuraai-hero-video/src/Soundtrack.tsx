import {Html5Audio, Sequence, interpolate, staticFile} from 'remotion';
import {clamp} from './anim';
import {DURATION, T} from './timeline';

// Music bed + UI sound effects, all synthesized by scripts/generate-audio.mjs.
// Each effect is pinned to the same timeline constant that drives its animation.
const MUSIC_VOLUME = 0.7;

const cue = (at: number, sound: string, volume = 1) => ({at: Math.max(0, Math.round(at)), sound, volume});

const CUES = [
  cue(0, 'whoosh-in'),
  cue(T.badge, 'pop'),
  ...T.twinkles.map((offset, i) => cue(T.badge + offset, `twinkle-${i + 1}`)),
  // Words become visible a few frames after their spring starts.
  ...[0, 1, 2, 3, 4, 5].map((i) => cue(T.headline + i * T.headlineStagger + 3, `word-${i + 1}`)),
  cue(T.subtitle, 'swish-soft'),
  cue(T.headlineShine, 'shine'),
  cue(T.btnPrimary + 2, 'button-1'),
  cue(T.btnSecondary + 2, 'button-2'),
  cue(T.hint, 'hint-swipe'),
  cue(T.hint + 16, 'coin'),
  ...[0, 1, 2, 3, 4].map((i) => cue(T.logos + i * T.logosStagger + 3, `logo-${i + 1}`)),
  cue(T.cursorIn, 'cursor-swoosh'),
  cue(T.cursorArrive - 6, 'hover'),
  cue(T.click - 2, 'click'),
  cue(T.click, 'success'),
  cue(T.buttonShine, 'sparkle'),
];

export const Soundtrack: React.FC = () => (
  <>
    <Html5Audio
      src={staticFile('audio/music.wav')}
      volume={(f) => MUSIC_VOLUME * interpolate(f, [0, 3, DURATION - 6, DURATION], [0, 1, 1, 0], clamp)}
    />
    {CUES.map(({at, sound, volume}) => (
      <Sequence key={`${sound}-${at}`} from={at} layout="none">
        <Html5Audio src={staticFile(`audio/sfx/${sound}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </>
);
