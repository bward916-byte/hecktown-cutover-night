/* ==== DEMO: the attract reel on the title screen. A cartoon chase in six beats, set to a jaunty tune:
   1 the office: A+ ambushes the coffee break, everyone scrambles and RUNS (cat stop, pinball stop, password warnings)
   2 the hallway of doors: in one door, out another, A+ out the wrong one, the cat chasing the monster
   2b the time machine: through the portal into 1938 (the mare, the Founder, rain) and on to the moon (low gravity)
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
const CAST=['rianan','brians','bret','dave','aaron','umesh','fares','ash'], LEN=86.6;
const SEC={intro:0,office:5.0,doors:14.9,time:25.7,turn:53.5,back:57.2,freeze:63.6,montage:66.8,curtain:70.8};
/* the time-machine beat: three stops, each long enough to read. Everyone runs in, stops and looks around, a gag plays,
   A+ arrives late and confused, everyone scrambles and runs on. Clock spins of 1.2 s between. */
const ERA=[{id:'y1938',t0:26.9,len:8,year:1938,title:'1938  ·  GERMANSVILLE, PA'},{id:'y2060',t0:36.1,len:7,year:2060,title:'2060  ·  THE MUSEUM OF THE CUTOVER'},{id:'moon',t0:44.3,len:8,year:3270,title:'3270  ·  PHILLIPS ORBITAL DC'}];
const eraAt=t=>ERA.find(e=>t>=e.t0&&t<e.t0+e.len);
const BILL={rianan:['RIANAN','IT Department Head  ·  would stop for any cat'],brians:['BRIAN S','IT Manager  ·  nationally ranked pinball wizard'],bret:['BRET','Infrastructure  ·  new baby boy, and yes your screen is locked'],
  dave:['DAVE','iSeries Guru  ·  this close to Jeopardy'],aaron:['AARON','Network  ·  picks his line early'],umesh:['UMESH','EDI  ·  every 850 is his'],fares:['FARES','EDI  ·  Umesh\'s friend, and also his 850s'],
  ash:['ASH','Salesforce  ·  built a flow for that'],greg:['GREG','Number Scientist  ·  in no particular hurry'],aplus:['A+','since 1985  ·  a monster, affectionately']};
let S=null, idle=0, prevLight=null;
const person=id=>GM.PEOPLE.find(p=>p.id===id);

/* ---------------- a real run: flight phase, knees up, arms pumping, leaning into it ----------------
   kind: run | scramble (legs spinning in place, cartoon style) | walk | stand | fold (arms crossed) | bow */
function pose(x,t,F,kind,o){ o=o||{};
  const TH=C.thigh, SH=C.shin, TOR=C.torso, UA=C.upperArm, FA=C.foreArm, AH=C.ankleH;
  const K={run:{f:1.6,th:0.95,kb:0.35,ka:1.55,lean:0.32,arm:1.15,el:1.75,bob:3.8},scramble:{f:5.5,th:1.05,kb:0.5,ka:1.4,lean:0.12,arm:1.3,el:1.5,bob:1.2},
    walk:{f:0.85,th:0.36,kb:0.1,ka:0.55,lean:0.03,arm:0.32,el:0.3,bob:0.9},stand:{f:0.3,th:0,kb:0.08,ka:0,lean:0,arm:0,el:0.25,bob:0},
    fold:{f:0.3,th:0,kb:0.08,ka:0,lean:-0.05,arm:0,el:2.2,bob:0},bow:{f:0.3,th:0,kb:0.15,ka:0,lean:0,arm:0,el:0.4,bob:0},sit:{f:0,th:1.45,kb:1.5,ka:0,lean:-0.12,arm:0,el:0.4,bob:0},kick:{f:0,th:0,kb:0.05,ka:0,lean:-0.06,arm:0,el:0.15,bob:0}}[kind]||{};
  const ph=(t*K.f+(o.off||0))*Math.PI*2, lean=(o.lean!=null?o.lean:K.lean)+(kind==='bow'?(o.bow||0)*1.0:0);
  const legs=[], lows=[];
  const kp=kind==='kick'?(o.kick||0)*Math.PI*2*(184/60/2)/2+(o.off||0)*Math.PI*2:0;
  for(let i=0;i<2;i++){ const p=ph+i*Math.PI, th=kind==='sit'?1.45+(i?0.12:-0.12):kind==='kick'?1.45*Math.pow(Math.max(0,Math.sin(kp+i*Math.PI)),2):K.th*Math.sin(p)+(kind==='stand'||kind==='fold'||kind==='bow'?(i?0.06:-0.06):0), k=kind==='sit'?1.5:kind==='kick'?0.05:K.kb+K.ka*Math.max(0,Math.sin(p+0.9));
    const kx=Math.sin(th)*F*TH, ky=Math.cos(th)*TH, ax=kx+Math.sin(th-k)*F*SH, ay=ky+Math.cos(th-k)*SH; legs.push([kx,ky,ax,ay,0.3*Math.sin(p)*(K.th>0.5?1:0.5)]); lows.push(ay); }
  const hipY=kind==='sit'?-24:-(AH+Math.max(lows[0],lows[1]))-K.bob*(0.5+0.5*Math.cos(2*ph))-(o.hop||0)-(kind==='kick'?2.5*Math.abs(Math.sin(kp)):0)+(kind==='stand'||kind==='fold'?Math.sin(t*2.1)*0.3:0);
  const hip={x:x,y:hipY}, dx=Math.sin(lean)*F, dy=-Math.cos(lean), neck={x:x+dx*TOR,y:hipY+dy*TOR}, sh={x:x+dx*(TOR-2.6),y:hipY+dy*(TOR-2.6)};
  const head={x:neck.x+dx*(C.neck+C.headR*0.95),y:neck.y+dy*(C.neck+C.headR*0.95)+(kind==='run'?Math.sin(ph*2)*0.8:0),a:F*lean*0.5+F*(o.tilt||0)+(kind==='run'?0.05*Math.sin(ph*2):0)};
  const arms=[]; for(let i=0;i<2;i++){ const a=(kind==='fold'?0.2:(kind==='kick'?(i?1.6:-1.4)+0.15*Math.sin(kp*2):-K.arm*Math.sin(ph+i*Math.PI)))+(o.armsUp?2.8:0)+lean*0.6, b=a+(o.armsUp?0.2:K.el);
    const ex=sh.x+Math.sin(a)*F*UA, ey=sh.y+Math.cos(a)*UA; arms.push({ex:ex,ey:ey,hx:ex+Math.sin(b)*F*FA,hy:ey+Math.cos(b)*FA}); }
  return {hip:hip,neck:neck,head:head,sh:sh,face:F,prop:null,arms:arms,legs:legs.map(l=>({kx:x+l[0],ky:hipY+l[1],ax:x+l[2],ay:hipY+l[3],pitch:l[4],face:F}))}; }

/* ---------------- the script ---------------- */
function run(from,to,t0,v,t){ const d=to-from, T=Math.abs(d)/v; const u=clamp((t-t0)/T,0,1); return {x:from+d*u,done:t>=t0+T,F:Math.sign(d)||1}; }
function build(){ return {doorA:[0,0,0,0],doorV:[0,0,0,0],slams:[],t:0,bub:[],dust:[],conf:[],marks:[],cap:null,billed:{},sting:{},note:0,beat:0,camX:0,shake:0,lastT:0}; }
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
      if(id==='dave'&&tt>2.2&&tt<5.2){ const u=tt-2.2; x=x0+v*2.2+u*v*1.7; return act(id,x,'sit',1,{mood:'happy',chair:true}); } if(id==='dave'&&tt>=5.2){ x=x0+v*2.2+3.0*v*1.7+(tt-5.2)*v; }
      if(id==='aaron'){ const crate=1250, dh=x-crate; if(Math.abs(dh)<45) return act(id,x,kind,1,{mood:'happy',hop:26*(1-(dh/45)*(dh/45))}); }
      act(id,x,kind,1,{mood:kind==='run'?'surprise':null,tilt:kind==='run'&&Math.sin(T*1.7+i*2.1)>0.8?-0.5:0}); });
    const mx=T<0.4?lerp(-120,60,0):(T<1.2?lerp(-120,70,ss((T-0.4)/0.8)):70+Math.max(0,T-fleeAt-0.3)*168);
    out.mon={show:true,x:mx,F:1,run:T>0.4&&T<1.0||T>fleeAt+0.3,mood:T<1.2?'smug':'mean',loom:(T>0.95&&T<1.6)||(T>fleeAt+2&&Math.sin(T*2.2)>0.85)?1:0};
    out.milo={show:true,x:T<fleeAt+scram+(980-160)/185?1000:1000+(T-(fleeAt+scram+(980-160)/185))*240,F:1,run:T>fleeAt+scram+(980-160)/185+1.1};
    const xs=out.actors.map(a=>a.x); out.cam=clamp((Math.min(...xs)+Math.max(...xs))/2*0.7+out.mon.x*0.3,300,99999); if(T<fleeAt+0.2) out.cam=225;
    return out; }
  if(t<SEC.time){ // 2. the hallway of doors
    const T=t-SEC.doors; out.set='doors'; out.cam=0; const DX=[-165,-55,55,165];
    const R=[[0.3,'rianan',0,2],[0.75,'aplus',0,2],[1.8,'brians',3,1],[2.0,'bret',3,1],[2.6,'aplus',2,0],[3.3,'dave',1,3],[3.55,'aaron',1,3],[4.1,'umesh',2,0],[4.3,'fares',2,0],
      [5.0,'aplus',3,1],[5.4,'greg',1,2,34],[6.5,'aplus',3,0,230],[6.85,'milo',3,0,250],[8.0,'ash',0,3],[8.6,'rianan',0,3],[8.8,'brians',0,3],[9.0,'bret',0,3],[9.2,'dave',0,3],[9.4,'aaron',0,3],[9.6,'umesh',0,3],[9.8,'fares',0,3],[10.3,'aplus',3,2,90]];
    const seen={}; out.doorsOpen=[0,0,0,0];
    for(const r of R){ const [t0,id,a,b,v]=r; if(T<t0) continue; const p=run(DX[a],DX[b],t0,v||200,T); if(p.done&&!(id==='aplus'&&r===R[R.length-1])) continue; if(seen[id]) continue; seen[id]=1;
      for(let k=0;k<4;k++) if(Math.abs(p.x-DX[k])<26) out.doorsOpen[k]=1;
      if(id==='aplus') out.mon={show:true,x:p.x,F:p.F,run:!p.done,mood:r===R[4]||r===R[11]?'confused':(r===R[R.length-1]?'smug':'mean')};
      else if(id==='milo') out.milo={show:true,x:p.x,F:p.F,run:true};
      else act(id,p.x,id==='greg'?'walk':'run',p.F,{mood:id==='greg'?null:'surprise',conga:T>=8.6&&id!=='ash'}); }
    out.DX=DX; return out; }
  if(t<SEC.turn){ // 2b. the time machine
    const era=eraAt(t); if(!era){ const k=ERA.findIndex(e=>t<e.t0), from=k<=0?2026:ERA[k-1].year, to=k<0?2026:ERA[k].year, a=k<0?ERA[2].t0+ERA[2].len:(k===0?SEC.time:ERA[k-1].t0+ERA[k-1].len), b=k<0?SEC.turn:ERA[k].t0;
      out.set='spin'; out.cam=60; out.spin={from:from,to:to,u:(t-a)/(b-a)}; return out; }
    out.set=era.id; const T=t-era.t0, L=era.len, moon=era.id==='moon', spot=i=>40+i*34, mArr=L-3.8, flee=L-2.2;
    CAST.forEach((id,i)=>{ const p=run(-380-i*26,spot(i),0.02+i*0.04,340,T); let x=p.x, kind=p.done?'stand':'run', F=p.done?(i%2?-1:1):1, mood=p.done?null:'surprise';
      if(T>=flee){ const f=T-flee; if(f<0.5){ kind='scramble'; F=1; mood='surprise'; } else { x=spot(i)+(f-0.5)*240; kind='run'; F=1; mood='surprise'; } }
      const hop=moon?(kind==='run'?24*Math.abs(Math.sin(T*2.4+i*0.9)):(kind==='stand'?4*Math.abs(Math.sin(T*1.6+i)):0)):0;
      if(era.id==='y1938'&&id==='rianan'&&p.done&&T<flee) F=1;                                             // she is looking at the horse
      if(era.id==='y2060'&&p.done&&T<flee) F=1;                                                             // everyone stares at the case
      act(id,x,kind,F,{mood:mood,hop:hop}); });
    const m=run(-560,-60,mArr,200,T), late=T>=flee+0.9; out.mon={show:T>=mArr,x:late?-60+(T-flee-0.9)*230:m.x,F:1,run:!m.done||late,mood:T<flee?'confused':'mean',hop:moon&&(!m.done||late)?20*Math.abs(Math.sin(T*2.0)):0};
    if(era.id==='y1938'){ out.founder={x:410}; out.mare={x:325}; }
    if(era.id==='y2060'){ out.caseX=330; }
    if(moon){ out.milo={show:true,x:330,F:-1,run:false,sit:true,helmet:true}; out.biscuit={x:400}; }
    out.era=era; const mid=(Math.min(...out.actors.map(a=>a.x))+Math.max(...out.actors.map(a=>a.x)))/2; out.cam=clamp(T<flee?(mid+300)/2:mid*0.7+(out.mon.show?out.mon.x:mid)*0.3+60,-40,360); return out; }
  if(t<SEC.back){ // 3. the turnabout
    const T=t-SEC.turn; out.set='dead'; out.cam=10;
    const m=run(-220,120,0,260,T), trip=T>1.0&&T<2.2?Math.sin(clamp((T-1.0)/1.2,0,1)*Math.PI):0; out.mon={show:true,x:m.x,F:T>2.4?-1:1,run:!m.done,mood:T<0.9?'mean':(T<2.6?'confused':'mean'),panic:T>2.6,trip:trip};
    CAST.forEach((id,i)=>{ const col=i%4, row=i/4|0, tx=-40-col*28-row*14; const p=run(-330-row*20,tx,1.1+row*0.12,170,T); act(id,p.x,p.done?'fold':'walk',1,{mood:T>1.2&&T<2.2?'happy':null}); });
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
  CAST.forEach((id,i)=>{ if(id==='ash') return; const from=i<4?-420:420, p=run(from,spots[i],0.1+(i%4)*0.12,260,T); const bw=clamp(Math.sin(clamp((T-2.6-i*0.14)/0.9,0,1)*Math.PI),0,1);
    const kick=T>5.0&&T<11.0, look=T>12.6;
    act(id,p.x,p.done?(kick?'kick':(bw>0.01?'bow':'stand')):'run',p.done?(look?1:(T>2.4?1:(i<4?1:-1))):p.F,{mood:p.done?(look?'surprise':'happy'):null,bow:bw,kick:kick?(T-5.0):0,off:i%2?0.5:0}); });
  if(T>11.8){ const a=run(430,250,11.8,110,T); act('ash',a.x,a.done?'stand':'walk',-1,{mood:null,shades:true}); }
  const g=run(-420,-250,0.2,60,T); act('greg',g.x,g.done?'stand':'walk',1,{mood:null,bow:0}); out.lyric=T>5.0&&T<11.0?T-5.0:null;
  out.mon={show:true,x:T<1.2?lerp(0,0,1):0,F:1,run:false,mood:T>3?'smug':'idle',rise:ss(T/1.2)};
  out.milo={show:true,x:250,F:-1,run:false,sit:true}; return out; }

/* events keyed to the script: speech, stings, captions */
function events(t,dt){
  const T=k=>t>=k;
  if(T(SEC.office+0.4)) once('pop',()=>{ say('aplus','BOO.',0.9); });
  if(T(SEC.office+1.0)) once('roar',()=>{ say('aplus','RRRAAAAAH!',1.3); sfx('roar'); S.shake=0.6; bill('aplus'); for(const id of CAST) S.marks.push({id:id,t:0.9}); });
  if(T(SEC.office+1.5)) once('scram',()=>{ burst(300,0.5,0.06,0.5,1200); });
  if(T(SEC.office+2.8)) once('pw',()=>say('bret','ROTATE YOUR PASSWORDS!',1.8));
  if(T(SEC.office+3.6)) once('dq',()=>say('dave','WHAT IS... A DESK CHAIR?!',1.8)); if(T(SEC.office+4.6)) once('whee',()=>{ say('dave','WHEEE!',1.2); tone(500,0.5,0.03,'sine',900); });
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
  // the time machine
  if(T(SEC.time)) once('tm',()=>{ say('aplus','WHERE DID THEY— A PORTAL?',1.2); tone(300,0.6,0.05,'sine',1800); });
  { const E1=ERA[0].t0, E2=ERA[1].t0, E3=ERA[2].t0;
    if(T(E1+1.8)) once('e1a',()=>say('dave','WHAT YEAR IS IT?',1.6)); if(T(E1+2.4)) once('e1b',()=>say('rianan','HORSE! ♥',1.8)); if(T(E1+3.1)) once('e1c',()=>say('founder','Showing up is the business.',2.4));
    if(T(E1+3.9)) once('e1d',()=>say('bret','1938. NO PASSWORDS. NO FIREWALL. I NEED TO SIT DOWN.',2.4)); if(T(E1+4.4)) once('e1r',()=>burst(1400,0.4,0.03,1.4));
    if(T(E1+5.0)) once('e1e',()=>say('aplus','WHEN AM I?',1.4)); if(T(E1+5.9)) once('e1f',()=>{ say('aplus','RRAAH!',0.9); S.shake=0.4; });
    if(T(E2+1.8)) once('e2a',()=>say('brians','IS THAT... A+? IN A BOX?',1.8)); if(T(E2+2.6)) once('e2b',()=>say('caseaplus','I AM IN A BOX. IT IS FINE.',2.2)); if(T(E2+3.5)) once('e2c',()=>say('fares','UMESH, IT\'S STILL SHIPPING ON TIME.',1.8));
    if(T(E2+4.2)) once('e2d',()=>say('aplus','...WHO IS THAT?',1.4)); if(T(E2+4.9)) once('e2e',()=>say('caseaplus','YOU. LATER. DON\'T TAP THE GLASS.',1.6)); if(T(E2+5.4)) once('e2f',()=>{ say('aplus','RRAAH!?',0.9); S.shake=0.3; });
    if(T(E3+1.6)) once('e3a',()=>say('bret','LOW GRAVITY! LOCK YOUR SCREENS!',1.8)); if(T(E3+2.5)) once('e3b',()=>say('aaron','CLASS IV. ON THE MOON. BOOK IT.',1.8)); if(T(E3+3.3)) once('e3c',()=>say('ash','Don\'t ask.',1.6));
    if(T(E3+4.2)) once('e3d',()=>say('aplus','I RUN THE MOON. LATER. IT\'S COMPLICATED.',2.0)); if(T(E3+5.6)) once('e3e',()=>{ say('aplus','RRAAH!',0.9); S.shake=0.4; }); if(T(E3+7.2)) once('e3f',()=>say('umesh','850s! IN! SPACE!',1.4)); }
  // the turnabout
  if(T(SEC.turn+0.8)) once('scratch',()=>{ tone(900,0.35,0.05,'sawtooth',120); burst(800,0.6,0.05,0.3,200); });
  if(T(SEC.turn+1.0)) once('trip',()=>{ say('aplus','WHOA—',0.8); tone(700,0.5,0.04,'sine',180); });
  if(T(SEC.turn+1.7)) once('thud',()=>{ S.shake=0.6; burst(90,0.7,0.08,0.25); for(let k=0;k<8;k++) S.dust.push({x:120+k*6-20,y:-2,a:0}); });
  if(T(SEC.turn+2.0)) once('snick',()=>say('dave','...Who trips on their own cord?',1.6));
  if(T(SEC.turn+2.5)) once('q',()=>say('aplus','DEAD END?',1.0));
  if(T(SEC.turn+3.0)) once('fold',()=>say('bret','Badge, please.',1.4));
  if(T(SEC.turn+3.4)) once('eep2',()=>{ say('aplus','EEP!',0.9); S.shake=0.3; });
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
  if(T(SEC.curtain+12.4)) once('ash1',()=>say('ash','Sorry I\'m late.',1.8)); if(T(SEC.curtain+14.0)) once('ash2',()=>say('rianan','Where were you?',1.4)); if(T(SEC.curtain+15.2)) once('ash3',()=>say('ash','Don\'t ask.',2.2));
  // captions: one at a time
  if(!S.cap&&S.capQ&&S.capQ.length) S.cap={id:S.capQ.shift(),t:0};
  if(S.cap){ S.cap.t+=dt; if(S.cap.t>3.2) S.cap=null; } }

/* ---------------- music: a cartoon chase, swung, with a walking bass, chord stabs, a countermelody on the way back ----------------
   Original tune in C. 32 steps of swung eighths per loop; the way back goes up a fourth and faster. */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const MEL =[72,74,76,72,79,0,79,77,76,74,76,72,74,0,67,69,72,74,76,79,81,79,77,76,74,76,74,71,72,0,76,79];
const MEL2=[84,0,83,0,81,0,79,0,77,0,76,0,74,0,72,0,84,0,81,0,79,0,76,0,74,76,77,74,72,0,0,0];
const CH  =[[48,52,55],[48,52,55],[55,59,62],[55,59,62],[53,57,60],[53,57,60],[48,52,55],[55,59,62]];
const BASS=[48,55,52,55, 55,62,59,62, 53,60,57,60, 48,55,59,55, 48,55,52,55, 55,62,59,62, 53,57,60,57, 48,52,55,43];
function music(dt){ const a=A(); if(!a||!a.ctx()) return; const t=S.t;
  const ph=t<SEC.office?'intro':(t<SEC.turn?'chase':(t<SEC.turn+2.4?'stop':(t<SEC.freeze?'back':(t<SEC.freeze+2.2?'freeze':(t<SEC.curtain?'go':'finale')))));
  if(ph==='intro'){ for(let k=0;k<6;k++) if(t>0.2+k*0.5) once('boot'+k,()=>tone(k===5?220:1320,k===5?0.4:0.05,0.03,k===5?'sawtooth':'square')); if(t>3.0) once('growl',()=>sfx('roar')); if(t>3.4) once('intro',()=>[60,64,67,72].forEach((n,k)=>tone(NOTE(n),0.4,0.035,'triangle',null,k*0.14))); }
  if(ph==='chase'||ph==='back'||ph==='go'){ const bpm=ph==='chase'?184:212, step=60/bpm/2, up=ph==='chase'?0:5; S.beat+=dt;
    while(S.beat>=step){ S.beat-=step; const i=S.note%32, sw=(i%2)?step*0.16:0;                       // swing: offbeats land late
      tone(NOTE(BASS[i]+up),step*0.75,0.05,'triangle',null,sw);                                       // walking bass
      if(i%4===2) for(const n of CH[(i>>2)%8]) tone(NOTE(n+12+up),step*0.35,0.014,'square',null,sw);    // chord stab on the off-beat
      if(MEL[i]) tone(NOTE(MEL[i]+up),step*0.5,0.024,'square',null,sw);                                // the tune
      if(ph!=='chase'&&MEL2[i]) tone(NOTE(MEL2[i]+up),step*0.4,0.014,'triangle',null,sw+0.01);        // countermelody once the tables turn
      if(i%8===0) burst(110,0.7,0.07,0.07); if(i%8===4) burst(800,0.6,0.045,0.06); if(i%2===1) burst(4000,1.2,0.012,0.025,3000);   // kick, snare, hats
      if(i===0&&Math.floor(S.note/32)%2===1) tone(NOTE(84+up),step,0.02,'sine',NOTE(72+up));          // a little slide at the top of every other loop
      S.note++; } }
  if(ph==='stop') once('stopmus',()=>{ tone(NOTE(60),0.6,0.03,'triangle',NOTE(48)); });
  if(ph==='freeze'){ S.tick=(S.tick||0)+dt; if(S.tick>0.5){ S.tick=0; burst(1800,3,0.03,0.03); } }
  if(ph==='finale') once('fan',()=>{ [60,64,67,72,76,79,84].forEach((n,k)=>tone(NOTE(n),k===6?1.6:0.22,0.035,'triangle',null,k*0.11)); [48,52,55].forEach(n=>tone(NOTE(n),1.8,0.03,'triangle',null,0.66)); });
  if(ph==='finale'&&t>SEC.curtain+2.4){ const step=60/150/2; S.beat+=dt; while(S.beat>=step){ S.beat-=step; const i=S.note%32; tone(NOTE(BASS[i]),step*0.7,0.03,'triangle'); if(MEL[i]&&i%2===0) tone(NOTE(MEL[i]),step*0.5,0.016,'square'); S.note++; } } }

/* ---------------- drawing ---------------- */
function drawSet(c,set,cam,t,sc,W,Hh,ox,oy){
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  if(set==='spin'){ c.fillStyle='#120e0a'; c.fillRect(0,0,W,Hh); const sp=S.scn.spin||{u:0,from:2026,to:2026}, u=clamp(sp.u,0,1), cx=W/2, cy=Hh*0.42, r=Math.min(W,Hh)*0.14;
    c.fillStyle='#f0e0c0'; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill(); c.strokeStyle='#3a2a1a'; c.lineWidth=3; c.stroke(); for(let k=0;k<12;k++){ const a=k*Math.PI/6; c.beginPath(); c.moveTo(cx+Math.cos(a)*r*0.86,cy+Math.sin(a)*r*0.86); c.lineTo(cx+Math.cos(a)*r*0.95,cy+Math.sin(a)*r*0.95); c.stroke(); }
    const spin=u*u*30*(sp.to>sp.from?1:-1); c.lineWidth=4; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(spin)*r*0.55,cy+Math.sin(spin)*r*0.55); c.stroke(); c.lineWidth=2.5; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(spin*12)*r*0.8,cy+Math.sin(spin*12)*r*0.8); c.stroke();
    c.fillStyle='#f2b544'; c.font='700 '+Math.round(Math.min(48,W/9))+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(Math.round(sp.from+(sp.to-sp.from)*ss(u))),cx,cy+r+40); return; }
  if(set==='y1938'){ const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#6a6058'); g.addColorStop(1,'#c9b48a'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
    c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0); R(-600,0,1400,400,'#5a4a34'); R(-600,0,1400,4,'#7a6a44');
    R(-40,-150,380,150,'#9a8460'); c.fillStyle='#6a5a44'; c.beginPath(); c.moveTo(-60,-148); c.lineTo(150,-210); c.lineTo(360,-148); c.closePath(); c.fill(); R(0,-130,300,22,'#e8dcc0'); c.fillStyle='#3a2a1a'; c.font='700 16px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS FEED',150,-119);
    R(-46,-92,392,5,'#6a4a2a'); for(let x=-40;x<=340;x+=76) R(x,-88,4,88,'#6a4a2a');
    if(S.scn.mare){ const mx=S.scn.mare.x; c.fillStyle='#7a5238'; c.strokeStyle='#151a22'; c.lineWidth=1; c.beginPath(); c.ellipse(mx,-34,24,11,0,0,7); c.fill(); c.stroke(); for(const lx of [-16,-8,10,18]) R(mx+lx-2,-30,4,30,'#6a4630'); c.beginPath(); c.ellipse(mx-32,-56,10,5,-0.5,0,7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(mx-18,-42); c.lineTo(mx-28,-56); c.lineTo(mx-22,-58); c.lineTo(mx-12,-44); c.fill(); }
    if(S.scn.founder){ const fp=pose(S.scn.founder.x,t,-1,'fold',{}); PP.person(c,fp,{skin:'#e6c2a0',hair:'#8a8a8a',style:'cap',shirt:'#2e2a26',pants:'#2a2622',acc:'none',top:'blazer',bottom:'slacks'},{ground:()=>0,w:{},t:t,talk:S.bub.some(b=>b.who==='founder')}); }
    c.restore(); c.globalCompositeOperation='saturation'; c.fillStyle='#808080'; c.fillRect(0,0,W,Hh); c.globalCompositeOperation='multiply'; c.fillStyle='#d9b98a'; c.fillRect(0,0,W,Hh); c.globalCompositeOperation='source-over';
    if(t>ERA[0].t0+4.4){ c.strokeStyle='rgba(235,230,215,.4)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<120;i++){ const y=(((i*37)%Hh)+t*520)%Hh, x=((i*53)%W); c.moveTo(x,y); c.lineTo(x-4,y+13); } c.stroke(); } return; }
  if(set==='y2060'){ const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#c9c4ee'); g.addColorStop(1,'#ffe9d0'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
    c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0); R(-600,0,1400,400,'#dcd8ea'); R(-600,0,1400,3,'#8a84b8'); for(let x=-600;x<800;x+=60) R(x,0,30,400,'rgba(255,255,255,.25)');
    for(let x=-560;x<800;x+=110){ R(x,-186,3,186,'rgba(120,110,170,.35)'); R(x+8,-176,92,150,'rgba(200,220,255,.28)'); } R(-600,-192,1400,3,'#7fe0a0');
    R(140,-150,380,26,'#2b2f45'); c.fillStyle='#7fe0a0'; c.font='700 11px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('MUSEUM OF THE CUTOVER',330,-137);
    const cx=S.scn.caseX||330; R(cx-50,-16,100,16,'#8a84b8'); c.fillStyle='rgba(200,230,255,.22)'; c.fillRect(cx-44,-120,88,104); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.2; c.strokeRect(cx-44,-120,88,104);
    if(D.aplusMonster) D.aplusMonster(c,cx,-16,0.78,t,S.bub.some(b=>b.who==='caseaplus')?'smug':'quiet',{dir:-1,sleep:!S.bub.some(b=>b.who==='caseaplus'),talk:S.bub.some(b=>b.who==='caseaplus')});
    R(cx-34,-6,68,6,'#f6ecd8'); c.fillStyle='#243447'; c.font='700 3.6px "IBM Plex Sans",sans-serif'; c.fillText('A+  ·  1985–2026  ·  SHIPPED ON TIME',cx,-3); c.restore(); return; }
  if(set==='moon'){ c.fillStyle='#050812'; c.fillRect(0,0,W,Hh); c.fillStyle='#f6ecd8'; for(let i=0;i<90;i++) c.fillRect((i*97)%W,(i*61)%(Hh*0.7),1.5,1.5);
    { const ex=W*0.8, ey=Hh*0.2, r=Math.min(W,Hh)*0.12; const g=c.createRadialGradient(ex-r*0.4,ey-r*0.4,r*0.2,ex,ey,r); g.addColorStop(0,'#5aa0e0'); g.addColorStop(1,'#123a5e'); c.fillStyle=g; c.beginPath(); c.arc(ex,ey,r,0,7); c.fill(); c.fillStyle='rgba(120,180,90,.7)'; c.beginPath(); c.ellipse(ex-r*0.2,ey,r*0.4,r*0.28,0.6,0,7); c.fill(); }
    c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0); R(-600,0,1400,400,'#8a8f98'); R(-600,0,1400,4,'#b8bcc4'); for(let x=-560;x<800;x+=90){ c.fillStyle='#6f7480'; c.beginPath(); c.ellipse(x,6,18,4,0,0,7); c.fill(); }
    R(200,-160,240,20,'#232a3c'); c.fillStyle='#7fe0a0'; c.font='700 9px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS ORBITAL DC  ·  3270',320,-150);
    if(S.scn.biscuit){ const bx=S.scn.biscuit.x, hop=6*Math.abs(Math.sin(t*3)); c.save(); c.translate(bx,-hop); c.strokeStyle='#151a22'; c.lineWidth=0.9; c.fillStyle='#8d939c'; c.beginPath(); c.ellipse(0,-8,11,4.6,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(-11,-12,4,0,7); c.fill(); c.stroke(); c.fillStyle='#e0563a'; c.beginPath(); c.arc(-13,-12.5,1,0,7); c.fill(); for(const k of [-7,-3,4,8]) R(k-1,-6,2,6,'#555b65'); c.fillStyle='#7fe0a0'; c.font='700 3px "IBM Plex Mono",monospace'; c.textAlign='center'; c.fillText('BISCUIT-9000',0,-16); c.restore(); }
    c.restore(); return; }
  if(set==='curtain'){ const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#3a0f14'); g.addColorStop(1,'#1a0609'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
    c.save(); c.translate(ox,oy); c.scale(sc,sc); for(let x=-520;x<520;x+=26){ const sh=0.5+0.5*Math.sin(x*0.25); c.fillStyle='rgba(120,20,30,'+(0.4+0.3*sh)+')'; c.fillRect(x,-400,14,400); }
    R(-600,0,1200,300,'#3a2418'); R(-600,0,1200,4,'#c9a56a'); const sp=c.createRadialGradient(0,-60,10,0,-60,300); sp.addColorStop(0,'rgba(255,240,200,.35)'); sp.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=sp; c.fillRect(-400,-360,800,360); c.restore(); return; }
  const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,set==='dead'?'#2e3848':'#3d4a5c'); g.addColorStop(1,'#26303e'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
  c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0);
  const x0=cam-W/sc, x1=cam+W/sc;
  if(set==='doors'){ R(-400,-200,800,200,'#34405a'); for(let x=-400;x<400;x+=40) R(x,-200,2,200,'rgba(0,0,0,.12)');
    S.scn.DX.forEach((dx,k)=>{ const a=S.doorA[k], sl=S.slams.find(z=>z.k===k), rattle=sl?Math.sin(sl.t*60)*(0.7-sl.t)*2:0; R(dx-22,-78,44,78,'#1a2030');
      c.fillStyle='rgba(255,236,190,'+(0.25*a).toFixed(2)+')'; c.beginPath(); c.moveTo(dx-20,0); c.lineTo(dx+20,0); c.lineTo(dx+20+a*30,8); c.lineTo(dx-20-a*10,8); c.fill();
      const w=40*Math.cos(a*1.35); c.fillStyle=a>0.02?'#8a6a40':'#6a4a2a'; c.fillRect(dx-20+rattle,-76,Math.max(3,w),76); c.strokeStyle='#151a22'; c.lineWidth=1; c.strokeRect(dx-20+rattle,-76,Math.max(3,w),76);
      if(w>12){ c.fillStyle='#c9a56a'; c.fillRect(dx-20+w-10+rattle,-40,4,4); c.fillStyle='rgba(200,220,255,.35)'; c.fillRect(dx-20+w*0.2+rattle,-66,w*0.6,14); }
      if(sl&&sl.t<0.5){ c.save(); c.translate(dx,-96); c.rotate(-0.15); c.scale(1+sl.t,1+sl.t); c.fillStyle='#f2b544'; c.font='900 14px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.globalAlpha=1-sl.t*2; c.fillText('BANG!',0,0); c.globalAlpha=1; c.restore(); }
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
  const W=V.W, Hh=V.H, t=S.t, T=now/1000, ZS={office:0.85,doors:0.64,dead:0.7,curtain:0.62,y1938:0.68,y2060:0.68,moon:0.7}[S.scn.set]||0.8, sc=(W<Hh?Math.min(W/300,Hh/330)*1.15:Math.min(Hh*0.3/64,W*0.9/300))*ZS, sh=S.shake>0?Math.sin(T*70)*S.shake*6:0, ox=W/2+sh, oy=Hh*(W<Hh?0.62:(S.scn.set==='curtain'?0.8:0.74));
  c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(t<SEC.office){ c.fillStyle='#050a06'; c.fillRect(0,0,W,Hh);
    if(t<3.4){ const L=['A+ > BOOT','COPYRIGHT 1985  PHILLIPS PET FOOD & SUPPLIES','ORDERS SHIPPED ........ ALL OF THEM','CUTOVER SCHEDULED ..... TONIGHT  00:00','...','CUTOVER?'], fs=Math.min(18,W/30), x0=Math.max(20,W*0.12), y0=Hh*0.25;
      c.font='700 '+fs+'px "IBM Plex Mono",monospace'; c.textAlign='left'; c.textBaseline='middle';
      L.forEach((l,k)=>{ const st=0.2+k*0.5; if(t<st) return; const n=Math.floor(clamp((t-st)/0.35,0,1)*l.length); c.fillStyle=k===5?'#e0563a':'#7fe0a0'; c.fillText(l.slice(0,n)+(t-st<0.5&&Math.floor(t*6)%2?'▮':''),x0,y0+k*fs*1.7); });
      if(t>2.6&&D.aplusMonster){ c.save(); c.translate(W*0.78,Hh*0.72); const s2=Math.min(W,Hh)/260; c.scale(s2,s2); D.aplusMonster(c,0,0,1,t,t>3.0?'mean':'confused',{dir:-1,talk:true,loom:t>3.0?1:0}); c.restore(); }
      c.fillStyle='rgba(127,224,160,.05)'; for(let y=0;y<Hh;y+=3) c.fillRect(0,y,W,1); return; }
    const txt='PHILLIPS IT PRESENTS', n=Math.floor(clamp((t-3.4)/0.9,0,1)*txt.length); c.fillStyle='#7fe0a0'; c.font='700 '+Math.min(22,W/20)+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(txt.slice(0,n)+(Math.floor(t*3)%2?'▮':' '),W/2,Hh*0.45); if(t>4.2){ c.globalAlpha=clamp((t-4.2)/0.5,0,1); c.fillStyle='#f6ecd8'; c.font='italic '+Math.min(18,W/24)+'px Georgia,serif'; c.fillText('a cutover chase, with music',W/2,Hh*0.45+36); c.globalAlpha=1; } return; }
  if(S.scn.set==='montage'){ D.drawCardStyle(c,V,{},{title:'THE GAME',sub:'no bosses · one very old system',t:t-SEC.montage,dur:4,style:'comic',panels:[{i:'1938',c:'It starts with oats'},{i:'✍',c:'Six signatures'},{i:'🚚',c:'Nine DCs, one truck'}]}); return; }
  const cam=S.camX; drawSet(c,S.scn.set,cam,t,sc,W,Hh,ox,oy); if(S.scn.set==='spin'){ c.textAlign='center'; c.fillStyle='rgba(246,236,216,.55)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to play':'press any key to play',W/2,Hh-22); return; }
  c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0);
  // dust behind runners
  for(const d of S.dust){ c.fillStyle='rgba(200,206,214,'+(0.35*(1-d.a)).toFixed(3)+')'; c.beginPath(); c.arc(d.x,d.y,2+d.a*6,0,7); c.fill(); }
  const gy=()=>0, sn=S.scn;
  if(sn.milo.show&&sn.set!=='curtain') cat(c,sn.milo.x,sn.milo.F,T,sn.milo.run,false);
  const draws=[]; for(const a of sn.actors){ if(sn.freeze&&a.id==='greg') continue; const p=person(a.id); const off=(a.id.charCodeAt(0)%7)/7; const tt=sn.freeze?SEC.freeze+off:t+off;
    const P=pose(a.x,tt,a.F,a.kind,{hop:a.hop,bow:a.bow,off:off}); a.P=P; draws.push([a.x,()=>{
      if((a.kind==='run'||a.kind==='scramble')&&!sn.freeze){ c.strokeStyle='rgba(246,236,216,.35)'; c.lineWidth=1.2; for(let k=0;k<3;k++){ const y=P.hip.y-6-k*7, x=a.x-a.F*(10+k*3); c.beginPath(); c.moveTo(x,y); c.lineTo(x-a.F*(16+k*4),y); c.stroke(); } }
      if(a.kind==='scramble'){ c.strokeStyle='rgba(246,236,216,.5)'; c.lineWidth=1; c.beginPath(); c.ellipse(a.x+a.F*3,-12,15,12,0,0,7); c.stroke(); }
      if(a.chair){ c.fillStyle='#30343c'; c.fillRect(a.x-9,-24,18,4); c.fillRect(a.x-11,-40,4,18); c.fillRect(a.x-1,-20,2,12); for(const k of [-9,0,9]){ c.fillStyle='#14171d'; c.beginPath(); c.arc(a.x+k,-3,3,0,7); c.fill(); } c.strokeStyle='rgba(246,236,216,.4)'; c.lineWidth=1; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(a.x-14-k*6,-8-k*6); c.lineTo(a.x-34-k*8,-8-k*6); c.stroke(); } }
      PP.person(c,P,p.look,{ground:gy,w:{},t:T+off,mood:a.mood,talk:S.bub.some(b=>b.who===a.id)});
      if(a.shades){ c.save(); c.translate(P.head.x,P.head.y+1.2); c.rotate(P.head.a); c.scale(P.face*1.16,1.16); c.fillStyle='#101218'; c.fillRect(1.4,-0.6,4.8,2.3); c.fillRect(-0.6,-0.2,2.2,0.6); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(2,-0.3,1.2,0.6); c.restore(); } }]); }
  const M=sn.mon; if(M.show&&D.aplusMonster) draws.push([M.x,()=>{ const s=1.1, rise=M.rise!=null?M.rise:1; c.save(); c.translate(0,(1-rise)*120); if(M.trip){ c.translate(M.x,0); c.rotate(M.F*M.trip*1.25); c.translate(-M.x,0); } D.aplusMonster(c,M.x,-(M.hop||0),s,T,M.panic?'confused':(M.mood||'mean'),{dir:M.F,run:M.run&&!sn.freeze,talk:S.bub.some(b=>b.who==='aplus'),loom:M.loom||0}); c.restore();
    if(M.panic&&!sn.freeze){ c.fillStyle='rgba(111,176,255,.85)'; for(let k=0;k<2;k++){ const ph=(T*2+k*0.5)%1; c.beginPath(); c.ellipse(M.x-M.F*(10+ph*14),-118+ph*18,1.8,2.8,0,0,7); c.fill(); } } }]);
  draws.sort((a,b)=>a[0]-b[0]).forEach(d=>d[1]());
  if((sn.set==='curtain'||sn.set==='moon')&&sn.milo&&sn.milo.show){ cat(c,sn.milo.x,sn.milo.F,T,false,true); if(sn.milo.helmet){ c.strokeStyle='rgba(200,230,255,.8)'; c.lineWidth=0.9; c.fillStyle='rgba(200,230,255,.18)'; c.beginPath(); c.arc(sn.milo.x+sn.milo.F*2.5,-12.5,7,0,7); c.fill(); c.stroke(); } }
  if(S.papers&&sn.set==='office') for(const q of S.papers){ c.save(); c.translate(q.x,q.y); c.rotate(q.r); c.fillStyle='rgba(246,242,232,'+(1-q.a).toFixed(2)+')'; c.fillRect(-4,-5,8,10); c.fillStyle='rgba(120,130,150,'+(0.6*(1-q.a)).toFixed(2)+')'; for(let j=0;j<3;j++) c.fillRect(-3,-3+j*2.6,6,0.6); c.restore(); }
  if(sn.set==='office'){ c.fillStyle='#6a4a2a'; c.fillRect(680,-26,44,4); c.fillStyle='#4a3a2a'; c.fillRect(684,-22,3,22); c.fillRect(717,-22,3,22); }
  // ! marks when A+ roars
  for(const m of S.marks){ const a=sn.actors.find(z=>z.id===m.id); if(!a||!a.P) continue; c.fillStyle='#f2b544'; c.font='900 16px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('!',a.P.head.x,a.P.head.y-14-(0.9-m.t)*8); }
  for(const k of S.conf){ c.save(); c.translate(k.x,k.y); c.rotate(k.r); c.fillStyle=k.c; c.fillRect(-2,-1,4,2); c.restore(); }
  c.restore();
  if(sn.freeze){ c.fillStyle='rgba(20,26,40,.42)'; c.fillRect(0,0,W,Hh); const g=sn.actors.find(z=>z.id==='greg'); if(g){ c.save(); c.translate(ox,oy); c.scale(sc,sc); c.translate(-cam,0); g.P=pose(g.x,t,1,'walk',{}); PP.person(c,g.P,person('greg').look,{ground:()=>0,w:{},t:T,talk:S.bub.some(b=>b.who==='greg')}); c.restore(); }
    c.fillStyle='rgba(246,236,216,.8)'; c.font='700 '+Math.round(Math.min(18,W/26))+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.fillText('❚❚  PAUSED FOR GREG',W/2,Math.max(40,Hh*0.1)); }
  // bubbles, stacked so they never overlap
  c.font='700 '+Math.round(clamp(12*sc/2.2,11,17))+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const placed=[];
  for(const b of S.bub){ let x,y; if(b.who==='aplus'){ if(!sn.mon.show) continue; x=ox+(sn.mon.x-cam)*sc; y=oy-128*sc-(sn.mon.hop||0)*sc; } else if(b.who==='founder'){ if(!sn.founder) continue; x=ox+(sn.founder.x-cam)*sc; y=oy-70*sc; } else if(b.who==='caseaplus'){ if(!sn.caseX) continue; x=ox+(sn.caseX-cam)*sc; y=oy-125*sc; } else { const a=sn.actors.find(z=>z.id===b.who); if(!a||!a.P) continue; x=ox+(a.P.head.x-cam)*sc; y=oy+(a.P.head.y-20)*sc; }
    if(x<-20||x>W+20) continue; const tw=c.measureText(b.text).width+20; x=clamp(x,tw/2+8,W-tw/2-8); y=Math.max(y,40); for(let k=0;k<6&&placed.some(r=>Math.abs(r[0]-x)<(r[2]+tw)/2+4&&Math.abs(r[1]-y)<30);k++) y-=32; placed.push([x,y,tw]);
    const ap=b.who==='aplus'; c.fillStyle=ap?'rgba(6,14,8,.94)':'rgba(246,236,216,.97)'; rr(c,x-tw/2,y-14,tw,28,11); c.fill(); if(ap){ c.strokeStyle='#6fe08a'; c.lineWidth=1.5; c.stroke(); }
    c.fillStyle=ap?'#7fe0a0':'#243447'; c.fillText(b.text,x,y+0.5); }
  // starring
  if(S.cap&&BILL[S.cap.id]){ const [nm,tag]=BILL[S.cap.id], a=clamp(Math.min(S.cap.t/0.25,(3.2-S.cap.t)/0.35),0,1), x0=Math.max(14,W*0.04), y0=Hh-(V.touch?150:96), slide=(1-a)*-40;
    const nf=D.fitFont(c,nm,'700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',24,W*0.6), tf=D.fitFont(c,tag,'italic ','Georgia,serif',15,W*0.84);
    c.globalAlpha=a; c.textAlign='left'; c.font='italic '+tf+'px Georgia,serif'; const w=c.measureText(tag).width+30, ap=S.cap.id==='aplus';
    c.fillStyle=ap?'rgba(6,14,8,.92)':'rgba(16,26,46,.88)'; rr(c,x0+slide,y0,w,52,8); c.fill(); c.fillStyle=ap?'#6fe08a':'#f2b544'; c.fillRect(x0+slide,y0,5,52);
    c.fillStyle=ap?'#7fe0a0':'#f2b544'; c.font='700 '+nf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText((ap?'and ':'starring  ')+nm,x0+slide+16,y0+17); c.fillStyle='#f6ecd8'; c.font='italic '+tf+'px Georgia,serif'; c.fillText(tag,x0+slide+16,y0+38); c.globalAlpha=1; }
  // wipes between beats
  for(const k of [SEC.doors,SEC.time,SEC.turn,SEC.back,SEC.curtain]){ const u=(t-k+0.35)/0.7; if(u>0&&u<1){ const x=lerp(-W*0.2,W*1.2,u); c.fillStyle='#0b1220'; c.beginPath(); c.moveTo(x-W*0.6,0); c.lineTo(x+60,0); c.lineTo(x-60,Hh); c.lineTo(x-W*0.6-120,Hh); c.fill(); } }
  if(sn.lyric!=null){ const L=['♪  Six signatures before midnight  ♪','♪  Nine DCs and one old machine  ♪','♪  Show up for the people who count on you  ♪','♪  ...and LOCK YOUR SCREEN!  ♪'], k=Math.min(3,Math.floor(sn.lyric/1.5)), u=(sn.lyric-k*1.5)/1.5, line=L[k];
    const tf=D.fitFont(c,line,'700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',Math.min(24,W/22),W*0.86), y=Hh*(W<Hh?0.18:0.26); c.textAlign='center'; c.textBaseline='middle'; c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif';
    const tw=c.measureText(line).width; c.fillStyle='rgba(11,18,32,.7)'; rr(c,W/2-tw/2-16,y-tf*0.8,tw+32,tf*1.6,10); c.fill(); c.fillStyle='rgba(246,236,216,.55)'; c.fillText(line,W/2,y);
    c.save(); c.beginPath(); c.rect(W/2-tw/2,y-tf,tw*clamp(u*1.15,0,1),tf*2); c.clip(); c.fillStyle=k===3?'#e0563a':'#f2b544'; c.fillText(line,W/2,y); c.restore(); }
  if(sn.era){ const e=sn.era, T=t-e.t0, a=clamp(Math.min(T/0.4,(e.len-T)/0.4),0,1), tf=D.fitFont(c,e.title,'700 ','"IBM Plex Mono",monospace',Math.min(22,W/26),W*0.8);
    c.globalAlpha=a; c.textAlign='center'; c.textBaseline='middle'; c.font='700 '+tf+'px "IBM Plex Mono",monospace'; const tw=c.measureText(e.title).width+28; c.fillStyle='rgba(11,18,32,.75)'; rr(c,W/2-tw/2,Math.max(14,Hh*0.04),tw,tf+16,6); c.fill(); c.fillStyle='#f2b544'; c.fillText(e.title,W/2,Math.max(14,Hh*0.04)+tf/2+8); c.globalAlpha=1; }
  if(sn.set==='curtain'&&t>SEC.curtain+3.4){ const a=clamp((t-SEC.curtain-3.4)/0.8,0,1), tf=D.fitFont(c,'HECKTOWN ROAD','700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',Math.min(56,Hh/7),W*0.84);
    c.globalAlpha=a; c.textAlign='center'; c.fillStyle='#f6ecd8'; c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText('HECKTOWN ROAD',W/2,Hh*0.1); c.fillStyle='#7fe0a0'; c.font='700 '+Math.round(tf*0.36)+'px "IBM Plex Mono",monospace'; c.fillText('> CUTOVER NIGHT_',W/2,Hh*0.1+tf*0.78); c.globalAlpha=1; }
  c.textAlign='center'; c.fillStyle='rgba(246,236,216,.55)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to play':'press any key to play',W/2,Hh-22); }

function tick(dt){ S.t+=dt; const t=S.t; S.scn=scene(t); events(t,dt); music(dt); S.shake=Math.max(0,S.shake-dt*1.6);
  for(const m of S.marks) m.t-=dt; S.marks=S.marks.filter(m=>m.t>0); for(const b of S.bub) b.t-=dt; S.bub=S.bub.filter(b=>b.t>0);
  const sn=S.scn; if(!sn.freeze){ S.dustT=(S.dustT||0)+dt; if(S.dustT>0.07){ S.dustT=0; for(const a of sn.actors) if(a.kind==='run'||a.kind==='scramble') S.dust.push({x:a.x-a.F*6,y:-1.5,a:0}); if(sn.mon.show&&sn.mon.run) S.dust.push({x:sn.mon.x-sn.mon.F*10,y:-2,a:0}); } }
  if(sn.set==='doors'){ for(let k=0;k<4;k++){ const want=sn.doorsOpen[k]?1:0, a=S.doorA[k]; if(want>a){ S.doorA[k]=Math.min(1,a+dt*9); S.doorV[k]=0; }
      else if(a>0){ S.doorV[k]+=dt*22; S.doorA[k]=Math.max(0,a-S.doorV[k]*dt); if(S.doorA[k]===0){ const v=S.doorV[k]; S.doorV[k]=0; if(v>2.5){ S.slams.push({k:k,t:0}); S.shake=Math.max(S.shake,0.25); burst(160,0.8,0.07,0.12); burst(2600,1.2,0.02,0.05); for(let j=0;j<5;j++) S.dust.push({x:sn.DX[k]-18+j*9,y:-1.5,a:0}); } } } } }
  for(const sl of S.slams) sl.t+=dt; S.slams=S.slams.filter(sl=>sl.t<0.7);
  for(const d of S.dust) d.a+=dt*2.2; S.dust=S.dust.filter(d=>d.a<1).slice(-160);
  for(const k of S.conf){ k.x+=k.vx*dt; k.y+=k.vy*dt; k.r+=dt*6; }
  if(sn.set==='office'&&!sn.freeze&&!S.sting.papers&&sn.actors.some(a=>Math.abs(a.x-700)<20&&a.kind==='run')){ S.sting.papers=1; S.papers=[]; for(let i=0;i<24;i++) S.papers.push({x:700+(Math.random()-0.5)*20,y:-30,vx:40+Math.random()*120,vy:-60-Math.random()*90,r:Math.random()*6,a:0}); burst(3000,0.6,0.03,0.3); }
  if(S.papers){ for(const q of S.papers){ q.vy+=120*dt; q.vx*=0.985; q.x+=q.vx*dt; q.y=Math.min(-1,q.y+q.vy*dt); q.r+=dt*(q.y<-2?5:0); q.a+=dt*0.25; } S.papers=S.papers.filter(q=>q.a<1); }
  if(sn.set!=='montage'&&t>=SEC.office){ const target=sn.cam||0; S.camX=sn.set==='office'&&!sn.freeze?S.camX+(target-S.camX)*(1-Math.exp(-6*dt)):target; if(sn.era){ S.camX+=(target-S.camX)*(1-Math.exp(-5*dt)); } if(Math.abs(S.camX-target)>600) S.camX=target; }
  if(t>=LEN) stop(); }

/* ---------------- start, stop, attract ---------------- */
const demoLight=()=>({dir:-1,k:0.55,col:'255,240,215',rim:0.3});
function start(){ S=build(); S.scn=scene(0); S.camX=260; H.setState('demo'); document.body.classList.add('cine'); $('title').classList.add('hide'); if(H.wake) H.wake(); if(PP.getLight){ prevLight=PP.getLight(); PP.setLight(demoLight); } }
function stop(){ S=null; document.body.classList.remove('cine'); H.setState('title'); $('title').classList.remove('hide'); idle=0; if(prevLight){ PP.setLight(prevLight); prevLight=null; } }
EXT.after.push((c,V,G,state,dt,now)=>{ if(state==='demo'&&S){ tick(Math.min(dt,0.05)); if(S) draw(c,V,now); } else if(state==='title'){ idle+=dt; if(idle>16) start(); } else idle=0; });
EXT.keys.unshift((e,state)=>{ if(state==='demo'){ stop(); return true; } if(state==='title') idle=0; return false; });
$('c').addEventListener('pointerdown',()=>{ if(H.state==='demo') stop(); idle=0; });
if(!$('bDemo')){ const st=document.createElement('style'); st.textContent='#bDemo{background:#7fe0a0;color:#06140a;border:0;border-radius:8px;padding:12px 20px;font-weight:700;font-size:16px;display:inline-flex;align-items:center;gap:10px;animation:demoPulse 2.2s ease-out infinite;} #bDemo .dur{font:500 12px "IBM Plex Mono",monospace;opacity:.7;} #bDemo .tri{width:0;height:0;border-left:11px solid #06140a;border-top:7px solid transparent;border-bottom:7px solid transparent;} @keyframes demoPulse{0%{box-shadow:0 0 0 0 rgba(127,224,160,.55);}70%{box-shadow:0 0 0 14px rgba(127,224,160,0);}100%{box-shadow:0 0 0 0 rgba(127,224,160,0);}} #demoNote{margin-top:10px;font:italic 14px Georgia,serif;color:#cfe8d6;opacity:.85;}';
  document.head.appendChild(st); const btn=document.createElement('button'); btn.id='bDemo'; btn.innerHTML='<span class="tri"></span>Watch the demo <span class="dur">1:27</span>'; btn.onclick=()=>start(); const bs=document.querySelector('#title .btns'); if(bs){ bs.insertBefore(btn,bs.firstChild); const n=document.createElement('div'); n.id='demoNote'; n.textContent='A musical cartoon chase: A+ vs. the whole IT department, through 1938, 2060 and the moon.'; bs.parentNode.insertBefore(n,bs.nextSibling); } }
H.demo={start:start,stop:stop,scene:scene,pose:pose,SEC:SEC,LEN:LEN,state:()=>S};
})();
