import * as THREE from 'three';

// Integral of the middle washer's speed: decelerate, rest, then ease back in.
// The accumulated angle is continuous at every phase and cycle boundary.
export function laundryRotation(time,speed=.65){
 const cycle=Math.floor(time/54),t=time%54;
 let distance;
 if(t<18)distance=t;
 else if(t<22){const u=t-18;distance=18+u/2+Math.sin(u*Math.PI/4)*2/Math.PI;}
 else if(t<30)distance=20;
 else if(t<34){const u=t-30;distance=20+u/2-Math.sin(u*Math.PI/4)*2/Math.PI;}
 else distance=22+t-34;
 return speed*(cycle*42+distance);
}

export function createNewScenes(h){
 const {root,animations,group,mesh,box,ball,cyl,line,rod,ellipse,rect,shadow,window:opening,coffee,book,tree,person,potPlant,flutterInk,occasion,ink,plain,paper,shaded,dark}=h;
 const V=a=>new THREE.Vector3(...a);
 function cloth(parent,w,d,x,y,z){
  const geo=new THREE.PlaneGeometry(w,d,20,20);geo.rotateX(-Math.PI/2);
  const a=geo.attributes.position;
  for(let i=0;i<a.count;i++){const px=a.getX(i),pz=a.getZ(i);a.setY(i,.018*Math.sin(px*18)+.025*Math.sin(pz*13+px*5));}
  const mat=paper.clone();mat.onBeforeCompile=paper.onBeforeCompile;mat.customProgramCacheKey=paper.customProgramCacheKey;mat.side=THREE.DoubleSide;
  return mesh(parent,geo,x,y,z,mat,false);
 }
 function bench(parent,x,y,z,width=1.8){
  const b=group(parent,x,y,z);for(let i=0;i<4;i++)box(b,width,.055,.12,0,.47,-.20+i*.14,shaded);
  for(const xx of [-width*.38,width*.38]){box(b,.06,.45,.46,xx,.23,.02,shaded);}
  return b;
 }
 function bird(parent,x,y,z){
  const b=group(parent,x,y,z);ball(b,.08,.06,.11,0,0,0,shaded);ball(b,.045,.045,.04,.045,.06,.035);line(b,[[.07,.06,.04],[.12,.04,.04]]);line(b,[[-.03,0,-.06],[-.09,-.025,-.18]],true);
  for(const dx of [-.025,.025])rod(b,[dx,-.035,0],[dx,-.09,.025],.006,ink);
  const wings=[];for(const side of [-1,1]){const wing=group(b,side*.055,.015,0);const geo=new THREE.SphereGeometry(1,12,8);geo.scale(.16,.015,.075);geo.translate(side*.11,0,0);mesh(wing,geo,0,0,0,shaded);wings.push({wing,side});}return {b,wings};
 }
 function laundromat(){
  const key='laundromatStudy',g=group(root);g.name='laundromat';
  opening(g,0,2.65,-3.9,4.6,1.55);box(g,8,4,.025,0,2.65,-8,ink);
  rod(g,[.9,1.8,-5.8],[.9,3.15,-5.8],.018,plain);ball(g,.09,.12,.09,.9,3.18,-5.8,plain);
  line(g,[[-2,2.02,-4.35],[1,2.02,-4.35],[2.1,2.03,-4.35]],false,true);
  for(let i=0;i<3;i++){
   const machine=group(g,(i-1)*1.47,0,-2.75);machine.name='washer-case-'+i;
   box(machine,1.30,1.46,1.05,0,.77,0,paper,.055);box(machine,1.15,.19,.035,0,1.32,.55,shaded);
   rect(machine,-.29,1.32,.58,.40,.09,.015);const dial=cyl(machine,.055,.055,.03,.37,1.32,.58);dial.rotation.x=Math.PI/2;
   mesh(machine,new THREE.CircleGeometry(.445,48),0,.70,.55,ink,false);
   mesh(machine,new THREE.TorusGeometry(.46,.045,10,48),0,.70,.61,shaded);
   mesh(machine,new THREE.TorusGeometry(.395,.018,8,48),0,.70,.65,paper);
   const drum=group(machine,0,.70,.58);drum.name='washer-drum-'+i;
   for(let j=0;j<3;j++){
    const a=j*Math.PI*2/3;const laundry=group(drum,Math.cos(a)*.21,Math.sin(a)*.21,.025);laundry.rotation.z=a;
    const sh=new THREE.Shape();sh.moveTo(-.08,.12);sh.lineTo(.04,.12);sh.lineTo(.065,-.035);sh.lineTo(.13,-.075);sh.quadraticCurveTo(.16,-.14,.06,-.14);sh.lineTo(-.075,-.11);sh.closePath();
    mesh(laundry,new THREE.ExtrudeGeometry(sh,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2}),0,0,0,j%2?paper:shaded);
    line(laundry,[[-.065,.075,.058],[.035,.075,.058]]);line(laundry,[[-.04,-.035,.058],[.01,-.06,.058],[.08,-.10,.058]]);
   }
   for(let j=0;j<3;j++){const a=j*2.094;line(drum,[[Math.cos(a)*.34,Math.sin(a)*.34,.015],[Math.cos(a+.3)*.35,Math.sin(a+.3)*.35,.015]],false,true);}
   animations[key].push(t=>drum.rotation.z=i===1?laundryRotation(t):t*(i===0?.48:-.38));
   for(const x of [-.5,.5])box(machine,.12,.08,.6,x,.04,0,ink);
  }
  occasion(g,key,'washer-finishes',()=>{},{start:22,duration:8,period:54,sound:'laundry-done',pan:0});
  // The basket sits beside your seat, not on an imaginary table in front of you.
  bench(g,.15,0,1.05,2.8);const basket=group(g,.73,.51,.94);basket.name='laundry-basket';
  box(basket,.70,.07,.48,0,.035,0,shaded,.06);
  for(const z of [-.24,.24])for(let i=0;i<10;i++)rod(basket,[-.34+i*.075,.03,z],[-.40+i*.088,.45,z*1.16],.009);
  for(const x of [-.38,.38])for(let i=0;i<6;i++)rod(basket,[x*.89,.03,-.23+i*.09],[x,.45,-.27+i*.105],.009);
  for(const y of [.16,.29,.44]){const outline=rect(basket,0,0,0,.80,.56,.10,true);outline.rotation.x=Math.PI/2;outline.position.y=y;}
  for(let i=0;i<3;i++){box(basket,.50,.09,.34,-.04,.39+i*.075,.01,i%2?paper:shaded,.035);line(basket,[[-.28,.43+i*.075,.18],[0,.44+i*.075,.18],[.20,.43+i*.075,.18]]);}
  book(g,-.57,.55,1.02,.38,.28,.15);
  for(let i=0;i<5;i++)line(g,[[-2.5,.005,-2+i*.65],[2.5,.005,-2+i*.65]]);
  line(g,[[-2.5,.01,-3.25],[2.5,.01,-3.25]],true);return g;
 }
 function cinema(){
  const key='cinemaStudy',g=group(root);g.name='cinema';
  // A curtain of actual pleated fabric, with a split down its centre.
  const curtain=group(g,0,0,-7.1);curtain.name='cinema-curtain';
  box(curtain,7.5,.12,.35,0,4.25,0,shaded);box(curtain,7.7,.16,.7,0,.18,.1,shaded);
  for(const side of [-1,1]){
   const clothGroup=group(curtain);const geo=new THREE.PlaneGeometry(3.55,3.82,56,36),a=geo.attributes.position;
   for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setXYZ(i,side*1.8+x,y+2.24,.09*Math.cos(x*16));}
   const mat=shaded.clone();mat.onBeforeCompile=shaded.onBeforeCompile;mat.customProgramCacheKey=shaded.customProgramCacheKey;mat.side=THREE.DoubleSide;mesh(clothGroup,geo,0,0,0,mat,false);
   for(let i=0;i<15;i++){const x=side*1.8-1.68+i*.24;line(clothGroup,[[x,4.15,.13],[x+.02,2.5,.13],[x-.02,.36,.13]],i%4===0);}
   flutterInk(clothGroup,key,{top:4.15,length:3.8,amplitude:.035,speed:.45});
  }
  function seat(x,z,row){const s=group(g,x,0,z);s.name='cinema-seat';box(s,.62,.85,.16,0,.65,0,shaded,.12);rect(s,0,.67,.095,.49,.61,.10);box(s,.57,.11,.52,0,.28,-.30,shaded,.08);for(const dx of [-.36,.36]){box(s,.065,.07,.48,dx,.55,-.22);rod(s,[dx,.08,-.1],[dx,.53,-.1],.018,ink);}line(s,[[-.1,.91,.101],[.1,.91,.101]]);}
  for(let row=0;row<3;row++)for(const x of [-2.85,-2.02,-1.19,1.19,2.02,2.85])seat(x,-4.1+row*1.15,row);
  // Your own armrests and a folded coat establish the seated point of view.
  for(const x of [-.60,.60])box(g,.12,.10,1.15,x,.65,1.60,shaded,.035);
  const coat=group(g,0,.64,1.35);box(coat,.85,.11,.57,0,0,0,shaded,.08);cloth(coat,.90,.62,0,.07,0);line(coat,[[-.25,.10,.2],[-.06,.12,0],[.12,.1,-.24]],true);
  const passer=person(g,0,0,-5.1,.88,true);passer.name='cinema-passer';
  occasion(g,key,'late-arrival',(u)=>{passer.visible=u>=0;passer.position.x=-5.3+10.6*Math.max(0,u);passer.position.y=Math.sin(Math.max(0,u)*Math.PI*24)*.016;passer.userData.upper.rotation.z=Math.sin(u*45)*.025;},{start:16,duration:12,period:61,sound:'footsteps',pan:-.5});
  return g;
 }
 function picnic(){
  const key='picnicStudy',g=group(root);g.name='picnic';
  const trunk=tree(g,-2.2,0,-1.8,2.8,true);trunk.name='picnic-tree';
  // Keep the trunk rooted; individual canopy clusters catch the breeze.
  const canopy=group(g,0,2.0,-2.3);line(canopy,[[-2.2,-.35,0],[-1.3,.08,0],[0,.14,-.2],[1.5,.35,-.3],[2.7,.24,-.4]],true);for(let i=0;i<13;i++){const x=-2.5+i*.43;const sprig=group(canopy,x,.12+Math.sin(i)*.18,-(i%3)*.38);line(canopy,[[x-.12,.17,-.22],[x,.12+Math.sin(i)*.18,-(i%3)*.38]]);line(sprig,[[-.16,.04,0],[0,0,0],[.19,-.06,.02]]);for(let j=0;j<4;j++){const side=j%2?1:-1;const leaf=ball(sprig,.085,.012,.033,-.10+j*.075,side*.045,side*.025,paper);leaf.rotation.z=side*.6;leaf.rotation.x=.5+side*.3;}animations[key].push(t=>sprig.rotation.z=Math.sin(t*.6+i)*.12);}
  line(g,[[-12,.07,-16],[-5,.24,-17],[2,.14,-17],[10,.25,-18]],true);tree(g,5,0,-13,.9,true);tree(g,-5,0,-14,.65,true);
  const blanket=group(g,0,.025,.35);blanket.name='picnic-blanket';cloth(blanket,2.7,2.25,0,0,0);line(blanket,[[-1.35,.015,-1.12],[0,.03,-1.12],[1.35,.02,-1.12],[1.35,.015,0],[1.35,.02,1.12],[0,.015,1.12],[-1.35,.025,1.12],[-1.35,.02,0],[-1.35,.015,-1.12]],true);
  for(let i=0;i<9;i++){const x=-1.22+i*.30;line(blanket,[[x,.04,-1.08],[x+.01,.06,0],[x,.04,1.08]]);}for(let i=0;i<7;i++){const z=-.94+i*.30;line(blanket,[[-1.30,.045,z],[0,.055,z],[1.30,.045,z]]);}
  book(g,-.46,.12,.18,.55,.39,-.28);const flask=group(g,.65,.08,-.25);cyl(flask,.10,.10,.39,0,.20,0,shaded);cyl(flask,.105,.105,.08,0,.43,0);coffee(g,.30,.07,.42,key,.68);
  const apple=group(g,-.10,.16,-.40);apple.name='picnic-apple';ball(apple,.115,.11,.105,0,0,0,shaded);rod(apple,[0,.09,0],[.02,.15,0],.007,ink);
  occasion(g,key,'apple-roll',(u,e)=>{apple.position.x=-.10+e*.20;apple.rotation.z=-e*1.7;},{start:13,duration:6,period:41,sound:'fabric',pan:0});
  for(const x of [-.52,-.22]){const shoe=group(g,x,.10,1.22);shoe.rotation.y=.2;ball(shoe,.115,.065,.25,0,0,0,shaded);ellipse(shoe,.07,.09,0,.065,-.10);for(let j=0;j<3;j++)line(shoe,[[-.065,.062,-.01+j*.04],[.065,.065,.025+j*.04]]);}
  const bike=group(g,-1.67,.06,-1.4);bike.rotation.y=.30;bike.rotation.z=-.14;
  for(const x of [-.51,.51]){mesh(bike,new THREE.TorusGeometry(.34,.015,8,40),x,.35,0,ink,false);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(bike,[x,.35,0],[x+Math.cos(a)*.32,.35+Math.sin(a)*.32,0],.003,ink);}}
  for(const [a,b]of [[[-.51,.35,0],[-.2,.87,0]],[[-.2,.87,0],[.1,.35,0]],[[.1,.35,0],[-.51,.35,0]],[[-.2,.87,0],[.38,.87,0]],[[.38,.87,0],[.1,.35,0]],[[.38,.87,0],[.51,.35,0]]])rod(bike,a,b,.018);
  box(bike,.26,.035,.13,-.2,.91,0,ink);rod(bike,[.38,.87,0],[.32,1.1,0],.015);rod(bike,[.32,1.1,0],[.48,1.13,0],.015);
  return g;
 }
 function pottery(){
  const key='potteryStudy',g=group(root);g.name='pottery';
  opening(g,1.15,2.25,-3.2,2.2,2.2,{cross:true});line(g,[[.13,2.91,-3.1],[.22,2.12,-3.12]],true);
  for(const y of [1.30,2.0,2.7]){
   box(g,2.0,.055,.43,-1.72,y,-2.95,shaded);
   for(let i=0;i<5;i++){const x=-2.48+i*.37;const profile=[[.08,0],[.10,.025],[.11,.17],[.105,.20],[.08,.20],[.08,.04],[0,.04]].map(v=>new THREE.Vector2(...v));mesh(g,new THREE.LatheGeometry(profile,28),x,y+.03,-2.92,i%2?shaded:paper);line(g,[[x+.10,y+.18,-2.92],[x+.18,y+.17,-2.92],[x+.18,y+.08,-2.92],[x+.10,y+.07,-2.92]],true);}
  }
  const wheel=group(g,0,0,.85);wheel.name='pottery-wheel';box(wheel,1.45,.12,1.18,0,.68,0,shaded,.09);for(const x of [-.55,.55])rod(wheel,[x,.63,.30],[x,.03,.38],.04,shaded);
  const platter=group(wheel,0,.77,0);platter.name='pottery-platter';cyl(platter,.48,.48,.055,0,0,0,shaded);ellipse(platter,.42,.42,0,.031,0,true);
  const profile=[[.18,.025],[.21,.06],[.26,.17],[.31,.31],[.32,.34],[.285,.345],[.275,.30],[.23,.17],[.17,.075],[0,.075]].map(v=>new THREE.Vector2(...v));
  const geo=new THREE.LatheGeometry(profile,64);const a=geo.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),angle=Math.atan2(a.getZ(i),a.getX(i));a.setY(i,y+Math.sin(angle*3+.4)*.015*y/.34);a.setX(i,a.getX(i)+y*.055);}
  mesh(platter,geo,0,.04,0,shaded);for(const r of [.225,.25,.28])ellipse(platter,r,r,r*.08,.04+(r-.18)*2.5,0);
  animations[key].push(t=>platter.rotation.y=t*.38);
  box(wheel,.22,.03,.34,-.46,-.01,.73,shaded);rod(wheel,[-.46,.04,.73],[-.45,.45,.35],.007,ink);
  cyl(wheel,.13,.11,.18,.54,.84,-.30);rod(wheel,[.50,.92,-.30],[.45,1.24,-.28],.008,ink);box(wheel,.17,.035,.11,-.54,.77,.24,shaded,.03);
  const apron=group(g,2.3,2.65,-2.5);apron.name='pottery-apron';line(apron,[[-.10,-.22,0],[0,.03,0],[.10,-.22,0]],true);
  const sh=new THREE.Shape();sh.moveTo(-.16,-.18);sh.lineTo(.16,-.18);sh.lineTo(.19,-.49);sh.lineTo(.36,-.65);sh.lineTo(.34,-1.25);sh.quadraticCurveTo(0,-1.30,-.34,-1.25);sh.lineTo(-.36,-.65);sh.lineTo(-.19,-.49);sh.closePath();mesh(apron,new THREE.ExtrudeGeometry(sh,{depth:.015,bevelEnabled:false}),0,0,0,paper);rect(apron,0,-.82,.025,.32,.24,.015);flutterInk(apron,key,{top:-.18,length:1.1,amplitude:.10,speed:.65});
  const pane=group(g,.16,2.24,-3.1);pane.name='pottery-open-pane';rect(pane,.49,0,0,.96,1.96,.02,true);rod(pane,[0,-.98,0],[.98,-.98,0],.012);pane.rotation.y=-.3;
  occasion(g,key,'studio-breeze',(u,e)=>pane.rotation.y=-.3-e*.18,{start:15,duration:8,period:47,sound:'breeze',pan:.45});
  for(let i=0;i<5;i++)line(g,[[-3,.005,-2.6+i*.65],[3,.005,-2.6+i*.65]]);return g;
 }
 function porch(){
  const key='porchStudy',g=group(root);g.name='porch';
  for(const x of [-2.6,2.6]){box(g,.14,3.6,.14,x,1.8,-1.75,shaded);box(g,.25,.10,.25,x,.07,-1.75);}
  box(g,5.4,.16,.32,0,3.5,-1.75,shaded);
  // Open centre steps; the two low railings frame the garden.
  for(const side of [-1,1]){for(let i=0;i<4;i++)rod(g,[side*(1.38+i*.4),.04,-1.7],[side*(1.38+i*.4),.90,-1.7],.018);box(g,1.55,.06,.18,side*2.0,.94,-1.7,shaded);}
  for(let i=0;i<3;i++)box(g,2.2,.16,.42,0,-.08-i*.16,-1.8-i*.37,shaded);coffee(g,-1.50,.98,-1.70,key,.78);
  const swing=group(g,1.65,3.35,-.28);swing.name='porch-swing';
  for(const x of [-.62,.62])for(const z of [-.22,.22])rod(swing,[x,0,0],[x,-2.78,z],.007,ink);
  for(let i=0;i<4;i++)box(swing,1.36,.05,.13,0,-2.78,-.20+i*.13,shaded);
  for(let i=0;i<3;i++)box(swing,1.36,.12,.05,0,-2.52+i*.15,-.25,shaded);
  for(const x of [-.70,.70]){box(swing,.08,.05,.56,x,-2.38,.02);rod(swing,[x,-2.75,.22],[x,-2.4,.22],.014);}
  animations[key].push(t=>swing.rotation.x=Math.sin(t*.68)*.035);
  // Your legs rest toward the open steps, anchoring the view to the porch seat.
  for(const side of [-1,1]){const leg=group(g,side*.19,.38,1.34);leg.rotation.x=-.12;box(leg,.22,.20,.64,0,0,0,shaded,.07);ball(leg,.12,.08,.25,0,-.06,-.38,shaded);}
  for(let i=0;i<9;i++)line(g,[[-2.7,.005,-1.45+i*.4],[2.7,.005,-1.45+i*.4]]);
  for(let i=0;i<16;i++){const x=-5+i*.66;box(g,.08,.67,.05,x,.035,-5.9);line(g,[[x-.04,.37,-5.87],[x,.43,-5.87],[x+.04,.37,-5.87]]);}for(const y of [-.13,.16])rod(g,[-5,y,-5.9],[5,y,-5.9],.015);
  for(const [x,z]of [[-2.7,-4.1],[2.8,-4.6],[-3.4,-5.3]])potPlant(g,x,-.47,z,1.4,true,key);
  const b=bird(g,0,.52,-5.9);b.b.name='porch-visitor';
  occasion(g,key,'bird-lands',(u)=>{b.b.visible=u>=0;const enter=Math.min(1,Math.max(0,u)*5),leave=Math.max(0,(u-.8)*5);b.b.position.set(-3*(1-enter)+leave*3,.52+(1-enter)*1.8+leave*1.8,-5.9);for(const {wing,side}of b.wings)wing.rotation.z=side*((enter<1||leave>0)?Math.sin(u*110)*.65:.1);},{start:12,duration:12,period:51,sound:'bird',pan:0});
  const drip=group(g,-2.5,3.3,-1.7);ball(drip,.012,.027,.012,0,0,0,ink);animations[key].push(t=>{const phase=t%4;drip.visible=phase<.8;drip.position.y=3.3-phase*phase*5;});
  return g;
 }
 return {laundromat,cinema,picnic,pottery,porch};
}
