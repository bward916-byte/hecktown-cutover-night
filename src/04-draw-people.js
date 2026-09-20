/* ==== PEOPLE: draws any rig pose with a Hecktown "look" (skin, hair style, shirt, trousers, accessory). ==== */
(function(root){
'use strict';
const CFG=root.WalkEngine.CFG, INK='#151a22';
function hex(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function shade(h,k){ const c=hex(h); return 'rgb('+(c[0]*k|0)+','+(c[1]*k|0)+','+(c[2]*k|0)+')'; }
const cache={};
function colours(look){ const key=look.shirt+look.pants+look.skin; return cache[key]||(cache[key]={shirt:look.shirt,shirtFar:shade(look.shirt,0.74),pants:look.pants,pantsFar:shade(look.pants,0.72),skin:look.skin,skinFar:shade(look.skin,0.84)}); }

function stroke(ctx,pts,w,col){ ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);
  ctx.lineWidth=w+1.5; ctx.strokeStyle=INK; ctx.stroke(); ctx.lineWidth=w; ctx.strokeStyle=col; ctx.stroke(); }
function shoe(ctx,L,F,col){ const c=Math.cos(L.pitch), s=Math.sin(L.pitch), P=(lx,ly)=>[L.ax+F*(lx*c-ly*s),L.ay+lx*s+ly*c];
  const a=P(-2.2,-2.6), h=P(-CFG.footBack,CFG.ankleH), t=P(CFG.footToe,CFG.ankleH), tt=P(CFG.footToe+0.4,0.6), i2=P(2.2,-2.2);
  ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(h[0],h[1]); ctx.lineTo(t[0],t[1]); ctx.quadraticCurveTo(tt[0],tt[1],i2[0],i2[1]); ctx.closePath();
  ctx.fillStyle=col; ctx.strokeStyle=INK; ctx.lineWidth=1.1; ctx.lineJoin='round'; ctx.fill(); ctx.stroke(); }

/* Every face is built from the same profile, nudged by a few numbers hashed from the person's look, so no two read alike. */
const faces={};
function faceOf(look){ const key=look.skin+look.hair+look.shirt+look.style; if(faces[key]) return faces[key];
  let h=11; for(let i=0;i<key.length;i++) h=(h*33+key.charCodeAt(i))>>>0; const r=k=>((h>>>k)%100)/100;
  return faces[key]={nose:r(0)*1.3-0.4,chin:r(3)*1.0-0.4,brow:r(6)*0.5-0.25,eye:r(9)*0.35,lip:r(12)*0.5,phase:r(15)*4,dark:shade(look.skin,0.72),hairDark:shade(look.hair,0.7)}; }
function headShape(ctx,R,f){
  ctx.beginPath(); ctx.arc(0,0,R,Math.PI*0.75,Math.PI*1.9);
  ctx.quadraticCurveTo(6.7,-1.4,6.5,-0.5); ctx.lineTo(6.25,0.6);                               // brow, bridge
  ctx.quadraticCurveTo(6.9+f.nose*0.4,1.6,7.5+f.nose*0.8,2.3); ctx.quadraticCurveTo(7.9+f.nose*0.8,3.3,6.4,3.2);   // nose
  ctx.lineTo(6.75,3.9); ctx.lineTo(6.2,4.5); ctx.lineTo(6.5,5.2);                                // lips
  ctx.quadraticCurveTo(6.6+f.chin*0.4,6.9+f.chin*0.5,5.2+f.chin*0.3,7.4+f.chin*0.5);             // chin
  ctx.quadraticCurveTo(1.5,8.2+f.chin*0.3,-1.7,5.7); ctx.closePath();
}
function head(ctx,P,look,C,opt){
  opt=opt||{}; const F=P.face, R=CFG.headR, st=look.style, f=faceOf(look), t=(opt.t||0)+f.phase;
  ctx.save(); ctx.translate(P.head.x,P.head.y+1.2); ctx.rotate(P.head.a); ctx.scale(F*1.16,1.16); ctx.translate(0,-1.2); ctx.lineWidth=1.0; ctx.strokeStyle=INK; ctx.lineJoin='round';
  if(st==='ponytail'){ ctx.beginPath(); ctx.moveTo(-R+1,-2); ctx.quadraticCurveTo(-R-7,1,-R-4,9); ctx.lineWidth=3.4; ctx.strokeStyle=INK; ctx.stroke(); ctx.lineWidth=2.2; ctx.strokeStyle=look.hair; ctx.stroke(); ctx.lineWidth=1.1; ctx.strokeStyle=INK; }
  if(st==='bun'){ ctx.beginPath(); ctx.arc(-R+0.5,-R+1.5,2.9,0,7); ctx.fillStyle=look.hair; ctx.fill(); ctx.stroke(); }
  if(st==='hoodie'){ ctx.beginPath(); ctx.arc(-1.2,0.6,R+2.2,Math.PI*0.55,Math.PI*1.75); ctx.lineTo(-1,0); ctx.closePath(); ctx.fillStyle=look.shirt; ctx.fill(); ctx.stroke(); }
  headShape(ctx,R,f); ctx.fillStyle=C.skin; ctx.fill(); ctx.stroke();
  // soft shading under the cheekbone and jaw, a little colour in the cheek
  ctx.save(); headShape(ctx,R,f); ctx.clip(); ctx.fillStyle=f.dark; ctx.globalAlpha=0.28; ctx.beginPath(); ctx.ellipse(-0.5,7.2,7,2.6,0.25,0,7); ctx.fill(); ctx.globalAlpha=0.16; ctx.fillStyle='#d2493a'; ctx.beginPath(); ctx.arc(3.6,3.0,1.9,0,7); ctx.fill(); ctx.restore();
  // ear
  ctx.beginPath(); ctx.ellipse(-0.9,1.0,1.35,2.0,-0.15,0,7); ctx.fillStyle=C.skin; ctx.fill(); ctx.lineWidth=0.8; ctx.stroke(); ctx.beginPath(); ctx.arc(-0.7,1.1,0.8,Math.PI*0.6,Math.PI*1.7); ctx.strokeStyle=f.dark; ctx.stroke(); ctx.strokeStyle=INK; ctx.lineWidth=1.1;
  // hair cap; wavy and swept sit a little bigger
  const big=(st==='wavy'||st==='swept')?1.1:0.2;
  ctx.beginPath(); ctx.arc(0,0,R+big,Math.PI*0.82,Math.PI*(st==='swept'?1.95:1.86)); ctx.quadraticCurveTo(1.5,-1.8,-2.4,-0.4); ctx.quadraticCurveTo(-2.9,1.2,-2.6,2.4); ctx.closePath(); ctx.fillStyle=look.hair; ctx.fill(); ctx.stroke();
  if(st==='wavy'){ ctx.beginPath(); ctx.arc(-R+1,2.5,2.6,0,7); ctx.fill(); ctx.stroke(); }
  if(st==='beard'){ ctx.beginPath(); ctx.moveTo(-1.9,2.6); ctx.quadraticCurveTo(-2.2,6.4,1.6,8.6); ctx.quadraticCurveTo(5.2,9.6,6.4,6.6); ctx.lineTo(6.6,5.0); ctx.lineTo(5.9,3.7); ctx.quadraticCurveTo(3.4,3.5,2.6,5.0); ctx.quadraticCurveTo(0.2,4.6,-0.2,2.6); ctx.closePath(); ctx.fillStyle=look.hair; ctx.fill(); ctx.stroke(); }
  if(st==='cap'){ ctx.beginPath(); ctx.arc(0,-0.6,R+0.6,Math.PI*1.02,Math.PI*1.98); ctx.closePath(); ctx.fillStyle=look.shirt; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(R-0.5,-1.4); ctx.lineTo(R+5.4,-0.6); ctx.lineWidth=2.2; ctx.stroke(); ctx.lineWidth=1.1; }
  // eye: white, iris, lid; it blinks, and closes in a smile
  const ex=3.5, ey=0.35+f.eye, blink=(t%3.7)<0.12||opt.happy&&(t%0.9)<0.45;
  if(blink){ ctx.beginPath(); ctx.moveTo(ex-1.5,ey+0.2); ctx.quadraticCurveTo(ex,ey+(opt.happy?-0.7:0.8),ex+1.5,ey+0.2); ctx.lineWidth=0.9; ctx.stroke(); }
  else{ ctx.beginPath(); ctx.ellipse(ex,ey,1.5,1.05,0,0,7); ctx.fillStyle='#fbf7ee'; ctx.fill(); ctx.lineWidth=0.35; ctx.stroke();
    const gx=ex+0.55+(opt.lookBack?-0.9:0), gy=ey+(opt.lookDown?0.35:0.05); ctx.beginPath(); ctx.arc(gx,gy,0.85,0,7); ctx.fillStyle=look.eye||'#4a3424'; ctx.fill(); ctx.beginPath(); ctx.arc(gx+0.1,gy,0.4,0,7); ctx.fillStyle=INK; ctx.fill();
    ctx.beginPath(); ctx.arc(gx+0.35,gy-0.35,0.22,0,7); ctx.fillStyle='#fff'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex-1.55,ey-0.35); ctx.quadraticCurveTo(ex,ey-1.45,ex+1.55,ey-0.3); ctx.lineWidth=0.75; ctx.strokeStyle=INK; ctx.stroke(); }
  // brow
  const bt=f.brow+(opt.happy?-0.35:0)+(opt.talk?-0.15*Math.sin(t*5):0); ctx.beginPath(); ctx.moveTo(ex-1.9,ey-2.3+bt*0.4); ctx.quadraticCurveTo(ex,ey-3.0+bt,ex+2.2,ey-2.0-bt*0.3); ctx.lineWidth=1.1; ctx.strokeStyle=st==='cap'?INK:f.hairDark; ctx.lineCap='round'; ctx.stroke(); ctx.strokeStyle=INK;
  // nostril and mouth: talks, smiles, otherwise rests
  ctx.fillStyle=f.dark; ctx.beginPath(); ctx.arc(6.6+f.nose*0.4,2.85,0.32,0,7); ctx.fill();
  if(st!=='beard'||opt.talk){ const open=opt.talk?Math.max(0,Math.sin(t*13))*1.3+0.25:0, my=4.5;
    if(open>0.3){ ctx.beginPath(); ctx.ellipse(5.2,my+0.2,1.2,open,0.1,0,7); ctx.fillStyle='#5a1f1f'; ctx.fill(); ctx.lineWidth=0.7; ctx.stroke(); }
    else{ ctx.beginPath(); ctx.moveTo(6.2,my); ctx.quadraticCurveTo(5.0,my+(opt.happy?1.5:0.35+f.lip*0.4),3.7,my+(opt.happy?-0.2:0.25)); ctx.lineWidth=0.9; ctx.stroke(); } }
  if(look.acc==='glasses'){ ctx.beginPath(); ctx.arc(ex+0.2,ey,2.3,0,7); ctx.moveTo(ex-2.1,ey-0.3); ctx.lineTo(-0.6,0.1); ctx.lineWidth=0.55; ctx.stroke(); ctx.fillStyle='rgba(200,230,255,.16)'; ctx.beginPath(); ctx.arc(ex+0.2,ey,2.3,0,7); ctx.fill(); }
  if(look.acc==='headset'){ ctx.beginPath(); ctx.arc(0,0,R+1.3,Math.PI*1.1,Math.PI*1.75); ctx.lineWidth=1.6; ctx.stroke(); ctx.fillStyle='#22262e'; ctx.fillRect(-2.6,-1.4,3.4,4.8); ctx.beginPath(); ctx.moveTo(-0.6,3.2); ctx.quadraticCurveTo(2,7.2,5.2,5.4); ctx.lineWidth=0.9; ctx.stroke(); ctx.beginPath(); ctx.arc(5.4,5.3,0.8,0,7); ctx.fill(); }
  ctx.restore();
}

/* A hand at the end of the forearm: cuff, palm, four fingers that curl, and a thumb on the leading side. */
function hand(ctx,A,F,skin,shirt,curl,flat){
  let dx=A.hx-A.ex, dy=A.hy-A.ey; if(flat){ dx=F; dy=0; } const s=-F;
  ctx.save(); ctx.translate(A.hx,A.hy-(flat?1.3:0)); ctx.rotate(Math.atan2(dy,dx)); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle=INK; ctx.fillStyle=skin;
  // fingers first, so the palm overlaps the knuckles
  ctx.save(); ctx.translate(2.7,0); ctx.rotate(s*curl);
  ctx.beginPath(); ctx.moveTo(0,-1.45); ctx.lineTo(2.3,-1.35); ctx.quadraticCurveTo(3.3,-1.1,3.2,-0.5); ctx.lineTo(3.35,0.3); ctx.quadraticCurveTo(3.2,1.0,2.6,1.1); ctx.lineTo(2.2,1.45); ctx.lineTo(0,1.45); ctx.closePath(); ctx.fill(); ctx.lineWidth=0.8; ctx.stroke();
  ctx.lineWidth=0.5; for(const y of [-0.55,0.3,1.0]){ ctx.beginPath(); ctx.moveTo(0.5,y); ctx.lineTo(2.9-Math.abs(y)*0.4,y*0.95); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-0.6,-1.4); ctx.lineTo(2.6,-1.6); ctx.quadraticCurveTo(3.4,0,2.6,1.6); ctx.lineTo(-0.6,1.4); ctx.closePath(); ctx.fill(); ctx.lineWidth=0.8; ctx.stroke();
  ctx.save(); ctx.translate(0.7,s*1.2); ctx.rotate(s*(0.55+curl*0.5)); ctx.beginPath(); ctx.ellipse(1.3,0,1.55,0.75,0,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle=shirt; ctx.beginPath(); ctx.rect(-1.5,-2.2,1.5,4.4); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* P: pose from the engine. look: colours and style. opt: {scarf:[points], ground:fn(x)->y, mode} */
function person(ctx,P,look,opt){
  opt=opt||{}; const F=P.face, C=colours(look);
  if(opt.ground){ const spots=(opt.mode==='crawl'||opt.mode==='roll')?[[P.hip.x,P.hip.y+6],[P.sh.x,P.sh.y+8]]:P.legs.map(L=>[L.ax+F*2,L.ay+CFG.ankleH]);
    for(const sp of spots){ const gy=opt.ground(sp[0]), h=Math.max(0,gy-sp[1]); if(h>26) continue;
      ctx.fillStyle='rgba(8,10,16,'+Math.max(0.05,0.3-h*0.01).toFixed(3)+')'; ctx.beginPath(); ctx.ellipse(sp[0],gy+0.4,Math.max(2.2,6.2-h*0.15),1.5,0,0,7); ctx.fill(); } }
  const w=opt.w||{}, act=w.act&&w.act.name, flat=opt.mode==='crawl';
  const curl=i=>flat?0:(opt.mode==='roll'?1.2:(act==='clap'||opt.mode==='air'?0.08:(i===1&&P.prop?1.0:(w.reading?0.9:(w.dancing?0.2:0.4)))));
  const arm=(i,far)=>{ const A=P.arms[i]; stroke(ctx,[P.sh.x,P.sh.y,A.ex,A.ey,A.hx,A.hy],3.9,far?C.shirtFar:C.shirt); hand(ctx,A,F,far?C.skinFar:C.skin,far?C.shirtFar:C.shirt,curl(i),flat); };
  const leg=(i,far)=>{ const L=P.legs[i], col=far?C.pantsFar:C.pants; stroke(ctx,[P.hip.x,P.hip.y,L.kx,L.ky,L.ax,L.ay],5.2,col); stroke(ctx,[L.kx,L.ky,L.ax,L.ay],4.3,col); shoe(ctx,L,L.face,look.shoe||'#23201e'); };
  arm(0,true); leg(0,true); leg(1,false);
  const tl=Math.hypot(P.neck.x-P.hip.x,P.neck.y-P.hip.y)||1, ux=(P.neck.x-P.hip.x)/tl, uy=(P.neck.y-P.hip.y)/tl;
  if(look.acc==='backpack') stroke(ctx,[P.hip.x-F*5+ux*7,P.hip.y+uy*7,P.neck.x-F*5.5-ux*5,P.neck.y-uy*5],7,'#3a4a5a');
  stroke(ctx,[P.hip.x-ux*2.4,P.hip.y-uy*2.4,P.hip.x,P.hip.y],10.4,C.pants);
  stroke(ctx,[P.hip.x+ux*1.5,P.hip.y+uy*1.5,P.neck.x-ux*2.6,P.neck.y-uy*2.6],10,C.shirt);
  if(look.acc==='vest'){ ctx.lineCap='butt'; ctx.strokeStyle='#e8e8e8'; ctx.lineWidth=1.6; for(const k of [0.35,0.62]){ const cx=P.hip.x+ux*tl*k, cy=P.hip.y+uy*tl*k; ctx.beginPath(); ctx.moveTo(cx+uy*5,cy-ux*5); ctx.lineTo(cx-uy*5,cy+ux*5); ctx.stroke(); } }
  if(look.acc==='cardigan'||look.acc==='flannel'){ ctx.lineCap='butt'; ctx.strokeStyle=shade(look.shirt,0.6); ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(P.hip.x+F*2.2+ux*2,P.hip.y+uy*2); ctx.lineTo(P.neck.x+F*2.2-ux*4,P.neck.y-uy*4); ctx.stroke(); }
  if(look.acc==='lanyard'||look.acc==='keys'){ const bx=P.neck.x+F*2.4-ux*9, by=P.neck.y-uy*9+1; ctx.strokeStyle='#d8d2c0'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(P.neck.x+F*1.5-ux*3,P.neck.y-uy*3); ctx.lineTo(bx,by); ctx.stroke(); ctx.fillStyle='#f6ecd8'; ctx.fillRect(bx-1.6,by,3.2,4.2); }
  ctx.lineCap='butt'; ctx.strokeStyle='#1b1712'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(P.hip.x+uy*5.2+ux*1.2,P.hip.y-ux*5.2+uy*1.2); ctx.lineTo(P.hip.x-uy*5.2+ux*1.2,P.hip.y+ux*5.2+uy*1.2); ctx.stroke();
  if(opt.scarf){ const pts=[]; for(const p of opt.scarf) pts.push(p.x,p.y); stroke(ctx,pts,2.6,'#f2b544'); }
  stroke(ctx,[P.neck.x-ux*1.5,P.neck.y-uy*1.5,P.neck.x+(P.head.x-P.neck.x)*0.55,P.neck.y+(P.head.y-P.neck.y)*0.55],3.4,C.skin);
  head(ctx,P,look,C,{t:opt.t,talk:opt.talk,happy:opt.happy||w.dancing||act==='clap',lookDown:w.reading||flat});
  if(opt.scarf) stroke(ctx,[P.neck.x-uy*2.8-ux*0.9,P.neck.y+ux*2.8-uy*0.9,P.neck.x+uy*2.7-ux*1.6,P.neck.y-ux*2.7-uy*1.6],3.2,'#f2b544');
  const H=P.arms[1];
  if(P.prop==='book'){ ctx.save(); ctx.translate(H.hx+F*1.6,H.hy-2.4); ctx.rotate(-F*0.5); ctx.lineWidth=1; ctx.strokeStyle=INK; ctx.fillStyle='#7a3b2a'; ctx.fillRect(-5.2,-3.6,10.4,7.2); ctx.strokeRect(-5.2,-3.6,10.4,7.2);
    ctx.fillStyle='#f6ecd8'; ctx.fillRect(-4.4,-3.6,8.8,6.2); ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(0,-3.6); ctx.lineTo(0,2.6); ctx.stroke(); ctx.restore(); }
  if(P.prop==='stone') treat(ctx,H.hx+F*1.2,H.hy+0.6,0,1);
  arm(1,false);
}
function treat(ctx,x,y,a,alpha){ ctx.save(); ctx.globalAlpha*=alpha; ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle='#c98b4a'; ctx.strokeStyle=INK; ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.ellipse(0,0,2.4,1.2,0,0,7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-2.2,0,1.1,0,7); ctx.arc(2.2,0,1.1,0,7); ctx.fill(); ctx.restore(); }

function dog(ctx,x,y,t,run,face){
  ctx.save(); ctx.translate(x,y); ctx.scale(face,1); const bob=run?Math.sin(t*22)*1.5:Math.sin(t*2.2)*0.4, lg=run?Math.sin(t*22)*5:0;
  ctx.strokeStyle=INK; ctx.lineWidth=1; ctx.fillStyle='#b98a55';
  ctx.lineCap='round'; ctx.lineWidth=3; ctx.strokeStyle='#8f6a40'; for(const k of [[-7,lg],[-4,-lg],[6,-lg],[9,lg]]){ ctx.beginPath(); ctx.moveTo(k[0],-9+bob); ctx.lineTo(k[0]+k[1],0); ctx.stroke(); }
  ctx.lineWidth=1; ctx.strokeStyle=INK; ctx.beginPath(); ctx.ellipse(1,-12+bob,11,5.5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(12,-17+bob,5,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle='#8f6a40'; ctx.beginPath(); ctx.ellipse(9.5,-19+bob,2,4,0.5,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=INK; ctx.beginPath(); ctx.arc(14,-18+bob,0.8,0,7); ctx.arc(17,-16+bob,1,0,7); ctx.fill();
  ctx.strokeStyle='#8f6a40'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-9,-14+bob); ctx.quadraticCurveTo(-15,-20+bob,-13+Math.sin(t*(run?20:9))*3,-25+bob); ctx.stroke();
  ctx.fillStyle='#f2b544'; ctx.fillRect(7,-14+bob,3.5,4);                       // Phillips bandana
  ctx.restore();
}
/* Small bust for the dialog box. */
function portrait(ctx,look,size){
  const R=CFG.headR, s=size/22; ctx.save(); ctx.clearRect(0,0,size,size); ctx.translate(size/2-1*s,size*0.42); ctx.scale(s,s);
  const P={face:1,head:{x:0,y:0,a:0},neck:{x:-0.5,y:R+2},hip:{x:-1,y:R+22}}, C=colours(look);
  stroke(ctx,[P.hip.x,P.hip.y,P.neck.x,P.neck.y+3],13,C.shirt); stroke(ctx,[P.neck.x,P.neck.y+2,P.neck.x+0.6,P.neck.y-3],4.2,C.skin); head(ctx,P,look,C,{t:1}); ctx.restore();
}
root.HPEOPLE={person:person,dog:dog,treat:treat,portrait:portrait,shade:shade,INK:INK};
})(typeof globalThis!=='undefined'?globalThis:this);
