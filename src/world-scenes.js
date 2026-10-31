import * as THREE from 'three';

// Five places farther afield. They share the modeled-ink kit with the first
// scenes: real volumes, drawn shadow, and small events on the scene clock.
export function createWorldScenes(h){
 const {root,animations,group,mesh,box,ball,cyl,line,rod,ellipse,rect,shadow,window:opening,coffee,book,tree,person,potPlant,flutterInk,occasion,ink,plain,paper,shaded,dark,rain,hatch,wallHatch,leaf,candle,rnd}=h;

 function cloth(parent,w,d,x,y,z,mat=paper){
  const geo=new THREE.PlaneGeometry(w,d,18,18);geo.rotateX(-Math.PI/2);
  const a=geo.attributes.position;
  for(let i=0;i<a.count;i++){const px=a.getX(i),pz=a.getZ(i);a.setY(i,.012*Math.sin(px*17)+.018*Math.sin(pz*12+px*4));}
  const m=mat.clone();m.onBeforeCompile=mat.onBeforeCompile;m.customProgramCacheKey=mat.customProgramCacheKey;m.side=THREE.DoubleSide;
  return mesh(parent,geo,x,y,z,m,false);
 }
 function cylinderRim(parent,r,y,h,mat){return mesh(parent,new THREE.CylinderGeometry(r,r,h,48),0,y,0,mat);}
 function steam(parent,key,x,y,z,height=.28,spread=.045){
  const g=group(parent,x,y,z),wisps=[];
  for(let k=0;k<2;k++){const w=line(g,[[k*spread-.02,0,0],[0,height*.45,0],[0,height,0]]);wisps.push(w.geometry.attributes.position);}
  animations[key].push(t=>{for(let k=0;k<wisps.length;k++){const positions=wisps[k];for(let i=0;i<positions.count;i++){const u=i/(positions.count-1);positions.setXYZ(i,k*spread-.02+Math.sin(u*9-t*1.5+k)*.035*u,height*u,Math.cos(u*7-t*1.1+k)*.03*u);}positions.needsUpdate=true;}});
 }
 function bird(parent,x,y,z){
  const b=group(parent,x,y,z);ball(b,.08,.06,.11,0,0,0,shaded);ball(b,.045,.045,.04,.045,.06,.035);line(b,[[.07,.06,.04],[.12,.04,.04]]);line(b,[[-.03,0,-.06],[-.09,-.025,-.18]],true);
  for(const dx of [-.025,.025])rod(b,[dx,-.035,0],[dx,-.09,.025],.006,ink);
  const wings=[];for(const side of [-1,1]){const wing=group(b,side*.055,.015,0);const geo=new THREE.SphereGeometry(1,12,8);geo.scale(.16,.015,.075);geo.translate(side*.11,0,0);mesh(wing,geo,0,0,0,shaded);wings.push({wing,side});}return {b,wings};
 }
 function archShape(w,h){
  const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h*.63);s.quadraticCurveTo(-w/2,h*.95,0,h);s.quadraticCurveTo(w/2,h*.95,w/2,h*.63);s.lineTo(w/2,0);s.closePath();return s;
 }
 function archPanel(parent,x,y,z,w,h,depth,mat){return mesh(parent,new THREE.ExtrudeGeometry(archShape(w,h),{depth,bevelEnabled:false,curveSegments:24}),x,y,z,mat);}
 function archOutline(parent,x,y,z,w,h,heavy=true){return line(parent,archShape(w,h).getPoints(44).map(v=>[x+v.x,y+v.y,z]),heavy,false,true);}
 function lantern(parent,x,y,z,drop=.55){
  const g=group(parent,x,y,z);
  rod(g,[0,drop,0],[0,.14,0],.005,ink);
  mesh(g,new THREE.CylinderGeometry(.12,.085,.24,8),0,0,0,paper);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,[[Math.cos(a)*.12,.12,Math.sin(a)*.12],[Math.cos(a)*.085,-.12,Math.sin(a)*.085]]);}
  cyl(g,.135,.135,.018,0,.13,0,shaded);cyl(g,.10,.10,.016,0,-.13,0,shaded);
  line(g,[[0,-.14,0],[0,-.20,0]],true);return g;
 }
 function ceilingFan(parent,key,x,y,z){
  const g=group(parent,x,y,z);rod(g,[0,.62,0],[0,.14,0],.012,ink);cyl(g,.10,.12,.13,0,0,0,shaded);cyl(g,.16,.16,.025,0,-.07,0,dark);
  const spin=group(g);
  for(let i=0;i<4;i++){const pivot=group(spin);pivot.rotation.y=i*Math.PI/2;box(pivot,.76,.022,.16,.39,0,0,shaded,.008);line(pivot,[[.60,.02,.06],[.74,.02,.03],[.60,.02,-.06]]);}
  animations[key].push(t=>spin.rotation.y=t*2.1);return g;
 }
 function floorTiles(parent,x0,x1,z0,z1,step){
  const seg=[];
  for(let x=x0;x<=x1;x+=step)seg.push([[x,.006,z0],[x,.006,z1]]);
  for(let z=z0;z<=z1;z+=step)seg.push([[x0,.006,z],[x1,.006,z]]);
  let ix=0;
  for(let x=x0;x<x1;x+=step,ix++){let iz=0;for(let z=z0;z<z1;z+=step,iz++){if((ix+iz)%3===0)seg.push([[x+step*.18,.007,z+step*.18],[x+step*.82,.007,z+step*.82]],[[x+step*.82,.007,z+step*.18],[x+step*.18,.007,z+step*.82]]);}}
  return hatch(parent,seg);
 }
 function tilesBand(parent,x0,x1,y0,y1,z,step=.24){
  const seg=[];
  for(let x=x0;x<=x1;x+=step)seg.push([[x,y0,z],[x,y1,z]]);
  for(let y=y0;y<=y1;y+=step*.72)seg.push([[x0,y,z],[x1,y,z]]);
  for(let x=x0;x<x1;x+=step)for(let y=y0;y<y1;y+=step*.72){const cx=x+step/2,cy=y+step*.36,r=step*.18;seg.push([[cx-r,cy,z],[cx,cy+r,z],[cx+r,cy,z],[cx,cy-r,z],[cx-r,cy,z]]);}
  return hatch(parent,seg);
 }
 function townhouse(parent,x,z,w,h,key){
  const b=group(parent,x,-1.8,z);
  box(b,w,h,.55,0,h/2,0,paper,.02);
  box(b,w*.72,1.0,.06,0,.62,.30,dark,.01);
  for(let i=0;i<4;i++){const xx=-w*.27+i*w*.18;line(b,[[xx,.22,.345],[xx,1.02,.345]],true);}
  const awning=box(b,w*.88,.055,.78,0,1.18,.38,shaded,.01);awning.rotation.x=-.12;
  line(b,[[-w*.44,1.08,.76],[0,1.06,.78],[w*.44,1.08,.76]],true);
  for(let floor=0;floor<2;floor++){
   const yy=1.65+floor*1.02;
   for(const dx of [-w*.24,w*.24]){
    box(b,w*.32,.62,.07,dx,yy,.30,shaded,.012);rect(b,dx,yy,.345,w*.28,.56,.012,true);
    box(b,w*.03,.58,.08,dx,yy,.36);box(b,w*.28,.03,.08,dx,yy,.36);
   }
   box(b,w*.9,.05,.44,0,yy-.45,.36,shaded,.01);
   for(const dx of [-w*.26,w*.26])box(b,.16,.16,.12,dx,yy-.38,.42,shaded,.015);
  }
  box(b,w+.18,.11,.74,0,h-.04,.02,shaded,.01);
  box(b,w+.08,.04,.08,0,h+.03,.34,ink,.006);
  // A water tank, a hanging sign and a little washing break the roofline.
  cyl(b,.14,.14,.24,w*.24,h+.12,.04,shaded);rod(b,[w*.24,h,0.04],[w*.24,h+.14,.04],.012,shaded);
  box(b,.10,.52,.05,-w*.36,1.72,.59,paper,.008);for(let i=0;i<3;i++)line(b,[[-w*.36-.03,1.56+i*.14,.62],[-w*.36+.03,1.56+i*.14,.62]],true);
  line(b,[[-w*.12,1.02,.60],[w*.36,1.12,.60]],true);
  for(let i=0;i<2;i++){box(b,.18,.22,.015,-w*.02+i*.15,.88,.61,i?shaded:paper,.004);line(b,[[-w*.02+i*.15,.77,.62],[-w*.02+i*.15,.99,.62]],false,true);}
  return b;
 }
 function scooter(parent,key,offset,speed,z){
  const s=group(parent,0,-1.74,z);const wheels=[];
  for(const x of [-.34,.34]){const wheel=group(s,x,.32,0);mesh(wheel,new THREE.TorusGeometry(.22,.012,7,30),0,0,0,ink,false);for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(wheel,[0,0,0],[Math.cos(a)*.20,Math.sin(a)*.20,0],.004,ink);}wheels.push(wheel);}
  rod(s,[-.34,.32,0],[-.08,.72,0],.018,shaded);rod(s,[-.08,.72,0],[.22,.32,0],.018,shaded);rod(s,[-.08,.72,0],[.28,.72,0],.018,shaded);
  box(s,.28,.05,.15,-.05,.78,0,shaded,.01);box(s,.17,.22,.15,-.06,.66,0,dark,.015);
  rod(s,[.28,.72,0],[.25,.94,0],.012,ink);rod(s,[.25,.94,0],[.40,.97,0],.012,ink);ball(s,.035,.028,.035,.40,.97,0,ink);
  const rider=group(s,-.06,.12,0);ball(rider,.11,.15,.09,0,.44,0,shaded);ball(rider,.07,.075,.06,0,.66,.01,shaded);rod(rider,[-.02,.06,-.06],[-.12,-.10,.06],.025,shaded);rod(rider,[-.02,.06,.06],[-.12,-.10,-.06],.025,shaded);
  animations[key].push(t=>{const loop=16;s.position.x=-8+((t*speed+offset)%loop);for(const wheel of wheels)wheel.rotation.z=-t*speed*3.4;});
  return s;
 }
 function acacia(parent,x,y,z,s=1){
  const g=group(parent,x,y,z);g.scale.setScalar(s);
  const trunk=new THREE.CatmullRomCurve3([[0,0,0],[.03,.65,.01],[-.02,1.35,0],[.08,2.05,.01]].map(a=>new THREE.Vector3(...a)));
  mesh(g,new THREE.TubeGeometry(trunk,24,.045,8,false),0,0,0,shaded);
  for(const [a,b]of [[[0,1.55,0],[-.8,2.15,0]],[[0,1.6,0],[.85,2.25,.02]],[[0,1.7,0],[-.25,2.45,-.02]]])rod(g,a,b,.022,shaded);
  const flat=group(g,0,2.25,0);
  for(let i=0;i<7;i++){const xx=-1.2+i*.4;line(flat,[[xx-.25,.02,0],[xx,0,.02],[xx+.25,.02,0]],true);line(flat,[[xx-.50,.02,.02],[xx-.15,.12,.02],[xx+.15,.12,.02],[xx+.50,.02,.02]]);}
  const seg=[];for(let i=0;i<240;i++){const xx=(rnd()-.5)*2.7,zz=(rnd()-.5)*1.3,yy=.04+rnd()*.30;seg.push([[xx,yy,zz],[xx+.055,yy+.07,zz+.012]],[[xx+.055,yy+.07,zz+.012],[xx+.02,yy+.12,zz+.01]]);}
  hatch(flat,seg);return g;
 }

 function kyoto(){
  const key='kyotoStudy',g=group(root);g.name='kyoto';
  // White room, old boards, one broad opening onto the garden.
  box(g,7.2,.10,6.8,0,-.05,-.4,paper,.02);
  box(g,1.75,3.2,.20,-2.28,1.6,-3.5,paper,.01);box(g,1.75,3.2,.20,2.28,1.6,-3.5,paper,.01);box(g,2.9,.55,.20,0,2.93,-3.5,paper,.01);
  wallHatch(g,-2.32,2.35,-3.38,.85,.95,32);wallHatch(g,2.32,2.35,-3.38,.85,.95,32);
  // The eave and the outer veranda frame the rain.
  box(g,4.9,.12,.72,0,2.62,-4.18,shaded,.02);
  for(let i=0;i<11;i++)line(g,[[-2.4+i*.48,2.56,-3.82],[-2.4+i*.48,2.59,-4.52]]);
  box(g,4.4,.10,.90,0,.05,-3.55,shaded,.02);line(g,[[-2.2,.11,-3.18],[2.2,.11,-3.18]],true);
  // Shoji panels are stacked open at the edges; the middle stays garden.
  for(const side of [-1,1]){
   const shoji=group(g,side*1.72,1.28,-3.38);
   box(shoji,.52,2.36,.055,0,0,0,paper,.008);
   for(let i=0;i<3;i++)box(shoji,.018,2.30,.075,-.18+i*.18,0,.04,shaded,.002);
   for(let i=0;i<7;i++)box(shoji,.48,.014,.075,0,-1.10+i*.31,.04,shaded,.002);
   line(shoji,[[-.26,-1.18,.075],[.26,-1.18,.075]],true);
  }
  box(g,3.5,.05,.10,0,2.49,-3.37,shaded,.006);
  // Tatami mats and their seams.
  for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++){const x=-2.25+ix*1.5,z=-2.0+iz*1.55;line(g,[[x-.72,.008,z-.74],[x+.72,.008,z-.74],[x+.72,.008,z+.74],[x-.72,.008,z+.74],[x-.72,.008,z-.74]],false,false,true);}
  const weave=[];for(let i=0;i<90;i++){const z=-3.35+(i%20)*.30,x=-2.9+Math.floor(i/20)*1.45;weave.push([[x,.009,z],[x+.52,.009,z+.01]]);}
  hatch(g,weave);
  // A hanging scroll, kept almost empty.
  const scroll=group(g,-2.35,1.85,-3.37);
  rect(scroll,0,0,0,.55,1.45,.02,true);rect(scroll,0,0,.025,.42,1.31,.015);
  for(let i=0;i<3;i++)line(scroll,[[-.12,.50-i*.20,.035],[-.02,.40-i*.22,.04],[.10,.46-i*.21,.035]],i===0);
  // Low table, iron pot, two cups.
  const table=group(g,0,0,.70);
  box(table,1.15,.06,.72,0,.34,0,shaded,.012);
  for(const x of [-.47,.47])for(const z of [-.27,.27])rod(table,[x,.32,z],[x,.02,z],.023,shaded);
  const pot=group(table,0,.37,-.06);
  ball(pot,.12,.085,.12,0,.085,0,shaded);cyl(pot,.045,.055,.022,0,.178,0,shaded);
  cyl(pot,.020,.028,.085,-.11,.12,0,shaded);rod(pot,[.08,.12,0],[.15,.19,0],.016,ink);cyl(pot,.05,.05,.008,0,.178,0,ink);
  for(const x of [-.34,.34]){const cup=group(table,x,.36,.16);cyl(cup,.070,.056,.078,0,.040,0,paper);ellipse(cup,.064,.064,0,.081,0,true);cyl(cup,.050,.050,.006,0,.082,0,ink);line(cup,[[.06,.030,0],[.095,.055,0]],true);}
  cyl(table,.14,.14,.012,.36,.355,.20,shaded);
  for(let i=0;i<3;i++)ball(table,.040,.022,.040,.30+i*.06,.383,.20,shaded);
  steam(pot,key,0,.22,0,.28,.032);
  box(g,.72,.12,.66,0,.06,1.55,shaded,.09);line(g,[[-.34,.10,1.25],[0,.11,1.24],[.34,.10,1.25]],true);
  cloth(g,.9,.65,.92,.03,1.38,paper);
  // A small glass wind chime under the eave.
  const chime=group(g,1.55,2.55,-3.04);
  rod(chime,[0,0,0],[0,-.22,0],.004,ink);ball(chime,.075,.035,.075,0,-.27,0,shaded);
  for(let i=0;i<3;i++){const a=i*2.1;line(chime,[[Math.cos(a)*.06,-.30,Math.sin(a)*.06],[Math.cos(a)*.05,-.42,Math.sin(a)*.05]],true);}
  line(chime,[[0,-.31,0],[.15,-.45,.02]],true);
  animations[key].push(t=>{chime.rotation.z=Math.sin(t*.55)*.08;chime.rotation.x=Math.cos(t*.42)*.04;});
  // Garden beyond the veranda.
  box(g,10,.06,8,0,-.12,-7.2,paper,.02);
  const moss=[];for(let i=0;i<300;i++){const x=-4.5+rnd()*9,z=-10.2+rnd()*6.6;moss.push([[x,.01,z],[x+.05+rnd()*.08,.012,z+.02+rnd()*.05]]);}
  hatch(g,moss);
  for(const [x,z,s]of [[.15,-4.7,.34],[.80,-5.35,.26],[-.30,-5.9,.30],[.55,-6.8,.22]]){ball(g,.34*s,.12*s,.26*s,x,.03,z,shaded);ellipse(g,.34*s,.26*s,x,.12*s,z,true);}
  const ishi=group(g,.65,0,-5.8);
  cyl(ishi,.22,.26,.16,0,.08,0,shaded);cyl(ishi,.075,.09,.55,0,.43,0,shaded);box(ishi,.36,.28,.36,0,.84,0,paper,.02);
  for(const [x,z]of [[-.09,.19],[.09,.19],[-.09,-.19],[.09,-.19]])rect(ishi,x,.84,z+.01,.10,.13,.008);
  mesh(ishi,new THREE.ConeGeometry(.34,.20,4),0,1.08,0,shaded);ball(ishi,.055,.055,.055,0,1.20,0,shaded);
  for(let i=0;i<11;i++){const x=-4.4+i*.88;rod(g,[x,0,-9.2],[x,1.35,-9.2],.026,shaded);}
  for(const y of [.35,.95])rod(g,[-4.5,y,-9.19],[4.5,y,-9.19],.018,shaded);
  const maple=tree(g,-.85,0,-6.2,1.02,true);maple.name='kyoto-maple';
  animations[key].push(t=>{maple.rotation.z=Math.sin(t*.38)*.012;maple.rotation.x=Math.cos(t*.31)*.007;});
  const bamboo=group(g,1.15,0,-4.70);
  cyl(bamboo,.065,.075,1.02,0,.51,0,shaded);
  const sway=group(bamboo,0,.98,0);rod(sway,[-.02,0,0],[.62,0,0],.040,shaded);rod(sway,[-.02,0,0],[.02,.07,0],.052,shaded);
  const clack=group(sway,.02,0,0);
  animations[key].push(t=>sway.rotation.z=Math.sin(t*.45)*.022);
  const basin=group(g,.75,0,-4.15);
  cyl(basin,.38,.32,.18,0,.09,0,shaded);mesh(basin,new THREE.CircleGeometry(.29,32),0,.19,0,ink,false).rotation.x=-Math.PI/2;
  occasion(g,key,'bamboo-clack',(u)=>{clack.rotation.z=-Math.sin(Math.PI*Math.min(1,Math.max(0,u)))*.20;},{start:12,duration:1.6,period:31,sound:'clack',pan:.45});
  const leafShape=new THREE.Shape();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.045:.10,x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?leafShape.moveTo(x,y):leafShape.lineTo(x,y);}
  leafShape.closePath();
  const falling=group(g,-.85,2.45,-5.9);mesh(falling,new THREE.ExtrudeGeometry(leafShape,{depth:.006,bevelEnabled:false}),0,0,0,shaded);
  line(falling,[[0,0,.007],[.03,-.04,.007],[-.01,-.08,.007]],true);
  occasion(g,key,'maple-leaf',(u)=>{falling.visible=u>=0;const t=u<0?0:u;falling.position.set(-.85+Math.sin(t*4)*.40,2.45-t*2.3,-5.9+Math.cos(t*3)*.3);falling.rotation.set(t*4,t*3,t*5);},{start:17,duration:10,period:47,sound:'rustle',pan:.35});
  rain(g,key,0,1.65,-3.85,4.2,2.2,30);
  return g;
 }
 function marrakech(){
  const key='marrakechStudy',g=group(root);g.name='marrakech';
  box(g,7.4,3.7,.20,0,1.85,-3.85,paper,.01);
  box(g,7.2,.08,6.9,0,-.04,-.4,paper,.02);
  floorTiles(g,-3.5,3.5,-3.4,2.8,1.18);
  tilesBand(g,-3.3,3.3,.18,.92,-3.72,.28);
  // Three shallow arches, a studded door, and columns that hold the shade.
  for(const [x,door]of [[-1.6,false],[0,true],[1.6,false]]){
   archPanel(g,x,-.02,-3.70,1.55,2.5,.10,shaded);
   archPanel(g,x,.06,-3.59,1.30,2.30,.04,paper);
   archOutline(g,x,.09,-3.52,1.30,2.30,true);
   if(door){box(g,1.0,1.9,.06,0,.98,-3.50,shaded,.02);for(let i=0;i<4;i++)for(let j=0;j<3;j++)ball(g,.022,.022,.012,-.30+i*.20,1.28+j*.37,-3.465,ink);}
  }
  for(const x of [-2.4,-.8,.8,2.4]){box(g,.24,2.8,.34,x,1.4,-3.38,shaded,.025);box(g,.38,.12,.42,x,2.83,-3.38,shaded,.02);box(g,.38,.12,.42,x,.06,-3.38,shaded,.02);}
  box(g,7.4,.10,.30,0,3.66,-3.72,shaded,.01);
  // Fountain with moving water.
  const fountain=group(g,0,0,-2.15);fountain.name='marrakech-fountain';
  mesh(fountain,new THREE.CylinderGeometry(.94,.99,.24,8),0,.12,0,shaded);
  mesh(fountain,new THREE.CylinderGeometry(.99,.99,.08,8),0,.26,0,paper);
  mesh(fountain,new THREE.CylinderGeometry(.93,.93,.05,8),0,.315,0,shaded);
  const water=mesh(fountain,new THREE.CircleGeometry(.83,36),0,.342,0,plain,false);water.rotation.x=-Math.PI/2;
  cyl(fountain,.17,.23,.32,0,.50,0,shaded);cyl(fountain,.055,.075,.24,0,.77,0,ink);
  rod(fountain,[0,.84,0],[0,.98,0],.012,ink);
  const drops=[];for(let i=0;i<4;i++){const d=ball(fountain,.012,.020,.012,0,.80,0,ink);drops.push(d);}
  const ripples=[];for(let i=0;i<3;i++){const r=group(fountain,0,.348,0);ellipse(r,.30,.30,0,0,0);ripples.push(r);}
  animations[key].push(t=>{ripples.forEach((r,i)=>{const p=((t*.20+i/3)%1);r.scale.setScalar(.35+p*1.6);});drops.forEach((d,i)=>{const p=((t*.55+i*.23)%1);d.visible=t>.2;d.position.set(Math.sin(i*2.1)*.05,.98-p*p*.60,.0);d.scale.setScalar(.8+p*.6);});});
  // An orange tree in a blue-white planter.
  const planter=group(g,-2.62,0,-3.12);
  mesh(planter,new THREE.CylinderGeometry(.43,.34,.38,8),0,.19,0,shaded);cylinderRim(planter,.45,.38,.04,shaded);
  const orange=tree(planter,0,.36,0,.95,true);orange.name='marrakech-orange';
  for(const [x,y,z]of [[.35,1.75,.12],[.12,1.9,-.24],[-.38,1.68,.18],[-.12,1.55,.34],[.42,1.45,-.12]])ball(orange,.075,.075,.075,x,y,z,shaded);
  animations[key].push(t=>{orange.rotation.z=Math.sin(t*.35)*.009;orange.rotation.x=Math.cos(t*.28)*.006;});
  // Two lanterns and a little tablescape of mint tea.
  for(const x of [-1.92,1.92]){const l=lantern(g,x,2.02,-3.10,.44);animations[key].push(t=>{l.rotation.z=Math.sin(t*.45+x)*.045;l.rotation.x=Math.cos(t*.38+x)*.022;});}
  const t=group(g,0,0,.85);
  mesh(t,new THREE.CylinderGeometry(.56,.56,.055,8),0,.36,0,shaded);
  for(const a of [.4,2.5,4.6])rod(t,[Math.cos(a)*.36,.33,Math.sin(a)*.36],[Math.cos(a)*.44,.02,Math.sin(a)*.44],.022,shaded);
  const tray=group(t,0,.39,0);mesh(tray,new THREE.CylinderGeometry(.40,.40,.022,40),0,0,0,shaded);
  for(const [x,z]of [[-.18,.15],[.14,.16],[.03,-.16]]){
   const glass=group(tray,x,.02,z);cyl(glass,.052,.043,.095,0,.048,0,paper);cyl(glass,.044,.040,.008,0,.098,0,ink);
   line(glass,[[-.03,.11,0],[-.01,.15,.02],[.02,.13,.03]],true);
  }
  const teapot=group(tray,.03,.02,-.02);ball(teapot,.13,.10,.13,0,.10,0,shaded);cyl(teapot,.042,.050,.022,0,.20,0,ink);rod(teapot,[.10,.13,0],[.22,.20,0],.018,ink);cylinderRim(teapot,.135,.205,.018,shaded);
  steam(tray,key,.03,.32,.05,.26,.035);
  // A pigeon visits the fountain rim, then leaves.
  const pigeon=bird(g,-.9,.52,-2.15);pigeon.b.name='marrakech-pigeon';
  occasion(g,key,'pigeon',(u)=>{pigeon.b.visible=u>=0;const t=u<0?0:u;const land=Math.min(1,t*5),leave=Math.max(0,(t-.78)*5);pigeon.b.position.set(-.9-(1-land)*1.8+leave*2.2,.52+(1-land)*1.2+leave*1.4,-2.15);for(const {wing,side}of pigeon.wings)wing.rotation.z=side*((land<1||leave>0)?Math.sin(t*90)*.55:.08);},{start:14,duration:12,period:49,sound:'bird',pan:-.35});
  return g;
 }

 function oaxaca(){
  const key='oaxacaStudy',g=group(root);g.name='oaxaca';
  box(g,6.9,3.5,.20,0,1.75,-3.85,paper,.01);
  box(g,6.9,.08,6.6,0,-.04,-.35,paper,.02);
  floorTiles(g,-3.3,3.3,-3.5,2.8,1.12);
  // A painted door, a shuttered window, and a shelf of clay.
  const door=group(g,-1.95,0,-3.72);
  box(door,1.18,2.45,.10,0,1.23,0,shaded,.02);
  for(const y of [.65,1.35,2.05])rect(door,0,y,.055,.92,.52,.015,true);
  for(const x of [-.30,.30])ball(door,.028,.028,.016,x,1.28,.07,ink);rod(door,[.36,1.18,.08],[.36,1.38,.08],.012,ink);
  const win=group(g,1.80,0,-3.72);
  opening(win,0,1.78,0,1.30,1.32);
  box(win,.62,1.34,.06,-.94,1.78,.06,shaded,.01);box(win,.62,1.34,.06,.94,1.78,.06,shaded,.01);
  for(let i=0;i<4;i++)rod(win,[-.52-.18+i*.18,1.18,.13],[-.52-.18+i*.18,2.38,.13],.012,ink);
  for(let i=0;i<3;i++)rod(win,[.66+i*.18,1.18,.13],[.66+i*.18,2.38,.13],.012,ink);
  line(win,[[-.58,.18,.22],[.58,.19,.22]],true);
  box(g,1.0,.06,.22,.55,1.55,-3.62,shaded,.012);
  for(const x of [.32,.55,.78]){cyl(g,.10,.13,.20,x,1.68,-3.60,shaded);ellipse(g,.10,.06,x,1.79,-3.58,true);}
  // A niche with a candle, and dried chiles beside the door.
  const nicho=group(g,-.60,1.55,-3.73);
  box(nicho,.48,.78,.08,0,0,0,shaded,.02);rect(nicho,0,0,.05,.36,.64,.01,true);
  candle(g,-.60,1.63,-3.66,key);
  line(g,[[-2.58,2.42,-3.63],[-2.52,1.30,-3.63]],true);
  for(let i=0;i<8;i++)ball(g,.035,.055,.025,-2.57+Math.sin(i*2.3)*.12,1.30+i*.13,-3.62,dark);
  // Long table, runner, clay jug, two cups, and a bowl of fruit.
  const t=group(g,0,0,.94);
  box(t,1.38,.07,.74,0,.78,0,shaded,.015);
  for(const x of [-.56,.56])for(const z of [-.26,.26])rod(t,[x,.75,z],[x*1.04,.02,z*1.04],.026,shaded);
  box(t,1.16,.012,.43,0,.825,0,paper,.005);
  for(let i=0;i<3;i++)line(t,[[-.60,.834,-.16+i*.16],[.60,.835,-.15+i*.16]],false,false,false);
  const jug=group(t,-.44,.83,-.02);
  ball(jug,.14,.17,.13,0,.18,0,shaded);cyl(jug,.065,.075,.08,0,.34,0,shaded);rod(jug,[.12,.25,0],[.25,.18,0],.025,shaded);line(jug,[[-.06,.32,0],[0,.38,0],[.07,.32,0]],true);
  for(const x of [.13,.37]){const cup=group(t,x,.83,.12);cyl(cup,.060,.048,.075,0,.04,0,paper);ellipse(cup,.055,.055,0,.079,0,true);cyl(cup,.045,.045,.006,0,.08,0,ink);}
  steam(t,key,.44,.88,.26,.24,.03);
  const bowl=group(t,.47,.83,-.16);mesh(bowl,new THREE.CylinderGeometry(.20,.13,.10,24),0,.05,0,shaded);for(let i=0;i<5;i++)ball(bowl,.055,.050,.055,-.12+i*.06,.115,Math.sin(i)*.05,i%2?shaded:dark);
  // A woven chair at the corner of the table.
  const chair=group(g,2.08,0,.20);chair.rotation.y=-.22;
  box(chair,.55,.050,.50,0,.46,0,shaded,.012);
  for(const x of [-.22,.22]){rod(chair,[x,.44,-.20],[x,.02,-.24],.016,shaded);rod(chair,[x,.44,.20],[x,.02,.24],.016,shaded);rod(chair,[x,.45,-.21],[x,1.00,-.26],.016,shaded);}
  for(let i=0;i<5;i++)line(chair,[[-.23,.52+i*.10,-.245],[.23,.52+i*.10,-.245]]);
  // A ceiling fan, the afternoon's slowest clock.
  // Papel picado across the courtyard.
  const stringPts=[];for(let i=0;i<=24;i++){const x=-3.2+i*.267;stringPts.push([x,2.10-.09*Math.cos(i/24*Math.PI*2),-2.45]);}
  line(g,stringPts,false,false,false);
  for(let i=0;i<7;i++){
   const x=-2.6+i*.87;const pivot=group(g,x,2.28-Math.abs(x)*.035,-2.45);
   const shape=new THREE.Shape();shape.moveTo(-.22,-.02);shape.lineTo(.22,-.02);shape.lineTo(.19,-.36);shape.lineTo(-.19,-.36);shape.closePath();
   mesh(pivot,new THREE.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:false}),0,0,0,paper);
   const pts=shape.getPoints(4).map(v=>[v.x,v.y,.012]);line(pivot,pts,false,false,true);
   for(let j=0;j<4;j++){const yy=-.08-j*.07;line(pivot,[[-.12,yy,.014],[-.04,yy+.04,.014],[.04,yy,.014],[.12,yy+.04,.014]]);}
   animations[key].push(t=>{pivot.rotation.x=Math.sin(t*.9+i*.9)*.10;pivot.rotation.z=Math.cos(t*.7+i)*.035;});
  }
  // Bougainvillea climbing the shady wall.
  const pot=group(g,-2.58,0,-2.95);cyl(pot,.22,.16,.32,0,.16,0,shaded);cyl(pot,.24,.24,.045,0,.31,0,paper);
  const vine=group(g,-2.58,.30,-2.96);
  for(const [a,b,c]of [[[0,0,0],[-.12,1.0,.02],[-.05,2.10,.02]],[[-.10,.55,0],[.30,1.25,.01],[.18,1.86,.03]],[[-.08,1.20,0],[-.48,1.62,.01],[-.62,2.02,.02]]])line(vine,[a,b,c],true);
  for(let i=0;i<26;i++){const a=i*2.399,xx=Math.cos(a)*(.18+rnd()*.44),yy=.45+rnd()*1.65,zz=.03+rnd()*.10;const m=mesh(vine,new THREE.CircleGeometry(.045,5),xx,yy,zz,i%3?paper:shaded,false);m.rotation.z=a;}
  for(let i=0;i<9;i++){const a=i*2.1,xx=Math.cos(a)*.38,yy=.9+Math.sin(a*1.3)*.55;leaf(vine,[xx,yy,.05],[xx+.12,yy+.10,.06],.035);}
  animations[key].push(t=>{vine.rotation.z=Math.sin(t*.55)*.018;});
  // A hummingbird visits the flowers.
  const hb=group(g,-2.0,1.55,-2.95);hb.name='oaxaca-hummingbird';
  ball(hb,.045,.030,.060,0,0,0,shaded);ball(hb,.030,.030,.028,.045,.035,.01,shaded);line(hb,[[.075,.04,.02],[.16,.025,.02]],true);
  const hbWings=[];for(const side of [-1,1]){const w=group(hb,0,.02,.02);line(w,[[0,0,0],[side*.13,.05,0]],true);hbWings.push({w,side});}
  occasion(g,key,'hummingbird',(u)=>{hb.visible=u>=0;const t=u<0?0:u;hb.position.set(-2.3+Math.sin(t*7)*.42,1.52+Math.sin(t*9)*.12,-2.95+Math.cos(t*5)*.12);for(const {w,side}of hbWings)w.rotation.z=side*Math.sin(t*90)*.75;},{start:14,duration:9,period:43,sound:'hum',pan:-.4});
  return g;
 }

 function hanoi(){
  const key='hanoiStudy',g=group(root);g.name='hanoi';
  // A small balcony, low railing and a roof of corrugated tin.
  box(g,4.6,.10,2.8,0,-.05,2.0,paper,.02);
  for(let x=-2.3;x<=2.3;x+=.76)line(g,[[x,.006,.68],[x,.006,3.25]]);
  for(let z=.68;z<=3.25;z+=.76)line(g,[[-2.3,.006,z],[2.3,.006,z]],false,false,false);
  for(const x of [-2.2,2.2])rod(g,[x,0,2.8],[x,2.7,2.8],.06,shaded);
  const awning=box(g,4.6,.08,1.9,0,2.65,2.35,shaded,.02);awning.rotation.x=.08;
  for(let i=0;i<8;i++)line(g,[[-2.2+i*.55,2.72,1.45],[-2.2+i*.55,2.55,3.2]]);
  for(let i=0;i<9;i++){const x=-2.0+i*.50;rod(g,[x,0,.65],[x,.82,.65],.016,shaded);}
  box(g,4.2,.05,.09,0,.84,.65,shaded,.01);
  // The coffee rests on the rail; the street has the middle of the frame.
  const tray=group(g,.74,.86,.65);
  box(tray,.38,.022,.26,0,.011,0,shaded,.006);line(tray,[[-.16,.024,0],[0,.026,.02],[.16,.024,0]],true);
  const glass=group(tray,-.02,.025,.02);cyl(glass,.052,.044,.095,0,.048,0,paper);cyl(glass,.045,.041,.070,0,.055,0,shaded);ball(glass,.046,.012,.046,0,.104,0,paper);ellipse(glass,.050,.050,0,.108,0,true);
  steam(glass,key,-.02,.14,.02,.20,.03);
  // A woven mat under the seat keeps the balcony floor from feeling empty.
  const mat=group(g,-.25,.014,1.52);
  box(mat,1.35,.022,.82,0,0,0,paper,.008);
  for(let i=0;i<5;i++)line(mat,[[-.62,.014,-.34+i*.17],[.62,.014,-.34+i*.17]],i===0);
  for(let i=0;i<14;i++){const x=-.64+i*.10;line(mat,[[x,.014,-.41],[x,.014,-.36]],false,true);line(mat,[[x,.014,.36],[x,.014,.41]],false,true);}
  potPlant(g,-1.92,0,-.10,.48,false,key);
  // The narrow street, its rooftops, and the wires above it.
  box(g,16,.08,9,0,-1.84,-2.5,paper,.01);
  for(let i=0;i<6;i++)line(g,[[-7,-1.79,-4.5+i*1.0],[7,-1.79,-4.5+i*1.0]]);
  line(g,[[-7,-1.78,-2.2],[7,-1.78,-2.2]],true);
  for(let i=0;i<10;i++)line(g,[[-6.4+i*.1,-1.77,-2.18],[-5.7+i*.1,-1.77,-2.18]],true);
  {const road=[];for(let z=-.8;z>=-4.0;z-=.22)for(let x=-5.4;x<=5.4;x+=.58){const off=(Math.round(z*10)%2)*.28;road.push([[x+off,-1.786,z],[x+off+.20,-1.786,z]],[[x+off+.20,-1.786,z],[x+off+.10,-1.786,z+.18]],[[x+off+.10,-1.786,z+.18],[x+off-.10,-1.786,z+.18]]);}hatch(g,road);}
  line(g,[[-7,-1.775,-2.95],[7,-1.775,-2.95]],true);line(g,[[-7,-1.775,-4.35],[7,-1.775,-4.35]],true);
  box(g,14,.035,.55,0,-1.76,-4.45,shaded,.006);
  for(const [x,z]of [[-2.6,-1.1],[-1.2,-2.45],[2.1,-1.55]]){const puddle=group(g,x,-1.77,z);ellipse(puddle,.42,.18,0,0,0);ellipse(puddle,.30,.12,0,.004,0);ellipse(puddle,.16,.07,0,.008,0);}
  for(let i=0;i<7;i++){const x=-2.3+i*.72;line(g,[[x,-1.77,-1.55],[x+.34,-1.77,-1.55]],true);line(g,[[x,-1.77,-1.22],[x+.34,-1.77,-1.22]],true);}
  steam(g,key,1.9,-1.75,-1.55,.55,.05);

  for(let i=0;i<5;i++)line(g,[[-1.5+i*.75,-1.77,-2.8],[-1.1+i*.75,-1.77,-2.8]],true);
  box(g,14,.14,.30,0,-1.70,-4.70,shaded,.02);
  for(let i=0;i<7;i++){const x=-2.2+i*.55;line(g,[[x,-1.77,-2.55],[x+.30,-1.77,-2.55]],true);}
  for(const [x,w,h]of [[-3.4,1.55,4.8],[-1.7,1.7,5.2],[.1,1.8,4.5],[1.9,1.7,5.0],[3.6,1.5,4.6]])townhouse(g,x,-4.85,w,h,key);
  // A street tree and farther roofs soften the row.
  const streetTree=tree(g,3.95,-1.8,-2.95,1.18,true);streetTree.name='hanoi-tree';
  animations[key].push(t=>{streetTree.rotation.z=Math.sin(t*.35)*.006;});
  for(const [x,w,h]of [[-4.2,.9,3.8],[-3.1,1.0,4.6],[-1.2,1.2,3.5],[.9,1.0,4.4],[2.7,1.1,3.8],[4.4,.9,4.2]]){
   const b=group(g,x,-1.8,-7.6);box(b,w,h,.5,0,h/2,0,paper,.01);line(b,[[ -w*.55,h+.02,.2],[0,h+.22,.2],[w*.55,h+.02,.2]],true);rect(b,0,h*.62,.27,.22,.30,.01);
  }
  // Signs, laundry and lanterns.
  const sign=group(g,-1.56,.76,-4.54);sign.scale.setScalar(1.35);const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,512,128);ctx.fillStyle='#171717';ctx.font='58px Georgia';ctx.textAlign='center';ctx.fillText('PHỞ',256,88);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;sign.add(new THREE.Mesh(new THREE.PlaneGeometry(.9,.225),new THREE.MeshBasicMaterial({map:texture})));
  line(g,[[-4.6,1.55,-3.95],[-1,1.28,-3.95],[2.5,1.50,-3.95],[5,1.32,-3.95]],true);
  line(g,[[-4.6,.78,-4.25],[-1,.60,-4.25],[2.5,.88,-4.25],[5,.68,-4.25]]);
  const laundry=[];for(const [x,y,z]of [[-2.8,1.08,-4.02],[-2.25,.98,-4.02],[2.9,1.12,-4.02]]){const pivot=group(g,x,y,z);box(pivot,.30,.42,.012,0,-.21,0,paper,.004);rect(pivot,0,-.21,.008,.30,.42,.003,true);line(pivot,[[-.10,.00,.012],[-.06,-.18,.012],[.06,-.30,.012]],true);laundry.push({pivot,phase:x});}
  animations[key].push(t=>{for(const {pivot,phase}of laundry){pivot.rotation.z=Math.sin(t*.8+phase)*.10;pivot.rotation.x=Math.cos(t*.65+phase)*.04;}});
  for(const [x,y,z]of [[-.85,.82,-3.9],[1.25,.76,-3.9]]){const l=lantern(g,x,y,z,.50);animations[key].push(t=>{l.rotation.z=Math.sin(t*.5+x)*.05;l.rotation.x=Math.cos(t*.42+x)*.025;});}
  // Birds stitching the sky.
  for(let i=0;i<3;i++){const b=line(g,[[-.09,0,0],[0,.035,0],[.09,0,0]]);const phase=i*2.1;animations[key].push(t=>{b.position.set(-3+i*2.8+Math.sin(t*.10+phase),1.75+i*.14,-5.4);});}
  // Traffic, slow enough to watch. One lane passes close to the balcony.
  for(let i=0;i<3;i++)scooter(g,key,i*5.2,1.15,-1.15-i*.34);
  scooter(g,key,5.5,0,-1.02);scooter(g,key,6.35,0,-1.35);scooter(g,key,7.15,0,-1.08);
  {const l=lantern(g,-1.60,.52,-2.35,.22);animations[key].push(t=>{l.rotation.z=Math.sin(t*.55-1.6)*.06;});}
  // A flower seller crosses below, baskets on a shoulder pole.
  const vendor=group(g,0,-1.78,-1.62);vendor.name='hanoi-vendor';
  const seller=person(vendor,0,0,0,.92,false,false);
  const hat=mesh(seller,new THREE.ConeGeometry(.25,.13,24),0,1.36,0,shaded);hat.rotation.z=.02;
  rod(seller,[-.68,1.02,0],[.68,1.02,0],.018,ink);
  for(const side of [-1,1]){rod(seller,[side*.62,1.00,0],[side*.62,.60,0],.008,ink);const basket=group(seller,side*.62,.55,0);mesh(basket,new THREE.CylinderGeometry(.18,.14,.18,16),0,0,0,shaded);ellipse(basket,.18,.18,0,.10,0,true);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(basket,[[Math.cos(a)*.10,.10,Math.sin(a)*.10],[Math.cos(a)*.12,.24,Math.sin(a)*.12]]);}}
  occasion(g,key,'flower-seller',(u)=>{vendor.visible=u>=0;const t=u<0?0:u;vendor.position.x=-6.5+13*t;vendor.position.y=-1.78+Math.abs(Math.sin(t*Math.PI*30))*.025;vendor.rotation.y=Math.PI/2;seller.userData.upper.rotation.z=Math.sin(t*30)*.02;},{start:14,duration:22,period:55,sound:'bicycle',pan:-.4});
  return g;
 }
 function kenya(){
  const key='kenyaStudy',g=group(root);g.name='kenya';
  // A timber veranda, open to the highland air.
  box(g,5.0,.10,4.8,0,-.05,1.4,paper,.02);
  for(let i=0;i<9;i++)line(g,[[-2.5,.006,-.9+i*.5],[2.5,.006,-.9+i*.5]]);
  for(const x of [-2.35,2.35]){rod(g,[x,0,-.9],[x,2.62,-.9],.040,plain);}
  // Only a narrow eave above; the hills keep the sky.
  box(g,5.1,.10,.95,0,2.68,-.58,plain,.02);
  for(let i=0;i<10;i++)line(g,[[-2.45+i*.54,2.61,-.12],[-2.45+i*.54,2.64,-1.02]]);
  for(let i=0;i<8;i++){const x=-2.15+i*.61;rod(g,[x,0,-1.2],[x,.82,-1.2],.016,shaded);}
  rod(g,[-2.3,.84,-1.2],[2.3,.84,-1.2],.030,shaded);
  const t=group(g,.18,0,1.12);
  box(t,.92,.06,.56,0,.62,0,shaded,.02);
  for(const x of [-.36,.36])for(const z of [-.19,.19])rod(t,[x,.60,z],[x,.02,z],.022,shaded);
  const mug=group(t,.30,.65,.14);cyl(mug,.075,.063,.13,0,.065,0,paper);ellipse(mug,.075,.075,0,.132,0,true);
  rod(mug,[.070,.040,0],[.115,.070,0],.012,paper);rod(mug,[.115,.070,0],[.100,.112,0],.012,paper);
  steam(mug,key,0,.14,0,.24,.03);
  const kettle=group(t,-.28,.65,-.08);ball(kettle,.12,.085,.11,0,.09,0,shaded);cyl(kettle,.050,.058,.022,0,.17,0,ink);
  cyl(kettle,.018,.025,.075,-.10,.12,0,shaded);rod(kettle,[.09,.12,0],[.16,.17,0],.014,ink);cylinderRim(kettle,.100,.19,.012,shaded);
  // Tea rows, cut into the hillside.
  for(let r=0;r<11;r++){
   const z=-3.0-r*1.16,base=.06+r*.105,pts=[],seg=[];
   for(let x=-10;x<=10;x+=.7){const y=base+.24*Math.sin(x*.22+r*.7)+.065*Math.sin(x*.55+r);pts.push([x,y,z]);}
   line(g,pts,r===0);
   for(let x=-10;x<=10;x+=.16){const y=base+.24*Math.sin(x*.22+r*.7)+.065*Math.sin(x*.55+r);seg.push([[x,y,z],[x+.035,y-.13,z]],[[x+.10,y-.01,z],[x+.125,y-.145,z]]);}
   hatch(g,seg);
  }
  line(g,[[-6,.02,-3.5],[-3,.06,-5],[-1,.10,-7],[1,.12,-9]],true);
  line(g,[[-5.8,.02,-3.6],[-2.8,.06,-5.1],[-.8,.10,-7.1],[1.2,.12,-9.1]],true);
  // Long ridges and the far edge of the estate.
  line(g,[[-14,.75,-17],[-8,.92,-17],[-3,.82,-17],[3,.96,-17],[9,.88,-17],[14,.98,-17]],true);
  line(g,[[-18,1.28,-24],[-9,1.48,-24],[-2,1.38,-24],[6,1.52,-24],[16,1.42,-24]],true);
  line(g,[[-22,1.55,-30],[-12,1.76,-30],[-4,1.64,-30],[5,1.82,-30],[15,1.68,-30],[22,1.78,-30]]);
  const farMist=[];for(let i=0;i<3;i++){const m=group(g,0,1.10+i*.10,-19-i*1.5),seg=[];for(let j=0;j<14;j++){const x=-10+j*1.45;seg.push([[x,.02,0],[x+.46,.03,0]]);}hatch(m,seg);farMist.push({m,phase:i*2.3});}
  animations[key].push(t=>{farMist.forEach(({m,phase})=>{m.position.x=Math.sin(t*.04+phase)*.5;});});
  for(const [x,z,s]of [[-4.8,-6.8,1.30],[4.6,-8.6,1.10],[-3.2,-11.8,.78]]){const a=acacia(g,x,.05,z,s);a.name='kenya-acacia';animations[key].push(t=>a.rotation.z=Math.sin(t*.35+x)*.009);}
  for(const [x,z]of [[-7,-5.5],[6,-6.2],[-2.6,-11],[8,-12.5]])tree(g,x,.02,z,.45,true);
  // Mist, and a drift of birds above the rows.
  const mist=[];for(let i=0;i<4;i++){const m=group(g,0,.78+i*.15,-10.5-i*1.5),seg=[];for(let j=0;j<20;j++){const x=-8+j*.86;seg.push([[x,.02+Math.sin(j*1.7+i)*.04,0],[x+.34,.03+Math.sin(j*1.7+i)*.04,0]]);}hatch(m,seg);mist.push({m,phase:i*2.1});}
  animations[key].push(t=>{mist.forEach(({m,phase})=>{m.position.x=Math.sin(t*.05+phase)*.35;});});
  for(let i=0;i<3;i++){const b=line(g,[[-.10,0,0],[0,.04,0],[.10,0,0]]);const phase=i*2.4;animations[key].push(t=>{b.position.set(-4+i*3+Math.sin(t*.06+phase),1.85+i*.13,-15);});}
  // A picker moves along a row; a bird visits the rail.
  const picker=group(g,0,.12,-5.2);picker.name='kenya-picker';
  const walker=person(picker,0,0,0,.82,false,false);
  mesh(walker,new THREE.ConeGeometry(.30,.10,24),0,1.34,0,shaded);
  const basket=group(walker,.34,.55,0);mesh(basket,new THREE.CylinderGeometry(.17,.13,.20,16),0,0,0,shaded);ellipse(basket,.17,.17,0,.11,0,true);for(let i=0;i<5;i++)line(basket,[[-.10+i*.05,.10,.03],[-.12+i*.05,.27,.03]]);
  occasion(g,key,'first-picking',(u)=>{picker.visible=u>=0;const t=u<0?0:u;picker.position.x=-5+10*t;picker.position.y=.12+Math.abs(Math.sin(t*Math.PI*24))*.018;walker.userData.upper.rotation.z=Math.sin(t*24)*.025;},{start:15,duration:20,period:55,sound:'footsteps',pan:-.4});
  const visitor=bird(g,1.6,.86,-1.1);visitor.b.name='kenya-visitor';
  occasion(g,key,'weaver-bird',(u)=>{visitor.b.visible=u>=0;const t=u<0?0:u;const enter=Math.min(1,t*4),leave=Math.max(0,(t-.8)*5);visitor.b.position.set(1.6+(1-enter)*.9+leave*.9,.86+(1-enter)*1.0+leave*1.0,-1.1);for(const {wing,side}of visitor.wings)wing.rotation.z=side*((enter<1||leave>0)?Math.sin(t*100)*.55:.06);},{start:9,duration:8,period:39,sound:'bird',pan:.5});
  const chime=group(g,-1.85,2.42,.55);
  rod(chime,[0,0,0],[0,-.22,0],.004,ink);ball(chime,.07,.032,.07,0,-.27,0,shaded);
  for(let i=0;i<3;i++){const a=i*2.1;line(chime,[[Math.cos(a)*.06,-.30,Math.sin(a)*.06],[Math.cos(a)*.05,-.42,Math.sin(a)*.05]],true);}
  line(chime,[[0,-.31,0],[.14,-.44,.02]],true);
  animations[key].push(t=>{chime.rotation.z=Math.sin(t*.52)*.07;chime.rotation.x=Math.cos(t*.43)*.035;});
  return g;
 }
 return {kyoto,marrakech,oaxaca,hanoi,kenya};
}
