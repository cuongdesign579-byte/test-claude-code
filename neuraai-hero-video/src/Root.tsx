import {Composition} from 'remotion';
import {NeuraHero} from './NeuraHero';
import {DURATION, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NeuraHero"
    component={NeuraHero}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
