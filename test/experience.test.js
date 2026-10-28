import test from 'node:test';
import assert from 'node:assert/strict';
import {eventPhase,eventEnvelope} from '../src/scene-events.js';
import {framedFov} from '../src/view-framing.js';
import {Ambience} from '../src/ambience.js';

test('events have quiet intervals, smooth entrances, and repeat at the same phase',()=>{
 const event={start:12,duration:5,period:43};
 assert.equal(eventPhase(0,event),-1);assert.equal(eventPhase(11.99,event),-1);
 assert.equal(eventPhase(12,event),0);assert.equal(eventPhase(17,event),-1);
 assert.equal(eventPhase(55,event),0);assert.equal(eventPhase(57.5,event),.5);
 assert.equal(eventEnvelope(-1),0);assert.equal(eventEnvelope(0),0);assert.equal(eventEnvelope(1),0);
 assert.equal(eventEnvelope(.5),1);
});
test('phone framing stays human-scale instead of widening into a fisheye',()=>{
 for(const aspect of [390/844,844/390,1,1280/720]){
  const fov=framedFov(49,aspect);assert(fov>=49&&fov<57);
 }
});
test('audio starts muted, never creates a context from scene selection or animation',()=>{
 const audio=new Ambience();audio.setScene('home');audio.setHeading(.2);
 audio.updateEvents('home',12,[{name:'cat',start:10,duration:8,period:47}]);
 assert.equal(audio.enabled,false);assert.equal(audio.ctx,null);
});
test('scene event sounds fire once per occurrence and do not replay missed muted events',()=>{
 const audio=new Ambience(),heard=[];audio.eventSound=e=>heard.push(e.name);
 const events=[{name:'cat',start:10,duration:8,period:47}];
 audio.updateEvents('home',10,events);audio.enabled=true;
 audio.updateEvents('home',11,events);assert.equal(heard.length,0);
 audio.updateEvents('home',57,events);audio.updateEvents('home',57.1,events);assert.deepEqual(heard,['cat']);
 audio.updateEvents('home',104,events);assert.equal(heard.length,2);
 audio.updateEvents('home',220,events);assert.equal(heard.length,2);
});
test('stereo placement follows head direction and stays bounded',()=>{
 const audio=new Ambience();assert(audio.panValue(-.5)<0);assert(audio.panValue(.5)>0);
 const before=audio.panValue(.5);audio.setHeading(.3);assert(audio.panValue(.5)<before);
 for(const pan of [-2,-1,0,1,2])assert(Math.abs(audio.panValue(pan))<=.85);
});

test('all sound scenes construct and clean up their routing without audio output',async()=>{
 // Silent AudioNode doubles exercise the routing; nothing connects to hardware.
 const nodes=[];const param=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const makeNode=()=>{const n={gain:param(),frequency:param(),pan:param(),delayTime:param(),Q:param(),threshold:param(),ratio:param(),connect(){},disconnect(){this.disconnected=true;},start(){},stop(){queueMicrotask(()=>this.onended?.());}};nodes.push(n);return n;};
 const savedContext=globalThis.AudioContext,savedDocument=globalThis.document;
 globalThis.document={hidden:false};
 globalThis.AudioContext=class{
  currentTime=0;sampleRate=100;destination={};
  createGain=makeNode;createDynamicsCompressor=makeNode;createBufferSource=makeNode;
  createBiquadFilter=makeNode;createStereoPanner=makeNode;createOscillator=makeNode;createDelay=makeNode;
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
  async resume(){}
 };
 const audio=new Ambience();
 try{
  await audio.toggle('home');assert.equal(audio.enabled,true);
  for(const scene of ['paris','train','cabin','seaside','bookstore','greenhouse','jazz','rooftop','ferry','kitchen'])audio.setScene(scene);
  for(const sound of ['bicycle','train','fire','wave','bird','drip','fabric','horn','jazz'])audio.eventSound({sound,pan:.3});
  audio.setHeading(.4);await audio.toggle('kitchen');assert.equal(audio.enabled,false);
  await new Promise(resolve=>setTimeout(resolve,950));
  assert(nodes.some(n=>n.disconnected));
  assert(audio.spatial.size<=3,'retired scene panners are released');
 }finally{clearTimeout(audio.timer);globalThis.AudioContext=savedContext;globalThis.document=savedDocument;}
});
