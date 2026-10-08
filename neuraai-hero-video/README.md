# NeuraAI hero — 10 s motion graphic (Remotion)

A 1920×1080, 30 fps, 10-second (300 frame) motion piece built from the Figma frame
[NeuraAI – Framer template › Frame 4](https://www.figma.com/design/5GeBcCKp5e7uZnCZg3zgf6/NeuraAI---Framer-template?node-id=182-2024).

Rendered output: [`out/neuraai-hero.mp4`](out/neuraai-hero.mp4)

## Storyboard

| Time | Beat |
| --- | --- |
| 0.0–1.2 s | Brand glow and grid fade in. ✨ pops with twinkles; the "NeuraAI 1.0 now available (Beta Access)" label wipes in. |
| 0.6–2.4 s | Headline rises word by word through line masks (blur → sharp) while the camera pulls back from a tilted close-up. |
| 1.9–3.0 s | Subtitle resolves word by word. |
| 2.4–3.5 s | Light sweep across the headline. |
| 3.0–3.9 s | "Purchase now" / "Preview" spring in; the NEURA10 hint wipes in and "10% discount!" gets a brief highlight. |
| 4.3–5.2 s | Logo row (ChatSphere, GlobeTrek, Swift, Logix, Kraft) staggers in. |
| 4.9–7.9 s | Cursor glides in, hovers (lift + glow), clicks "Purchase now" (press + ripple), then drifts away. |
| 5.0–10 s | Camera settles on the exact Figma layout and pushes in slowly; a shine passes over the primary button. |

## Run it

```bash
npm install
npm run dev      # Remotion Studio preview
npm run render   # -> out/neuraai-hero.mp4
```

If Remotion can't download its headless Chrome (e.g. in a locked-down sandbox), point it at a
local Chromium with `--browser-executable=/path/to/chrome`.

## How the design was brought in

- **Layout**: `src/figma/layout.ts` holds each layer's render bounds from the Figma frame (1200×644).
  The stage is laid out in Figma units and scaled ×1.6 to fill the 1920×1080 canvas, so the last
  frames show the layout as designed (with a slow 3 % camera push-in).
- **Typography and logos**: Satoshi, Epilogue, Sen, Be Vietnam Pro and Tanker were exported from Figma as
  outlined SVGs (`public/figma/*.svg`), so they render exactly as designed without shipping font files.
  The subtitle uses live **Onest** text (via `@fontsource/onest`) so it can animate word by word.
- **Headline words**: `scripts/split-headline.mjs` splits the outlined headline path into one path
  per word → `src/figma/headline-words.ts`. Re-run it if `public/figma/headline.svg` changes.
- **✨ emoji**: Figma's SVG export can't outline emoji, so it is rendered live with the system emoji font.

## Structure

```
src/
  NeuraHero.tsx        composition + camera
  timeline.ts          all timings (frames)
  anim.ts              easing / spring helpers
  figma/               layout tokens + generated headline paths
  scenes/              Background, Badge, Headline, Subtitle, Buttons (+ hint), Logos, Cursor
public/figma/          SVGs exported from the Figma frame
```
