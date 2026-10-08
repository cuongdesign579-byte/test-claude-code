// Geometry of Figma frame "Frame 4" (node 182:2024), in Figma units.
// Values are the absolute render bounds of each exported layer, relative to the frame.
export const FRAME = {width: 1200, height: 644};

export type Box = {x: number; y: number; w: number; h: number};

export const BADGE: Box = {x: 449.5, y: 80, w: 301, h: 20};
export const HEADLINE: Box = {x: 327.57, y: 137.38, w: 546, h: 136};
export const SUBTITLE: Box = {x: 250, y: 292, w: 700, h: 64};
export const BTN_PRIMARY: Box = {x: 452, y: 380, w: 155, h: 48};
export const BTN_SECONDARY: Box = {x: 619, y: 380, w: 129, h: 48};
export const HINT: Box = {x: 463, y: 444, w: 274, h: 16};

export const LOGOS: (Box & {src: string})[] = [
  {src: 'figma/logo-chatsphere.svg', x: 156, y: 524, w: 193, h: 40},
  {src: 'figma/logo-globetrek.svg', x: 401, y: 524, w: 177, h: 40},
  {src: 'figma/logo-swift.svg', x: 630, y: 524, w: 108, h: 40},
  {src: 'figma/logo-logix.svg', x: 790, y: 524, w: 116, h: 40},
  {src: 'figma/logo-kraft.svg', x: 958, y: 524, w: 86, h: 40},
];

// Design tokens from the Figma file.
export const COLORS = {
  background: '#FFFFFF',
  textPrimary: '#1E2022',
  textSecondary: '#36393F',
  textTertiary: '#6B7280',
  brand: '#006DFF',
  buttonSecondary: '#F3F3F5',
};

// Subtitle copy, broken exactly where Figma wraps it (Onest Regular 18/32).
export const SUBTITLE_LINES = [
  'Streamline customer interactions, respond instantly, and scale smarter with an AI',
  'chatbot tailored for modern teams.',
];

// Rounded-rect outline shared by both buttons (from the exported button SVGs).
export const buttonPath = (w: number, h: number) =>
  `M0 16C0 10.4 0 7.6 1.1 5.5C2 3.6 3.6 2 5.5 1.1C7.6 0 10.4 0 16 0H${w - 16}C${w - 10.4} 0 ${w - 7.6} 0 ${w - 5.5} 1.1C${w - 3.6} 2 ${w - 2} 3.6 ${w - 1.1} 5.5C${w} 7.6 ${w} 10.4 ${w} 16V${h - 16}C${w} ${h - 10.4} ${w} ${h - 7.6} ${w - 1.1} ${h - 5.5}C${w - 2} ${h - 3.6} ${w - 3.6} ${h - 2} ${w - 5.5} ${h - 1.1}C${w - 7.6} ${h} ${w - 10.4} ${h} ${w - 16} ${h}H16C10.4 ${h} 7.6 ${h} 5.5 ${h - 1.1}C3.6 ${h - 2} 2 ${h - 3.6} 1.1 ${h - 5.5}C0 ${h - 7.6} 0 ${h - 10.4} 0 ${h - 16}V16Z`;
