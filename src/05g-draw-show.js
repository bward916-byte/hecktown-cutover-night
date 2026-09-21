/* ==== THE BUYING SHOW, drawn, and the shuttle stop in the Employee Lot. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, PP=root.HPEOPLE, INK=PP.INK, EPI=GM.EPI;
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const COLS=['#c0392b','#31506a','#6a8a4a','#7a4a8a','#c8912e','#3f7f8f','#8a4a3a','#3a5a8a','#3a3a4a','#243447'];

function renderShow(c,V,G,now){
  const t=now/1000, S=G.S, s=EPI.show(G), SX=EPI.SX;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.fillStyle='#232834'; c.fillRect(0,0,V.W,V.H);
  const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  R(SX-600,-260,EPI.SW+1200,260,'#2a2f3a'); for(let x=SX-600;x<SX+EPI.SW+600;x+=120){ R(x,-250,70,6,'#5a6070'); c.fillStyle='rgba(255,236,190,.07)'; c.beginPath(); c.moveTo(x+10,-244); c.lineTo(x+60,-244); c.lineTo(x+110,0); c.lineTo(x-40,0); c.closePath(); c.fill(); }
  R(SX-600,0,EPI.SW+1200,600,'#3a4050'); for(let x=SX-600;x<SX+EPI.SW+600;x+=40) R(x,0,20,600,'rgba(255,255,255,.04)');
  R(SX+150,-210,300,40,'#243447'); c.fillStyle='#f2b544'; c.font='700 18px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS BUYING SHOW',SX+300,-194); c.fillStyle='#e6d7bd'; c.font='7px "IBM Plex Sans",sans-serif'; c.fillText('75+ brands  ·  every DC  ·  and one alley cat',SX+300,-178);
  // the shuttle door
  R(SX+70,-80,40,80,'#1a1f2a'); c.fillStyle='#f6ecd8'; c.font='700 5px "IBM Plex Sans",sans-serif'; c.fillText('SHUTTLE',SX+90,-86);
  EPI.BOOTHS.forEach((b,i)=>{ const x=EPI.BX(i); R(x,-90,200,90,COLS[i]); R(x,-90,200,6,'rgba(255,255,255,.15)'); c.fillStyle='#f6ecd8'; c.font='700 9px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText(b,x+100,-76);
    R(x+20,-34,160,34,'#e6d7bd'); R(x+20,-34,160,3,'#f2b544');
    if(b==='IT DEPT'){ const tx=x+60; R(tx-16,-66,32,26,'#c9c2a8'); R(tx-13,-63,26,19,'#0a1a0e'); if(D.aplusFace) D.aplusFace(c,tx-12,-62,24,17,'quiet',t,false,0.2); c.fillStyle='#243447'; c.font='600 4px "IBM Plex Sans",sans-serif'; c.fillText('A+  ·  1985–2026',tx,-36); c.fillText('archived with honors',tx,-31); }
    if(b==='MILO\'S'){ const mx=x+40; c.fillStyle='#d9822b'; c.strokeStyle=INK; c.lineWidth=0.8; c.beginPath(); c.ellipse(mx,-41,5,5.5,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(mx+2.5,-47,3.3,0,7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(mx,-49); c.lineTo(mx+0.6,-52.5); c.lineTo(mx+2,-50); c.moveTo(mx+3,-50.2); c.lineTo(mx+4.6,-52.4); c.lineTo(mx+5.3,-48.8); c.fill(); c.stroke(); c.fillStyle='#f2d544'; c.fillRect(mx+3.5,-48,1.2,1.2);
      R(x+90,-60,40,18,'#f6ecd8'); c.fillStyle='#243447'; c.font='700 4px "IBM Plex Sans",sans-serif'; c.fillText('PERMIT #0001',x+110,-54); c.fillText('one taco / bag',x+110,-48); }
    if(b==='SHELTER'){ for(let k=0;k<2;k++){ const dx=x+60+k*50; c.fillStyle=['#b98a55','#e8dcc8'][k]; c.beginPath(); c.ellipse(dx,-40,8,4,0,0,7); c.fill(); c.beginPath(); c.arc(dx+8,-43,3.4,0,7); c.fill(); } } });
  const talking=name=>!!(G.dialog&&(G.dialog.who===name||(G.dialog.pages[G.dialog.i]||'').indexOf(name+':')===0)), gy=()=>0;
  for(const q of s.npcs) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:t,talk:talking(q.def.name)});
  for(const q of G.npcs) if(q.node===G.cur.node&&q.pose) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:t});
  PP.person(c,G.pose,D.HERO_LOOK,{scarf:G.hero.scarf,ground:gy,mode:G.hero.mode,w:G.hero,t:t});
  c.setTransform(V.DPR,0,0,V.DPR,0,0); if(V.quiet) return;
  const tag=(text,wx,wy,bg,fg,bold)=>{ c.font=(bold?'600 ':'500 ')+'12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy; c.fillStyle=bg; rr(c,x-w/2,y-11,w,22,6); c.fill(); c.fillStyle=fg; c.fillText(text,x,y+0.5); };
  for(const q of s.npcs) if(Math.abs(q.w.x-G.hero.x)<120&&!(G.target&&G.target.q===q)) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(16,26,46,.6)','#f6ecd8');
  if(G.target&&!G.dialog&&!G.card){ const T=G.target, y=(T.q?T.q.pose.head.y:-70)-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); }
}
D.ALTS.push({test:(V,G)=>V.camx>38000&&!G.drive,render:renderShow});

/* the shuttle stop, once the night is over */
D.HOOKS.push(function(c,G,now,V){ if(!G.S.done) return; const x=EPI.SHUTTLE; if(x<V.x0-40||x>V.x1+40) return; const y=MAP.nodes.ground.world.yAt(x);
  c.fillStyle='#555b65'; c.fillRect(x-1.5,y-56,3,56); c.fillStyle='#2f6f9f'; c.fillRect(x-18,y-68,36,16); c.fillStyle='#f6ecd8'; c.font='700 4.2px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('SHUTTLE',x,y-63.5); c.fillText('BUYING SHOW',x,y-57.5); });
})(typeof globalThis!=='undefined'?globalThis:this);
