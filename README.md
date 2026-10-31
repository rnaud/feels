# feels

Twenty-one quiet, first-person Three.js scenes in black and white: a rainy afternoon at home, a café terrace in Paris, a slow train, a cabin in the snow, a seaside balcony, a bookshop reading corner, a rainy greenhouse, a jazz bar, an evening rooftop, a ferry crossing, a midnight kitchen, a late-night laundromat, an empty cinema, a Sunday picnic, a pottery studio, a porch after the rain, a rainy Kyoto tea room, a Marrakech courtyard, an Oaxaca lunch table, a Hanoi balcony, and a Kenyan tea veranda.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist`; `npm run preview` serves that build.

Each scene places you at a fixed, seated eye height inside the world. Move the pointer for a gentle head turn or drag to look around. Left and right arrow keys switch to the previous or next feel, wrapping around the collection. These shortcuts pause inside dialogs and form controls. Focus the illustration and use up/down to tilt your gaze. The reset button or Home key restores the view. Choose a scene in the scrollable collection. Each world is built on its first visit, and only the selected scene animates. Each scene keeps its own animation time; returning to it or coming back from a background tab does not jump the motion forward. Ambient audio is optional and synthesized in the browser; use the sound switch and volume slider. Motion respects the operating system’s reduced-motion preference, and rendering/audio pause in background tabs.

All twenty-one scenes in the main edition are modeled 3D geometry with surface-attached pen shading. The original six follow the user’s hearted Midjourney studies; **See reference** opens those drawings. The fifteen additional places extend the same visual vocabulary without new generated reference images. The earlier rendering and comparison controls have been removed. The drawings are not used as textures or backgrounds in the main edition. Audio is synthesized locally. Fonts load from Google Fonts, with local serif/sans-serif fallbacks.

## Publish

Live site: https://rnaud.github.io/feels/

```sh
npm run deploy
```

This builds the site for `/feels/` and publishes `dist` to the `gh-pages` branch. GitHub Pages serves that branch. Commit and push source changes to `main` separately. Local development remains at `/`.

The new edition uses white geometry with fine screen-space silhouettes, surface-attached pen hatching, and deliberately placed curved ink strokes. Foreground cups and books sit within reach; windows and spare scenery leave plenty of white space. Every scene has visible, gentle object motion: a swishing cat tail, a turning waiter, passing trees, flickering fire, a rocking sailboat and fluttering towel, lifting book pages, swaying greenhouse foliage, a musician moving with the music, billowing laundry, a swinging lifebuoy, a kitchen clock pendulum, a tipping bamboo spout, expanding fountain rings, lifting papel picado, passing scooters, and mist crossing the tea rows. These animate real geometry and transforms and respect reduced-motion settings. The train landscape loops in depth bands: hills, trees, and houses travel together, while nearby grass passes faster and distant hills drift more slowly. The bookshop tree is outside its window; only a thin top page lifts while the book stays on the table. Laundry stays attached to its pegs, towel stripes follow the cloth surface, and the café and piano figures move at their joints. Each scene has its own synthesized ambience.

## Illustrated experiment

The separate **[illustrated edition](https://rnaud.github.io/feels/illustrated/)** is available locally at `/illustrated/`. It starts with the same rainy room and Paris café. It uses the generated artwork on a continuous Three.js relief surface, with manually assigned foreground/background depth, a small mouse/drag/keyboard parallax range, moving rain, steam, and foliage. It is a 2.5D interpretation with limited viewpoint movement; it does not reconstruct hidden surfaces or provide full 3D look-around. Both editions link to each other and preserve the selected scene through `?scene=home` or `?scene=paris`.

The illustrated edition converts the drawing to two inks with antialiased edges, without adding grain. Sound is optional, motion can be paused, and reduced-motion preferences are honored. Image loading has a retry message; switching scenes during loading retains the latest selection. Both editions are emitted by the production build and deployed together.

The six current references were generated in Midjourney V7, selected from the user’s six hearted images (verified October 28, 2026), and are saved in `public/references/midjourney/` with exact prompts, job IDs, and selected indices in `prompts.json`. These are generated Sempé-inspired studies, not original artwork by Sempé. Home and Paris also use the selected drawings in the illustrated experiment, with depth and motion adjusted to their compositions. The original built-in image-generation studies remain archived in `public/references/`.

## Checks

`npm test` checks finite, repeatable animation in all twenty-one scenes, landscape motion and seamless train loops, the outside bookshop tree, the stationary book block, and fixed laundry pegs. `npm run build` validates both published editions. Browser review covers composition, rendering, sound controls, and keyboard navigation.

## Stay here

**Stay here** fills the browser with the selected world. Its controls fade after 3.5 seconds of inactivity; pointer movement, a tap, or keyboard input brings them back. Controls stay visible while focused. Left/right still change places; the on-screen arrows also work on touchscreens. Escape or **Back to places** restores the collection and keyboard focus. This works without browser fullscreen permissions, including on phones.

All twenty-one places now have occasional events with quiet intervals: a waking cat, a passing cyclist, an oncoming train, rising embers, a sail catching wind, a hopping bookshop bird, drips from a hanging planter, a pianist glancing aside, a rooftop bird hopping, a passing fishing boat, a kitchen tap drip, a bamboo clack and a falling maple leaf, a pigeon at the fountain, a hummingbird among the bougainvillea, a flower seller crossing below, and a picker walking the tea rows. Events use the same per-scene clock as the ordinary motion, so leaving a scene pauses them. Reduced motion freezes both. Sound cues follow that clock and never replay missed events after unmuting.

Audio still starts off on every visit. Optional sound now separates nearby details from environmental layers with stereo placement, responds to head turns, and adds a short soft reflection in indoor scenes. Levels pass through a compressor. Scene changes crossfade and release old audio nodes. Automated audio checks use silent node doubles, never hardware playback.

Seated eyes are lower and nearer the tables. The phone lens has a bounded vertical field of view, so objects retain their scale; look around to see the edges of the room. Portrait cabin and ferry views aim slightly toward nearby furniture. The immersive interface has touch-sized controls and safe-area spacing.


## The next five places

The midnight wash, Before the film, Under a Sunday tree, The first bowl, and After the rain brought the collection to sixteen. All five are modeled in 3D, available through the scene list, direct `?scene=laundromat|cinema|picnic|pottery|porch` links, and left/right navigation in either view. Their distinct synthesized sound layers remain off until explicitly enabled.

The middle washer eases to a stop, rests, and starts again without a rotation jump. A cinema visitor crosses between the seats and curtain. An apple rolls a little on the picnic blanket. A studio breeze moves the open window pane, while the bowl turns with its wheel. A bird lands on the porch fence; the swing hangs from fixed suspension points. Their motion and events share the same paused-per-scene clock and reduced-motion behavior as the rest of the collection.

## Five places farther afield

The garden room, The cool courtyard, The long lunch, Above the old quarter, and The first picking bring the collection to twenty-one. They are set in Kyoto, Marrakech, Oaxaca, Hanoi, and the Kenyan tea highlands, and are available through the scene list, direct `?scene=kyoto|marrakech|oaxaca|hanoi|kenya` links, and left/right navigation in either view.

All five are modeled in the same seated ink vocabulary. Kyoto opens a low tatami room onto a rain-wet garden; Marrakech shades a zellige courtyard and its fountain; Oaxaca sets a long lunch beneath papel picado; Hanoi looks down from a balcony rail over scooters and a flower seller; and the Kenyan veranda faces mist, tea rows, and a picker crossing below. Each has its own synthesized ambience—water, bamboo, cicadas, street traffic, highland birds—and quiet recurring events on the shared scene clock. The new scene code lives in `src/world-scenes.js`.
