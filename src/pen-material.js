import * as THREE from 'three';

// Fine, surface-attached ink strokes. The lit side stays white; shadow is drawn,
// rather than filled with gray. This is geometry shading, not a reference texture.
export function penPaper(density=0) {
  const material=new THREE.MeshBasicMaterial({color:0xffffff});
  material.onBeforeCompile=shader=>{
    shader.uniforms.penDensity={value:density};
    shader.vertexShader='varying vec3 penP; varying vec3 penN;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      penP=position;
      penN=inverseTransformDirection(normalize(normalMatrix*normal),viewMatrix);`);
    shader.fragmentShader='varying vec3 penP; varying vec3 penN; uniform float penDensity;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 n=normalize(penN); vec3 an=abs(n);
      vec2 p=an.y>an.x&&an.y>an.z?penP.xz:(an.x>an.z?penP.zy:penP.xy);
      float shade=clamp(.58-dot(n,normalize(vec3(.75,1.4,1.0)))+penDensity,0.0,1.0);
      float wobble=sin(p.y*113.+p.x*49.)*.055+sin(p.x*207.)*.025;
      float a=(p.x+p.y*.38)*65.+wobble;
      float b=(p.x-p.y*.77)*59.+wobble;
      float aa=max(fwidth(a)*.48,.03);
      float line=1.-smoothstep(.047,.047+aa,abs(fract(a)-.5));
      float cross=1.-smoothstep(.040,.040+max(fwidth(b)*.48,.03),abs(fract(b)-.5));
      float inkPatch=.16+sin(p.x*5.7+p.y*3.1)*.065;
      float marks=line*smoothstep(inkPatch,inkPatch+.12,shade);
      marks=max(marks,cross*smoothstep(.65,.80,shade));
      float fade=1.-smoothstep(.75,1.6,fwidth(a));
      diffuseColor.rgb=mix(vec3(1.),vec3(.075),marks*fade);`);
  };
  material.customProgramCacheKey=()=>`feels-pen-${density}`;
  return material;
}
