import * as THREE from 'three';

// Each additional world owns its composition and motion, sharing the ink vocabulary.
export function createAdditionalScenes(api) {
  const { root, animations, group, box, roundBox, sphere, cylinder, line, curve, rod, ring, label, mug, plant, book, random } = api;
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const black = new THREE.MeshBasicMaterial({ color: 0x171717, side: THREE.DoubleSide });
  function shape(parent, points, x,y,z, material=white) {
    const path=new THREE.Shape();path.moveTo(...points[0]);for(const point of points.slice(1))path.lineTo(...point);path.closePath();
    const m=new THREE.Mesh(new THREE.ShapeGeometry(path),material);m.position.set(x,y,z);parent.add(m);return m;
  }
  function floor(g,w=8,d=8){box(g,w,.16,d,0,-.12,0);for(let x=-w/2;x<w/2;x+=.36)line(g,[[x,-.035,-d/2],[x,-.035,d/2]]);}
  function sideTable(g,x,z,r=.65){const t=group(g,x,0,z);cylinder(t,r,r,.08,0,.95,0);for(const a of [0,2.1,4.2])rod(t,[Math.sin(a)*r*.6,.9,Math.cos(a)*r*.6],[Math.sin(a)*r*.8,.02,Math.cos(a)*r*.8],.035);return t;}
  function flatLabel(g,text,w,h,x,y,z){const item=group(g,x,y,z);item.rotation.x=-Math.PI/2;label(item,text,w,h,0,0,0,{italic:true});return item;}
  function forestWindow(g,x,y,z,w,h,key,moving=false){
    box(g,w+.2,h+.2,.12,x,y,z);box(g,w,h,.025,x,y,z+.08,true);
    const border={left:x-w/2+.03,right:x+w/2-.03,bottom:y-h/2+.03,top:y+h/2-.03};
    const trees=[];
    for(let i=0;i<14;i++){
      const tree={x:border.left+random()*w,height:.3+random()*.65};
      tree.stroke=line(g,[[0,0,0],[0,0,0]],true);
      const oldStroke=tree.stroke;g.remove(oldStroke);oldStroke.geometry.dispose();tree.stroke=new THREE.LineSegments(new THREE.BufferGeometry(),oldStroke.material);g.add(tree.stroke);tree.stroke.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(30),3));trees.push(tree);
    }
    const flakes=[];for(let i=0;i<65;i++){const f={x:border.left+random()*(w-.06),y:random(),speed:.12+random()*.25};f.stroke=line(g,[[f.x,y,z+.1],[f.x,y,z+.1]],true);flakes.push(f);}
    const update=t=>{
      for(const tree of trees){const tx=moving?border.left+((tree.x-border.left+t*.27)%(w-.06)):tree.x;const base=border.bottom+.06,top=Math.min(base+tree.height,border.top);const clamp=v=>THREE.MathUtils.clamp(v,border.left,border.right);const pts=[tx,base,z+.1,tx,top,z+.1,clamp(tx-.14),top-.22,z+.1,tx,top,z+.1,clamp(tx+.14),top-.22,z+.1,tx,top,z+.1,clamp(tx-.22),top-.42,z+.1,tx,top-.18,z+.1,clamp(tx+.22),top-.42,z+.1,tx,top-.18,z+.1];tree.stroke.geometry.attributes.position.array.set(pts);tree.stroke.geometry.attributes.position.needsUpdate=true;}
      for(const f of flakes){const fy=border.bottom+((f.y-t*f.speed)%1+1)%1*(h-.06);const a=f.stroke.geometry.attributes.position;a.setXYZ(0,f.x,fy,z+.12);a.setXYZ(1,Math.max(border.left,f.x-(moving?.025:.008)),Math.max(border.bottom,fy-(moving?.07:.02)),z+.12);a.needsUpdate=true;}
    };update(0);animations[key].push(update);
    box(g,w+.3,.12,.32,x,border.bottom-.08,z+.1);
  }
  function train(){
    const g=group(root);floor(g,6,7);
    box(g,6,3.6,.16,0,1.75,-2.6);box(g,.16,3.6,7,-3,1.75,0);box(g,.16,3.6,7,3,1.75,0);box(g,6,.12,7,0,3.5,0);
    forestWindow(g,-.5,2.02,-2.48,4.2,1.72,'train',true);
    box(g,4.5,.14,.36,-.5,2.97,-2.3,true);box(g,6,.1,.12,0,.67,-2.48);
    for(let x=-2.7;x<2.9;x+=.24)sphere(g,.018,.018,.018,x,3.24,-2.49,true);
    // The empty seat opposite and a softly folded scarf.
    const seat=group(g,2,0,-.6);seat.rotation.y=-Math.PI/2;
    roundBox(seat,1.25,.27,1.2,0,.59,0);roundBox(seat,1.25,1.5,.2,0,1.34,-.55);
    for(const x of [-.5,.5]){rod(seat,[x,.3,-.5],[x,1,-.5],.045);rod(seat,[x,1,-.5],[x,1,.48],.04);}
    for(let i=0;i<9;i++)line(seat,[[-.53+i*.13,.78,-.42],[-.53+i*.13,1.9,-.42]]);
    box(seat,.42,.04,.7,.3,.77,.1);for(let i=0;i<5;i++)line(seat,[[.13+i*.08,.8,-.24],[.13+i*.08,.8,.44]]);
    // Luggage rack, suitcase and straps above the companion seat.
    box(g,1.1,.08,2.5,2.35,2.8,-.45);for(let z=-1.5;z<.8;z+=.18)rod(g,[1.8,2.86,z],[2.85,2.86,z],.012);
    roundBox(g,.7,.48,1.1,2.35,3.09,-.5,.07);box(g,.73,.05,.08,2.35,3.12,-.83,true);box(g,.73,.05,.08,2.35,3.12,-.18,true);
    const table=sideTable(g,-.35,.05,.78);mug(table,-.28,1.01,-.12,1,'train');book(table,.19,1.05,-.12,.5,.46);
    box(table,.48,.008,.2,.12,1.01,.32);flatLabel(table,'ONE WAY · ANYWHERE',.43,.1,.12,1.018,.32);
    label(g,'THE SLOW WAY HOME',1.25,.17,2.03,2.22,-2.49,{serif:false});
    for(const x of [-2,0,2])roundBox(g,.9,.06,.24,x,3.37,-.6,.03);
    return g;
  }
  function cabin(){
    const g=group(root);floor(g,8,8);box(g,8,4.6,.16,0,2.24,-3.15);box(g,.16,4.6,8,-4,2.24,0);box(g,.16,4.6,8,4,2.24,0);
    for(let y=.22;y<4.5;y+=.32)line(g,[[-4,y,-3.059],[4,y,-3.059]]);
    for(const x of [-3,0,3])box(g,.19,.22,8,x,4.1,0,true);
    // Stone hearth, with a deep black firebox and paper-white flame tongues.
    box(g,2.65,.2,1.1,0,.1,-2.66);box(g,2.3,3.8,.55,0,1.95,-2.94);
    box(g,1.62,1.76,.06,0,1.06,-2.62,true);
    for(let row=0;row<7;row++)for(const x of [-.97,.97])box(g,.35,.31,.13,x,.37+row*.35,-2.59);
    for(let y=2.17;y<3.8;y+=.32){line(g,[[-1.1,y,-2.65],[1.1,y,-2.65]]);for(let x=-1;x<1;x+=.55)line(g,[[x,y,-2.65],[x+.03,y+.31,-2.65]]);}
    box(g,2.7,.17,.85,0,2.28,-2.85,true);
    for(const z of [-2.2,-2.06]){const log=cylinder(g,.09,.12,1.25,0,.35,z);log.rotation.z=Math.PI/2;}
    for(let i=0;i<7;i++){
      const path=new THREE.Shape();path.moveTo(-.13,0);path.bezierCurveTo(-.31,.29,-.02,.46,.02,.85);path.bezierCurveTo(.03,.57,.28,.33,.13,0);path.closePath();const flame=new THREE.Mesh(new THREE.ShapeGeometry(path),white);flame.position.set(-.57+i*.19,.38,-2.31+i*.003);g.add(flame);
      flame.scale.set(.8,.55+random()*.55,1);const height=flame.scale.y;
      animations.cabin.push(t=>{flame.scale.y=height*(1+Math.sin(t*2.2+i)*.12);flame.rotation.z=Math.sin(t*1.5+i)*.06;});
    }
    for(let i=0;i<8;i++){const spark=sphere(g,.012,.028,.007,0,.7,-2.24);spark.material=white;animations.cabin.push(t=>{spark.position.set(Math.sin(i*3+t)*.45,.65+((t*.13+i*.17)%1)*1,-2.24);});}
    cylinder(g,.12,.16,.4,-.8,2.56,-2.79);book(g,.5,2.43,-2.7,.65,.35);book(g,.52,2.53,-2.7,.6,.3,true);
    forestWindow(g,2.58,2.2,-3.03,1.65,1.8,'cabin');box(g,.06,1.83,.08,2.58,2.2,-2.86);box(g,1.67,.06,.08,2.58,2.2,-2.86);
    // A small basket of logs to the left of the hearth.
    cylinder(g,.47,.36,.55,-1.93,.29,-2.13);for(let i=0;i<5;i++){const log=cylinder(g,.07,.09,.82,-2.15+i*.11,.64,-2.13);log.rotation.z=.6;}
    const table=sideTable(g,1.1,-.1,.6);mug(table,0,1.01,0,1,'cabin');book(table,-.18,1.03,.24,.43,.3);
    // The blanket across your knees enters only the bottom of your view.
    roundBox(g,1.2,.16,.8,-.25,.86,1.05,.08);
    for(let x=-.8;x<.4;x+=.09)line(g,[[x,.949,.67],[x,.949,1.4]]);
    for(let z=.7;z<1.4;z+=.13)line(g,[[-.8,.951,z],[.3,.951,z]]);
    const rug=cylinder(g,1,1,.02,0,.001,-.4);rug.scale.set(2.4,1,1.4);
    for(let i=0;i<12;i++){const r=ring(g,.25+i*.16,.006,0,.02,-.4,true);r.rotation.x=-Math.PI/2;r.scale.y=.58;}
    return g;
  }
  function seaside(){
    const g=group(root);box(g,180,.1,100,0,-.12,-52,true);floor(g,8,7);
    // Wide open water, built from moving strokes instead of a flat backdrop.
    for(let i=0;i<65;i++){
      const z=-4-i*.8,x=-24+random()*48,length=.5+random()*3;
      const wave=line(g,[[x,.001,z],[x+length*.3,.001,z-.03],[x+length*.65,.001,z+.03],[x+length,.001,z]],true);
      animations.seaside.push(t=>{wave.position.x=Math.sin(t*.35+i)*.35;wave.position.z=Math.sin(t*.24+i)*.12;});
    }
    box(g,8,.14,.18,0,1.13,-2.35,true);box(g,8,.09,.13,0,.42,-2.35);
    for(let x=-3.9;x<4;x+=.34)box(g,.055,.7,.055,x,.76,-2.35);
    for(const x of [-3.85,3.85])box(g,.18,1.3,.18,x,.65,-2.35);
    // A distant lighthouse and a little sailboat on the horizon.
    sphere(g,2.7,.27,1.5,-8,.03,-23,true);cylinder(g,.25,.5,2.6,-8,1.4,-23);cylinder(g,.4,.4,.2,-8,2.83,-23,true);cylinder(g,.28,.28,.4,-8,3.1,-23);sphere(g,.39,.16,.39,-8,3.4,-23,true);
    const boat=group(g,6.5,.2,-17);sphere(boat,.8,.13,.23,0,0,0);rod(boat,[0,.08,0],[0,2,0],.025);shape(boat,[[.06,.25],[.06,1.95],[1,.25]],0,0,0);shape(boat,[[-.08,.3],[-.08,1.55],[-.65,.3]],0,0,.01);
    animations.seaside.push(t=>{boat.rotation.z=Math.sin(t*.45)*.025;boat.position.y=.2+Math.sin(t*.5)*.04;});
    for(let i=0;i<3;i++){const bird=group(g,-5+i*4,4+i*.3,-22-i*4);curve(bird,[[-.3,0,0],[-.13,.08,0],[0,0,0],[.13,.08,0],[.3,0,0]],.018);animations.seaside.push(t=>{bird.position.x=-5+i*4+Math.sin(t*.08+i)*3;bird.rotation.z=Math.sin(t*.7+i)*.08;});}
    // The balcony is edged by linen and a terracotta herb pot.
    box(g,.15,4,6,-4,1.9,0);rod(g,[-3.8,3.5,-1],[-2.4,3.5,-1],.025);
    const curtain=group(g,-3.2,3.45,-1);for(let i=0;i<10;i++)curve(curtain,[[-.55+i*.12,0,0],[-.56+i*.12,-1.2,.08],[-.46+i*.12,-2.5,.2]],.045,false);
    animations.seaside.push(t=>{curtain.rotation.z=Math.sin(t*.36)*.018;});
    plant(g,2.8,0,-1.82,1.2);
    const table=sideTable(g,.8,-.08,.76);book(table,-.16,1.03,.12,.75,.56);flatLabel(table,'the long way round',.6,.14,-.16,1.079,.12);mug(table,.25,1.01,-.22,.9,'seaside');
    return g;
  }
  function bookstore(){
    const g=group(root);floor(g,8,9);box(g,8,4.6,.16,0,2.24,-3.6);box(g,.16,4.6,9,-4,2.24,0);box(g,.16,4.6,9,4,2.24,0);
    function shelf(x,z,w,angle=0){const s=group(g,x,0,z);s.rotation.y=angle;box(s,w,3.8,.18,0,1.9,-.14);for(const side of [-1,1])box(s,.11,3.85,.52,side*w/2,1.93,.05);for(let row=0;row<5;row++){const y=.22+row*.73;box(s,w,.09,.6,0,y,.1);let bx=-w/2+.12;while(bx<w/2-.15){const width=.1+random()*.08,h=.32+random()*.29;const b=box(s,width,h,.32,bx+width/2,y+.05+h/2,.12,random()<.2);if(random()<.12)b.rotation.z=.06;line(s,[[bx+.025,y+.16,.286],[bx+width-.015,y+.16,.286]]);bx+=width+.025;}}return s;}
    shelf(-2.55,-3.36,2.5);shelf(2.55,-3.36,2.5);shelf(-3.73,-.3,2.3,Math.PI/2);shelf(3.73,-.4,2.3,-Math.PI/2);
    // A darkened aisle between the shelves, with another bookcase in the distance.
    box(g,2.17,2.8,.04,0,1.4,-3.48,true);label(g,'FICTION & OTHER WORLDS',2.1,.25,0,3.03,-3.38);
    for(let y=.35;y<2.7;y+=.43){line(g,[[-.85,y,-3.45],[.85,y,-3.45]],true);for(let x=-.8;x<.8;x+=.12)line(g,[[x,y+.04,-3.44],[x,y+.29,-3.44]],true);}
    // Rolling ladder, brass-style reading lamp, and a clock that keeps quiet time.
    for(const x of [1.07,1.5])rod(g,[x,.02,-2.28],[x,3.3,-3.12],.025);
    for(let i=0;i<9;i++)rod(g,[1.07,.23+i*.33,-2.34-i*.085],[1.5,.23+i*.33,-2.34-i*.085],.025);
    const clock=group(g,0,3.65,-3.38);const face=cylinder(clock,.32,.32,.05,0,0,0);face.rotation.x=Math.PI/2;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;line(clock,[[Math.sin(a)*.25,Math.cos(a)*.25,.03],[Math.sin(a)*.28,Math.cos(a)*.28,.03]]);}
    rod(clock,[0,0,.04],[-.11,.12,.04],.012);rod(clock,[0,0,.04],[.16,-.09,.04],.009);const hand=line(clock,[[0,0,.05],[0,.24,.05]]);animations.bookstore.push(t=>{hand.rotation.z=-t*Math.PI/30;});
    const desk=group(g,0,0,-.15);box(desk,2.55,.12,1.35,0,.98,0);for(const x of [-1.05,1.05])for(const z of [-.5,.5])box(desk,.08,.92,.08,x,.46,z,true);
    // An open book lies within reach; the pages are actual separate surfaces.
    const open=group(desk,-.12,1.08,.1);for(const side of [-1,1]){const page=group(open,side*.27,0,0);page.rotation.z=side*.06;box(page,.52,.035,.63,0,0,0);flatLabel(page,side<0?'Chapter one':'a little further',.4,.08,0,.021,-.19);for(let row=0;row<9;row++)line(page,[[-.2,.023,-.08+row*.032],[.16+(row%3)*.018,.023,-.08+row*.032]]);}
    cylinder(desk,.19,.22,.04,-.92,1.07,-.26,true);rod(desk,[-.92,1.09,-.26],[-.92,1.72,-.26],.018);rod(desk,[-.92,1.72,-.26],[-.58,1.94,-.26],.018);cylinder(desk,.14,.3,.23,-.58,1.92,-.26);
    mug(desk,.83,1.06,-.21,.85,'bookstore');book(desk,.89,1.11,.23,.43,.36,true);book(desk,.86,1.21,.23,.46,.35);
    label(g,'please, take your time',1.2,.18,-2.5,3.96,-3.2,{italic:true});
    plant(g,-2.5,0,-1.6,.7);
    return g;
  }
  return {
    train:{make:train,title:'The slow train',subtitle:'Rain on glass. Miles of daydreams.',place:'SOMEWHERE BETWEEN STATIONS',caption:'THE WORLD PASSES. YOU CAN STAY STILL.',moment:'The pleasure of being on your way.',description:'Seated at a train window, with passing trees, rain and a cup of tea.',eye:[0,1.65,1.65],yaw:-.08,pitch:-.12,mood:.15},
    cabin:{make:cabin,title:'A cabin in the snow',subtitle:'A fire. A blanket. The world outside.',place:'A LITTLE FURTHER NORTH',caption:'LET THE FIRE KEEP THE TIME.',moment:'Warmth, with nowhere else to be.',description:'Seated under a blanket before a cabin fireplace, with snow outside.',eye:[0,1.65,1.65],yaw:.05,pitch:-.12,mood:0},
    seaside:{make:seaside,title:'A morning by the sea',subtitle:'Salt air, and absolutely no plans.',place:'WHERE THE LAND ENDS',caption:'NOTHING ON THE HORIZON TO DO.',moment:'A whole morning, unclaimed.',description:'Seated on a seaside balcony, looking past your book toward waves and a sailboat.',eye:[0,1.7,1.3],yaw:.02,pitch:-.16,mood:1},
    bookstore:{make:bookstore,title:'Lost in a bookshop',subtitle:'One more page. Then one more.',place:'THE QUIET END OF THE STREET',caption:'THE REST OF THE WORLD CAN WAIT.',moment:'Somewhere between the pages.',description:'Seated at a bookshop reading desk with an open book, surrounded by shelves.',eye:[0,1.68,1.65],yaw:0,pitch:-.12,mood:.25},
  };
}
