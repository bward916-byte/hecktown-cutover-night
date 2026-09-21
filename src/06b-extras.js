/* ==== EXTRAS: options (text size, key rebinding), the minimap, photo mode, the speedrun clock, and the ending:
   a comic montage, a line for everyone, and a team photo before the credits. Plugs into 06-ui through __hecktown.EXT. ==== */
(function(){
'use strict';
const H=window.__hecktown, EXT=H.EXT, GM=HGAME, MAP=HMAP, PP=HPEOPLE, D=HDRAW, E=WalkEngine;
const $=id=>document.getElementById(id), clamp=(v,a,b)=>v<a?a:(v>b?b:v), esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const OPT_KEY='hecktown2.opts', BEST_KEY='hecktown2.best';
let O={text:1,run:false,map:!matchMedia('(pointer:coarse)').matches}; try{ Object.assign(O,JSON.parse(localStorage.getItem(OPT_KEY)||'{}')); }catch(_){ }
const saveOpts=()=>{ try{ localStorage.setItem(OPT_KEY,JSON.stringify(O)); }catch(_){ } };
const st=document.createElement('style'); st.textContent=`
  #dialog,#hud,#toasts,.sheet{zoom:var(--ts,1);}
  body.photo #hud,body.photo #tools,body.photo #toasts,body.photo #pad,body.photo #dialog,body.photo #saved,body.cine #hud,body.cine #tools,body.cine #toasts,body.cine #pad,body.cine #dialog{display:none !important;}
  #pbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;flex-wrap:wrap;justify-content:center;z-index:9;}
  #pbar button{background:rgba(16,26,46,.85);color:#f6ecd8;border:0;border-radius:8px;padding:9px 12px;font:600 13px "IBM Plex Sans",system-ui,sans-serif;min-width:40px;}
  #pbar button.hi{background:#f2b544;color:#101a2e;}
  #options{background:rgba(11,18,32,.96);} #oBody .btn{padding:5px 12px;font-size:13px;min-height:0;} #oBody h3{margin:16px 0 6px;} #oBody .row{display:flex;align-items:center;gap:10px;margin:8px 0;flex-wrap:wrap;} #oBody .row>span{min-width:130px;}
  #oBody button.sel{background:#f2b544;color:#101a2e;} #oBody kbd{display:inline-block;min-width:54px;text-align:center;background:#243447;border-radius:6px;padding:4px 8px;font:600 13px "IBM Plex Mono",monospace;}
  #oBody .keys{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:4px 18px;} #hRun{display:block;font:600 11px "IBM Plex Mono",monospace;color:#9ad0a0;}`;
document.head.appendChild(st);
const applyText=()=>document.documentElement.style.setProperty('--ts',O.text); applyText();

/* ---------------- options ---------------- */
const ov=document.createElement('div'); ov.id='options'; ov.className='overlay hide'; ov.innerHTML='<div class="sheet" id="oBody"></div>'; document.body.appendChild(ov);
const NAMES={left:'Walk left',right:'Walk right',up:'Up the stairs',down:'Down the stairs',use:'Talk / use',jump:'Jump',roll:'Roll',crawl:'Crawl',throw:'Throw',read:'Read',dance:'Dance',clap:'Clap',stroll:'Stroll (hold)',journal:'Journal',zoom:'Zoom',sound:'Sound',map:'Minimap',photo:'Photo mode'};
const keyName=c=>({Space:'Space',Enter:'Enter',Tab:'Tab',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',ShiftLeft:'Shift',ShiftRight:'R-Shift',Escape:'Esc'}[c]||c.replace(/^Key|^Digit/,''));
let rebind=null, prevState='play';
function renderOpts(){ const K=H.keys.get(), T=[['90%',0.9],['100%',1],['115%',1.15],['130%',1.3]];
  let h='<button class="btn ghost close" id="oClose">Close</button><h1>Options</h1>';
  h+='<div class="row"><span>Text size</span>'+T.map(t=>'<button class="btn ghost'+(O.text===t[1]?' sel':'')+'" data-ts="'+t[1]+'">'+t[0]+'</button>').join('')+'</div>';
  h+='<div class="row"><span>Speedrun clock</span><button class="btn ghost'+(O.run?' sel':'')+'" id="oRun">'+(O.run?'Shown':'Hidden')+'</button></div>';
  h+='<div class="row"><span>Minimap</span><button class="btn ghost'+(O.map?' sel':'')+'" id="oMap">'+(O.map?'Shown':'Hidden')+'</button></div>';
  let best=null; try{ best=JSON.parse(localStorage.getItem(BEST_KEY)||'null'); }catch(_){ } if(best) h+='<div class="sub">Best cutover run: '+GM.fmtRun(best)+'</div>';
  h+='<h3>Keys</h3><div class="keys">'+Object.keys(NAMES).map(a=>'<div class="row"><span>'+NAMES[a]+'</span><kbd>'+(rebind===a?'press a key…':esc(keyName(K[a][0])))+'</kbd><button class="btn ghost" data-rb="'+a+'">Change</button></div>').join('')+'</div>';
  h+='<div class="btns"><button class="btn ghost" id="oReset">Reset keys</button></div>'; $('oBody').innerHTML=h;
  $('oClose').onclick=closeOpts; $('oRun').onclick=()=>{ O.run=!O.run; saveOpts(); renderOpts(); }; $('oMap').onclick=()=>{ O.map=!O.map; saveOpts(); renderOpts(); };
  $('oReset').onclick=()=>{ H.keys.reset(); renderOpts(); };
  for(const b of document.querySelectorAll('#oBody [data-ts]')) b.onclick=()=>{ O.text=+b.dataset.ts; saveOpts(); applyText(); renderOpts(); };
  for(const b of document.querySelectorAll('#oBody [data-rb]')) b.onclick=()=>{ rebind=b.dataset.rb; renderOpts(); }; }
function openOpts(){ if(H.state!=='play'&&H.state!=='title') return; prevState=H.state; H.setState('options'); renderOpts(); ov.classList.remove('hide'); }
function closeOpts(){ rebind=null; ov.classList.add('hide'); H.setState(prevState); }
$('bOpts').onclick=openOpts;
$('bMap').onclick=()=>{ O.map=!O.map; saveOpts(); };

/* ---------------- speedrun clock ---------------- */
let runT=0; EXT.tick.push(dt=>{ runT-=dt; if(runT>0) return; runT=0.25; const S=H.G.S, el=$('hRun'); el.classList.toggle('hide',!O.run); if(O.run) el.textContent='run '+GM.fmtRun(S.runEnd!=null?S.runEnd:S.run)+(S.runEnd!=null?' ✓':''); });

/* ---------------- minimap ---------------- */
const MX0=-200, MX1=3560, MY0=-235, MY1=420;
function minimap(c,V,G){ const N=G.cur.node; if(!N||N.era||N.dc||N.show||G.card||G.board||G.drive||G.p38) return;
  const w=Math.min(200,V.W*0.34), h=w*(MY1-MY0)/(MX1-MX0)*2.8, x0=V.W-w-10, y0=V.touch?V.H-h-150:118, sx=w/(MX1-MX0), sy=h/(MY1-MY0), P=(x,y)=>[x0+(x-MX0)*sx,y0+(y-MY0)*sy], S=G.S;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.fillStyle='rgba(11,18,32,.72)'; rr(c,x0-6,y0-6,w+12,h+12,8); c.fill();
  for(const b of MAP.buildings){ const [a1,b1]=P(b.x0,b.top), [a2,b2]=P(b.x1,b.basement||b.base); c.fillStyle='rgba(246,236,216,.07)'; c.fillRect(a1,b1,a2-a1,b2-b1); }
  for(const r of MAP.rooms){ const n=MAP.nodes[r.node]; if(!n) continue; const y=n.world.yAt((r.x0+r.x1)/2), [a1,b1]=P(r.x0,y), [a2]=P(r.x1,y); c.fillStyle=S.rooms[r.id]?'rgba(242,181,68,.55)':'rgba(246,236,216,.18)'; c.fillRect(a1,b1-2.5,a2-a1-1,2.5); }
  c.strokeStyle='rgba(246,236,216,.35)'; c.lineWidth=1; for(const id in MAP.nodes){ const n=MAP.nodes[id]; if(n.era||n.dc||n.show||n.mid) continue; const W=n.world; c.beginPath(); for(let x=W.x0;x<=W.x1;x+=30){ const [a,b]=P(x,W.yAt(x)); if(x===W.x0) c.moveTo(a,b); else c.lineTo(a,b); } c.stroke(); }
  const dot=(x,y,col,r)=>{ const [a,b]=P(x,y); c.fillStyle=col; c.beginPath(); c.arc(a,b-2,r||2.5,0,7); c.fill(); };
  if(S.flags.network) dot(GM.NET.TRUCK_E,0,'#9ad0f0',2); if(G.portalOpen) dot(GM.PORTAL_X,MAP.nodes.hq_b1.world.yAt(GM.PORTAL_X),'#c882ff',2.5);
  for(const q of G.npcs) if(q.crew&&q.node) dot(q.w.x,q.node.world.yAt(q.w.x),'#6fb0ff',2);
  if(N) dot(G.hero.x,N.world.yAt(G.hero.x),'#f2b544',3.2);
  c.fillStyle='rgba(246,236,216,.6)'; c.font='600 9px "IBM Plex Sans",sans-serif'; c.textAlign='right'; c.textBaseline='alphabetic'; c.fillText('HECKTOWN ROAD',x0+w,y0+h+2); }

/* ---------------- photo mode ---------------- */
const PB=document.createElement('div'); PB.id='pbar'; PB.className='hide'; document.body.appendChild(PB);
const FILTERS=['None','Sepia','Noir','Green screen'], FRAMES=['None','Polaroid','Comic'];
let PH=null; const pheld={};
function enterPhoto(){ if(H.state!=='play'||H.G.dialog||H.G.card||H.G.drive||H.G.board) return; PH={x:H.V.camx,y:H.V.camy,z:1,filter:0,frame:0}; H.setState('photo'); document.body.classList.add('photo'); drawBar(); PB.classList.remove('hide'); }
function exitPhoto(){ PH=null; for(const k in pheld) pheld[k]=false; H.setState('play'); document.body.classList.remove('photo'); PB.classList.add('hide'); }
function drawBar(){ PB.innerHTML=[['◀','L'],['▶','R'],['▲','U'],['▼','D'],['−','zo'],['+','zi'],['Filter: '+FILTERS[PH.filter],'f'],['Frame: '+FRAMES[PH.frame],'fr'],['Save','s'],['Done','x']].map(b=>'<button data-p="'+b[1]+'"'+(b[1]==='s'?' class="hi"':'')+'>'+b[0]+'</button>').join('');
  for(const b of PB.querySelectorAll('button')){ const k=b.dataset.p; if('LRUD'.indexOf(k)>=0&&k.length===1){ b.onpointerdown=e=>{ e.preventDefault(); pheld[k]=true; }; b.onpointerup=b.onpointerleave=()=>{ pheld[k]=false; }; } else b.onclick=()=>photoAct(k); } }
function photoAct(k){ if(!PH) return; if(k==='zi') PH.z=clamp(PH.z*1.2,0.5,3); if(k==='zo') PH.z=clamp(PH.z/1.2,0.5,3); if(k==='f') PH.filter=(PH.filter+1)%FILTERS.length; if(k==='fr') PH.frame=(PH.frame+1)%FRAMES.length; if(k==='x') return exitPhoto();
  if(k==='s'){ const cv=$('c'); try{ cv.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='hecktown-photo.png'; document.body.appendChild(a); a.click(); a.remove(); H.toast('Photo saved',0,true); }); }catch(_){ H.toast('Could not save here. Try a screenshot.',0,true); } }
  drawBar(); }
EXT.camera=(state,V,dt)=>{ if(state!=='photo'||!PH) return false; const sp=260/V.zoom*dt; if(pheld.L) PH.x-=sp; if(pheld.R) PH.x+=sp; if(pheld.U) PH.y-=sp; if(pheld.D) PH.y+=sp; V.camx=PH.x; V.camy=PH.y; V.zoom*=PH.z; return true; };
function photoPost(c,V,G){ const W=V.W, Hh=V.H; c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(PH.filter===1||PH.filter===2||PH.filter===3){ c.globalCompositeOperation='saturation'; c.fillStyle='#808080'; c.fillRect(0,0,W,Hh); c.globalCompositeOperation='multiply'; c.fillStyle=['','#d9b98a','#c8c8cc','#7fe0a0'][PH.filter]; c.fillRect(0,0,W,Hh); c.globalCompositeOperation='source-over';
    if(PH.filter===2){ const g=c.createRadialGradient(W/2,Hh/2,Math.min(W,Hh)*0.3,W/2,Hh/2,Math.max(W,Hh)*0.7); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.6)'); c.fillStyle=g; c.fillRect(0,0,W,Hh); } }
  const cap='Hecktown Road  ·  '+(G.room?G.room.name:(G.cur.node?G.cur.node.label:''))+'  ·  '+GM.clock(G.S);
  if(PH.frame===1){ c.fillStyle='#f6f2e8'; const b=Math.min(W,Hh)*0.05; c.fillRect(0,0,W,b); c.fillRect(0,0,b,Hh); c.fillRect(W-b,0,b,Hh); c.fillRect(0,Hh-b*3.2,W,b*3.2); c.fillStyle='#243447'; c.font='italic '+Math.round(b*0.9)+'px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(cap,W/2,Hh-b*1.6); }
  if(PH.frame===2){ c.strokeStyle='#101a2e'; c.lineWidth=14; c.strokeRect(7,7,W-14,Hh-14); c.fillStyle='#f2b544'; c.fillRect(22,22,Math.min(W-44,c.measureText(cap).width+60),30); c.fillStyle='#101a2e'; c.font='700 14px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='left'; c.textBaseline='middle'; c.fillText(cap.toUpperCase(),34,37); } }

/* ---------------- the ending: montage, a line for everyone, the team photo ---------------- */
let END=null; const portraits={};
function portraitOf(look,key){ if(portraits[key]) return portraits[key]; const cv=document.createElement('canvas'); cv.width=cv.height=112; PP.portrait(cv.getContext('2d'),look,112); return portraits[key]=cv; }
function endLines(){ const L=[]; for(const p of GM.PEOPLE) if(GM.EPI.ENDINGS[p.id]) L.push({look:p.look,key:p.id,text:GM.EPI.ENDINGS[p.id]}); L.push({look:D.HERO_LOOK,key:'hero',text:GM.EPI.ENDINGS.hero}); return L; }
function startEnd(){ const G=H.G, S=G.S; if(S.runEnd==null) S.runEnd=S.run||0; try{ const b=JSON.parse(localStorage.getItem(BEST_KEY)||'null'); if(b==null||S.runEnd<b) localStorage.setItem(BEST_KEY,JSON.stringify(S.runEnd)); }catch(_){ }
  const dcs=GM.NET?GM.NET.DCS.filter(d=>S.flags['dc_'+d.id]).length:0, pages=GM.count(S.pages);
  END={phase:0,t:0,i:0,lines:endLines(),cards:[{card:'MIDNIGHT',sub:'ENDSBS *ALL  ·  completed normally',dur:6,style:'comic',panels:[{i:'✍',c:'Six signatures'},{i:'☎',c:'One bridge call'},{i:'🚚',c:dcs+' of 9 DCs back on the network'}]},
    {card:'THE MORNING AFTER',sub:'The trucks roll at dawn',dur:6,style:'comic',panels:[{i:'A+',c:'Archived with honors'},{i:'§',c:pages+' of '+GM.PAGES.length+' ledger pages'},{i:'🐈',c:'Milo got a permit'}]}],photo:null};
  H.setState('ending-seq'); document.body.classList.add('cine'); }
function nextEnd(){ if(!END) return; if(END.phase<2){ END.phase++; END.t=0; } else if(END.phase===2){ END.i++; END.t=0; if(END.i>=END.lines.length){ END.phase=3; END.t=0; } } else finishEnd(); }
function finishEnd(){ END=null; document.body.classList.remove('cine'); H.showEnding(); const btns=document.querySelector('#eBody .btns');
  if(btns&&!$('eShow')){ const b=document.createElement('button'); b.className='btn ghost'; b.id='eShow'; b.textContent='Take the shuttle to the Buying Show'; b.onclick=()=>{ H.closeEnding(); GM.goShow(H.G); }; btns.appendChild(b); } }
function teamPhoto(){ const world=E.makeWorld(E.surfaces(0,0,[['flat',4000]])), core=['rianan','aaron','bret','brians','umesh','dave','john','greg','ryan','jose','ash','andrew','pam','melissa','cathy'];
  const front=[], back=[]; const mk=(look,i,arr,sp)=>{ const w=E.createWalker(world,200+i*sp); w.facing=w.dir=w.kneeF=i%2?-1:1; arr.push({look:look,pose:E.poseOf(w)}); };
  core.forEach((id,i)=>{ const p=GM.PEOPLE.find(z=>z.id===id); if(p) mk(p.look,i,front,26); }); mk(D.HERO_LOOK,core.length,front,26);
  GM.PEOPLE.filter(p=>core.indexOf(p.id)<0).forEach((p,i)=>mk(p.look,i,back,22)); return {front:front,back:back}; }
function drawEnd(c,V,G,dt,now){ const W=V.W, Hh=V.H, t=now/1000; END.t+=dt; c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(END.phase<2){ const k=END.cards[END.phase]; k.t=END.t; D.drawCardStyle(c,V,G,Object.assign({},k,{t:Math.min(END.t,k.dur-0.61)})); if(END.t>=k.dur) nextEnd(); return; }
  const g=c.createLinearGradient(0,0,0,Hh); g.addColorStop(0,'#1c2a4a'); g.addColorStop(0.6,'#d88a6a'); g.addColorStop(1,'#f2c088'); c.fillStyle=g; c.fillRect(0,0,W,Hh);
  if(END.phase===2){ const L=END.lines[END.i]; if(!L){ nextEnd(); return; } const a=clamp(Math.min(END.t/0.5,(3.6-END.t)/0.5),0,1); c.globalAlpha=a;
    c.fillStyle='rgba(11,18,32,.5)'; c.fillRect(0,Hh*0.3,W,Hh*0.4); const pw=Math.min(112,Hh*0.2); c.drawImage(portraitOf(L.look,L.key),W/2-pw/2,Hh*0.3+14,pw,pw);
    c.fillStyle='#f6ecd8'; c.font='italic '+Math.min(20,W/32)+'px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle'; const words=L.text.split(' '), lines=[]; let l=''; for(const w of words){ const tl=l?l+' '+w:w; if(c.measureText(tl).width>Math.min(620,W-60)&&l){ lines.push(l); l=w; } else l=tl; } lines.push(l);
    lines.forEach((ln,i)=>c.fillText(ln,W/2,Hh*0.3+pw+34+i*26)); c.globalAlpha=1;
    c.fillStyle='rgba(246,236,216,.5)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText('THE MORNING AFTER  ·  '+(END.i+1)+' / '+END.lines.length,W/2,Hh*0.3-18); c.fillText(V.touch?'tap to continue':'E next  ·  Esc skip',W/2,Hh-28);
    if(END.t>=3.6) nextEnd(); return; }
  // the team photo
  END.photo=END.photo||teamPhoto(); const P=END.photo, a=clamp(END.t/1,0,1); c.globalAlpha=a;
  c.fillStyle='#2b3140'; c.fillRect(W*0.08,Hh*0.36,W*0.84,Hh*0.3); c.fillStyle='#243447'; c.fillRect(W*0.08,Hh*0.36,W*0.84,18); c.fillStyle='#f2b544'; c.font='700 12px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('PHILLIPS PET FOOD & SUPPLIES  ·  HQ',W/2,Hh*0.36+10);
  c.fillStyle='#3a3e47'; c.fillRect(0,Hh*0.84,W,Hh*0.16);
  const row=(arr,sp,s,y)=>{ c.save(); c.translate(W/2-(200+(arr.length-1)*sp/2)*s,y); c.scale(s,s); for(const q of arr) PP.person(c,q.pose,q.look,{ground:()=>0,t:t,happy:true}); c.restore(); };
  const sF=Math.min(3.2,(W*0.92)/(P.front.length*26+40)), sB=sF*0.8; c.fillStyle='#4a5060'; c.fillRect(W*0.1,Hh*0.84-sF*24,W*0.8,sF*24); row(P.back,22,sB,Hh*0.84-sF*24); row(P.front,26,sF,Hh*0.84);
  const S=G.S; c.fillStyle='#f6ecd8'; c.textAlign='center'; c.textBaseline='middle'; c.font='700 '+Math.min(44,W/14)+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText('HECKTOWN ROAD',W/2,Hh*0.1);
  c.fillStyle='#7fe0a0'; c.font='700 '+Math.min(18,W/30)+'px "IBM Plex Mono",monospace'; c.fillText('> CUTOVER NIGHT_',W/2,Hh*0.1+Math.min(34,W/20));
  c.fillStyle='#f6ecd8'; c.font='500 '+Math.min(14,W/40)+'px "IBM Plex Sans",sans-serif'; c.fillText('Phillips Pet Food & Supplies  ·  Easton, Pennsylvania  ·  since 1938',W/2,Hh*0.1+Math.min(62,W/11));
  c.fillText('Built by Brian W  ·  '+S.points+' / '+GM.MAXPTS+'  ·  '+GM.rank(S)+'  ·  cutover run '+GM.fmtRun(S.runEnd),W/2,Hh*0.1+Math.min(84,W/8));
  c.font='italic '+Math.min(16,W/34)+'px Georgia,serif'; c.fillText('Show up for the people who count on you.',W/2,Hh*0.93);
  c.globalAlpha=0.5; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to continue':'E to continue',W/2,Hh-14); c.globalAlpha=1; }
EXT.ending=startEnd;
$('c').addEventListener('pointerdown',()=>{ if(H.state==='ending-seq') nextEnd(); });

/* ---------------- wiring ---------------- */
EXT.after.push((c,V,G,state,dt,now)=>{ if(state==='ending-seq'&&END){ drawEnd(c,V,G,dt,now); return; } if(state==='photo'&&PH){ photoPost(c,V,G); return; } if(state==='play'&&O.map) minimap(c,V,G); });
EXT.keys.push((e,state)=>{
  if(rebind){ if(e.code!=='Escape') H.keys.set(rebind,e.code); rebind=null; renderOpts(); e.preventDefault(); return true; }
  if(state==='options'){ if(e.code==='Escape') closeOpts(); return true; }
  if(state==='ending-seq'){ if(e.code==='Escape') finishEnd(); else if(['Space','KeyE','Enter'].indexOf(e.code)>=0) nextEnd(); return true; }
  const K=H.keys.get(), act=code=>{ for(const a in K) if(K[a].indexOf(code)>=0) return a; return null; }, a=act(e.code);
  if(state==='photo'){ const m={left:'L',right:'R',up:'U',down:'D'}; if(m[a]){ pheld[m[a]]=true; return true; } if(e.code==='Equal'||e.code==='NumpadAdd') photoAct('zi'); else if(e.code==='Minus'||e.code==='NumpadSubtract') photoAct('zo');
    else if(e.code==='KeyF') photoAct('f'); else if(e.code==='KeyB') photoAct('fr'); else if(e.code==='Enter') photoAct('s'); else if(e.code==='Escape'||a==='photo') exitPhoto(); return true; }
  if(state==='play'&&a==='map'){ O.map=!O.map; saveOpts(); return true; }
  if(state==='play'&&a==='photo'){ enterPhoto(); return true; }
  return false; });
addEventListener('keyup',e=>{ if(!PH) return; const K=H.keys.get(); const m={left:'L',right:'R',up:'U',down:'D'}; for(const a in m) if(K[a].indexOf(e.code)>=0) pheld[m[a]]=false; });
$('bPhoto').onclick=enterPhoto;
})();
