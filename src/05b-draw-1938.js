/* ==== 1938: draws the feed store yard in sepia, and the full-screen cards any stage can queue. Wraps HDRAW.render. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME, PP=root.HPEOPLE, INK=PP.INK, D=root.HDRAW;
const X=GM.P38.X, clamp=(v,a,b)=>v<a?a:(v>b?b:v);
let ctx=null, V=null;
const R=(x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };
const LN=(x0,y0,x1,y1,c,lw)=>{ ctx.strokeStyle=c; ctx.lineWidth=lw||1; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); };
function hash(s){ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
const ERA_X=-500;                                         // camera west of this: we are in 1938

/* ---------------- scenery ---------------- */
function sack(x,y,label){ ctx.fillStyle='#c9b48a'; ctx.strokeStyle=INK; ctx.lineWidth=0.9; ctx.beginPath(); ctx.ellipse(x,y-7,8,7.5,0,0,7); ctx.fill(); ctx.stroke(); R(x-5,y-8,10,2,'#7a5a3a'); if(label){ ctx.fillStyle='#5a3a24'; ctx.font='700 3.2px Georgia,serif'; ctx.textAlign='center'; ctx.fillText(label,x,y-3.5); } }
function crate(x,y){ R(x-8,y-12,16,12,'#9a7a4a'); ctx.strokeStyle=INK; ctx.lineWidth=0.9; ctx.strokeRect(x-8,y-12,16,12); LN(x-8,y-6,x+8,y-6,'#6a4a2a',0.8); ctx.fillStyle='#f6ecd8'; ctx.fillRect(x-4,y-11,8,3.4); ctx.fillStyle='#3a2a1a'; ctx.font='700 2.4px Georgia,serif'; ctx.textAlign='center'; ctx.fillText('MILLER',x,y-8.6); }
function glow(x,y,now){ const b=Math.sin(now/300)*1.5; ctx.fillStyle='rgba(255,236,190,.28)'; ctx.beginPath(); ctx.arc(x,y,12+b,0,7); ctx.fill(); }
function store(){
  const x0=-2940, x1=-2480, top=-152, mid=(x0+x1)/2;
  R(x0,top,x1-x0,-top,'#b89a6a'); ctx.fillStyle='rgba(0,0,0,.10)'; for(let y=top+6;y<0;y+=7) ctx.fillRect(x0,y,x1-x0,1.2);
  ctx.fillStyle='#7a5a3a'; ctx.beginPath(); ctx.moveTo(x0-18,top+2); ctx.lineTo(mid,top-62); ctx.lineTo(x1+18,top+2); ctx.closePath(); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=1.2; ctx.stroke();
  R(x0+40,top+8,x1-x0-80,26,'#e8dcc0'); ctx.strokeStyle='#3a2a1a'; ctx.strokeRect(x0+40,top+8,x1-x0-80,26); ctx.fillStyle='#3a2a1a'; ctx.font='700 19px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('PHILLIPS FEED',mid,top+22);
  ctx.font='italic 6px Georgia,serif'; ctx.fillText('Purina Chows  ·  Seeds  ·  Harness',mid,top+44);
  for(const wx of [x0+50,x1-110]){ R(wx,-78,60,44,'#243447'); ctx.strokeStyle='#5a3a24'; ctx.lineWidth=2; ctx.strokeRect(wx,-78,60,44); LN(wx+30,-78,wx+30,-34,'#5a3a24',2); LN(wx,-56,wx+60,-56,'#5a3a24',2); ctx.fillStyle='rgba(255,220,150,.18)'; ctx.fillRect(wx+2,-76,56,40); }
  R(X.founder-18,-74,36,74,'#5a3a2a'); ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.strokeRect(X.founder-18,-74,36,74); ctx.fillStyle='#c9a56a'; ctx.beginPath(); ctx.arc(X.founder+10,-36,1.8,0,7); ctx.fill();
  R(x0-20,-92,x1-x0+40,6,'#6a4a2a'); for(let x=x0-16;x<=x1+16;x+=66) R(x,-86,5,86,'#6a4a2a');                       // porch roof and posts
  R(x0-24,-3,x1-x0+48,5,'#8a6a4a'); for(let x=x0-24;x<x1+24;x+=10) R(x,-3,1,5,'rgba(0,0,0,.25)');                   // porch deck
  for(let i=0;i<4;i++) sack(x0+20+i*17,-2); for(let i=0;i<3;i++) sack(x0+28+i*17,-13);
  sack(x1-40,-2); sack(x1-23,-2); sack(x1-31,-13); R(x1+30,-40,4,40,'#5a3a24');                                    // hitching rail
}
function horse(x,now,eating){
  const b=Math.sin(now/600)*0.6, dip=eating?(8+Math.sin(now/180)*2):0;
  ctx.save(); ctx.translate(x,0); ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.fillStyle='#7a5238';
  for(const [lx,ph] of [[-16,0],[-10,1],[14,1],[20,0]]){ R(lx-2,-30,4.5,30,ph?'#6a4630':'#7a5238'); R(lx-2.5,-3,5.5,3,'#2a2420'); }
  ctx.fillStyle='#7a5238'; ctx.beginPath(); ctx.ellipse(2,-36+b,26,12,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18,-40+b); ctx.quadraticCurveTo(-30,-52+dip,-34,-62+dip*1.6); ctx.lineTo(-24,-64+dip*1.4); ctx.quadraticCurveTo(-14,-48,-10,-44+b); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(-36,-60+dip*1.7); ctx.rotate(-0.5+dip*0.05); ctx.beginPath(); ctx.ellipse(-4,0,11,5.2,0,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle=INK; ctx.beginPath(); ctx.arc(-2,-2,0.9,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(-13,1,0.7,0,7); ctx.fill();
  ctx.fillStyle='#7a5238'; ctx.beginPath(); ctx.moveTo(3,-4); ctx.lineTo(5,-10); ctx.lineTo(7,-3); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle='#3a2418'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-14,-46+b); ctx.quadraticCurveTo(-26,-58+dip,-28,-66+dip*1.5); ctx.stroke();
  ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(27,-40+b); ctx.quadraticCurveTo(36,-30,32+Math.sin(now/400)*2,-14); ctx.stroke();
  if(eating){ ctx.fillStyle='#c9b48a'; ctx.beginPath(); ctx.ellipse(-40,-3,7,3,0,0,7); ctx.fill(); }
  ctx.restore();
}
function wagon(x){ ctx.strokeStyle=INK; ctx.lineWidth=1; R(x-34,-30,68,14,'#8a6a40'); ctx.strokeRect(x-34,-30,68,14); for(let k=-30;k<34;k+=12) R(x+k,-30,1.2,14,'rgba(0,0,0,.25)');
  LN(x-34,-22,x-66,-18,'#6a4a2a',2);
  for(const wx of [x-20,x+20]){ ctx.strokeStyle='#3a2418'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.arc(wx,-11,11,0,7); ctx.stroke(); ctx.lineWidth=1; for(let a=0;a<6;a++) LN(wx,-11,wx+Math.cos(a*1.047)*11,-11+Math.sin(a*1.047)*11,'#3a2418',1); } }
function farmhouse(){ const x0=-1060,x1=-650; R(x0,-96,x1-x0,96,'#d8d2c0'); ctx.fillStyle='rgba(0,0,0,.08)'; for(let y=-90;y<0;y+=6) ctx.fillRect(x0,y,x1-x0,1);
  ctx.fillStyle='#5a4a3a'; ctx.beginPath(); ctx.moveTo(x0-14,-94); ctx.lineTo((x0+x1)/2,-146); ctx.lineTo(x1+14,-94); ctx.closePath(); ctx.fill();
  R(x1-60,-150,14,40,'#7a3b2a'); for(const wx of [x0+30,x0+110,x1-100]) { R(wx,-72,34,40,'#243447'); ctx.strokeStyle='#f6ecd8'; ctx.lineWidth=1.6; ctx.strokeRect(wx,-72,34,40); LN(wx+17,-72,wx+17,-32,'#f6ecd8',1.2); }
  R(-930,-66,28,66,'#6a3a2a'); R(x0-10,-60,x1-x0+20,5,'#8a7a6a'); for(let x=x0-6;x<x1+10;x+=60) R(x,-55,4,55,'#8a7a6a'); R(x0-12,-3,x1-x0+24,4,'#9a8a7a'); }
function fence(){ for(let x=-1480;x<-1090;x+=26){ R(x,-32,4,32,'#7a5a3a'); } LN(-1480,-26,-1090,-26,'#7a5a3a',3); LN(-1480,-14,-1090,-14,'#7a5a3a',3);
  for(let x=-620;x<-420;x+=26) R(x,-32,4,32,'#7a5a3a'); LN(-620,-26,-420,-26,'#7a5a3a',3); LN(-620,-14,-420,-14,'#7a5a3a',3); }
function tree(x,s){ R(x-3*s,-48*s,6*s,48*s,'#4a3a2a'); ctx.fillStyle='#4f6b3a'; for(const p of [[0,-70,24],[-16,-54,17],[16,-56,18]]){ ctx.beginPath(); ctx.arc(x+p[0]*s,p[1]*s,p[2]*s,0,7); ctx.fill(); } }
function signpost(x){ R(x-2,-54,4,54,'#6a4a2a'); R(x-2,-52,40,14,'#e8dcc0'); ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=1; ctx.strokeRect(x-2,-52,40,14); ctx.fillStyle='#3a2a1a'; ctx.font='700 6px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('MILLERS  →',x+18,-44.5); }

let founderCache=null;
function render38(c,view,G,now,dt){
  ctx=c; V=view; const P=G.p38, st=G.S.flags.p38|0, rain=!!P&&P.scene==='yard'&&st>=2&&st<5;
  ctx.setTransform(V.DPR,0,0,V.DPR,0,0);
  const g=ctx.createLinearGradient(0,0,0,V.H); g.addColorStop(0,rain?'#5a6068':'#8fb2d0'); g.addColorStop(0.7,rain?'#8a8a88':'#f0d8a8'); g.addColorStop(1,rain?'#9a9890':'#f4e2b8'); ctx.fillStyle=g; ctx.fillRect(0,0,V.W,V.H);
  if(!rain){ ctx.fillStyle='rgba(255,246,220,.9)'; ctx.beginPath(); ctx.arc(V.W*0.8-V.camx*0.01,V.H*0.2,26,0,7); ctx.fill(); }
  for(let k=0;k<2;k++){ const par=k?0.16:0.08, base=V.H*(k?0.64:0.58)-V.camy*par*V.zoom*0.3; ctx.fillStyle=k?'#7a8a5a':'#9aa488'; ctx.beginPath(); ctx.moveTo(0,V.H);
    for(let x=0;x<=V.W+40;x+=40){ const wx=x+V.camx*par*V.zoom; ctx.lineTo(x,base-22*Math.sin(wx*0.004+k*2)-12*Math.sin(wx*0.011+k)); } ctx.lineTo(V.W,V.H); ctx.fill(); }
  const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom; ctx.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  R(-3600,0,3400,900,'#6a5a3a'); R(-3600,0,3400,5,'#7a8a4a'); R(-2300,0,600,5,'#8a7a5a');
  ctx.strokeStyle='#8a9a5a'; ctx.lineWidth=1; for(let x=-3400;x<-300;x+=13){ if(x>-2300&&x<-1700) continue; const hh=3+(hash('g'+x)%5); LN(x,0,x+1.5,-hh,'#8a9a5a',1); }
  tree(-3080,1.1); tree(-2380,0.9); tree(-1300,1.2); tree(-560,1); tree(-460,0.8);
  fence(); farmhouse(); store(); signpost(-1580); wagon(-1850); horse(X.mare,now,st>=2&&st<5&&P&&P.scene==='yard');
  if(P&&P.scene==='yard'){ if(st===0){ glow(X.sack,-8,now); sack(X.sack,0,'OATS'); } if(st===2){ glow(X.order,-40,now); crate(X.order,-30); } }
  // people
  const talking=name=>!!(G.dialog&&(G.dialog.who===name||(G.dialog.pages[G.dialog.i]||'').indexOf(name+':')===0));
  const W38=MAP.nodes.y1938.world, ground=x=>W38.yAt(x);
  if(P){ for(const q of P.npcs){ const kid=q.def.kid; if(kid){ ctx.save(); ctx.translate(q.pose.hip.x,0); ctx.scale(0.72,0.72); ctx.translate(-q.pose.hip.x,0); }
      PP.person(ctx,q.pose,q.def.look,{ground:ground,mode:q.w.mode,w:q.w,t:now/1000,talk:talking(q.def.name),happy:kid&&!talking(q.def.name)}); if(kid) ctx.restore(); } }
  else{ if(!founderCache){ const w=E.createWalker(W38,X.founder+30); w.facing=1; founderCache=E.poseOf(w); } PP.person(ctx,founderCache,GM.P38.PEOPLE.founder.look,{ground:ground,t:now/1000}); }
  const onEra=G.cur.node&&G.cur.node.id==='y1938';
  if(onEra&&!(P&&P.hideHero)){ const h=G.hero; PP.person(ctx,G.pose,GM.P38.HAND,{ground:ground,mode:h.mode,w:h,t:now/1000});
    if(P&&P.carry){ const A=G.pose.arms[1], cx=(A.hx+G.pose.arms[0].hx)/2+h.facing*2, cy=Math.min(A.hy,G.pose.arms[0].hy)-2; if(P.carry==='oats') sack(cx,cy+8,'OATS'); else crate(cx,cy+6); } }
  // sepia: drain the colour, then warm it
  ctx.setTransform(V.DPR,0,0,V.DPR,0,0);
  ctx.globalCompositeOperation='saturation'; ctx.fillStyle='#808080'; ctx.fillRect(0,0,V.W,V.H);
  ctx.globalCompositeOperation='multiply'; ctx.fillStyle=P&&P.scene==='later'?'#e2c89a':'#d9b98a'; ctx.fillRect(0,0,V.W,V.H); ctx.globalCompositeOperation='source-over';
  if(rain){ const rnd=k=>{ const v=Math.sin(k*12.9898)*43758.5453; return v-Math.floor(v); }; ctx.strokeStyle='rgba(235,230,215,.4)'; ctx.lineWidth=1; ctx.lineCap='butt'; ctx.beginPath();
    for(let i=0;i<180;i++){ const sp=0.45+rnd(i+7)*0.3, y=(rnd(i+3)*V.H+now*sp)%(V.H+20)-20, x=((rnd(i)*(V.W+60)-y*0.3)%(V.W+60)+V.W+60)%(V.W+60)-30; ctx.moveTo(x,y); ctx.lineTo(x-4,y+13); } ctx.stroke(); }
  const vg=ctx.createRadialGradient(V.W/2,V.H/2,Math.min(V.W,V.H)*0.35,V.W/2,V.H/2,Math.max(V.W,V.H)*0.75); vg.addColorStop(0,'rgba(40,24,10,0)'); vg.addColorStop(1,'rgba(40,24,10,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,V.W,V.H);
  if(V.quiet||!P) return;
  const tag=(text,wx,wy,bg,fg,bold)=>{ ctx.font=(bold?'600 ':'500 ')+'12px \"IBM Plex Sans\",system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; const w=ctx.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy;
    ctx.fillStyle=bg; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x-w/2,y-11,w,22,6); else ctx.rect(x-w/2,y-11,w,22); ctx.fill(); ctx.fillStyle=fg; ctx.fillText(text,x,y+0.5); };
  if(P.scene==='yard') for(const q of P.npcs) if(Math.abs(q.w.x-G.hero.x)<130&&!(G.target&&G.target.q===q)) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(40,28,16,.6)','#f6ecd8');
  if(G.target&&!G.dialog&&!G.card){ const T=G.target, y=(T.q?T.q.pose.head.y:(T.act==='mare'?-80:-44))-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); }
}

/* ---------------- full-screen cards ---------------- */
function drawCard(c,view,G){
  const k=G.card; if(!k) return; if(k.style&&D.drawCardStyle&&D.drawCardStyle(c,view,G,k)) return; const a=clamp(Math.min(k.t/0.5,(k.dur-k.t)/0.5),0,1); ctx=c; V=view;
  ctx.setTransform(V.DPR,0,0,V.DPR,0,0); ctx.globalAlpha=Math.max(a,0.001); ctx.fillStyle='#1c140c'; ctx.fillRect(0,0,V.W,V.H);
  const small=k.title.length>18, fs=small?Math.min(34,V.W/18):Math.min(64,V.W/7);
  ctx.fillStyle='#f0e0c0'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=(small?'italic ':'700 ')+fs+'px Georgia,"Times New Roman",serif';
  ctx.fillText(k.title,V.W/2,V.H/2-(k.sub?14:0));
  if(k.sub){ ctx.font='500 '+Math.min(16,V.W/28)+'px "IBM Plex Sans",system-ui,sans-serif'; ctx.fillStyle='#c9b48a'; ctx.fillText(k.sub,V.W/2,V.H/2+fs*0.55+6); }
  ctx.font='500 11px "IBM Plex Sans",system-ui,sans-serif'; ctx.fillStyle='rgba(240,224,192,.45)'; ctx.fillText(V.touch?'tap to continue':'E or Space to continue',V.W/2,V.H-30);
  ctx.globalAlpha=1;
}

const baseRender=D.render;
D.render=function(c,view,G,now,dt){ if(view.camx<ERA_X) render38(c,view,G,now,dt); else baseRender(c,view,G,now,dt); drawCard(c,view,G); };
D.ERA_X=ERA_X;
})(typeof globalThis!=='undefined'?globalThis:this);
