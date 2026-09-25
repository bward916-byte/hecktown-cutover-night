/* ==== THE FUTURE, drawn. 2060: the HQ lobby as a museum, glass and light strips, drones, A+ in a case. 3270: the orbital DC,
   Earth in the window, a hologram A+ the size of the room, robot pickers, a cat in a helmet. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, PP=root.HPEOPLE, INK=PP.INK, FU=GM.FUTURE;
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const rnd=k=>{ const v=Math.sin(k*12.9898+78.233)*43758.5453; return v-Math.floor(v); };
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
function cat(c,x,y,t,helmet){ c.save(); c.translate(x,y); c.strokeStyle=INK; c.lineWidth=0.8; c.fillStyle='#d9822b'; c.beginPath(); c.ellipse(-1,-5.5,5.5,6,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(2.8,-12,3.6,0,7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0.2,-13.8); c.lineTo(1,-17.5); c.lineTo(2.6,-15); c.moveTo(3.4,-15); c.lineTo(5,-17.5); c.lineTo(5.8,-13.6); c.fill(); c.stroke(); c.fillStyle='#f2d544'; c.beginPath(); c.arc(4.4,-12.4,0.8,0,7); c.fill();
  c.strokeStyle='#d9822b'; c.lineWidth=1.8; c.beginPath(); c.moveTo(-5,-2); c.quadraticCurveTo(-12,-6,-10+Math.sin(t*3)*1.5,-12); c.stroke();
  if(helmet){ c.strokeStyle='rgba(200,230,255,.8)'; c.lineWidth=0.9; c.fillStyle='rgba(200,230,255,.18)'; c.beginPath(); c.arc(2.8,-12.5,6.5,0,7); c.fill(); c.stroke(); } c.restore(); }
function portalRing(c,x,y,t,col){ c.save(); c.globalCompositeOperation='lighter'; for(let k=0;k<5;k++){ const r=12+k*8; c.strokeStyle='rgba('+col+','+(0.6-k*0.1)+')'; c.lineWidth=2; c.beginPath(); c.ellipse(x,y,r*0.55,r,Math.sin(t*2+k)*0.2,0,7); c.stroke(); }
  const g=c.createRadialGradient(x,y,0,x,y,46); g.addColorStop(0,'rgba(255,255,255,.8)'); g.addColorStop(0.4,'rgba('+col+',.4)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(x,y,26,46,0,0,7); c.fill(); c.restore(); }
function people(c,G,T){ const f=FU.fut(G), talking=name=>!!(G.dialog&&(G.dialog.who===name||(G.dialog.pages[G.dialog.i]||'').indexOf(name+':')===0)), gy=()=>0;
  for(const q of f.npcs) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:T,talk:talking(q.def.name)});
  PP.person(c,G.pose,D.HERO_LOOK,{scarf:G.hero.scarf,ground:gy,mode:G.hero.mode,w:G.hero,t:T}); }
function tags(c,G,V,ox,oy){ if(V.quiet) return; const f=FU.fut(G);
  const tag=(text,wx,wy,bg,fg,bold)=>{ c.font=(bold?'600 ':'500 ')+'12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy; c.fillStyle=bg; rr(c,x-w/2,y-11,w,22,6); c.fill(); c.fillStyle=fg; c.fillText(text,x,y+0.5); };
  for(const q of f.npcs) if(q.pose&&Math.abs(q.w.x-G.hero.x)<130&&!(G.target&&G.target.q===q)) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(16,26,46,.6)','#f6ecd8');
  if(G.target&&!G.dialog&&!G.card){ const T=G.target, y=(T.q&&T.q.pose?T.q.pose.head.y:(T.act==='aplus'?-120:-64))-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); } }

function render2060(c,V,G,now){ const t=now/1000, N=MAP.nodes.y2060, x0=N.x0, W=V.W, H=V.H;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#c9c4ee'); g.addColorStop(0.6,'#f2d6e6'); g.addColorStop(1,'#ffe9d0'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let k=0;k<3;k++){ const par=0.06+k*0.05, base=H*(0.5+k*0.06); c.fillStyle=['rgba(120,110,170,.18)','rgba(120,110,170,.28)','rgba(90,80,140,.5)'][k]; for(let i=0;i<14;i++){ const bx=((i*230+rnd(i+k*9)*120-V.camx*par*V.zoom)%(W+300)+W+300)%(W+300)-150, bw=40+rnd(i+3)*60, bh=60+rnd(i+7)*(120+k*80); c.fillRect(bx,base-bh,bw,bh); c.fillStyle=k===2?'rgba(255,240,220,.15)':'rgba(255,255,255,.1)'; for(let yy=base-bh+8;yy<base;yy+=12) c.fillRect(bx+4,yy,bw-8,2); c.fillStyle=['rgba(120,110,170,.18)','rgba(120,110,170,.28)','rgba(90,80,140,.5)'][k]; } }
  for(let i=0;i<4;i++){ const dx=((t*(30+i*8)+i*400-V.camx*0.2*V.zoom)%(W+200))-100, dy=H*(0.12+i*0.06)+Math.sin(t*1.5+i)*8; c.fillStyle='#3a3e47'; c.fillRect(dx-6,dy,12,4); c.fillStyle='rgba(58,62,71,.6)'; for(const k of [-9,9]){ c.beginPath(); c.ellipse(dx+k,dy-1,6,1.4,0,0,7); c.fill(); } c.fillStyle='#f2b544'; c.fillRect(dx-3,dy+4,6,3); }   // delivery drones
  const ox=W/2-V.camx*V.zoom, oy=H*0.62-V.camy*V.zoom; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  R(x0-400,0,2400,600,'#dcd8ea'); R(x0-400,0,2400,3,'#8a84b8'); for(let x=x0-400;x<x0+2000;x+=60) R(x,0,30,600,'rgba(255,255,255,.25)');
  R(x0-20,-190,1540,190,'rgba(255,255,255,.35)'); for(let x=x0;x<x0+1520;x+=110){ R(x,-186,3,186,'rgba(120,110,170,.35)'); R(x+8,-176,92,150,'rgba(200,220,255,.28)'); }
  R(x0-20,-192,1540,3,'#7fe0a0'); c.fillStyle='rgba(127,224,160,.18)'; c.fillRect(x0-20,-189,1540,10);
  R(x0+560,-150,420,26,'#2b2f45'); c.fillStyle='#7fe0a0'; c.font='700 12px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS PET  ·  HQ LOBBY  ·  MUSEUM OF THE CUTOVER',x0+770,-137);
  // the A+ exhibit: the old monster asleep in a glass case on a plinth
  R(x0+470,-16,100,16,'#8a84b8'); c.fillStyle='rgba(200,230,255,.22)'; c.fillRect(x0+476,-120,88,104); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.2; c.strokeRect(x0+476,-120,88,104);
  if(D.aplusMonster) D.aplusMonster(c,x0+520,-16,0.78,t,'quiet',{dir:-1,sleep:true});
  R(x0+486,-6,68,-8+14,'#f6ecd8'); c.fillStyle='#243447'; c.font='700 4px "IBM Plex Sans",sans-serif'; c.fillText('A+  ·  1985–2026  ·  SHIPPED ON TIME',x0+520,-9); c.fillText('please do not tap the glass, it taps back',x0+520,-4);
  // a poster for Aaron's whitewater outfit, a plaque for Bret's password
  R(x0+1000,-120,90,50,'#2f6f9f'); c.fillStyle='#f6ecd8'; c.font='700 7px "IBM Plex Sans Condensed",sans-serif'; c.fillText('AARON\'S WHITEWATER',x0+1045,-108); c.font='600 5px "IBM Plex Sans",sans-serif'; c.fillText('Class IV since 2026  ·  pick your line early',x0+1045,-96); c.strokeStyle='#e0563a'; c.lineWidth=3; c.beginPath(); c.moveTo(x0+1010,-82); c.quadraticCurveTo(x0+1045,-70,x0+1080,-84); c.stroke();
  R(x0+1250,-110,70,30,'#c9a56a'); c.fillStyle='#243447'; c.font='700 4.2px "IBM Plex Sans",sans-serif'; c.fillText('THE BRET PLAQUE',x0+1285,-102); c.font='500 3.6px "IBM Plex Sans",sans-serif'; c.fillText('"Is your screen locked?"  ·  still asked nightly',x0+1285,-95);
  cat(c,x0+800,0,t,false); portalRing(c,x0+40,-44,t,'200,130,255'); portalRing(c,x0+1440,-44,t,'120,255,140');
  people(c,G,t); c.setTransform(V.DPR,0,0,V.DPR,0,0); tags(c,G,V,ox,oy); }

function render3270(c,V,G,now){ const t=now/1000, N=MAP.nodes.y3270, x0=N.x0, W=V.W, H=V.H;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.fillStyle='#050812'; c.fillRect(0,0,W,H);
  c.fillStyle='#f6ecd8'; for(let i=0;i<120;i++){ const sx=((rnd(i)*W*2-V.camx*0.02*V.zoom)%(W)+W)%W, sy=rnd(i+5)*H*0.7; c.globalAlpha=0.4+0.6*Math.abs(Math.sin(t*(0.5+rnd(i+9))+i)); c.fillRect(sx,sy,1.5,1.5); } c.globalAlpha=1;
  { const ex=W*0.78-V.camx*0.03*V.zoom, ey=H*0.22, r=Math.min(W,H)*0.16; const g=c.createRadialGradient(ex-r*0.4,ey-r*0.4,r*0.2,ex,ey,r); g.addColorStop(0,'#5aa0e0'); g.addColorStop(0.7,'#2f6f9f'); g.addColorStop(1,'#123a5e'); c.fillStyle=g; c.beginPath(); c.arc(ex,ey,r,0,7); c.fill();
    c.fillStyle='rgba(120,180,90,.7)'; c.beginPath(); c.ellipse(ex-r*0.2,ey-r*0.1,r*0.45,r*0.3,0.6,0,7); c.fill(); c.beginPath(); c.ellipse(ex+r*0.35,ey+r*0.3,r*0.25,r*0.2,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(ex,ey-r*0.5,r*0.5,r*0.12,0.3,0,7); c.fill(); }   // Earth
  const ox=W/2-V.camx*V.zoom, oy=H*0.62-V.camy*V.zoom; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  R(x0-400,0,2400,600,'#1a2030'); R(x0-400,0,2400,3,'#3a4a6a'); for(let x=x0-400;x<x0+2000;x+=40) R(x,0,20,600,'rgba(255,255,255,.03)');
  R(x0-20,-240,1540,50,'#232a3c'); R(x0-20,-192,1540,4,'#4a5a7a'); for(let x=x0;x<x0+1520;x+=180){ R(x-4,-190,8,190,'#2c3446'); R(x-1,-190,2,190,'rgba(127,224,160,.5)'); }   // window mullions
  c.fillStyle='rgba(20,40,70,.35)'; c.fillRect(x0-20,-190,1540,190);
  // racks that pick themselves, a hologram A+, the airlock
  for(let rx=x0+900;rx<x0+1220;rx+=110){ for(const u of [rx,rx+90]) R(u-2,-140,4,140,'#3a4a6a'); for(let y=-40;y>-140;y-=45){ R(rx,y,90,3,'#7fe0a0'); for(let k=0;k<3;k++) R(rx+6+k*28,y-18+Math.sin(t*2+k+y)*2,20,18,['#c9a56a','#8a84b8','#d8d2c0'][k]); } }
  { const hx=x0+1300, pulse=0.75+0.25*Math.sin(t*2); c.save(); c.globalAlpha=0.85*pulse; if(D.aplusMonster) D.aplusMonster(c,hx,-2,2.2,t,G.dialog&&G.dialog.who==='A+'?'smug':'talk',{dir:-1,talk:!!(G.dialog&&G.dialog.who==='A+')}); c.restore();
    c.strokeStyle='rgba(127,224,160,.5)'; c.lineWidth=1; for(let y=-230;y<0;y+=6) { c.beginPath(); c.moveTo(hx-60,y); c.lineTo(hx+60,y); c.stroke(); } R(hx-30,-4,60,4,'#7fe0a0'); c.fillStyle='#7fe0a0'; c.font='700 6px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('A+  ·  ORBITAL  ·  SINCE 1985',hx,-236); }
  R(x0+10,-150,60,150,'#2c3446'); c.strokeStyle='#7fe0a0'; c.lineWidth=1.5; c.strokeRect(x0+16,-144,48,144); c.fillStyle='#f6ecd8'; c.font='700 6px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('AIRLOCK · HOME',x0+40,-156);
  // Biscuit-9000
  { const bx=x0+700; c.save(); c.translate(bx,0); c.strokeStyle=INK; c.lineWidth=0.9; c.fillStyle='#8d939c'; c.beginPath(); c.ellipse(0,-8,11,4.6,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(11,-12,4,0,7); c.fill(); c.stroke(); c.fillStyle='#e0563a'; c.beginPath(); c.arc(13,-12.5,1,0,7); c.fill(); for(const k of [-7,-3,4,8]) R(k-1,-6,2,6,'#555b65'); c.fillStyle='#7fe0a0'; c.font='700 3px "IBM Plex Mono",monospace'; c.fillText('BISCUIT-9000',0,-16); c.restore(); }
  cat(c,x0+800,0,t,true); portalRing(c,x0+40,-44,t,'200,130,255');
  people(c,G,t); c.setTransform(V.DPR,0,0,V.DPR,0,0); tags(c,G,V,ox,oy); }
D.ALTS.push({test:(V,G)=>V.camx>FU.F2060-1000&&V.camx<FU.F2060+3000&&!G.drive,render:render2060});
D.ALTS.push({test:(V,G)=>V.camx>FU.F3270-1000&&V.camx<FU.F3270+3000&&!G.drive,render:render3270});
})(typeof globalThis!=='undefined'?globalThis:this);
