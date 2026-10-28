import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { penPaper } from './pen-material.js';

// Actual volumes and surface-attached ink. The Midjourney drawings are only
// references: no image planes, cutouts or projected artwork enter these worlds.
export function createReferenceScenes({root,animations}) {
  const ink=new THREE.MeshBasicMaterial({color:0x171717});
  const plain=new THREE.MeshBasicMaterial({color:0xffffff});
  const paper=penPaper(), shaded=penPaper(.34), dark=penPaper(.68);
  const lineInk=new THREE.LineBasicMaterial({color:0x171717});
  const lineWhite=new THREE.LineBasicMaterial({color:0xffffff});
  const outline=new THREE.MeshBasicMaterial({color:0x171717,side:THREE.BackSide});
  const viewport=new THREE.Vector2(1000,700);
  outline.onBeforeCompile=shader=>{
    shader.uniforms.penViewport={value:viewport};
    shader.vertexShader='uniform vec2 penViewport;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vec2 d=(projectionMatrix*vec4(normalMatrix*normal,0.)).xy*penViewport;
      d/=max(length(d),.001);
      float pressure=1.65+.3*sin(position.y*23.+position.x*31.);
      gl_Position.xy+=d*pressure/penViewport*gl_Position.w;`);
  };
  outline.customProgramCacheKey=()=> 'reference-pen-outline-4';
  let seed=418;
  const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const V=(a)=>new THREE.Vector3(...a);
  const group=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  function mesh(p,geo,x=0,y=0,z=0,mat=paper,edge=true){
    const a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);a.setXYZ(i,x+Math.sin(y*8+z*3)*.0025,y+Math.sin(x*7+z*5)*.002,z+Math.sin(x*9+y*4)*.002);}
    geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);p.add(m);
    if(edge&&mat!==ink){const e=new THREE.Mesh(geo,outline);e.onBeforeRender=r=>r.getSize(viewport);m.add(e);}
    return m;
  }
  const box=(p,w,h,d,x,y,z,mat=paper,r=.015)=>mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w*.23,h*.23,d*.23)),x,y,z,mat);
  function ball(p,rx,ry,rz,x,y,z,mat=paper){const geo=new THREE.SphereGeometry(1,28,18);geo.scale(rx,ry,rz);return mesh(p,geo,x,y,z,mat);}
  function cyl(p,rt,rb,h,x,y,z,mat=paper){return mesh(p,new THREE.CylinderGeometry(rt,rb,h,36),x,y,z,mat);}
  function line(p,points,heavy=false,white=false,closed=false){
    const curve=new THREE.CatmullRomCurve3(points.map(V),closed,'centripetal');
    const samples=curve.getPoints(Math.max(16,points.length*9));
    const g=new THREE.BufferGeometry().setFromPoints(samples);
    const m=new THREE.Line(g,white?lineWhite:lineInk);p.add(m);
    if(heavy&&!white){const second=samples.map((v,i)=>v.clone().add(new THREE.Vector3(Math.sin(i*.8)*.004,.003,Math.cos(i*.6)*.002)));m.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(second),lineInk));}
    return m;
  }
  function segment(p,a,b,heavy=false){return line(p,[a,b],heavy);}
  function rod(p,a,b,r=.015,mat=paper){const av=V(a),bv=V(b),d=bv.clone().sub(av);const m=cyl(p,r,r,d.length(),...av.clone().add(bv).multiplyScalar(.5).toArray(),mat);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  function ellipse(p,rx,rz,x,y,z,heavy=false){const pts=[];for(let i=0;i<=60;i++){const a=i/60*Math.PI*2;pts.push([x+Math.sin(a)*rx,y+Math.sin(a*7)*.0015,z+Math.cos(a)*rz]);}return line(p,pts,heavy);}
  function rect(p,x,y,z,w,h,r=.025,heavy=false){
    const shape=new THREE.Shape(),l=x-w/2,rr=x+w/2,b=y-h/2,t=y+h/2;
    shape.moveTo(l+r,b);shape.lineTo(rr-r,b);shape.quadraticCurveTo(rr,b,rr,b+r);shape.lineTo(rr,t-r);shape.quadraticCurveTo(rr,t,rr-r,t);shape.lineTo(l+r,t);shape.quadraticCurveTo(l,t,l,t-r);shape.lineTo(l,b+r);shape.quadraticCurveTo(l,b,l+r,b);
    const pts=shape.getPoints(10).map(v=>[v.x,v.y,z]);return line(p,pts,heavy);
  }
  function hatch(p,segments){const positions=[];for(const [a,b] of segments){const mid=V(a).lerp(V(b),.5);mid.x+=(rnd()-.5)*.008;mid.y+=(rnd()-.5)*.006;positions.push(...a,...mid.toArray(),...mid.toArray(),...b);}const m=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),lineInk);p.add(m);return m;}
  function shadow(p,x,y,z,rx,rz,count=50){const seg=[];for(let i=0;i<count;i++){const u=rnd()*2-1,v=rnd()*2-1;if(u*u+v*v>1)continue;const xx=x+u*rx,zz=z+v*rz;seg.push([[xx,y,zz],[xx+.06+rnd()*.09,y+.001,zz+.025+rnd()*.04]]);}return hatch(p,seg);}
  function wallHatch(p,x,y,z,w,h,count=50){const seg=[];for(let i=0;i<count;i++){const xx=x+(rnd()-.5)*w,yy=y+(rnd()-.5)*h;seg.push([[xx,yy,z],[xx+.035+rnd()*.035,yy+.07+rnd()*.1,z+.001]]);}return hatch(p,seg);}
  function window(p,x,y,z,w,h,{cross=false,rounded=.025}={}){
    rect(p,x,y,z,w,h,rounded,true);rect(p,x,y,z+.018,w-.10,h-.10,Math.max(.02,rounded-.05));rect(p,x,y,z+.032,w-.21,h-.21,Math.max(.015,rounded-.10),true);
    // Geometry outside the opening is hidden by the white wall around it.
    for(const [ww,hh,xx,yy]of [[20,15,x-w/2-10,y],[20,15,x+w/2+10,y],[w,15,x,y+h/2+7.5],[w,15,x,y-h/2-7.5]])mesh(p,new THREE.PlaneGeometry(ww,hh),xx,yy,z-.012,plain,false);
    const sill=box(p,w+.16,.10,.40,x,y-h/2-.025,z+.13,shaded,.015);
    for(let i=0;i<3;i++)line(p,[[x-w/2-.08,y-h/2-.025-i*.035,z+.33],[x,y-h/2-.02-i*.035,z+.35],[x+w/2+.08,y-h/2-.025-i*.035,z+.33]],i===0);
    if(cross){box(p,.065,h-.15,.07,x,y,z+.05);box(p,w-.17,.045,.07,x,y+.1,z+.05);}
    return sill;
  }
  function rain(p,key,x,y,z,w,h,count=20,snow=false){const drops=[];for(let i=0;i<count;i++){const u=rnd(),v=rnd(),g=group(p,x+(u-.5)*w,y+(v-.5)*h,z);if(snow){const pts=[];for(let a=0;a<=6;a++)pts.push([Math.cos(a/6*6.28)*.012,Math.sin(a/6*6.28)*.012,0]);line(g,pts);}else line(g,[[0,.022,0],[-.008,0,.001],[-.022,-.025,0]]);drops.push({g,u,v});}animations[key].push(t=>drops.forEach(({g,u,v})=>{g.position.y=y+(((v-t*(snow?.012:.038))%1+1)%1-.5)*h;g.position.x=x+(u-.5)*w+(snow?Math.sin(t*.5+v*8)*.015:0);}));}
  function saucer(p,x,y,z,r=.34){const profile=[[0,.012],[r*.35,.012],[r*.60,.018],[r*.85,.04],[r,.055],[r*.99,.042],[r*.82,.018],[r*.36,0]].map(a=>new THREE.Vector2(...a));const m=mesh(p,new THREE.LatheGeometry(profile.reverse(),64),x,y,z);ellipse(p,r,r,x,y+.05,z,true);shadow(p,x-.10,y-.003,z+.04,r*1.2,r*.75,65);return m;}
  function cup(p,x,y,z,key,scale=1,tall=false){const g=group(p,x,y,z);g.scale.setScalar(scale);const h=tall?.32:.255,r=tall?.13:.205;
    const profile=new THREE.CubicBezierCurve(new THREE.Vector2(r*.66,0),new THREE.Vector2(r*.84,.02),new THREE.Vector2(r*.98,h*.48),new THREE.Vector2(r,h)).getPoints(22);
    profile.push(new THREE.Vector2(r*.94,h),new THREE.Vector2(r*.93,h-.065));
    mesh(g,new THREE.LatheGeometry(profile,60),0,.015,0);
    cyl(g,r*.91,r*.91,.003,0,h-.048,0,ink);ellipse(g,r,r,0,h+.015,0,true);ellipse(g,r*.91,r*.91,0,h-.013,0);
    const handlePts=[[r*.98,h*.78,0],[r*1.42,h*.80,0],[r*1.57,h*.58,0],[r*1.4,h*.32,0],[r*.88,h*.23,0]];
    const handle=new THREE.CatmullRomCurve3(handlePts.map(V));mesh(g,new THREE.TubeGeometry(handle,36,.022,10,false),0,0,0);
    const marks=[];for(let i=0;i<28;i++){const a=1.8+rnd()*1.1,xx=Math.cos(a)*r,zz=Math.sin(a)*r;marks.push([[xx,h*.22,zz],[xx*.98,h*(.65+rnd()*.3),zz*.98]]);}hatch(g,marks);
    const steam=group(g,0,h+.03,0);for(let i=0;i<2;i++)line(steam,[[i*.07-.04,0,0],[i*.07-.05,.08,0],[i*.07-.025,.15,0],[i*.07-.03,.21,0]]);
    animations[key].push(t=>{steam.rotation.y=Math.sin(t*.35)*.13;steam.scale.y=.9+Math.sin(t*.5)*.06;});return g;
  }
  function coffee(p,x,y,z,key,scale=1){const g=group(p,x,y,z);g.scale.setScalar(scale);saucer(g,0,0,0);cup(g,0,.025,0,key);return g;}
  function book(p,x,y,z,w=.53,d=.38,angle=0){const g=group(p,x,y,z);g.rotation.y=angle;box(g,w,.065,d,0,0,0,shaded,.008);box(g,w+.02,.012,d+.02,0,.04,0);box(g,w+.02,.012,d+.02,0,-.04,0);for(let i=0;i<4;i++)line(g,[[-w*.46,-.025+i*.014,d*.505],[0,-.025+i*.014,d*.505],[w*.46,-.026+i*.014,d*.505]]);return g;}
  function bistroTable(p,x,z,r=.9,h=.82){const g=group(p,x,0,z);cyl(g,r,r,.035,0,h,0);ellipse(g,r,r,0,h+.018,0,true);cyl(g,.045,.065,h-.06,0,h/2,0,shaded);for(let i=0;i<3;i++){const a=i*2.094;line(g,[[0,.24,0],[Math.sin(a)*.13,.12,Math.cos(a)*.13],[Math.sin(a)*.44,.04,Math.cos(a)*.44]],true);rod(g,[0,.24,0],[Math.sin(a)*.43,.04,Math.cos(a)*.43],.018,shaded);}shadow(g,-.10,.012,.06,r*.7,r*.42,55);return g;}
  function bentChair(p,x,z,angle=0,home=false){const g=group(p,x,0,z);g.rotation.y=angle;cyl(g,.27,.28,.04,0,.48,0,shaded);ellipse(g,.28,.28,0,.50,0,true);
    for(const xx of [-.22,.22])for(const zz of [-.20,.20])rod(g,[xx,.49,zz],[xx*1.3,.02,zz*1.3],.013,shaded);
    const path=new THREE.CatmullRomCurve3([[-.27,.48,-.20],[-.29,1.03,-.23],[-.20,1.20,-.24],[.20,1.20,-.24],[.29,1.03,-.23],[.27,.48,-.20]].map(V));mesh(g,new THREE.TubeGeometry(path,70,.023,10,false),0,0,0,shaded);
    if(home){for(const xx of [-.14,.14])rod(g,[xx,.50,-.23],[xx,1.17,-.23],.008,shaded);for(const yy of [.66,.84,1.01])line(g,[[-.27,yy,-.225],[0,yy+.006,-.225],[.27,yy,-.225]]);for(const xx of [-.28,.28])ball(g,.038,.045,.038,xx,1.22,-.23,shaded);}
    else{const inner=new THREE.CatmullRomCurve3([[-.19,.50,-.23],[-.19,.96,-.25],[0,1.10,-.25],[.19,.96,-.25],[.19,.50,-.23]].map(V));mesh(g,new THREE.TubeGeometry(inner,48,.013,8,false),0,0,0,shaded);}
    return g;
  }
  function upholstered(p,x,z,angle=0){const g=group(p,x,0,z);g.rotation.y=angle;box(g,1.0,.25,.91,0,.46,0,shaded,.12);const back=box(g,1.04,1.05,.23,0,.94,-.37,shaded,.17);back.rotation.x=-.08;for(const xx of [-.49,.49]){box(g,.21,.42,.88,xx,.67,.0,shaded,.10);line(g,[[xx,.89,-.29],[xx,.91,.05],[xx,.85,.34]],true);}rect(g,0,1.02,-.23,.77,.75,.18);line(g,[[-.39,.61,.31],[0,.59,.36],[.39,.61,.31]],true);for(const xx of [-.37,.37])for(const zz of [-.30,.30])rod(g,[xx,.37,zz],[xx*1.12,.02,zz*1.12],.033,shaded);shadow(g,0,.01,.08,.6,.43,75);return g;}
  function readingLamp(p,x,y,z,s=1){const g=group(p,x,y,z);g.scale.setScalar(s);cyl(g,.12,.15,.025,0,.012,0,ink);const path=new THREE.CatmullRomCurve3([[0,0,0],[-.03,.32,0],[-.16,.64,0],[-.28,.78,0],[-.40,.78,0],[-.47,.68,0]].map(V));mesh(g,new THREE.TubeGeometry(path,40,.010,8,false),0,0,0,ink,false);const profile=new THREE.CubicBezierCurve(new THREE.Vector2(.14,0),new THREE.Vector2(.13,.07),new THREE.Vector2(.07,.12),new THREE.Vector2(.025,.12)).getPoints(15);mesh(g,new THREE.LatheGeometry(profile,36),-.47,.55,0,dark);return g;}
  function tree(p,x,y,z,s=1,leaves=true){const g=group(p,x,y,z);g.scale.setScalar(s);
    const trunk=new THREE.CatmullRomCurve3([[0,0,0],[.035,.7,.01],[-.035,1.45,0],[.07,2.15,.02]].map(V));mesh(g,new THREE.TubeGeometry(trunk,32,.038,9,false),0,0,0,shaded);line(g,[[-.035,0,.04],[-.01,.8,.05],[-.06,1.4,.04],[.025,2.12,.05]],true);
    const twigs=[];for(let i=0;i<12;i++){const a=i*2.399,r=.48+rnd()*.5,cx=Math.cos(a)*r,cy=2.2+Math.sin(a)*r*.65,cz=(rnd()-.5)*.6;line(g,[[0,1.1+i*.045,0],[cx*.45,1.8,cz*.4],[cx,cy,cz]],i<4);for(let j=0;j<3;j++){const tx=cx+(rnd()-.5)*.45,ty=cy+(rnd()-.3)*.4,tz=cz+(rnd()-.5)*.25;line(g,[[cx*.6,1.95,cz*.7],[cx,cy,cz],[tx,ty,tz]]);twigs.push([tx,ty,tz]);}}
    if(leaves){const seg=[];for(let i=0;i<600;i++){const a=rnd()*6.283,r=Math.sqrt(rnd()),xx=Math.cos(a)*r*1.12,yy=2.25+Math.sin(a)*r*.8,zz=(rnd()-.5)*.65;const size=.018+rnd()*.04;seg.push([[xx,yy,zz],[xx+size,yy+.025,zz+.01]],[[xx+size,yy+.025,zz+.01],[xx+size*.8,yy-.015,zz]],[[xx+size*.8,yy-.015,zz],[xx,yy,zz]]);}hatch(g,seg);for(let i=0;i<8;i++)wallHatch(g,(rnd()-.5)*1.2,2.15+(rnd()-.5)*.7,.24,.4,.3,35);}
    return g;
  }
  function fir(p,x,y,z,s=1){const g=group(p,x,y,z);g.scale.setScalar(s);rod(g,[0,0,0],[0,1.6,0],.018,shaded);const seg=[];for(let k=0;k<14;k++){const yy=.18+k*.095,width=(1.65-yy)*.27;for(let j=0;j<7;j++){const a=j/7*6.283;const xx=Math.cos(a)*width,zz=Math.sin(a)*width;seg.push([[0,yy+.15,0],[xx,yy-.025,zz]]);for(let n=1;n<5;n++){const u=n/5;seg.push([[xx*u,yy+.15-.175*u,zz*u],[xx*u*1.07,yy+.15-.175*u-.08,zz*u*1.1]]);}}}hatch(g,seg);return g;}
  function person(p,x,y,z,s=1,coat=false,seated=false){const g=group(p,x,y,z);g.scale.setScalar(s);ball(g,.065,.09,.055,0,1.15,0);ball(g,.035,.018,.025,.06,1.15,.015);const torso=box(g,.18,.37,.12,-.01,.88,0,coat?dark:paper,.05);torso.rotation.z=.06;ball(g,.075,.024,.06,0,1.24,0,shaded);line(g,[[-.08,1.01,.03],[-.16,.83,.04],[-.03,.80,.1]],true);for(const side of [-1,1]){const a=[side*.04,.70,0],b=[side*.075,seated?.50:.39,seated?.15:0],c=[side*.11,seated?.12:.03,seated?.18:.035];rod(g,a,b,.020,coat?shaded:paper);rod(g,b,c,.017,shaded);ball(g,.065,.025,.045,c[0]+.025,c[1],c[2],ink);}return g;}
  function pastry(p,x,y,z,s=1){const g=group(p,x,y,z);g.scale.setScalar(s);const pts=[[-.19,0,.09],[-.14,.035,-.035],[0,.07,-.09],[.14,.035,-.035],[.19,0,.09]];const path=new THREE.CatmullRomCurve3(pts.map(V));const geo=new THREE.TubeGeometry(path,60,.065,12,false),a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const u=Math.floor(i/13)/60,c=path.getPointAt(u),k=.2+.8*Math.sin(Math.PI*u);a.setXYZ(i,c.x+(a.getX(i)-c.x)*k,c.y+(a.getY(i)-c.y)*k,c.z+(a.getZ(i)-c.z)*k);}mesh(g,geo);
    for(let i=1;i<9;i++){const u=i/10,c=path.getPointAt(u),t=path.getTangentAt(u),side=new THREE.Vector3(-t.z,0,t.x),r=.065*(.2+.8*Math.sin(Math.PI*u));const fold=[];for(let j=0;j<12;j++){const q=j/11*Math.PI;fold.push(c.clone().addScaledVector(side,Math.cos(q)*r*1.015).add(new THREE.Vector3(0,Math.sin(q)*r*1.015,0)).toArray());}line(g,fold,i%3===0);}shadow(g,0,-.04,0,.23,.12,50);return g;
  }
  function cat(p,x,y,z,key){const g=group(p,x,y,z);g.rotation.y=-.18;ball(g,.32,.13,.20,0,0,0,shaded);ball(g,.145,.105,.12,.24,-.006,.10,shaded);for(const xx of [.15,.33]){const shape=new THREE.Shape();shape.moveTo(-.055,0);shape.lineTo(0,.135);shape.lineTo(.055,0);shape.closePath();mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),xx,.055,.1,shaded);}
    const tailPath=new THREE.CatmullRomCurve3([[-.24,0,.1],[-.36,-.04,.20],[-.43,-.1,.28],[-.54,-.11,.29]].map(V));mesh(g,new THREE.TubeGeometry(tailPath,35,.026,8,false),0,0,0,shaded);
    for(const xx of [.19,.29])line(g,[[xx-.025,.015,.218],[xx,.001,.225],[xx+.025,.013,.218]],true);
    for(let i=0;i<3;i++)for(const side of [-1,1])line(g,[[.25,-.025,.223],[.25+side*.13,-.025+i*.022,.25]]);
    line(g,[[.19,-.07,.21],[.30,-.075,.25],[.35,-.064,.23]],true);shadow(p,x-.03,y-.12,z+.03,.4,.16,55);
    animations[key].push(t=>g.scale.y=1+Math.sin(t*.7)*.018);return g;
  }
  function home(){const key='homeStudy',g=group(root);window(g,0,2.35,-1.9,3.5,2.0);for(const xx of [-1.58,1.58])box(g,.055,2.0,.14,xx,2.35,-1.81,shaded);box(g,.055,2.0,.14,.93,2.35,-1.81,shaded);
    // Short retraced marks describe the sash and wood grain, not a clean diagram.
    wallHatch(g,-1.65,2.3,-1.72,.055,1.9,35);wallHatch(g,1.55,2.4,-1.72,.055,1.9,30);
    for(let i=0;i<11;i++){const xx=-1.8+rnd()*3.6;line(g,[[xx,1.24-rnd()*.12,-1.56],[xx+.15+rnd()*.35,1.25-rnd()*.12,-1.55]]);}
    for(const [xx,yy,ww]of [[-1.3,2.9,.45],[.2,3.0,.4],[1.5,3.2,.4]]){rect(g,xx,yy,-4.7,ww,.73,.025);wallHatch(g,xx-ww*.36,yy,-4.69,ww*.10,.65,12);line(g,[[xx-ww*.65,yy-.41,-4.65],[xx+ww*.65,yy-.41,-4.65]]);}
    rain(g,key,0,2.35,-2.03,3.12,1.76,28);cat(g,-.56,1.53,-1.62,key);
    const t=bistroTable(g,.08,.95,1.6);coffee(t,0,.85,.05,key,1.34);const c=bentChair(g,1.40,-.95,-.10,true);c.scale.setScalar(1.35);return g;}
  function cafeFacade(p,x,z){const f=group(p,x,0,z);f.rotation.y=-.10;box(f,5.7,6.8,.8,0,3.4,0,paper,.008);
    // Shopfront recess, glazing bars, pilasters and the sloped canvas canopy.
    box(f,5.25,1.65,.08,0,.91,.45,dark);for(let i=0;i<6;i++){const xx=-2.35+i*.94;box(f,.055,1.58,.12,xx,.91,.56,shaded);rect(f,xx+.40,.93,.53,.72,1.40,.015);}
    for(const xx of [-2.7,2.7]){box(f,.18,2.14,.28,xx,1.07,.52,shaded);box(f,.29,.12,.36,xx,2.12,.56);box(f,.29,.12,.36,xx,.08,.56);}
    const awning=box(f,5.9,.045,1.65,0,2.26,1.05,shaded,.006);awning.rotation.x=.20;box(f,5.9,.24,.04,0,2.0,1.86,paper,.012);
    line(f,[[-2.95,1.89,1.89],[-1.4,1.90,1.9],[0,1.89,1.89],[1.5,1.9,1.9],[2.95,1.89,1.89]],true);
    for(let i=0;i<10;i++)segment(f,[-2.8+i*.6,2.40,.27],[-2.8+i*.6,2.08,1.82]);
    const lettering=document.createElement('canvas');lettering.width=1024;lettering.height=100;const ctx=lettering.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1024,100);ctx.fillStyle='#171717';ctx.font='50px Georgia';ctx.textAlign='center';ctx.fillText('C A F É   D U   C O I N',512,69);const texture=new THREE.CanvasTexture(lettering);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(3.5,.24),new THREE.MeshBasicMaterial({map:texture}));label.position.set(0,2.015,1.887);f.add(label);
    for(const yy of [2.65,4.45,6.26]){box(f,6.0,.11,1.02,0,yy,.18,shaded);line(f,[[-3,yy+.07,.71],[0,yy+.075,.71],[3,yy+.07,.71]],true);}
    for(const yy of [3.52,5.38])for(const xx of [-1.85,0,1.85]){
      box(f,.82,1.24,.08,xx,yy,.44,dark);rect(f,xx,yy,.52,.97,1.35,.02,true);rect(f,xx,yy,.54,.83,1.21,.015);
      box(f,.033,1.19,.08,xx,yy,.57);box(f,.79,.033,.08,xx,yy-.02,.57);box(f,.13,1.30,.09,xx-.57,yy,.49,shaded);
      for(let j=0;j<14;j++)segment(f,[xx-.63,yy-.57+j*.087,.55],[xx-.51,yy-.56+j*.087,.55]);
      box(f,1.14,.09,.30,xx,yy-.72,.62,shaded);for(let j=0;j<7;j++){const fx=xx-.42+j*.14;line(f,[[fx,yy-.7,.72],[fx+.035,yy-.54-rnd()*.08,.72]]);ball(f,.035,.04,.03,fx,yy-.52-rnd()*.1,.72,shaded);}
    }
    for(const yy of [4.55,6.34]){segment(f,[-2.94,yy+.55,1.04],[2.94,yy+.55,1.04],true);for(let i=0;i<27;i++){const xx=-2.85+i*.22;line(f,[[xx,yy,1.04],[xx+.02,yy+.42,1.04],[xx+.08,yy+.48,1.04],[xx+.15,yy+.42,1.04],[xx+.15,yy,1.04]]);}for(const xx of [-2.3,-.7,.7,2.3]){box(f,.14,.28,.35,xx,yy-.18,.54,shaded);}}
    // A handful of masonry joints keep the facade specific but leave it airy.
    for(let row=0;row<13;row++){const yy=2.8+row*.30;for(const xx of [-2.6,2.58])line(f,[[xx-.18,yy,.415],[xx+.18,yy+.003,.415]]);}
    wallHatch(f,-2.67,3.8,.52,.1,2.1,70);wallHatch(f,2.5,1.1,.60,.3,1.2,55);return f;}
  function paris(){const key='parisStudy',g=group(root);cafeFacade(g,2.5,-7.3);const tr=tree(g,-3.8,0,-7.6,1.83,true);animations[key].push(t=>tr.rotation.z=Math.sin(t*.22)*.003);
    // Terrace furniture and seated customers give the street its human scale.
    for(let i=0;i<4;i++){const xx=.3+i*1.18,zz=-4.95+(i%2)*.20;const t=bistroTable(g,xx,zz,.32,.64);const c=bentChair(g,xx-.38,zz+.06,.7);c.scale.setScalar(.67);const d=bentChair(g,xx+.37,zz-.07,-.7);d.scale.setScalar(.67);if(i!==1)person(g,xx+.35,0,zz-.04,.70,i%2===0,true);cyl(t,.045,.045,.09,.05,.70,0,paper);}
    const waiter=person(g,.1,0,-4.30,.90,false);box(waiter,.17,.24,.015,-.01,.72,.075,plain,.01);animations[key].push(t=>waiter.rotation.y=Math.sin(t*.08)*.06);
    person(g,-2.9,0,-6.2,.92,true);person(g,-4.9,0,-6.8,.85,false);person(g,-1.4,0,-8.0,.72,false);
    for(const x of [-4.8,-3.1]){rod(g,[x,0,-7.35],[x,3.0,-7.35],.026,shaded);cyl(g,.10,.15,.14,x,.08,-7.35,shaded);ball(g,.10,.14,.10,x,3.1,-7.35);}
    line(g,[[-7,.06,-4.0],[-2,.08,-4.1],[3,.06,-4.08],[7,.07,-4.05]],true);line(g,[[-7,.0,-3.8],[-2,.01,-3.9],[3,.0,-3.88],[7,.0,-3.85]]);for(let i=0;i<35;i++){const xx=-7+i*.4;segment(g,[xx,.025,-3.86],[xx+.06,.055,-4.03]);}shadow(g,-3.85,.013,-7.35,1.0,.5,95);
    const t=bistroTable(g,0,1.15,1.60);coffee(t,.22,.85,.12,key,1.16);pastry(t,-.54,.91,.13,1.0);pastry(t,-.24,.91,-.06,.86).rotation.y=.6;
    const l=bentChair(g,-1.44,.16,.24);l.scale.setScalar(1.12);const r=bentChair(g,1.85,-.35,-.25);r.scale.setScalar(1.12);return g;}
  function train(){const key='trainStudy',g=group(root);window(g,0,2.10,-1.9,4.15,2.65,{rounded:.36});
    // The wide curved gasket has drawn shading instead of a uniform black rim.
    const marks=[];for(let i=0;i<150;i++){const x=-1.78+rnd()*3.56;marks.push([[x,3.33,-1.82],[x+.035,3.40,-1.82]],[[x,.79,-1.81],[x+.035,.85,-1.81]]);}for(let i=0;i<75;i++){const y=.98+rnd()*2.10;marks.push([[-2.04,y,-1.82],[-1.99,y+.055,-1.82]],[[2.00,y,-1.82],[2.04,y+.055,-1.82]]);}hatch(g,marks);
    line(g,[[-6,.55,-7],[-3,.93,-7],[0,.77,-7],[3,.54,-7],[6,.74,-7]],true);line(g,[[-6,.28,-9],[-3,.50,-9],[0,.72,-9],[3,.88,-9],[6,.51,-9]],true);
    const passing=group(g);for(let i=0;i<5;i++){const xx=-3+i*1.4,yy=.70+Math.sin(i)*.15;rod(passing,[xx,yy,-7.3],[xx,yy+.22,-7.3],.009,shaded);ball(passing,.085+(i===3?.07:0),.11+(i===3?.08:0),.085,xx,yy+.31,-7.3,shaded);}animations[key].push(t=>passing.position.x=1.2-((t*.075)%4.8));
    const grass=[];for(let i=0;i<290;i++){const xx=(rnd()-.5)*10,yy=.16+rnd()*.48;grass.push([[xx,yy,-6.8],[xx+.025,yy+.025+rnd()*.025,-6.8]]);}hatch(g,grass);
    for(const [x,y,s]of [[-1.1,2.2,.18],[2.4,1.7,.3],[-3.2,1.5,.12]])line(g,[[x-s,y,-8],[x-s*.4,y+.05,-8],[x,y+.09,-8],[x+s*.4,y+.02,-8],[x+s,y,-8],[x-s,y,-8]]);
    box(g,.40,.15,.12,-2.6,.52,-7,paper);line(g,[[-2.86,.60,-6.92],[-2.57,.70,-6.92],[-2.35,.60,-6.92]],true);rect(g,-2.58,.52,-6.92,.07,.11,.005);
    const t=group(g,.05,0,.30);box(t,1.65,.065,1.10,0,.86,0,shaded,.055);cup(t,-.40,.90,-.09,key,.85,true);book(t,.30,.96,.12,.59,.41,-.18);shadow(t,-.42,.898,-.07,.18,.13,40);shadow(t,.30,.90,.12,.33,.2,50);
    for(const side of [-1,1]){const s=group(g,side*2.20,0,-.1);s.rotation.y=side*.13;box(s,.98,1.60,.23,0,.90,0,paper,.20);box(s,.98,.18,1.15,0,.25,.44,shaded,.12);line(s,[[-.43,.47,.13],[0,.52,.14],[.43,.47,.13]],true);wallHatch(s,-side*.40,.85,.13,.07,1.3,95);}return g;}
  function archGeometry(w,h,depth){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);s.absarc(0,h-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,0);s.closePath();return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});}
  function cabin(){const key='cabinStudy',g=group(root);window(g,-2.20,2.15,-3.2,1.85,2.48);fir(g,-2.8,.20,-4.6,1.45);fir(g,-1.65,.2,-4.6,1.0);rain(g,key,-2.20,2.15,-3.30,1.55,2.18,20,true);
    const f=group(g,.20,0,-2.7);mesh(f,archGeometry(1.58,2.40,.36),0,.12,-.30,shaded);mesh(f,archGeometry(.96,1.36,.06),0,.17,.09,ink);box(f,1.82,.10,.68,0,.10,.1,shaded);box(f,1.69,.07,.53,0,.19,.10);
    for(let i=0;i<29;i++){const y=.27+i*.068,width=y<1.72?.75:Math.sqrt(Math.max(0,.79*.79-(y-1.73)**2));if(width<.05)continue;for(const side of [-1,1]){const inner=y<1.05?.50:y<1.53?Math.sqrt(Math.max(0,.48*.48-(y-1.05)**2)):.03;if(width>inner)segment(f,[side*inner,y,.071],[side*width,y,.071]);}}
    const rim=[];for(let i=0;i<27;i++){const a=i/26*Math.PI;rim.push([Math.cos(a)*.76,1.72+Math.sin(a)*.76,.072]);}line(f,rim,true);
    for(let i=0;i<4;i++){const log=cyl(f,.055,.055,.55,(i-1.5)*.08,.31,.22,shaded);log.rotation.z=.9+i*.3;}
    for(let i=0;i<3;i++){const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(-.18,.14,-.025,.32,.02,.51);sh.bezierCurveTo(.10,.31,.19,.12,0,0);const flame=mesh(f,new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:false}),-.13+i*.13,.37,.19,plain,false);animations[key].push(t=>{flame.scale.y=.72+(i===1?.35:0)+Math.sin(t*1.1+i)*.08;flame.rotation.z=Math.sin(t+i)*.025;});}
    upholstered(g,1.95,-.05,-.30);const t=bistroTable(g,-.82,.92,.60);coffee(t,0,.85,0,key,.85);shadow(g,.3,.015,-2.3,1.1,.36,95);return g;}
  function foldingChair(p,x,z,angle=0){const g=group(p,x,0,z);g.rotation.y=angle;for(const xx of [-.28,.28]){rod(g,[xx,.02,.35],[xx,1.25,-.30],.014,shaded);rod(g,[xx,.02,-.32],[xx,.55,.28],.014,shaded);ball(g,.025,.025,.025,xx,.47,.02,ink);}
    for(let i=0;i<4;i++)box(g,.60,.024,.12,0,.52,-.18+i*.14,shaded,.008);for(let i=0;i<3;i++)box(g,.60,.12,.022,0,.88+i*.15,-.23-i*.036,shaded,.008);shadow(g,-.05,.011,.02,.40,.35,75);
    const geo=new THREE.PlaneGeometry(.39,.77,16,30),a=geo.attributes.position;for(let i=0;i<a.count;i++){const xx=a.getX(i),v=(a.getY(i)+.385)/.77;a.setXYZ(i,xx,1.22-v*.69,-.27+.08*Math.sin(v*Math.PI)+.018*Math.cos(xx*65));}const towel=mesh(g,geo,.16,0,.06,paper);towel.material=paper.clone();towel.material.side=THREE.DoubleSide;
    for(let i=0;i<6;i++){const xx=-.01+i*.063;const pts=[];for(let j=0;j<=20;j++){const v=j/20;pts.push([xx,1.22-v*.69,-.209+.08*Math.sin(v*Math.PI)+.018*Math.cos((xx-.16)*65)]);}line(g,pts,i%3===0);}return g;}
  function seaside(){const key='seasideStudy',g=group(root);
    line(g,[[-20,1.1,-24],[-7,1.115,-24],[7,1.10,-24],[20,1.12,-24]],true);
    const water=[];for(let i=0;i<240;i++){const xx=(rnd()-.5)*30,zz=-7-rnd()*22,yy=.35;water.push([[xx,yy,zz],[xx+.10+rnd()*.35,yy,zz+.01]]);}hatch(g,water);
    const boat=group(g,-5.2,1.10,-24);rod(boat,[0,0,0],[0,.95,0],.008);const sh=new THREE.Shape();sh.moveTo(-.34,.10);sh.lineTo(-.025,.92);sh.lineTo(-.025,.10);sh.closePath();mesh(boat,new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false}));line(boat,[[-.4,0,0],[0,-.08,0],[.35,0,0]],true);animations[key].push(t=>boat.rotation.z=Math.sin(t*.25)*.025);
    box(g,10,.15,.16,0,.09,-2.50,shaded);for(let i=0;i<10;i++){const zz=-2.5+i*.48;rod(g,[2.35,.15,zz],[2.35,1.15,zz],.023,shaded);}box(g,.09,.055,4.65,2.35,1.17,-.26,shaded);box(g,.16,.15,4.7,2.35,.10,-.26,shaded);
    const t=bistroTable(g,.1,.15,.61);coffee(t,0,.85,-.05,key,.78);foldingChair(g,1.27,-.06,-.25);
    for(let i=0;i<7;i++)line(g,[[-3.3+i*.72,.34,-5.4-i*.10],[-3.1+i*.72,.35,-5.4-i*.10],[-2.8+i*.72,.34,-5.4-i*.10]]);
    for(let i=0;i<3;i++){const gull=line(g,[[0,0,0],[.04,.025,0],[.08,0,0],[.12,.026,0],[.16,.005,0]]);gull.position.set(-2+i*1.7,1.9+i*.16,-13);animations[key].push(t=>gull.position.x=-2+i*1.7+Math.sin(t*.08+i)*.4);}return g;}
  function openBook(p,x,y,z,w=.94,d=.62){const g=group(p,x,y,z);g.rotation.y=-.06;
    for(const side of [-1,1]){const geo=new THREE.PlaneGeometry(w/2,d,18,20);geo.rotateX(-Math.PI/2);const a=geo.attributes.position;
      for(let i=0;i<a.count;i++){const u=(a.getX(i)+w/4)/(w/2),xx=side*u*w/2,zz=a.getZ(i);a.setXYZ(i,xx,.025+Math.sin(u*Math.PI)*.045+u*.02,zz);}if(side<0){const idx=geo.index;for(let j=0;j<idx.count;j+=3){const b=idx.getX(j+1);idx.setX(j+1,idx.getX(j+2));idx.setX(j+2,b);}}geo.computeVertexNormals();mesh(g,geo,0,.012,0,paper,false);
      for(let layer=0;layer<3;layer++)line(g,[[0,.018-layer*.010,-d/2],[side*w*.25,.055-layer*.010,-d/2],[side*w*.5,.03-layer*.010,-d/2],[side*w*.5,.03-layer*.010,d/2],[side*w*.25,.055-layer*.010,d/2],[0,.018-layer*.010,d/2]],layer===2);
      for(let row=0;row<8;row++){const zz=-d*.31+row*d*.075,pts=[];for(let k=1;k<7;k++){const u=.12+k*.105;pts.push([side*u*w*.5,.04+Math.sin(u*Math.PI)*.045+u*.02,zz+Math.sin(k)*.001]);}line(g,pts);}}
    line(g,[[0,.032,-d/2],[0,.034,0],[0,.032,d/2]],true);shadow(g,-.04,-.014,.03,w*.55,d*.44,70);return g;}
  function bookstore(){const key='bookstoreStudy',g=group(root);const shelf=group(g,-1.65,0,-2.6);shelf.rotation.y=.08;box(shelf,1.06,3.30,.12,0,1.65,-.20,dark);for(const x of [-.56,.56])box(shelf,.075,3.42,.42,x,1.71,0,shaded);
    for(let row=0;row<6;row++){const yy=.20+row*.61;box(shelf,1.20,.065,.48,0,yy,.02,shaded);if(row===5)continue;let xx=-.48;for(let i=0;i<10;i++){const bw=.065+rnd()*.045,bh=.38+rnd()*.14;const b=box(shelf,bw,bh,.28,xx+bw/2,yy+.045+bh/2,.045,i%6===row?dark:paper,.005);b.rotation.z=(rnd()-.5)*.13;line(b,[[-bw*.32,-bh*.37,.145],[-bw*.32,bh*.35,.145]]);for(const by of [-bh*.29,bh*.30])segment(b,[-bw*.43,by,.147],[bw*.43,by,.147]);xx+=bw+.008;if(xx>.44)break;}}
    window(g,2.0,2.30,-2.9,1.14,2.63,{cross:true});box(g,1.29,.10,.40,2.0,.92,-2.7,shaded);book(g,2.05,.99,-2.57,.32,.24,-.12);cyl(g,.055,.075,.23,1.67,1.08,-2.63,paper);
    const branch=group(g,0,0,-2.35);
    const bough=new THREE.CatmullRomCurve3([[-1.80,2.35,0],[-1.23,2.75,.01],[-.62,3.20,0],[.12,3.43,.02],[.58,3.48,0]].map(V));
    const bg=new THREE.TubeGeometry(bough,60,.018,8,false),bp=bg.attributes.position;
    for(let i=0;i<bp.count;i++){const u=Math.floor(i/9)/60,c=bough.getPointAt(u),k=1-u*.85;bp.setXYZ(i,c.x+(bp.getX(i)-c.x)*k,c.y+(bp.getY(i)-c.y)*k,c.z+(bp.getZ(i)-c.z)*k);}mesh(branch,bg);
    for(const points of [[[-1.3,2.72,0],[-1.05,3.12,0],[-1.12,3.51,0]],[[-.65,3.19,0],[-.49,3.54,0],[-.20,3.71,0]],[[-.30,3.33,0],[.05,3.16,0],[.37,3.21,0]],[[.08,3.43,0],[.28,3.66,0],[.55,3.75,0]]])line(branch,points,true);
    const bird=group(g,.16,3.47,-2.30);ball(bird,.065,.04,.04,0,0,0,shaded);ball(bird,.035,.035,.03,.05,.03,0,shaded);line(bird,[[.075,.03,.01],[.11,.02,.01]]);line(bird,[[-.05,0,0],[-.12,-.025,0]],true);
    const t=bistroTable(g,.13,.76,.82);openBook(t,.03,.88,.12);readingLamp(t,-.46,.86,-.29,.86).rotation.y=Math.PI;for(let i=0;i<3;i++)book(g,1.18,.07+i*.09,-1.65,.46,.32,(i-1)*.12);
    line(g,[[-2.4,.01,-2.8],[-.4,.01,-2.8],[2.6,.01,-2.8],[2.8,.01,-1.6]],true);shadow(g,1.95,.013,-2.25,.75,.45,85);wallHatch(g,2.64,1.8,-2.85,.09,2.1,75);return g;}
  const factories={home,paris,train,cabin,seaside,bookstore};
  const views={home:{eye:[0,1.65,3.7],pitch:-.10,fov:47},paris:{eye:[0,1.65,3.7],pitch:-.08,fov:47},train:{eye:[0,1.65,3.4],pitch:-.10,fov:49},cabin:{eye:[0,1.65,3.7],pitch:-.09,fov:48},seaside:{eye:[0,1.65,3.7],pitch:-.04,fov:49},bookstore:{eye:[0,1.65,3.5],pitch:-.08,fov:48}};
  const result={setMood(){}};for(const [key,make] of Object.entries(factories)){animations[key+'Study']=[];result[key]={make,...views[key],yaw:0,reference:'references/midjourney/'+key+'.png',animation:key+'Study'};}return result;
}
