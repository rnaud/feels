# feels

Six quiet, first-person Three.js scenes in black and white: a rainy afternoon at home, a café terrace in Paris, a slow train, a cabin in the snow, a seaside balcony, and a bookshop reading corner.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist`; `npm run preview` serves that build.

Each scene places you at a fixed, seated eye height inside the world. Move the pointer for a gentle head turn, drag to look around, or focus the illustration and use the arrow keys. The reset button or Home key restores the view. Choose a scene in the scrollable collection. Each world is built on its first visit, and only the selected scene animates. Ambient audio is optional and synthesized in the browser; use the sound switch and volume slider. Motion respects the operating system’s reduced-motion preference, and rendering/audio pause in background tabs.

All six scenes in the main edition are modeled 3D geometry. The home and Paris scenes now have reference-guided studies: use **New look / Earlier look** to compare them, and **See reference** to view the generated drawing. The drawings are not used as textures or backgrounds in the main edition. Audio is synthesized locally. Fonts load from Google Fonts, with local serif/sans-serif fallbacks.

## Publish

Live site: https://rnaud.github.io/feels/

```sh
npm run deploy
```

This builds the site for `/feels/` and publishes `dist` to the `gh-pages` branch. GitHub Pages serves that branch. Commit and push source changes to `main` separately. Local development remains at `/`.

The renderer uses surface-anchored ink hatching, imperfect edge strokes, and two-tone lighting: pools of lamplight indoors and softer daylight outside. Each scene has its own synthesized ambience. Shadows remain black ink on white paper.

## Illustrated experiment

The separate **[illustrated edition](https://rnaud.github.io/feels/illustrated/)** is available locally at `/illustrated/`. It starts with the same rainy room and Paris café. It uses the generated artwork on a continuous Three.js relief surface, with manually assigned foreground/background depth, a small mouse/drag/keyboard parallax range, moving rain, steam, and foliage. It is a 2.5D interpretation with limited viewpoint movement; it does not reconstruct hidden surfaces or provide full 3D look-around. Both editions link to each other and preserve the selected scene through `?scene=home` or `?scene=paris`.

The illustrated edition preserves the drawing with static, paper-anchored two-tone stippling. Sound is optional, motion can be paused, and reduced-motion preferences are honored. Image loading has a retry message; switching scenes during loading retains the latest selection. Both editions are emitted by the production build and deployed together.

The two references were created using the built-in image generation tool. Original assets and the exact generation prompts are saved in `public/references/rainy-room.png`, `public/references/paris-cafe.png`, and `public/references/prompts.json`. The four other modeled scenes remain procedural and do not yet have generated reference studies.
