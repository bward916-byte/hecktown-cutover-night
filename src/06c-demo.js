/* ==== DEMO: the attract reel on the title screen. A musical, cartoon chase: A+ the green-screen monster chases the
   cast across the office, loses them, then gets chased right back. Rianan stops for the cat, Brian S stops for pinball,
   Bret shouts about passwords, Greg strolls through it all. Ends on a curtain call. Any key or tap goes back to the title. ==== */
(function(){
'use strict';
const H=window.__hecktown, EXT=H.EXT, GM=HGAME, PP=HPEOPLE, D=HDRAW, E=WalkEngine, B=window.HBODY;
const $=id=>document.getElementById(id), clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const LEN=46, CAST=['rianan','brians','bret','dave','aaron','umesh','fares','ash'];
let S=null, idle=0;

function person(id){ return GM.PEOPLE.find(p=>p.id===id); }
function build(){
  const world=E.makeWorld(E.surfaces(-500,0,[['flat',1800]]));
  const actors=CAST.map((id,i)=>{ const p=person(id), w=E.createWalker(world,-60-i*34); w.gait=B?B.gaitFor(p.look):undefined; return {id:id,p:p,w:w,pose:E.poseOf(w),inp:0,hold:0,said:{}}; });
  const greg=person('greg'), gw=E.createWalker(world,-90); gw.gait=B?B.gaitFor(greg.look):undefined;
  return {t:0,world:world,actors:actors,greg:{p:greg,w:gw,pose:E.poseOf(gw)},mon:{x:-330,dir:1,run:false,mood:'mean'},milo:{x:250,run:0},bub:[],note:0,beat:0,conf:[],sting:{}}; }
const say=(who,text,dur)=>{ S.bub=S.bub.filter(b=>b.who!==who); S.bub.push({who:who,text:text,t:dur||1.8}); };

/* ---------------- music: a bouncy two-bar chase in C, faster and higher on the way back ---------------- */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const BASS=[36,36,43,43,45,45,43,43,41,41,36,36,43,43,36,36], MEL=[72,76,79,76,74,72,71,72,77,76,74,72,71,74,79,0];
function music(dt){ if(!H.audio) return; const A=H.audio, ph=phase(); if(!A.ctx()) return;
  if(ph==='chase'||ph==='back'){ const bpm=ph==='back'?210:176, step=60/bpm/2; S.beat+=dt; while(S.beat>=step){ S.beat-=step; const i=S.note%16, up=ph==='back'?5:0;
      A.tone(NOTE(BASS[i]+up),step*0.8,0.05,'triangle'); if(MEL[i]) A.tone(NOTE(MEL[i]+up),step*0.6,0.025,'square'); if(i%4===0) A.burst(120,0.7,0.05,0.05); if(i%4===2) A.burst(3000,1.4,0.02,0.03); S.note++; } }
  if(ph==='finale'&&!S.sting.fin){ S.sting.fin=1; [60,64,67,72].forEach((n,k)=>A.tone(NOTE(n),1.4,0.035,'triangle',null,k*0.09)); }
  if(ph==='scratch'&&!S.sting.scr){ S.sting.scr=1; A.tone(900,0.35,0.05,'sawtooth',120); A.burst(800,0.6,0.05,0.3,200); }
  if(ph==='intro'&&!S.sting.intro){ S.sting.intro=1; [48,55,60].forEach((n,k)=>A.tone(NOTE(n),0.5,0.04,'triangle',null,k*0.18)); } }
function phase(){ const t=S.t; return t<3.5?'intro':(t<16?'chase':(t<18.5?'scratch':(t<30?'back':(t<33?'greg':(t<37?'montage':'finale'))))); }

/* ---------------- the script ---------------- */
function tick(dt){ S.t+=dt; const t=S.t, ph=phase(), M=S.mon, W=S.world;
  for(const a of S.actors){ let inp=0;
    if(ph==='chase'){ inp=1;
      if(a.id==='rianan'&&Math.abs(a.w.x-S.milo.x)<18&&!a.said.cat){ a.said.cat=1; a.hold=1.6; say('rianan','KITTY! ♥',1.6); }
      if(a.id==='brians'&&Math.abs(a.w.x-430)<10&&!a.said.pin){ a.said.pin=1; a.hold=1.8; say('brians','MULTIBALL!',1.1); setTimeout(()=>S&&say('brians','...TILT!',1),1100); if(H.audio) H.audio.sfx('pinball'); }
      if(a.id==='bret'&&a.w.x>200&&!a.said.pw){ a.said.pw=1; say('bret','DID YOU ROTATE YOUR PASSWORD?!',2); }
      if(a.id==='dave'&&a.w.x>320&&!a.said.q){ a.said.q=1; say('dave','WHAT IS... RUNNING?!',1.8); }
      if(a.id==='fares'&&a.w.x>120&&!a.said.e){ a.said.e=1; say('fares','UMESH! YOUR 850s!',1.6); }
      if(a.id==='aaron'&&a.w.x>260&&!a.said.j){ a.said.j=1; E.command(a.w,W,'jump'); say('aaron','PICK YOUR LINE!',1.4); }
      if(a.hold>0){ a.hold-=dt; if(M.x>a.w.x-70) a.hold=0; else inp=0; } }
    if(ph==='back'&&t>18.8+CAST.indexOf(a.id)*0.12) inp=-1;
    if(ph==='finale'){ const spot=110+CAST.indexOf(a.id)*52+(CAST.indexOf(a.id)>=4?70:0), d=spot-a.w.x; inp=Math.abs(d)>5?Math.sign(d)*Math.min(1,Math.abs(d)/40):0; if(!inp&&a.w.facing!==1&&Math.random()<0.02) inp=0.09;
      if(t>40&&Math.floor(t*2)!==Math.floor((t-dt)*2)&&(Math.floor(t*2)+CAST.indexOf(a.id))%2===0) E.command(a.w,W,'jump'); }
    if(ph==='back'&&a.id==='bret'&&!a.said.fw&&t>19.4){ a.said.fw=1; say('bret','FIREWALL!',1.6); }
    if(ph==='back'&&a.id==='rianan'&&!a.said.b&&t>20.2){ a.said.b=1; say('rianan','GET IT!',1.2); }
    a.pose=E.updateWalker(a.w,W,inp,dt); a.w.events.length=0; }
  // A+: chases, stops, gets chased
  if(ph==='chase'){ M.dir=1; M.run=t>4.2; if(M.run) M.x+=84*dt; if(!S.sting.roar&&t>4.4){ S.sting.roar=1; if(H.audio) H.audio.sfx('roar'); S.bub.push({who:'aplus',text:'RRRAAAH!',t:1.4}); } }
  else if(ph==='scratch'){ M.run=false; M.x=Math.min(M.x+30*dt,420); if(!S.sting.q){ S.sting.q=1; S.bub.push({who:'aplus',text:'...?',t:1.4}); } if(t>17.4&&!S.sting.eep){ S.sting.eep=1; S.bub.push({who:'aplus',text:'EEP!',t:1.2}); } }
  else if(ph==='back'){ M.dir=-1; M.run=t>18.7; if(M.run) M.x-=112*dt; }
  else if(ph==='finale'){ M.dir=1; M.run=false; M.x+=(360-M.x)*(1-Math.exp(-3*dt)); if(t>40&&!S.sting.conf){ S.sting.conf=1; for(let i=0;i<90;i++) S.conf.push({x:Math.random()*720,y:-40-Math.random()*200,vx:(Math.random()-0.5)*40,vy:40+Math.random()*60,c:['#f2b544','#6fe08a','#e0563a','#6fb0ff','#f6ecd8'][i%5],r:Math.random()*6}); } }
  if(ph==='montage'&&!S.sting.mon){ S.sting.mon=1; M.x=-400; for(const a of S.actors){ a.w=E.createWalker(W,a.id==='rianan'?-80:(CAST.indexOf(a.id)<4?-40-CAST.indexOf(a.id)*40:640+(CAST.indexOf(a.id)-4)*34)); if(B) a.w.gait=B.gaitFor(a.p.look); } }
  if(ph==='finale'&&M.x<-100) M.x=-60;
  // the cat bolts when A+ comes by
  if(M.x>S.milo.x-60&&ph==='chase') S.milo.run=1; if(S.milo.run) S.milo.x+=150*dt;
  // Greg never hurries
  const g=S.greg; let gi=0; if(t>9&&t<33) gi=0.32; if(t>9.2&&!S.sting.g1){ S.sting.g1=1; say('greg','Fiscal.',2); } if(ph==='greg'&&!S.sting.g2){ S.sting.g2=1; say('greg','...Counting.',2); } g.pose=E.updateWalker(g.w,W,gi,dt); g.w.events.length=0;
  for(const b of S.bub) b.t-=dt; S.bub=S.bub.filter(b=>b.t>0);
  for(const k of S.conf){ k.x+=k.vx*dt; k.y+=k.vy*dt; k.r+=dt*6; }
  music(dt); if(t>=LEN) stop(); }

/* ---------------- drawing ---------------- */
function draw(c,V,now){ const W=V.W, Hh=V.H, t=S.t, ph=phase(), sc=Math.min(W/560,Hh/290)*0.95, ox=W/2-320*sc, oy=Hh*0.68;
  c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(ph==='intro'){ c.fillStyle='#0b1220'; c.fillRect(0,0,W,Hh); const txt='PHILLIPS IT PRESENTS', n=Math.floor(clamp(t/1.8,0,1)*txt.length); c.fillStyle='#7fe0a0'; c.font='700 '+Math.min(22,W/22)+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt.slice(0,n)+(Math.floor(t*3)%2?'▮':' '),W/2,Hh*0.45);
    if(t>2.2){ c.globalAlpha=clamp((t-2.2)/0.6,0,1); c.fillStyle='#f6ecd8'; c.font='italic '+Math.min(18,W/26)+'px Georgia,serif'; c.fillText('a cutover in one act, with music',W/2,Hh*0.45+40); c.globalAlpha=1; } return; }
  if(ph==='montage'){ const k={title:'THE GAME',sub:'no bosses · one very old system',t:t-33,dur:4.6,style:'comic',panels:[{i:'1938',c:'It starts with oats'},{i:'✍',c:'Six signatures'},{i:'🚚',c:'Nine DCs'}]}; D.drawCardStyle(c,V,{},k); return; }
  // the office corridor
  const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#3d4a5c'); g.addColorStop(1,'#26303e'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
  c.save(); c.translate(ox,oy); c.scale(sc,sc);
  for(let x=-120;x<780;x+=120){ c.fillStyle='#2f3a4a'; c.fillRect(x+20,-120,70,70); c.fillStyle='rgba(255,236,190,.14)'; c.fillRect(x+24,-116,62,62); c.fillStyle='#1d2430'; c.fillRect(x+54,-116,2,62);
    c.fillStyle='#f6ecd8'; c.fillRect(x+40,-190,40,3); const lg=c.createLinearGradient(0,-187,0,0); lg.addColorStop(0,'rgba(255,240,200,.14)'); lg.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(x+40,-187); c.lineTo(x+80,-187); c.lineTo(x+110,0); c.lineTo(x+10,0); c.fill(); }
  c.fillStyle='#1d2430'; c.fillRect(-400,0,1500,200); c.fillStyle='#4a5566'; c.fillRect(-400,0,1500,3);
  if(ph!=='finale'){ c.fillStyle='#243447'; c.fillRect(220,-160,200,22); c.fillStyle='#f2b544'; c.font='700 12px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('HECKTOWN ROAD',320,-149); }
  if(D.PROPS.pinball) D.PROPS.pinball(430,0,now,c);
  const gy=()=>0, T=now/1000;
  if(S.milo.x<800){ const mx=S.milo.x; c.save(); c.translate(mx,0); c.fillStyle='#d9822b'; c.strokeStyle='#151a22'; c.lineWidth=0.8; c.beginPath(); c.ellipse(0,-6,7,3.6,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(7,-9,3.3,0,7); c.fill(); c.stroke(); c.restore(); }
  PP.person(c,S.greg.pose,S.greg.p.look,{ground:gy,w:S.greg.w,t:T});
  for(const a of S.actors) PP.person(c,a.pose,a.p.look,{ground:gy,w:a.w,t:T,mood:ph==='chase'||ph==='scratch'?'surprise':(ph==='finale'?'happy':null),talk:S.bub.some(b=>b.who===a.id)});
  if(D.aplusMonster&&S.mon.x>-200) D.aplusMonster(c,S.mon.x,0,1.15,T,ph==='back'?'confused':(ph==='finale'?'smug':'mean'),{dir:S.mon.dir,run:S.mon.run,talk:S.bub.some(b=>b.who==='aplus')});
  for(const k of S.conf){ c.save(); c.translate(k.x-40,k.y-220); c.rotate(k.r); c.fillStyle=k.c; c.fillRect(-2,-1,4,2); c.restore(); }
  c.restore();
  // bubbles, in screen space
  c.font='700 '+Math.round(Math.max(11,12*sc))+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle';
  for(const b of S.bub){ let x,y; if(b.who==='aplus'){ x=ox+S.mon.x*sc; y=oy-100*sc; } else if(b.who==='greg'){ x=ox+S.greg.pose.head.x*sc; y=oy+(S.greg.pose.head.y-22)*sc; } else { const a=S.actors.find(z=>z.id===b.who); if(!a) continue; x=ox+a.pose.head.x*sc; y=oy+(a.pose.head.y-22)*sc; }
    x=clamp(x,80,W-80); const tw=c.measureText(b.text).width+18; c.fillStyle=b.who==='aplus'?'rgba(6,14,8,.92)':'rgba(246,236,216,.96)'; rr(c,x-tw/2,y-13,tw,26,10); c.fill(); if(b.who==='aplus'){ c.strokeStyle='#6fe08a'; c.lineWidth=1.5; c.stroke(); }
    c.fillStyle=b.who==='aplus'?'#7fe0a0':'#243447'; c.fillText(b.text,x,y+0.5); }
  if(ph==='finale'){ const a=clamp((t-38)/1,0,1); c.globalAlpha=a; const tf=D.fitFont(c,'HECKTOWN ROAD','700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',Math.min(54,Hh/7),W*0.84);
    c.fillStyle='#f6ecd8'; c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText('HECKTOWN ROAD',W/2,Hh*0.14); c.fillStyle='#7fe0a0'; c.font='700 '+Math.round(tf*0.36)+'px "IBM Plex Mono",monospace'; c.fillText('> CUTOVER NIGHT_',W/2,Hh*0.14+tf*0.75); c.globalAlpha=1; }
  c.fillStyle='rgba(246,236,216,.5)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to play':'press any key to play',W/2,Hh-24); }

/* ---------------- start, stop, attract ---------------- */
function start(){ S=build(); H.setState('demo'); document.body.classList.add('cine'); $('title').classList.add('hide'); if(H.wake) H.wake(); }
function stop(){ S=null; document.body.classList.remove('cine'); H.setState('title'); $('title').classList.remove('hide'); idle=0; }
EXT.after.push((c,V,G,state,dt,now)=>{ if(state==='demo'&&S){ tick(Math.min(dt,0.05)); if(S) draw(c,V,now); } else if(state==='title'){ idle+=dt; if(idle>28) start(); } else idle=0; });
EXT.keys.unshift((e,state)=>{ if(state==='demo'){ stop(); return true; } if(state==='title') idle=0; return false; });
$('c').addEventListener('pointerdown',()=>{ if(H.state==='demo') stop(); idle=0; });
const btn=document.createElement('button'); btn.className='btn ghost'; btn.id='bDemo'; btn.textContent='Watch the demo'; btn.onclick=()=>start(); const bs=document.querySelector('#title .btns'); if(bs) bs.appendChild(btn);
H.demo={start:start,stop:stop,get S(){ return S; }};
})();
