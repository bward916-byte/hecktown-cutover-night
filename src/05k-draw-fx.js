/* ==== FX: the small moving things. Moths at the lot lamps, dust in the office light, fireflies over the dog park,
   steam off the taco truck and the rooftop unit, dust under running feet, points that float up when you earn them,
   a soft vignette. Also everything the Help Desk queue shows: ticket markers, the fix needle, the part you carry. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, FH=MAP.FH, CEIL=86;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
function hash(s){ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
const FIX=[]; for(const y of [0,-FH]) for(let x=1170;x<1900;x+=140) if(!(x>1556&&x<1724)) FIX.push({x:x,y:y});
const LAMPS=MAP.props.filter(p=>p.type==='lamp').map(p=>({x:p.x+15,node:p.node}));
const MOTES=[]; for(let i=0;i<FIX.length*7;i++){ const h=hash('m'+i); MOTES.push({f:FIX[i%FIX.length],a:(h%628)/100,r:6+(h>>4)%30,s:0.15+((h>>9)%40)/100,y:(h>>13)%70}); }
const FLIES=[]; for(let i=0;i<16;i++){ const h=hash('f'+i); FLIES.push({x:70+(h%470),p:(h>>5)%628/100,s:0.3+((h>>9)%50)/100,h:10+(h>>12)%34}); }
const puffs=[], pops=[], sparks=[];
let gh=null, ghT=0, lastT=0, campus=0, runAcc=0, lastX=0, lastPts=null, lastSave=null, OX=0, OY=0;

function nightOf(S){ return GM.count(S.signoffs)/6*0.7+(S.inv.badge?0.15:0)+(S.done?0.15:0); }
function vis(V,a,b){ return b>V.x0&&a<V.x1; }
function rr(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); }

/* ---- ticket markers ---- */
function icon(c,kind,col){ c.strokeStyle=col; c.fillStyle=col; c.lineWidth=1.5; c.lineCap='round';
  if(kind==='Fix'){ c.beginPath(); c.moveTo(-3,3); c.lineTo(1.5,-1.5); c.stroke(); c.beginPath(); c.arc(2.6,-2.6,2.3,0.6,4.6); c.stroke(); }
  else if(kind==='Help'){ c.font='700 9px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',0,0.6); }
  else if(kind==='Take'){ c.strokeRect(-3.2,-2.4,6.4,5.4); c.beginPath(); c.moveTo(-3.2,-0.4); c.lineTo(3.2,-0.4); c.stroke(); }
  else{ c.beginPath(); c.moveTo(0,-3.4); c.lineTo(0,2.4); c.moveTo(-2.6,0); c.lineTo(0,3); c.lineTo(2.6,0); c.stroke(); } }
function tickets(c,G,T,V){ const TK=GM.TICKETS; if(!TK) return; const S=G.S;
  for(const sp of TK.openSpots(S)){ const n=MAP.nodes[sp.node]; if(!n||!vis(V,sp.x-30,sp.x+30)) continue; const gy=n.world.yAt(sp.x), near=G.cur.node===n&&Math.abs(G.hero.x-sp.x)<40, bob=Math.sin(T*3+sp.x)*2.2, crowd=G.npcs.some(q=>q.node===n&&Math.abs(q.w.x-sp.x)<18), y=gy-74+bob-(crowd?13:0);
    c.save(); c.globalCompositeOperation='lighter'; const pr=(T*0.9+sp.x*0.01)%1, g=c.createRadialGradient(sp.x,gy,1,sp.x,gy,26); g.addColorStop(0,'rgba(255,122,89,.30)'); g.addColorStop(1,'rgba(255,122,89,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(sp.x,gy,26,4.5,0,0,7); c.fill();
    c.strokeStyle='rgba(255,150,110,'+(0.6*(1-pr)).toFixed(3)+')'; c.lineWidth=1; c.beginPath(); c.ellipse(sp.x,gy,6+pr*22,1.2+pr*3.4,0,0,7); c.stroke(); c.restore();
    c.strokeStyle='rgba(255,122,89,.35)'; c.lineWidth=0.8; c.setLineDash([2,3]); c.beginPath(); c.moveTo(sp.x,y+9); c.lineTo(sp.x,gy-3); c.stroke(); c.setLineDash([]);
    if(D.coverAt) D.coverAt(sp.x,y); c.save(); c.translate(sp.x,y); const s=near?1.15:1; c.scale(s,s); c.fillStyle='rgba(0,0,0,.25)'; rr(c,-8.2,-7.2,17,16,4); c.fill();
    c.fillStyle='#ff7a59'; rr(c,-8.5,-8,17,16,4); c.fill(); c.fillStyle='rgba(255,255,255,.22)'; rr(c,-8.5,-8,17,6,4); c.fill(); c.fillStyle='#ff7a59'; c.beginPath(); c.moveTo(-3,7.6); c.lineTo(0,11.5); c.lineTo(3,7.6); c.fill();
    icon(c,sp.label,'#2a1410'); c.restore(); }
  const q=TK.tk(S); if(q.carry&&G.pose){ const h=G.hero, hy=G.pose.hip?G.pose.hip.y:h.y-30; c.fillStyle='#c9a36a'; c.fillRect(h.x+h.facing*7-4,hy-9,8,7); c.strokeStyle='#3a2a1a'; c.lineWidth=0.8; c.strokeRect(h.x+h.facing*7-4,hy-9,8,7); c.fillStyle='#ff7a59'; c.fillRect(h.x+h.facing*7-4,hy-6.4,8,1.6); }
  if(G.fix){ const h=G.hero; if(Math.random()<0.5) sparks.push({x:h.x+h.facing*12,y:h.y-30-Math.random()*8,vx:(Math.random()-0.3)*h.facing*40,vy:-20-Math.random()*40,t:0,l:0.35+Math.random()*0.3,c:'255,220,140'}); }
  if(G.tkFx&&G.tkFx.t<0.05&&!G.tkFx.done){ G.tkFx.done=1; for(let i=0;i<26;i++){ const a=i/26*6.283, sp=40+Math.random()*70; sparks.push({x:G.tkFx.x,y:G.tkFx.y-36,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-30,t:0,l:0.6+Math.random()*0.5,c:i%3?'255,190,90':(i%2?'111,224,138':'255,255,255')}); } } }

/* ---- the world layer (drawn with the cast, in world space) ---- */
function world(c,G,now,V){ if(!G||!G.S||!G.hero||!V) return; const T=now/1000, dt=clamp(T-lastT,0,0.05); lastT=T; campus=now; const S=G.S, h=G.hero, night=clamp(nightOf(S),0,1), gW=MAP.nodes.ground.world;
  OX=V.W/2-V.camx*V.zoom; OY=V.H*0.62-V.camy*V.zoom;
  c.save(); c.globalCompositeOperation='lighter';
  // dust in the cones of the office lights
  for(const m of MOTES){ const f=m.f; if(!vis(V,f.x-50,f.x+50)) continue; const yy=(m.y+T*4*m.s*6)%72, x=f.x+Math.sin(T*m.s+m.a)*m.r*(0.3+yy/90), y=f.y-CEIL+8+yy; c.fillStyle='rgba(255,240,205,'+(0.10+0.16*Math.abs(Math.sin(T*0.7+m.a))).toFixed(3)+')'; c.fillRect(x,y,0.9,0.9); }
  // moths at the lot lamps, once it gets dark
  if(night>0.15) for(const l of LAMPS){ if(!vis(V,l.x-40,l.x+40)) continue; const y=MAP.nodes[l.node].world.yAt(l.x)-102; for(let i=0;i<4;i++){ const a=T*(2.1+i*0.7)+i*1.9, x=l.x+Math.cos(a)*(7+i*3)+Math.sin(T*5.3+i)*2, yy=y+Math.sin(a*1.3)*(5+i*2)+4; c.fillStyle='rgba(255,236,200,'+(0.5*night+0.2).toFixed(3)+')'; c.fillRect(x,yy,1.3,1.3); if(Math.sin(T*30+i)>0) c.fillRect(x-1,yy-0.6,3.3,0.6); } }
  // fireflies over the grass
  if(night>0.1&&vis(V,60,548)) for(const f of FLIES){ const x=f.x+Math.sin(T*f.s+f.p)*26, y=gW.yAt(clamp(x,62,546))-f.h+Math.sin(T*f.s*1.7+f.p*2)*7, a=Math.max(0,Math.sin(T*1.4*f.s+f.p*3)); if(a<0.05) continue; const g=c.createRadialGradient(x,y,0,x,y,5); g.addColorStop(0,'rgba(210,255,140,'+(0.75*a*Math.min(1,night*2)).toFixed(3)+')'); g.addColorStop(1,'rgba(210,255,140,0)'); c.fillStyle=g; c.fillRect(x-5,y-5,10,10); }
  c.restore();
  // steam: the taco truck's flat-top, the rooftop unit
  for(const st of [{x:598,y:gW.yAt(598)-52,n:5,w:5},{x:1440,y:MAP.nodes.hq_roof.world.yAt(1440)-34,n:6,w:9}]){ if(!vis(V,st.x-40,st.x+40)) continue;
    for(let i=0;i<st.n;i++){ const ph=((T*0.28+i/st.n)%1), x=st.x+Math.sin(ph*5+i*2)*st.w*(0.4+ph)+ph*10, y=st.y-ph*46, r=3+ph*9; c.fillStyle='rgba(235,235,240,'+(0.16*(1-ph)*Math.min(1,ph*6)).toFixed(3)+')'; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); } }
  // dust under running feet
  if(G.cur.node&&h.mode==='run'){ runAcc+=Math.abs(h.x-lastX); if(runAcc>26){ runAcc=0; puffs.push({x:h.x-h.facing*8,y:G.cur.world.yAt(h.x)-1,t:0,v:-h.facing*(8+Math.random()*10)}); } } else runAcc=0; lastX=h.x;
  for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i]; p.t+=dt; if(p.t>0.55){ puffs.splice(i,1); continue; } const k=p.t/0.55; c.fillStyle='rgba(220,210,195,'+(0.22*(1-k)).toFixed(3)+')'; c.beginPath(); c.ellipse(p.x+p.v*k,p.y-3*k,3+7*k,1.6+3*k,0,0,7); c.fill(); }
  tickets(c,G,T,V);
  c.save(); c.globalCompositeOperation='lighter'; for(let i=sparks.length-1;i>=0;i--){ const p=sparks[i]; p.t+=dt; if(p.t>p.l){ sparks.splice(i,1); continue; } p.vy+=160*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; c.fillStyle='rgba('+p.c+','+(1-p.t/p.l).toFixed(3)+')'; c.fillRect(p.x-0.8,p.y-0.8,1.6,1.6); } c.restore();
}
/* ---- the A+ machine room: cabinets of blinking lights behind the old machine, cable drooping in from the tray, bits rising off it ---- */
const CAB=[1978,2014,2214,2250,2286];
function machineRoom(c,G,now,V){ const N=G&&G.cur&&G.cur.node; if(!N||N.id!=='tun_3'||!vis(V,1896,2328)) return; const T=now/1000, W=MAP.nodes.tun_3.world, fy=W.yAt(2100), top=fy-CEIL;
  c.fillStyle='#0c1410'; c.fillRect(1900,top+7,424,3.5); c.strokeStyle='#0a0f0c'; c.lineWidth=1.3;
  for(let i=0;i<9;i++){ const x0=1915+i*46, x1=2120+(i-4)*5, sag=10+(i%3)*5; c.beginPath(); c.moveTo(x0,top+10); c.quadraticCurveTo((x0+x1)/2,top+10+sag,x1,top+16+sag*0.4); c.stroke(); }
  for(const x of CAB){ c.fillStyle='#0b120e'; c.fillRect(x,fy-74,30,74); c.fillStyle='#16221a'; c.fillRect(x+2,fy-72,26,70); c.fillStyle='rgba(255,255,255,.04)'; c.fillRect(x+2,fy-72,26,2);
    for(let r=0;r<9;r++){ c.fillStyle='#0d1711'; c.fillRect(x+4,fy-68+r*7.4,22,5);
      for(let k=0;k<5;k++){ const h=(x*31+r*17+k*7)%97, on=Math.sin(T*(1.5+h%5)+h)>((h%4)-1.5)*0.4, amber=h%11===0; c.fillStyle=on?(amber?'#ffb347':'#6fe08a'):'#1d3324'; c.fillRect(x+6+k*4,fy-66.5+r*7.4,2,2); } } }
  c.save(); c.globalCompositeOperation='lighter';
  for(const x of CAB){ const g=c.createLinearGradient(0,fy-10,0,fy); g.addColorStop(0,'rgba(111,224,138,0)'); g.addColorStop(1,'rgba(111,224,138,.10)'); c.fillStyle=g; c.fillRect(x-4,fy-10,38,10); }
  const pulse=0.5+0.5*Math.sin(T*1.7), gg=c.createRadialGradient(2120,fy-40,4,2120,fy-40,120); gg.addColorStop(0,'rgba(111,224,138,'+(0.10+0.08*pulse).toFixed(3)+')'); gg.addColorStop(1,'rgba(111,224,138,0)'); c.fillStyle=gg; c.fillRect(2000,fy-CEIL,240,CEIL);
  c.font='700 5px "IBM Plex Mono",monospace'; c.textAlign='center'; for(let i=0;i<14;i++){ const ph=((T*0.22+i/14)%1), x=2076+((i*37)%90)+Math.sin(T+i)*3, y=fy-18-ph*62; c.fillStyle='rgba(111,224,138,'+(0.55*(1-ph)*Math.min(1,ph*5)).toFixed(3)+')'; c.fillText('01+A'[(i+Math.floor(T*2))%4],x,y); }
  c.restore(); }
if(D.FLOORHOOKS) D.FLOORHOOKS.push(machineRoom);
if(D.HOOKS) D.HOOKS.push(world);

/* ---- the screen layer ---- */
let vg=null, vgKey='';
function screen(c,V,G,now,dt){ if(!G||!G.S||!G.hero||!V) return; const W=V.W, H=V.H, S=G.S, onCampus=now-campus<100, h=G.hero;
  c.setTransform(V.DPR,0,0,V.DPR,0,0);
  const key=W+'x'+H; if(key!==vgKey){ vgKey=key; vg=c.createRadialGradient(W/2,H*0.52,Math.min(W,H)*0.42,W/2,H*0.52,Math.hypot(W,H)*0.62); vg.addColorStop(0,'rgba(4,7,14,0)'); vg.addColorStop(1,'rgba(4,7,14,.42)'); }
  c.fillStyle=vg; c.fillRect(0,0,W,H);
  if(lastSave!==S){ lastSave=S; lastPts=S.points; pops.length=0; }
  if(V.quiet||G.card||G.drive||G.board){ lastPts=S.points; return; }
  if(S.points>lastPts){ const d=S.points-lastPts, sx=onCampus?h.x*V.zoom+OX:W/2, sy=onCampus?(h.y-78)*V.zoom+OY:H*0.42; pops.push({n:d,x:sx,y:sy-pops.length*22,t:0}); }
  lastPts=S.points;
  for(let i=pops.length-1;i>=0;i--){ const p=pops[i]; p.t+=dt||0.016; if(p.t>1.5){ pops.splice(i,1); continue; } const k=p.t/1.5, a=Math.min(1,p.t*8)*(1-Math.max(0,k-0.6)/0.4), big=p.n>=40, y=p.y-(1-Math.pow(1-k,3))*46, sc=1+0.5*Math.max(0,1-p.t*6);
    c.save(); c.translate(p.x,y); c.scale(sc,sc); c.globalAlpha=a; c.font='700 '+(big?26:19)+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='rgba(11,18,32,.85)'; c.strokeText('+'+p.n,0,0); c.fillStyle=big?'#6fe08a':'#f2b544'; c.fillText('+'+p.n,0,0); c.restore(); }
  const TK=GM.TICKETS; if(!TK||!onCampus) return;
  if(G.fix){ const f=G.fix, z=TK.zone(f), p=TK.needle(f), bw=Math.min(220,W*0.5), bx=clamp(h.x*V.zoom+OX-bw/2,10,W-bw-10), by=Math.max(96,(h.y-92)*V.zoom+OY-30), inZ=p>=z[0]&&p<=z[1];
    c.fillStyle='rgba(11,18,32,.88)'; rr(c,bx-10,by-26,bw+20,58,8); c.fill();
    c.font='600 12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f6ecd8'; c.fillText((V.touch?'Tap the big button':'Press E')+' when the needle is in the green',bx+bw/2,by-12,bw+8);
    c.fillStyle='rgba(246,236,216,.16)'; rr(c,bx,by+4,bw,14,7); c.fill(); c.fillStyle=inZ?'#8dffa6':'#4fbf6c'; rr(c,bx+z[0]*bw,by+4,(z[1]-z[0])*bw,14,7); c.fill();
    c.fillStyle='#fff'; rr(c,bx+p*bw-2,by,4,22,2); c.fill(); if(inZ){ c.strokeStyle='rgba(141,255,166,.8)'; c.lineWidth=2; rr(c,bx-10,by-26,bw+20,58,8); c.stroke(); } return; }
  if(G.dialog||!G.cur.node) return;
  // the main line: a green arrow toward the next step, or toward the stairs that lead to it
  ghT-=(dt||0.016); if(ghT<=0){ ghT=0.2; const HK=root.__hecktown, on=!(HK&&HK.opts&&HK.opts().guide===false); gh=on&&GM.GUIDE?GM.GUIDE.hop(G):null; }
  if(gh){ const sx=gh.x*V.zoom+OX, w=G.cur.world, pulse=0.7+0.3*Math.sin(now/240);
    if(sx<34||sx>W-34){ const left=sx<34, x=left?26:W-26, y=H*0.4; c.globalAlpha=pulse; c.fillStyle='#6fe08a'; c.beginPath(); c.arc(x,y,15,0,7); c.fill(); c.fillStyle='#0f2a18'; c.beginPath(); if(left){ c.moveTo(x-7,y); c.lineTo(x+4,y-7); c.lineTo(x+4,y+7); } else { c.moveTo(x+7,y); c.lineTo(x-4,y-7); c.lineTo(x-4,y+7); } c.fill(); c.globalAlpha=1; }
    else if(!(G.target&&Math.abs(G.target.x-gh.x)<30)&&!(G.stairHint&&!gh.here&&Math.abs(G.stairHint.x-gh.x)<40)){ const gx=clamp(gh.x,w.hx0,w.hx1), y=(w.yAt(gx)-(gh.here?92:104))*V.zoom+OY+Math.sin(now/200)*3, txt=gh.here?'':(gh.stairs<0?'stairs up':'stairs down');
      c.font='600 11px "IBM Plex Sans",system-ui,sans-serif'; const tw=txt?c.measureText(txt).width+10:0, bw=22+tw; c.globalAlpha=pulse; c.fillStyle='#6fe08a'; rr(c,sx-bw/2,y-10,bw,20,10); c.fill(); c.beginPath(); c.moveTo(sx-5,y+9.5); c.lineTo(sx,y+15); c.lineTo(sx+5,y+9.5); c.fill();
      c.fillStyle='#0f2a18'; c.beginPath(); const ax=sx-bw/2+11; if(gh.here||gh.stairs>0){ c.moveTo(ax-4,y-3); c.lineTo(ax+4,y-3); c.lineTo(ax,y+4); } else { c.moveTo(ax-4,y+3); c.lineTo(ax+4,y+3); c.lineTo(ax,y-4); } c.fill();
      if(txt){ c.textAlign='left'; c.textBaseline='middle'; c.fillText(txt,ax+8,y+0.5); } c.globalAlpha=1; } }
  // an orange arrow at the edge of the screen for an open ticket on this floor
  let best=null, bd=900; for(const sp of TK.openSpots(S)) if(sp.node===G.cur.node.id){ const d=Math.abs(sp.x-h.x); if(d<bd){ bd=d; best=sp; } }
  if(best){ const sx=best.x*V.zoom+OX; if(sx<-10||sx>W+10){ const left=sx<0, x=left?26:W-26, y=H*0.4+38, a=0.65+0.25*Math.sin(now/260); c.globalAlpha=a; c.fillStyle='#ff7a59'; c.beginPath(); c.arc(x,y,15,0,7); c.fill(); c.fillStyle='#2a1410'; c.beginPath(); if(left){ c.moveTo(x-7,y); c.lineTo(x+4,y-7); c.lineTo(x+4,y+7); } else { c.moveTo(x+7,y); c.lineTo(x-4,y-7); c.lineTo(x-4,y+7); } c.fill(); c.globalAlpha=1; } }
}
const base=D.render;
D.render=function(c,V,G,now,dt){ base(c,V,G,now,dt); screen(c,V,G,now,dt); };
})(typeof globalThis!=='undefined'?globalThis:this);
