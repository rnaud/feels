// Page-filling mode also works on phones without the browser Fullscreen API.
export function setupImmersive({canvas, selectRelative, soundToggle}) {
 const body=document.body, entry=document.querySelector('#enter-immersive');
 const controls=document.querySelector('#immersive-controls');
 let timer, scrollY=0, active=false;
 const wake=()=>{
  body.classList.remove('quiet-controls');clearTimeout(timer);
  if(active)timer=setTimeout(()=>{
   if(!controls.contains(document.activeElement)&&!controls.matches(':hover'))body.classList.add('quiet-controls');
  },3500);
 };
 function setActive(value){
  active=value;body.classList.toggle('immersive',value);entry.setAttribute('aria-expanded',value);
  controls.hidden=!value;
  for(const element of document.querySelectorAll('.header,.intro,.places,.moment,footer'))element.inert=value;
  if(value){scrollY=window.scrollY;canvas.focus({preventScroll:true});}
  else{window.scrollTo(0,scrollY);entry.focus({preventScroll:true});}
  wake();
 }
 entry.addEventListener('click',()=>setActive(true));
 document.querySelector('#leave-immersive').addEventListener('click',()=>setActive(false));
 document.querySelector('#immersive-previous').addEventListener('click',()=>selectRelative(-1));
 document.querySelector('#immersive-next').addEventListener('click',()=>selectRelative(1));
 document.querySelector('#immersive-sound').addEventListener('click',soundToggle);
 document.addEventListener('pointermove',wake,{passive:true});
 document.addEventListener('pointerdown',wake,{passive:true});
 document.addEventListener('focusin',wake);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&active&&!document.querySelector('dialog[open]'))setActive(false);
  wake();
 });
 return {wake};
}
