/* ==== THE NETWORK, drawn: each DC with its own sky and trouble, the Phillips truck, the route board, and the drive. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, PP=root.HPEOPLE, INK=PP.INK, NET=GM.NET, X=NET.X;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v), rnd=k=>{ const v=Math.sin(k*12.9898+78.233)*43758.5453; return v-Math.floor(v); };
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const LOOK={
  taunton:{sky:['#7a8494','#c4c8cc'],hill:'#6a7478',amp:14,fx:'fog'}, spartanburg:{sky:['#3a4450','#7a8088'],hill:'#3f5a3a',amp:26,fx:'rain'},
  plantcity:{sky:['#e08a5a','#f6d0a0'],hill:'#4f6b3a',amp:6,fx:'water',palms:true}, lansing:{sky:['#a8b4c4','#e4e8ee'],hill:'#d8dce4',amp:10,fx:'snow'},
  billings:{sky:['#d89a6a','#f2d4a8'],hill:'#8a6a5a',amp:70,fx:'wind'}, portland:{sky:['#5a6a70','#9aa8a8'],hill:'#2f4a3a',amp:44,fx:'rain',pines:true},
  sacramento:{sky:['#d8704a','#f2c088'],hill:'#8a7a4a',amp:18,fx:'none'}, aurora:{sky:['#1c2a4a','#d88a6a'],hill:'#5a5a78',amp:80,fx:'snow'},
  merge:{sky:['#1a1f2a','#3a4050'],hill:'#2a2e38',amp:8,fx:'fog'} };

function truck(c,x,y,dir,t){ c.save(); c.translate(x,y); c.scale(dir,1); c.strokeStyle=INK; c.lineWidth=1;
  c.fillStyle='#f6f2e8'; c.fillRect(-44,-44,62,36); c.strokeRect(-44,-44,62,36); c.fillStyle='#f2b544'; c.fillRect(-44,-20,62,4);
  c.fillStyle='#101a2e'; c.font='700 9px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS',-13,-32);
  c.fillStyle='#2f6f9f'; c.beginPath(); c.moveTo(18,-8); c.lineTo(18,-36); c.lineTo(32,-36); c.lineTo(40,-22); c.lineTo(40,-8); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#9ad0f0'; c.beginPath(); c.moveTo(22,-32); c.lineTo(31,-32); c.lineTo(36,-23); c.lineTo(22,-23); c.closePath(); c.fill(); c.fillStyle='#f6ecd8'; c.fillRect(38,-15,2.5,3);
  c.fillStyle='#14171d'; for(const k of [-30,-12,28]){ c.beginPath(); c.arc(k,-7,7,0,7); c.fill(); c.fillStyle='#8d939c'; c.beginPath(); c.arc(k,-7,2.5,0,7); c.fill(); c.fillStyle='#14171d'; } c.restore(); }
function dog(c,x,y,col,t,moving,face){ c.save(); c.translate(x,y); c.scale(face,1); const b=moving?Math.sin(t*20)*1:0, lg=moving?Math.sin(t*20)*3:0; c.strokeStyle=INK; c.lineWidth=0.8; c.fillStyle=col;
  c.lineWidth=2.4; c.strokeStyle=col; for(const k of [[-6,lg],[-3,-lg],[5,-lg],[7,lg]]){ c.beginPath(); c.moveTo(k[0],-7+b); c.lineTo(k[0]+k[1]*0.4,0); c.stroke(); }
  c.lineWidth=0.8; c.strokeStyle=INK; c.beginPath(); c.ellipse(1,-9+b,9,4.4,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(10,-13+b,3.8,0,7); c.fill(); c.stroke(); c.fillStyle=INK; c.beginPath(); c.arc(13,-12+b,0.8,0,7); c.fill();
  c.strokeStyle=col; c.lineWidth=1.8; c.beginPath(); c.moveTo(-8,-10+b); c.quadraticCurveTo(-13,-14,-12+Math.sin(t*9)*2,-18); c.stroke(); c.fillStyle='#2f6f9f'; c.fillRect(6,-12+b,3,3); c.restore(); }

/* ---------------- a DC ---------------- */
function renderDC(c,V,G,now,dt){
  const d=G.cur.node.dc||NET.DCS.find(z=>Math.abs(V.camx-(z.x0+900))<1500), L=LOOK[d.id], S=G.S, t=now/1000, x0=d.x0, done=!!S.flags['dc_'+d.id], n=NET.net(G);
  c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,0,0,V.H); g.addColorStop(0,L.sky[0]); g.addColorStop(1,L.sky[1]); c.fillStyle=g; c.fillRect(0,0,V.W,V.H);
  for(let k=0;k<2;k++){ const par=k?0.16:0.08, base=V.H*(k?0.64:0.56)-V.camy*par*V.zoom*0.3; c.fillStyle=k?L.hill:'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(0,V.H);
    for(let x=0;x<=V.W+30;x+=30){ const wx=x+V.camx*par*V.zoom; const peak=L.amp>40?Math.abs(Math.sin(wx*0.003+k))*L.amp*(k?0.7:1):L.amp*Math.sin(wx*0.004+k*2); c.lineTo(x,base-peak-8*Math.sin(wx*0.013+k)); } c.lineTo(V.W,V.H); c.fill(); if(k===0){ c.fillStyle=L.hill; c.globalAlpha=0.35; c.fill(); c.globalAlpha=1; } }
  const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  const R=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
  if(L.palms) for(const px of [x0+60,x0+470,x0+1840]){ R(px-2,-70,4,70,'#6a5038'); c.fillStyle='#3f7f4f'; for(let a=0;a<6;a++){ c.beginPath(); c.ellipse(px+Math.cos(a)*12,-72+Math.sin(a)*5,14,3.5,a,0,7); c.fill(); } }
  if(L.pines) for(const px of [x0+40,x0+300,x0+1830,x0+1900]){ c.fillStyle='#24402e'; c.beginPath(); c.moveTo(px,-110); c.lineTo(px-22,-8); c.lineTo(px+22,-8); c.closePath(); c.fill(); R(px-2,-8,4,8,'#4a3a2a'); }
  R(x0-700,0,3200,900,'#2a2420'); R(x0-700,0,3200,4,d.id==='lansing'||d.id==='aurora'?'#e8ecf2':'#3a3e47');
  // the DC: back wall, racks, dock doors, sign, outer walls
  const top=-150; R(x0+X.wall0,top,X.wall1-X.wall0,-top,d.id==='merge'?'#3a3a40':'#4d5560'); c.fillStyle='rgba(0,0,0,.10)'; for(let x=x0+X.wall0;x<x0+X.wall1;x+=16) c.fillRect(x,top,2,-top);
  for(const dx of [1100,1250,1600]){ R(x0+dx-30,-76,60,76,'#2d3138'); for(let y=-72;y<-2;y+=8) R(x0+dx-27,y,54,5,'#8d939c'); }
  for(let rx=x0+1330;rx<x0+1560;rx+=110){ for(const u of [rx,rx+90]) R(u-2,-120,4,120,'#c2622a'); for(let y=-40;y>-120;y-=40){ R(rx,y,90,3.5,'#3f6fb0'); for(let k=0;k<3;k++) R(rx+6+k*28,y-18,20,18,['#c9a56a','#b8935a','#d8d2c0'][(k+y/40)&1?0:k%3]); } }
  R(x0+X.wall0-8,top-10,X.wall1-X.wall0+16,12,'#1d222c'); R(x0+X.wall0,top+6,260,20,d.id==='merge'?'#5a2a2a':'#243447'); c.fillStyle='#f6ecd8'; c.font='700 10px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='left'; c.textBaseline='middle';
  c.fillText(d.id==='merge'?'CENTRAL PET  ·  LEGACY DC':'PHILLIPS PET  ·  '+d.name.toUpperCase(),x0+X.wall0+10,top+16.5);
  R(x0+X.wall0-4,top,8,top*-1-80,'#1d222c'); R(x0+X.wall1-4,top,8,-top,'#1d222c');
  // the door and the terminal
  const dx=x0+X.door; if(!done){ R(dx-4,-76,8,76,'#51647c'); c.strokeStyle=INK; c.lineWidth=1; c.strokeRect(dx-4,-76,8,76); R(dx-10,-46,3.5,6,'#1a1d24'); R(dx-9.2,-45,2,2,'#e0563a'); } else { R(dx-4,-76,8,12,'#51647c'); R(dx-10,-46,3.5,6,'#1a1d24'); R(dx-9.2,-45,2,2,'#6fe08a'); }
  const tx=x0+X.term; R(tx-10,-24,20,3,'#555b65'); R(tx-2,-21,4,21,'#30343c'); R(tx-9,-42,18,17,'#c9c2a8'); R(tx-7,-40,14,11,'#0a1a0e'); c.fillStyle='#6fe08a'; c.font='700 3px "IBM Plex Mono",monospace'; c.textAlign='center'; c.fillText(done?'ARCHIVED':'A+ >_',tx,-35); c.fillText(done?'thank you':'LOCKED',tx,-31);
  // the job out front
  if(d.task==='readers') X.scans.forEach((sx,k)=>{ const ok=!!S.flags['dc_'+d.id+'_'+k], x=x0+sx; R(x-1.5,-34,3,34,'#30343c'); R(x-6,-44,12,12,'#1a1d24'); R(x-4,-42,8,8,ok?'#6fe08a':(Math.floor(t*2+k)%2?'#e0563a':'#7a2a22'));
    if(!ok){ c.fillStyle='rgba(242,181,68,.22)'; c.beginPath(); c.arc(x,-38,10+Math.sin(t*3)*1.5,0,7); c.fill(); } });
  if(d.task==='hold'){ const p=S.flags['dc_'+d.id+'_hold']?1:clamp(n.hold/15,0,1), px=x0+X.pad; c.fillStyle='rgba(111,224,138,'+(0.15+0.25*p)+')'; c.beginPath(); c.ellipse(px,0.5,30,4,0,0,7); c.fill(); c.strokeStyle='#6fe08a'; c.lineWidth=1.5; c.beginPath(); c.ellipse(px,0.5,30,4,0,0,Math.PI*2*p); c.stroke();
    R(px-1.5,-60,3,60,'#30343c'); R(px-14,-72,28,12,'#0a1a0e'); c.fillStyle='#6fe08a'; c.font='700 4px "IBM Plex Mono",monospace'; c.fillText('GO-LIVE '+Math.round(p*100)+'%',px,-65); }
  if(d.belts){ R(x0+300,-3,500,3,'#555b65'); c.fillStyle='rgba(242,181,68,.6)'; for(let k=0;k<25;k++){ const bx=x0+300+((k*20-t*40)%500+500)%500; c.beginPath(); c.moveTo(bx+4,-2.8); c.lineTo(bx,-1.5); c.lineTo(bx+4,-0.2); c.fill(); } }
  if(L.fx==='water'){ c.fillStyle='rgba(60,110,150,.45)'; c.fillRect(x0+200,-1.5-Math.sin(t*0.4)*0.8,700,3.5); }
  truck(c,x0+X.truck,0,1,t);
  if(n.dogs) for(const g of n.dogs) dog(c,g.x,0,g.col,g.t,g.follow&&!g.home,g.follow?(G.hero.x>g.x?1:-1):1);
  // people
  const talking=name=>!!(G.dialog&&(G.dialog.who===name||(G.dialog.pages[G.dialog.i]||'').indexOf(name+':')===0)), gy=()=>0;
  for(const q of n.locals) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:t,talk:talking(q.def.name)});
  for(const q of G.npcs) if(q.node===G.cur.node&&q.pose) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:t,talk:talking(q.def.name)});
  PP.person(c,G.pose,D.HERO_LOOK,{scarf:G.hero.scarf,ground:gy,mode:G.hero.mode,w:G.hero,t:t});
  // weather, in screen space
  c.setTransform(V.DPR,0,0,V.DPR,0,0);
  if(L.fx==='rain'){ c.strokeStyle='rgba(210,220,235,.35)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<200;i++){ const y=(rnd(i+3)*V.H+now*0.6*(0.8+rnd(i)*0.4))%V.H, x=(rnd(i)*V.W+now*0.02)%V.W; c.moveTo(x,y); c.lineTo(x-4,y+13); } c.stroke(); }
  if(L.fx==='snow'){ c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<140;i++){ const y=(rnd(i+3)*V.H+now*0.04*(0.6+rnd(i)))%V.H, x=(rnd(i)*V.W+Math.sin(now/900+i)*20)%V.W; c.fillRect(x,y,2,2); } }
  if(L.fx==='fog'){ const f=c.createLinearGradient(0,V.H*0.3,0,V.H); f.addColorStop(0,'rgba(210,214,220,0)'); f.addColorStop(1,'rgba(210,214,220,.45)'); c.fillStyle=f; c.fillRect(0,0,V.W,V.H); }
  if(d.wind){ const gust=Math.abs(n.gust||0); c.strokeStyle='rgba(255,246,220,'+(0.15+0.4*gust)+')'; c.lineWidth=1.2; c.beginPath(); for(let i=0;i<30;i++){ const y=rnd(i)*V.H*0.9, x=V.W-((now*0.5*(1+gust*2)+rnd(i+5)*V.W*2)%(V.W+200)); c.moveTo(x,y); c.lineTo(x+30+gust*40,y); } c.stroke(); }
  if(V.quiet) return;
  const tag=(text,wx,wy,bg,fg,bold)=>{ c.font=(bold?'600 ':'500 ')+'12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy;
    c.fillStyle=bg; rr(c,x-w/2,y-11,w,22,6); c.fill(); c.fillStyle=fg; c.fillText(text,x,y+0.5); };
  for(const q of n.locals.concat(G.npcs.filter(q=>q.node===G.cur.node))) if(q.pose&&Math.abs(q.w.x-G.hero.x)<130&&!(G.target&&G.target.q===q)) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(16,26,46,.6)','#f6ecd8');
  if(G.target&&!G.dialog&&!G.card){ const T=G.target, y=(T.q&&T.q.pose?T.q.pose.head.y:-70)-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); }
}
D.ALTS.push({test:(V,G)=>V.camx>6000&&!G.drive,render:renderDC});

/* ---------------- the truck at home ---------------- */
D.HOOKS.push(function(c,G,now,V){ if(!G.S.flags.network) return; const x=NET.TRUCK_E; if(x<V.x0-60||x>V.x1+60) return; truck(c,x,MAP.nodes.ground.world.yAt(x),1,now/1000); });

/* ---------------- the drive ---------------- */
function renderDrive(c,V,G,now){
  const v=G.drive, to=v.to==='easton'?NET.EASTON:NET.byId(v.to), L=LOOK[v.to]||{sky:['#2c4668','#e9a86a'],hill:'#4a4a5c',amp:20}, t=now/1000, W=V.W, H=V.H, sp=W*0.55;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,L.sky[0]); g.addColorStop(1,L.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let k=0;k<2;k++){ const base=H*(k?0.62:0.55), s=(k?0.5:0.2)*sp; c.fillStyle=k?L.hill:'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W+30;x+=30){ const wx=x+v.t*s; c.lineTo(x,base-(L.amp>40?Math.abs(Math.sin(wx*0.004+k))*L.amp:L.amp*Math.sin(wx*0.006+k))-10*Math.sin(wx*0.017)); } c.lineTo(W,H); c.fill(); }
  const ry=H*0.72; c.fillStyle='#2a2e36'; c.fillRect(0,ry,W,H*0.16); c.fillStyle='#f2b544'; for(let x=-((v.t*sp)%80);x<W;x+=80) c.fillRect(x,ry+H*0.08,40,3); c.fillStyle='#3a3e47'; c.fillRect(0,ry+H*0.16,W,H);
  // mile signs roll past
  for(let k=0;k<3;k++){ const sx=W-((v.t*sp*0.9+k*W*0.5)%(W*1.5)); c.fillStyle='#2f7f4f'; c.fillRect(sx,ry-60,70,26); c.fillStyle='#f6ecd8'; c.font='700 11px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.fillText(to.name.split(',')[0].toUpperCase(),sx+35,ry-49); c.font='600 10px "IBM Plex Mono",monospace'; c.fillText(Math.max(0,Math.round(v.miles*(1-v.t/v.dur)))+' mi',sx+35,ry-38); c.fillStyle='#555b65'; c.fillRect(sx+33,ry-34,4,34); }
  const tx=W*0.3, shake=(v.shake||0)*Math.sin(t*60)*3;
  for(const hl of v.holes){ const hx=tx+(hl.t-v.t)*sp; if(hx<-40||hx>W+40) continue; c.fillStyle='#14161a'; c.beginPath(); c.ellipse(hx,ry+H*0.05,22,4,0,0,7); c.fill(); }
  c.save(); c.translate(tx,ry+H*0.05-v.hop*2+shake); c.scale(2.2,2.2); truck(c,0,0,1,t); c.restore();
  const crew=NET.crewList(G);
  c.fillStyle='rgba(16,26,46,.78)'; rr(c,W/2-170,24,340,52,8); c.fill(); c.fillStyle='#f2b544'; c.font='700 15px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle';
  c.fillText((v.from==='easton'?'EASTON':(NET.byId(v.from)||{name:'?'}).name.split(',')[0].toUpperCase())+'  →  '+to.name.toUpperCase(),W/2,42);
  c.fillStyle='rgba(246,236,216,.2)'; c.fillRect(W/2-150,58,300,5); c.fillStyle='#f2b544'; c.fillRect(W/2-150,58,300*clamp(v.t/v.dur,0,1),5);
  c.fillStyle='rgba(246,236,216,.6)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText((V.touch?'Jump':'Space')+' hops potholes  ·  '+(V.touch?'Use':'E')+' honks'+(crew.length?'  ·  crew: '+crew.map(q=>q.def.name).join(', '):''),W/2,H-30);
}
D.ALTS.push({test:(V,G)=>!!G.drive,render:renderDrive});

/* ---------------- the route board ---------------- */
function renderBoard(c,V,G){
  const B=G.board; if(!B) return; const W=V.W, H=V.H, S=G.S; c.setTransform(V.DPR,0,0,V.DPR,0,0); c.fillStyle='rgba(8,12,22,.9)'; c.fillRect(0,0,W,H);
  const pw=Math.min(W-40,760), ph=Math.min(H*0.55,360), px=(W-pw)/2, py=Math.max(60,H*0.12); c.fillStyle='#101a2e'; rr(c,px,py,pw,ph,10); c.fill(); c.strokeStyle='rgba(246,236,216,.15)'; c.lineWidth=1; for(let k=1;k<8;k++){ c.beginPath(); c.moveTo(px+pw*k/8,py); c.lineTo(px+pw*k/8,py+ph); c.stroke(); }
  const P=s=>[px+30+(s.lon+125)/58*(pw-60),py+24+(49-s.lat)/24*(ph-48)];
  const sel=NET.STOPS[B.sel], cur=NET.STOPS.find(s=>s.id===B.from), [cx,cy]=P(cur), [sx,sy]=P(sel);
  c.strokeStyle='rgba(242,181,68,.7)'; c.setLineDash([6,6]); c.lineWidth=2; c.beginPath(); c.moveTo(cx,cy); c.quadraticCurveTo((cx+sx)/2,Math.min(cy,sy)-40,sx,sy); c.stroke(); c.setLineDash([]);
  for(const s of NET.STOPS){ const [x,y]=P(s), done=s.id==='easton'||S.flags['dc_'+s.id], on=s===sel; c.fillStyle=s.id==='easton'?'#f2b544':(done?'#6fe08a':'#e0563a'); c.beginPath(); c.arc(x,y,on?8:6,0,7); c.fill();
    if(on){ c.strokeStyle='#f6ecd8'; c.lineWidth=2; c.beginPath(); c.arc(x,y,13,0,7); c.stroke(); } c.fillStyle=on?'#f6ecd8':'rgba(246,236,216,.7)'; c.font=(on?'700 ':'500 ')+'11px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText(s.name.replace(', ',' · ').split(' · ')[0],x,y-(on?18:14)); }
  const need=sel.id==='easton'?'':(S.flags['dc_'+sel.id]?'Back on the network.':'Lockout needs '+(sel.id==='merge'?'Jose, Umesh, Ash or Dave':GM.PEOPLE.find(p=>p.id===sel.needs[0]).name)+'. '+(NET.crewList(G).some(q=>sel.needs.indexOf(q.def.id)>=0)?'They\'re in your crew.':'Not in your crew yet.'));
  c.fillStyle='#f2b544'; c.font='700 20px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText(sel.id===B.from?sel.name+'  (you are here)':sel.name,W/2,py+ph+34);
  c.fillStyle='#f6ecd8'; c.font='500 13px "IBM Plex Sans",sans-serif'; c.fillText(sel.loc+(need?'  ·  '+need:''),W/2,py+ph+58);
  c.fillStyle='rgba(246,236,216,.55)'; c.font='500 12px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'Drag left or right to choose  ·  Use to drive  ·  Jump to close':'←  →  choose  ·  E drive  ·  Space close',W/2,H-28);
  c.fillStyle='#f6ecd8'; c.font='700 14px "IBM Plex Mono",monospace'; c.fillText('ROUTE BOARD  ·  THE PHILLIPS NETWORK',W/2,py-18);
}
const baseRender=D.render;
D.render=function(c,V,G,now,dt){ baseRender(c,V,G,now,dt); renderBoard(c,V,G); };
})(typeof globalThis!=='undefined'?globalThis:this);
