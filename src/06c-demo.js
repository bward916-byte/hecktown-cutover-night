/* ==== DEMO: the attract reel on the title screen. A cartoon chase in six beats, set to a jaunty tune:
   1 the office: A+ ambushes the coffee break, everyone scrambles and RUNS (cat stop, pinball stop, password warnings)
   2 the hallway of doors: in one door, out another, A+ out the wrong one, the cat chasing the monster
   3 the turnabout: record scratch, dead end, A+ turns around to find the whole team with their arms folded
   4 the chase back: now A+ runs, everyone after it
   5 the freeze: everything stops for Greg, who never hurries
   6 the curtain call: a bow in a wave, A+ included, confetti
   Everything is scripted by time, so it plays the same every time. Any key or tap goes back to the title. ==== */
(function(){
'use strict';
const H=window.__hecktown, EXT=H.EXT, GM=HGAME, PP=HPEOPLE, D=HDRAW, E=WalkEngine, C=E.CFG;
const $=id=>document.getElementById(id), clamp=(v,a,b)=>v<a?a:(v>b?b:v), lerp=(a,b,t)=>a+(b-a)*t, ss=t=>{ t=clamp(t,0,1); return t*t*(3-2*t); };
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const CAST=['rianan','brians','bret','dave','aaron','umesh','fares','ash'], LEN=48;
const SEC={intro:0,office:3.5,doors:13.4,turn:24.2,back:26.8,freeze:33.2,montage:36.4,curtain:40.4};
const BILL={rianan:['RIANAN','IT Department Head  ·  would stop for any cat'],brians:['BRIAN S','IT Manager  ·  nationally ranked pinball wizard'],bret:['BRET','Infrastructure  ·  has already checked your password'],
  dave:['DAVE','iSeries Guru  ·  this close to Jeopardy'],aaron:['AARON','Network  ·  picks his line early'],umesh:['UMESH','EDI  ·  every 850 is his'],fares:['FARES','EDI  ·  Umesh\'s friend, and also his 850s'],
  ash:['ASH','Salesforce  ·  built a flow for that'],greg:['GREG','Number Scientist  ·  in no particular hurry'],aplus:['A+','since 1985  ·  a monster, affectionately']};
let S=null, idle=0, prevLight=null;
const person=id=>GM.PEOPLE.find(p=>p.id===id);

/* ---------------- a real run: flight phase, knees up, arms pumping, leaning into it ----------------
   kind: run | scramble (legs spinning in place, cartoon style) | walk | stand | fold (arms crossed) | bow */
function pose(x,t,F,kind,o){ o=o||{};
  const TH=C.thigh, SH=C.shin, TOR=C.torso, UA=C.upperArm, FA=C.foreArm, AH=C.ankleH;
  const K={run:{f:1.55,th:0.9,kb:0.35,ka:1.5,lean:0.3,arm:1.05,el:1.7,bob:3.2},scramble:{f:5.5,th:1.05,kb:0.5,ka:1.4,lean:0.12,arm:1.3,el:1.5,bob:1.2},
    walk:{f:0.85,th:0.36,kb:0.1,ka:0.55,lean:0.03,arm:0.32,el:0.3,bob:0.9},stand:{f:0.3,th:0,kb:0.08,ka:0,lean:0,arm:0,el:0.25,bob:0},
    fold:{f:0.3,th:0,kb:0.08,ka:0,lean:-0.05,arm:0,el:2.2,bob:0},bow:{f:0.3,th:0,kb:0.15,ka:0,lean:0,arm:0,el:0.4,bob:0}}[kind]||{};
  const ph=(t*K.f+(o.off||0))*Math.PI*2, lean=(o.lean!=null?o.lean:K.lean)+(kind==='bow'?(o.bow||0)*1.0:0);
  const legs=[], lows=[];
  for(let i=0;i<2;i++){ const p=ph+i*Math.PI, th=K.th*Math.sin(p)+(kind==='stand'||kind==='fold'||kind==='bow'?(i?0.06:-0.06):0), k=K.kb+K.ka*Math.max(0,Math.sin(p+0.9));
    const kx=Math.sin(th)*F*TH, ky=Math.cos(th)*TH, ax=kx+Math.sin(th-k)*F*SH, ay=ky+Math.cos(th-k)*SH; legs.push([kx,ky,ax,ay,0.3*Math.sin(p)*(K.th>0.5?1:0.5)]); lows.push(ay); }
  const hipY=-(AH+Math.max(lows[0],lows[1]))-K.bob*(0.5+0.5*Math.cos(2*ph))-(o.hop||0)+(kind==='stand'||kind==='fold'?Math.sin(t*2.1)*0.3:0);
  const hip={x:x,y:hipY}, dx=Math.sin(lean)*F, dy=-Math.cos(lean), neck={x:x+dx*TOR,y:hipY+dy*TOR}, sh={x:x+dx*(TOR-2.6),y:hipY+dy*(TOR-2.6)};
  const head={x:neck.x+dx*(C.neck+C.headR*0.95),y:neck.y+dy*(C.neck+C.headR*0.95),a:F*lean*0.5+(o.tilt||0)};
  const arms=[]; for(let i=0;i<2;i++){ const a=(kind==='fold'?0.2:-K.arm*Math.sin(ph+i*Math.PI))+(o.armsUp?2.8:0)+lean*0.6, b=a+(o.armsUp?0.2:K.el);
    const ex=sh.x+Math.sin(a)*F*UA, ey=sh.y+Math.cos(a)*UA; arms.push({ex:ex,ey:ey,hx:ex+Math.sin(b)*F*FA,hy:ey+Math.cos(b)*FA}); }
  return {hip:hip,neck:neck,head:head,sh:sh,face:F,prop:null,arms:arms,legs:legs.map(l=>({kx:x+l[0],ky:hipY+l[1],ax:x+l[2],ay:hipY+l[3],pitch:l[4],face:F}))}; }

/* ---------------- the script ---------------- */
function run(from,to,t0,v,t){ const d=to-from, T=Math.abs(d)/v; const u=clamp((t-t0)/T,0,1); return {x:from+d*u,done:t>=t0+T,F:Math.sign(d)||1}; }
function build(){ return {t:0,bub:[],dust:[],conf:[],marks:[],cap:null,billed:{},sting:{},note:0,beat:0,camX:0,shake:0,lastT:0}; }
function say(who,text,dur){ S.bub=S.bub.filter(b=>b.who!==who); S.bub.push({who:who,text:text,t:dur||1.8}); }
function once(k,f){ if(!S.sting[k]){ S.sting[k]=1; f(); } }
function bill(id){ if(S.billed[id]) return; S.billed[id]=1; S.capQ=(S.capQ||[]).concat([id]); }
const A=()=>H.audio;
function sfx(n){ if(A()) A().sfx(n); } function tone(...a){ if(A()) A().tone(...a); } function burst(...a){ if(A()) A().burst(...a); }

/* where everyone is at time t: {actors:[{id,look,x,kind,F,mood,hop,show,armsUp,bow}], mon:{x,F,run,mood,show}, milo:{x,F,run,show}, cam:x, set:'office'|'doors'|'dead'|'curtain'} */
function scene(t){
  const out={actors:[],mon:{show:false},milo:{show:false},set:'office',cam:0,freeze:false}, act=(id,x,kind,F,extra)=>out.actors.push(Object.assign({id:id,x:x,kind:kind,F:F,show:true},extra||{}));
  if(t<SEC.doors){ // 1. the office
    const T=t-SEC.office; out.set='office';
    const home=i=>160+i*30, fleeAt=1.3, scram=0.55;
    CAST.forEach((id,i)=>{ const x0=home(i), F0=i%2?-1:1;
      if(T<fleeAt) return act(id,x0,'stand',F0,{mood:T>0.95?'surprise':null});
      if(T<fleeAt+scram) return act(id,x0,'scramble',1,{mood:'surprise'});
      let tt=T-fleeAt-scram, v=185+((i*37)%5)*6, x=x0+v*tt, kind='run';
      if(id==='rianan'){ const cat=980; const reach=(cat-x0)/v; if(tt>reach){ const h=tt-reach; if(h<1.2){ x=cat; kind='stand'; } else x=cat+(v+60)*(h-1.2); } }
      if(id==='brians'){ const pin=1460, reach=(pin-x0)/v; if(tt>reach){ const h=tt-reach; if(h<1.0){ x=pin; kind='stand'; } else x=pin+(v+50)*(h-1.0); } }
      if(id==='aaron'){ const crate=1250, dh=x-crate; if(Math.abs(dh)<45) return act(id,x,kind,1,{mood:'happy',hop:26*(1-(dh/45)*(dh/45))}); }
      act(id,x,kind,1,{mood:kind==='run'?'surprise':null}); });
    const mx=T<0.4?lerp(-120,60,0):(T<1.2?lerp(-120,70,ss((T-0.4)/0.8)):70+Math.max(0,T-fleeAt-0.3)*168);
    out.mon={show:true,x:mx,F:1,run:T>0.4&&T<1.0||T>fleeAt+0.3,mood:T<1.2?'smug':'mean',loom:T>0.95&&T<1.6?1:0};
    out.milo={show:true,x:T<fleeAt+scram+(980-160)/185?1000:1000+(T-(fleeAt+scram+(980-160)/185))*240,F:1,run:T>fleeAt+scram+(980-160)/185+1.1};
    const xs=out.actors.map(a=>a.x); out.cam=clamp((Math.min(...xs)+Math.max(...xs))/2*0.7+out.mon.x*0.3,300,99999); if(T<fleeAt+0.2) out.cam=225;
    return out; }
  if(t<SEC.turn){ // 2. the hallway of doors
    const T=t-SEC.doors; out.set='doors'; out.cam=0; const DX=[-165,-55,55,165];
    const R=[[0.3,'rianan',0,2],[0.75,'aplus',0,2],[1.8,'brians',3,1],[2.0,'bret',3,1],[2.6,'aplus',2,0],[3.3,'dave',1,3],[3.55,'aaron',1,3],[4.1,'umesh',2,0],[4.3,'fares',2,0],
      [5.0,'aplus',3,1],[5.4,'greg',1,2,34],[6.5,'aplus',3,0,230],[6.85,'milo',3,0,250],[8.0,'ash',0,3],[8.6,'rianan',0,3],[8.8,'brians',0,3],[9.0,'bret',0,3],[9.2,'dave',0,3],[9.4,'aaron',0,3],[9.6,'umesh',0,3],[9.8,'fares',0,3],[10.3,'aplus',3,2,90]];
    const seen={}; out.doorsOpen=[0,0,0,0];
    for(const r of R){ const [t0,id,a,b,v]=r; if(T<t0) continue; const p=run(DX[a],DX[b],t0,v||200,T); if(p.done&&!(id==='aplus'&&r===R[R.length-1])) continue; if(seen[id]) continue; seen[id]=1;
      for(let k=0;k<4;k++) if(Math.abs(p.x-DX[k])<16) out.doorsOpen[k]=1;
      if(id==='aplus') out.mon={show:true,x:p.x,F:p.F,run:!p.done,mood:r===R[4]||r===R[11]?'confused':(r===R[R.length-1]?'smug':'mean')};
      else if(id==='milo') out.milo={show:true,x:p.x,F:p.F,run:true};
      else act(id,p.x,id==='greg'?'walk':'run',p.F,{mood:id==='greg'?null:'surprise',conga:T>=8.6&&id!=='ash'}); }
    out.DX=DX; return out; }
  if(t<SEC.back){ // 3. the turnabout
    const T=t-SEC.turn; out.set='dead'; out.cam=10;
    const m=run(-220,120,0,260,T); out.mon={show:true,x:m.x,F:T>1.0?-1:1,run:!m.done,mood:T<0.9?'mean':(T<1.8?'confused':'mean'),panic:T>1.8};
    CAST.forEach((id,i)=>{ const col=i%4, row=i/4|0, tx=-40-col*28-row*14; const p=run(-330-row*20,tx,0.3+row*0.12,170,T); act(id,p.x,p.done?'fold':'walk',1,{mood:null}); });
    return out; }
  if(t<SEC.freeze+2.4){ // 4. the chase back, and 5. the freeze
    const T=Math.min(t,SEC.freeze)-SEC.back, frozen=t>=SEC.freeze&&t<SEC.freeze+2.2, zip=t>=SEC.freeze+2.2;
    out.set='office'; const mx=120-T*205; out.mon={show:true,x:zip?mx-(t-SEC.freeze-2.2)*900:mx,F:-1,run:true,mood:'confused',panic:true};
    CAST.forEach((id,i)=>{ const x=out.mon.x+80+i*30+Math.sin(T*3+i*1.7)*6+Math.max(0,0.5-T)*300; act(id,x,'run',-1,{mood:'happy'}); });
    out.freeze=frozen; out.cam=out.mon.x+150; if(frozen){ const g=run(out.cam-260,out.cam+260,SEC.freeze+0.1,240,t); act('greg',g.x,'walk',1,{mood:null}); }
    return out; }
  if(t<SEC.curtain){ out.set='montage'; return out; }
  // 6. the curtain call
  const T=t-SEC.curtain; out.set='curtain'; out.cam=0; const spots=[-205,-160,-115,-70,70,115,160,205];
  CAST.forEach((id,i)=>{ const from=i<4?-420:420, p=run(from,spots[i],0.1+(i%4)*0.12,260,T); const bw=clamp(Math.sin(clamp((T-2.6-i*0.14)/0.9,0,1)*Math.PI),0,1);
    act(id,p.x,p.done?(bw>0.01?'bow':'stand'):'run',p.done?(T>2.4?1:(i<4?1:-1)):p.F,{mood:p.done?'happy':null,bow:bw,hop:T>5.2&&Math.floor((T-5.2)*2.2+i)%2===0?6:0}); });
  const g=run(-420,-250,0.2,60,T); act('greg',g.x,g.done?'stand':'walk',1,{mood:null,bow:0});
  out.mon={show:true,x:T<1.2?lerp(0,0,1):0,F:1,run:false,mood:T>3?'smug':'idle',rise:ss(T/1.2)};
  out.milo={show:true,x:250,F:-1,run:false,sit:true}; return out; }

/* events keyed to the script: speech, stings, captions */
function events(t,dt){
  const T=k=>t>=k;
  if(T(SEC.office+0.4)) once('pop',()=>{ say('aplus','BOO.',0.9); });
  if(T(SEC.office+1.0)) once('roar',()=>{ say('aplus','RRRAAAAAH!',1.3); sfx('roar'); S.shake=0.6; bill('aplus'); for(const id of CAST) S.marks.push({id:id,t:0.9}); });
  if(T(SEC.office+1.5)) once('scram',()=>{ burst(300,0.5,0.06,0.5,1200); });
  if(T(SEC.office+2.8)) once('pw',()=>say('bret','ROTATE YOUR PASSWORDS!',1.8));
  if(T(SEC.office+3.6)) once('dq',()=>say('dave','WHAT IS... RUN?!',1.6));
  if(T(SEC.office+4.4)) once('cat',()=>say('rianan','KITTY! ♥',1.3));
  if(T(SEC.office+5.0)) once('edi',()=>{ say('fares','UMESH! YOUR 850s!',1.4); });
  if(T(SEC.office+5.6)) once('edi2',()=>say('umesh','YOUR 850s!',1.2));
  if(T(SEC.office+6.3)) once('line',()=>say('aaron','PICK YOUR LINE!',1.3));
  if(T(SEC.office+7.3)) once('pin',()=>{ say('brians','MULTIBALL!',1.0); sfx('pinball'); });
  if(T(SEC.office+8.3)) once('tilt',()=>say('brians','...TILT!',0.9));
  if(T(SEC.office+8.6)) once('flow',()=>say('ash','THERE\'S A FLOW FOR THIS!',1.4));
  // the doors
  const DT=t-SEC.doors; if(DT>=0&&t<SEC.turn){ const firsts=[[0.3,'rianan'],[1.8,'brians'],[2.0,'bret'],[3.3,'dave'],[3.55,'aaron'],[4.1,'umesh'],[4.3,'fares'],[8.0,'ash']]; for(const [k,id] of firsts) if(DT>=k) bill(id);
    for(const k of [0.3,0.75,1.8,2.6,3.3,4.1,5.0,5.4,6.5,6.85,8.0,8.6,10.3]) if(DT>=k) once('door'+k,()=>{ tone(600,0.14,0.03,'sine',1300); burst(240,0.8,0.035,0.08); });
    if(DT>=2.7) once('wrong',()=>say('aplus','?',1.0)); if(DT>=5.5) once('greg1',()=>{ say('greg','Fiscal.',1.8); bill('greg'); });
    if(DT>=6.6) once('eep',()=>say('aplus','EEP! CAT!',1.2)); if(DT>=6.9) once('honk',()=>sfx('meow')); if(DT>=9.0) once('conga',()=>say('rianan','EVERYBODY THIS WAY!',1.4)); if(DT>=10.5) once('huh',()=>say('aplus','...HELLO?',1.2)); }
  // the turnabout
  if(T(SEC.turn+0.8)) once('scratch',()=>{ tone(900,0.35,0.05,'sawtooth',120); burst(800,0.6,0.05,0.3,200); });
  if(T(SEC.turn+1.1)) once('q',()=>say('aplus','DEAD END?',1.0));
  if(T(SEC.turn+1.9)) once('fold',()=>say('bret','Badge, please.',1.4));
  if(T(SEC.turn+2.1)) once('eep2',()=>{ say('aplus','EEP!',0.9); S.shake=0.3; });
  // the chase back
  if(T(SEC.back+0.6)) once('fw',()=>say('bret','FIREWALL!!',1.3));
  if(T(SEC.back+1.4)) once('get',()=>say('rianan','GET IT!',1.1));
  if(T(SEC.back+2.3)) once('fj',()=>say('dave','FINAL JEOPARDY!',1.4));
  if(T(SEC.back+3.3)) once('o850',()=>say('fares','OUR 850s!!',1.2));
  if(T(SEC.back+4.1)) once('hs',()=>say('aaron','HIGH SIDE!',1.1));
  if(T(SEC.back+5.0)) once('sorry',()=>say('aplus','I SHIPPED ON TIME!!',1.3));
  if(T(SEC.freeze)) once('frz',()=>{ tone(1600,0.05,0.03,'square'); });
  if(T(SEC.freeze+0.9)) once('fisc',()=>say('greg','...Fiscal.',1.4));
  if(T(SEC.freeze+2.2)) once('zip',()=>{ tone(400,0.3,0.05,'sine',1800); });
  if(T(SEC.curtain+3.2)) once('conf',()=>{ for(let i=0;i<120;i++) S.conf.push({x:(Math.random()-0.5)*700,y:-260-Math.random()*220,vx:(Math.random()-0.5)*50,vy:60+Math.random()*80,c:['#f2b544','#6fe08a','#e0563a','#6fb0ff','#f6ecd8'][i%5],r:Math.random()*6}); });
  if(T(SEC.curtain+3.6)) once('bow',()=>say('aplus','THANK YOU. THANK YOU.',1.8));
  // captions: one at a time
  if(!S.cap&&S.capQ&&S.capQ.length) S.cap={id:S.capQ.shift(),t:0};
  if(S.cap){ S.cap.t+=dt; if(S.cap.t>1.7) S.cap=null; } }

/* ---------------- music: a bouncy, cartoonish chase (original tune) ---------------- */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const MEL=[72,74,76,72,79,0,79,0,77,76,74,72,74,0,67,0,72,74,76,79,81,79,77,76,74,76,74,71,72,0,0,0], CH=[48,48,55,55,53,53,48,48];
function music(dt){ const a=A(); if(!a||!a.ctx()) return; const t=S.t;
  const ph=t<SEC.office?'intro':(t<SEC.turn?'chase':(t<SEC.turn+2.4?'stop':(t<SEC.freeze?'back':(t<SEC.freeze+2.2?'freeze':(t<SEC.curtain?'go':'finale')))));
  if(ph==='intro') once('intro',()=>[60,64,67,72].forEach((n,k)=>tone(NOTE(n),0.4,0.035,'triangle',null,k*0.14)));
  if(ph==='chase'||ph==='back'||ph==='go'){ const bpm=ph==='chase'?190:214, step=60/bpm/2, up=ph==='chase'?0:5; S.beat+=dt;
    while(S.beat>=step){ S.beat-=step; const i=S.note%32, root=CH[(i>>2)%8]+up;
      tone(NOTE(i%2?root+7:root),step*0.7,0.045,'triangle');                                   // oom-pah
      if(MEL[i]) tone(NOTE(MEL[i]+up),step*0.45,0.022,'square');
      if(i%8===0) burst(110,0.7,0.06,0.06); if(i%4===2) burst(2600,1.4,0.02,0.03); if(i%8===4) burst(900,0.7,0.035,0.05);
      S.note++; } }
  if(ph==='finale') once('fan',()=>{ [60,64,67,72,76,79,84].forEach((n,k)=>tone(NOTE(n),k===6?1.6:0.22,0.035,'triangle',null,k*0.11)); }); }

/* ---------------- drawing ---------------- */
function drawSet(c,set,cam,t,sc,W,Hh,ox,oy){
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  if(set==='curtain'){ const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#3a0f14'); g.addColorStop(1,'#1a0609'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
    c.save(); c.translate(ox,oy); c.scale(sc,sc); for(let x=-520;x<520;x+=26){ const sh=0.5+0.5*Math.sin(x*0.25); c.fillStyle='rgba(120,20,30,'+(0.4+0.3*sh)+')'; c.fillRect(x,-400,14,400); }
    R(-600,0,1200,300,'#3a2418'); R(-600,0,1200,4,'#c9a56a'); const sp=c.createRadialGradient(0,-60,10,0,-60,300); sp.addColorStop(0,'rgba(255,240,200,.35)'); sp.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=sp; c.fillRect(-400,-360,800,360); c.restore(); return; }
  const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,set==='dead'?'#2e3848':'#3d4a5c'); g.addColorStop(1,'#26303e'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
  c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0);
  const x0=cam-W/sc, x1=cam+W/sc;
  if(set==='doors'){ R(-400,-200,800,200,'#34405a'); for(let x=-400;x<400;x+=40) R(x,-200,2,200,'rgba(0,0,0,.12)');
    S.scn.DX.forEach((dx,k)=>{ const open=S.scn.doorsOpen[k]; R(dx-22,-78,44,78,'#1a2030'); if(!open){ R(dx-20,-76,40,76,'#6a4a2a'); R(dx+10,-40,4,4,'#c9a56a'); } else { R(dx-20,-76,8,76,'#8a6a40'); }
      R(dx-26,-84,52,6,'#23293a'); c.fillStyle='#f6ecd8'; c.font='700 8px "IBM Plex Mono",monospace'; c.textAlign='center'; c.fillText(['IT','SERVER','PIM','EXIT?'][k],dx,-90); });
  } else {
    for(let x=Math.floor(x0/140)*140;x<x1;x+=140){ R(x+30,-128,76,70,'#2f3a4a'); R(x+34,-124,68,62,'rgba(255,236,190,.13)'); R(x+67,-124,2,62,'#1d2430'); R(x+50,-196,40,3,'#f6ecd8');
      const lg=c.createLinearGradient(0,-193,0,0); lg.addColorStop(0,'rgba(255,240,200,.13)'); lg.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(x+50,-193); c.lineTo(x+90,-193); c.lineTo(x+120,0); c.lineTo(x+20,0); c.fill(); }
    // things along the office chase: coffee, a cat poster, a password poster, a crate, the pinball machine
    R(420,-44,26,44,'#8d939c'); R(424,-58,18,14,'#c9d8e8'); c.fillStyle='#243447'; c.font='700 5px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('COFFEE',433,-24);
    R(760,-120,50,36,'#f6ecd8'); c.fillStyle='#d9822b'; c.beginPath(); c.arc(785,-104,8,0,7); c.fill(); c.fillStyle='#243447'; c.fillText('HANG IN THERE',785,-88);
    R(1100,-120,70,34,'#e0563a'); c.fillStyle='#f6ecd8'; c.font='700 6px "IBM Plex Sans",sans-serif'; c.fillText('ROTATE YOUR',1135,-106); c.fillText('PASSWORDS',1135,-96);
    R(1235,-22,30,22,'#9a7a4a'); c.strokeStyle='#151a22'; c.lineWidth=1; c.strokeRect(1235,-22,30,22);
    if(D.PROPS.pinball) D.PROPS.pinball(1490,0,t*1000,c);
    if(set==='dead'){ R(210,-200,40,200,'#1d2430'); c.fillStyle='#e0563a'; c.font='700 10px "IBM Plex Sans",sans-serif'; c.fillText('NO EXIT',230,-120); }
  }
  R(x0-200,0,x1-x0+400,700,'#1d2430'); R(x0-200,0,x1-x0+400,3,'#4a5566');
  c.restore(); }
function cat(c,x,F,t,runv,sit){ c.save(); c.translate(x,0); c.scale(F,1); const b=runv?Math.sin(t*26)*1.5:0, lg=runv?Math.sin(t*26)*4:0; c.strokeStyle='#151a22'; c.lineWidth=0.8; c.fillStyle='#d9822b';
  if(sit){ c.beginPath(); c.ellipse(-1,-6,5.5,6,0,0,7); c.fill(); c.stroke(); } else { c.lineWidth=2.4; c.strokeStyle='#d9822b'; for(const k of [[-5,lg],[-2,-lg],[5,-lg],[7,lg]]){ c.beginPath(); c.moveTo(k[0],-6+b); c.lineTo(k[0]+k[1]*0.5,0); c.stroke(); } c.lineWidth=0.8; c.strokeStyle='#151a22'; c.beginPath(); c.ellipse(1,-8+b,8.5,3.8,0,0,7); c.fill(); c.stroke(); }
  const hx=sit?3:9.5, hy=sit?-12.5:-11+b; c.beginPath(); c.arc(hx,hy,3.6,0,7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(hx-2.6,hy-1.8); c.lineTo(hx-1.8,hy-5.6); c.lineTo(hx,hy-3); c.moveTo(hx+0.8,hy-3); c.lineTo(hx+2.4,hy-5.6); c.lineTo(hx+3.2,hy-1.6); c.fill(); c.stroke();
  c.fillStyle='#f2d544'; c.beginPath(); c.arc(hx+1.6,hy-0.4,0.8,0,7); c.fill(); c.strokeStyle='#d9822b'; c.lineWidth=1.8; c.beginPath(); c.moveTo(sit?-5:-7,sit?-3:-9+b); c.quadraticCurveTo(-14,-14,-11+Math.sin(t*(runv?18:3))*2,-19); c.stroke(); c.restore(); }
function draw(c,V,now){
  const W=V.W, Hh=V.H, t=S.t, T=now/1000, ZS={office:0.85,doors:0.64,dead:0.7,curtain:0.62}[S.scn.set]||0.8, sc=(W<Hh?Math.min(W/300,Hh/330)*1.15:Math.min(Hh*0.3/64,W*0.9/300))*ZS, sh=S.shake>0?Math.sin(T*70)*S.shake*6:0, ox=W/2+sh, oy=Hh*(W<Hh?0.62:(S.scn.set==='curtain'?0.8:0.74));
  c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(t<SEC.office){ c.fillStyle='#0b1220'; c.fillRect(0,0,W,Hh); const txt='PHILLIPS IT PRESENTS', n=Math.floor(clamp(t/1.6,0,1)*txt.length); c.fillStyle='#7fe0a0'; c.font='700 '+Math.min(22,W/20)+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(txt.slice(0,n)+(Math.floor(t*3)%2?'▮':' '),W/2,Hh*0.45); if(t>2){ c.globalAlpha=clamp((t-2)/0.6,0,1); c.fillStyle='#f6ecd8'; c.font='italic '+Math.min(18,W/24)+'px Georgia,serif'; c.fillText('a cutover chase, with music',W/2,Hh*0.45+36); c.globalAlpha=1; } return; }
  if(S.scn.set==='montage'){ D.drawCardStyle(c,V,{},{title:'THE GAME',sub:'no bosses · one very old system',t:t-SEC.montage,dur:4,style:'comic',panels:[{i:'1938',c:'It starts with oats'},{i:'✍',c:'Six signatures'},{i:'🚚',c:'Nine DCs, one truck'}]}); return; }
  const cam=S.camX; drawSet(c,S.scn.set,cam,t,sc,W,Hh,ox,oy);
  c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0);
  // dust behind runners
  for(const d of S.dust){ c.fillStyle='rgba(200,206,214,'+(0.35*(1-d.a)).toFixed(3)+')'; c.beginPath(); c.arc(d.x,d.y,2+d.a*6,0,7); c.fill(); }
  const gy=()=>0, sn=S.scn;
  if(sn.milo.show&&sn.set!=='curtain') cat(c,sn.milo.x,sn.milo.F,T,sn.milo.run,false);
  const draws=[]; for(const a of sn.actors){ if(sn.freeze&&a.id==='greg') continue; const p=person(a.id); const off=(a.id.charCodeAt(0)%7)/7; const tt=sn.freeze?SEC.freeze+off:t+off;
    const P=pose(a.x,tt,a.F,a.kind,{hop:a.hop,bow:a.bow,off:off}); a.P=P; draws.push([a.x,()=>{
      if((a.kind==='run'||a.kind==='scramble')&&!sn.freeze){ c.strokeStyle='rgba(246,236,216,.35)'; c.lineWidth=1.2; for(let k=0;k<3;k++){ const y=P.hip.y-6-k*7, x=a.x-a.F*(10+k*3); c.beginPath(); c.moveTo(x,y); c.lineTo(x-a.F*(16+k*4),y); c.stroke(); } }
      if(a.kind==='scramble'){ c.strokeStyle='rgba(246,236,216,.5)'; c.lineWidth=1; c.beginPath(); c.ellipse(a.x+a.F*3,-12,15,12,0,0,7); c.stroke(); }
      PP.person(c,P,p.look,{ground:gy,w:{},t:T+off,mood:a.mood,talk:S.bub.some(b=>b.who===a.id)}); }]); }
  const M=sn.mon; if(M.show&&D.aplusMonster) draws.push([M.x,()=>{ const s=1.1, rise=M.rise!=null?M.rise:1; c.save(); c.translate(0,(1-rise)*120); D.aplusMonster(c,M.x,0,s,T,M.panic?'confused':(M.mood||'mean'),{dir:M.F,run:M.run&&!sn.freeze,talk:S.bub.some(b=>b.who==='aplus'),loom:M.loom||0}); c.restore();
    if(M.panic&&!sn.freeze){ c.fillStyle='rgba(111,176,255,.85)'; for(let k=0;k<2;k++){ const ph=(T*2+k*0.5)%1; c.beginPath(); c.ellipse(M.x-M.F*(10+ph*14),-118+ph*18,1.8,2.8,0,0,7); c.fill(); } } }]);
  draws.sort((a,b)=>a[0]-b[0]).forEach(d=>d[1]());
  if(sn.set==='curtain'&&sn.milo.show) cat(c,sn.milo.x,sn.milo.F,T,false,true);
  // ! marks when A+ roars
  for(const m of S.marks){ const a=sn.actors.find(z=>z.id===m.id); if(!a||!a.P) continue; c.fillStyle='#f2b544'; c.font='900 16px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('!',a.P.head.x,a.P.head.y-14-(0.9-m.t)*8); }
  for(const k of S.conf){ c.save(); c.translate(k.x,k.y); c.rotate(k.r); c.fillStyle=k.c; c.fillRect(-2,-1,4,2); c.restore(); }
  c.restore();
  if(sn.freeze){ c.fillStyle='rgba(20,26,40,.42)'; c.fillRect(0,0,W,Hh); const g=sn.actors.find(z=>z.id==='greg'); if(g){ c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0); g.P=pose(g.x,t,1,'walk',{}); PP.person(c,g.P,person('greg').look,{ground:()=>0,w:{},t:T,talk:S.bub.some(b=>b.who==='greg')}); c.restore(); }
    c.fillStyle='rgba(246,236,216,.8)'; c.font='700 '+Math.round(Math.min(18,W/26))+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.fillText('❚❚  PAUSED FOR GREG',W/2,Math.max(40,Hh*0.1)); }
  // bubbles, stacked so they never overlap
  c.font='700 '+Math.round(clamp(12*sc/2.2,11,17))+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const placed=[];
  for(const b of S.bub){ let x,y; if(b.who==='aplus'){ if(!sn.mon.show) continue; x=ox+(sn.mon.x-cam)*sc; y=oy-128*sc; } else { const a=sn.actors.find(z=>z.id===b.who); if(!a||!a.P) continue; x=ox+(a.P.head.x-cam)*sc; y=oy+(a.P.head.y-20)*sc; }
    if(x<-20||x>W+20) continue; const tw=c.measureText(b.text).width+20; x=clamp(x,tw/2+8,W-tw/2-8); y=Math.max(y,40); for(let k=0;k<6&&placed.some(r=>Math.abs(r[0]-x)<(r[2]+tw)/2+4&&Math.abs(r[1]-y)<30);k++) y-=32; placed.push([x,y,tw]);
    const ap=b.who==='aplus'; c.fillStyle=ap?'rgba(6,14,8,.94)':'rgba(246,236,216,.97)'; rr(c,x-tw/2,y-14,tw,28,11); c.fill(); if(ap){ c.strokeStyle='#6fe08a'; c.lineWidth=1.5; c.stroke(); }
    c.fillStyle=ap?'#7fe0a0':'#243447'; c.fillText(b.text,x,y+0.5); }
  // starring
  if(S.cap&&BILL[S.cap.id]){ const [nm,tag]=BILL[S.cap.id], a=clamp(Math.min(S.cap.t/0.2,(1.7-S.cap.t)/0.25),0,1), x0=Math.max(14,W*0.04), y0=Hh-(V.touch?150:96), slide=(1-a)*-40;
    const nf=D.fitFont(c,nm,'700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',24,W*0.6), tf=D.fitFont(c,tag,'italic ','Georgia,serif',15,W*0.84);
    c.globalAlpha=a; c.textAlign='left'; c.font='italic '+tf+'px Georgia,serif'; const w=c.measureText(tag).width+30, ap=S.cap.id==='aplus';
    c.fillStyle=ap?'rgba(6,14,8,.92)':'rgba(16,26,46,.88)'; rr(c,x0+slide,y0,w,52,8); c.fill(); c.fillStyle=ap?'#6fe08a':'#f2b544'; c.fillRect(x0+slide,y0,5,52);
    c.fillStyle=ap?'#7fe0a0':'#f2b544'; c.font='700 '+nf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText((ap?'and ':'starring  ')+nm,x0+slide+16,y0+17); c.fillStyle='#f6ecd8'; c.font='italic '+tf+'px Georgia,serif'; c.fillText(tag,x0+slide+16,y0+38); c.globalAlpha=1; }
  // wipes between beats
  for(const k of [SEC.doors,SEC.turn,SEC.back,SEC.curtain]){ const u=(t-k+0.35)/0.7; if(u>0&&u<1){ const x=lerp(-W*0.2,W*1.2,u); c.fillStyle='#0b1220'; c.beginPath(); c.moveTo(x-W*0.6,0); c.lineTo(x+60,0); c.lineTo(x-60,Hh); c.lineTo(x-W*0.6-120,Hh); c.fill(); } }
  if(sn.set==='curtain'&&t>SEC.curtain+3.4){ const a=clamp((t-SEC.curtain-3.4)/0.8,0,1), tf=D.fitFont(c,'HECKTOWN ROAD','700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',Math.min(56,Hh/7),W*0.84);
    c.globalAlpha=a; c.textAlign='center'; c.fillStyle='#f6ecd8'; c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText('HECKTOWN ROAD',W/2,Hh*0.1); c.fillStyle='#7fe0a0'; c.font='700 '+Math.round(tf*0.36)+'px "IBM Plex Mono",monospace'; c.fillText('> CUTOVER NIGHT_',W/2,Hh*0.1+tf*0.78); c.globalAlpha=1; }
  c.textAlign='center'; c.fillStyle='rgba(246,236,216,.55)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to play':'press any key to play',W/2,Hh-22); }

function tick(dt){ S.t+=dt; const t=S.t; S.scn=scene(t); events(t,dt); music(dt); S.shake=Math.max(0,S.shake-dt*1.6);
  for(const m of S.marks) m.t-=dt; S.marks=S.marks.filter(m=>m.t>0); for(const b of S.bub) b.t-=dt; S.bub=S.bub.filter(b=>b.t>0);
  const sn=S.scn; if(!sn.freeze){ S.dustT=(S.dustT||0)+dt; if(S.dustT>0.07){ S.dustT=0; for(const a of sn.actors) if(a.kind==='run'||a.kind==='scramble') S.dust.push({x:a.x-a.F*6,y:-1.5,a:0}); if(sn.mon.show&&sn.mon.run) S.dust.push({x:sn.mon.x-sn.mon.F*10,y:-2,a:0}); } }
  for(const d of S.dust) d.a+=dt*2.2; S.dust=S.dust.filter(d=>d.a<1).slice(-160);
  for(const k of S.conf){ k.x+=k.vx*dt; k.y+=k.vy*dt; k.r+=dt*6; }
  if(sn.set!=='montage'&&t>=SEC.office){ const target=sn.cam||0; S.camX=sn.set==='office'&&!sn.freeze?S.camX+(target-S.camX)*(1-Math.exp(-6*dt)):target; if(Math.abs(S.camX-target)>600) S.camX=target; }
  if(t>=LEN) stop(); }

/* ---------------- start, stop, attract ---------------- */
const demoLight=()=>({dir:-1,k:0.55,col:'255,240,215',rim:0.3});
function start(){ S=build(); S.scn=scene(0); S.camX=260; H.setState('demo'); document.body.classList.add('cine'); $('title').classList.add('hide'); if(H.wake) H.wake(); if(PP.getLight){ prevLight=PP.getLight(); PP.setLight(demoLight); } }
function stop(){ S=null; document.body.classList.remove('cine'); H.setState('title'); $('title').classList.remove('hide'); idle=0; if(prevLight){ PP.setLight(prevLight); prevLight=null; } }
EXT.after.push((c,V,G,state,dt,now)=>{ if(state==='demo'&&S){ tick(Math.min(dt,0.05)); if(S) draw(c,V,now); } else if(state==='title'){ idle+=dt; if(idle>28) start(); } else idle=0; });
EXT.keys.unshift((e,state)=>{ if(state==='demo'){ stop(); return true; } if(state==='title') idle=0; return false; });
$('c').addEventListener('pointerdown',()=>{ if(H.state==='demo') stop(); idle=0; });
if(!$('bDemo')){ const btn=document.createElement('button'); btn.className='btn ghost'; btn.id='bDemo'; btn.textContent='Watch the demo'; btn.onclick=()=>start(); const bs=document.querySelector('#title .btns'); if(bs) bs.appendChild(btn); }
H.demo={start:start,stop:stop,scene:scene,pose:pose,SEC:SEC,LEN:LEN,state:()=>S};
})();
