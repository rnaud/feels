import { eventPhase, eventCycle } from './scene-events.js';

// Locally synthesized, softly positioned sound. No downloads or autoplay.
const layers={
 home:[[1500,'lowpass',.40,.08,-.35],[3100,'highpass',.10,.13,.35],[140,'lowpass',.018,0,0]],
 paris:[[430,'lowpass',.10,.18,.5],[850,'bandpass',.035,.7,-.55],[1500,'bandpass',.018,1.1,.65]],
 train:[[150,'lowpass',.34,1.3,0],[1600,'lowpass',.11,.12,-.4],[700,'bandpass',.025,.7,.5]],
 cabin:[[650,'lowpass',.22,.18,.15],[2700,'highpass',.035,.25,.1],[250,'lowpass',.025,.09,-.65]],
 seaside:[[1100,'lowpass',.36,.12,-.35],[2500,'highpass',.08,.14,.4]],
 bookstore:[[280,'lowpass',.025,0,-.2],[1100,'bandpass',.009,.16,.65]],
 greenhouse:[[1500,'lowpass',.30,.10,-.5],[3100,'highpass',.08,.17,.5],[650,'bandpass',.025,.21,0]],
 jazz:[[500,'lowpass',.018,.3,.65],[4200,'highpass',.008,.8,-.5]],
 rooftop:[[680,'lowpass',.12,.09,-.4],[330,'bandpass',.025,.21,.5]],
 ferry:[[110,'lowpass',.25,.45,0],[1200,'lowpass',.20,.13,-.6],[2300,'highpass',.055,.15,.6]],
 kitchen:[[100,'lowpass',.035,0,-.65],[2100,'highpass',.006,.11,.3]]
};
export class Ambience {
 constructor(){this.ctx=null;this.enabled=false;this.volume=.4;this.nodes=[];this.spatial=new Set();this.timer=null;this.heading=0;this.eventHistory=new Map();}
 init(){
  if(this.ctx)return;
  this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=0;
  const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.ratio.value=5;
  this.master.connect(limiter);limiter.connect(this.ctx.destination);
  const length=this.ctx.sampleRate*5;this.noise=this.ctx.createBuffer(1,length,this.ctx.sampleRate);
  const data=this.noise.getChannelData(0);let brown=0;
  for(let i=0;i<length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*8;}
 }
 position(input,pan=0,bus=this.bus){
  const node=this.ctx.createStereoPanner(),entry={node,pan};
  node.pan.value=this.panValue(pan);input.connect(node);node.connect(bus);this.spatial.add(entry);
  return ()=>{this.spatial.delete(entry);node.disconnect();};
 }
 panValue(pan){return Math.sin(Math.asin(Math.max(-.95,Math.min(.95,pan)))-this.heading)*.85;}
 setHeading(heading){
  if(Math.abs(heading-this.heading)<.002)return;this.heading=heading;
  if(!this.ctx)return;
  for(const {node,pan}of this.spatial)node.pan.setTargetAtTime(this.panValue(pan),this.ctx.currentTime,.08);
 }
 layer(frequency,type,gain,swell=0,pan=0){
  const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),level=this.ctx.createGain();
  source.buffer=this.noise;source.loop=true;filter.type=type;filter.frequency.value=frequency;
  filter.Q.value=.55;level.gain.value=swell?gain*.65:gain;
  source.connect(filter);filter.connect(level);const dispose=this.position(level,pan);
  source.start(0,Math.random()*4);this.nodes.push(source,filter,level,{disconnect:dispose});
  if(swell){const lfo=this.ctx.createOscillator(),depth=this.ctx.createGain();lfo.frequency.value=swell;depth.gain.value=gain*.35;lfo.connect(depth);depth.connect(level.gain);lfo.start();this.nodes.push(lfo,depth);}
 }
 rustle(frequency,duration,gain,pan=0){
  if(!this.enabled||document.hidden)return;
  const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain(),now=this.ctx.currentTime;
  source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;
  amp.gain.setValueAtTime(0,now);amp.gain.linearRampToValueAtTime(gain,now+Math.min(.15,duration*.2));amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter);filter.connect(amp);const dispose=this.position(amp,pan);
  source.start(now,Math.random()*2);source.stop(now+duration);source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();dispose();};
 }
 tone(frequency,duration,gain,type='sine',pan=0,slide=1){
  if(!this.enabled||document.hidden)return;
  const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),amp=this.ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*slide,now+duration);
  amp.gain.setValueAtTime(0,now);amp.gain.linearRampToValueAtTime(gain,now+.015);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(amp);const dispose=this.position(amp,pan);osc.start();osc.stop(now+duration);osc.onended=()=>{osc.disconnect();amp.disconnect();dispose();};
 }
 setScene(name){
  this.scene=name;if(!this.ctx||!this.enabled)return;
  this.musicStep=0;clearTimeout(this.timer);
  const old=this.nodes,oldBus=this.bus;
  if(oldBus){oldBus.gain.setTargetAtTime(0,this.ctx.currentTime,.15);setTimeout(()=>{for(const n of old){if(n.stop)try{n.stop();}catch{}n.disconnect();}oldBus.disconnect();},900);}
  this.nodes=[];this.bus=this.ctx.createGain();this.bus.gain.value=0;this.bus.connect(this.master);this.bus.gain.setTargetAtTime(1,this.ctx.currentTime,.3);
  // A short, very quiet room reflection distinguishes interiors from open air.
  if(['home','cabin','bookstore','jazz','kitchen'].includes(name)){
   const delay=this.ctx.createDelay(.3),reflection=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
   delay.delayTime.value=name==='jazz'?.13:.065;reflection.gain.value=.12;filter.type='lowpass';filter.frequency.value=1800;
   this.bus.connect(delay);delay.connect(filter);filter.connect(reflection);reflection.connect(this.master);this.nodes.push(delay,filter,reflection);
  }
  for(const args of layers[name]||layers.home)this.layer(...args);this.schedule(name);
 }
 updateEvents(scene,time,events){
  for(const event of events){
   const id=scene+':'+event.name,cycle=eventCycle(time,event),previous=this.eventHistory.get(id);
   this.eventHistory.set(id,cycle);
   if(cycle>=0&&cycle!==previous&&eventPhase(time,event)>=0&&this.enabled)this.eventSound(event);
  }
 }
 eventSound({sound,pan}){
  if(sound==='bicycle'){this.rustle(1400,6,.045,pan);this.tone(2400,.5,.012,'sine',pan);}
  if(sound==='train'){this.rustle(450,5.8,.22,pan);this.rustle(1700,4,.08,-pan);}
  if(sound==='fire')this.rustle(1900,.18,.10,pan);
  if(sound==='wave')this.rustle(1400,5,.13,pan);
  if(sound==='bird'){this.tone(2100,.16,.012,'sine',pan,1.25);this.tone(2700,.3,.006,'sine',pan,.82);}
  if(sound==='drip'){this.tone(1350,.16,.018,'sine',pan,.55);this.rustle(2500,.12,.009,pan);}
  if(sound==='fabric')this.rustle(1200,.7,.025,pan);
  if(sound==='horn'){this.tone(146.83,2.4,.014,'sine',pan);this.tone(220,2.2,.006,'sine',pan);}
  if(sound==='jazz')this.rustle(4500,.8,.016,pan);
 }
 schedule(name){
  if(!this.enabled)return;
  const delays={home:()=>600+Math.random()*1500,paris:()=>2600+Math.random()*5000,train:()=>690,cabin:()=>350+Math.random()*1400,seaside:()=>9000+Math.random()*8000,bookstore:()=>4000+Math.random()*6000,greenhouse:()=>600+Math.random()*1500,jazz:()=>900,rooftop:()=>7000+Math.random()*7000,ferry:()=>15000+Math.random()*9000,kitchen:()=>1000};
  this.timer=setTimeout(()=>{
   if(name==='home')this.tone(900+Math.random()*600,.08,.009,'sine',-.3, .65);
   if(name==='paris'){this.tone(2100,.30,.014,'sine',-.3);this.tone(3100,.16,.004,'sine',-.3);this.rustle(650,1.1,.02,.6);}
   if(name==='train'){this.tone(85,.11,.04,'sine',.2);this.rustle(380,.09,.065,-.3);}
   if(name==='cabin')this.rustle(1200+Math.random()*1800,.025+Math.random()*.08,.075,.1);
   if(name==='seaside')this.tone(1300+Math.random()*300,.5,.008,'sine',.6,.75);
   if(name==='bookstore')this.rustle(1700,.5,.022,-.5);
   if(name==='greenhouse')this.tone(1100+Math.random()*1700,.10,.009,'sine',Math.random()-.5,.7);
   if(name==='jazz'){
    const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[146.83,174.61,220,261.63],[98,123.47,146.83,174.61]];
    const step=this.musicStep++,chord=chords[Math.floor(step/8)%4];
    if(step%2===0){this.tone(chord[0]/2,.65,.035,'triangle',.3);this.rustle(4400,.21,.014,.15);}
    if(step%4===1)for(const f of chord.slice(1))this.tone(f*2,1.25,.008,'sine',-.4);
    if(step%4===3)this.tone(chord[(Math.floor(step/4)%3)+1]*2,.8,.012,'sine',-.4);
   }
   if(name==='rooftop')this.tone(2100,.15,.006,'sine',-.6,1.2);
   if(name==='ferry')this.rustle(1400,3,.045,.5);
   if(name==='kitchen')this.tone(700,.018,.004,'sine',.55);
   this.schedule(name);
  },(delays[name]||delays.home)());
 }
 async toggle(scene){this.init();await this.ctx.resume();this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.25);if(this.enabled)this.setScene(scene);else clearTimeout(this.timer);return this.enabled;}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.1);}
}
