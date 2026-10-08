# NeuraAI hero — 10 s motion graphic (Remotion)

A 1920×1080, 30 fps, 10-second (300 frame) motion piece built from the Figma frame
[NeuraAI – Framer template › Frame 4](https://www.figma.com/design/5GeBcCKp5e7uZnCZg3zgf6/NeuraAI---Framer-template?node-id=182-2024).

Rendered output: [`out/neuraai-hero.mp4`](out/neuraai-hero.mp4)

## Storyboard

| Time | Picture | Sound |
| --- | --- | --- |
| 0.0–1.2 s | Brand glow and grid fade in. ✨ pops with twinkles; the "NeuraAI 1.0 now available (Beta Access)" label wipes in. | Airy whoosh, bubbly pop, three chime twinkles; pad and plucked arpeggio fade in under a rising noise sweep. |
| 0.6–2.4 s | Headline rises word by word through line masks (blur → sharp) while the camera pulls back from a tilted close-up. | One mallet note per word, climbing a C-major pentatonic scale. |
| 1.9–3.0 s | Subtitle resolves word by word. | The beat drops at 2.0 s (kick, claps, hats, bass); soft air swish. |
| 2.4–3.5 s | Light sweep across the headline. | Rising glissando of chimes. |
| 3.0–3.9 s | "Purchase now" / "Preview" spring in; the NEURA10 hint wipes in and "10% discount!" gets a brief highlight. | Two "bloop" pops, a small swipe, a two-note coin chime. |
| 4.3–5.2 s | Logo row (ChatSphere, GlobeTrek, Swift, Logix, Kraft) staggers in. | Five soft plucks rising through the chord. |
| 4.9–7.9 s | Cursor glides in, hovers (lift + glow), clicks "Purchase now" (press + ripple), then drifts away. | Swoosh, hover tick, mouse click and a bright success arpeggio. |
| 5.0–10 s | Camera settles on the exact Figma layout and pushes in slowly; a shine passes over the primary button. | Drum fill into a resolving Cmaj9 at 8.0 s, sparkle on the button shine, music rings out. |

## Run it

```bash
npm install
npm run dev      # Remotion Studio preview
npm run render   # -> out/neuraai-hero.mp4
npm run generate-audio   # re-synthesize public/audio/*.wav after editing the sounds
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

## Sound

All audio is synthesized in code by `scripts/generate-audio.mjs` (no samples, no licensing concerns;
output is deterministic):

- `public/audio/music.wav`: a 10 s, 120 BPM bed in C (Am7 → Fmaj7 → C → G → Cmaj9). It has a quiet
  intro, a drop at 2.0 s with sidechained pad and bass, and a resolving chord at 8.0 s that rings out.
- `public/audio/sfx/*.wav`: 27 UI sounds (pops, chimes, mallet ticks, swooshes, click, success).

`src/Soundtrack.tsx` places every effect with a `<Sequence>` on the same `timeline.ts` constant that
drives its animation, so retiming an animation moves its sound with it. Music plays at 70 % volume
under the effects; the final mix peaks around −3 dBFS with no clipping.

## Structure

```
src/
  NeuraHero.tsx        composition + camera
  Soundtrack.tsx       music + sound-effect cues
  timeline.ts          all timings (frames)
  anim.ts              easing / spring helpers
  figma/               layout tokens + generated headline paths
  scenes/              Background, Badge, Headline, Subtitle, Buttons (+ hint), Logos, Cursor
public/figma/          SVGs exported from the Figma frame
public/audio/          synthesized music and sound effects
scripts/               split-headline.mjs, generate-audio.mjs
```
