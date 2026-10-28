# feels

Six quiet, first-person Three.js scenes in black and white: a rainy afternoon at home, a café terrace in Paris, a slow train, a cabin in the snow, a seaside balcony, and a bookshop reading corner.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist`; `npm run preview` serves that build.

Each scene places you at a fixed, seated eye height inside the world. Move the pointer for a gentle head turn, drag to look around, or focus the illustration and use the arrow keys. The reset button or Home key restores the view. Choose a scene in the scrollable collection. Each world is built on its first visit, and only the selected scene animates. Ambient audio is optional and synthesized in the browser; use the sound switch and volume slider. Motion respects the operating system’s reduced-motion preference, and rendering/audio pause in background tabs.

All six scenes in the main edition are modeled 3D geometry. All six scenes now have Midjourney reference-guided studies inspired by Sempé: use **New look / Earlier look** to compare them, and **See reference** to view each selected drawing. The drawings are not used as textures or backgrounds in the main edition. Audio is synthesized locally. Fonts load from Google Fonts, with local serif/sans-serif fallbacks.

## Publish

Live site: https://rnaud.github.io/feels/

```sh
npm run deploy
```

This builds the site for `/feels/` and publishes `dist` to the `gh-pages` branch. GitHub Pages serves that branch. Commit and push source changes to `main` separately. Local development remains at `/`.

The new edition uses white geometry with fine screen-space silhouettes, surface-attached pen hatching, and deliberately placed curved ink strokes. Foreground cups and books sit within reach; windows and spare scenery leave plenty of white space. Small movements include rain, steam, a breathing cat, passing trees, fire, a sailboat, and a walking figure. The earlier edition retains its surface hatching and two-tone lighting. Each scene has its own synthesized ambience.

## Illustrated experiment

The separate **[illustrated edition](https://rnaud.github.io/feels/illustrated/)** is available locally at `/illustrated/`. It starts with the same rainy room and Paris café. It uses the generated artwork on a continuous Three.js relief surface, with manually assigned foreground/background depth, a small mouse/drag/keyboard parallax range, moving rain, steam, and foliage. It is a 2.5D interpretation with limited viewpoint movement; it does not reconstruct hidden surfaces or provide full 3D look-around. Both editions link to each other and preserve the selected scene through `?scene=home` or `?scene=paris`.

The illustrated edition converts the drawing to two inks with antialiased edges, without adding grain. Sound is optional, motion can be paused, and reduced-motion preferences are honored. Image loading has a retry message; switching scenes during loading retains the latest selection. Both editions are emitted by the production build and deployed together.

The six current references were generated in Midjourney V7, selected from the user’s six hearted images (verified October 28, 2026), and are saved in `public/references/midjourney/` with exact prompts, job IDs, and selected indices in `prompts.json`. These are generated Sempé-inspired studies, not original artwork by Sempé. Home and Paris also use the selected drawings in the illustrated experiment, with depth and motion adjusted to their compositions. The original built-in image-generation studies remain archived in `public/references/`.
