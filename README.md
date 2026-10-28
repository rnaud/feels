# feels

Two quiet, first-person Three.js scenes in black and white: a rainy afternoon at home and a café terrace in Paris.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist`; `npm run preview` serves that build.

Each scene places you at a fixed, seated eye height inside the world. Move the pointer for a gentle head turn, drag to look around, or focus the illustration and use the arrow keys. The reset button or Home key restores the view. Select either scene on the left. Ambient audio is optional and synthesized in the browser; use the sound switch and volume slider. Motion respects the operating system’s reduced-motion preference, and rendering/audio pause in background tabs.

All illustrations are procedural 3D geometry. There are no image or audio asset dependencies. Fonts load from Google Fonts, with local serif/sans-serif fallbacks.

## Publish

Live site: https://rnaud.github.io/feels/

```sh
npm run deploy
```

This builds the site for `/feels/` and publishes `dist` to the `gh-pages` branch. GitHub Pages serves that branch. Commit and push source changes to `main` separately. Local development remains at `/`.

The renderer uses surface-anchored ink hatching, imperfect edge strokes, and two-tone lighting: a small pool of lamplight at home, and softer daylight in Paris. Shadows remain black ink on white paper.
