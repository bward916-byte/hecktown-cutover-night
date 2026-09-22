/* ==== BODY: everyone's build and way of moving, from their look. DOM-free, shared by the game (gait) and the drawing (build).
   Builds run from slight to heavy; gait follows build and a bit of personality: how springy the step is, how far the knees
   give, how much the arms swing, whether someone stoops or stands tall. The hero keeps the rig's defaults. ==== */
(function(root){
'use strict';
const cache={};
function rnd(look){ const key=look.skin+look.hair+look.shirt+look.style+look.acc+(look.pants||'')+(look.top||''); let h=7; for(let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0; return k=>((h>>>k)%1000)/1000; }
const lerp=(a,b,t)=>a+(b-a)*t;
function buildOf(look){
  const key='b'+look.skin+look.hair+look.shirt+look.style+look.acc+(look.pants||'')+(look.top||''); if(cache[key]) return cache[key];
  const r=rnd(look), b=look.build||{}, kind=r(1);
  let d=kind<0.2?lerp(0.92,1.02,r(4)):(kind<0.62?lerp(1.02,1.16,r(4)):(kind<0.86?lerp(1.16,1.32,r(4)):lerp(1.3,1.48,r(4))));   // slight, average, sturdy, heavy
  if(b.d!=null) d=b.d;
  const belly=b.belly!=null?b.belly:(d>1.28?lerp(0.5,1,r(8)):(d>1.12&&r(12)<0.45?lerp(0.2,0.6,r(8)):(r(12)<0.12?0.2:0)));
  const out={h:b.h!=null?b.h:lerp(0.93,1.07,r(15)),d:d,belly:belly,sh:b.sh!=null?b.sh:lerp(0.94,1.22,r(18))*(d>1.3?1.05:1),kind:kind};
  return cache[key]=out; }
/* gait overrides the rig reads per walker (w.gait); every value stays inside the ranges the rig tests hold */
function gaitFor(look){
  const key='g'+look.skin+look.hair+look.shirt+look.style+look.acc+(look.pants||'')+(look.top||''); if(cache[key]) return cache[key];
  const r=rnd(look), B=buildOf(look), heavy=Math.max(0,Math.min(1,(B.d-1)/0.45)), spring=r(21);
  return cache[key]={ liftSlow:lerp(2.9,2.4,heavy)*lerp(0.92,1.1,spring), liftFast:lerp(6.6,5.0,heavy)*lerp(0.9,1.1,spring),
    crouchIdle:lerp(0.45,1.0,heavy)+r(24)*0.25, crouchWalk:lerp(1.0,1.7,heavy)+r(24)*0.2,
    leanSpeed:lerp(0.035,0.11,r(27)), armSwing:lerp(0.03,0.058,r(3))*lerp(1,0.85,heavy), elbowRest:lerp(0.14,0.42,r(6)),
    stoop:lerp(-0.035,0.075,r(9)), bobK:lerp(560,380,heavy), bobD:lerp(24,32,heavy), pace:lerp(0.82,1.08,r(13))*lerp(1,0.9,heavy) }; }
root.HBODY={buildOf:buildOf,gaitFor:gaitFor};
})(typeof globalThis!=='undefined'?globalThis:this);
