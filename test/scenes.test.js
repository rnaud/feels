import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createReferenceScenes } from '../src/reference-scenes.js';

// Only the café's small lettering texture needs a canvas during scene creation.
// All geometry and animation below use the real Three.js objects.
globalThis.document = { createElement: () => ({
  width: 0, height: 0, getContext: () => ({ fillRect() {}, fillText() {} }),
}) };
function fixture(key) {
  const root = new THREE.Group(), animations = {};
  const definitions = createReferenceScenes({ root, animations });
  const definition = definitions[key], world = definition.make();
  return { world, update(t) { animations[definition.animation].forEach(fn => fn(t)); world.updateMatrixWorld(true); } };
}
function state(world) {
  const values = [];
  world.traverse(o => {
    values.push(...o.position, ...o.quaternion, ...o.scale);
    if (o.geometry?.attributes.position) values.push(...o.geometry.attributes.position.array);
  });
  return values;
}
for (const key of ['home','paris','train','cabin','seaside','bookstore','greenhouse','jazz','rooftop','ferry','kitchen']) {
  test(`${key}: motion is finite and never accumulates deformation`, () => {
    const { world, update } = fixture(key);
    update(.5); const first = state(world);
    update(3); const second = state(world);
    assert(second.every(Number.isFinite));
    assert(second.some((v, i) => Math.abs(v - first[i]) > .0001));
    update(10000); assert(state(world).every(Number.isFinite));
    update(.5); assert.deepEqual(state(world), first);
  });
}

test('train moves the complete landscape at ordered parallax speeds', () => {
  const { world, update } = fixture('train');
  const far = world.getObjectByName('train-distant-hills');
  const near = world.getObjectByName('train-near-hills');
  const grass = world.getObjectByName('train-grass');
  const house = near.getObjectByName('train-house');
  update(1); const houseX = house.getWorldPosition(new THREE.Vector3()).x;
  const positions = [far, near, grass].map(o => o.position.x);
  update(2);
  const distances = [far, near, grass].map((o, i) => positions[i] - o.position.x);
  assert(distances[0] > 0 && distances[1] > distances[0] && distances[2] > distances[1]);
  assert(Math.abs(houseX - house.getWorldPosition(new THREE.Vector3()).x - distances[1]) < 1e-8);
});

test('train hill loops have no visible seam or reset jump', () => {
  const { world, update } = fixture('train');
  function heightAt(layer, x) {
    for (const tile of layer.children) {
      const ridge = tile.getObjectByName('train-ridge');
      const p = ridge.geometry.attributes.position;
      const localX = x - layer.position.x - tile.position.x;
      for (let i = 1; i < p.count; i++) {
        if (p.getX(i - 1) <= localX && p.getX(i) >= localX) {
          const u = (localX - p.getX(i - 1)) / (p.getX(i) - p.getX(i - 1));
          return THREE.MathUtils.lerp(p.getY(i - 1), p.getY(i), u);
        }
      }
    }
    assert.fail('Landscape does not cover the train window');
  }
  for (const [name, speed] of [['train-distant-hills', .22], ['train-near-hills', .58]]) {
    const layer = world.getObjectByName(name), resetAt = 24 / speed;
    update(resetAt - .001); const before = [-5,-2,0,2,5].map(x => heightAt(layer, x));
    update(resetAt + .001); const after = [-5,-2,0,2,5].map(x => heightAt(layer, x));
    before.forEach((y, i) => assert(Math.abs(y - after[i]) < .001));
  }
});

test('bookshop tree stays outside the window and clear of the shelves', () => {
  const { world, update } = fixture('bookstore');
  const tree = world.getObjectByName('bookshop-outside-tree');
  for (const t of [0, 2, 5, 9]) {
    update(t); const bounds = new THREE.Box3().setFromObject(tree);
    assert(bounds.max.z < -3.4);
    assert(bounds.min.x > .8);
  }
});

test('only the top page moves; the book block remains on the table', () => {
  const { world, update } = fixture('bookstore');
  const book = world.getObjectByName('bookshop-open-book');
  const page = book.userData.turningPage;
  const stable = book.children.filter(child => child !== page);
  update(0); const before = stable.map(state), pageBefore = state(page);
  update(2); stable.forEach((child, i) => assert.deepEqual(state(child), before[i]));
  assert.notDeepEqual(state(page), pageBefore);
});

test('rooftop laundry moves while its pegs remain fixed', () => {
  const { world, update } = fixture('rooftop');
  const pegs = []; world.traverse(o => { if(o.name === 'rooftop-peg') pegs.push(o); });
  assert.equal(pegs.length, 6);
  update(0); const before = pegs.map(state);
  const cloth = world.getObjectByName('rooftop-laundry'), clothBefore = state(cloth);
  update(3); pegs.forEach((peg, i) => assert.deepEqual(state(peg), before[i]));
  assert.notDeepEqual(state(cloth), clothBefore);
});
