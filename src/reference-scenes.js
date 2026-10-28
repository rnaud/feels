import * as THREE from 'three';
import { createHatchedPaper } from './ink.js';

// These studies reinterpret the generated references as geometry, not image planes.
export function createReferenceScenes(api) {
  const { root, paper, ink, animations, group, box, roundBox, sphere, cylinder, line, curve, rod, ring, label, mug, book, random } = api;
  const clean = new THREE.MeshBasicMaterial({color:0xffffff});
  const studyPaper=createHatchedPaper(0x171717);
  const compile=studyPaper.onBeforeCompile;
  studyPaper.onBeforeCompile=shader=>{
    compile(shader);
    shader.fragmentShader=shader.fragmentShader
      .replace('smoothstep(0.61, 0.69, light)','smoothstep(0.36, 0.47, light)')
      .replace('smoothstep(0.31, 0.39, light)','smoothstep(0.24, 0.29, light)')
      .replace('* 21.0 + irregularity, 0.042','* 29.0 + irregularity, 0.028')
      .replace('diffuseColor.rgb = mix(diffuseColor.rgb, inkColor, hatch);',`hatch *= smoothstep(-0.8, -0.3, sin(surface.x * 31.0 + surface.y * 12.0 + sin(surface.y * 23.0))); diffuseColor.rgb = mix(diffuseColor.rgb, inkColor, hatch);`);
  };
  studyPaper.customProgramCacheKey=()=> 'reference-study-paper-v1';
  function finish(g){g.traverse(o=>{if(o.isMesh&&o.material===paper)o.material=studyPaper;});return g;}
  function inkPatch(g,points,y){const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),ink);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;g.add(mesh);return mesh;}
  function woodFloor(g,w=9,d=9){box(g,w,.15,d,0,-.1,0);for(let x=-w/2;x<w/2;x+=.45){line(g,[[x,-.02,-d/2],[x+.015,-.02,d/2]]);for(let z=-4;z<4;z+=1.7)line(g,[[x,-.018,z+(x%1)],[x+.45,-.018,z+(x%1)]]);}}
  function foliage(g,x,y,z,size=1,seed=1){
    const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,4),ink,95);const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3();
    for(let i=0;i<95;i++){const a=i*2.399+seed,r=Math.sqrt((i+.5)/95)*size;pos.set(x+Math.sin(a)*r,y+Math.cos(a*.7)*r*.65,z+Math.cos(a)*r*.6);q.setFromEuler(new THREE.Euler(Math.sin(a),a,Math.sin(i)*.7));scale.set(.08+random()*.09,.025,.16+random()*.1);matrix.compose(pos,q,scale);leaves.setMatrixAt(i,matrix);}g.add(leaves);return leaves;
  }
  function trailingPlant(g,x,y,z){cylinder(g,.21,.15,.32,x,y,z);for(let i=0;i<4;i++){const pts=[];for(let j=0;j<10;j++)pts.push([x+Math.sin(j*.6+i)*.2,y+.08-j*.12,z+.04+i*.04]);curve(g,pts,.009);for(let j=1;j<9;j+=2){const p=pts[j];const leaf=sphere(g,.09,.15,.022,p[0],p[1],p[2],true);leaf.rotation.z=Math.sin(j+i)*.6;}}}
  function speckleCup(cup){const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(1,4,3),ink,80),m=new THREE.Matrix4();for(let i=0;i<80;i++){const a=random()*Math.PI*2,y=.025+random()*.23,r=.144+y*.105;m.makeScale(.003,.0025+random()*.002,.003);m.setPosition(Math.sin(a)*r,y,Math.cos(a)*r);dots.setMatrixAt(i,m);}cup.add(dots);}
  function home(){
    const g=group(root);woodFloor(g);studyPaper.userData.mood.value=.12;
    // The large opening is real: rooftops beyond it move with your perspective.
    box(g,.8,4.5,.16,-4.1,2.2,-3.3);box(g,3.4,4.5,.16,2.8,2.2,-3.3);box(g,4.8,.8,.16,-1.3,.35,-3.3);box(g,4.8,.75,.16,-1.3,4.15,-3.3);
    box(g,.15,4.5,9,-4.5,2.2,0);box(g,.15,4.5,9,4.5,2.2,0);box(g,9,.15,9,0,4.5,0);
    for(const x of [-3.7,1.1])box(g,.17,3.12,.18,x,2.28,-3.12,true);
    for(const y of [.76,3.81])box(g,4.95,.14,.18,-1.3,y,-3.12,true);
    box(g,.1,3.04,.12,-1.6,2.27,-3.08,true);for(const x of [-3.61,-1.55,1.01])line(g,[[x,.83,-2.99],[x,3.73,-2.99]],true);line(g,[[-3.6,2.32,-2.99],[1.01,2.32,-2.99]],true);box(g,4.75,.09,.12,-1.3,2.37,-3.08,true);box(g,5.12,.13,.55,-1.3,.67,-3.05);
    for(const x of [1.32,1.4,3.9,4])line(g,[[x,.08,-3.205],[x,4.4,-3.205]]);
    box(g,80,35,.1,0,7,-32,true);
    // Black roofs, lit windows, chimneys and dormers form a layered skyline.
    for(let i=0;i<12;i++){
      const x=-13+i*2.45,z=-9-(i%3)*4,top=.6+(i%4)*.42;
      box(g,2.5,6,2.8,x,top-3,z,true);
      const roofShape=new THREE.Shape();roofShape.moveTo(-1.36,0);roofShape.lineTo(-.85,.7);roofShape.lineTo(.85,.7);roofShape.lineTo(1.36,0);roofShape.closePath();
      const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:2.9,bevelEnabled:false});const roof=new THREE.Mesh(roofGeometry,ink);roof.position.set(x,top,z-1.45);g.add(roof);
      line(g,[[x-1.36,top,z+1.46],[x-.85,top+.7,z+1.46],[x+.85,top+.7,z+1.46],[x+1.36,top,z+1.46]],true);
      for(let j=0;j<3;j++){box(g,.18,.65,.2,x-.85+j*.6,top+.85,z-.5,true);for(let row=0;row<2;row++){box(g,.32,.48,.025,x-.8+j*.75,top-.8-row*.95,z+1.42);box(g,.035,.5,.04,x-.8+j*.75,top-.8-row*.95,z+1.45,true);}}
      for(let j=0;j<12;j++)line(g,[[x-1.1+j*.2,top+.03,z+1.47],[x-.75+j*.14,top+.64,z+1.47]],true);
    }
    box(g,.36,5,.4,-.4,1,-22,true);const spire=new THREE.Mesh(new THREE.ConeGeometry(.5,2.2,5),ink);spire.position.set(-.4,4.6,-22);g.add(spire);
    const rain=new THREE.BufferGeometry(),data=new Float32Array(170*6),drops=[];for(let i=0;i<170;i++)drops.push({x:-3.58+random()*4.56,y:random(),speed:.1+random()*.2});rain.setAttribute('position',new THREE.BufferAttribute(data,3));g.add(new THREE.LineSegments(rain,new THREE.LineBasicMaterial({color:0xffffff})));
    const update=t=>{drops.forEach((d,i)=>{const y=.85+((d.y-t*d.speed)%1+1)%1*2.85;data.set([d.x,y,-3.02,d.x-.01,Math.max(.85,y-.07),-3.02],i*6);});rain.attributes.position.needsUpdate=true;};update(0);animations.homeStudy.push(update);
    // A large, quiet foreground; the table and lamp are deliberately asymmetrical.
    const table=group(g,1.04,0,-.45);cylinder(table,.89,.89,.09,0,1.0,0);cylinder(table,.065,.09,.94,0,.49,0,true);for(const a of [0,2.1,4.2])curve(table,[[0,.35,0],[Math.sin(a)*.3,.06,Math.cos(a)*.3],[Math.sin(a)*.65,.04,Math.cos(a)*.65]],.032);
    cylinder(table,.27,.25,.025,-.28,1.065,-.1,true);const cup=mug(table,-.28,1.08,-.1,1.15,'homeStudy');speckleCup(cup);book(table,.29,1.12,.25,.7,.5);book(table,.31,1.21,.25,.66,.48);
    cylinder(table,.18,.22,.035,.48,1.065,-.32,true);curve(table,[[.48,1.08,-.32],[.48,2.18,-.32],[.38,2.45,-.32],[.04,2.5,-.32],[-.14,2.32,-.32]],.025);
    const shade=new THREE.Mesh(new THREE.LatheGeometry([[.39,0],[.38,.04],[.34,.14],[.26,.26],[.16,.33],[.09,.35]].map(p=>new THREE.Vector2(...p)),32),ink);shade.position.set(-.14,2.014,-.32);table.add(shade);const inner=cylinder(table,.38,.38,.012,-.14,2.014,-.32);inner.material=clean;
    // A curled cat on a knitted throw rather than an isolated shape on the floor.
    const chair=group(g,-1.25,0,-1.15);roundBox(chair,1.55,.3,1.5,0,.55,0,.14);roundBox(chair,.26,1.0,1.5,-.7,.9,0,.1);roundBox(chair,1.55,1.15,.23,0,1.05,-.65,.1);roundBox(chair,1.25,.13,1.13,.05,.78,.06,.05);
    for(let j=0;j<13;j++){const x=-.5+j*.085;curve(chair,[[x,.86,-.45],[x+.02,.87,.17],[x,.82,.6],[x+.035,.38,.74]],.012);}
    const cat=group(chair,0,.94,.12);sphere(cat,.47,.2,.31,0,0,0,true);sphere(cat,.2,.17,.17,.3,-.02,.13,true);for(const x of [.22,.4]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.07,.16,3),ink);ear.position.set(x,.17,.12);cat.add(ear);}curve(cat,[[.3,-.02,.3],[0,-.08,.35],[-.45,.01,.18],[-.4,.11,-.11]],.05);
    for(let i=0;i<10;i++)line(cat,[[-.27+i*.045,.18,.04],[-.3+i*.045,.12,.23]],true);animations.homeStudy.push(t=>{cat.scale.y=1+Math.sin(t*.9)*.017;});
    // Tall books and climbing foliage frame the right side of the illustration.
    const shelves=group(g,3.05,0,-2.68);box(shelves,1.55,4.3,.1,0,2.1,-.2,true);for(let row=0;row<5;row++){const y=.4+row*.75;box(shelves,1.65,.09,.5,0,y,0);for(let j=0;j<8;j++){const h=.32+random()*.3;box(shelves,.12,h,.27,-.67+j*.18,y+.05+h/2,0,j%4===0);}}
    trailingPlant(g,2.6,3.8,-2.33);trailingPlant(g,-3.35,3.4,-2.95);
    return finish(g);
  }
  function wovenChair(g,x,z,angle){const c=group(g,x,0,z);c.rotation.y=angle;for(const xx of [-.3,.3])for(const zz of [-.25,.25])rod(c,[xx,.64,zz],[xx*1.2,.02,zz*1.3],.025);cylinder(c,.37,.37,.045,0,.69,0);curve(c,[[-.34,.7,-.25],[-.36,1.25,-.3],[-.25,1.47,-.31],[.25,1.47,-.31],[.36,1.25,-.3],[.34,.7,-.25]],.028);for(let row=0;row<8;row++)for(let col=0;col<9;col++){const x=-.28+col*.07,y=.87+row*.065;box(c,.063,.027,.035,x,y,-.296,(row+col)%2===0);}return c;}
  function croissant(g,x,y,z){const pastry=group(g,x,y,z);for(let i=0;i<9;i++){const a=-1.2+i*.3,r=.17,taper=Math.sin((i+1)*Math.PI/10);const fold=sphere(pastry,.045+.03*taper,.035+.035*taper,.05+.045*taper,Math.sin(a)*r,.005,Math.cos(a)*r);fold.rotation.y=-a;curve(pastry,[[Math.sin(a)*r-.025,.045,Math.cos(a)*r-.04],[Math.sin(a)*r,.07,Math.cos(a)*r],[Math.sin(a)*r+.025,.04,Math.cos(a)*r+.04]],.004);}pastry.rotation.y=.6;return pastry;}
  function paris(){
    const g=group(root);studyPaper.userData.mood.value=.9;
    box(g,24,.16,70,1.5,-.12,-25);box(g,3.4,.12,65,-1.3,-.02,-25);box(g,3,.12,65,6.7,-.02,-25);
    // Batched irregular cobblestone contours keep the street detailed and light.
    const cobbles=[];for(let row=0;row<130;row++)for(let col=0;col<10;col++){const x=.45+col*.45+(row%2)*.2,z=2-row*.33,w=.39+random()*.025,d=.26+random()*.025;const pts=[[x+.035,.0,z],[x+w-.035,.0,z-.008],[x+w,.0,z-.045],[x+w-.01,.0,z-d+.025],[x+w-.04,.0,z-d],[x+.025,.0,z-d+.01],[x,.0,z-d+.04],[x+.003,.0,z-.03]];for(let k=0;k<pts.length;k++)cobbles.push(new THREE.Vector3(...pts[k]),new THREE.Vector3(...pts[(k+1)%pts.length]));}g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cobbles),new THREE.LineBasicMaterial({color:0x171717})));
    for(const x of [.35,5.25])box(g,.12,.18,65,x,.01,-25);for(let z=2;z>-45;z-=.65)line(g,[[-3,.05,z],[.35,.05,z]]);
    function facade(x,z,width,height,rotation,index){const f=group(g,x,0,z);f.rotation.y=rotation;box(f,width,height,1,0,height/2,-.5);box(f,width+.2,.13,1.3,0,height,.02);box(f,width,.14,.3,0,2.5,.1);for(let j=0;j<3;j++){const xx=-width*.33+j*width*.33;box(f,1.1,2.05,.03,xx,1.14,.03,true);box(f,.04,2,.06,xx,1.14,.07);for(let row=0;row<3;row++){const yy=3.5+row*1.9;if(yy+.8>height)continue;box(f,.83,1.35,.06,xx,yy,.04,true);box(f,.04,1.35,.07,xx,yy,.08);box(f,.86,.045,.07,xx,yy,.08);box(f,1.16,.08,.4,xx,yy-.73,.15);rod(f,[xx-.54,yy-.28,.34],[xx+.54,yy-.28,.34],.017);for(let k=0;k<6;k++)rod(f,[xx-.48+k*.19,yy-.68,.34],[xx-.48+k*.19,yy-.28,.34],.009);if((j+row)%3===0)trailingPlant(f,xx,yy-.68,.3);}}
      if(index===0)label(f,'LIVRES',2.2,.25,0,2.27,.07);for(let y=.4;y<height;y+=.6)line(f,[[-width/2,y,.012],[-width/2+.2,y+.01,.012]]);return f;}
    for(let i=0;i<6;i++){facade(-2.45,-2.5-i*5.4,5.2,7.6+(i%3)*.8,Math.PI/2,i);facade(7.9,-8-i*5.7,5.5,7.1+(i%2),-Math.PI/2,i+1);}
    // Distant roofs close the street and keep the horizon from ending in empty space.
    for(let i=0;i<7;i++){const x=-1+i*1.3;box(g,1.25,3.5+(i%3)*.5,1,x,1.7,-37);for(let row=0;row<3;row++)for(let j=0;j<2;j++)box(g,.22,.42,.03,x-.28+j*.55,.8+row*.9,-36.48,true);}
    cylinder(g,.7,.8,2.6,5.6,4,-40);sphere(g,.85,1.05,.85,5.6,5.45,-40);rod(g,[5.6,6.3,-40],[5.6,6.8,-40],.035);
    // A striped canopy above your head, and the curved table edge within reach.
    for(let i=0;i<14;i++){const x=-2.5+i*.29;box(g,.29,.055,3.7,x,2.65,-.4,i%2===0);box(g,.29,.18,.04,x,2.54,-2.23,i%2===0);}
    const t=group(g,0,0,-.77);cylinder(t,.93,.93,.065,0,1.01,0);cylinder(t,.045,.065,1,0,.5,0,true);
    cylinder(t,.26,.23,.025,-.24,1.063,-.05);const cup=mug(t,-.24,1.08,-.05,1,'parisStudy');
    const spoon=sphere(t,.032,.01,.06,.03,1.09,-.1,true);rod(t,[.03,1.085,-.1],[.16,1.085,.08],.008);
    cylinder(t,.28,.27,.025,.45,1.065,.26);croissant(t,.43,1.1,.2);
    book(t,-.51,1.08,.32,.62,.42);const news=group(t,-.5,1.133,.32);news.rotation.x=-Math.PI/2;for(let row=0;row<8;row++)for(let col=0;col<2;col++)line(news,[[-.26+col*.28,-.16+row*.04,0],[-.03+col*.28,-.16+row*.04,0]]);
    wovenChair(g,-1.13,-1.7,-.25);wovenChair(g,-1.4,.3,1.05);
    // One tree with leafy, broken silhouettes replaces the repeated round blobs.
    const tree=group(g,4.7,0,-4.7);cylinder(tree,.13,.28,4.4,0,2.2,0);for(let i=0;i<6;i++){const a=i*2.4,x=Math.sin(a)*.9,z=Math.cos(a)*.6;rod(tree,[0,2.5,0],[x,4.1,z],.055);foliage(tree,x,4.2+(i%2)*.3,z,1.05,i);}for(let i=0;i<12;i++)line(tree,[[Math.sin(i)*.2,.1,Math.cos(i)*.2],[Math.sin(i)*.12,2.7,Math.cos(i)*.12]]);animations.parisStudy.push(t=>{tree.rotation.z=Math.sin(t*.25)*.006;});
    for(const z of [-4,-12,-23]){const l=group(g,5.65,0,z);cylinder(l,.035,.065,3.5,0,1.75,0,true);cylinder(l,.14,.1,.35,0,3.6,0);for(const x of [-.1,.1])rod(l,[x,3.42,0],[x,3.8,0],.012);sphere(l,.2,.09,.16,0,3.84,0,true);}
    const bike=group(g,4.8,.05,-4.8);bike.rotation.y=.15;for(const x of [-.55,.55]){ring(bike,.35,.018,x,.38,0,true);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(bike,[x,.38,0],[x+Math.sin(a)*.34,.38+Math.cos(a)*.34,0],.003);}}
    for(const [a,b]of [[[-.55,.38,0],[-.16,.91,0]],[[-.16,.91,0],[.23,.38,0]],[[.23,.38,0],[-.55,.38,0]],[[-.16,.91,0],[.35,.93,0]],[[.35,.93,0],[.23,.38,0]],[[.35,.93,0],[.55,.38,0]]])rod(bike,a,b,.018);rod(bike,[-.28,.98,0],[-.02,.98,0],.022);curve(bike,[[.35,.93,0],[.31,1.1,0],[.51,1.1,0]],.018);
    // Small silhouettes give scale without competing with the foreground.
    for(const [x,z]of [[-.25,-8],[5.6,-13],[5.15,-13.4]]){const person=group(g,x,0,z);sphere(person,.105,.13,.1,0,1.58,0,true);cylinder(person,.14,.2,.65,0,1.12,0,true);rod(person,[-.08,.8,0],[-.14,.06,.07],.045);rod(person,[.08,.8,0],[.16,.06,-.07],.045);curve(person,[[-.15,1.32,0],[-.21,.97,.06],[-.12,.93,.12]],.035);}
    trailingPlant(g,-1.75,1.1,-3.2);
    return finish(g);
  }
  return {setMood:key=>{studyPaper.userData.mood.value=key==='home'?.12:.9;},home:{make:home,eye:[0,1.7,1.2],yaw:0,pitch:-.15,reference:'references/rainy-room.png',animation:'homeStudy'},paris:{make:paris,eye:[0,1.65,.65],yaw:.13,pitch:-.1,reference:'references/paris-cafe.png',animation:'parisStudy'}};
}
