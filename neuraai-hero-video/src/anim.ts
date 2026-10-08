import {Easing, interpolate, spring} from 'remotion';
import {FPS} from './timeline';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 between `start` and `start + duration`, eased. */
export const progress = (frame: number, start: number, duration: number, easing = easeOut) =>
  interpolate(frame, [start, start + duration], [0, 1], {...clamp, easing});

/** Soft, slightly springy entrance (no visible overshoot wobble). */
export const enter = (frame: number, start: number, damping = 18, mass = 0.8) =>
  spring({frame: frame - start, fps: FPS, config: {damping, mass, stiffness: 120}});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
