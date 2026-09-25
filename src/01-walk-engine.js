/* ==== WALK ENGINE: the Stairwalk motion rig (round two), unchanged except for the world maker. DOM-free. ==== */
(function(root){
'use strict';

/* ---- Everything worth tuning lives here. World units: the character is ~64 tall. ---- */
const CFG = {
  // body
  thigh:15, shin:15, ankleH:3, torso:19, neck:2.6, headR:6.2, upperArm:9.5, foreArm:9,
  footBack:2.5, footBall:4, footToe:6.5,      // sole points measured from under the ankle
  // pace
  walkSpeed:78, accel:185, decel:320,
  cadenceUp:2.15, cadenceDown:2.4,            // treads per second on stairs (sets stair pace from tread width)
  // stepping
  stepMin:10, stepMax:31,                     // step length at a crawl / at full walk
  swingSlow:0.42, swingFast:0.32, swingStair:0.38, swingSettle:0.27,   // seconds a foot spends in the air
  liftSlow:2.9, liftFast:6.3, liftStair:3.2,    // how high the ankle arcs
  // posture
  crouchIdle:0.5, crouchWalk:1.1,             // how far below "legs locked straight" the hips ride
  heelOff:0.6, heelStrike:0.25, toeFirstUp:0.12, toeFirstDown:0.35,    // foot pitch, radians
  leanSpeed:0.07, leanAccel:0.06, leanClimb:0.17, leanDescend:-0.03,
  runSpeed:150, runAfter:0.45,                // hold a direction on open level floor this long and you run
  armSwing:0.045, elbowRest:0.22, stoop:0, bobK:480, bobD:26,
  // jumping
  jumpV:165, gravity:520, jumpRun:78, jumpPrep:0.13, squatJump:7,
  // crawling, rolling, throwing, reading, dancing
  crawlSpeed:20, crawlAccel:110, crawlStride:9,
  rollDist:50, rollTime:0.62,
  throwVx:215, throwVy:-115,
  readSlow:0.55, danceBeat:2
};

const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const ss=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const LEG=CFG.thigh+CFG.shin, LMAX=LEG*0.985;
const GA=(w,k)=>(w.gait&&w.gait[k]!=null)?w.gait[k]:CFG[k];     // a walker can carry its own gait (see 01b-body)

/* ---------------- World: nothing but level surfaces, sorted left to right. A stair is a run of narrow ones.
   Every floor, landing and flight in the game is one of these; the game layer moves a walker between them. ---------------- */
function makeWorld(s,opt){
  const world=Object.assign({ s:s, x0:s[0].x0+8, x1:s[s.length-1].x1-8,
    indexAt(px){ let lo=0,hi=s.length-1; if(px<=s[0].x0)return 0; if(px>=s[hi].x1)return hi;
      while(lo<hi){ const m=(lo+hi)>>1; if(px>=s[m].x1)lo=m+1; else hi=m; } return lo; },
    yAt(px){ return s[this.indexAt(px)].y; } },opt||{});
  world.hx0=world.x0; world.hx1=world.x1;                 // hard limits; x0/x1 may be pulled in by locked doors
  return world;
}
/* Surfaces from a little script: ['flat',len] and ['stairs',n,tread,rise] (rise>0 climbs to the right). */
function surfaces(x,y,parts){
  const s=[];
  for(const p of parts){
    if(p[0]==='flat'){ s.push({x0:x,x1:x+p[1],y:y,w:p[1]}); x+=p[1]; }
    else{ const n=p[1],tread=p[2],rise=p[3]; for(let i=0;i<n;i++){ y-=rise; if(i<n-1){ s.push({x0:x,x1:x+tread,y:y,w:tread}); x+=tread; } } }
  }
  return s;
}
/* Move a walker onto another world that shares the ground it is standing on. */
function rehome(w,world){
  for(const f of w.feet){ f.si=world.indexAt(f.px); f.tsi=world.indexAt(f.tx); }
}

/* Where may an ankle sit on surface i so the whole boot fits? (dir = which way the toe points) */
function footRange(world,i,dir){
  const f=world.s[i]; let a,b;
  if(dir>0){ a=f.x0+CFG.footBack+0.5; b=f.x1-CFG.footToe-0.5; }
  else     { a=f.x0+CFG.footToe+0.5;  b=f.x1-CFG.footBack-0.5; }
  if(a>b){ a=b=(a+b)/2; }
  return [a,b];
}

/* Ankle position for a planted foot: heel-up pitch pivots on the ball, toe-up pitch pivots on the heel. */
function ankleFor(px,py,pitch,face){
  const c=Math.cos(pitch), sn=Math.sin(pitch);
  if(pitch>=0){ const bx=px+face*CFG.footBall;
    return [bx+face*(-CFG.footBall*c+CFG.ankleH*sn), py-CFG.footBall*sn-CFG.ankleH*c]; }
  const hx=px-face*CFG.footBack;
  return [hx+face*(CFG.footBack*c+CFG.ankleH*sn), py+CFG.footBack*sn-CFG.ankleH*c];
}

function createWalker(world,x){
  const si=world.indexAt(x), gy=world.s[si].y;
  const mk=px=>({px:px,py:gy,si:si,face:1,planted:true,pitch:0,heel:0,landPitch:0,ax:px,ay:gy-CFG.ankleH,
                 settle:false,back:0,lx:0,ly:0,t:0,T:1,sx:0,sy:0,sp:0,tx:px,ty:gy,tsi:si,tax:px,tay:gy-CFG.ankleH,tp:0,lift:0,prof:'flat'});
  const hy=gy-(CFG.ankleH+LEG-CFG.crouchIdle);
  const w={x:x,y:hy,des:hy,by:hy,bv:0,vx:0,dir:1,facing:1,feet:[mk(x-1.6),mk(x+1.6)],arm:[0,0],lean:0,
           kneeF:1,grade:0,stair:0,tread:999,S:CFG.stepMin,thr:2.5,time:0,steps:0,events:[],scarf:[],
           mode:'walk',label:'standing',armB:[0.22,0.22],squat:0,sway:0,headAdd:0,vy:0,landHold:0,landSquat:0,
           jump:null,act:null,reading:false,readT:0,dancing:false,danceT:0,crawl:null,roll:null,fade:null,last:null,shots:[]};
  for(let i=0;i<6;i++){ const p={x:x-2-i*1.5,y:hy-CFG.torso+i*2.5}; p.ox=p.x; p.oy=p.y; w.scarf.push(p); }
  return w;
}

const destX=f=>f.planted?f.px:f.tx;

/* Where should the swinging foot come down? Predict where the hips will be at landing and reach half a step past that. */
function pickTarget(w,world,o,goalV,Trem){
  const dir=w.dir, rate=(Math.abs(goalV)<Math.abs(w.vx)?CFG.decel:CFG.accel)*Trem;
  const dv=clamp(goalV-w.vx,-rate,rate), vLand=w.vx+dv, vAvg=w.vx+dv*0.5;
  const sfL=clamp(Math.abs(vLand)/CFG.walkSpeed,0,1), S=lerp(CFG.stepMin,CFG.stepMax,sfL);
  let xf=w.x+vAvg*Trem+dir*S*0.5;
  const j=o.si; let i=world.indexAt(xf);
  if((i-j)*dir>1) i=j+dir;                              // never skip a tread
  if((i-j)*dir<0) i=j;
  if(i===j && world.s[j].w<20) i=j+dir;                 // narrow tread: one foot each
  i=clamp(i,0,world.s.length-1);
  if(i===j && (xf-o.px)*dir<4) xf=o.px+dir*4;           // always land ahead of the other foot
  const r=footRange(world,i,dir);
  return {i:i,tx:clamp(xf,r[0],r[1]),sf:sfL};
}

/* Point a foot at a landing spot, starting from wherever it is right now. */
function aim(w,world,f,i,tx,T,settle,sf){
  const ty=world.s[i].y, dy=ty-f.py;
  f.prof = dy<-0.5?'up':(dy>0.5?'down':'flat');
  if(f.prof!=='flat' && !settle) T=Math.max(T,CFG.swingStair*(f.planted?1:0.6));
  f.tp = settle?0:(f.prof==='up'?CFG.toeFirstUp:(f.prof==='down'?CFG.toeFirstDown:-CFG.heelStrike*sf));
  f.lift = f.prof==='flat'?(settle?2.2:lerp(GA(w,'liftSlow'),GA(w,'liftFast'),sf)):CFG.liftStair;
  if(!f.planted) f.lift*=0.5;                           // re-aimed in mid-air: no need to arc again
  f.face=w.facing;                                      // a boot turns around when it next leaves the ground
  const a=ankleFor(tx,ty,f.tp,f.face);
  f.planted=false; f.settle=settle; f.t=0; f.T=T; f.sx=f.ax; f.sy=f.ay; f.sp=f.pitch;
  f.tx=tx; f.ty=ty; f.tsi=i; f.tax=a[0]; f.tay=a[1];
  // climbing with the toe already against a riser (it happens after a turn): draw the foot back first
  const sf0=world.s[f.si], edge=f.face>0?sf0.x1:sf0.x0;
  f.back = f.prof==='up' ? Math.max(0,(f.ax+f.face*(CFG.footToe+0.5)-edge)*f.face) : 0;
}

function startStep(w,world,f,o,settle,goalV){
  if(settle){
    const r=footRange(world,o.si,w.facing);
    aim(w,world,f,o.si,clamp(o.px-w.facing*3,r[0],r[1]),CFG.swingSettle,true,0);
  }else{
    const T0=lerp(CFG.swingSlow,CFG.swingFast,clamp(Math.abs(w.vx)/CFG.walkSpeed,0,1));
    const tg=pickTarget(w,world,o,goalV,T0);
    aim(w,world,f,tg.i,tg.tx,T0,false,tg.sf);
  }
}

function swingPose(f){
  const t=f.t; let ux,uy;
  if(f.prof==='up'){        ux=ss((t-0.2)/0.8);   uy=ss(t/0.5);  }       // rise first, then reach
  else if(f.prof==='down'){ ux=ss(t/0.78);        uy=ss((t-0.3)/0.7); }  // reach first, then lower
  else { ux=lerp(t,ss(t),0.75); uy=ux; }
  f.ax=lerp(f.sx,f.tax,ux)-f.face*f.back*ss(t/0.15)*(1-ss((t-0.3)/0.4));
  f.ay=lerp(f.sy,f.tay,uy)-f.lift*Math.sin(Math.PI*Math.pow(t,0.85));
  f.pitch = f.prof==='up' ? lerp(f.sp,f.tp,ss((t-0.25)/0.5))    // keep the toe tucked until it is above the nosing
                          : lerp(f.sp,f.tp,ss(t*1.15));
}

/* =====================  WALKING (feet drive everything)  ===================== */
function stepWalk(w,world,input,dt,o){
  if(input){ w.dir=Math.sign(input); if(w.dir!==w.facing){ startFade(w,0.16); w.facing=w.kneeF=w.dir; } w.dancing=false; }   // a turn swings the limbs across
  const f0=w.feet[0], f1=w.feet[1], S_=world.s;

  // --- read the ground: are we on stairs, and which way do they go?
  const tread=Math.min(S_[world.indexAt(w.x)].w, S_[world.indexAt(w.x+w.dir*12)].w, S_[f0.si].w, S_[f1.si].w);
  const gradeNow=(world.yAt(w.x-w.dir*12)-world.yAt(w.x+w.dir*12))/24;      // + climbing, - descending
  w.grade+=(gradeNow-w.grade)*(1-Math.exp(-6*dt));
  const onStair=tread<40;
  w.stair+=((onStair?1:0)-w.stair)*(1-Math.exp(-7*dt));
  w.tread=tread;
  let vlim=CFG.walkSpeed*(w.reading?CFG.readSlow:1);
  if(onStair) vlim=Math.min(vlim,tread*(w.grade>0?CFG.cadenceUp:CFG.cadenceDown));

  // --- hips, horizontally
  let goal=input*vlim;
  if(!input) goal=clamp(((destX(f0)+destX(f1))/2-w.x)*5,-22,22);             // settle over the feet
  const speedingUp=Math.abs(goal)>Math.abs(w.vx)&&goal*w.vx>=0;
  const a=speedingUp?CFG.accel:CFG.decel, vPrev=w.vx;
  w.vx+=clamp(goal-w.vx,-a*dt,a*dt);
  if(!f0.planted||!f1.planted){                                              // mid-step, hips may not outrun the feet
    const maxD=Math.max(w.thr+3,10);
    for(const f of w.feet){ const d=destX(f)-w.x; if(d*w.vx<0){ const over=Math.abs(d)-maxD; if(over>0){ const cap=CFG.walkSpeed*clamp(1-over/7,0.12,1); w.vx=clamp(w.vx,-cap,cap); } } }
  }
  w.x+=w.vx*dt;
  if(w.x<world.x0){w.x=world.x0; if(w.vx<0)w.vx=0;} if(w.x>world.x1){w.x=world.x1; if(w.vx>0)w.vx=0;}

  const sp=Math.abs(w.vx), sf=clamp(sp/CFG.walkSpeed,0,1);
  w.S=lerp(CFG.stepMin,CFG.stepMax,sf);
  let thrRef=w.S*0.5; if(onStair) thrRef=Math.min(thrRef,tread*0.6);
  const together=f0.planted&&f1.planted&&Math.abs(f0.px-f1.px)<6;
  w.thr=together?2.5:thrRef;

  // --- feet in the air
  for(const f of w.feet) if(!f.planted){
    f.t+=dt/f.T;
    if(f.t>=1){ f.planted=true; f.px=f.tx; f.py=f.ty; f.si=f.tsi; f.landPitch=f.tp; f.heel=0; w.steps++;
      w.events.push({type:'step',x:f.px,y:f.py,speed:sp,stone:S_[f.si].w<40,prof:f.prof}); }
    else{
      if(!f.settle && f.t<0.75){                       // keep correcting the landing spot while there's time
        const ot=f===f0?f1:f0, tg=pickTarget(w,world,ot,goal,(1-f.t)*f.T);
        if(tg.i===f.tsi){ const d=clamp(tg.tx-f.tx,-90*dt,90*dt); f.tx+=d; f.tax+=d; }
        else aim(w,world,f,tg.i,tg.tx,Math.max(0.2,(1-f.t)*f.T),false,tg.sf);
      }
      swingPose(f);
    }
  }
  // --- decide whether a foot should leave the ground
  if(f0.planted&&f1.planted){
    if(input!==0 && w.vx*w.dir>0.5){
      const b0=(w.x-f0.px)*w.dir, b1=(w.x-f1.px)*w.dir;
      // lift the rear foot once it trails far enough, or early if the front foot won't stay ahead for a whole swing
      const lead=-Math.min(b0,b1), Tn=lerp(CFG.swingSlow,CFG.swingFast,sf);
      if(Math.max(b0,b1)>w.thr || (!together && lead<sp*Tn-0.85*w.thr)){ if(b0>=b1) startStep(w,world,f0,f1,false,goal); else startStep(w,world,f1,f0,false,goal); }
    }else if(!input && sp<30){
      if(Math.abs(f0.px-f1.px)>4.5||Math.abs(f0.py-f1.py)>0.5){
        if(f0.px*w.facing<=f1.px*w.facing) startStep(w,world,f0,f1,true,0); else startStep(w,world,f1,f0,true,0);
      }
    }
  }
  // --- feet on the ground: heel peels up as the hips pass ahead (o.tap lets a dance lift a heel too)
  const hRef=Math.max(thrRef,4);
  for(let i=0;i<2;i++){ const f=w.feet[i]; if(!f.planted)continue;
    const behind=(w.x-f.px)*w.dir;
    const hT=(f.face===w.dir?ss((behind-0.4*hRef)/(0.8*hRef))*CFG.heelOff:0)+o.tap[i];
    f.heel+=(hT-f.heel)*(1-Math.exp(-25*dt));
    f.landPitch*=Math.exp(-16*dt);
    f.pitch=f.heel+f.landPitch;
    const an=ankleFor(f.px,f.py,f.pitch,f.face); f.ax=an[0]; f.ay=an[1];
  }

  // --- hips, vertically: ride above the supporting foot, but never further than a leg can reach.
  //     w.squat is extra knee bend asked for by a jump wind-up, a landing, or a dance.
  w.squat+=(o.squat-w.squat)*(1-Math.exp(-(o.squat>w.squat?30:9)*dt));
  let ref=Infinity; for(const f of w.feet) if(f.planted) ref=Math.min(ref,f.py);
  if(ref===Infinity) ref=Math.min(f0.ty,f1.ty);
  for(const f of w.feet) if(!f.planted && f.ty>ref) ref+=(f.ty-ref)*ss(f.t)*0.7;   // start sinking early toward a lower landing
  const crouch=lerp(GA(w,'crouchIdle'),GA(w,'crouchWalk'),sf)+w.stair*0.6+w.squat;
  w.des+=(ref-(CFG.ankleH+LEG-crouch)-w.des)*(1-Math.exp(-(o.squat>0.5?26:10)*dt));
  let target=w.des;
  for(const f of w.feet){ const dx=Math.min(Math.abs(f.ax-w.x),LMAX-3); target=Math.max(target,f.ay-Math.sqrt(LMAX*LMAX-dx*dx)); }
  if(target>w.y) w.y=target; else w.y+=(target-w.y)*(1-Math.exp(-(onStair?10:26)*dt));

  upper(w,dt,o,sf,clamp((w.vx-vPrev)/dt/CFG.accel,-1,1));
  w.label = w.dancing?'dancing':(sp<3&&together ? (w.reading?'reading':'standing') : (onStair&&Math.abs(w.grade)>0.05 ? (w.grade>0?'climbing stairs':'descending stairs') : (sp<3?'standing':(w.reading?'reading on the move':'flat ground'))));

  // --- a jump winds up inside the walk (so the knees bend properly), then leaves the ground
  if(w.jump){ w.jump.t+=dt; if(w.jump.t>=CFG.jumpPrep) launch(w,input); }
}

/* Spring, lean, head, arm targets. Shared by walking and flight. */
function upper(w,dt,o,sf,accN){
  const F=w.facing;
  w.bv+=((w.y-w.by)*GA(w,'bobK')-w.bv*GA(w,'bobD'))*dt; w.by+=w.bv*dt;
  let leanT=(w.vx/CFG.walkSpeed)*GA(w,'leanSpeed')+accN*CFG.leanAccel+F*o.lean+(w.mode==='walk'?F*GA(w,'stoop'):0);
  if(w.mode==='walk') leanT+=F*w.stair*(w.grade>0.05?CFG.leanClimb:(w.grade<-0.05?CFG.leanDescend:0));
  w.lean+=(leanT-w.lean)*(1-Math.exp(-o.leanRate*dt));
  w.headAdd+=(o.head-w.headAdd)*(1-Math.exp(-9*dt));
  w.sway+=(o.sway-w.sway)*(1-Math.exp(-16*dt));
  const r=1-Math.exp(-o.rate*dt);
  for(let i=0;i<2;i++){
    const rel=(w.feet[i].ax-w.x)*F;
    let ta=w.mode==='air'?0:clamp(-rel*GA(w,'armSwing'),-0.8,0.8)*(0.35+0.65*sf), tb=GA(w,'elbowRest')+Math.max(0,ta)*0.9+sf*0.25;
    const oa=o.arm[i]; if(oa){ ta=lerp(ta,oa.a,oa.k); tb=lerp(tb,oa.b,oa.k); }
    w.arm[i]+=(ta-w.arm[i])*r; w.armB[i]+=(tb-w.armB[i])*r;
  }
}

/* =====================  OVERLAYS: what the arms, head and knees are asked to do on top of walking  =====================
   Arm targets are {a: shoulder angle from hanging (forward +), b: elbow bend, k: how much to override the walk swing}. */
function overlay(w,dt){
  const o={arm:[null,null],lean:0,leanRate:7,head:0,squat:0,sway:0,rate:12,tap:[0,0],prop:null};
  const set=(i,a,b,k)=>{ o.arm[i]={a:a,b:b,k:k==null?1:k}; };
  if(w.landHold>0){ w.landHold-=dt; o.squat=w.landSquat; }
  if(w.reading){ w.readT+=dt; const pg=w.readT%3.6, flip=pg<0.5?Math.sin(pg/0.5*Math.PI):0;       // now and then, turn a page
    set(0,0.70,1.52); set(1,0.78+flip*0.28,1.45-flip*0.55); o.head=0.36; o.prop='book'; }
  if(w.dancing){ w.danceT+=dt; const p=w.danceT*CFG.danceBeat, s1=Math.sin(Math.PI*p), s2=Math.sin(2*Math.PI*p);
    o.squat=2.2+2.6*(0.5-0.5*Math.cos(2*Math.PI*p)); o.sway=3.2*s1; o.lean=-0.10*s1; o.head=0.12*s2;
    set(1,1.7+0.95*s1,1.3+0.45*s2); set(0,1.7-0.95*s1,1.3-0.45*s2);
    o.tap=[Math.max(0,s2)*0.42,Math.max(0,-s2)*0.42]; o.rate=18; }
  if(w.jump){ set(0,-0.7,0.25); set(1,-0.85,0.25); o.lean=0.13; o.squat=Math.max(o.squat,CFG.squatJump); o.rate=24; o.prop=null; }
  if(w.mode==='air'){ const up=w.vy<0, fwd=Math.abs(w.vx)>20;
    if(up){ set(0,2.2,0.2); set(1,2.55,0.15); } else { set(0,1.0,0.55); set(1,1.35,0.5); }
    o.lean=fwd?(up?0.14:-0.06):0; o.rate=16; o.prop=null; }
  const I=w.idle;
  if(I&&w.mode==='walk'&&!w.reading&&!w.dancing&&!w.jump&&!w.act&&Math.abs(w.vx)<6){ I.t+=dt; const t=I.t, e=Math.min(1,t/0.45,Math.max(0,(I.dur-t)/0.45));
    if(I.name==='type'){ set(0,0.95,1.3+0.07*Math.sin(t*13),e); set(1,1.0,1.28+0.07*Math.sin(t*15+1),e); o.head=0.2*e; }
    else if(I.name==='sip'){ const lift=t<0.7?t/0.7:(t<2.0?1:Math.max(0,1-(t-2.0)/0.7)); set(1,0.55+0.75*lift,1.4+1.0*lift,e); set(0,0.1,0.35,e*0.5); o.head=-0.1*lift; o.prop='cup'; }
    else if(I.name==='phone'){ set(1,0.32,1.85,e); set(0,0.22,1.7,e*0.8); o.head=0.36*e; o.prop='phone'; }
    else if(I.name==='stretch'){ const up=Math.sin(Math.min(1,t/I.dur)*Math.PI); set(0,2.7*up,0.25,e); set(1,2.8*up,0.2,e); o.lean=-0.07*up; o.head=-0.12*up; o.rate=6; }
    else if(I.name==='fold'){ set(0,0.16,2.15,e); set(1,0.22,2.1,e); o.lean=-0.025*e; }
    else if(I.name==='shift'){ o.sway=1.7*Math.sin(t*0.9); o.head=0.07*Math.sin(t*0.6); o.lean=0.02*Math.sin(t*0.9); }
    if(t>=I.dur) w.idle=null; }
  const A=w.act;
  if(A){ A.t+=dt;
    if(A.name==='throw'){
      if(A.t<0.24){ set(1,-1.75,-1.2); set(0,0.95,0.3); o.lean=-0.17; o.rate=17; o.leanRate=14; o.prop='stone'; }
      else if(A.t<0.36){ set(1,2.0,0.1); set(0,-0.5,0.5); o.lean=0.30; o.rate=40; o.leanRate=26; if(A.t<0.30) o.prop='stone'; }
      else { set(1,0.8,0.4); set(0,-0.2,0.4); o.lean=0.10; o.rate=11; }
      if(A.t>=0.30&&!A.done){ A.done=true; const h=w.last?w.last.arms[1]:{hx:w.x,hy:w.y-20}, F=w.facing;
        w.shots.push({x:h.hx+F*1.5,y:h.hy-1,vx:F*CFG.throwVx+w.vx*0.6,vy:CFG.throwVy,a:0,rest:false,life:4});
        w.events.push({type:'throw'}); }
      if(A.t>0.66) w.act=null;
    }else if(A.name==='clap'){
      const f=3.4, u=A.t-0.16, s=u<0?1:0.5+0.5*Math.cos(2*Math.PI*f*u);           // s: how far apart the hands are
      set(1,1.02+s*0.32,1.35-s*0.28); set(0,1.02-s*0.30,1.35+s*0.10); o.rate=30; o.squat=Math.max(o.squat,0.9*(1-s)); o.head=-0.05; o.prop=null;
      if(u>=(A.n+0.5)/f){ A.n++; w.events.push({type:'clap'}); }
      if(A.n>=4&&u>=4/f+0.05) w.act=null;
    }
  }
  return o;
}

/* =====================  JUMPING  ===================== */
function launch(w,input){
  w.mode='air'; w.jump=null; w.vy=-CFG.jumpV; w.squat=0;
  if(Math.abs(input)>0.3) w.vx=w.dir*Math.max(Math.abs(w.vx),CFG.jumpRun*(0.55+0.45*Math.abs(input)));   // a held direction makes it a leap
  for(const f of w.feet){ f.planted=false; f.lx=f.ax-w.x; f.ly=f.ay-w.y; f.face=w.facing; }
  w.events.push({type:'jump'});
}
function stepAir(w,world,input,dt,o){
  const F=w.facing, up=w.vy<0;
  w.vy+=CFG.gravity*dt; w.vx+=input*45*dt;
  let nx=clamp(w.x+w.vx*dt,world.x0,world.x1); const ny=w.y+w.vy*dt;
  // legs: tuck on the way up, reach for the ground on the way down (further with the foot that is over lower ground)
  const g=[world.yAt(nx+w.feet[0].lx),world.yAt(nx+w.feet[1].lx)], gHi=Math.min(g[0],g[1]), dMax=Math.min(Math.max(g[0],g[1])-gHi,10);
  const lyLow=Math.min(28.4,26.5+dMax), reach=clamp(Math.abs(w.vx)*0.06,0,4.5);
  for(let i=0;i<2;i++){ const f=w.feet[i], lead=i===1;
    const tx=F*(up?(lead?5:-5.5):(lead?3+reach:-2.5+reach*0.5)), ty=up?(lead?20:23):lyLow-(dMax-Math.min(g[i]-gHi,10));
    f.lx+=(tx-f.lx)*(1-Math.exp(-11*dt)); f.ly+=(ty-f.ly)*(1-Math.exp(-(up?10:17)*dt));
    const d=Math.hypot(f.lx,f.ly); if(d>LMAX-0.6){ f.lx*=(LMAX-0.6)/d; f.ly*=(LMAX-0.6)/d; }
    f.pitch+=((up?0.55:0.12)-f.pitch)*(1-Math.exp(-12*dt)); }
  // a riser taller than we can clear stops us dead
  const sgn=Math.sign(w.vx)||F, probe=nx+sgn*(Math.max(Math.abs(w.feet[0].lx),Math.abs(w.feet[1].lx))+CFG.footToe+1);
  const sole=ny+Math.max(w.feet[0].ly,w.feet[1].ly)+CFG.ankleH;
  if(world.yAt(probe)<sole-4){ nx=w.x; w.vx=0; }
  w.x=nx; w.y=ny;
  for(const f of w.feet){ f.ax=w.x+f.lx; f.ay=w.y+f.ly; }
  upper(w,dt,o,clamp(Math.abs(w.vx)/CFG.walkSpeed,0,1),0);
  w.label='in the air';
  if(w.vy>0){ let pen=-Infinity; for(const f of w.feet) pen=Math.max(pen,f.ay+CFG.ankleH-world.yAt(f.ax));
    if(pen>=0){ w.y-=pen; for(const f of w.feet) f.ay-=pen; land(w,world); } }
}
function land(w,world){
  w.mode='walk'; w.des=w.y; w.landSquat=clamp(w.vy/24,3,9.5); w.landHold=0.10;
  w.events.push({type:'land',speed:w.vy,stone:world.s[world.indexAt(w.x)].w<40}); w.vy=0;
  for(const f of w.feet){ const si=world.indexAt(f.ax), r=footRange(world,si,w.facing);     // each boot gets a few frames to find a legal spot
    f.py=world.s[si].y; aim(w,world,f,si,clamp(f.ax,r[0],r[1]),0.07,true,0); }
}

/* =====================  CRAWLING: two hands and two knees, each planted until the body has moved past it  ===================== */
function crawlLimbs(w,world){
  const F=w.facing, mk=(rest,off)=>{ const x=w.x+F*(rest+off); return {rest:rest,x:x,y:world.yAt(x),planted:true,t:0,sx:0,sy:0,tx:x,ty:0}; };
  w.crawl={hands:[mk(20.5,2.4),mk(20.5,-2.4)],knees:[mk(1.5,-2.4),mk(1.5,2.4)],pitch:w.crawl?w.crawl.pitch:0.4};
}
function enterCrawl(w,world){ startFade(w,0.40); w.mode='crawl'; w.reading=w.dancing=false; w.act=null; w.jump=null; w.vx*=0.3; crawlLimbs(w,world); w.events.push({type:'pat'}); }
function standUp(w,world){
  startFade(w,0.45); w.mode='walk'; w.crawl=null; w.roll=null;
  const si=world.indexAt(w.x), r=footRange(world,si,w.facing);
  w.feet.forEach((f,i)=>{ f.planted=true; f.settle=false; f.si=si; f.py=world.s[si].y; f.px=clamp(w.x+(i?1.6:-1.6),r[0],r[1]); f.face=w.facing; f.heel=f.landPitch=f.pitch=0;
    const a=ankleFor(f.px,f.py,0,f.face); f.ax=a[0]; f.ay=a[1]; });
  w.des=w.y; w.by=w.y; w.bv=0; w.kneeF=w.facing; w.squat=0;
}
function stepCrawl(w,world,input,dt){
  if(input&&Math.sign(input)!==w.facing){ startFade(w,0.32); w.facing=w.dir=Math.sign(input); crawlLimbs(w,world); }   // shuffle round
  const F=w.facing, c=w.crawl;
  const slow=Math.min(world.s[world.indexAt(w.x)].w,world.s[world.indexAt(w.x+F*20)].w)<40?0.7:1;
  w.vx+=clamp(input*CFG.crawlSpeed*slow-w.vx,-CFG.crawlAccel*dt,CFG.crawlAccel*dt);
  w.x=clamp(w.x+w.vx*dt,world.x0,world.x1);
  for(const set of [c.hands,c.knees]) for(let i=0;i<2;i++){ const L=set[i], other=set[1-i];
    if(!L.planted){ L.t+=dt/0.26; const u=ss(L.t); L.x=lerp(L.sx,L.tx,u); L.y=lerp(L.sy,L.ty,u)-(set===c.hands?3:1.6)*Math.sin(Math.PI*clamp(L.t,0,1));
      if(L.t>=1){ L.planted=true; L.x=L.tx; L.y=L.ty; if(set===c.hands) w.events.push({type:'pat'}); } }
    else if(other.planted && (w.x+F*L.rest-L.x)*F>CFG.crawlStride/2 && Math.abs(w.vx)>1){
      let tx=w.x+F*(L.rest+CFG.crawlStride/2)+w.vx*0.26; const s=world.s[world.indexAt(tx)];
      tx=s.w<5?(s.x0+s.x1)/2:clamp(tx,s.x0+2.4,s.x1-2.4);
      L.planted=false; L.t=0; L.sx=L.x; L.sy=L.y; L.tx=tx; L.ty=s.y; } }
  // hips hang between the knees, shoulders between the hands; the spine takes whatever slope that gives
  let hy=-Infinity; for(const K of c.knees){ const dx=Math.min(Math.abs(K.x-w.x),12); hy=Math.max(hy,K.y-1.8-Math.sqrt(CFG.thigh*CFG.thigh-dx*dx)); }
  w.y+=(hy-w.y)*(1-Math.exp(-11*dt));
  const shY=(c.hands[0].y+c.hands[1].y)/2-17.3, pT=Math.acos(clamp((w.y-shY)/CFG.torso,-0.4,0.97));
  c.pitch+=(pT-c.pitch)*(1-Math.exp(-10*dt));
  const hip={x:w.x,y:w.y}, tx=F*Math.sin(c.pitch), ty=-Math.cos(c.pitch);
  const neck={x:hip.x+tx*CFG.torso,y:hip.y+ty*CFG.torso}, sh={x:neck.x-tx*2.4,y:neck.y-ty*2.4};
  const ha=F*(c.pitch-0.8), hl=CFG.neck+CFG.headR, head={x:neck.x+Math.sin(ha)*hl,y:neck.y-Math.cos(ha)*hl,a:F*0.3};
  const legs=[],arms=[];
  for(let i=0;i<2;i++){
    const K=c.knees[i], k=bone(hip.x,hip.y,K.x,K.y-1.8,CFG.thigh), bx=k[0]-F*CFG.shin, a=bone(k[0],k[1],bx,world.yAt(bx)-2,CFG.shin);
    legs.push({kx:k[0],ky:k[1],ax:a[0],ay:a[1],pitch:2.6,face:F});                    // boot laid back, sole up
    const H=c.hands[i], e=solve2(sh.x,sh.y,H.x,H.y-1.4,CFG.upperArm,CFG.foreArm,-F);
    arms.push({ex:e.kx,ey:e.ky,hx:e.ax,hy:e.ay});
  }
  w.lean=F*c.pitch; w.label='crawling';
  return {hip:hip,neck:neck,head:head,sh:sh,legs:legs,arms:arms,face:F,prop:null};
}

/* =====================  TUMBLE ROLL: one tucked shape turned through a full circle, kept resting on the ground  ===================== */
const TUCK=(function(){
  const hip=[-8,4], P=(p,ang,len)=>[p[0]+Math.sin(ang)*len,p[1]+Math.cos(ang)*len];      // ang measured from straight down, forward +
  const neck=P(hip,Math.PI-1.3,CFG.torso), sh=[neck[0]-(neck[0]-hip[0])/CFG.torso*2.4,neck[1]-(neck[1]-hip[1])/CFG.torso*2.4];
  const head=P(neck,Math.PI-2.75,CFG.neck+CFG.headR), knee=P(hip,2.05,CFG.thigh), ankle=P(knee,-0.75,CFG.shin);
  const elbow=P(sh,-0.1,CFG.upperArm), hand=P(elbow,1.5,CFG.foreArm);
  const T={hip:hip,neck:neck,sh:sh,head:head,knee:knee,ankle:ankle,elbow:elbow,hand:hand}, pad={hip:5.6,neck:5.2,sh:0,head:CFG.headR+0.6,knee:2.8,ankle:4,elbow:2.2,hand:2.2};
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const n in T){ x0=Math.min(x0,T[n][0]-pad[n]); x1=Math.max(x1,T[n][0]+pad[n]); y0=Math.min(y0,T[n][1]-pad[n]); y1=Math.max(y1,T[n][1]+pad[n]); }
  for(const n in T){ T[n][0]-=(x0+x1)/2; T[n][1]-=(y0+y1)/2; }                          // turn about the middle of the ball
  T.pad=pad; return T;
})();
function canRoll(w,world){ const g=world.yAt(w.x); for(let k=8;k<=CFG.rollDist+10;k+=6) if(world.yAt(w.x+w.facing*k)<g-3) return false; return true; }
function startRoll(w,world){ startFade(w,0.15); w.mode='roll'; w.dancing=false; w.act=null; w.jump=null; w.roll={t:0,cy:null}; w.events.push({type:'roll'}); }
function stepRoll(w,world,input,dt){
  const r=w.roll, F=w.facing, T=CFG.rollTime; r.t+=dt; const s=clamp(r.t/T,0,1);
  w.vx=F*CFG.rollDist/T*(1.2-0.4*s); w.x=clamp(w.x+w.vx*dt,world.x0,world.x1);
  const th=F*2*Math.PI*lerp(s,ss(s),0.35), c=Math.cos(th), sn=Math.sin(th), J={}; let cy=Infinity;
  for(const n of ['hip','neck','sh','head','knee','ankle','elbow','hand']){ const p=TUCK[n], lx=F*p[0], rx=lx*c-p[1]*sn, ry=lx*sn+p[1]*c;
    J[n]=[rx,ry]; cy=Math.min(cy,world.yAt(w.x+rx)-ry-TUCK.pad[n]); }
  r.cy = r.cy==null ? cy : (cy<r.cy?cy:r.cy+(cy-r.cy)*(1-Math.exp(-22*dt)));           // never sink into the ground; settle down gently
  const at=n=>({x:w.x+J[n][0],y:r.cy+J[n][1]}), wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const k=at('knee'), a=at('ankle'), e=at('elbow'), h=at('hand'), hd=at('head'); hd.a=wrap(th+F*0.9);
  const leg=d=>({kx:k.x,ky:k.y,ax:a.x,ay:a.y,pitch:wrap(0.35+2*Math.PI*lerp(s,ss(s),0.35)),face:F}), arm=d=>({ex:e.x,ey:e.y,hx:h.x,hy:h.y});
  const P={hip:at('hip'),neck:at('neck'),head:hd,sh:at('sh'),legs:[leg(0),leg(0)],arms:[arm(0),arm(0)],face:F,prop:null};
  w.y=P.hip.y; w.lean=th; w.label='rolling';
  if(s>=1){ const hx=P.hip.x; standUp(w,world); w.x=clamp(hx,world.x0,world.x1);               // come up into a crouch and let the walk stand us up
    const si=world.indexAt(w.x), rg=footRange(world,si,F);
    w.feet.forEach((f,i)=>{ f.si=si; f.py=world.s[si].y; f.px=clamp(a.x+(i?0.8:-0.8),rg[0],rg[1]); const an=ankleFor(f.px,f.py,0,F); f.ax=an[0]; f.ay=an[1]; });
    w.vx=F*Math.min(Math.abs(w.vx),input*F>0.1?44:18); w.lean=F*0.5; if(w.fade){ w.fade.dur=0.24; w.fade.x0=w.x; } w.events.push({type:'land',speed:60,stone:world.s[si].w<40}); }
  return P;
}

/* =====================  POSE PLUMBING  ===================== */
function bone(ax,ay,bx,by,len){ let dx=bx-ax, dy=by-ay, d=Math.hypot(dx,dy); if(d<1e-6){dx=0;dy=1;d=1;} return [ax+dx/d*len,ay+dy/d*len]; }

/* Two-bone limb from (hx,hy) reaching for (ax,ay); sign picks which way the middle joint folds. */
function solve2(hx,hy,ax,ay,l1,l2,sign){
  let dx=ax-hx, dy=ay-hy, d=Math.hypot(dx,dy); if(d<1e-6){dx=0;dy=1;d=1;}
  const dc=clamp(d,Math.abs(l1-l2)+0.01,l1+l2-0.01), ux=dx/d, uy=dy/d;
  const a=(l1*l1-l2*l2+dc*dc)/(2*dc), h=Math.sqrt(Math.max(l1*l1-a*a,0));
  return {kx:hx+ux*a+sign*uy*h, ky:hy+uy*a-sign*ux*h, ax:hx+ux*dc, ay:hy+uy*dc};
}

function poseOf(w,o){
  const sf=clamp(Math.abs(w.vx)/CFG.walkSpeed,0,1), F=w.facing;
  const off=clamp(w.by-w.y,-1.6,1.6), breath=Math.sin(w.time*1.7)*0.3*(1-sf);
  const hip={x:w.x+w.sway,y:w.y};
  const neck={x:hip.x+Math.sin(w.lean)*CFG.torso, y:hip.y-Math.cos(w.lean)*CFG.torso+off-breath};
  const ha=w.lean*0.4+F*(w.stair*0.06+w.headAdd), hl=CFG.neck+CFG.headR;
  const head={x:neck.x+Math.sin(ha)*hl, y:neck.y-Math.cos(ha)*hl, a:ha};
  const tx=(neck.x-hip.x)/CFG.torso, ty=(neck.y-hip.y)/CFG.torso;
  const sh={x:neck.x-tx*2.4, y:neck.y-ty*2.4};
  const legs=[],arms=[];
  for(let i=0;i<2;i++){
    const f=w.feet[i]; const L=solve2(hip.x,hip.y,f.ax,f.ay,CFG.thigh,CFG.shin,w.kneeF); L.pitch=f.pitch; L.face=f.face; legs.push(L);
    const th=w.lean*0.6+F*w.arm[i], th2=th+F*w.armB[i];
    const ex=sh.x+Math.sin(th)*CFG.upperArm, ey=sh.y+Math.cos(th)*CFG.upperArm;
    arms.push({ex:ex,ey:ey,hx:ex+Math.sin(th2)*CFG.foreArm,hy:ey+Math.cos(th2)*CFG.foreArm});
  }
  return {hip:hip,neck:neck,head:head,sh:sh,legs:legs,arms:arms,face:F,prop:o?o.prop:null};
}

/* Cross-fade between two poses bone by bone, so limbs swing across instead of stretching. */
function startFade(w,dur){ if(w.last) w.fade={from:w.last,t:0,dur:dur,x0:w.x}; }
function blendPose(A,B,t,dx){
  const L=(a,b)=>a+(b-a)*t;
  const child=(pa,ca,pb,cb,pn)=>{ const ox=L(ca.x-pa.x,cb.x-pb.x), oy=L(ca.y-pa.y,cb.y-pb.y), len=L(Math.hypot(ca.x-pa.x,ca.y-pa.y),Math.hypot(cb.x-pb.x,cb.y-pb.y)), d=Math.hypot(ox,oy)||1e-6;
    return {x:pn.x+ox/d*len,y:pn.y+oy/d*len}; };
  const hip={x:L(A.hip.x+dx,B.hip.x),y:L(A.hip.y,B.hip.y)};
  const neck=child(A.hip,A.neck,B.hip,B.neck,hip), sh=child(A.neck,A.sh,B.neck,B.sh,neck), head=child(A.neck,A.head,B.neck,B.head,neck);
  head.a=L(A.head.a,B.head.a);
  const legs=[],arms=[];
  for(let i=0;i<2;i++){
    const la=A.legs[i], lb=B.legs[i], k=child(A.hip,{x:la.kx,y:la.ky},B.hip,{x:lb.kx,y:lb.ky},hip), a=child({x:la.kx,y:la.ky},{x:la.ax,y:la.ay},{x:lb.kx,y:lb.ky},{x:lb.ax,y:lb.ay},k);
    legs.push({kx:k.x,ky:k.y,ax:a.x,ay:a.y,pitch:L(la.pitch,lb.pitch),face:lb.face});
    const aa=A.arms[i], ab=B.arms[i], e=child(A.sh,{x:aa.ex,y:aa.ey},B.sh,{x:ab.ex,y:ab.ey},sh), h=child({x:aa.ex,y:aa.ey},{x:aa.hx,y:aa.hy},{x:ab.ex,y:ab.ey},{x:ab.hx,y:ab.hy},e);
    arms.push({ex:e.x,ey:e.y,hx:h.x,hy:h.y});
  }
  return {hip:hip,neck:neck,head:head,sh:sh,legs:legs,arms:arms,face:B.face,prop:B.prop};
}

/* =====================  COMMANDS and the one update everything goes through  ===================== */
function command(w,world,name){
  if(w.mode==='run') endRun(w,world);                                  // a running jump starts from a walk, a stride later
  if(w.mode==='roll') return false;
  if(w.mode==='crawl'){ if(name==='crawl'||name==='jump'){ standUp(w,world); return true; } return false; }
  if(w.mode==='air'){ if(name==='throw'&&!w.act){ w.act={name:'throw',t:0,done:false}; return true; } return false; }
  switch(name){
    case 'jump':  if(w.jump) return false; w.jump={t:0}; w.dancing=false; return true;
    case 'roll':  if(w.jump||!canRoll(w,world)) return false; startRoll(w,world); return true;
    case 'crawl': if(w.jump) return false; enterCrawl(w,world); return true;
    case 'throw': if(w.act) return false; w.act={name:'throw',t:0,done:false}; w.dancing=false; return true;
    case 'clap':  if(w.act) return false; w.act={name:'clap',t:0,n:0}; return true;
    case 'read':  w.reading=!w.reading; w.readT=0.6; w.dancing=false; return true;
    case 'dance': w.dancing=!w.dancing; w.danceT=0; w.reading=false; return true;
  }
  return false;
}

/* =====================  RUN: open, level floor and a held direction  =====================
   Running is its own little mode: the body moves at run speed and the legs follow a run cycle (flight phase, knees up,
   arms pumping) instead of planting footholds. Anything that isn't open level floor, or letting go, drops back to the walk
   with the feet re-planted under the hips and a short blend. Only walkers allowed to run do (the player, the crew). */
function flatAhead(w,world,dir,dist){ const y=world.yAt(w.x); for(let k=4;k<=dist;k+=5){ const px=w.x+dir*k; if(px<world.x0||px>world.x1||Math.abs(world.yAt(px)-y)>0.5) return false; } return true; }
function plantFeet(w,world){ const si=world.indexAt(w.x), gy=world.s[si].y;
  w.feet.forEach((f,i)=>{ const px=w.x+(i?1.8:-1.8); Object.assign(f,{px:px,py:gy,si:si,face:w.facing,planted:true,pitch:0,heel:0,landPitch:0,ax:px,ay:gy-CFG.ankleH,settle:false,back:0,t:0,T:1,tx:px,ty:gy,tsi:si,tax:px,tay:gy-CFG.ankleH,tp:0,lift:0,prof:'flat'}); });
  w.y=w.des=w.by=gy-(CFG.ankleH+LEG-CFG.crouchIdle); w.bv=0; }
function endRun(w,world){ if(w.mode!=='run') return; startFade(w,0.2); w.mode='walk'; w.events.push({type:'runstop',speed:Math.abs(w.vx)}); w.vx=clamp(w.vx,-CFG.walkSpeed,CFG.walkSpeed); plantFeet(w,world); }
function stepRun(w,world,input,dt){ const dir=w.facing;
  if(!(input*dir>0.9)||!flatAhead(w,world,dir,34)||w.act||w.reading||w.dancing){ endRun(w,world); return false; }
  w.vx+=(dir*CFG.runSpeed-w.vx)*(1-Math.exp(-5*dt)); const nx=w.x+w.vx*dt; if(nx<world.x0||nx>world.x1){ endRun(w,world); return false; }
  w.x=nx; w.gy=world.yAt(w.x); w.runT+=dt*1.55*clamp(Math.abs(w.vx)/CFG.runSpeed,0.5,1);
  const ph=Math.floor(w.runT*2); if(ph!==w.runPh){ w.runPh=ph; w.events.push({type:'step',speed:Math.abs(w.vx),prof:'flat'}); }
  w.lean+=(0.3-w.lean)*(1-Math.exp(-8*dt)); w.y=w.gy-(CFG.ankleH+LEG*0.93); w.des=w.by=w.y; w.headAdd+=(0.06*Math.sin(w.runT*Math.PI*4)-w.headAdd)*(1-Math.exp(-10*dt)); return true; }
function runPose(w){ const F=w.facing, ph=w.runT*Math.PI*2, s=clamp(Math.abs(w.vx)/CFG.runSpeed,0,1), lean=w.lean*s;
  const legs=[], lows=[]; for(let i=0;i<2;i++){ const p=ph+i*Math.PI, th=0.9*s*Math.sin(p), k=0.3+1.45*s*Math.max(0,Math.sin(p+0.9));
    const kx=Math.sin(th)*F*CFG.thigh, ky=Math.cos(th)*CFG.thigh, ax=kx+Math.sin(th-k)*F*CFG.shin, ay=ky+Math.cos(th-k)*CFG.shin; legs.push([kx,ky,ax,ay,0.3*Math.sin(p)]); lows.push(ay); }
  const hy=w.gy-CFG.ankleH-Math.max(lows[0],lows[1])-3*s*(0.5+0.5*Math.cos(2*ph)), hip={x:w.x,y:hy}, dx=Math.sin(lean)*F, dy=-Math.cos(lean);
  const neck={x:hip.x+dx*CFG.torso,y:hy+dy*CFG.torso}, sh={x:hip.x+dx*(CFG.torso-2.4),y:hy+dy*(CFG.torso-2.4)}, hl=CFG.neck+CFG.headR;
  const head={x:neck.x+dx*hl,y:neck.y+dy*hl,a:F*lean*0.5}, arms=[];
  for(let i=0;i<2;i++){ const a=-1.05*s*Math.sin(ph+i*Math.PI)+lean*0.6, b=a+1.7; const ex=sh.x+Math.sin(a)*F*CFG.upperArm, ey=sh.y+Math.cos(a)*CFG.upperArm; arms.push({ex:ex,ey:ey,hx:ex+Math.sin(b)*F*CFG.foreArm,hy:ey+Math.cos(b)*CFG.foreArm}); }
  return {hip:hip,neck:neck,head:head,sh:sh,face:F,prop:null,arms:arms,legs:legs.map(l=>({kx:hip.x+l[0],ky:hy+l[1],ax:hip.x+l[2],ay:hy+l[3],pitch:l[4],face:F}))}; }
function maybeRun(w,world,input,dt){ if(!(w.canRun)||w.mode!=='walk'||w.jump||w.act||w.reading||w.dancing||w.stair>0.05){ w.runHold=0; return; }
  if(Math.abs(input)>0.95&&Math.sign(input)===w.facing&&Math.abs(w.vx)>CFG.walkSpeed*0.8&&flatAhead(w,world,w.facing,50)) w.runHold=(w.runHold||0)+dt; else w.runHold=0;
  if(w.runHold>CFG.runAfter){ startFade(w,0.22); w.mode='run'; w.runT=0; w.runPh=0; w.gy=world.yAt(w.x); w.runHold=0; w.events.push({type:'runstart'}); } }

function updateWalker(w,world,input,dt){
  w.time+=dt;
  input=Math.abs(input)<0.06?0:clamp(input,-1,1);
  let P;
  if(w.mode==='run'&&stepRun(w,world,input,dt)) P=runPose(w);
  else if(w.mode==='crawl') P=stepCrawl(w,world,input,dt);
  else if(w.mode==='roll') P=stepRoll(w,world,input,dt);
  else{ const o=overlay(w,dt); if(w.mode==='air') stepAir(w,world,input,dt,o); else{ stepWalk(w,world,input,dt,o); maybeRun(w,world,input,dt); } P=poseOf(w,o); }
  if(w.fade){ const f=w.fade; f.t+=dt;
    if(f.t>=f.dur) w.fade=null;
    else{ P=blendPose(f.from,P,ss(f.t/f.dur),w.x-f.x0);
      // limbs swinging across mustn't dip through the floor: slide the joint along the ground at full bone length instead
      const fix=(px,py,o,kx,ky,len,pad)=>{ const fy=world.yAt(o[kx])-pad; if(o[ky]<=fy) return; const dy=fy-py;
        if(Math.abs(dy)<len){ o[kx]=px+(o[kx]>=px?1:-1)*Math.sqrt(len*len-dy*dy); o[ky]=fy; } };
      for(const L of P.legs){ const ox=L.ax-L.kx, oy=L.ay-L.ky; fix(P.hip.x,P.hip.y,L,'kx','ky',CFG.thigh,1.8); L.ax=L.kx+ox; L.ay=L.ky+oy; fix(L.kx,L.ky,L,'ax','ay',CFG.shin,2.2); }
      for(const A of P.arms){ const ox=A.hx-A.ex, oy=A.hy-A.ey; fix(P.sh.x,P.sh.y,A,'ex','ey',CFG.upperArm,1.5); A.hx=A.ex+ox; A.hy=A.ey+oy; fix(A.ex,A.ey,A,'hx','hy',CFG.foreArm,1.4); } } }
  w.last=P;

  // --- thrown stones
  for(let i=w.shots.length-1;i>=0;i--){ const s=w.shots[i];
    if(s.rest){ s.life-=dt; if(s.life<=0) w.shots.splice(i,1); continue; }
    s.vy+=CFG.gravity*dt; let nx=s.x+s.vx*dt, ny=s.y+s.vy*dt; const g=world.yAt(nx)-1.3; s.a+=s.vx*dt*0.12;
    if(nx<world.x0-20||nx>world.x1+20){ s.vx*=-0.3; nx=s.x; }
    if(ny>g){ if(s.y>g+1.5){ s.vx*=-0.3; nx=s.x; ny=Math.min(ny,world.yAt(nx)-1.3); }            // struck a riser
      else{ ny=g; if(Math.abs(s.vy)>40) w.events.push({type:'thud',speed:Math.abs(s.vy)}); s.vy*=-0.36; s.vx*=0.55; if(Math.abs(s.vy)<22){ s.vy=0; if(Math.abs(s.vx)<8) s.rest=true; } } }
    s.x=nx; s.y=ny; }

  // --- scarf: a short rope pinned behind the neck
  const sc=w.scarf, F=w.facing;
  sc[0].x=P.neck.x-(P.neck.y<P.hip.y-8?F*2.6:0); sc[0].y=P.neck.y+0.6;
  for(let i=1;i<sc.length;i++){ const p=sc[i], vx=(p.x-p.ox)*0.975, vy=(p.y-p.oy)*0.975; p.ox=p.x; p.oy=p.y;
    p.x+=vx+(-F*60-w.vx*3+Math.sin(w.time*5.3+i*1.3)*70)*dt*dt; p.y+=vy+520*dt*dt; }
  for(let k=0;k<3;k++) for(let i=1;i<sc.length;i++){ const a2=sc[i-1], b=sc[i]; let dx=b.x-a2.x, dy=b.y-a2.y; const d=Math.hypot(dx,dy)||1e-6, e=(d-2.6)/d; b.x-=dx*e; b.y-=dy*e; }
  return P;
}

root.WalkEngine={endRun:endRun,CFG:CFG,LEG:LEG,makeWorld:makeWorld,surfaces:surfaces,rehome:rehome,standUp:standUp,createWalker:createWalker,updateWalker:updateWalker,command:command,poseOf:poseOf,footRange:footRange};
})(typeof globalThis!=='undefined'?globalThis:this);
