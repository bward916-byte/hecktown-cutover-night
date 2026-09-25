/* ==== CHAPTER 5: Pinball Showdown. A+ has locked the Server Room and wants a match: the War Room pinball machine, three
   balls, its score against ours. Brian S plays, you are the pit crew: three parts to fix the machine first, then the match
   itself is yours to time. Beat 1,985,000 and A+ concedes. DOM-free; the table is drawn in 05 if HDRAW is around. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
GM.CHAPTERS.push({id:'pinball',num:5,title:'Pinball Showdown',blurb:'A+ has locked the Server Room and named its terms: one pinball match, three balls, its score against ours. Brian S is nationally ranked. You are his pit crew.',goal:'Find three parts, then beat 1,985,000.'});
const MACHINE={x:1543,node:'hq_f2'}, TARGET=1985000;
const PARTS=[{id:'coil',name:'flipper coil',node:'gar_loft',x:840,where:'Lou\'s Loft, over the garage'},{id:'ball',name:'a fresh silver ball',node:'ground',x:3040,where:'the Shipping Dock, in Bret\'s spares'},{id:'fuse',name:'the backglass fuse',node:'hq_roof',x:1800,where:'the Roof Garden shed'}];
const BS={name:'Brian S',role:'IT Manager  ·  nationally ranked',look:null}, APLUS={name:'A+',role:'Since 1985',look:null};
function P(S){ return S.pin||(S.pin={parts:{},fixed:false,best:0,matches:0}); }
const baseFresh=GM.freshSave;
GM.freshSave=function(id){ const s=baseFresh(id); if(s.chapter==='pinball'){ s.flags.p38=5; s.pos={node:'hq_f2',x:1480}; Object.assign(s.flags,{started:1,ch1:1,vig_hero:1,ch3:1,ch4:1,reveal:1,ap_so6:1,ap_badge:1,rfcAsked:1}); s.pin={parts:{},fixed:false,best:0,matches:0}; } return s; };
function say(G,who,pages,extra){ const b=G.npcs.find(q=>q.def.id==='brians'); const w=who===BS&&b?{name:BS.name,role:BS.role,look:b.def.look}:who; G.dialog=Object.assign({who:w.name,role:w.role,look:w.look,pages:pages,i:0},extra||{}); G.events.push({type:'sfx',name:'talk'}); }

/* ---------------- the match: a timing game. The ball sweeps; flip when it is in the sweet spot. ---------------- */
function startMatch(G){ const S=G.S; G.pin={ball:1,score:0,mult:1,hits:0,u:0.1,dir:1,speed:0.55,zc:0.5,zw:0.24,idle:0,phase:'ready',t:0,msg:'BALL 1  ·  press when the ball is in the green',flash:0,last:null};
  G.events.push({type:'sfx',name:'pinball'}); }
function flip(G){ const p=G.pin, S=G.S; if(!p) return; if(p.phase==='ready'){ p.phase='play'; p.msg=''; return; } if(p.phase!=='play') return;
  const d=Math.abs(p.u-p.zc); if(d<=p.zw/2){ p.hits++; p.ballHits=(p.ballHits||0)+1; if(p.hits%2===0) p.mult=Math.min(5,p.mult+1); const gain=100000*p.mult; p.score+=gain; p.last={text:'+'+gain.toLocaleString()+(p.mult>1?'  ×'+p.mult:''),t:0}; p.flash=1;
    p.speed=Math.min(1.35,p.speed+0.07); p.zw=Math.max(0.11,p.zw-0.012); p.zc=0.25+Math.random()*0.5; p.idle=0; G.events.push({type:'sfx',name:'pinball'}); if(p.ballHits>=10){ p.ballHits=0; drain(G,'ROLLED OUT  ·  great ball'); } }
  else drain(G,'DRAIN'); }
function drain(G,why){ const p=G.pin; p.ballHits=0; p.last={text:why,t:0}; G.events.push({type:'sfx',name:'deny'}); p.ball++; p.mult=1; p.idle=0; p.u=0.1; p.dir=1; p.speed=Math.max(0.55,p.speed-0.15); p.zw=Math.min(0.24,p.zw+0.04);
  if(p.ball>3){ p.phase='result'; p.t=0; } else { p.phase='ready'; p.msg='BALL '+p.ball+'  ·  press when the ball is in the green'; } }
function endMatch(G){ const p=G.pin, S=G.S, st=P(S); st.matches++; st.best=Math.max(st.best,p.score); G.pin=null; G.events.push({type:'save'});
  if(p.score>TARGET){ S.done=true; S.points+=GM.PTS_PIN*3; G.cine.push(GM.dlg(APLUS,['...','TILT.','THAT IS NOT HOW TILT WORKS. I KNOW THAT. I AM SAYING IT ANYWAY.']),GM.dlg(BS,['Brian S: "'+p.score.toLocaleString()+'. Nationally ranked, I told you. Also I rebuilt the flippers. Also you played that. Nice line."']),
      GM.dlg(APLUS,['THE SERVER ROOM IS OPEN. TAKE IT. TAKE THE LIGHTS.','...BEST OF FIVE?']),GM.dlg(BS,['Brian S: "No."']),{fn:G=>{ G.events.push({type:'banner',text:'Showdown won: '+p.score.toLocaleString(),pts:GM.PTS_PIN*3}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); G.events.push({type:'ending'}); }}); }
  else { G.cine.push(GM.dlg(APLUS,['ONE MILLION NINE HUNDRED EIGHTY-FIVE THOUSAND. I PICKED THAT NUMBER FOR A REASON.']),GM.dlg(BS,['Brian S: "'+p.score.toLocaleString()+'. Close. Again. TILT is a state of mind, and we are not in it."'])); if(GM.STORY) GM.STORY.aplusSay(G,'AGAIN? I HAVE ALL NIGHT. I HAVE HAD EVERY NIGHT.',4); } }
function tickMatch(G,dt){ const p=G.pin; p.t+=dt; if(p.flash>0) p.flash-=dt*4; if(p.last){ p.last.t+=dt; if(p.last.t>1.1) p.last=null; }
  if(p.phase==='play'){ p.u+=p.dir*p.speed*dt; if(p.u>=1){ p.u=1; p.dir=-1; } if(p.u<=0){ p.u=0; p.dir=1; } p.idle+=dt; if(p.idle>3.2/p.speed*1.2) drain(G,'DRAIN  ·  too slow'); }
  if(p.phase==='result'&&p.t>1.2) endMatch(G); }

/* ---------------- talking, parts, the machine ---------------- */
function talkBrian(G){ const S=G.S, st=P(S), n=Object.keys(st.parts).length;
  if(S.done) return say(G,BS,['Brian S: "Best of five, it said. No. ...Maybe Friday."']);
  if(!S.flags.pinIntro){ S.flags.pinIntro=1; G.events.push({type:'save'}); G.cine.push({card:'PINBALL SHOWDOWN',sub:'War Room  ·  three balls  ·  A+ vs. Phillips IT',dur:5,style:'comic',panels:[{i:'A+',c:'Locked the Server Room'},{i:'🔧',c:'Three parts to fix the machine'},{i:'🏆',c:'Beat 1,985,000'}]},
      GM.dlg(APLUS,['THE SERVER ROOM IS MINE UNTIL SOMEONE BEATS MY SCORE. ONE MILLION NINE HUNDRED EIGHTY-FIVE THOUSAND. THREE BALLS. NO TILT.','I PICKED THE NUMBER. YOU KNOW WHY.']),
      GM.dlg(BS,['Brian S: "Nationally ranked. I don\'t like to bring it up. I\'m bringing it up. The machine\'s not ready, though: A+ pulled parts."','Brian S: "The flipper coil went to Lou\'s loft, the silver ball is in Bret\'s spares at the Shipping Dock, and the backglass fuse is up in the Roof Garden shed. Get me those and it\'s ours."'])); return; }
  if(n<PARTS.length) return say(G,BS,['Brian S: "'+n+' of 3. Still need '+PARTS.filter(x=>!st.parts[x.id]).map(x=>x.name+' ('+x.where+')').join(', ')+'."']);
  if(!st.fixed){ st.fixed=true; S.points+=GM.PTS_PIN; G.events.push({type:'banner',text:'Machine fixed',pts:GM.PTS_PIN}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); return say(G,BS,['Brian S: "Coil. Ball. Fuse. ...There. Flippers are live. Backglass says CUTOVER WIZARD. It\'s ready."','Brian S: "You time the flips. I\'ll call the ramps. Press when the ball is in the green. Beat one-nine-eight-five. Go."']); }
  return say(G,BS,['Brian S: "Machine\'s ready. Play it. Beat one-nine-eight-five. Best so far: '+st.best.toLocaleString()+'."']); }
const base={update:GM.update,interact:GM.interact,command:GM.command,objective:GM.objective};
GM.update=function(G,ix,iy,dt){ const S=G.S; if(G.pin){ tickMatch(G,dt); return; } base.update(G,ix,iy,dt); if(GM.chapterOf(S)!=='pinball'||G.dialog||!G.cur.node||S.done) return; const st=P(S), h=G.hero, N=G.cur.node;
  let best=G.target, bd=best?Math.abs(best.x-h.x)+(best.kind==='item'||best.kind==='page'?-40:0):1e9;
  for(const pt of PARTS) if(!st.parts[pt.id]&&N.id===pt.node){ const d=Math.abs(pt.x-h.x); if(d<26&&d-30<bd){ best={kind:'pinpart',label:'Take',name:pt.name,x:pt.x,part:pt}; bd=d-30; } }
  if(N.id===MACHINE.node&&Math.abs(MACHINE.x-h.x)<24){ const d=Math.abs(MACHINE.x-h.x); if(d-30<bd) best={kind:'pinmatch',label:st.fixed?'Play':'Fix',name:st.fixed?'the showdown':'the pinball machine',x:MACHINE.x}; }
  G.target=best; };
GM.interact=function(G){ const t=G.target, S=G.S; if(G.pin){ flip(G); return; }
  if(GM.chapterOf(S)==='pinball'&&!G.dialog&&!G.card&&t&&!(G.cine&&G.cine.length)){
    if(t.kind==='pinpart'){ P(S).parts[t.part.id]=1; S.points+=GM.PTS_PIN; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'banner',text:'Got '+t.part.name,pts:GM.PTS_PIN}); G.events.push({type:'save'}); return; }
    if(t.kind==='pinmatch'){ const st=P(S); if(!st.fixed){ say(G,BS,[S.flags.pinIntro?'Brian S: "Not yet. Parts first."':'Brian S: "Hold on, talk to me first. There\'s a whole thing."']); return; } startMatch(G); return; }
    if(t.kind==='talk'&&t.q&&t.q.def.id==='brians'){ S.met.brians=1; talkBrian(G); return; } }
  base.interact(G); };
GM.command=function(G,name){ if(G.pin){ if(name==='jump') flip(G); else if(name==='crawl'){ G.pin=null; G.events.push({type:'hint',text:'Match abandoned. The machine will wait.'}); } return false; } return base.command(G,name); };
GM.objective=function(S){ if(GM.chapterOf(S)!=='pinball') return base.objective(S); const st=P(S), n=Object.keys(st.parts).length; if(S.done) return 'Showdown won. Best: '+st.best.toLocaleString()+'. Keep exploring: '+GM.percent(S)+'% of Hecktown found.';
  if(!S.flags.pinIntro) return 'Talk to Brian S by the pinball machine in the War Room (HQ 2nd floor).';
  if(n<PARTS.length) return 'Parts '+n+' of 3: '+PARTS.filter(x=>!st.parts[x.id]).map(x=>x.name+' ('+x.where+')').join('; ')+'.';
  if(!st.fixed) return 'Bring the parts to Brian S at the machine.'; return 'Play the machine. Beat 1,985,000 across three balls. Press when the ball is in the green.'+(st.best?'  Best: '+st.best.toLocaleString():''); };
GM.PTS_PIN=20; GM.PIN={P:P,PARTS:PARTS,MACHINE:MACHINE,TARGET:TARGET,flip:flip};
GM.chapterEnding=(function(prev){ return function(S){ if(GM.chapterOf(S)==='pinball'){ const st=P(S); return {title:'Showdown won',sub:'War Room  ·  '+st.best.toLocaleString()+' vs. 1,985,000  ·  '+st.matches+' match'+(st.matches===1?'':'es'),body:'Brian S called the ramps, you timed the flips, and A+ said TILT, which is not how TILT works. The Server Room is open. A+ has asked for best of five. Every day.'}; } return prev?prev(S):null; }; })(GM.chapterEnding);

/* ---------------- the table, drawn over the screen ---------------- */
if(root.HDRAW){ const D=root.HDRAW, clamp=(v,a,b)=>v<a?a:(v>b?b:v);
  const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
  D.HOOKS.push(function(c,G,now,V){ if(GM.chapterOf(G.S)!=='pinball'||!G.cur.node||G.cur.node.id!=='hq_f2'||!D.aplusMonster) return; const x=1600; if(x<V.x0-80||x>V.x1+80) return;
    D.aplusMonster(c,x,MAP.nodes.hq_f2.world.yAt(x),0.86,now/1000,G.pin?'smug':(G.S.done?'quiet':'mean'),{dir:-1,sleep:!!G.S.done,talk:!!(G.dialog&&G.dialog.who==='A+')}); });
  const baseRender=D.render;
  D.render=function(c,V,G,now,dt){ baseRender(c,V,G,now,dt); const p=G.pin; if(!p) return; const W=V.W, H=V.H, t=now/1000;
    c.setTransform(V.DPR,0,0,V.DPR,0,0); c.fillStyle='rgba(8,12,22,.88)'; c.fillRect(0,0,W,H);
    const pw=Math.min(W-30,520), ph=Math.min(H-40,H*0.9), px=(W-pw)/2, py=(H-ph)/2;
    c.fillStyle='#3a1a4a'; rr(c,px,py,pw,ph,14); c.fill(); c.strokeStyle='#c9a56a'; c.lineWidth=3; rr(c,px,py,pw,ph,14); c.stroke();
    c.fillStyle='#1a1d24'; rr(c,px+14,py+14,pw-28,ph*0.22,8); c.fill(); for(let k=0;k<7;k++){ c.fillStyle=Math.floor(t*5+k)%2?'#f2b544':'#e0563a'; c.beginPath(); c.arc(px+30+k*(pw-60)/6,py+24,3,0,7); c.fill(); }
    c.fillStyle='#f6ecd8'; c.font='700 '+Math.min(22,pw/18)+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('CUTOVER WIZARD',px+pw/2,py+ph*0.08);
    c.font='700 '+Math.min(34,pw/12)+'px "IBM Plex Mono",monospace'; c.fillStyle=p.flash>0?'#fff':'#6fe08a'; c.fillText(p.score.toLocaleString(),px+pw/2,py+ph*0.15);
    c.font='500 12px "IBM Plex Mono",monospace'; c.fillStyle='rgba(246,236,216,.7)'; c.fillText('A+  1,985,000     ×'+p.mult+'     BALL '+Math.min(3,p.ball)+' / 3',px+pw/2,py+ph*0.215);
    // the lane: a horizontal track, the sweet spot in green
    const ly=py+ph*0.55, lx0=px+30, lx1=px+pw-30, lw=lx1-lx0; c.fillStyle='#2b1436'; rr(c,lx0-8,ly-22,lw+16,44,10); c.fill();
    for(let k=0;k<8;k++){ c.fillStyle=Math.floor(t*6+k)%3?'#5a2a6a':'#f2b544'; c.beginPath(); c.arc(lx0+lw*(k+0.5)/8,ly-34,3,0,7); c.fill(); }
    const zx=lx0+lw*(p.zc-p.zw/2); c.fillStyle='rgba(111,224,138,'+(p.phase==='play'?0.55:0.25)+')'; rr(c,zx,ly-18,lw*p.zw,36,6); c.fill(); c.strokeStyle='#6fe08a'; c.lineWidth=1.5; rr(c,zx,ly-18,lw*p.zw,36,6); c.stroke();
    const bx=lx0+lw*p.u; c.fillStyle='#d8d2c0'; c.beginPath(); c.arc(bx,ly,9,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.arc(bx-3,ly-3,3,0,7); c.fill();
    // flippers
    for(const k of [-1,1]){ const fx=px+pw/2+k*70, a=p.flash>0.6?-k*0.5:k*0.25; c.save(); c.translate(fx,py+ph*0.72); c.rotate(a); c.fillStyle='#f2b544'; rr(c,k<0?0:-46,-6,46,12,6); c.fill(); c.restore(); }
    c.fillStyle='#f6ecd8'; c.font='600 '+Math.min(16,pw/26)+'px "IBM Plex Sans",sans-serif'; if(p.msg) c.fillText(p.msg,px+pw/2,py+ph*0.85);
    if(p.last){ const a=1-p.last.t/1.1; c.globalAlpha=a; c.fillStyle=/DRAIN/.test(p.last.text)?'#e0563a':'#f2b544'; c.font='900 '+Math.min(30,pw/12)+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText(p.last.text,px+pw/2,py+ph*0.4-(1-a)*20); c.globalAlpha=1; }
    if(p.phase==='result'){ c.fillStyle='#f6ecd8'; c.font='700 '+Math.min(20,pw/18)+'px "IBM Plex Sans",sans-serif'; c.fillText(p.score>TARGET?'WINNER':'A+ HOLDS',px+pw/2,py+ph*0.85); }
    c.fillStyle='rgba(246,236,216,.5)'; c.font='500 11px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap Use or Jump to flip  ·  Crawl quits':'E or Space flips  ·  C quits',px+pw/2,py+ph-16); }; }
})(typeof globalThis!=='undefined'?globalThis:this);
