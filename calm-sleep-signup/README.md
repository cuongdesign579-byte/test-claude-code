# Calm Sleep — "Your plan is ready" sign-up screen

A static HTML/CSS build of the Calm Sleep paywall sign-in screen. It was matched against the
reference screenshot (`reference/plan-ready.webp`) with a pixel diff, not by eye.

No build step: open `index.html`, or run `npm start` to serve the folder. To see it at the
design size, use the browser's device toolbar with an iPhone 14 Pro / 15 viewport (393 × 852).

## Verify the match

```bash
npm install
npm run compare   # -> out/render.png, out/diff.png, out/side-by-side.png
```

`compare` renders the page exactly like the reference capture (393 × 852 pt at 2.2443 px/pt,
i.e. 882 px wide), diffs the screen area (the Mobbin footer is excluded) and prints:

```
mean abs error: 2.79 / 255
pixels off by > 16 levels: 3.50 %
```

Everything that is left is anti-aliasing on glyph and button edges (see *Limits*). On the
background alone the average difference is under 0.5 / 255.

## Specs (iOS points = CSS px)

| Element | Value |
| --- | --- |
| Screen | 393 × 852, flat `#1b1e26` top, sky gradient (`assets/background.webp`) anchored to the bottom |
| Typeface | [Figtree](https://github.com/erikdkennedy/figtree) (variable, bundled, OFL). Picked by metric fingerprinting: it matches the screenshot's line widths to within 1 px |
| Title | 28 / 34, weight 600, white, centred, 44 below the status bar |
| Buttons | 4 × white pills, 52 tall, radius 26, 20 side margin, 8 gap |
| Button content | 18 left padding, 24 icon slot, 12 gap, label 16 / 19.2 black |
| Legal copy | 12 / 14.4, weight 380, `rgba(255,255,255,.85)`; links pure white; 34 side padding, 40 below the buttons, 74.2 above the bottom edge |
| Status bar | 54 tall: "9:41", cellular, Wi-Fi and battery as inline SVG |

Weights 570 (labels) and 380 (legal copy) are the design's SemiBold and Regular, trimmed slightly.
Chrome draws dark-on-light and small text a bit heavier than iOS does, and the trimmed values make
the measured ink coverage match the screenshot to within about 1 %.

## How the assets were made

- **Background**: rebuilt from the screenshot. The text, buttons and status bar were masked out
  and the holes filled from the surrounding pixels. The image was then smoothed to remove WebP
  compression noise, and the top was snapped to the flat `#1b1e26`. Only the gradient part is
  shipped (lossless WebP, 81 KB).
- **Icons**: the Apple mark is the Simple Icons path, the Google "G" is Google's official 4-part
  mark and the Facebook "f" is the classic circular mark, all filled black. The envelope is a custom
  stroke icon. Each icon's position and scale were fitted against the screenshot and stored in its
  `viewBox`.
- **Status bar**: the icons follow Apple's iOS kit geometry. "9:41" is outlined from Inter
  SemiBold, because SF Pro can't be redistributed, with each glyph fitted to the SF Pro digits in
  the screenshot.

## Limits

- Text is rasterised by Chrome/Skia here and by CoreText on iOS, so glyph edges differ at the
  anti-aliasing level.
- At the reference's fractional scale (2.2443×), Chrome snaps text baselines and box edges to whole
  CSS pixels. Each element therefore lands within about 1 device px (≤ 0.45 pt) of the reference
  rather than exactly on it.
- The status bar is a mock of the iOS chrome, kept so the page can be compared 1:1. Remove it when
  the screen runs inside a real browser or webview, where the OS draws its own.
- The "curated by Mobbin" footer under the reference screenshot isn't part of the app and is not
  reproduced.

## Files

```
index.html                 markup + inline SVG icons
styles.css                 layout and tokens
assets/background.webp     sky gradient (bottom 595 pt of the screen)
assets/fonts/              Figtree variable font + OFL licence
reference/plan-ready.webp  the screenshot this was matched against
tools/compare.mjs          render + pixel diff (npm run compare)
```
