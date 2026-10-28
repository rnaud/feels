import * as THREE from 'three';

// Draw shadows with stable, surface-anchored pen strokes, rather than gray fills.
export function createHatchedPaper(inkColor) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mood = { value: 0 };
  material.userData.mood = mood;
  material.onBeforeCompile = shader => {
    shader.uniforms.inkMood = mood;
    shader.uniforms.inkColor = { value: new THREE.Color(inkColor) };
    shader.vertexShader = `varying vec3 vInkPosition;\nvarying vec3 vInkNormal;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vInkPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vInkNormal = inverseTransformDirection(normalize(normalMatrix * normal), viewMatrix);
    `);
    shader.fragmentShader = `
      uniform float inkMood;
      uniform vec3 inkColor;
      varying vec3 vInkPosition;
      varying vec3 vInkNormal;
      float penStroke(float coordinate, float weight) {
        float distanceToStroke = abs(fract(coordinate) - 0.5);
        float aa = min(fwidth(coordinate) * 0.65, 0.22);
        float distantFade = 1.0 - smoothstep(0.7, 1.2, fwidth(coordinate));
        return (1.0 - smoothstep(weight, weight + aa, distanceToStroke)) * distantFade;
      }
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec3 n = normalize(vInkNormal);
      vec3 toLamp = vec3(-2.8, 2.6, -0.45) - vInkPosition;
      float lampLight = max(dot(n, normalize(toLamp)), 0.0);
      float homeLight = 0.25 + lampLight * 0.9 / (1.0 + length(toLamp) * 0.13);
      float parisLight = 0.42 + max(dot(n, normalize(vec3(-0.4, 1.0, -0.3))), 0.0) * 0.65;
      float light = mix(homeLight, parisLight, inkMood);
      vec3 an = abs(n);
      vec2 surface = an.y > an.x && an.y > an.z ? vInkPosition.xz : (an.x > an.z ? vInkPosition.zy : vInkPosition.xy);
      float irregularity = sin(surface.x * 43.0 + surface.y * 17.0) * 0.06 + sin(surface.y * 71.0) * 0.035;
      float first = penStroke((surface.x + surface.y * 0.7) * 21.0 + irregularity, 0.042 + max(0.0, 0.5-light) * 0.13);
      float second = penStroke((surface.x - surface.y * 0.85) * 18.0 + irregularity, 0.035);
      // Bright pools stay bare paper; the far corners acquire a second hatch.
      float hatch = first * (1.0-smoothstep(0.61, 0.69, light));
      hatch = max(hatch, second * (1.0-smoothstep(0.31, 0.39, light)));
      diffuseColor.rgb = mix(diffuseColor.rgb, inkColor, hatch);
    `);
  };
  material.customProgramCacheKey = () => 'feels-hatched-paper-v1';
  return material;
}

// Short, imperfect pen segments give long edges a slight human wobble.
export function sketchEdges(geometry) {
  const edges = new THREE.EdgesGeometry(geometry, 25);
  const source = edges.attributes.position;
  const points = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i=0; i<source.count; i+=2) {
    a.fromBufferAttribute(source, i); b.fromBufferAttribute(source, i+1);
    const length = a.distanceTo(b);
    const segments = Math.max(1, Math.min(70, Math.ceil(length / 0.08)));
    const wobble = Math.min(length * 0.025, 0.005);
    const point = t => {
      const envelope = Math.sin(t*Math.PI);
      return a.clone().lerp(b,t).add(new THREE.Vector3(
        Math.sin(t*29+i*1.7), Math.sin(t*23+i*.9), Math.sin(t*31+i*1.3)
      ).multiplyScalar(envelope*wobble));
    };
    for(let j=0;j<segments;j++)points.push(point(j/segments),point((j+1)/segments));
  }
  edges.dispose();
  return new THREE.BufferGeometry().setFromPoints(points);
}
