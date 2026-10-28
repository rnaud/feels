// Preserve a comfortable vertical lens on portrait screens; horizontal gaze
// reveals the sides instead of shrinking the entire room into a miniature.
export function framedFov(base, aspect) {
 const expansion=Math.min(1.18,Math.max(1,1.5/Math.max(.25,aspect)));
 return 2*Math.atan(Math.tan(base*Math.PI/360)*expansion)*180/Math.PI;
}
