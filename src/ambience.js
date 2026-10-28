// Locally synthesized ambience shared by both editions.
export class Ambience {
 constructor(){this.ctx=null;this.enabled=false;this.volume=.4;this.nodes=[];this.timer=null;}
 init(){if(this.ctx)return;this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);const length=this.ctx.sampleRate*4;this.noise=this.ctx.createBuffer(1,length,this.ctx.sampleRate);const data=this.noise.getChannelData(0);let brown=0;for(let i=0;i<length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*8;}}
 layer(frequency,type,gain,swell=0){const source=this.ctx.createBufferSource();source.buffer=this.noise;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;const level=this.ctx.createGain();level.gain.value=swell?gain*.65:gain;source.connect(filter);filter.connect(level);level.connect(this.bus);source.start();this.nodes.push(source,filter,level);if(swell){const lfo=this.ctx.createOscillator();const depth=this.ctx.createGain();lfo.frequency.value=swell;depth.gain.value=gain*.35;lfo.connect(depth);depth.connect(level.gain);lfo.start();this.nodes.push(lfo,depth);}}
 rustle(frequency,duration,gain){if(!this.enabled||document.hidden)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain(),now=this.ctx.currentTime;source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;amp.gain.setValueAtTime(0,now);amp.gain.linearRampToValueAtTime(gain,now+Math.min(.03,duration*.2));amp.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter);filter.connect(amp);amp.connect(this.bus);source.start(now,Math.random()*2);source.stop(now+duration);source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};}
 setScene(name){if(!this.ctx)return;this.musicStep=0;clearTimeout(this.timer);const old=this.nodes;const oldBus=this.bus;if(oldBus){oldBus.gain.setTargetAtTime(0,this.ctx.currentTime,.15);setTimeout(()=>{for(const n of old){if(n.stop)try{n.stop();}catch{}n.disconnect();}oldBus.disconnect();},800);}this.nodes=[];this.bus=this.ctx.createGain();this.bus.gain.value=0;this.bus.connect(this.master);this.bus.gain.setTargetAtTime(1,this.ctx.currentTime,.3);
 const layers={home:[[1700,'lowpass',.62],[2800,'highpass',.2]],paris:[[430,'lowpass',.2],[950,'bandpass',.045]],train:[[180,'lowpass',.48,1.3],[1500,'lowpass',.15]],cabin:[[650,'lowpass',.28,.18],[2700,'highpass',.055]],seaside:[[1150,'lowpass',.52,.12],[2300,'highpass',.14,.12]],bookstore:[[280,'lowpass',.035]],greenhouse:[[1500,'lowpass',.46],[3100,'highpass',.11]],jazz:[[500,'lowpass',.018],[4200,'highpass',.008]],rooftop:[[680,'lowpass',.15,.09]],ferry:[[110,'lowpass',.34,.45],[1200,'lowpass',.22,.13]],kitchen:[[100,'lowpass',.045],[2100,'highpass',.008]]};for(const args of layers[name])this.layer(...args);this.schedule(name);}
 tone(frequency,duration,gain,type='sine'){if(!this.enabled||document.hidden)return;const now=this.ctx.currentTime;const osc=this.ctx.createOscillator();const amp=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,now);amp.gain.setValueAtTime(0,now);amp.gain.linearRampToValueAtTime(gain,now+.015);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(amp);amp.connect(this.bus);osc.start();osc.stop(now+duration);osc.onended=()=>{osc.disconnect();amp.disconnect();};}
 schedule(name){
  if(!this.enabled)return;
  const delays={home:()=>200+Math.random()*800,paris:()=>2200+Math.random()*4200,train:()=>690,cabin:()=>350+Math.random()*1400,seaside:()=>8000+Math.random()*8000,bookstore:()=>1000,greenhouse:()=>350+Math.random()*900,jazz:()=>900,rooftop:()=>6500+Math.random()*7000,ferry:()=>12000+Math.random()*9000,kitchen:()=>1000};
  this.timer=setTimeout(()=>{
   if(name==='home')this.tone(700+Math.random()*900,.07,.013);
   if(name==='paris'){this.tone(1800+Math.random()*700,.35,.025);this.tone(3100,.16,.009);}
   if(name==='train'){this.tone(85,.11,.06);this.rustle(380,.09,.09);}
   if(name==='cabin')this.rustle(1200+Math.random()*1800,.025+Math.random()*.08,.11);
   if(name==='seaside'){this.tone(1300+Math.random()*300,.5,.009);}
   if(name==='bookstore'){this.tone(650,.018,.006);if(Math.random()<.055)this.rustle(1700,.45,.07);}
   if(name==='greenhouse'){this.tone(1100+Math.random()*1700,.10,.012);if(Math.random()<.3)this.rustle(2200,.18,.02);}
   if(name==='jazz'){
    const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[146.83,174.61,220,261.63],[98,123.47,146.83,174.61]];
    const step=this.musicStep++,chord=chords[Math.floor(step/8)%4];
    if(step%2===0){this.tone(chord[0]/2,.65,.045,'triangle');this.rustle(4400,.21,.018);}
    if(step%4===1)for(const f of chord.slice(1))this.tone(f*2,1.25,.009);
    if(step%4===3)this.tone(chord[(Math.floor(step/4)%3)+1]*2,.8,.015);
   }
   if(name==='rooftop'){this.tone(2100,.10,.007);this.tone(2600,.20,.004);}
   if(name==='ferry'){this.tone(98,2.8,.018);this.tone(146.83,2.6,.009);}
   if(name==='kitchen')this.tone(700,.018,.004);
   this.schedule(name);
  },delays[name]());
 }
 async toggle(scene){this.init();await this.ctx.resume();this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.25);if(this.enabled)this.setScene(scene);else clearTimeout(this.timer);return this.enabled;}
 setVolume(value){this.volume=value;if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?value:0,this.ctx.currentTime,.1);}
}
