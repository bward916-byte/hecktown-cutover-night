/* ==== WEATHER and TRAFFIC, drawn: clouds that roll in, rain that stays outside, puddle splashes, mist, lightning,
   cars on the road behind the yard, the drop-yard forklift, both ends of the 1938 portal, and 1938 on the move. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, INK=root.HPEOPLE.INK;
const FH=MAP.FH, TOP=MAP.HQ_TOP, WY=-28, CEIL=86;
const rnd=k=>{ const v=Math.sin(k*12.9898+78.233)*43758.5453; return v-Math.floor(v); };
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);

/* ---------------- behind everything: clouds and the far road ---------------- */
D.BGHOOKS.push(function(c,G,now,V,night){
  const wx=G.wx||{rain:0,cloud:0}, cl=wx.cloud;
  if(cl>0.01){ const g=c.createLinearGradient(0,0,0,V.H*0.7); g.addColorStop(0,'rgba(40,44,54,'+(0.65*cl).toFixed(3)+')'); g.addColorStop(1,'rgba(60,64,72,'+(0.25*cl).toFixed(3)+')'); c.fillStyle=g; c.fillRect(0,0,V.W,V.H);
    c.fillStyle='rgba(70,76,88,'+(0.5*cl).toFixed(3)+')'; for(let i=0;i<7;i++){ const x=((rnd(i)*V.W*1.6+now*0.006*(8+i))%(V.W+400))-200, y=V.H*(0.06+rnd(i+9)*0.25), r=60+rnd(i+4)*70; c.beginPath(); c.ellipse(x,y,r*1.6,r*0.45,0,0,7); c.fill(); } }
  if(G.flash>0){ c.fillStyle='rgba(230,236,255,'+(0.4*G.flash).toFixed(3)+')'; c.fillRect(0,0,V.W,V.H); }
  // the road behind the yard: headlights at night, a truck now and then
  const par=0.16, base=V.H*0.66-V.camy*par*V.zoom*0.3+6, off=V.camx*par*V.zoom;
  c.fillStyle='rgba(20,24,32,.55)'; c.fillRect(0,base,V.W,5);
  for(let i=0;i<8;i++){ const dir=i%2?1:-1, sp=(18+rnd(i+2)*14)*dir, span=V.W+400, x=((((rnd(i)*span+now*0.001*sp*6-off)%span)+span)%span)-200, big=rnd(i+7)<0.3, w=big?22:12, y=base+(dir>0?1:3);
    c.fillStyle=['#8a3a2a','#3a5a8a','#c9a040','#c8c8c8','#2f5f3f'][i%5]; c.fillRect(x,y-(big?9:5),w,big?9:5);
    if(night>0.25){ c.fillStyle='rgba(255,236,170,'+(0.3+0.6*night).toFixed(2)+')'; c.fillRect(dir>0?x+w:x-2,y-3,2,2); c.fillStyle='rgba(255,236,170,'+(0.12*night).toFixed(2)+')'; c.beginPath(); c.moveTo(dir>0?x+w:x,y-2); c.lineTo(dir>0?x+w+40:x-40,y-8); c.lineTo(dir>0?x+w+40:x-40,y+4); c.closePath(); c.fill();
      c.fillStyle='rgba(224,60,50,.8)'; c.fillRect(dir>0?x-1:x+w-1,y-3,1.5,1.5); } }
});

/* ---------------- in the world ---------------- */
function inside(x,y){
  if(x>=1092&&x<=1908) return y>TOP-(x>1548&&x<1732?CEIL+8:2);
  if(x>=676&&x<=904) return y>-2*FH+18;
  if(x>=2192&&x<=3168) return y>WY-3*FH-8;
  return false; }
function forklift(c,x,y,dir,beep,t){ c.save(); c.translate(x,y); c.scale(dir,1); c.strokeStyle=INK; c.lineWidth=1;
  c.fillStyle='#f2b544'; c.fillRect(-18,-24,30,18); c.strokeRect(-18,-24,30,18); c.fillStyle='#30343c'; c.fillRect(-15,-44,2.5,22); c.fillRect(5,-44,2.5,22); c.fillRect(-16,-46,25,2.5);
  c.fillRect(13,-48,3.5,46); c.fillStyle='#8d939c'; c.fillRect(16,-5,18,2.5); c.fillStyle='#c9a56a'; c.fillRect(18,-17,14,12); c.strokeRect(18,-17,14,12);
  c.fillStyle='#14171d'; for(const k of [-11,7]){ c.beginPath(); c.arc(k,-5,5,0,7); c.fill(); }
  c.fillStyle=beep>0&&Math.floor(t*6)%2?'#ff8a2a':'#8a4a1a'; c.beginPath(); c.arc(-4,-48,2.2,0,7); c.fill();
  c.fillStyle='#efc39d'; c.beginPath(); c.arc(-4,-32,3.4,0,7); c.fill(); c.fillStyle='#f2b544'; c.fillRect(-7,-36,6,2); c.restore(); }
function portal(c,x,y,t,a){ c.save(); c.globalCompositeOperation='lighter';
  for(let k=0;k<5;k++){ const r=(12+k*8)*a; c.strokeStyle=k%2?'rgba(120,255,140,'+(0.6-k*0.1)*a+')':'rgba(200,130,255,'+(0.6-k*0.1)*a+')'; c.lineWidth=2; c.beginPath(); c.ellipse(x,y,r*0.55,r,Math.sin(t*2+k)*0.2,0,7); c.stroke(); }
  const g=c.createRadialGradient(x,y,0,x,y,46*a); g.addColorStop(0,'rgba(255,255,255,'+0.85*a+')'); g.addColorStop(0.4,'rgba(200,130,255,'+0.45*a+')'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(x,y,26*a,46*a,0,0,7); c.fill();
  for(let k=0;k<8;k++){ const an=t*3+k*0.8; c.fillStyle='rgba(120,255,140,'+0.8*a+')'; c.fillRect(x+Math.cos(an)*32*a,y+Math.sin(an)*52*a,2,2); }
  c.restore(); }
D.HOOKS.push(function(c,G,now,V){
  const t=now/1000, N=G.cur.node, gy=x=>MAP.nodes.ground.world.yAt(x);
  const f=G.lift; if(f&&f.x>V.x0-40&&f.x<V.x1+40) forklift(c,f.x,gy(f.x),f.dir,f.beep||0,t);
  if(G.portalOpen&&PORTAL_VIS(V)){ const y=MAP.nodes.hq_b1.world.yAt(GM.PORTAL_X)-40; portal(c,GM.PORTAL_X,y,t,0.8+0.1*Math.sin(t*2)); }
  const rain=(G.wx&&G.wx.rain)||0; if(rain<0.02) return;
  c.strokeStyle='rgba(200,215,235,'+(0.35*rain).toFixed(3)+')'; c.lineWidth=0.7; c.beginPath(); const n=Math.floor(260*rain), w=V.x1-V.x0+60, h=V.y1-V.y0+40;
  for(let i=0;i<n;i++){ const sp=0.9+rnd(i+11)*0.5, y=V.y0-20+((rnd(i+3)*h+now*0.26*sp)%h), x=V.x0-30+((rnd(i)*w-(now*0.03)%w+w)%w);
    if(inside(x,y)||y>gy(x)-1) continue; c.moveTo(x,y); c.lineTo(x-2.4,y+8); } c.stroke();
  c.strokeStyle='rgba(200,215,235,'+(0.45*rain).toFixed(3)+')'; c.lineWidth=0.6;
  for(let i=0;i<Math.floor(50*rain);i++){ const cyc=0.5, ph=((now/1000)/cyc+rnd(i+31))%1, k=Math.floor((now/1000)/cyc+rnd(i+31)), x=V.x0+rnd(i*7+k)*(V.x1-V.x0); if(inside(x,gy(x)-2)) continue;
    const y=gy(x), r=1+ph*3.5; c.globalAlpha=1-ph; c.beginPath(); c.ellipse(x,y-0.3,r,r*0.28,0,0,7); c.stroke(); } c.globalAlpha=1;
});
const PORTAL_VIS=V=>GM.PORTAL_X>V.x0-60&&GM.PORTAL_X<V.x1+60;

/* ---------------- 1938: the Founder's road has traffic of its own ---------------- */
function modelA(c,x,y,dir){ c.save(); c.translate(x,y); c.scale(dir*0.7,0.7); c.fillStyle='#1c1c1e'; c.strokeStyle=INK; c.lineWidth=1;
  c.fillRect(-26,-22,26,14); c.fillRect(0,-14,24,6); c.beginPath(); c.moveTo(-22,-22); c.lineTo(-20,-36); c.lineTo(-4,-36); c.lineTo(-2,-22); c.closePath(); c.fill(); c.fillStyle='#9aa0a8'; c.fillRect(-18,-33,6,9); c.fillRect(-10,-33,6,9);
  c.fillStyle='#1c1c1e'; c.beginPath(); c.ellipse(-18,-8,9,5,0,Math.PI,0); c.ellipse(16,-8,9,5,0,Math.PI,0); c.fill(); c.fillStyle='#e8e0c8'; c.fillRect(22,-16,3,3);
  for(const k of [-18,16]){ c.fillStyle='#14141a'; c.beginPath(); c.arc(k,-6,6,0,7); c.fill(); c.fillStyle='#8a8a8a'; c.beginPath(); c.arc(k,-6,2,0,7); c.fill(); } c.restore(); }
function farmTruck(c,x,y,dir){ c.save(); c.translate(x,y); c.scale(dir*0.7,0.7); c.fillStyle='#6a4a2a'; c.fillRect(-46,-26,48,18); for(let k=0;k<6;k++) c.fillRect(-44+k*8,-26,1.4,18);
  c.fillStyle='#c9b48a'; for(const s of [-38,-24,-10]){ c.beginPath(); c.ellipse(s,-30,7,5,0,0,7); c.fill(); } c.fillStyle='#2a3a2a'; c.fillRect(2,-30,18,22); c.fillRect(20,-18,12,10); c.fillStyle='#9aa0a8'; c.fillRect(6,-27,10,8);
  for(const k of [-34,22]){ c.fillStyle='#14141a'; c.beginPath(); c.arc(k,-6,6.5,0,7); c.fill(); } c.restore(); }
function horseWagon(c,x,y,dir,t){ c.save(); c.translate(x,y); c.scale(dir*0.7,0.7); const s=Math.sin(t*6);
  c.fillStyle='#5a3a24'; for(const [lx,ph] of [[18,1],[24,-1],[40,-1],[46,1]]) c.fillRect(lx+ph*s*2,-24,3.5,24); c.beginPath(); c.ellipse(32,-28,16,8,0,0,7); c.fill(); c.beginPath(); c.moveTo(44,-30); c.lineTo(54,-44); c.lineTo(60,-40); c.lineTo(50,-26); c.fill(); c.beginPath(); c.ellipse(60,-42,7,3.5,0.5,0,7); c.fill();
  c.strokeStyle='#3a2a1a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(4,-18); c.lineTo(20,-24); c.stroke(); c.fillStyle='#8a6a40'; c.fillRect(-40,-26,44,14); c.fillStyle='#c9b48a'; c.beginPath(); c.ellipse(-28,-29,6,4,0,0,7); c.ellipse(-14,-29,6,4,0,0,7); c.fill();
  c.strokeStyle='#3a2418'; c.lineWidth=1.8; for(const k of [-30,-4]){ c.beginPath(); c.arc(k,-9,8,0,7); c.stroke(); } c.fillStyle='#3a342e'; c.beginPath(); c.arc(-6,-36,3.2,0,7); c.fill(); c.fillRect(-9,-33,6,8); c.restore(); }
D.ERA_HOOKS.push(function(c,G,now){ const t=now/1000, span=2800, x0=-3300;
  const at=(speed,off)=>x0+((t*speed+off)%span+span)%span;
  modelA(c,at(42,300),-14,1); farmTruck(c,x0+span-((t*30+1500)%span),-14,-1); horseWagon(c,at(16,1900),-14,1,t); });
D.ERA_POST.push(function(c,G,now,V,ox,oy){ const P=G.p38; if(!P||P.scene!=='visit') return; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR); portal(c,GM.P38.X.start-70,-44,now/1000,0.8); c.setTransform(V.DPR,0,0,V.DPR,0,0); });

/* ---------------- over everything: mist ---------------- */
const baseRender=D.render;
D.render=function(c,V,G,now,dt){ baseRender(c,V,G,now,dt); const m=(G.wx&&G.wx.mist)||0; if(m<0.02||V.camx<D.ERA_X||G.card) return;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,V.H*0.35,0,V.H); g.addColorStop(0,'rgba(200,206,214,0)'); g.addColorStop(0.6,'rgba(200,206,214,'+(0.28*m).toFixed(3)+')'); g.addColorStop(1,'rgba(200,206,214,'+(0.4*m).toFixed(3)+')'); c.fillStyle=g; c.fillRect(0,0,V.W,V.H);
  c.fillStyle='rgba(220,226,232,'+(0.12*m).toFixed(3)+')'; for(let i=0;i<5;i++){ const x=((rnd(i)*V.W+now*0.012*(i+2))%(V.W+300))-150; c.beginPath(); c.ellipse(x,V.H*(0.62+rnd(i+5)*0.25),220,26,0,0,7); c.fill(); } };
})(typeof globalThis!=='undefined'?globalThis:this);
