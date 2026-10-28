import * as THREE from 'three';
import { Ambience } from './ambience.js';
import { createReferenceScenes } from './reference-scenes.js';
import { sceneDefinitions } from './scene-catalog.js';
import './style.css';
import { setupImmersive } from './immersive.js';
import { framedFov } from './view-framing.js';

const canvas = document.querySelector('#scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
catch { document.querySelector('#loading').textContent = 'This little world needs a browser with WebGL enabled.'; throw new Error('WebGL is unavailable'); }
renderer.setClearColor(0xffffff);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, .04, 120);
const root = new THREE.Group();
scene.add(root);
const animations={};
let activeScene='home';
const referenceStudies=createReferenceScenes({root,animations});
const studyWorlds={home:referenceStudies.home.make()};
const sceneList=document.querySelector('#scene-list');
Object.entries(sceneDefinitions).forEach(([key,d],index)=>{
 const button=document.createElement('button');button.className='place'+(key==='home'?' active':'');button.dataset.scene=key;button.setAttribute('aria-pressed',key==='home');
 button.innerHTML=`<span class="place-number">${String(index+1).padStart(2,'0')}</span><span class="place-copy"><strong>${d.title}</strong><small>${d.subtitle}</small></span><span class="place-arrow">↗</span>`;
 sceneList.append(button);
});
// Each scene has a fixed seated eye position. Only gaze rotates: never orbit.
const cameraTarget = new THREE.Vector3();
let yaw=0,pitch=0,targetYaw=0,targetPitch=0,pointerX=0,pointerY=0,dragging=false,lastX=0,lastY=0;
let viewWidth=0,viewHeight=0;
function resize(){const rect=canvas.getBoundingClientRect();viewWidth=rect.width;viewHeight=rect.height;renderer.setSize(viewWidth,viewHeight,false);camera.aspect=viewWidth/viewHeight;const study=referenceStudies[activeScene];const base=study?study.fov:64;camera.fov=framedFov(base,camera.aspect);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas.parentElement);resize();
function clampGaze(){targetYaw=THREE.MathUtils.clamp(targetYaw,-.78,.78);targetPitch=THREE.MathUtils.clamp(targetPitch,-.4,.43);}
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;pointerX=pointerY=0;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(dragging){targetYaw-=(e.clientX-lastX)*.0025;targetPitch+=(e.clientY-lastY)*.0025;clampGaze();lastX=e.clientX;lastY=e.clientY;}else if(e.pointerType!=='touch'){const r=canvas.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;}});
function release(){dragging=false;}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
function reset(immediate=false){targetYaw=targetPitch=pointerX=pointerY=0;if(immediate){yaw=pitch=0;}dragging=false;}
document.querySelector('#reset-view').addEventListener('click',()=>reset());
canvas.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();if(e.key==='ArrowUp')targetPitch+=.06;if(e.key==='ArrowDown')targetPitch-=.06;clampGaze();});
const studySwitch=document.querySelector('#study-switch');
const referenceDialog=document.querySelector('#reference-dialog');
function applyLook(){
 const study=referenceStudies[activeScene];
 if(!studyWorlds[activeScene])studyWorlds[activeScene]=study.make();
 for(const [key,g]of Object.entries(studyWorlds))g.visible=key===activeScene;
 studySwitch.hidden=!study.reference;
 resize();reset(true);
}
function selectScene(key){
 if(!sceneDefinitions[key])return;
 activeScene=key;const definition=sceneDefinitions[key];applyLook();
 history.replaceState(null,'','?scene='+key);
 document.querySelector('.edition-link').href=import.meta.env.BASE_URL+'illustrated/?scene='+(key==='paris'?'paris':'home');
 for(const button of sceneList.querySelectorAll('[data-scene]')){const selected=button.dataset.scene===key;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected);}
 const selectedButton=sceneList.querySelector('.active');
 if(matchMedia('(min-width: 701px)').matches){
  const top=selectedButton.offsetTop-sceneList.offsetTop;
  if(top<sceneList.scrollTop||top+selectedButton.offsetHeight>sceneList.scrollTop+sceneList.clientHeight)sceneList.scrollTop=Math.max(0,top-sceneList.clientHeight/2+selectedButton.offsetHeight/2);
 }
 document.querySelector('#scene-coordinate').textContent=definition.place;
 document.querySelector('#scene-weather').textContent=definition.caption;
 document.querySelector('#moment-title').textContent=definition.moment;
 document.querySelector('#immersive-title').textContent=definition.title;
 document.querySelector('#moment-index').textContent='FIG. '+String(Object.keys(sceneDefinitions).indexOf(key)+1).padStart(2,'0');
 canvas.setAttribute('aria-label',definition.description+' Drag to look around. Left and right arrows change the feel; up and down arrows tilt the view.');
 sound.setScene(key);
 if(!document.body.classList.contains('immersive')&&matchMedia('(max-width: 700px)').matches)canvas.parentElement.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
}
sceneList.addEventListener('click',event=>{const button=event.target.closest('[data-scene]');if(button)selectScene(button.dataset.scene);});
// Left/right select a place from anywhere on the page, except while using a
// form control or dialog. One physical key press advances exactly one feel.
const sceneKeys=Object.keys(sceneDefinitions);
document.addEventListener('keydown',event=>{
 if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
 if(document.querySelector('dialog[open]')||event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))return;
 event.preventDefault();
 if(event.repeat)return;
 const direction=event.key==='ArrowRight'?1:-1;
 selectRelative(direction);
});
function selectRelative(direction){selectScene(sceneKeys[(sceneKeys.indexOf(activeScene)+direction+sceneKeys.length)%sceneKeys.length]);}
document.querySelector('#show-reference').addEventListener('click',()=>{
 const study=referenceStudies[activeScene];if(!study?.reference)return;
 document.querySelector('#reference-title').textContent=sceneDefinitions[activeScene].title;
 document.querySelector('#reference-image').src=import.meta.env.BASE_URL+study.reference;
 document.querySelector('#reference-image').alt='Generated ink reference for '+sceneDefinitions[activeScene].title.toLowerCase();referenceDialog.showModal();
});
referenceDialog.querySelector('.close-dialog').addEventListener('click',()=>referenceDialog.close());
referenceDialog.addEventListener('click',event=>{if(event.target===referenceDialog){const r=referenceDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)referenceDialog.close();}});

// All ambience is synthesized locally. No audio files or requests are needed.
const sound=new Ambience();
async function toggleSound(){try{
 const enabled=await sound.toggle(activeScene);document.body.classList.toggle('sound-on',enabled);
 document.querySelector('#sound-toggle').setAttribute('aria-pressed',enabled);
 document.querySelector('#immersive-sound').setAttribute('aria-pressed',enabled);
 document.querySelector('#immersive-sound').textContent=enabled?'Sound on':'Sound off';
 document.querySelector('#sound-label').textContent=enabled?'A little atmosphere':'Sound is off';
 document.querySelector('.sound-state').textContent=enabled?'ON':'OFF';document.querySelector('#volume').hidden=!enabled;
}catch{document.querySelector('#sound-label').textContent='Sound unavailable';document.querySelector('#immersive-sound').textContent='Sound unavailable';}}
document.querySelector('#sound-toggle').addEventListener('click',toggleSound);
setupImmersive({canvas,selectRelative,soundToggle:toggleSound});
document.querySelector('#volume').addEventListener('input',e=>sound.setVolume(Number(e.target.value)/100));
document.addEventListener('visibilitychange',()=>{if(!sound.ctx)return;if(document.hidden)sound.ctx.suspend();else if(sound.enabled)sound.ctx.resume();});
const about=document.querySelector('#about');document.querySelector('#about-button').addEventListener('click',()=>about.showModal());about.querySelector('.close-dialog').addEventListener('click',()=>about.close());about.addEventListener('click',e=>{if(e.target===about){const r=about.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)about.close();}});
const clock=new THREE.Clock();
const sceneTimes=Object.fromEntries(sceneKeys.map(key=>[key,0]));
function render(){
 requestAnimationFrame(render);const delta=Math.min(clock.getDelta(),.05);if(document.hidden)return;
 const elapsed=sceneTimes[activeScene]+(reducedMotion?0:delta);sceneTimes[activeScene]=elapsed;
 const px=reducedMotion?0:pointerX*.22,py=reducedMotion?0:-pointerY*.14;
 const smoothing=reducedMotion?1:.065;
 yaw+=(targetYaw+px-yaw)*smoothing;pitch+=(targetPitch+py-pitch)*smoothing;
 const study=referenceStudies[activeScene];
 const view=study,heading=view.yaw+yaw+(camera.aspect<.8?({cabin:-.10,ferry:-.18,bookstore:.04,porch:.28}[activeScene]||0):0),elevation=view.pitch+pitch;
 camera.position.fromArray(view.eye);
 cameraTarget.set(Math.sin(heading)*Math.cos(elevation),Math.sin(elevation),-Math.cos(heading)*Math.cos(elevation)).add(camera.position);
 camera.lookAt(cameraTarget);
 sound.setHeading(heading);
 if(!reducedMotion)for(const fn of animations[study.animation])fn(elapsed);
 sound.updateEvents(activeScene,elapsed,studyWorlds[activeScene]?.userData.events||[]);
 renderer.render(scene,camera);
}
render();document.querySelector('#loading').classList.add('loaded');

const requestedScene=new URLSearchParams(location.search).get('scene');selectScene(sceneDefinitions[requestedScene]?requestedScene:'home');
