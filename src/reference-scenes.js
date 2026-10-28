import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Six real 3D scenes built from the sparse cartoon references. No image planes,
// surface shading, hatching, or texture maps: the drawing lives in the contours.
export function createReferenceScenes({ root, animations }) {
  const ink = new THREE.MeshBasicMaterial({ color: 0x171717 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const outline = new THREE.MeshBasicMaterial({ color: 0x171717, side: THREE.BackSide });
  const viewSize=new THREE.Vector2(1000,700);
  outline.onBeforeCompile = shader => {
    shader.uniforms.outlineViewport={value:viewSize};
    shader.vertexShader='uniform vec2 outlineViewport;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec2 penDirection=(projectionMatrix*vec4(normalMatrix*normal,0.0)).xy*outlineViewport;
      penDirection/=max(length(penDirection),0.001);
      gl_Position.xy+=penDirection*2.2/outlineViewport*gl_Position.w;`);
  };
  outline.customProgramCacheKey = () => 'sempe-screen-contour-v3';
  const group = (parent, x=0, y=0, z=0) => { const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g; };
  function mesh(parent, geometry, x=0,y=0,z=0, black=false, edge=true) {
    const p=geometry.attributes.position;
    // Slow, tiny deviations make objects imperfect without a noisy second outline.
    for(let i=0;i<p.count;i++){
      const a=p.getX(i),b=p.getY(i),c=p.getZ(i);
      p.setXYZ(i,a+Math.sin(b*3.7+c*2.1)*.0025,b+Math.sin(a*4.1+c*1.3)*.002,c+Math.sin(a*2.8+b*3.2)*.002);
    }
    geometry.computeVertexNormals();
    const m=new THREE.Mesh(geometry,black?ink:white);m.position.set(x,y,z);parent.add(m);
    if(!black&&edge){const edgeMesh=new THREE.Mesh(geometry,outline);edgeMesh.onBeforeRender=renderer=>renderer.getSize(viewSize);m.add(edgeMesh);}
    return m;
  }
  function box(p,w,h,d,x,y,z,black=false,r=.035){return mesh(p,new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.25,h*.25,d*.25)),x,y,z,black);}
  function sphere(p,rx,ry,rz,x,y,z,black=false){const g=new THREE.SphereGeometry(1,32,20);g.scale(rx,ry,rz);return mesh(p,g,x,y,z,black);}
  function cylinder(p,rt,rb,h,x,y,z,black=false){
    const m=mesh(p,new THREE.CylinderGeometry(rt,rb,h,48),x,y,z,black);
    if(!black&&rt>.1){for(const [r,yy]of [[rt,h/2],[rb,-h/2]]){const e=new THREE.Mesh(new THREE.TorusGeometry(r,.0035,5,64),ink);e.rotation.x=Math.PI/2;e.position.y=yy;m.add(e);}}
    return m;
  }
  function stroke(p, points, radius=.008, color=ink, closed=false) {
    const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),closed,'centripetal');
    const m=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(16,points.length*8),radius,5,closed),color);p.add(m);return m;
  }
  function rod(p,a,b,r=.015,black=true){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=cylinder(p,r,r,d.length(),...av.clone().add(bv).multiplyScalar(.5).toArray(),black);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  function ring(p,r,t,x,y,z,black=false){return mesh(p,new THREE.TorusGeometry(r,t,10,40),x,y,z,black);}
  function rect(p,x,y,z,w,h,r=.045,weight=.007){
    // Straight stretches and tiny rounded corners keep the drawing assured.
    const path=new THREE.CurvePath(), v=(a,b)=>new THREE.Vector3(x+a,y+b,z);
    const l=-w/2,rr=w/2,bot=-h/2,top=h/2;
    const line=(a,b)=>path.add(new THREE.LineCurve3(v(...a),v(...b)));
    const corner=(a,b,c)=>path.add(new THREE.QuadraticBezierCurve3(v(...a),v(...b),v(...c)));
    line([l+r,bot],[rr-r,bot]);corner([rr-r,bot],[rr,bot],[rr,bot+r]);
    line([rr,bot+r],[rr,top-r]);corner([rr,top-r],[rr,top],[rr-r,top]);
    line([rr-r,top],[l+r,top]);corner([l+r,top],[l,top],[l,top-r]);
    line([l,top-r],[l,bot+r]);corner([l,bot+r],[l,bot],[l+r,bot]);
    const m=new THREE.Mesh(new THREE.TubeGeometry(path,240,weight,5,true),ink);p.add(m);return m;
  }
  function windowFrame(p,x,y,z,w,h,cross=true,corner=.045){
    rect(p,x,y,z,w,h,corner);rect(p,x,y,z+.035,w-.15,h-.15,Math.max(.025,corner-.04),.006);
    if(cross){box(p,.055,h-.16,.08,x,y,z+.02);box(p,w-.16,.055,.08,x,y,z+.02);}
    // Blank wall masks keep the sparse outdoor contours inside the real opening.
    for(const [ww,hh,xx,yy]of [[12,8,x-w/2-6,y],[12,8,x+w/2+6,y],[w,8,x,y+h/2+4],[w,8,x,y-h/2-4]])mesh(p,new THREE.PlaneGeometry(ww,hh),xx,yy,z-.015,false,false);
  }
  function table(p,x,z,r=.86,height=.82){const g=group(p,x,0,z);cylinder(g,r,r,.065,0,height,0);for(const a of [.6,2.7,4.8])rod(g,[Math.sin(a)*r*.65,height-.03,Math.cos(a)*r*.65],[Math.sin(a)*r*.76,.02,Math.cos(a)*r*.76],.024,false);return g;}
  function closedBook(p,x,y,z,w=.6,d=.43){const g=group(p,x,y,z);box(g,w,.075,d,0,0,0);stroke(g,[[-w*.44,-.015,d*.505],[0,-.018,d*.505],[w*.44,-.012,d*.505]],.004);g.rotation.y=-.12;return g;}
  function mug(p,x,y,z,key,scale=1,paperCup=false){
    const g=group(p,x,y,z);g.scale.setScalar(scale);
    const cupProfile=[[.105,0],[.135,.025],[.16,.10],[.175,.25],[.175,.34]].map(v=>new THREE.Vector2(...v));
    mesh(g,new THREE.LatheGeometry(cupProfile,48),0,0,0);
    cylinder(g,.163,.163,.008,0,.329,0,true);
    const lip=ring(g,.176,.006,0,.34,0,true);lip.rotation.x=Math.PI/2;
    const base=ring(g,.109,.005,0,.007,0,true);base.rotation.x=Math.PI/2;
    if(paperCup){cylinder(g,.19,.18,.035,0,.36,0,true);}
    else {const handle=ring(g,.105,.027,.20,.19,0);handle.scale.x=.78;}
    const steam=group(g,0,.39,0);for(let i=0;i<2;i++)stroke(steam,[[(i-.5)*.1,0,0],[(i-.5)*.1+.02,.11,0],[(i-.5)*.1-.015,.22,0],[(i-.5)*.1+.005,.25,0]],.0022);
    animations[key].push(t=>{steam.rotation.y=Math.sin(t*.4)*.2;steam.scale.y=.95+Math.sin(t*.7)*.06;});return g;
  }
  function lamp(p,x,y,z,curved=true){
    const g=group(p,x,y,z);cylinder(g,.18,.2,.035,0,0,0,true);
    stroke(g,curved?[[0,0,0],[0,1.05,0],[-.07,1.30,0],[-.28,1.37,0],[-.46,1.15,0]]:[[0,0,0],[0,.57,0],[-.24,.94,0],[-.37,.91,0]],.017);
    const h=curved?1.02:.78,xx=curved?-.46:-.37;
    const profile=new THREE.CubicBezierCurve(new THREE.Vector2(.28,0),new THREE.Vector2(.27,.13),new THREE.Vector2(.16,.30),new THREE.Vector2(.04,.30)).getPoints(20);
    mesh(g,new THREE.LatheGeometry(profile,40),xx,h,0,true);
    const inner=mesh(g,new THREE.CircleGeometry(.275,40),xx,h-.004,0,false,false);inner.rotation.x=Math.PI/2;
    return g;
  }
  function armchair(p,x,z){
    const g=group(p,x,0,z);box(g,1.24,.24,1.18,0,.52,0,false,.12);
    const back=box(g,1.20,1.04,.2,0,1.02,-.49,false,.09);back.rotation.x=-.06;
    for(const xx of [-.59,.59]){box(g,.22,.45,1.1,xx,.74,0,false,.1);stroke(g,[[xx,.97,-.38],[xx,.97,.05],[xx,.94,.38]],.0035);}
    stroke(g,[[-.45,.67,.40],[0,.66,.43],[.45,.67,.40]],.004);
    stroke(g,[[-.45,.72,-.36],[-.46,1.17,-.36],[-.39,1.43,-.36],[0,1.46,-.36],[.39,1.43,-.36],[.46,1.17,-.36],[.45,.72,-.36]],.0035);
    for(const xx of [-.45,.45])for(const zz of [-.38,.38])rod(g,[xx,.40,zz],[xx*1.1,.04,zz*1.1],.025);
    return g;
  }
  function cafeChair(p,x,z,angle=0){const g=group(p,x,0,z);g.rotation.y=angle;cylinder(g,.34,.34,.045,0,.58,0);for(const xx of [-.25,.25])for(const zz of [-.24,.24])rod(g,[xx,.58,zz],[xx*1.3,.01,zz*1.3],.016);stroke(g,[[-.32,.57,-.23],[-.33,1.1,-.26],[-.23,1.35,-.26],[.23,1.35,-.26],[.33,1.1,-.26],[.32,.57,-.23]],.012);stroke(g,[[-.23,.63,-.25],[-.22,1.09,-.27],[0,1.24,-.27],[.22,1.09,-.27],[.23,.63,-.25]],.007);return g;}
  function fir(p,x,y,z,s=1){const g=group(p,x,y,z);for(let i=0;i<3;i++){const cone=mesh(g,new THREE.ConeGeometry((.36-i*.085)*s,.56*s,9),0,(.32+i*.29)*s,0,true);cone.rotation.z=.04-i*.04;}rod(g,[0,0,0],[0,.4*s,0],.025*s);return g;}
  function weather(p,key,{x,y,z,w,h,snow=false,count=14}){
    const items=[];
    for(let i=0;i<count;i++){const u=((Math.sin(i*42.37+4)*43758.54)%1+1)%1,v=((Math.sin(i*17.17+9)*23421.63)%1+1)%1;const g=group(p,x+(u-.5)*w,y+(v-.5)*h,z);if(snow)sphere(g,.022,.022,.022,0,0,0,true);else stroke(g,[[0,.035,0],[-.018,-.035,0]],.004);items.push({g,v,u});}
    animations[key].push(t=>items.forEach(({g,v,u})=>{g.position.y=y+(((v-t*(snow?.018:.048))%1+1)%1-.5)*h;if(snow)g.position.x=x+(u-.5)*w+Math.sin(t*.3+v*8)*.025;}));
  }
  function home(){
    const key='homeStudy',g=group(root);
    windowFrame(g,-.55,2.55,-2.5,4.9,3.1,false);
    box(g,5.12,.085,.44,-.55,.98,-2.32,false,.02);
    // The city is only a few low rooflines; most of the view is quiet white sky.
    for(const [x,y,z]of [[-2.3,.94,-6.4],[1.1,.8,-7.8]]){
      stroke(g,[[x-1.1,y,z],[x-.65,y+.52,z],[x-.3,y+.52,z],[x-.3,y+.72,z],[x-.13,y+.72,z],[x-.13,y+.52,z],[x+.6,y+.52,z],[x+.94,y,z]],.007);
      for(const xx of [-.43,.28])rect(g,x+xx,y+.12,z,.22,.28,.02,.005);
    }
    weather(g,key,{x:-.55,y:2.55,z:-2.6,w:4.55,h:2.85,count:19});
    const t=table(g,.38,.95,1.30);cylinder(t,.37,.35,.028,0,.87,.05);mug(t,0,.895,.05,key,1.05);
    cafeChair(g,1.7,-.75,-.07);
    const cat=group(g,-1.4,1.21,-2.20);cat.rotation.y=-.22;
    sphere(cat,.38,.17,.23,0,0,0,true);sphere(cat,.15,.12,.15,.25,.05,.15,true);
    for(const x of [.15,.34]){const e=mesh(cat,new THREE.ConeGeometry(.06,.14,3),x,.20,.15,true);e.rotation.z=x<.2?-.3:.3;}
    stroke(cat,[[-.25,.10,.14],[-.37,.03,.23],[-.43,-.10,.27],[-.67,-.11,.28]],.024);
    stroke(cat,[[-.20,.10,.19],[-.09,.13,.23],[.05,.10,.25]],.004,white);
    for(const side of [-1,1])stroke(cat,[[.25,-.02,.29],[.25+side*.14,.005,.31]],.0035);
    stroke(cat,[[.19,.07,.29],[.23,.057,.30],[.27,.067,.30]],.004,white);
    animations[key].push(t=>{cat.scale.y=1+Math.sin(t*.75)*.018;});return g;
  }
  function paris(){
    const key='parisStudy',g=group(root);
    const t=table(g,0,.78,1.35);cylinder(t,.27,.25,.025,-.36,.87,.12);mug(t,-.36,.89,.12,key,.9);
    cylinder(t,.29,.28,.025,.49,.87,.28);
    // One smooth crescent, with three deliberately placed pastry folds.
    const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-.23,0,.08),new THREE.Vector3(-.15,.05,-.06),new THREE.Vector3(0,.075,-.11),new THREE.Vector3(.15,.05,-.06),new THREE.Vector3(.23,0,.08)]);
    const geo=new THREE.TubeGeometry(path,40,.09,12,false);const a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const u=Math.floor(i/13)/40,center=path.getPointAt(u),factor=.23+.77*Math.sin(Math.PI*u);a.setXYZ(i,center.x+(a.getX(i)-center.x)*factor,center.y+(a.getY(i)-center.y)*factor,center.z+(a.getZ(i)-center.z)*factor);}
    const pastry=mesh(t,geo,.49,.96,.28);for(const x of [-.10,0,.1])stroke(pastry,[[x-.03,.1,-.10],[x,.14,-.065],[x+.035,.09,.015]],.0045);
    cafeChair(g,1.35,-.4,-.15);
    for(let i=0;i<4;i++)box(g,.25,.025,1.4,-2.8+i*.55,3.4,.3,i%2===0);
    function facade(x,z,w,h){const f=group(g,x,0,z);box(f,w,h,.6,0,h/2,0,false,.015);stroke(f,[[-w/2,h,.33],[-w*.38,h+.55,.33],[w*.38,h+.55,.33],[w/2,h,.33]],.012);for(const xx of [-w*.23,w*.23]){box(f,.13,.38,.18,xx,h+.45,0);for(const yy of [2.2,3.7]){rect(f,xx,yy,.32,.48,.95,.01,.012);rod(f,[xx,yy-.46,.34],[xx,yy+.46,.34],.009);rod(f,[xx-.23,yy,.34],[xx+.23,yy,.34],.007);}}rect(f,0,.72,.32,.55,1.42,.01,.012);return f;}
    const f=facade(-3.3,-8.7,3.0,4.7);f.rotation.y=.12;
    for(const xx of [-.69,.69])for(const yy of [2.2,3.7]){box(f,.09,.97,.045,xx-.30,yy,.36,true,.005);stroke(f,[[xx-.29,yy-.5,.39],[xx+.30,yy-.5,.39]],.009);}
    for(const xx of [-.95,.95]){box(f,.62,.95,.04,xx,.68,.34,true,.012);rect(f,xx,.68,.38,.67,1.0,.015,.007);}

    stroke(f,[[-1.35,2.7,.8],[0,2.69,.8],[1.35,2.7,.8]],.012);
    for(let i=0;i<7;i++){const x=-1.2+i*.4;stroke(f,[[x,2.25,.8],[x+.05,2.55,.8],[x+.12,2.65,.8],[x+.20,2.58,.8]],.006);}
    box(f,3.15,.05,1.0,0,1.65,.7);for(let i=0;i<5;i++)box(f,.18,.045,1.0,-1.2+i*.6,1.65,.7,true);
    const tree=group(g,3.2,0,-8.0);
    stroke(tree,[[-.11,0,0],[-.025,1.2,0],[-.11,2.6,0],[-.31,3.6,0]],.025);
    stroke(tree,[[.12,0,0],[.05,1.5,0],[.12,2.8,0],[.55,3.7,0]],.014);
    for(let i=0;i<8;i++){
      const a=i*2.399,r=.5+(i%3)*.22,cx=Math.cos(a)*r,cy=3.7+Math.sin(a)*r*.75,cz=Math.sin(i*4)*.3;
      stroke(tree,[[0,2.1,0],[cx*.5,3.1,cz*.5],[cx,cy,cz]],.006);
      for(let j=0;j<5;j++){const b=j*1.256+i;const leaf=ring(tree,.075+(j%2)*.025,.004,cx+Math.cos(b)*.30,cy+Math.sin(b)*.27,cz);leaf.scale.y=.65;leaf.rotation.z=b;}
    }
    animations[key].push(t=>{tree.rotation.z=Math.sin(t*.3)*.004;});
    stroke(g,[[-3,.02,-6.6],[2,.02,-6.6],[7,.02,-6.6]],.01);
    const person=group(g,.8,0,-8.0);person.scale.setScalar(.8);sphere(person,.10,.15,.09,0,1.32,0);sphere(person,.085,.035,.045,.1,1.32,.03);sphere(person,.14,.035,.11,-.015,1.47,0,true);sphere(person,.09,.07,.085,-.03,1.5,0,true);box(person,.23,.49,.15,-.03,.99,0,false,.05);
    stroke(person,[[-.13,1.16,.06],[-.23,.96,.06],[-.07,.85,.10]],.022);
    const legs=[];for(const side of [-1,1]){const leg=group(person,side*.045,.76,0);rod(leg,[0,0,0],[side*.14,-.68,0],.025,false);box(leg,.15,.055,.12,side*.14+.04,-.68,.01,true);legs.push(leg);}
    animations[key].push(t=>{person.position.x=.8+Math.sin(t*.06)*.65;legs.forEach((leg,i)=>leg.rotation.z=Math.sin(t*.8+i*Math.PI)*.035);});return g;
  }
  function train(){
    const key='trainStudy',g=group(root);
    windowFrame(g,0,2.17,-1.9,4.6,2.75,false,.30);box(g,.22,.08,.10,0,3.43,-1.8,true);
    stroke(g,[[-5,.65,-5],[-2.4,1.0,-5],[0,.72,-5],[3,.58,-5],[6,.79,-5]],.012);
    stroke(g,[[-5,.4,-7],[-2,.53,-7],[1,.82,-7],[3.5,.65,-7],[7,.5,-7]],.012);
    const trees=group(g);for(let i=0;i<3;i++){const tx=-1.1+i*.85;rod(trees,[tx,.75,-5.5],[tx,1.03,-5.5],.01);sphere(trees,.13,.17,.12,tx,1.12,-5.5);}animations[key].push(t=>{trees.position.x=-((t*.09)%7)+3;});
    weather(g,key,{x:0,y:2.17,z:-2.0,w:4.3,h:2.4,count:12});
    const t=group(g,.15,0,.30);box(t,1.85,.065,1.2,0,.87,0,false,.09);mug(t,-.27,.91,-.1,key,1,true);closedBook(t,.30,.95,.13,.66,.48);
    for(const side of [-1,1]){box(g,.95,1.65,.22,side*2.15,1.0,-.1,false,.18);stroke(g,[[side*1.95,.25,.03],[side*1.94,1.2,.03],[side*1.90,1.72,.03]],.006);}return g;
  }
  function cabin(){
    const key='cabinStudy',g=group(root);
    windowFrame(g,-2.25,2.3,-3.1,1.7,2.15);fir(g,-2.75,.6,-4.8,1.15);fir(g,-1.7,.7,-4.8,.7);weather(g,key,{x:-2.25,y:2.3,z:-3.2,w:1.45,h:1.85,snow:true,count:6});
    const fire=group(g,.55,0,-2.65);
    const arch=new THREE.Shape();arch.moveTo(-.78,.12);arch.lineTo(-.78,1.15);arch.bezierCurveTo(-.78,1.85,.78,1.85,.78,1.15);arch.lineTo(.78,.12);arch.closePath();
    mesh(fire,new THREE.ExtrudeGeometry(arch,{depth:.26,bevelEnabled:false}),0,0,-.25,true);
    for(const x of [-.96,.96])box(fire,.32,1.94,.48,x,.97,0,false,.03);box(fire,2.35,.15,.66,0,2.0,0);box(fire,2.25,.10,.8,0,.1,.05);
    for(const side of [-1,1]){const log=cylinder(fire,.12,.12,.85,side*.22,.29,.29);log.rotation.z=side*1.34;}
    // Solid white flame volumes sit against the black opening, not glowing particles.
    for(let i=0;i<2;i++){const flame=new THREE.Shape();flame.moveTo(0,0);flame.bezierCurveTo(-.3,.18,-.09,.35,.015,.64);flame.bezierCurveTo(.18,.40,.28,.18,0,0);const m=mesh(fire,new THREE.ExtrudeGeometry(flame,{depth:.09,bevelEnabled:false}),-.24+i*.44,.39,.13,false,false);animations[key].push(t=>{m.scale.y=(i===0?1.08:.77)+Math.sin(t*1.7+i*2)*.07;m.rotation.z=Math.sin(t*1.2+i)*.04;});}
    armchair(g,-1.7,.4);const t=table(g,1.8,.45,.62);mug(t,0,.86,0,key,1.05);return g;
  }
  function seaside(){
    const key='seasideStudy',g=group(root);
    rod(g,[-4.2,1.18,-1.9],[4.2,1.18,-1.9],.024,false);for(let i=0;i<7;i++)rod(g,[-3.6+i*1.2,.01,-1.9],[-3.6+i*1.2,1.18,-1.9],.012);
    stroke(g,[[-24,1.45,-28],[-8,1.47,-28],[8,1.45,-28],[24,1.48,-28]],.017);
    for(let i=0;i<3;i++){const wave=stroke(g,[[-.7,0,0],[-.15,.015,0],[0,.065,0],[.18,.018,0],[.7,.01,0]],.008);wave.position.set(-2.4+i*2.5,.8-i*.12,-8-i*2);animations[key].push(t=>{wave.position.x=-2.4+i*2.5+Math.sin(t*.15+i)*.15;});}
    const boat=group(g,3.1,1.48,-25);rod(boat,[0,0,0],[0,1.1,0],.015);const sail=new THREE.Shape();sail.moveTo(-.52,.10);sail.lineTo(-.025,1.02);sail.lineTo(-.025,.10);sail.closePath();mesh(boat,new THREE.ExtrudeGeometry(sail,{depth:.045,bevelEnabled:false}),0,0,0);stroke(boat,[[-.56,0,0],[0,-.1,0],[.56,0,0]],.025);animations[key].push(t=>{boat.rotation.z=Math.sin(t*.3)*.035;});
    const towel=group(g,1.1,1.18,-1.88);box(towel,.64,.79,.035,0,-.37,.035,false,.025);for(const x of [-.2,.1])box(towel,.095,.78,.018,x,-.37,.066,true,.003);animations[key].push(t=>{towel.rotation.x=Math.sin(t*.45)*.02;});
    const t=table(g,-1.2,.4,.85);cylinder(t,.25,.24,.022,0,.87,.02);mug(t,0,.89,.02,key,.9);cafeChair(g,1.5,.25,-.3);
    stroke(g,[[2.1,3.0,-13],[2.35,3.08,-13],[2.55,2.96,-13],[2.78,3.1,-13],[3.05,3.12,-13]],.012);return g;
  }
  function bookstore(){
    const key='bookstoreStudy',g=group(root);
    windowFrame(g,.1,2.4,-2.7,2.55,3.1,false);
    stroke(g,[[-.7,.5,-4],[-.73,1.7,-4],[-.63,2.8,-4],[-.68,4.1,-4]],.025);stroke(g,[[-.52,.5,-4],[-.50,1.85,-4],[.2,2.25,-4],[1.05,2.6,-4]],.018);stroke(g,[[-.48,2.0,-4],[.15,2.45,-4],[.65,3.10,-4]],.012);
    for(let i=0;i<6;i++){const leaf=sphere(g,.11,.035,.045,.1+i*.17,2.45+i*.06,-4);leaf.rotation.z=.4+(i%2)*.6;}
    const shelf=group(g,-2.25,0,-2.0);shelf.rotation.z=-.027;for(const x of [-.65,.65])box(shelf,.07,3.35,.37,x,1.67,0);for(let row=0;row<3;row++){const y=.47+row*.94;box(shelf,1.37,.065,.44,0,y,0);for(let i=0;i<4;i++){const h=.60+(i%2)*.09;const b=box(shelf,.21,h,.29,-.43+i*.28,y+.04+h/2,.025,i===row);b.rotation.z=(i===2?.06:-.025);}}
    const t=table(g,.35,.60,1.25);lamp(t,.80,.86,-.37,false).scale.setScalar(.78);
    const b=group(t,-.20,.90,.35);b.rotation.x=.12;
    stroke(b,[[0,-.004,-.35],[0,-.005,0],[0,-.004,.35]],.003);
    for(const side of [-1,1]){const page=group(b,side*.29,0,0);page.rotation.z=side*.09;box(page,.58,.035,.70,0,0,0,false,.025);const pageEdge=rect(page,0,0,0,.57,.69,.02,.003);pageEdge.rotation.x=-Math.PI/2;pageEdge.position.y=.021;for(let i=0;i<3;i++)stroke(page,[[-.19,.025,-.11+i*.075],[0,.026,-.10+i*.075],[.15,.025,-.11+i*.075]],.004);}
    armchair(g,-1.85,.65);return g;
  }
  const factories={home,paris,train,cabin,seaside,bookstore};
  const views={home:{eye:[0,1.72,2.65],pitch:-.08},paris:{eye:[0,1.65,2.65],pitch:-.09},train:{eye:[0,1.65,2.65],pitch:-.10},cabin:{eye:[0,1.70,3.1],pitch:-.08},seaside:{eye:[0,1.65,2.8],pitch:-.09},bookstore:{eye:[0,1.70,2.65],pitch:-.10}};
  const result={setMood(){}};
  for(const [key,make] of Object.entries(factories)){
    animations[key+'Study']=[];
    result[key]={make,...views[key],yaw:0,reference:'references/midjourney/'+key+'.png',animation:key+'Study'};
  }
  return result;
}
