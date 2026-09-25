/* ==== WORLD: draws the campus as a cutaway. Back wall, stairs, (people on stairs), floor slabs, furniture, people, darkness. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME, PP=root.HPEOPLE, FH=MAP.FH, INK=PP.INK;
const CEIL=86, SLAB=12, WY=-28, TOP=MAP.HQ_TOP;     // TOP: the HQ roof level
const HERO_LOOK={skin:'#efc39d',hair:'#4a3626',style:'short',shirt:'#5a5f7a',pants:'#26293a',acc:'glasses',top:'button',bottom:'jeans',shoe:'sneaker',build:{h:1,d:1,belly:0}};
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>v<a?a:(v>b?b:v);
function mixHex(a,b,t){ const h=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)], A=h(a), B=h(b); return 'rgb('+(lerp(A[0],B[0],t)|0)+','+(lerp(A[1],B[1],t)|0)+','+(lerp(A[2],B[2],t)|0)+')'; }
let ctx=null, V=null;
const R=(x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };
const O=(x,y,w,h,c,lw)=>{ ctx.strokeStyle=c||INK; ctx.lineWidth=lw||1; ctx.strokeRect(x,y,w,h); };
const LN=(x0,y0,x1,y1,c,lw)=>{ ctx.strokeStyle=c; ctx.lineWidth=lw||1; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); };
const vis=(x0,x1)=>x1>V.x0&&x0<V.x1;
function hash(s){ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }

/* ---------------- interiors: one band per level ---------------- */
const BANDS=[
 {x0:1100,x1:1900,y:0,node:'ground',style:'office'},{x0:1100,x1:1900,y:-FH,node:'hq_f2',style:'office'},
 {x0:1100,x1:1900,y:FH,node:'hq_b1',style:'basement'},{x0:412,x1:1100,y:FH,node:'hq_b1',style:'tunnel'},
 {x0:412,x1:1528,y:2*FH,node:'tun_2',style:'tunnel'},{x0:1372,x1:1896,y:3*FH,node:'tun_3',style:'cellar'},{x0:1896,x1:2328,y:3*FH,node:'tun_3',style:'machine'},
 {x0:680,x1:900,y:0,node:'ground',style:'garage'},{x0:680,x1:900,y:-FH,node:'gar_loft',style:'loft'},
];
const WALLS={office:['#5b6676','#62606f','#566a68','#6a6258','#5a5f78'],basement:['#474d57','#4d4a52','#434f4e'],tunnel:['#2e2b2a'],cellar:['#3a302a'],machine:['#16261c'],garage:['#55524d'],loft:['#5e554a']};
let SEEN={};
function seen(nodeId,x){ if(nodeId==='hq_b1') return x>=1100||SEEN.t1; if(nodeId==='tun_2') return SEEN.t2; if(nodeId==='tun_3') return SEEN.t3; return true; }
function bandRooms(b){ return MAP.rooms.filter(r=>r.node===b.node&&r.x1>b.x0&&r.x0<b.x1); }

function sky(t,now){
  const g=ctx.createLinearGradient(0,0,0,V.H); g.addColorStop(0,mixHex('#2c4668','#070c18',t)); g.addColorStop(0.62,mixHex('#b9785a','#15213c',t)); g.addColorStop(1,mixHex('#e9a86a','#1c2a4a',t));
  ctx.fillStyle=g; ctx.fillRect(0,0,V.W,V.H);
  ctx.fillStyle='#f6ecd8'; for(let i=0;i<70;i++){ const h=hash('s'+i), x=(h%1000)/1000*V.W, y=((h>>10)%1000)/1000*V.H*0.6; ctx.globalAlpha=clamp(t*1.3-0.2,0,1)*(0.35+0.65*Math.abs(Math.sin(now/900+i))); ctx.fillRect(x,y,1.6,1.6); }
  ctx.globalAlpha=1; const mx=V.W*0.78-V.camx*0.01, my=V.H*(0.30-0.12*t); ctx.fillStyle='rgba(246,236,216,'+(0.25+0.6*t)+')'; ctx.beginPath(); ctx.arc(mx,my,22,0,7); ctx.fill();
  for(let k=0;k<2;k++){ const par=k?0.16:0.08, base=V.H*(k?0.66:0.60)-V.camy*par*V.zoom*0.3; ctx.fillStyle=k?mixHex('#4a4a5c','#0d1424',t):mixHex('#7a6a70','#121b30',t); ctx.beginPath(); ctx.moveTo(0,V.H);
    for(let x=0;x<=V.W+40;x+=40){ const wx=x+V.camx*par*V.zoom; ctx.lineTo(x,base-24*Math.sin(wx*0.004+k*2)-14*Math.sin(wx*0.011+k)); } ctx.lineTo(V.W,V.H); ctx.fill();
    if(k){ ctx.fillStyle='rgba(242,181,68,'+(0.25+0.5*t)+')'; for(let i=0;i<26;i++){ const wx=((hash('t'+i)%4000)-V.camx*par*V.zoom)%(V.W+200); ctx.fillRect(wx<0?wx+V.W+200:wx,base-6-(hash('u'+i)%18),2,2); } } }
}

function earth(){
  const W=MAP.nodes.ground.world, bottom=V.y1+10;
  for(const s of W.s){ if(!vis(s.x0,s.x1)) continue; const x=s.x0-0.3, w=s.w+0.6;
    R(x,s.y,w,bottom-s.y,'#2a2420');
    const grass=s.x1<=548&&s.x0>=60, inHQ=s.x0>=1100&&s.x1<=1900, dock=s.y<-20;
    R(x,s.y,w,grass?5:3.5,grass?'#4f6b3a':(dock?'#7b7f86':'#3a3e47')); if(grass) R(x,s.y+5,w,3,'#3c5230'); }
  R(-900,0,700,bottom,'#2a2420'); R(-900,0,700,5,'#4f6b3a'); R(3500,0,500,bottom,'#1f2c3a'); R(3500,4,500,3,'#3d5a72');             // the canal
  ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=1.2; for(let y=40;y<bottom;y+=46){ ctx.beginPath(); for(let x=Math.floor(V.x0/60)*60;x<V.x1+60;x+=60) ctx.lineTo(x,y+6*Math.sin(x*0.02+y)); ctx.stroke(); }
}

function windowAt(x,y,t){ R(x-23,y-72,46,38,'#23262e'); R(x-21,y-70,42,34,mixHex('#7d7f96','#141d33',t)); R(x-21,y-70,42,5,'rgba(255,255,255,.08)'); LN(x,y-70,x,y-36,'#23262e',1.6); }
function interiors(t){
  for(const b of BANDS){ if(!vis(b.x0,b.x1)||!seen(b.node,b.x0+1)) continue; const top=b.y-CEIL, pal=WALLS[b.style];
    R(b.x0,top,b.x1-b.x0,CEIL,pal[0]);
    for(const r of bandRooms(b)){ const x0=Math.max(r.x0,b.x0), x1=Math.min(r.x1,b.x1); R(x0,top,x1-x0,CEIL,pal[hash(r.name)%pal.length]); }
    if(b.style==='office'||b.style==='basement'||b.style==='loft'||b.style==='garage'){ R(b.x0,b.y-24,b.x1-b.x0,24,'rgba(0,0,0,.16)'); R(b.x0,b.y-25,b.x1-b.x0,1.2,'rgba(255,255,255,.12)'); }
    if(b.style==='office'){ for(let x=b.x0+50;x<b.x1-30;x+=92){ if(x>1540&&x<1740) continue; if(Math.abs(x-1330)<30||(b.y===-FH&&Math.abs(x-1812)<30)) continue; windowAt(x,b.y,t); }
      for(let x=b.x0+70;x<b.x1;x+=140){ if(x>1556&&x<1724) continue; R(x-14,top,28,2.5,'#f6ecd8'); const g=ctx.createLinearGradient(0,top,0,b.y); g.addColorStop(0,'rgba(255,240,200,.16)'); g.addColorStop(1,'rgba(255,240,200,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x-14,top); ctx.lineTo(x+14,top); ctx.lineTo(x+52,b.y); ctx.lineTo(x-52,b.y); ctx.fill(); } }
    if(b.style==='tunnel'||b.style==='cellar'){ for(let x=Math.ceil(b.x0/110)*110;x<b.x1;x+=110){ R(x-5,top,10,CEIL,'rgba(0,0,0,.28)'); R(x-9,top,18,7,'rgba(0,0,0,.28)'); }
      ctx.fillStyle='rgba(255,255,255,.035)'; for(let x=b.x0;x<b.x1;x+=34) for(let k=0;k<3;k++) ctx.fillRect(x+(k%2)*17,top+10+k*26,30,11); }
    if(b.style==='machine'){ ctx.fillStyle='rgba(80,255,140,.05)'; for(let x=b.x0+10;x<b.x1;x+=26) ctx.fillRect(x,top,1.2,CEIL); }
    // room name plates
    ctx.font='600 6px "IBM Plex Sans",system-ui,sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
    for(const r of bandRooms(b)){ if(r.node==='ground'&&(r.x0<b.x0||r.x1>b.x1)) continue; const x=Math.max(r.x0,b.x0)+12, w=ctx.measureText(r.name).width+8; R(x,top+6,w,10,'rgba(16,26,46,.72)'); ctx.fillStyle='#f6ecd8'; ctx.fillText(r.name,x+4,top+11.4); }
  }
  // tunnel stair shafts
  for(const L of MAP.links) if(L.id.indexOf('tun_')===0&&seen(L.lo.node.id,L.lo.x)&&vis(Math.min(L.lo.x,L.hi.x)-60,Math.max(L.lo.x,L.hi.x)+60)){ const yl=L.lo.node.world.yAt(L.lo.x-L.dir), yh=L.hi.node.world.yAt(L.hi.x+L.dir);
    ctx.fillStyle='#2e2b2a'; ctx.beginPath(); ctx.moveTo(L.lo.x-L.dir*10,yl); ctx.lineTo(L.hi.x,yh); ctx.lineTo(L.hi.x,yh-CEIL); ctx.lineTo(L.lo.x-L.dir*10,yl-CEIL-30); ctx.closePath(); ctx.fill(); }
  // HQ stair core and roof bulkhead
  for(const c of MAP.cores) if(vis(c.x0,c.x1)){ R(c.x0,TOP-CEIL,c.x1-c.x0,-TOP+CEIL+FH,'#2c3340'); for(let y=TOP-CEIL+14;y<FH;y+=28) R(c.x0,y,c.x1-c.x0,1,'rgba(255,255,255,.04)');
    for(const m of c.mids){ const s=m.world.s[0]; R(s.x0+2,s.y-CEIL+30,s.w-2,CEIL-30,'rgba(255,255,255,.035)'); R(s.x1-16,s.y-58,10,16,mixHex('#7d7f96','#141d33',t)); } }
}
function doorOpen(i,now){ const p=(now/1000+i*11)%40; const s=x=>x<0?0:(x>1?1:x*x*(3-2*x)); return p<20?0:(p<24?s((p-20)/4):(p<34?1:(p<38?1-s((p-34)/4):0))); }
function warehouseBack(t,now){
  const b=MAP.buildings[2]; if(!vis(b.x0,b.x1)) return; const top=b.top;
  R(b.x0,top,b.x1-b.x0,b.base-top,'#4d5560'); ctx.fillStyle='rgba(0,0,0,.10)'; for(let x=b.x0;x<b.x1;x+=16) ctx.fillRect(x,top,2,b.base-top);
  R(b.x0,b.base-30,b.x1-b.x0,30,'rgba(242,181,68,.10)');
  [[2250,'1'],[2380,'2'],[2960,'7'],[3085,'8']].forEach((d,i)=>{ R(d[0]-36,b.base-78,72,78,'#2d3138'); const o=doorOpen(i,now||0), bot=b.base-2-o*70;
    if(o>0.02){ R(d[0]-33,b.base-74,66,72,'#101318'); R(d[0]-28,b.base-66,56,64,'#d8d2c0'); R(d[0]-28,b.base-66,56,3,'#b9b4a4'); LN(d[0],b.base-66,d[0],b.base-2,'#8a8f98',1.4); R(d[0]-24,b.base-40,6,2,'#6a6f78'); R(d[0]+18,b.base-40,6,2,'#6a6f78'); }
    for(let y=b.base-74;y<bot;y+=8) R(d[0]-33,y,66,Math.min(5,bot-y),'#8d939c'); R(d[0]-9,b.base-94,18,12,'#f2b544'); ctx.fillStyle='#101a2e'; ctx.font='700 9px "IBM Plex Mono",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(d[1],d[0],b.base-87.5); });
  for(let x=2520;x<=2880;x+=120){ for(const u of [x,x+100]) R(u-2,b.cat[2],4,b.base-b.cat[2],'#c2622a'); for(let y=b.base-46;y>b.cat[2]+10;y-=46){ R(x,y,100,4,'#3f6fb0'); const n=hash('bx'+x+y)%3+2; for(let k=0;k<n;k++){ const bw=18+hash('w'+x+y+k)%10; R(x+6+k*30,y-22-(hash('h'+k+y)%8),bw,22+(hash('h'+k+y)%8),['#c9a56a','#b8935a','#d8d2c0'][(k+y)&1?0:(k%3)]); } } }
  for(let x=b.x0+120;x<b.x1;x+=240){ R(x-10,top+4,20,5,'#f6ecd8'); const g=ctx.createLinearGradient(0,top,0,b.base); g.addColorStop(0,'rgba(255,244,210,.13)'); g.addColorStop(1,'rgba(255,244,210,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x-10,top+9); ctx.lineTo(x+10,top+9); ctx.lineTo(x+110,b.base); ctx.lineTo(x-110,b.base); ctx.fill(); }
  // mezzanine rooms have their own back wall
  R(b.mezz[0],b.mezz[2]-CEIL,b.mezz[1]-b.mezz[0],CEIL,'#59606b'); R(2900,b.mezz[2]-CEIL,260,CEIL,'#5e5a52');
  ctx.strokeStyle='rgba(16,26,46,.5)'; ctx.lineWidth=0.8; for(let x=2904;x<3160;x+=9){ ctx.beginPath(); ctx.moveTo(x,b.mezz[2]-CEIL); ctx.lineTo(x,b.mezz[2]); ctx.stroke(); }
  ctx.font='600 6px "IBM Plex Sans",system-ui,sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
  for(const r of MAP.rooms) if((r.node==='wh_mezz'||r.node==='wh_cat'||(r.node==='ground'&&r.x0>=2200&&r.x1<=3160))){ const y=(r.node==='ground'?b.base:(r.node==='wh_mezz'?b.mezz[2]:b.cat[2]))-CEIL+6, w=ctx.measureText(r.name).width+8; R(r.x0+12,y,w,10,'rgba(16,26,46,.72)'); ctx.fillStyle='#f6ecd8'; ctx.fillText(r.name,r.x0+16,y+5.4); }
  // railings behind the walkers
  for(const lv of [b.mezz,b.cat]){ LN(lv[0],lv[2]-30,lv[1],lv[2]-30,'#d9a520',2); for(let x=lv[0];x<=lv[1];x+=40) LN(x,lv[2]-30,x,lv[2],'#d9a520',1.6); }
}

/* ---------------- stairs ---------------- */
function flightShape(L){
  const s=L.world.s, yl=s[L.lo.si].y, yh=s[L.hi.si].y, d=L.dir; ctx.beginPath(); ctx.moveTo(L.lo.x,yl);
  if(d>0) for(let i=1;i<s.length-1;i++){ ctx.lineTo(s[i].x0,s[i].y); ctx.lineTo(s[i].x1,s[i].y); }
  else for(let i=s.length-2;i>=1;i--){ ctx.lineTo(s[i].x1,s[i].y); ctx.lineTo(s[i].x0,s[i].y); }
  ctx.lineTo(L.hi.x,yh); ctx.lineTo(L.hi.x,yh+11); ctx.lineTo(L.lo.x+d*17,yl); ctx.closePath();
}
function flights(){
  for(const L of MAP.links){ const xa=Math.min(L.lo.x,L.hi.x), xb=Math.max(L.lo.x,L.hi.x); if(!vis(xa,xb)||!seen(L.lo.node.id,L.lo.x)) continue;
    const s=L.world.s, yl=s[L.lo.si].y, yh=s[L.hi.si].y, steel=L.id[0]==='w'||L.id[0]==='g', stone=L.id[0]==='t';
    flightShape(L); ctx.fillStyle=steel?'#6d737c':(stone?'#4a4440':'#8e949c'); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle=steel?'#d9a520':(stone?'#6a625a':'#c9ced4'); for(let i=1;i<s.length-1;i++) ctx.fillRect(s[i].x0,s[i].y,s[i].w,1.8);
    if(!stone){ const col=steel?'#d9a520':'#3a4150'; LN(L.lo.x,yl-31,L.hi.x,yh-31,col,2); for(let i=1;i<s.length-1;i+=2){ const x=(s[i].x0+s[i].x1)/2; LN(x,s[i].y,x,s[i].y-31-(L.dir>0?1:-1)*0,col,1.2); } LN(L.lo.x,yl,L.lo.x,yl-31,col,1.6); LN(L.hi.x,yh,L.hi.x,yh-31,col,1.6); } }
  for(const c of MAP.cores) for(const m of c.mids){ const s=m.world.s[0]; if(vis(s.x0,s.x1)){ R(s.x0,s.y,s.w+4,9,'#8e949c'); O(s.x0,s.y,s.w+4,9); R(s.x0,s.y,s.w+4,1.8,'#c9ced4'); } }
}

/* ---------------- slabs, partitions, doors ---------------- */
function structure(G){
  const slab=(x0,x1,y,c)=>{ if(!vis(x0,x1)) return; R(x0,y,x1-x0,SLAB,c||'#252a34'); R(x0,y,x1-x0,2,'#9a9fa8'); };
  slab(1100,1900,-FH); slab(1092,1908,TOP,'#2b2f38'); slab(1100,1900,0,'#252a34'); slab(680,900,-FH,'#3a342c');
  slab(2640,3160,WY-FH,'#3a3f48'); if(vis(2260,3060)){ R(2260,WY-2*FH,800,5,'#555b65'); for(let x=2260;x<3060;x+=6) R(x,WY-2*FH+1,1,4,'rgba(0,0,0,.35)'); R(2260,WY-2*FH,800,1.5,'#d9a520'); }
  // roof: parapets and the stair bulkhead
  if(vis(1090,1910)){ R(1092,TOP-12,6,12,'#2b2f38'); R(1902,TOP-12,6,12,'#2b2f38'); R(1552,TOP-CEIL-6,176,6,'#2b2f38'); R(1552,TOP-CEIL,5,CEIL-74,'#2b2f38'); R(1723,TOP-CEIL,5,CEIL-74,'#2b2f38'); }
  // partitions: a lintel over every doorway
  const lintel=(x,y)=>{ if(vis(x-4,x+4)){ R(x-3,y-CEIL,6,CEIL-74,'#2b303b'); R(x-3,y-74,1.2,74,'rgba(20,24,32,.55)'); R(x+1.8,y-74,1.2,74,'rgba(20,24,32,.55)'); } };
  for(const y of [FH,0,-FH]) for(const x of [1330,1556,1724]) lintel(x,y);
  lintel(1215,0); lintel(1215,-FH); lintel(1812,-FH);                 // the split rooms
  lintel(2900,WY-FH);
  // outer walls, open at the doors
  const wall=(x,top,base,door)=>{ if(vis(x-5,x+5)){ R(x-4,top,8,(door?base-76:base)-top,'#1d222c'); } };
  wall(1100,TOP,0,true); wall(1900,TOP,0,true); wall(1100,0,FH,false); wall(1900,0,FH+SLAB,false);
  wall(680,-2*FH+20,0,true); wall(900,-2*FH+20,0,true); if(vis(670,910)){ ctx.fillStyle='#3a342c'; ctx.beginPath(); ctx.moveTo(668,-2*FH+22); ctx.lineTo(790,-2*FH-16); ctx.lineTo(912,-2*FH+22); ctx.closePath(); ctx.fill(); }
  const wb=MAP.buildings[2]; wall(wb.x0,wb.top,wb.base,true); wall(wb.x1,wb.top,wb.base,true); if(vis(wb.x0,wb.x1)) R(wb.x0-8,wb.top-8,wb.x1-wb.x0+16,10,'#1d222c');
  // low passages: the mass that makes you crawl
  for(const d of MAP.ducts){ if(!vis(d.x0,d.x1)||!seen(d.node,d.x0)) continue; const y=MAP.nodes[d.node].world.yAt(d.x0+1);
    if(d.node==='wh_cat'){ R(d.x0-2,y-CEIL,d.x1-d.x0+4,CEIL-34,'#8a9099'); O(d.x0-2,y-CEIL,d.x1-d.x0+4,CEIL-34); for(let x=d.x0+8;x<d.x1;x+=18) LN(x,y-CEIL,x,y-34,'rgba(0,0,0,.25)',1); }
    else{ ctx.fillStyle='#231f1d'; ctx.beginPath(); ctx.moveTo(d.x0-16,y-CEIL); ctx.lineTo(d.x0,y-36); ctx.lineTo(d.x1,y-34); ctx.lineTo(d.x1+18,y-CEIL); ctx.closePath(); ctx.fill(); LN(d.x0-10,y-60,d.x1+6,y-38,'#5a4632',6); } }
  // locked doors
  for(const g of MAP.gates){ if(!vis(g.x-6,g.x+6)||!seen(g.node,g.x+1)) continue; const y=MAP.nodes[g.node].world.yAt(g.x), h=g.open?12:74, col=g.needs==='badge'?'#51647c':(g.needs==='tunnelkey'?'#6a3f30':'#123a22');
    R(g.x-3.5,y-74,7,h,col); O(g.x-3.5,y-74,7,h); if(g.needs==='tunnelkey'&&!g.open) for(let k=0;k<9;k++) LN(g.x-3.5,y-74+k*8.2,g.x+3.5,y-74+k*8.2,'rgba(0,0,0,.4)',0.8);
    R(g.x-9,y-44,3.5,6,'#1a1d24'); R(g.x-8.2,y-43,2,2,g.open?'#6fe08a':'#e0563a'); }
}

/* ---------------- furniture and scenery ---------------- */
const PROPS={
 desk(x,y){ R(x-20,y-25,40,3,'#8a6a48'); R(x-18,y-22,3,22,'#4a3a2a'); R(x+15,y-22,3,22,'#4a3a2a'); R(x-9,y-43,18,13,'#1a1d24'); R(x-7.5,y-41.5,15,10,'#2f6f9f'); R(x-1.5,y-30,3,5,'#1a1d24'); R(x+22,y-20,10,20,'#30343c'); R(x+21,y-32,12,13,'#3a3f48'); },
 helpdesk(x,y){ R(x-40,y-34,80,34,'#7a3b2a'); R(x-42,y-37,84,4,'#c9a56a'); R(x-20,y-58,40,14,'#101a2e'); ctx.fillStyle='#f2b544'; ctx.font='700 7px "IBM Plex Mono",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('HELP DESK',x,y-50.5); },
 table(x,y){ R(x-38,y-27,76,4,'#6a5038'); R(x-30,y-23,4,23,'#3a2c20'); R(x+26,y-23,4,23,'#3a2c20'); R(x-14,y-31,12,4,'#d8d2c0'); R(x+6,y-32,9,5,'#30343c'); },
 bigscreen(x,y){ R(x-34,y-76,68,40,'#14171d'); R(x-31,y-73,62,34,'#0d2a1a'); ctx.fillStyle='#6fe08a'; ctx.font='600 5px "IBM Plex Mono",monospace'; ctx.textAlign='left'; ctx.textBaseline='top'; ['CUTOVER  T-MINUS','NET .. BKP .. CAT','EDI .. SF .. JOBS'].forEach((s,i)=>ctx.fillText(s,x-28,y-70+i*9)); },
 whiteboard(x,y){ R(x-24,y-72,48,32,'#e9e6dc'); O(x-24,y-72,48,32,'#8a8f98',1.5); LN(x-16,y-62,x+10,y-62,'#c25a3a',1.2); LN(x-16,y-54,x+16,y-54,'#2f6f9f',1.2); LN(x-16,y-47,x+2,y-47,'#2f7f4f',1.2); },
 printer(x,y){ R(x-14,y-30,28,30,'#d8d2c0'); R(x-16,y-40,32,12,'#b9b4a4'); R(x-10,y-46,20,7,'#f6ecd8'); R(x+8,y-36,4,2,'#6fe08a'); },
 plant(x,y){ R(x-6,y-14,12,14,'#7a3b2a'); ctx.fillStyle='#3f7f4f'; for(const a of [-0.9,-0.3,0.3,0.9]){ ctx.beginPath(); ctx.ellipse(x+Math.sin(a)*10,y-24-Math.cos(a)*10,4,13,a,0,7); ctx.fill(); } },
 planter(x,y){ R(x-18,y-12,36,12,'#5a4a3a'); ctx.fillStyle='#3f7f4f'; for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.arc(x+k*7,y-16-(k&1)*4,7,0,7); ctx.fill(); } },
 sofa(x,y){ R(x-26,y-16,52,16,'#3d6b52'); R(x-28,y-30,56,16,'#356048'); R(x-30,y-22,6,22,'#2f5640'); R(x+24,y-22,6,22,'#2f5640'); },
 cabinet(x,y){ R(x-13,y-52,26,52,'#6d737c'); O(x-13,y-52,26,52); for(let k=0;k<4;k++){ LN(x-13,y-52+k*13,x+13,y-52+k*13,INK,1); R(x-4,y-46+k*13,8,2,'#c9ced4'); } },
 case(x,y){ R(x-20,y-10,40,10,'#4a3a2a'); ctx.fillStyle='rgba(180,220,255,.16)'; ctx.fillRect(x-19,y-44,38,34); O(x-19,y-44,38,34,'#c9a56a',1.4); R(x-12,y-22,10,12,'#c9a56a'); R(x+3,y-26,9,16,'#7a3b2a'); },
 portrait(x,y){ R(x-13,y-72,26,32,'#c9a56a'); R(x-10.5,y-69.5,21,27,'#2c3340'); ctx.fillStyle='#f1c9a5'; ctx.beginPath(); ctx.arc(x,y-59,5,0,7); ctx.fill(); R(x-7,y-53,14,10,'#243447'); R(x-12,y-37,24,5,'#101a2e'); ctx.fillStyle='#f2b544'; ctx.font='600 3.6px "IBM Plex Sans",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Since 1938',x,y-34.4); },
 jar(x,y){ R(x-8,y-26,16,3,'#8a6a48'); R(x-2,y-23,4,23,'#4a3a2a'); ctx.fillStyle='rgba(200,230,255,.35)'; ctx.fillRect(x-5,y-38,10,12); R(x-4,y-33,8,7,'#c98b4a'); R(x-5.5,y-40,11,3,'#e63946'); },
 server(x,y){ R(x-14,y-66,28,66,'#14171d'); O(x-14,y-66,28,66,'#3a3f48',1.2); for(let k=0;k<9;k++){ R(x-11,y-62+k*7,22,4.5,'#22262e'); R(x-9,y-61+k*7,2,2,(k*7+x)%3?'#6fe08a':'#f2b544'); R(x-5,y-61+k*7,2,2,'#6fe08a'); } },
 crates(x,y){ R(x-22,y-20,22,20,'#9a7a4a'); O(x-22,y-20,22,20); R(x+2,y-24,24,24,'#8a6a40'); O(x+2,y-24,24,24); R(x-10,y-40,22,20,'#a5854f'); O(x-10,y-40,22,20); },
 shelf(x,y){ R(x-24,y-60,3,60,'#3a3f48'); R(x+21,y-60,3,60,'#3a3f48'); for(let k=0;k<3;k++){ R(x-24,y-20-k*20,48,2.5,'#555b65'); for(let j=0;j<3;j++) R(x-19+j*14,y-32-k*20+((j+k)&1)*3,10,12-((j+k)&1)*3,['#c9a56a','#2f6f9f','#c25a3a'][(j+k)%3]); } },
 safe(x,y){ R(x-16,y-36,32,36,'#30343c'); O(x-16,y-36,32,36); ctx.strokeStyle='#c9ced4'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x,y-18,6,0,7); ctx.stroke(); },
 pipes(x,y){ R(x-70,y-80,140,5,'#5a6a5a'); R(x-70,y-70,140,3.5,'#7a4a3a'); R(x-4,y-80,8,18,'#4a5a4a'); },
 pump(x,y){ R(x-22,y-30,44,30,'#3f5a5a'); O(x-22,y-30,44,30); ctx.fillStyle='#2f4646'; ctx.beginPath(); ctx.arc(x,y-38,12,0,7); ctx.fill(); ctx.stroke(); R(x-2,y-80,4,32,'#5a6a5a'); },
 sacks(x,y){ ctx.fillStyle='#b9a27a'; ctx.strokeStyle=INK; ctx.lineWidth=1; for(const p of [[-16,0],[10,0],[-3,-13]]){ ctx.beginPath(); ctx.ellipse(x+p[0],y-8+p[1],15,8,0,0,7); ctx.fill(); ctx.stroke(); } ctx.fillStyle='#7a3b2a'; ctx.font='700 5px "IBM Plex Mono",monospace'; ctx.textAlign='center'; ctx.fillText('OATS',x-3,y-19); },
 barrel(x,y){ R(x-11,y-30,22,30,'#6a4a30'); O(x-11,y-30,22,30); R(x-11,y-24,22,2.5,'#2a2420'); R(x-11,y-9,22,2.5,'#2a2420'); },
 scale(x,y){ R(x-16,y-5,32,5,'#30343c'); R(x-2,y-52,4,48,'#30343c'); ctx.fillStyle='#e9e6dc'; ctx.strokeStyle=INK; ctx.beginPath(); ctx.arc(x,y-58,10,0,7); ctx.fill(); ctx.stroke(); LN(x,y-58,x+5,y-64,'#c25a3a',1.2); },
 aplus(x,y,now){ R(x-70,y-78,140,78,'#1a1d22'); O(x-70,y-78,140,78,'#3a3f48',1.5); R(x-60,y-70,52,40,'#0a1a0e'); ctx.fillStyle='#6fe08a'; ctx.font='700 13px "IBM Plex Mono",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('A+',x-34,y-54); if(Math.floor(now/500)%2) R(x-20,y-42,6,2,'#6fe08a');
   for(const k of [0,1]){ const cx=x+24+k*30, a=now/700*(k?-1:1); ctx.fillStyle='#2a2e36'; ctx.beginPath(); ctx.arc(cx,y-54,12,0,7); ctx.fill(); ctx.strokeStyle='#8d939c'; ctx.lineWidth=1.2; ctx.stroke(); for(let j=0;j<3;j++) LN(cx,y-54,cx+Math.cos(a+j*2.09)*11,y-54+Math.sin(a+j*2.09)*11,'#8d939c',1.2); }
   for(let k=0;k<10;k++) R(x-60+k*13,y-20,8,4,(Math.floor(now/300)+k)%4?'#1f3a28':'#6fe08a'); },
 term(x,y,now){ R(x-10,y-24,20,3,'#555b65'); R(x-2,y-21,4,21,'#30343c'); R(x-9,y-42,18,17,'#c9c2a8'); R(x-7,y-40,14,11,'#0a1a0e'); ctx.fillStyle='#6fe08a'; for(let k=0;k<3;k++) ctx.fillRect(x-5.5,y-38.5+k*3.2,6+((k*5+Math.floor(now/800))%5),1.2); },
 bench(x,y){ R(x-22,y-14,44,3,'#8a6a48'); R(x-22,y-26,44,3,'#8a6a48'); R(x-18,y-11,3,11,'#30343c'); R(x+15,y-11,3,11,'#30343c'); },
 tree(x,y){ R(x-3,y-46,6,46,'#4a3a2a'); ctx.fillStyle='#2f5a3a'; for(const p of [[0,-66,22],[-14,-52,16],[14,-54,17]]){ ctx.beginPath(); ctx.arc(x+p[0],y+p[1],p[2],0,7); ctx.fill(); } },
 lamp(x,y){ R(x-1.5,y-104,3,104,'#30343c'); R(x-1.5,y-106,20,3,'#30343c'); R(x+10,y-104,10,3,'#f6ecd8'); const g=ctx.createLinearGradient(0,y-101,0,y); g.addColorStop(0,'rgba(255,230,160,.22)'); g.addColorStop(1,'rgba(255,230,160,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x+10,y-101); ctx.lineTo(x+20,y-101); ctx.lineTo(x+62,y); ctx.lineTo(x-32,y); ctx.fill(); },
 tacotruck(x,y){ R(x-52,y-52,104,44,'#e63946'); O(x-52,y-52,104,44); R(x-40,y-46,52,20,'#101a2e'); R(x-44,y-24,60,3,'#f6ecd8'); R(x-54,y-58,108,7,'#f2b544'); ctx.fillStyle='#f6ecd8'; ctx.font='700 8px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText("TINA'S TACOS",x+2,y-14); ctx.fillStyle='#14171d'; for(const k of [-32,32]){ ctx.beginPath(); ctx.arc(x+k,y-6,7,0,7); ctx.fill(); } },
 booth(x,y){ R(x-22,y-64,44,64,'#243447'); O(x-22,y-64,44,64); R(x-16,y-54,32,24,mixHex('#ffe9b0','#ffe9b0',0)); R(x-26,y-70,52,7,'#1b2838'); },
 trailer(x,y){ R(x-70,y-62,140,48,'#d8d2c0'); O(x-70,y-62,140,48); R(x-70,y-40,140,5,'#7a3b2a'); ctx.fillStyle='#101a2e'; ctx.font='700 10px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('PHILLIPS',x,y-50); ctx.fillStyle='#14171d'; for(const k of [-50,-34,44]){ ctx.beginPath(); ctx.arc(x+k,y-7,7,0,7); ctx.fill(); } R(x+52,y-14,4,14,'#30343c'); },
 truckcab(x,y){ R(x-34,y-50,40,40,'#2f6f9f'); O(x-34,y-50,40,40); R(x-28,y-44,20,16,'#101a2e'); R(x+6,y-26,34,16,'#2a5f8a'); ctx.fillStyle='#14171d'; for(const k of [-20,26]){ ctx.beginPath(); ctx.arc(x+k,y-8,8,0,7); ctx.fill(); } },
 pallet(x,y){ R(x-20,y-5,40,5,'#8a6a40'); R(x-18,y-27,17,22,'#c9a56a'); O(x-18,y-27,17,22); R(x+1,y-31,17,26,'#b8935a'); O(x+1,y-31,17,26); },
 rack(){}, 
 pimdesk(x,y){ R(x-20,y-25,40,3,'#8a6a48'); R(x-18,y-22,3,22,'#4a3a2a'); R(x+15,y-22,3,22,'#4a3a2a');
   for(const k of [-10,10]){ R(x+k-9,y-45,18,14,'#1a1d24'); R(x+k-7.5,y-43.5,15,11,'#e9e6dc'); for(let j=0;j<4;j++){ R(x+k-6.5,y-42.2+j*2.6,13,1.3,j?'#b9c4d4':'#5a3a8a'); } }
   R(x-1.5,y-31,3,6,'#1a1d24'); R(x-8,y-28.5,16,2.5,'#30343c'); },
 raft(x,y){ ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.fillStyle='#e0a030'; ctx.beginPath(); ctx.ellipse(x,y-7,26,7,0,0,7); ctx.fill(); ctx.stroke();
   ctx.fillStyle='#2a3a4a'; ctx.beginPath(); ctx.ellipse(x,y-8.5,19,3.4,0,0,7); ctx.fill(); R(x-26,y-8,52,1.6,'#c25a3a');
   ctx.lineCap='round'; LN(x+16,y-2,x+30,y-48,'#8a6a48',2.2); ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.ellipse(x+31,y-51,3,6,0.3,0,7); ctx.fill(); ctx.stroke();
   ctx.fillStyle='#e63946'; ctx.beginPath(); ctx.arc(x-14,y-17,6,Math.PI,0); ctx.fill(); ctx.stroke(); },
 forklift(x,y){ R(x-22,y-30,36,22,'#f2b544'); O(x-22,y-30,36,22); R(x-18,y-56,3,28,'#30343c'); R(x+6,y-56,3,28,'#30343c'); R(x-20,y-58,31,3,'#30343c'); R(x+16,y-60,4,58,'#30343c'); R(x+20,y-6,22,3,'#8d939c'); ctx.fillStyle='#14171d'; for(const k of [-14,8]){ ctx.beginPath(); ctx.arc(x+k,y-6,6.5,0,7); ctx.fill(); } },
 conveyor(x,y){ R(x-60,y-24,120,5,'#555b65'); for(let k=-54;k<60;k+=12) { ctx.fillStyle='#8d939c'; ctx.beginPath(); ctx.arc(x+k,y-24,2.5,0,7); ctx.fill(); } for(const k of [-52,0,52]) R(x+k-2,y-19,4,19,'#30343c'); R(x-30,y-42,18,18,'#c9a56a'); R(x+14,y-40,16,16,'#b8935a'); },
 dish(x,y){ R(x-2,y-30,4,30,'#555b65'); ctx.fillStyle='#d8d2c0'; ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x+4,y-38,16,8,-0.7,0,7); ctx.fill(); ctx.stroke(); },
 antenna(x,y,now){ LN(x,y,x,y-96,'#8d939c',2); LN(x-14,y,x,y-40,'#8d939c',1); LN(x+14,y,x,y-40,'#8d939c',1); for(let k=0;k<4;k++) LN(x-8+k,y-60-k*10,x+8-k,y-60-k*10,'#8d939c',1.2); if(Math.floor(now/700)%2){ ctx.fillStyle='#e0563a'; ctx.beginPath(); ctx.arc(x,y-98,2.2,0,7); ctx.fill(); } },
 hvac(x,y){ R(x-30,y-34,60,34,'#8a9099'); O(x-30,y-34,60,34); for(let k=0;k<6;k++) LN(x-24,y-28+k*5,x+6,y-28+k*5,'rgba(0,0,0,.35)',1); ctx.strokeStyle=INK; ctx.beginPath(); ctx.arc(x+18,y-17,8,0,7); ctx.stroke(); },
 mule(x,y){ ctx.fillStyle='#6a5a4a'; ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y-30,20,10,0,0,7); ctx.fill(); ctx.stroke(); for(const k of [-13,-7,8,14]) R(x+k,y-24,3.5,24,'#5a4a3a'); ctx.beginPath(); ctx.ellipse(x+24,y-44,7,11,0.6,0,7); ctx.fill(); ctx.stroke(); R(x+23,y-62,2.5,10,'#5a4a3a'); R(x+28,y-60,2.5,9,'#5a4a3a'); },
};
function props(now){ for(const p of MAP.props){ if(!vis(p.x-80,p.x+80)||!seen(p.node,p.x)) continue; const f=PROPS[p.type]; if(f) f(p.x,MAP.nodes[p.node].world.yAt(p.x),now,ctx,p); } }

function pickups(G,now){
  const S=G.S, bob=Math.sin(now/300)*1.5;
  for(const it of GM.ITEMS){ if(S.inv[it.id]||!it.show(S)||!vis(it.x-20,it.x+20)) continue; const y=MAP.nodes[it.node].world.yAt(it.x)-30+bob;
    ctx.fillStyle='rgba(242,181,68,.25)'; ctx.beginPath(); ctx.arc(it.x,y,11+bob,0,7); ctx.fill(); R(it.x-6,y-5,12,10,'#f2b544'); O(it.x-6,y-5,12,10); LN(it.x-6,y,it.x+6,y,INK,0.8); }
  GM.PAGES.forEach((pg,i)=>{ if(S.pages[i]||!vis(pg[1]-20,pg[1]+20)||!seen(pg[0],pg[1])) return; const y=MAP.nodes[pg[0]].world.yAt(pg[1])-14+bob*0.6;
    ctx.fillStyle='rgba(246,236,216,.18)'; ctx.beginPath(); ctx.arc(pg[1],y,10,0,7); ctx.fill(); ctx.save(); ctx.translate(pg[1],y); ctx.rotate(-0.18); R(-5,-7,10,13,'#f6ecd8'); O(-5,-7,10,13,'#7a3b2a',0.9); for(let k=0;k<3;k++) LN(-3,-4+k*3.2,3,-4+k*3.2,'#7a3b2a',0.7); ctx.restore(); });
  for(const t of GM.TERMS) if(S.flags.jobsAsked&&!S.terms[t.id]&&vis(t.x-20,t.x+20)){ const y=MAP.nodes[t.node].world.yAt(t.x)-54+bob; ctx.fillStyle='#6fe08a'; ctx.beginPath(); ctx.moveTo(t.x-4,y-6); ctx.lineTo(t.x+4,y-6); ctx.lineTo(t.x,y); ctx.fill(); }
}

/* ---------------- one frame ---------------- */
let darkness=0; const HOOKS=[], BGHOOKS=[], FLOORHOOKS=[];
function render(c,view,G,now,dt){
  ctx=c; V=view; const S=G.S, t=GM.count(S.signoffs)/6*0.7+(S.inv.badge?0.15:0)+(S.done?0.15:0), h=G.hero;
  const on=id=>(G.cur.node&&G.cur.node.id===id)||(G.cur.link&&(G.cur.link.lo.node.id===id||G.cur.link.hi.node.id===id)), found=id=>MAP.rooms.some(r=>r.node===id&&r.dark&&S.rooms[r.id]);
  SEEN={t1:!!S.gates.g_tunnel,t2:found('tun_2')||on('tun_2'),t3:found('tun_3')||on('tun_3')};
  ctx.setTransform(V.DPR,0,0,V.DPR,0,0); sky(t,now); for(const f of BGHOOKS) f(ctx,G,now,V,t);
  const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom; ctx.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  V.x0=V.camx-V.W/2/V.zoom-10; V.x1=V.camx+V.W/2/V.zoom+10; V.y0=V.camy-V.H*0.62/V.zoom; V.y1=V.camy+V.H*0.38/V.zoom;
  earth(); warehouseBack(t,now); interiors(t); props(now); for(const f of FLOORHOOKS) f(ctx,G,now,V); flights();
  const heroBack=!!G.cur.link||(G.cur.node&&G.cur.node.mid), world=G.cur.world;
  const drawHero=()=>{ for(const s of h.shots) PP.treat(ctx,s.x,s.y,s.a,clamp(s.life,0,1)); PP.person(ctx,G.pose,HERO_LOOK,{scarf:h.scarf,ground:x=>world.yAt(x),mode:h.mode,w:h,t:now/1000}); };
  if(heroBack) drawHero();
  structure(G); pickups(G,now);
  const late=/^(11:|12:)\d\d PM|AM/.test(GM.clock(G.S)||''), startled=!!(G.story&&G.story.ap&&G.story.ap.t<2.4);
  const moodOf=q=>q.mood?q.mood.name:(startled&&q.node===G.cur.node?'surprise':(late&&(q.def.id.charCodeAt(0)+q.def.id.length)%3===0?'tired':null));
  for(const q of G.npcs){ if(!vis(q.w.x-40,q.w.x+40)||!q.pose) continue; PP.person(ctx,q.pose,q.def.look,{mood:moodOf(q),ground:x=>q.node.world.yAt(x),mode:q.w.mode,w:q.w,t:now/1000,talk:!!(G.dialog&&(G.dialog.who===q.def.name||(G.dialog.pages[G.dialog.i]||'').indexOf(q.def.name+':')===0))}); }
  const b=G.biscuit; if(vis(b.x-30,b.x+30)) PP.dog(ctx,b.x,MAP.nodes.ground.world.yAt(b.x),b.t,b.run,b.run||h.x>b.x?1:-1);
  for(const f of HOOKS) f(ctx,G,now,V);                  // later stages draw their creatures here
  if(!heroBack) drawHero();

  // darkness underground, with the light you carry
  const wantDark=(G.room&&G.room.dark)?(G.room.name==='A+ Machine Room'?0.4:1):((G.cur.link&&G.cur.link.id.indexOf('tun_')===0)?1:0); darkness+=(wantDark-darkness)*(1-Math.exp(-3*(dt||0.016)));
  ctx.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(darkness>0.01){ const sx=h.x*V.zoom+ox, sy=(h.y-20)*V.zoom+oy, r=150*V.zoom, g=ctx.createRadialGradient(sx,sy,r*0.25,sx,sy,r); g.addColorStop(0,'rgba(255,214,140,'+(0.06*darkness)+')'); g.addColorStop(0.5,'rgba(6,8,14,'+(0.5*darkness)+')'); g.addColorStop(1,'rgba(4,6,10,'+(0.93*darkness)+')'); ctx.fillStyle=g; ctx.fillRect(0,0,V.W,V.H); }

  if(V.quiet) return;
  // name tags, prompts
  const tag=(text,wx,wy,bg,fg,bold)=>{ ctx.font=(bold?'600 ':'500 ')+'12px "IBM Plex Sans",system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; const w=ctx.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy;
    ctx.fillStyle=bg; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x-w/2,y-11,w,22,6); else ctx.rect(x-w/2,y-11,w,22); ctx.fill(); ctx.fillStyle=fg; ctx.fillText(text,x,y+0.5); };
  for(const q of G.npcs) if(q.node===G.cur.node&&Math.abs(q.w.x-h.x)<130&&!(G.target&&G.target.q===q)&&q.pose) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(16,26,46,.6)','#f6ecd8');
  if(G.target&&!G.dialog){ const T=G.target, y=(T.q&&T.q.pose?T.q.pose.head.y:world.yAt(T.x)-70)-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); }
  if(G.stairHint&&!G.dialog&&!G.target){ const s=G.stairHint; tag((s.up?'▲ up':'')+(s.up&&s.down?'    ':'')+(s.down?'▼ down':''),s.x,world.yAt(s.x)-92,'rgba(16,26,46,.78)','#f6ecd8'); }
}
root.HDRAW={render:render,HERO_LOOK:HERO_LOOK,PROPS:PROPS,HOOKS:HOOKS,BGHOOKS:BGHOOKS,FLOORHOOKS:FLOORHOOKS};
})(typeof globalThis!=='undefined'?globalThis:this);
