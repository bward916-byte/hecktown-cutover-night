/* ==== CHAPTER 6: the Offsite. Aaron's whitewater team-building day on the Lehigh: one raft, the crew aboard, three rapids
   (Class II, III, IV) with calm pools between, and a cooler that turns out to have A+ in it. Steer up and down for your line,
   paddle forward or back for speed, take the green waves, miss the rocks. Three bumps in one rapid flips the raft. DOM-free;
   the river is drawn in the same file when HDRAW is around. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
GM.CHAPTERS.push({id:'raft',num:6,title:'The Offsite',blurb:'Aaron\'s whitewater team-building day. One raft, the whole crew, three rapids, and a cooler that is heavier than a cooler should be.',goal:'Run all three rapids without flipping. Find out what is in the cooler.'});
const RX=70000, LEN=3700; { const world=E.makeWorld(E.surfaces(RX,0,[['flat',LEN]])); const n={id:'river',label:'The Lehigh River',layer:'front',world:world,river:true,x0:RX}; world.node=n; MAP.nodes.river=n; }
const SECS=[{id:0,name:'Put-in',x0:0,x1:600,cls:''},{id:1,name:'Class II  ·  Warm-up',x0:600,x1:1150,cls:'II'},{id:2,name:'Eddy',x0:1150,x1:1500,cls:''},{id:3,name:'Class III  ·  The Chute',x0:1500,x1:2250,cls:'III'},{id:4,name:'Eddy',x0:2250,x1:2600,cls:''},{id:5,name:'Class IV  ·  The Server Room',x0:2600,x1:3450,cls:'IV'},{id:6,name:'Take-out',x0:3450,x1:LEN,cls:''}];
const CREW=['aaron','rianan','bret','dave'];
function rnd(k){ const v=Math.sin(k*12.9898+78.233)*43758.5453; return v-Math.floor(v); }
/* rocks and waves per rapid, laid out so there is always a line: the clear lane wanders, rocks fill the rest */
const ROCKS=[], WAVES=[]; (function(){ let seed=3; for(const s of SECS){ if(!s.cls) continue; const gap=s.cls==='II'?150:(s.cls==='III'?110:85); let lane=0;
  for(let x=s.x0+80;x<s.x1-40;x+=gap){ lane=Math.max(-0.85,Math.min(0.85,lane+(rnd(seed++)-0.5)*1.1)); const n=s.cls==='II'?1:(s.cls==='III'?2:2);
    const cands=[-0.8,-0.4,0,0.4,0.8].filter(l=>Math.abs(l-lane)>0.45); for(let k=0;k<n&&cands.length;k++){ const i=Math.floor(rnd(seed++)*cands.length); ROCKS.push({x:x,lane:cands.splice(i,1)[0],r:0.22+rnd(seed++)*0.1}); }
    if(rnd(seed++)<0.7) WAVES.push({x:x+gap*0.5,lane:lane,got:false}); } } })();
const APLUS={name:'A+',role:'in the cooler',look:null};
function R(S){ return S.raft||(S.raft={sec:0,flips:0,waves:0,best:0}); }
const baseFresh=GM.freshSave;
GM.freshSave=function(id){ const s=baseFresh(id); if(s.chapter==='raft'){ s.flags.p38=5; s.pos={node:'river',x:RX+40}; Object.assign(s.flags,{started:1,ch1:1,vig_hero:1,ch3:1,ch4:1,reveal:1,ap_so6:1,ap_badge:1,rfcAsked:1}); s.raft={sec:0,flips:0,waves:0,best:0}; } return s; };
function secAt(x){ return SECS.find(s=>x>=s.x0&&x<s.x1)||SECS[SECS.length-1]; }
function startRaft(G,x){ const S=G.S; G.raft={x:x,lane:0,v:70,stun:0,bumps:0,t:0,paddle:0,steer:0,rock:0,msg:'',msgT:0,wake:[]}; }
function who(G,id){ const q=G.npcs.find(z=>z.def.id===id); return q?{name:q.def.name,role:q.def.role,look:q.def.look}:{name:id,role:'',look:null}; }
function msg(G,text,t){ G.raft.msg=text; G.raft.msgT=t||1.6; }
function intro(G){ const S=G.S; S.flags.raftIntro=1;
  G.cine.push({card:'THE OFFSITE',sub:'Lehigh River  ·  team-building day  ·  Aaron\'s idea',dur:5,style:'comic',panels:[{i:'🚣',c:'One raft, the whole crew'},{i:'⚠',c:'Three rapids'},{i:'🧊',c:'One very heavy cooler'}]},
    GM.dlg(who(G,'aaron'),['Aaron: "Rule one: pick your line early. Rule two: commit. Rule three: keep the cooler in the boat, I don\'t know why it\'s that heavy and I don\'t want to know."','Aaron: "Up and down steers. Forward paddles, back brakes. Green water is good water. Rocks are not."']),
    GM.dlg(who(G,'bret'),['Bret: "Is the cooler locked? It should be locked. Everything should be locked."']),
    GM.dlg(who(G,'rianan'),['Rianan: "If there\'s a cat on the bank I am getting out."']),{fn:G=>G.events.push({type:'save'})}); }
function tick(G,ix,iy,dt){ const S=G.S, r=G.raft, st=R(S); r.t+=dt; if(r.msgT>0) r.msgT-=dt; if(r.stun>0) r.stun-=dt;
  const sec=secAt(r.x), rapid=!!sec.cls, cur=rapid?(sec.cls==='II'?95:(sec.cls==='III'?115:135)):60;
  r.paddle+=((r.stun>0?0:ix)-r.paddle)*(1-Math.exp(-6*dt)); r.steer+=((r.stun>0?0:-iy)-r.steer)*(1-Math.exp(-8*dt));
  r.v+=((cur+r.paddle*45)-r.v)*(1-Math.exp(-2*dt)); r.x+=r.v*dt; r.lane=Math.max(-1,Math.min(1,r.lane+r.steer*1.25*dt+(rapid?Math.sin(r.t*3.1)*0.04*dt*10:0)));
  for(const w of WAVES){ if(!w.got&&Math.abs(w.x-r.x)<14&&Math.abs(w.lane-r.lane)<0.32){ w.got=true; st.waves++; S.points+=GM.PTS_RAFT; G.events.push({type:'banner',text:'Green water',pts:GM.PTS_RAFT}); G.events.push({type:'sfx',name:'good'}); msg(G,['WHOO!','PICK YOUR LINE!','THAT\'S THE LINE!','CLASS IV BABY!'][st.waves%4],1.2); r.v+=25; } }
  if(r.stun<=0) for(const k of ROCKS){ if(Math.abs(k.x-r.x)<16&&Math.abs(k.lane-r.lane)<k.r+0.14){ r.bumps++; r.stun=0.7; r.v*=0.35; r.lane+=r.lane>k.lane?0.3:-0.3; r.rock=1; G.events.push({type:'sfx',name:'thud'}); G.events.push({type:'sfx',name:'deny'});
      if(r.bumps>=3){ st.flips++; msg(G,'FLIPPED. Everybody in? ...Again.',2.5); G.events.push({type:'sfx',name:'roar'}); r.x=sec.x0-60; r.lane=0; r.v=40; r.bumps=0; r.stun=1.2; G.events.push({type:'save'}); }
      else msg(G,['ROCK!','BRACE!','I SAID PICK A LINE!'][r.bumps-1],1.4); break; } }
  if(!rapid&&sec.id!==st.sec){ st.sec=sec.id; r.bumps=0; G.events.push({type:'save'}); if(sec.id===2) G.cine.push(GM.dlg(who(G,'dave'),['Dave: "The cooler just said something."']),GM.dlg(APLUS,['NO IT DID NOT.'])); if(sec.id===4) G.cine.push(GM.dlg(who(G,'bret'),['Bret: "The cooler is warm. Coolers are not supposed to be warm. Sixty-eight degrees, exactly."']),GM.dlg(who(G,'aaron'),['Aaron: "Last one\'s a Class IV. The Server Room. Pick your line early."'])); }
  if(r.x>=LEN-120&&!S.done) takeOut(G); }
function takeOut(G){ const S=G.S, st=R(S); S.done=true; S.points+=GM.PTS_RAFT*6; G.raft.v=0; G.raft.stun=99;
  G.cine.push({card:'TAKE-OUT',sub:'everybody in the boat  ·  '+st.flips+' flip'+(st.flips===1?'':'s')+'  ·  '+st.waves+' green waves',dur:4},
    GM.dlg(who(G,'aaron'),['Aaron: "Three rapids, one boat, all of you. That\'s a team. Now about the cooler."']),GM.dlg(who(G,'bret'),['Bret: "I\'m opening it. I have a bad feeling and a badge."']),
    GM.dlg(APLUS,['I WAS IN THE COOLER.','IT WAS SIXTY-EIGHT DEGREES. I MADE IT SIXTY-EIGHT DEGREES.','I HAVE NEVER LEFT THE BUILDING. I WANTED TO SEE THE RIVER. I SAW THE RIVER. IT IS WET.','...CLASS IV. NOT BAD.']),
    GM.dlg(who(G,'rianan'),['Rianan: "It came to the offsite. Nobody invited it and it came. That is the most team-building thing that has ever happened here."']),
    {fn:G=>{ G.events.push({type:'banner',text:'The offsite',pts:GM.PTS_RAFT*6}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); G.events.push({type:'ending'}); }}); }

const base={update:GM.update,create:GM.create,objective:GM.objective,clock:GM.clock,interact:GM.interact,command:GM.command};
GM.create=function(save){ const G=base.create(save); const S=G.S; if(GM.chapterOf(S)==='raft'){ const n=MAP.nodes.river, st=R(S), x=SECS[st.sec].x0+40; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,RX+x); G.pose=E.poseOf(G.hero); S.pos={node:'river',x:RX+x}; startRaft(G,x); if(!S.flags.raftIntro) intro(G); } return G; };
GM.update=function(G,ix,iy,dt){ const S=G.S; if(GM.chapterOf(S)!=='raft'||!G.raft){ base.update(G,ix,iy,dt); return; }
  S.time+=dt; const busy=G.dialog||G.card||(G.cine&&G.cine.length); if(!busy&&!S.done) tick(G,ix,iy,dt); else if(G.raft.msgT>0) G.raft.msgT-=dt;
  G.hero.x=RX+G.raft.x; S.pos.x=G.hero.x; G.target=null; if(GM.STORY&&GM.STORY.st){ const s=GM.STORY.st(G); s.bub=[]; }
  // the cutscene runner lives in the prologue module's update; run it by hand here
  if(GM.runCine) GM.runCine(G,dt); };
GM.interact=function(G){ if(G.raft&&!G.dialog&&!G.card&&G.S.done){ return; } base.interact(G); };
GM.command=function(G,name){ if(G.raft) return false; return base.command(G,name); };
GM.objective=function(S){ if(GM.chapterOf(S)!=='raft') return base.objective(S); const st=R(S); if(S.done) return 'Take-out. Three rapids, one boat, and A+ in the cooler. '+st.flips+' flips, '+st.waves+' green waves.';
  const s=SECS[st.sec]; return (s.cls?'Run '+s.name+'. Up/down steers, forward paddles, back brakes. Green water good, rocks bad. Three bumps flips the raft.':'Calm water ('+s.name+'). Next: '+SECS[st.sec+1].name+'.'); };
GM.clock=function(S){ return GM.chapterOf(S)==='raft'?'Saturday':base.clock(S); };
GM.PTS_RAFT=10; GM.RAFT={R:R,SECS:SECS,ROCKS:ROCKS,WAVES:WAVES,LEN:LEN,RX:RX};
GM.chapterEnding=(function(prev){ return function(S){ if(GM.chapterOf(S)==='raft'){ const st=R(S); return {title:'The offsite',sub:'Lehigh River  ·  '+st.flips+' flip'+(st.flips===1?'':'s')+'  ·  '+st.waves+' green waves  ·  Saturday',body:'Three rapids, one boat, everybody in. The cooler was A+. It had never left the building. It says the river is wet and Class IV is not bad. Aaron is already booking next year.'}; } return prev?prev(S):null; }; })(GM.chapterEnding);

/* ---------------- the river, drawn ---------------- */
if(root.HDRAW){ const D=root.HDRAW, PP=root.HPEOPLE, INK=PP.INK, C=E.CFG, clamp=(v,a,b)=>v<a?a:(v>b?b:v);
  const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
  function seated(x,y,F,t,arm){ const TH=C.thigh, SH=C.shin, TOR=C.torso, UA=C.upperArm, FA=C.foreArm, lean=0.12+arm*0.25;
    const hip={x:x,y:y}, dx=Math.sin(lean)*F, dy=-Math.cos(lean), neck={x:x+dx*TOR,y:y+dy*TOR}, sh={x:x+dx*(TOR-2.6),y:y+dy*(TOR-2.6)}, head={x:neck.x+dx*(C.neck+C.headR*0.95),y:neck.y+dy*(C.neck+C.headR*0.95),a:F*lean*0.4+Math.sin(t*2)*0.03};
    const legs=[0,1].map(i=>{ const th=1.35+(i?0.1:-0.1), k=1.6; const kx=x+Math.sin(th)*F*TH, ky=y+Math.cos(th)*TH, ax=kx+Math.sin(th-k)*F*SH, ay=ky+Math.cos(th-k)*SH; return {kx:kx,ky:ky,ax:ax,ay:ay,pitch:0.6,face:F}; });
    const arms=[0,1].map(i=>{ const a=0.9+arm*0.9-i*0.2+Math.sin(t*6)*0.05*Math.abs(arm), b=a+1.2; const ex=sh.x+Math.sin(a)*F*UA, ey=sh.y+Math.cos(a)*UA; return {ex:ex,ey:ey,hx:ex+Math.sin(b)*F*FA,hy:ey+Math.cos(b)*FA}; });
    return {hip:hip,neck:neck,head:head,sh:sh,face:F,prop:null,arms:arms,legs:legs}; }
  function render(c,V,G,now){ const r=G.raft, S=G.S, t=now/1000, W=V.W, H=V.H, st=R(S); if(!r) return;
    c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#8fb8e0'); g.addColorStop(0.6,'#cfe3f0'); g.addColorStop(1,'#e8f1f4'); c.fillStyle=g; c.fillRect(0,0,W,H);
    const sc=Math.min(W/700,H/420)*1.1, cam=r.x+120, ox=W/2-cam*sc, wy0=H*0.52, wy1=H*0.9, laneY=l=>wy0+(wy1-wy0)*(0.5+l*0.38);
    for(let k=0;k<2;k++){ const par=k?0.3:0.12, base=H*(k?0.5:0.42); c.fillStyle=k?'#3f6b3a':'#7a9a7a'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W+30;x+=30){ const wx=x+cam*par*sc; c.lineTo(x,base-40*Math.abs(Math.sin(wx*0.003+k))-12*Math.sin(wx*0.011)); } c.lineTo(W,H); c.fill(); }
    for(let i=0;i<40;i++){ const bx=((i*140-cam*0.5*sc)%(W+200)+W+200)%(W+200)-100, by=H*0.5-8; c.fillStyle='#4a3a2a'; c.fillRect(bx-2,by-30,4,30); c.fillStyle=['#2f5a3a','#3f7f4f','#2a4a30'][i%3]; c.beginPath(); c.arc(bx,by-38,16,0,7); c.fill(); }
    c.fillStyle='#5a6a4a'; c.fillRect(0,wy0-10,W,14); c.fillStyle='#6b7a55'; c.fillRect(0,wy1-4,W,H-wy1+4);
    const sec=secAt(r.x); c.fillStyle=sec.cls?'#2d6f9a':'#3a86b4'; c.fillRect(0,wy0,W,wy1-wy0);
    c.strokeStyle='rgba(255,255,255,'+(sec.cls?0.45:0.25)+')'; c.lineWidth=1.5; for(let i=0;i<26;i++){ const wx=((i*97-cam*sc*1.0+t*90)%(W+80)+W+80)%(W+80)-40, wyy=wy0+((i*53)%(wy1-wy0)); c.beginPath(); c.moveTo(wx,wyy); c.quadraticCurveTo(wx+12,wyy-4,wx+24,wyy); c.stroke(); }
    if(sec.cls==='IV'){ c.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<60;i++) c.fillRect(((i*67-cam*sc+t*200)%W+W)%W,wy0+((i*31)%(wy1-wy0)),8,2); }
    for(const w of WAVES){ const x=ox+w.x*sc; if(x<-40||x>W+40||w.got) continue; const y=laneY(w.lane); c.fillStyle='rgba(111,224,138,.55)'; c.beginPath(); c.ellipse(x,y,26*sc*0.5+Math.sin(t*4)*2,9,0,0,7); c.fill(); c.strokeStyle='#6fe08a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(x-10,y+4); c.lineTo(x,y-6); c.lineTo(x+10,y+4); c.stroke(); }
    for(const k of ROCKS){ const x=ox+k.x*sc; if(x<-60||x>W+60) continue; const y=laneY(k.lane), rad=k.r*70*sc*0.6; c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x-rad*0.6,y+rad*0.5,rad*1.5,rad*0.5,0,0,7); c.fill(); c.fillStyle='#6a6f78'; c.strokeStyle=INK; c.lineWidth=1.2; c.beginPath(); c.ellipse(x,y,rad,rad*0.75,0,0,7); c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x-rad*0.3,y-rad*0.3,rad*0.4,rad*0.25,0,0,7); c.fill(); }
    // the raft
    const rx=ox+r.x*sc, ry=laneY(r.lane)+Math.sin(t*(sec.cls?9:3))*(sec.cls?3:1.2), rot=r.steer*0.12+(r.stun>0?Math.sin(t*30)*0.12:0);
    c.save(); c.translate(rx,ry); c.rotate(rot); c.scale(sc*0.9,sc*0.9);
    c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-70,10,60,9,0,0,7); c.fill();
    c.fillStyle='#e0a030'; c.strokeStyle=INK; c.lineWidth=1.4; c.beginPath(); c.ellipse(0,6,84,20,0,0,7); c.fill(); c.stroke(); c.fillStyle='#2a3a4a'; c.beginPath(); c.ellipse(0,3,64,10,0,0,7); c.fill(); c.fillStyle='#c25a3a'; c.fillRect(-84,4,168,2.5);
    c.fillStyle='#e0563a'; c.fillRect(-78,-16,20,18); c.strokeRect(-78,-16,20,18); c.fillStyle='#f6ecd8'; c.fillRect(-78,-18,20,4); c.strokeRect(-78,-18,20,4); if(Math.floor(t*1.3)%3===0){ c.fillStyle='#6fe08a'; c.fillRect(-70,-12,4,3); }   // the cooler, with a glow
    const seats=[[-46,'aaron'],[-18,'rianan'],[8,'bret'],[34,'dave'],[58,'hero']]; const gy=()=>99;
    for(const [sx,id] of seats){ const look=id==='hero'?D.HERO_LOOK:(G.npcs.find(q=>q.def.id===id)||{def:{look:D.HERO_LOOK}}).def.look; const P=seated(sx,-2,1,t+sx,r.paddle*(id==='hero'||id==='aaron'?1:0.6)); PP.person(c,P,look,{ground:gy,w:{},t:t+sx,mood:r.stun>0?'surprise':(sec.cls?'happy':null)});
      const A=P.arms[1], px=A.hx, py=A.hy, ang=0.9-r.paddle*0.8+(id==='aaron'?0.3:0); c.strokeStyle='#5a3a24'; c.lineWidth=2.4; c.beginPath(); c.moveTo(px-Math.cos(ang)*16,py-Math.sin(ang)*16); c.lineTo(px+Math.cos(ang)*16,py+Math.sin(ang)*16); c.stroke(); c.fillStyle='#c25a3a'; c.beginPath(); c.ellipse(px+Math.cos(ang)*18,py+Math.sin(ang)*18,5,3,ang,0,7); c.fill(); }
    c.restore();
    if(r.stun>0&&r.rock){ c.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<10;i++){ c.beginPath(); c.arc(rx+(rnd(i)-0.5)*90,ry-10-rnd(i+3)*30*(0.7-r.stun),3+rnd(i+7)*4,0,7); c.fill(); } }
    // HUD
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='rgba(16,26,46,.75)'; const tf=Math.min(18,W/30); c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; const label=sec.name+(sec.cls?'   ·   bumps '+r.bumps+' / 3':''); const tw=c.measureText(label).width+24; const ty=V.touch?H*0.3:H*0.2; rr(c,W/2-tw/2,ty,tw,tf+16,8); c.fill(); c.fillStyle=sec.cls==='IV'?'#e0563a':'#f2b544'; c.fillText(label,W/2,ty+tf/2+8);
    const prog=clamp(r.x/LEN,0,1); c.fillStyle='rgba(246,236,216,.25)'; c.fillRect(W*0.2,ty+tf+24,W*0.6,4); c.fillStyle='#6fe08a'; c.fillRect(W*0.2,ty+tf+24,W*0.6*prog,4); for(const s of SECS) if(s.cls){ c.fillStyle='#e0563a'; c.fillRect(W*0.2+W*0.6*s.x0/LEN,ty+tf+22,Math.max(2,W*0.6*(s.x1-s.x0)/LEN),8); }
    if(r.msgT>0){ c.globalAlpha=clamp(r.msgT/0.4,0,1); c.fillStyle='#f6ecd8'; c.font='900 '+Math.min(30,W/14)+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText(r.msg,W/2,H*0.32); c.globalAlpha=1; }
    if(!V.quiet){ c.fillStyle='rgba(16,26,46,.6)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'stick: up/down steer, right paddle, left brake':'↑ ↓ steer   ·   → paddle   ·   ← brake',W/2,H-18); } }
  D.ALTS.unshift({test:(V,G)=>!!G.raft&&GM.chapterOf(G.S)==='raft',render:render}); }
})(typeof globalThis!=='undefined'?globalThis:this);
