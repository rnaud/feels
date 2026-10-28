// Pure timeline functions keep visual events and their sounds on the same clock.
export function eventPhase(time,{start,duration,period}) {
 if(time<start)return -1;
 const local=(time-start)%period;
 return local<duration?local/duration:-1;
}
export function eventEnvelope(u) {
 if(u<0)return 0;
 const smooth=x=>x*x*(3-2*x);
 return smooth(Math.min(1,u*4))*smooth(Math.min(1,(1-u)*4));
}
export function eventCycle(time,event) {
 return time<event.start?-1:Math.floor((time-event.start)/event.period);
}
