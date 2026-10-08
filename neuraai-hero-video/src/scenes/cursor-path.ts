import {interpolate} from 'remotion';
import {clamp, easeInOut, mix, progress} from '../anim';
import {T} from '../timeline';

// Cursor tip position in Figma units: glides in from the lower right along a curve,
// clicks "Purchase now", then drifts off.
const START = {x: 1080, y: 700};
const CONTROL = {x: 880, y: 420};
const CLICK = {x: 534, y: 408};
const REST = {x: 600, y: 470};

export const CLICK_POINT = CLICK;

export const cursorState = (frame: number) => {
  const t = progress(frame, T.cursorIn, T.cursorArrive - T.cursorIn, easeInOut);
  // Quadratic bezier START -> CONTROL -> CLICK
  let x = (1 - t) ** 2 * START.x + 2 * (1 - t) * t * CONTROL.x + t ** 2 * CLICK.x;
  let y = (1 - t) ** 2 * START.y + 2 * (1 - t) * t * CONTROL.y + t ** 2 * CLICK.y;

  const leave = progress(frame, T.click + 12, 34, easeInOut);
  x = mix(x, REST.x, leave);
  y = mix(y, REST.y, leave);

  const opacity =
    interpolate(frame, [T.cursorIn, T.cursorIn + 8], [0, 1], clamp) *
    interpolate(frame, [T.cursorOut, T.cursorOut + 14], [1, 0], clamp);
  const press = interpolate(frame, [T.click - 3, T.click, T.click + 6], [0, 1, 0], clamp);

  return {x, y, opacity, press};
};
