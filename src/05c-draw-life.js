/* ==== LIFE, drawn: the employee lot, the koi pond, Milo on his dumpster, strays, Chuck, the office dog. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, INK=root.HPEOPLE.INK, L=GM.LIFE;
const CARS=['#c0392b','#3c5fa6','#e0a030','#e6e6e6','#2f7f4f'];
const P=D.PROPS;
P.car=(x,y,now,c,p)=>{ const col=CARS[(p.v||0)%CARS.length]; c.strokeStyle=INK; c.lineWidth=1;
  c.fillStyle=col; c.beginPath(); c.moveTo(x-30,y-7); c.lineTo(x-30,y-17); c.lineTo(x-16,y-19); c.lineTo(x-9,y-29); c.lineTo(x+12,y-29); c.lineTo(x+20,y-19); c.lineTo(x+30,y-17); c.lineTo(x+30,y-7); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#1c2a3e'; c.beginPath(); c.moveTo(x-7,y-27); c.lineTo(x,y-27); c.lineTo(x,y-20); c.lineTo(x-13,y-20); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x+2,y-27); c.lineTo(x+11,y-27); c.lineTo(x+17,y-20); c.lineTo(x+2,y-20); c.closePath(); c.fill();
  c.fillStyle='#14171d'; for(const k of [-18,18]){ c.beginPath(); c.arc(x+k,y-6,6,0,7); c.fill(); c.fillStyle='#8d939c'; c.beginPath(); c.arc(x+k,y-6,2.2,0,7); c.fill(); c.fillStyle='#14171d'; }
  c.fillStyle='#f6ecd8'; c.fillRect(x+27,y-15,3,2.5); c.fillStyle='#e0563a'; c.fillRect(x-30,y-15,2.5,2.5);
  c.fillStyle='rgba(246,236,216,.5)'; c.fillRect(x-36,y-1,1.5,1.5); c.fillRect(x+34,y-1,1.5,1.5); };
P.picnic=(x,y,now,c)=>{ c.fillStyle='#8a6a48'; c.fillRect(x-22,y-18,44,3.5); c.fillRect(x-28,y-9,56,2.5); c.strokeStyle='#5a4432'; c.lineWidth=2.4; c.beginPath(); c.moveTo(x-14,y); c.lineTo(x-6,y-18); c.moveTo(x+14,y); c.lineTo(x+6,y-18); c.stroke(); };
P.koi=(x,y,now,c)=>{ c.fillStyle='#3a5a4a'; c.beginPath(); c.ellipse(x,y+1.5,34,4.5,0,0,7); c.fill(); c.fillStyle='#2c5a78'; c.beginPath(); c.ellipse(x,y+1.5,31,3.3,0,0,7); c.fill();
  c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x-20,y+0.4,10,0.8); c.fillRect(x+6,y+2,8,0.7);
  for(let k=0;k<3;k++){ const a=now/1400+k*2.1, fx=x+Math.cos(a)*22, fy=y+1.5+Math.sin(a*1.3)*1.4, dir=-Math.sin(a)>=0?1:-1; c.fillStyle=['#f07a2a','#f6ecd8','#e0563a'][k]; c.beginPath(); c.ellipse(fx,fy,3.2,1.1,0,0,7); c.fill(); c.beginPath(); c.moveTo(fx-dir*3,fy); c.lineTo(fx-dir*5,fy-1.2); c.lineTo(fx-dir*5,fy+1.2); c.closePath(); c.fill(); }
  c.fillStyle='#6a6a62'; for(const k of [-36,-30,31,36]){ c.beginPath(); c.ellipse(x+k,y+1,3.4,2.2,0,0,7); c.fill(); } };
P.dumpster=(x,y,now,c)=>{ c.strokeStyle=INK; c.lineWidth=1; c.fillStyle='#2f5a3a'; c.fillRect(x-15,y-20,30,20); c.strokeRect(x-15,y-20,30,20); c.fillStyle='#244a2e'; c.fillRect(x-16,y-23,32,3.5); c.strokeRect(x-16,y-23,32,3.5); c.fillStyle='#14171d'; c.fillRect(x-12,y-2,4,2); c.fillRect(x+8,y-2,4,2); c.fillStyle='#d8d2c0'; c.font='700 3.4px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('PHILLIPS',x,y-10); };

/* ---------------- cats ---------------- */
function cat(c,x,y,col,dir,t,run,opt){ opt=opt||{}; c.save(); c.translate(x,y); c.scale(dir,1); c.strokeStyle=INK; c.lineWidth=0.8; c.fillStyle=col;
  const b=run?Math.sin(t*22)*1.2:0, lg=run?Math.sin(t*22)*3:0, sit=!run&&opt.sit;
  if(sit){ c.beginPath(); c.ellipse(-1,-5,5,5.5,0,0,7); c.fill(); c.stroke(); }
  else{ c.lineWidth=2; c.strokeStyle=col; for(const k of [[-4,lg],[-2,-lg],[4,-lg],[6,lg]]){ c.beginPath(); c.moveTo(k[0],-5+b); c.lineTo(k[0]+k[1]*0.4,0); c.stroke(); } c.lineWidth=0.8; c.strokeStyle=INK; c.beginPath(); c.ellipse(1,-6.5+b,7,3.4,0,0,7); c.fill(); c.stroke(); }
  const hx=sit?2.5:8, hy=sit?-11:-9+b; c.beginPath(); c.arc(hx,hy,3.3,0,7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(hx-2.6,hy-1.6); c.lineTo(hx-1.9,hy-5); c.lineTo(hx-0.3,hy-2.8); c.moveTo(hx+0.6,hy-2.9); c.lineTo(hx+2.2,hy-5); c.lineTo(hx+2.9,hy-1.4); c.fill(); c.stroke();
  const blink=(t%4.3)<0.14; c.fillStyle=opt.eye||'#6fe08a'; if(!blink){ c.beginPath(); c.arc(hx+1.5,hy-0.4,0.75,0,7); c.fill(); } c.fillStyle=INK; c.beginPath(); c.arc(hx+3.1,hy+0.6,0.45,0,7); c.fill();
  c.strokeStyle=col; c.lineWidth=1.5; c.beginPath(); const tx=sit?-5:-6; c.moveTo(tx,sit?-2:-7+b); c.quadraticCurveTo(tx-6,sit?-2:-12,tx-4+Math.sin(t*(run?14:3))*1.5,sit?-9:-15); c.stroke();
  if(opt.stripes){ c.strokeStyle='rgba(90,40,10,.6)'; c.lineWidth=0.8; for(const k of (sit?[-3,-1,1]:[-3,0,3])){ c.beginPath(); c.moveTo(k,sit?-9:-9.4+b); c.lineTo(k-0.6,sit?-5:-5.5+b); c.stroke(); } }
  c.restore(); }
function chuck(c,x,y,up,t){ c.fillStyle='#3a2a1a'; c.beginPath(); c.ellipse(x,y+0.8,8,2.2,0,0,7); c.fill(); if(up<0.05) return;
  c.save(); c.beginPath(); c.rect(x-12,y-26,24,26.5); c.clip(); c.translate(x,y+(1-up)*22); c.strokeStyle=INK; c.lineWidth=0.8; c.fillStyle='#7a5a3a';
  c.beginPath(); c.ellipse(0,-8,5.5,8,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(0,-17,4.4,0,7); c.fill(); c.stroke();
  c.fillStyle='#5a3a24'; c.fillRect(-3.5,-21.5,2,2.4); c.fillRect(1.5,-21.5,2,2.4); c.fillStyle=INK; c.beginPath(); c.arc(-1.5,-17.5,0.6,0,7); c.arc(1.8,-17.5,0.6,0,7); c.fill(); c.fillStyle='#f6ecd8'; c.fillRect(-0.9,-14.6,1.8,1.4);
  c.fillStyle='#a8845a'; c.beginPath(); c.ellipse(0,-7,3,5,0,0,7); c.fill(); c.restore(); }
function officeDog(c,x,y,t){ c.save(); c.translate(x,y); const b=Math.sin(t*1.5)*0.6; c.strokeStyle=INK; c.lineWidth=0.9; c.fillStyle='#8a7a6a';
  c.beginPath(); c.ellipse(0,-4.5-b*0.3,12,4.5+b*0.4,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(10,-5.5,4.2,0,7); c.fill(); c.stroke();
  c.fillStyle='#5a4a3a'; c.beginPath(); c.ellipse(12.5,-2.5,2.6,1.6,0.2,0,7); c.fill(); c.beginPath(); c.ellipse(8,-6,1.6,3.2,0.9,0,7); c.fill(); c.strokeStyle=INK; c.beginPath(); c.moveTo(10.5,-6.2); c.lineTo(12.2,-6); c.stroke();
  c.fillStyle='#b8a888'; c.beginPath(); c.ellipse(0,-1,16,2,0,0,7); c.fill();
  const z=(t*0.6)%1; c.fillStyle='rgba(246,236,216,'+(1-z).toFixed(2)+')'; c.font='italic 6px Georgia,serif'; c.fillText('z',15+z*4,-12-z*10); c.restore(); }

D.HOOKS.push(function(c,G,now,V){
  const t=now/1000, N=G.cur.node, gy=x=>MAP.nodes.ground.world.yAt(x), vis=(a,b)=>b>V.x0&&a<V.x1, S=G.S, lf=L.life(G);
  if(vis(L.MILO.x-20,L.MILO.x+20)){ const onDumpster=gy(L.MILO.x)-23; cat(c,L.MILO.x-2,onDumpster,'#d9822b',G.hero.x>L.MILO.x?1:-1,t,0,{sit:true,stripes:true,eye:'#f2d544'}); }
  if(vis(L.CHUCK.x-20,L.CHUCK.x+20)) chuck(c,L.CHUCK.x,gy(L.CHUCK.x),lf.chuckUp,t);
  if(vis(L.DOG.x-20,L.DOG.x+20)) officeDog(c,L.DOG.x,gy(L.DOG.x),t);
  for(const k of lf.cats) if(N&&k.node===N.id&&vis(k.x-12,k.x+12)) cat(c,k.x,N.world.yAt(k.x),k.col,k.dir,k.t+k.x*0.01,k.state!=='sit',{sit:k.state==='sit'});
  if(!V.quiet&&N&&N.id==='ground'&&Math.abs(G.hero.x-L.CHUCK.x)<90&&!(G.target)){ c.font='600 5px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; const y=gy(L.CHUCK.x)-26; c.fillStyle='rgba(16,26,46,.7)'; c.fillRect(L.CHUCK.x-22,y-5,44,9); c.fillStyle='#f6ecd8'; c.fillText(lf.chuckUp<0.3?'CHUCK  ·  hiding':'CHUCK',L.CHUCK.x,y+1.6); }
});
})(typeof globalThis!=='undefined'?globalThis:this);
