import * as THREE from 'three';
import { Ambience } from './ambience.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import './style.css';
import { createHatchedPaper, sketchEdges } from './ink.js';
import { createAdditionalScenes } from './scenes.js';
import { createReferenceScenes } from './reference-scenes.js';

const INK = 0x171717, PAPER = 0xffffff;
const ink = new THREE.MeshBasicMaterial({ color: INK });
const paper = createHatchedPaper(INK);
const lineMat = new THREE.LineBasicMaterial({ color: INK });
const whiteLine = new THREE.LineBasicMaterial({ color: PAPER });
const silhouette = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const canvas = document.querySelector('#scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); }
catch { document.querySelector('#loading').textContent = 'This little world needs a browser with WebGL enabled.'; throw new Error('WebGL is unavailable'); }
renderer.setClearColor(PAPER);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, .04, 120);
const root = new THREE.Group();
scene.add(root);
const animations = { home: [], paris: [], train: [], cabin: [], seaside: [], bookstore: [], homeStudy: [], parisStudy: [] };
let activeScene = 'home';
let randomSeed = 37;
function random() { randomSeed = (randomSeed * 16807) % 2147483647; return (randomSeed - 1) / 2147483646; }
function group(parent, x=0,y=0,z=0) { const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; }
function mesh(parent, geometry, x=0,y=0,z=0, black=false, style='edges') {
 const m = new THREE.Mesh(geometry, black ? ink : paper); m.position.set(x,y,z); parent.add(m);
 if (!black && style === 'edges') m.add(new THREE.LineSegments(sketchEdges(geometry), lineMat));
 if (!black && style === 'round') { const hull = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:INK,side:THREE.BackSide})); hull.scale.setScalar(1.025); m.add(hull); }
 return m;
}
function box(p,w,h,d,x,y,z,black=false) { return mesh(p,new THREE.BoxGeometry(w,h,d),x,y,z,black); }
function roundBox(p,w,h,d,x,y,z,r=.12,black=false) { return mesh(p,new RoundedBoxGeometry(w,h,d,3,r),x,y,z,black,'round'); }
function sphere(p,rx,ry,rz,x,y,z,black=false) { const m=mesh(p,new THREE.SphereGeometry(1,20,12),x,y,z,black,'round');m.scale.set(rx,ry,rz);return m; }
function cylinder(p,rt,rb,h,x,y,z,black=false) {
 const geometry=new THREE.CylinderGeometry(rt,rb,h,32);
 const m=mesh(p,geometry,x,y,z,black,'edges');
 if(!black){const contour=new THREE.Mesh(geometry,silhouette);contour.scale.set(1.025,1.008,1.025);m.add(contour);}
 return m;
}
function line(p, points, white=false) { const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(v=>new THREE.Vector3(...v))),white?whiteLine:lineMat);p.add(l);return l; }
function curve(p, points, radius=.012,black=true) { const path = new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))); return mesh(p,new THREE.TubeGeometry(path,32,radius,5,false),0,0,0,black); }
function rod(p,a,b,r=.025,black=true) { const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=cylinder(p,r,r,delta.length(),...av.clone().add(bv).multiplyScalar(.5).toArray(),black);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m; }
function ring(p,r,t,x,y,z,black=false) { return mesh(p,new THREE.TorusGeometry(r,t,8,40),x,y,z,black,'round'); }
function label(p,text,w,h,x,y,z,opts={}) {
 const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');ctx.fillStyle=opts.dark?'#171717':'#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=opts.dark?'#ffffff':'#171717';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${opts.italic?'italic ':''}${Math.floor(c.height*.52)}px ${opts.serif===false?'sans-serif':'Georgia'}`;ctx.fillText(text,c.width/2,c.height*.54,c.width*.92);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));m.position.set(x,y,z);p.add(m);return m;
}
function mug(p,x,y,z,s=1,world='home') {
 const g=group(p,x,y,z);g.scale.setScalar(s);cylinder(g,.17,.14,.28,0,.14,0);cylinder(g,.14,.14,.012,0,.286,0,true);const handle=ring(g,.1,.032,.19,.15,0);handle.scale.x=.8;
 const steam=group(g,0,.34,0);for(let i=0;i<3;i++) {const path=[];for(let j=0;j<18;j++)path.push([Math.sin(j*.45+i)*.035+(i-1)*.075,j*.033,0]);line(steam,path);}
 animations[world].push(t=>{steam.rotation.y=Math.sin(t*.4)*.45;steam.scale.y=.86+Math.sin(t*1.3)*.12;});return g;
}
function plant(p,x,y,z,size=1) {
 const g=group(p,x,y,z);g.scale.setScalar(size);cylinder(g,.35,.23,.52,0,.26,0);cylinder(g,.31,.31,.04,0,.52,0,true);ring(g,.34,.025,0,.52,0).rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){const a=i*2.4, h=.8+random()*.9;const ex=Math.sin(a)*(.3+random()*.4),ez=Math.cos(a)*.45;curve(g,[[0,.5,0],[ex*.25,h*.8,ez*.5],[ex,h,ez]],.012);const leaf=sphere(g,.14,.36,.035,ex,h,ez,true);leaf.rotation.set(.3,a,-ex);}
 for(let i=0;i<9;i++)line(g,[[Math.sin(i)*.27,.1,Math.cos(i)*.27],[Math.sin(i)*.32,.45,Math.cos(i)*.32]]);
}
function book(p,x,y,z,w=.45,d=.55,black=false) {box(p,w,.09,d,x,y,z,black);if(!black){for(let i=0;i<3;i++)line(p,[[x-w/2,y-.025+i*.02,z+d/2+.003],[x+w/2,y-.025+i*.02,z+d/2+.003]]);} }
function frame(p,x,y,z,w,h,text) {box(p,w,h,.08,x,y,z);box(p,w-.12,h-.12,.03,x,y,z+.055);if(text)label(p,text,w-.2,.25,x,y,z+.08,{italic:true});else{line(p,[[x-w*.3,y-h*.25,z+.08],[x-w*.1,y+h*.2,z+.08],[x+w*.1,y-h*.12,z+.08],[x+w*.3,y+h*.25,z+.08]]);ring(p,.12,.012,x+w*.16,y+h*.2,z+.08,true);} }

function makeHome() {
 const g=group(root);box(g,8,.18,6.4,0,-.15,0);
 for(let z=-3;z<3.2;z+=.38){line(g,[[-4,-.048,z],[4,-.048,z]]);for(let x=-3.6+(Math.floor(z*10)%2)*.8;x<4;x+=1.7)line(g,[[x,-.045,z],[x,-.045,z+.38]]);}
 // Enclose the room around a seated viewer; no miniature or cutaway edges.
 box(g,8,4.5,.12,0,2.18,-3.2);box(g,.12,4.5,6.4,-4,2.18,0);
 box(g,.12,4.5,6.4,4,2.18,0);box(g,8,4.5,.12,0,2.18,3.2);box(g,8,.12,6.4,0,4.5,0);
 box(g,7.9,.17,.12,0,.1,-3.08);box(g,.13,.17,6.2,-3.9,.1,0);
 // Rain-dark window, with sill, mullions and curtain folds.
 box(g,3.5,2.8,.14,-1.55,2.67,-3.06);box(g,3.22,2.53,.03,-1.55,2.67,-2.97,true);
 const rainGeometry=new THREE.BufferGeometry();const rainArray=new Float32Array(155*6);const drops=[];
 for(let i=0;i<155;i++)drops.push({x:-3.08+random()*3.06,y:1.48+random()*2.34,speed:.8+random()*1.7,length:.07+random()*.18});
 rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rain=new THREE.LineSegments(rainGeometry,whiteLine);g.add(rain);
 function drawRain(t){drops.forEach((d,i)=>{const y=1.47+((d.y-1.47-t*d.speed)%2.35+2.35)%2.35;rainArray.set([d.x,y,-2.942,d.x-.035-Math.sin(t*.32)*.009,Math.max(1.43,y-d.length),-2.942],i*6);});rainGeometry.attributes.position.needsUpdate=true;}
 drawRain(0);animations.home.push(drawRain);
 // Quiet rooftops beyond the rain, etched in white against the dark sky.
 for(let i=0;i<5;i++){const x=-3.02+i*.59,h=1.7+(i%3)*.18;line(g,[[x,1.43,-2.949],[x,h,-2.949],[x+.24,h+.15,-2.949],[x+.5,h,-2.949],[x+.5,1.43,-2.949]],true);for(let j=0;j<2;j++)line(g,[[x+.12+j*.23,1.53,-2.948],[x+.12+j*.23,1.65,-2.948]],true);}

 box(g,.07,2.55,.12,-1.55,2.67,-2.87);box(g,3.23,.07,.12,-1.55,2.67,-2.87);box(g,3.8,.13,.42,-1.55,1.22,-2.96);
 rod(g,[-3.58,4.22,-2.72],[.5,4.22,-2.72],.035);sphere(g,.07,.07,.07,-3.63,4.22,-2.72,true);sphere(g,.07,.07,.07,.55,4.22,-2.72,true);
 for(const side of [-3.4,.27]){for(let j=0;j<5;j++){const x=side+(j-2)*.09;const points=[];for(let k=0;k<=16;k++)points.push([x+Math.sin(k*.35)*.04,4.12-k*.18,-2.7+Math.sin(j*1.7)*.035]);curve(g,points,.038,false);} }
 // Little shelves and their well-loved objects.
 for(const y of [2.2,3.35]){box(g,2.3,.1,.5,2.28,y,-2.86);rod(g,[1.6,y-.3,-3.08],[1.6,y-.04,-2.65],.016);rod(g,[3,y-.3,-3.08],[3,y-.04,-2.65],.016);}
 for(let i=0;i<8;i++){const h=.35+random()*.3;const b=box(g,.13,h,.29,1.4+i*.16,3.4+h/2,-2.85,i===3||i===6);b.rotation.z=i===7?-.16:0;}
 frame(g,2.95,3.77,-2.96,.48,.65);cylinder(g,.13,.17,.42,2.9,2.46,-2.84);sphere(g,.17,.19,.17,2.9,2.5,-2.84);rod(g,[2.9,2.65,-2.84],[2.82,3.02,-2.84],.012);sphere(g,.13,.07,.02,2.81,2.99,-2.84,true);
 book(g,1.67,2.31,-2.83,.65,.35);book(g,1.7,2.4,-2.83,.56,.32,true);
 // Rug: a woven ellipse with individual ink threads.
 const rug=cylinder(g,1,1,.018,.05,-.035,1.35);rug.scale.set(2.6,1,1.42);
 for(let z=-1.25;z<1.25;z+=.105){const span=Math.sqrt(1-(z/1.4)**2)*2.5;line(g,[[-span+.05,-.02,1.35+z],[span+.05,-.02,1.35+z]]);}
 // Generously upholstered armchair, drawn with piping and a draped blanket.
 const chair=group(g,-1.25,0,1.35);chair.rotation.y=Math.PI;
 for(const x of [-.64,.64])for(const z of [-.65,.65]){const leg=box(chair,.12,.46,.12,x,.23,z,true);leg.rotation.z=x*.1;}
 roundBox(chair,1.65,.42,1.65,0,.57,0,.14);roundBox(chair,1.65,1.35,.4,0,1.33,-.65,.18);roundBox(chair,1.25,.28,1.35,0,.86,.12,.12);
 for(const x of [-.76,.76])roundBox(chair,.34,.71,1.6,x,1.01,.05,.15);
 const pillow=roundBox(chair,.86,.65,.23,0,1.38,-.33,.12);pillow.rotation.z=-.13;pillow.rotation.x=-.15;
 line(chair,[[-.32,1.12,-.19],[-.38,1.53,-.19],[.32,1.61,-.19],[.4,1.17,-.19]]);
 const blanket=group(chair,.48,0,.4);box(blanket,.56,.035,.7,0,1.39,0);box(blanket,.56,.82,.035,0,.98,.36);for(let i=0;i<7;i++){const x=-.25+i*.08;line(blanket,[[x,1.412,-.34],[x,1.412,.38],[x,.56,.38]]);rod(blanket,[x,.57,.38],[x+.018,.46,.38],.009);}
 // Reading light and a small side table.
 cylinder(g,.38,.43,.07,-2.94,.04,-.45,true);rod(g,[-2.94,.1,-.45],[-2.94,2.77,-.45],.025);cylinder(g,.35,.65,.69,-2.94,2.86,-.45);ring(g,.65,.015,-2.94,2.515,-.45,true).rotation.x=Math.PI/2;rod(g,[-2.7,2.5,-.45],[-2.7,2.18,-.45],.007);
 const table=group(g,-.4,0,-.65);cylinder(table,.82,.82,.1,0,1.02,0);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(table,[Math.sin(a)*.36,.95,Math.cos(a)*.36],[Math.sin(a)*.64,.03,Math.cos(a)*.64],.045);}
 book(table,-.24,1.12,.16,.65,.48);
 const cover=group(table,-.24,1.168,.16);cover.rotation.x=-Math.PI/2;label(cover,'a quiet life',.47,.12,0,0,.002,{italic:true});
 const saucer=cylinder(table,.27,.24,.035,.27,1.1,-.15);mug(table,.27,1.12,-.15,1.05);
 plant(g,2.94,0,-1.92,1.17);
 // A curled-up cat, perfectly occupied with doing nothing.
 const cat=group(g,-2.5,.16,-1.3);cat.rotation.y=Math.PI;sphere(cat,.48,.19,.32,0,0,0);sphere(cat,.22,.2,.2,.3,.06,.04);const ear1=mesh(cat,new THREE.ConeGeometry(.095,.19,3),.21,.25,.04);const ear2=mesh(cat,new THREE.ConeGeometry(.095,.19,3),.4,.25,.04);ear1.rotation.z=.18;ear2.rotation.z=-.2;
 curve(cat,[[.3,-.01,.21],[0,-.06,.31],[-.4,-.01,.21],[-.43,.05,-.08]],.055);
 line(cat,[[.26,.075,.231],[.3,.06,.24],[.34,.075,.231]]);for(let i=0;i<3;i++)line(cat,[[.36,.04,.22],[.55,.04+i*.04,.23]]);
 for(let i=0;i<5;i++)curve(cat,[[-.22+i*.09,.17,-.1],[-.25+i*.09,.19,.01],[-.24+i*.09,.17,.1]],.009);
 animations.home.push(t=>{cat.scale.y=1+Math.sin(t*1.1)*.018;});
 // A picture on the side wall.
 const picture=group(g,-3.91,2.5,.55);picture.rotation.y=Math.PI/2;frame(picture,0,0,0,1.13,1.4);label(picture,'STAY',.7,.22,0,-.43,.082,{serif:false});
 return g;
}

function bistroChair(p,x,z,rotation=0) {
 const c=group(p,x,0,z);c.rotation.y=rotation;
 for(const xx of [-.25,.25]){rod(c,[xx,.65,.25],[xx*1.45,.03,.34],.025);rod(c,[xx,.65,-.23],[xx*1.35,.03,-.34],.025);}
 const seat=cylinder(c,.32,.32,.07,0,.68,0);seat.scale.z=.88;
 curve(c,[[-.27,.68,-.22],[-.29,1.1,-.27],[-.19,1.36,-.3],[.19,1.36,-.3],[.29,1.1,-.27],[.27,.68,-.22]],.028);
 for(let i=-2;i<=2;i++)rod(c,[i*.09,.9,-.27],[i*.09,1.24,-.29],.012);
 for(let i=0;i<4;i++)line(c,[[-.24,.95+i*.07,-.3],[.24,.95+i*.07,-.3]]);
 return c;
}
function cafeTable(p,x,z) {const t=group(p,x,0,z);cylinder(t,.62,.62,.07,0,1.04,0);cylinder(t,.045,.065,.98,0,.52,0,true);for(let i=0;i<3;i++){const a=i*2.094;curve(t,[[0,.3,0],[Math.sin(a)*.22,.08,Math.cos(a)*.22],[Math.sin(a)*.4,.04,Math.cos(a)*.4]],.03);}return t;}
function makeParis() {
 const g=group(root);box(g,8.6,.23,6.5,0,-.18,0);
 for(let z=-3.1;z<3.2;z+=.4){line(g,[[-4.3,-.055,z],[4.3,-.055,z]]);for(let x=-4.3+(Math.round(z*10)%2)*.35;x<4.3;x+=.75)line(g,[[x,-.055,z],[x,-.055,z+.4]]);}
 box(g,8.6,.14,.22,0,-.06,3.15);box(g,7.5,5,.35,0,2.43,-2.65);
 // Stone courses on the Parisian facade.
 for(let y=.4;y<4.95;y+=.38){line(g,[[-3.73,y,-2.467],[3.73,y,-2.467]]);for(let x=-3.5+(Math.round(y*10)%2)*.45;x<3.7;x+=.9)line(g,[[x,y,-2.466],[x,y+.38,-2.466]]);}
 box(g,7.8,.16,.52,0,4.94,-2.6);box(g,7.6,.13,.4,0,3.48,-2.53);
 // Tall dark shop windows and a glazed door.
 for(const x of [-2.4,2.4]){box(g,2.05,2.48,.12,x,1.38,-2.39);box(g,1.87,2.28,.03,x,1.38,-2.31,true);box(g,.045,2.28,.07,x,1.38,-2.27);box(g,1.87,.045,.07,x,1.1,-2.27);for(let i=0;i<5;i++)line(g,[[x-.8+i*.35,1.32,-2.265],[x-.35+i*.35,1.77,-2.265]],true);}
 box(g,1.65,2.85,.12,0,1.47,-2.38);box(g,1.4,2.62,.03,0,1.47,-2.3,true);box(g,.06,2.62,.07,0,1.47,-2.25);box(g,1.4,.08,.07,0,.72,-2.25);rod(g,[.24,1.1,-2.17],[.24,1.4,-2.17],.022,false);
 label(g,'CAFÉ DES PETITS RIENS',6.75,.42,0,3.13,-2.23,{dark:true});
 // Upstairs windows and wrought iron balconies.
 for(const x of [-2.45,0,2.45]){box(g,1.25,1.12,.09,x,4.2,-2.38);box(g,1.07,.95,.04,x,4.2,-2.31,true);box(g,.05,.95,.06,x,4.2,-2.27);box(g,1.08,.045,.06,x,4.2,-2.27);box(g,1.5,.1,.58,x,3.65,-2.2);rod(g,[x-.7,4.03,-1.94],[x+.7,4.03,-1.94],.02);for(let i=0;i<8;i++)rod(g,[x-.63+i*.18,3.71,-1.94],[x-.63+i*.18,4.03,-1.94],.014);}
 // Canvas awning: alternating pure black and pure white stripes.
 const awning=group(g,0,2.93,-.85);awning.rotation.x=.16;const width=7.65/23;
 for(let i=0;i<23;i++){const x=-3.825+width/2+i*width;box(awning,width,.055,1.65,x,0,0,i%2===0);box(awning,width,.25,.04,x,-.15,.79,i%2===0);const scallop=cylinder(awning,width/2,width/2,.04,x,-.27,.79,i%2===0);scallop.rotation.x=Math.PI/2;scallop.scale.y=1;scallop.scale.z=.55;}
 for(const x of [-3.6,3.6])rod(g,[x,2.7,-2.35],[x,2.63,-.8],.025);
 const table=cafeTable(g,-.65,.95);cylinder(table,.24,.24,.025,.1,1.1,.04);mug(table,.1,1.13,.04,.83,'paris');
 // Folded newspaper and a croissant, waiting patiently.
 const news=box(table,.49,.015,.4,-.24,1.095,-.15);news.rotation.y=-.24;const newspaper=group(table,-.24,1.107,-.15);newspaper.rotation.set(-Math.PI/2,0,Math.PI-.24);label(newspaper,'LE MONDE',.43,.08,0,.13,.002,{serif:true});for(let i=0;i<5;i++){line(newspaper,[[-.19,.05-i*.04,.002],[-.025,.05-i*.04,.002]]);line(newspaper,[[.015,.05-i*.04,.002],[.19,.05-i*.04,.002]]);}
 const plate=cylinder(table,.2,.2,.025,.22,1.105,-.25);const pastry=mesh(table,new THREE.TorusGeometry(.1,.045,7,18,Math.PI*1.5),.22,1.15,-.25,false,'round');pastry.rotation.x=-Math.PI/2;
 bistroChair(g,-1.48,1.12,Math.PI/2);bistroChair(g,.18,1.12,-Math.PI/2);
 const table2=cafeTable(g,2.25,.18);mug(table2,-.16,1.1,0,.8,'paris');cylinder(table2,.07,.09,.2,.15,1.18,-.12);rod(table2,[.15,1.25,-.12],[.15,1.6,-.12],.008);sphere(table2,.08,.06,.04,.15,1.6,-.12);bistroChair(g,2.98,.44,-Math.PI/2);bistroChair(g,1.63,-.12,Math.PI/2);
 // A hand-lettered pavement menu.
 const menu=group(g,-2.7,0,.32);menu.rotation.y=.12;const board=box(menu,.76,1.12,.07,0,.78,0);board.rotation.x=-.11;const face=box(menu,.66,.95,.012,0,.79,.071,true);face.rotation.x=-.11;
 for(const x of [-.33,.33]){rod(menu,[x,1.38,-.07],[x,.02,.24],.035);rod(menu,[x,1.38,-.07],[x,.02,-.5],.035);}
 label(menu,'bonjour',.58,.2,0,1.1,.116,{dark:true,italic:true});label(menu,'CAFÉ',.46,.13,0,.84,.09,{dark:true});label(menu,'& croissant',.54,.11,0,.65,.07,{dark:true,italic:true});line(menu,[[-.22,.46,.04],[.22,.46,.04]],true);
 plant(g,3.5,0,-1.37,.77);plant(g,-3.5,0,-1.45,.72);
 // The old street lamp and enamel street sign.
 const lamp=group(g,3.62,0,2.12);cylinder(lamp,.18,.27,.2,0,.1,0,true);cylinder(lamp,.07,.12,3.3,0,1.8,0,true);sphere(lamp,.13,.12,.13,0,3.39,0,true);cylinder(lamp,.26,.16,.55,0,3.8,0);for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;rod(lamp,[Math.sin(a)*.16,3.52,Math.cos(a)*.16],[Math.sin(a)*.26,4.08,Math.cos(a)*.26],.02);}mesh(lamp,new THREE.ConeGeometry(.39,.21,4),0,4.18,0,true);sphere(lamp,.06,.12,.06,0,4.36,0,true);
 box(g,1.1,.4,.04,3.01,3.37,-2.2,true);label(g,'RUE DU BONHEUR',.97,.24,3.01,3.37,-2.17,{dark:true,serif:false});
 // A few windblown leaves and a tiny street pigeon.
 const pigeon=group(g,1.02,.18,2.55);sphere(pigeon,.16,.16,.24,0,0,0);sphere(pigeon,.105,.12,.1,0,.2,-.14);sphere(pigeon,.017,.017,.017,.09,.23,-.18,true);rod(pigeon,[0,.19,-.23],[0,.17,-.34],.025,true);for(const x of [-.06,.06])rod(pigeon,[x,-.1,0],[x,-.18,.03],.012);sphere(pigeon,.025,.11,.17,.15,.01,.06,true);
 animations.paris.push(t=>{pigeon.rotation.y=.4+Math.sin(t*.28)*.2;});
 // The view FROM the terrace: boulevard, trees, and the buildings opposite.
 box(g,70,.12,50,0,-.26,12);
 box(g,60,.15,4,0,-.13,10);
 for(const z of [3.4,8.1,8.3])line(g,[[-30,-.04,z],[30,-.04,z]]);
 for(let x=-25;x<26;x+=.7){line(g,[[x,-.047,8.4],[x,-.047,11.6]]);}
 for(let z=8.5;z<11.7;z+=.55)line(g,[[-30,-.045,z],[30,-.045,z]]);
 // Repeated Haussmann facades at real street scale, facing the seated viewer.
 const names=['LIBRAIRIE','FLEURISTE','BOULANGERIE','ATELIER','MAISON'];
 for(let b=-2;b<=2;b++){
  const facade=group(g,b*7.2,0,12.3);facade.rotation.y=Math.PI;
  const height=8.6+(b%2)*.5;
  box(facade,7.2,height,1,0,height/2,0);
  for(let y=.5;y<height;y+=.43)line(facade,[[-3.59,y,.506],[3.59,y,.506]]);
  box(facade,7.35,.18,1.2,0,height,.1);
  const roof=mesh(facade,new THREE.CylinderGeometry(2.5,3.8,1.2,4),0,height+.65,0,true);roof.rotation.y=Math.PI/4;roof.scale.z=.48;
  for(const x of [-2.2,0,2.2]){
   box(facade,1.7,2.2,.12,x,1.2,.57,true);
   box(facade,.055,2.12,.07,x,1.2,.65);box(facade,1.7,.07,.07,x,.55,.65);
   for(const y of [3.6,5.8,7.8]){
    if(y+1>height)continue;
    box(facade,1.35,1.65,.12,x,y,.59);box(facade,1.16,1.48,.03,x,y,.67,true);
    box(facade,.05,1.47,.04,x,y,.7);box(facade,1.16,.045,.04,x,y+.2,.7);
    box(facade,1.65,.12,.65,x,y-.86,.79);
    for(let n=0;n<8;n++)rod(facade,[x-.72+n*.205,y-.8,1.1],[x-.72+n*.205,y-.24,1.1],.015);
    rod(facade,[x-.78,y-.23,1.1],[x+.78,y-.23,1.1],.025);
   }
  }
  label(facade,names[b+2],5.9,.4,0,2.57,.66,{dark:true});
  for(let n=0;n<17;n++){const a=group(facade,-3.4+n*.4,2.43,1);a.rotation.x=.18;box(a,.4,.045,1,0,0,0,n%2===0);box(a,.4,.18,.035,0,-.1,.48,n%2===0);}
  box(facade,.22,1.2,.3,-2,height+1.3,0,true);
 }
 // Plane trees frame the street without obscuring the view.
 for(const x of [-4.6,5.8]){
  const tree=group(g,x,0,6.9);cylinder(tree,.13,.23,3.6,0,1.8,0);
  animations.paris.push(t=>{tree.rotation.z=Math.sin(t*.38+x)*.008;});
  for(let i=0;i<7;i++){const a=i*2.4,ex=Math.sin(a)*.95,ez=Math.cos(a)*.6;rod(tree,[0,2.1,0],[ex,3.5,ez],.055);sphere(tree,.8,.65,.65,ex,3.55+random()*.7,ez,i%3===0);}
  for(let i=0;i<7;i++)line(tree,[[-.1+i*.03,.1,.2],[-.08+i*.027,2.5,.14]]);
 }
 // A bicycle resting against the far pavement railing.
 const bike=group(g,-3.2,0,8.6);for(const x of [-.58,.58])ring(bike,.38,.024,x,.42,0,true);
 for(const [a,b]of [[[-.58,.42,0],[-.2,.95,0]],[[-.2,.95,0],[.25,.43,0]],[[.25,.43,0],[-.58,.42,0]],[[-.2,.95,0],[.4,.98,0]],[[.4,.98,0],[.25,.43,0]],[[.4,.98,0],[.58,.42,0]]])rod(bike,a,b,.022);
 rod(bike,[-.3,1.02,0],[-.05,1.02,0],.035);rod(bike,[.4,.98,0],[.35,1.2,0],.02);rod(bike,[.35,1.2,0],[.55,1.2,0],.02);
 // A reader on the opposite pavement, with an unhurried companion.
 for(const [x,z]of [[1.1,9.1],[1.7,9.35]]){const person=group(g,x,0,z);sphere(person,.12,.15,.12,0,1.64,0);cylinder(person,.17,.23,.64,0,1.17,0,true);rod(person,[-.1,.88,0],[-.14,.05,.06],.055,true);rod(person,[.1,.88,0],[.18,.05,-.06],.055,true);curve(person,[[-.16,1.42,0],[-.28,1.1,-.1],[0,1.2,-.22]],.045);}

 return g;
}
const additionalScenes=createAdditionalScenes({root,animations,group,box,roundBox,sphere,cylinder,line,curve,rod,ring,label,mug,plant,book,random});
const sceneDefinitions={
 home:{make:makeHome,title:'A rainy afternoon',subtitle:'At home, with something warm.',place:'40°43′ N   73°59′ W',caption:'RAIN ON THE WINDOWS. NOWHERE TO GO.',moment:'The lovely art of staying in.',description:'Seated at home, looking past your warm drink toward the rainy window.',eye:[-1.25,1.85,1.05],yaw:.12,pitch:-.17,mood:0},
 paris:{make:makeParis,title:'A table in Paris',subtitle:'A coffee. A corner. All the time.',place:'48°51′ N   2°20′ E',caption:'ONE MORE COFFEE. THE WORLD CAN WAIT.',moment:'A little time, à la terrasse.',description:'Seated at a Paris café table, looking out across the boulevard.',eye:[-.65,1.72,-.35],yaw:Math.PI,pitch:-.16,mood:1},
 ...additionalScenes,
};
// Create each world once, only when first visited; inactive scenes never animate.
const referenceStudies=createReferenceScenes({root,paper,ink,animations,group,box,roundBox,sphere,cylinder,line,curve,rod,ring,label,mug,book,random});
let studyEnabled=true;
const studyWorlds={home:referenceStudies.home.make()};
const worlds={};
const views=Object.fromEntries(Object.entries(sceneDefinitions).map(([key,d])=>[key,{eye:new THREE.Vector3(...d.eye),yaw:d.yaw,pitch:d.pitch}]));
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
function resize(){const rect=canvas.getBoundingClientRect();viewWidth=rect.width;viewHeight=rect.height;renderer.setSize(viewWidth,viewHeight,false);camera.aspect=viewWidth/viewHeight;camera.fov=camera.aspect<1.2?77:64;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas.parentElement);resize();
function clampGaze(){targetYaw=THREE.MathUtils.clamp(targetYaw,-.78,.78);targetPitch=THREE.MathUtils.clamp(targetPitch,-.4,.43);}
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;pointerX=pointerY=0;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(dragging){targetYaw-=(e.clientX-lastX)*.0025;targetPitch+=(e.clientY-lastY)*.0025;clampGaze();lastX=e.clientX;lastY=e.clientY;}else if(e.pointerType!=='touch'){const r=canvas.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;}});
function release(){dragging=false;}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
function reset(immediate=false){targetYaw=targetPitch=pointerX=pointerY=0;if(immediate){yaw=pitch=0;}dragging=false;}
document.querySelector('#reset-view').addEventListener('click',()=>reset());
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();if(e.key==='ArrowLeft')targetYaw-=.08;if(e.key==='ArrowRight')targetYaw+=.08;if(e.key==='ArrowUp')targetPitch+=.06;if(e.key==='ArrowDown')targetPitch-=.06;clampGaze();});
const studySwitch=document.querySelector('#study-switch');
const referenceDialog=document.querySelector('#reference-dialog');
function applyLook(){
 const study=studyEnabled&&referenceStudies[activeScene];
 if(study&&!studyWorlds[activeScene])studyWorlds[activeScene]=study.make();
 if(!study&&!worlds[activeScene])worlds[activeScene]=sceneDefinitions[activeScene].make();
 for(const [key,g]of Object.entries(worlds))g.visible=key===activeScene&&!study;
 for(const [key,g]of Object.entries(studyWorlds))g.visible=key===activeScene&&!!study;
 paper.userData.mood.value=sceneDefinitions[activeScene].mood;
 referenceStudies.setMood(activeScene);
 studySwitch.hidden=!referenceStudies[activeScene];
 document.querySelector('#study-new').setAttribute('aria-pressed',studyEnabled);
 document.querySelector('#study-earlier').setAttribute('aria-pressed',!studyEnabled);
 reset(true);
}
function selectScene(key){
 if(!sceneDefinitions[key])return;
 activeScene=key;const definition=sceneDefinitions[key];applyLook();
 history.replaceState(null,'','?scene='+key);
 document.querySelector('.edition-link').href=import.meta.env.BASE_URL+'illustrated/?scene='+(referenceStudies[key]?key:'home');
 for(const button of sceneList.querySelectorAll('[data-scene]')){const selected=button.dataset.scene===key;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected);}
 document.querySelector('#scene-coordinate').textContent=definition.place;
 document.querySelector('#scene-weather').textContent=definition.caption;
 document.querySelector('#moment-title').textContent=definition.moment;
 document.querySelector('#moment-index').textContent='FIG. '+String(Object.keys(sceneDefinitions).indexOf(key)+1).padStart(2,'0');
 canvas.setAttribute('aria-label',definition.description+' Drag or use arrow keys to look around.');
 sound.setScene(key);
 if(matchMedia('(max-width: 700px)').matches)canvas.parentElement.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
}
sceneList.addEventListener('click',event=>{const button=event.target.closest('[data-scene]');if(button)selectScene(button.dataset.scene);});
document.querySelector('#study-new').addEventListener('click',()=>{studyEnabled=true;applyLook();});
document.querySelector('#study-earlier').addEventListener('click',()=>{studyEnabled=false;applyLook();});
document.querySelector('#show-reference').addEventListener('click',()=>{
 const study=referenceStudies[activeScene];if(!study)return;
 document.querySelector('#reference-title').textContent=sceneDefinitions[activeScene].title;
 document.querySelector('#reference-image').src=import.meta.env.BASE_URL+study.reference;
 document.querySelector('#reference-image').alt='Generated ink reference for '+sceneDefinitions[activeScene].title.toLowerCase();referenceDialog.showModal();
});
referenceDialog.querySelector('.close-dialog').addEventListener('click',()=>referenceDialog.close());
referenceDialog.addEventListener('click',event=>{if(event.target===referenceDialog){const r=referenceDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)referenceDialog.close();}});

// All ambience is synthesized locally. No audio files or requests are needed.
const sound=new Ambience();
document.querySelector('#sound-toggle').addEventListener('click',async()=>{try{const enabled=await sound.toggle(activeScene);document.body.classList.toggle('sound-on',enabled);document.querySelector('#sound-toggle').setAttribute('aria-pressed',enabled);document.querySelector('#sound-label').textContent=enabled?'A little atmosphere':'Sound is off';document.querySelector('.sound-state').textContent=enabled?'ON':'OFF';document.querySelector('#volume').hidden=!enabled;}catch{document.querySelector('#sound-label').textContent='Sound unavailable';}});
document.querySelector('#volume').addEventListener('input',e=>sound.setVolume(Number(e.target.value)/100));
document.addEventListener('visibilitychange',()=>{if(!sound.ctx)return;if(document.hidden)sound.ctx.suspend();else if(sound.enabled)sound.ctx.resume();});
const about=document.querySelector('#about');document.querySelector('#about-button').addEventListener('click',()=>about.showModal());about.querySelector('.close-dialog').addEventListener('click',()=>about.close());about.addEventListener('click',e=>{if(e.target===about){const r=about.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)about.close();}});
const clock=new THREE.Clock();
function render(){
 requestAnimationFrame(render);if(document.hidden)return;
 const elapsed=clock.getElapsedTime();
 const px=reducedMotion?0:pointerX*.22,py=reducedMotion?0:-pointerY*.14;
 const smoothing=reducedMotion?1:.065;
 yaw+=(targetYaw+px-yaw)*smoothing;pitch+=(targetPitch+py-pitch)*smoothing;
 const study=studyEnabled&&referenceStudies[activeScene];
 const view=study||views[activeScene],heading=view.yaw+yaw,elevation=view.pitch+pitch;
 if(study)camera.position.fromArray(view.eye);else camera.position.copy(view.eye);
 cameraTarget.set(Math.sin(heading)*Math.cos(elevation),Math.sin(elevation),-Math.cos(heading)*Math.cos(elevation)).add(camera.position);
 camera.lookAt(cameraTarget);
 if(!reducedMotion)for(const fn of animations[study?study.animation:activeScene])fn(elapsed);
 renderer.render(scene,camera);
}
render();document.querySelector('#loading').classList.add('loaded');

const requestedScene=new URLSearchParams(location.search).get('scene');if(requestedScene&&sceneDefinitions[requestedScene])selectScene(requestedScene);
