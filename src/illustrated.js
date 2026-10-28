import * as THREE from 'three';
import { Ambience } from './ambience.js';
import './illustrated.css';

const canvas = document.querySelector('#illustration');
const loading = document.querySelector('#loading');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !motionPreference.matches;
let active = new URLSearchParams(location.search).get('scene') === 'paris' ? 'paris' : 'home';
const definitions = {
  home: { file: 'midjourney/home.png', place: 'AT HOME', caption: 'RAIN ON THE WINDOWS. NOWHERE TO GO.', moment: 'The lovely art of staying in.', label: 'A rainy room in moving ink.' },
  paris: { file: 'midjourney/paris.png', place: 'MONTMARTRE, PARIS', caption: 'ONE COFFEE. ALL THE TIME IN THE WORLD.', moment: 'The world can wait another coffee.', label: 'A Paris café terrace in moving ink.' },
};
const sound = new Ambience();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22.62, 1.5, .1, 20);
camera.position.z = 5;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch {
  loading.textContent = 'This illustrated window needs WebGL. Try another browser to step inside.';
  throw new Error('WebGL unavailable');
}
renderer.setClearColor(0xffffff);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const views = new Map();
const pending = new Map();
let currentView;
let request = 0;
let x = 0, y = 0, targetX = 0, targetY = 0, dragging = false, previousX = 0, previousY = 0;
const smooth = (a, b, n) => THREE.MathUtils.smoothstep(n, a, b);

// A continuous relief avoids holes between cutout layers. Its projection at rest
// exactly matches the drawing; foreground regions shift farther than the distance.
function depthAt(key, u, v) {
  if (key === 'home') {
    const foreground = smooth(.48, .82, v) * .85;
    const cup = Math.exp(-(((u - .52) / .13) ** 4) - ((v - .66) / .15) ** 4) * .85;
    const chair = Math.exp(-(((u - .67) / .08) ** 4) - ((v - .44) / .15) ** 4) * .42;
    return Math.max(.1 + foreground, cup, chair);
  }
  const table = smooth(.64, .90, v) * 1.0;
  const chair = Math.exp(-(((u - .73) / .14) ** 4)) * smooth(.63, .75, v) * .75;
  const tree = Math.exp(-(((u - .77) / .14) ** 4)) * (1 - smooth(.53, .67, v)) * .22;
  return Math.max(.08 + table, chair, tree);
}
function projectedPoint(key, u, v, extra = 0) {
  const z = depthAt(key, u, v) + extra;
  const scale = (5 - z) / 5;
  return new THREE.Vector3((u - .5) * 3 * scale, (.5 - v) * 2 * scale, z);
}

async function buildView(key) {
  const texture = await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL + 'references/' + definitions[key].file);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const geometry = new THREE.PlaneGeometry(3, 2, 180, 120);
  const positions = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const point = projectedPoint(key, uv.getX(i), 1 - uv.getY(i));
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: { art: { value: texture }, time: { value: 0 }, living: { value: motion ? 1 : 0 }, home: { value: key === 'home' ? 1 : 0 } },
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D art;uniform float time;uniform float living;uniform float home;varying vec2 vUv;
      void main(){
        vec2 uv=vUv;
        if(home>.5){
          float steam=exp(-pow(abs((uv.x-.51)/.033),4.)-pow(abs((uv.y-.43)/.09),4.));
          uv.x+=sin(uv.y*55.+time*.7)*.0022*steam*living;
          float cat=exp(-pow(abs((uv.x-.43)/.07),4.)-pow(abs((uv.y-.61)/.04),4.));
          uv.y+=sin(time*.8)*.0007*cat*living;
        }else{
          float leaves=smoothstep(.76,.95,uv.y)*smoothstep(.56,.65,uv.x);
          uv.x+=sin(time*.45+uv.y*16.)*.0008*leaves*living;
        }
        vec3 c=texture2D(art,uv).rgb;
        float light=dot(c,vec3(.299,.587,.114));
        // Two inks, with antialiasing only at the drawn edges. Avoid added grain.
        float edge=max(fwidth(light)*.5,.018);
        float paper=smoothstep(.64-edge,.64+edge,light);
        gl_FragColor=vec4(vec3(mix(.055,1.,paper)),1.);
      }`,
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, material));
  const updates = [];
  if (key === 'home') {
    const drops = Array.from({ length: 16 }, () => ({ x: .32 + Math.random() * .22, start: Math.random(), speed: .045 + Math.random() * .045 }));
    const rain = new THREE.BufferGeometry();
    const vertices = new Float32Array(drops.length * 6);
    rain.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const lines = new THREE.LineSegments(rain, new THREE.LineBasicMaterial({ color: 0x333333 }));
    group.add(lines);
    updates.push(t => {
      drops.forEach((drop, i) => {
        const v = .15 + (drop.start + t * drop.speed) % .24;
        const hidden = false;
        const a = projectedPoint(key, drop.x, v, .035);
        const b = projectedPoint(key, drop.x - .0006, v + (hidden ? 0 : .009), .035);
        vertices.set([...a.toArray(), ...b.toArray()], i * 6);
      });
      rain.attributes.position.needsUpdate = true;
    });
  } else {
    const steamGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(3 * 20 * 6);
    steamGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    group.add(new THREE.LineSegments(steamGeometry, new THREE.LineBasicMaterial({ color: 0x171717, transparent: true, opacity: .24 })));
    updates.push(t => {
      for (let strand = 0; strand < 3; strand++) for (let i = 0; i < 20; i++) {
        const points = [i, i + 1].map(j => {
          const v = .734 - j * .0035;
          const u = .478 + (strand - 1) * .008 + Math.sin(j * .25 - t * .8 + strand) * .005 * j / 20;
          return projectedPoint(key, u, v, .06);
        });
        vertices.set([...points[0].toArray(), ...points[1].toArray()], (strand * 20 + i) * 6);
      }
      steamGeometry.attributes.position.needsUpdate = true;
    });
  }
  updates.forEach(update => update(0));
  group.visible = false;
  scene.add(group);
  const result = { group, material, updates };
  views.set(key, result);
  return result;
}

function reset() { targetX = targetY = 0; }
async function selectScene(key) {
  const version = ++request;
  active = key;
  reset();
  loading.hidden = false;
  loading.textContent = 'Opening a little window…';
  const definition = definitions[key];
  document.querySelectorAll('[data-scene]').forEach(button => {
    button.classList.toggle('active', button.dataset.scene === key);
    button.setAttribute('aria-pressed', button.dataset.scene === key);
  });
  document.querySelector('#scene-place').textContent = definition.place;
  document.querySelector('#scene-caption').textContent = definition.caption;
  document.querySelector('#moment').textContent = definition.moment;
  document.querySelector('#figure').textContent = key === 'home' ? 'FIG. 01' : 'FIG. 02';
  document.querySelector('#compare').href = import.meta.env.BASE_URL + '?scene=' + key;
  canvas.setAttribute('aria-label', definition.label + ' Move your mouse, drag, or use arrow keys to gently shift your view.');
  history.replaceState(null, '', '?scene=' + key);
  sound.setScene(key);
  try {
    if (!views.has(key) && !pending.has(key)) pending.set(key, buildView(key).finally(() => pending.delete(key)));
    const view = views.get(key) || await pending.get(key);
    if (version !== request) return;
    views.forEach(candidate => { candidate.group.visible = candidate === view; });
    currentView = view;
    view.material.uniforms.living.value = motion ? 1 : 0;
    loading.hidden = true;
  } catch {
    if (version === request) loading.textContent = 'The drawing couldn’t load. Choose the scene again to retry.';
  }
}
document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => selectScene(button.dataset.scene)));
document.querySelector('#reset-view').addEventListener('click', reset);
function clamp() { targetX = THREE.MathUtils.clamp(targetX, -.095, .095); targetY = THREE.MathUtils.clamp(targetY, -.055, .055); }
canvas.addEventListener('pointerdown', event => { dragging = true; previousX = event.clientX; previousY = event.clientY; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => {
  if (dragging) {
    targetX -= (event.clientX - previousX) * .0006;
    targetY += (event.clientY - previousY) * .0006;
    previousX = event.clientX; previousY = event.clientY;
  } else if (event.pointerType !== 'touch' && motion) {
    const rect = canvas.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * .15;
    targetY = -((event.clientY - rect.top) / rect.height - .5) * .08;
  }
  clamp();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { dragging = false; });
canvas.addEventListener('pointerleave', () => { if (!dragging) reset(); });
canvas.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') targetX -= .022;
  if (event.key === 'ArrowRight') targetX += .022;
  if (event.key === 'ArrowUp') targetY += .015;
  if (event.key === 'ArrowDown') targetY -= .015;
  if (event.key === 'Home') reset();
  clamp();
});
function updateMotion() {
  const button = document.querySelector('#motion-toggle');
  button.setAttribute('aria-pressed', motion);
  button.textContent = motion ? 'Motion is on' : 'Motion is off';
  views.forEach(view => { view.material.uniforms.living.value = motion ? 1 : 0; });
  reset();
}
document.querySelector('#motion-toggle').addEventListener('click', () => { motion = !motion; updateMotion(); });
motionPreference.addEventListener('change', event => { motion = !event.matches; updateMotion(); });
updateMotion();
document.querySelector('#sound-toggle').addEventListener('click', async () => {
  try {
    const enabled = await sound.toggle(active);
    document.querySelector('#sound-toggle').setAttribute('aria-pressed', enabled);
    document.querySelector('#sound-label').textContent = enabled ? 'A little atmosphere' : 'Sound is off';
    document.querySelector('#volume').hidden = !enabled;
  } catch { document.querySelector('#sound-label').textContent = 'Sound unavailable'; }
});
document.querySelector('#volume').addEventListener('input', event => sound.setVolume(Number(event.target.value) / 100));
document.addEventListener('visibilitychange', () => { if (sound.ctx) { if (document.hidden) sound.ctx.suspend(); else if (sound.enabled) sound.ctx.resume(); } });
new ResizeObserver(() => {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  // A slight overscan prevents exposed edges at the limits of the small gaze shift.
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(.96 / 5));
  camera.updateProjectionMatrix();
}).observe(canvas.parentElement);
let lastTime = 0, elapsed = 0;
function render(now) {
  requestAnimationFrame(render);
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  if (document.hidden) return;
  if (motion) elapsed += delta;
  const smoothing = motionPreference.matches ? 1 : 1 - Math.exp(-delta * 4);
  x += (targetX - x) * smoothing; y += (targetY - y) * smoothing;
  camera.position.set(x, y, 5);
  camera.lookAt(0, 0, 0);
  if (currentView && motion) {
    currentView.material.uniforms.time.value = elapsed;
    currentView.updates.forEach(update => update(elapsed));
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(render);
selectScene(active);
