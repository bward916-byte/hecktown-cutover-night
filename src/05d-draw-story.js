/* ==== STORY, drawn: A+'s face on a card and on the wall monitors, the Server Room lighting up, speech bubbles,
   Pam's SKU tags, and the comic-panel chapter cards. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, INK=root.HPEOPLE.INK, ST=GM.STORY;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v), rnd=(a,b)=>a+Math.random()*(b-a);
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
let curG=null;

/* A+'s face: two block eyes, a mouth, a jaw of characters. It glitches when cross and goes still when it is done. */
function face(c,x,y,w,h,mood,t,talking,intensity){
  c.save(); c.translate(x,y); c.fillStyle='#0a1a0e'; rr(c,0,0,w,h,Math.min(6,w/10)); c.fill(); c.strokeStyle='rgba(120,255,140,.55)'; c.lineWidth=Math.max(0.6,w/60); rr(c,0,0,w,h,Math.min(6,w/10)); c.stroke();
  c.save(); rr(c,1,1,w-2,h-2,Math.min(5,w/12)); c.clip(); const G=a=>'rgba(120,255,140,'+a+')', s=Math.min(w,h)/90, cx=w/2, cy=h/2;
  for(let k=2;k<h;k+=Math.max(1.5,3*s)){ c.fillStyle=G(0.06); c.fillRect(1,k,w-2,Math.max(0.5,s)); }
  const blink=(t%4.2)>4.05&&mood!=='mean', ew=16*s, eh=blink?2*s:(mood==='mean'?7*s:(mood==='confused'?12*s:(mood==='quiet'?3*s:9*s)));
  for(const side of [-1,1]){ c.save(); c.translate(cx+side*20*s,cy-12*s); c.rotate(side*(mood==='mean'?0.35:0)); c.fillStyle=G(0.95); c.fillRect(-ew/2,-eh/2,ew,eh);
    if(!blink&&mood!=='quiet'){ c.fillStyle='#0a1a0e'; c.fillRect(-2*s+(mood==='confused'?Math.sin(t*7)*4*s:0),-eh/2+1*s,4*s,Math.max(1,eh-2*s)); } c.restore(); }
  c.strokeStyle=G(0.95); c.lineWidth=2.5*s; c.beginPath(); const my=cy+16*s, open=talking?Math.abs(Math.sin(t*18))*8*s:0;
  if(mood==='mean'){ c.moveTo(cx-24*s,my-4*s); for(let k=0;k<=6;k++) c.lineTo(cx-24*s+k*8*s,my+(k%2?6*s+open:-2*s)); c.stroke(); }
  else if(mood==='smug'){ c.moveTo(cx-18*s,my+2*s); c.quadraticCurveTo(cx,my-2*s+open,cx+22*s,my-8*s); c.stroke(); }
  else if(mood==='confused'){ c.moveTo(cx-18*s,my); for(let k=0;k<=4;k++) c.lineTo(cx-18*s+k*9*s,my+Math.sin(k*1.5+t*5)*4*s+open*0.5); c.stroke(); }
  else if(mood==='quiet'){ c.moveTo(cx-12*s,my); c.lineTo(cx+12*s,my); c.stroke(); }
  else{ c.moveTo(cx-16*s,my); c.lineTo(cx+16*s,my); c.stroke(); if(open>0){ c.fillStyle=G(0.95); c.fillRect(cx-10*s,my,20*s,open); } }
  if(s>0.25){ c.fillStyle=G(0.35); c.font='700 '+Math.max(3,Math.round(6*s))+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='alphabetic'; c.fillText(mood==='mean'?'#### A+ ####':(mood==='quiet'?'.... A+ ....':'---- A+ ----'),cx,h-5*s); }
  const glitch=mood==='mean'?0.35:(mood==='confused'?0.2:(mood==='quiet'?0.02:0.08)); if(Math.random()<glitch*intensity){ c.fillStyle=G(0.25); c.fillRect(rnd(-6,6)*s,rnd(0,h),w,3*s); }
  c.restore(); c.restore();
}
function speaking(G){ const s=G.story; if(G.dialog&&G.dialog.who==='A+') return {text:G.dialog.pages[G.dialog.i],talk:true}; if(s&&s.ap) return {text:s.ap.text,talk:s.ap.typed<s.ap.text.length}; return null; }

/* A+ in the flesh: a green-screen monster. A beige CRT for a head (the face lives on the screen), a casing body with two
   tape reels for a chest, cable arms that end in plugs, stubby legs. It runs, it looms, it sleeps. */
function monster(c,x,y,s,t,mood,opt){ opt=opt||{}; const dir=opt.dir||1, run=!!opt.run, sleep=!!opt.sleep, looming=opt.loom||0;
  const bob=run?Math.abs(Math.sin(t*11))*3:Math.sin(t*2.4)*1.2+(sleep?2:0), sway=run?Math.sin(t*11)*0.08:Math.sin(t*1.3)*0.03;
  c.save(); c.translate(x,y); c.scale(s,s);
  const g=c.createRadialGradient(0,-40,4,0,-40,62); g.addColorStop(0,'rgba(120,255,140,'+(sleep?0.08:0.2+looming*0.2)+')'); g.addColorStop(1,'rgba(120,255,140,0)'); c.fillStyle=g; c.fillRect(-64,-104,128,110);
  c.save(); c.scale(dir,1); c.strokeStyle=INK; c.lineWidth=1.3; c.lineJoin='round'; c.lineCap='round';
  for(const k of [-1,1]){ const ph=run?Math.sin(t*11+(k>0?Math.PI:0)):0, lx=k*6+ph*5, ly=-(run?Math.max(0,Math.sin(t*11+(k>0?Math.PI:0)))*4:0);   // legs
    c.fillStyle='#24322a'; c.beginPath(); c.moveTo(k*6-4,-20+bob*0.3); c.lineTo(k*6+4,-20+bob*0.3); c.lineTo(lx+4,ly-2); c.lineTo(lx-4,ly-2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle='#3a3e47'; c.beginPath(); c.ellipse(lx+2,ly-1.5,6.5,2.6,0,0,7); c.fill(); c.stroke(); }
  c.save(); c.translate(0,-20+bob*0.5); c.rotate(sway);
  c.fillStyle='#1f3a28'; c.beginPath(); c.moveTo(-15,0); c.quadraticCurveTo(-18,-14,-13,-30); c.lineTo(13,-30); c.quadraticCurveTo(18,-14,15,0); c.closePath(); c.fill(); c.stroke();   // casing
  c.strokeStyle='rgba(120,255,140,.25)'; c.lineWidth=0.7; for(let yy=-6;yy>-28;yy-=5){ c.beginPath(); c.moveTo(-13,yy); c.lineTo(13,yy); c.stroke(); }
  for(const k of [-1,1]){ c.save(); c.translate(k*6.5,-15); c.fillStyle='#14171d'; c.strokeStyle=INK; c.lineWidth=1; c.beginPath(); c.arc(0,0,5,0,7); c.fill(); c.stroke(); c.rotate(t*(sleep?0.5:run?14:5)*k);   // tape reels
    c.fillStyle='#8a8f98'; c.beginPath(); c.arc(0,0,1.6,0,7); c.fill(); c.strokeStyle='#8a8f98'; c.lineWidth=0.8; for(let a=0;a<3;a++){ c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a*2.1)*4,Math.sin(a*2.1)*4); c.stroke(); } c.restore(); }
  c.strokeStyle=INK; c.lineWidth=1.3;
  for(const k of [-1,1]){ const flail=run?Math.sin(t*9+(k>0?1.4:0))*16:(looming?-18-Math.sin(t*6)*4:(sleep?10:Math.sin(t*1.8+k)*4)), ex=k*26, ey=-18+flail*0.4;   // cable arms with plug hands
    c.strokeStyle='#2b2f35'; c.lineWidth=4.2; c.beginPath(); c.moveTo(k*13,-24); c.bezierCurveTo(k*22,-30+flail*0.3,k*20,ey-8,ex,ey+flail*0.6); c.stroke(); c.strokeStyle=INK; c.lineWidth=1; c.stroke();
    c.fillStyle='#c9c2a8'; c.save(); c.translate(ex,ey+flail*0.6); c.fillRect(-3,-2.5,6,5); c.strokeRect(-3,-2.5,6,5); c.fillStyle='#8a8f98'; c.fillRect(k>0?3:-5,-1.8,2,1.1); c.fillRect(k>0?3:-5,0.7,2,1.1); c.restore(); }
  c.restore(); c.restore();
  // the head: a CRT with the face on it (never mirrored, so the screen reads right)
  const hx=-19+sway*20, hy=-86+bob-(looming*6); c.fillStyle='#c9c2a8'; c.strokeStyle=INK; c.lineWidth=1.3; rr(c,hx,hy,38,34,5); c.fill(); c.stroke();
  c.fillStyle='#b3ab90'; c.fillRect(hx+4,hy+30,30,3); c.fillStyle='#e0563a'; c.fillRect(hx+32,hy+29,2.5,2.5);
  face(c,hx+4,hy+4,30,24,sleep?'quiet':mood,t,!!opt.talk&&!sleep,sleep?0:0.8);
  c.strokeStyle='#2b2f35'; c.lineWidth=1.6; c.beginPath(); c.moveTo(hx+30,hy); c.bezierCurveTo(hx+36,hy-8,hx+26,hy-12,hx+32,hy-16); c.stroke(); c.fillStyle=Math.floor(t*2)%2?'#6fe08a':'#2a4a32'; c.beginPath(); c.arc(hx+32,hy-16,1.6,0,7); c.fill();
  if(sleep){ const z=(t*0.5)%1; c.fillStyle='rgba(127,224,160,'+(1-z).toFixed(2)+')'; c.font='700 9px "IBM Plex Mono",monospace'; c.fillText('Z',hx+40+z*6,hy-4-z*14); }
  c.restore(); }
D.aplusMonster=monster;
D.PROPS.pinball=(x,y,now,c)=>{ const t=now/1000; c.save(); c.strokeStyle=INK; c.lineWidth=1;
  c.fillStyle='#2b2f35'; c.fillRect(x-11,y-22,2.5,22); c.fillRect(x+8.5,y-24,2.5,24);
  c.fillStyle='#7a2a8a'; c.beginPath(); c.moveTo(x-13,y-22); c.lineTo(x+13,y-26); c.lineTo(x+13,y-33); c.lineTo(x-13,y-29); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#1a1d24'; c.fillRect(x+6,y-58,8,27); c.fillStyle='#3a1a4a'; c.fillRect(x-1,y-60,16,24); c.strokeRect(x-1,y-60,16,24);
  for(let k=0;k<5;k++){ c.fillStyle=Math.floor(t*4+k)%2?'#f2b544':'#e0563a'; c.beginPath(); c.arc(x+2+k*3,y-56,0.9,0,7); c.fill(); }
  c.fillStyle='#f6ecd8'; c.font='700 3px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.fillText('CUTOVER',x+7,y-48); c.fillText('WIZARD',x+7,y-44.5); c.fillStyle='#6fe08a'; c.fillText(String(10000+Math.floor(t*37)%90000),x+7,y-39.5); c.restore(); };
/* wall monitors */
D.PROPS.aplus_wall=(x,y,now,c)=>{ const G=curG; if(!G) return; const w=26, h=20, top=y-80, t=now/1000, sp=speaking(G);
  c.fillStyle='#22262e'; c.fillRect(x-1.5,top+h,3,5);
  if(sp){ face(c,x-w/2,top,w,h,ST.aplusMood(sp.text),t,sp.talk,0.6); c.save(); c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(x,top+h/2,3,x,top+h/2,40); g.addColorStop(0,'rgba(120,255,140,.22)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-40,top-30,80,80); c.restore(); return; }
  c.fillStyle='#0a1a0e'; rr(c,x-w/2,top,w,h,2); c.fill(); c.strokeStyle='rgba(120,255,140,.4)'; c.lineWidth=0.7; rr(c,x-w/2,top,w,h,2); c.stroke();
  c.fillStyle='#7fe0a0'; c.font='700 3.6px "IBM Plex Mono",monospace'; c.textAlign='left'; c.textBaseline='alphabetic';
  if(G.S.done){ c.fillText('ARCHIVED',x-10,top+8); c.fillStyle='rgba(120,255,140,.5)'; c.fillText('thank you',x-10,top+14); }
  else{ c.fillText('A+ >'+(Math.floor(t*2)%2?'_':''),x-10,top+8); c.fillStyle='rgba(120,255,140,.5)'; c.fillText('CUTOVER 00:00',x-10,top+14); } };

/* in the world: the reveal, bubbles, SKU tags */
D.HOOKS.push(function(c,G,now,V){ const x=1858; if(x<V.x0-60||x>V.x1+60) return; const N=MAP.nodes.hq_b1, S=G.S, s=G.story, sp=speaking(G), t=now/1000;
  const loom=s&&s.reveal>0?clamp(s.reveal/3.5,0,1):0, shake=loom?Math.sin(t*40)*1.2*loom:0;
  monster(c,x+shake,N.world.yAt(x),0.86+0.1*loom,t,sp?ST.aplusMood(sp.text):'idle',{dir:-1,sleep:!!S.done,talk:!!(sp&&sp.talk),loom:loom}); });
D.HOOKS.push(function(c,G,now,V){
  const s=G.story, t=now/1000, N=G.cur.node; if(!s||!N) return;
  if(s.reveal>0&&N.id==='hq_b1'){ const a=clamp(s.reveal/3.5,0,1)*(0.6+0.4*Math.abs(Math.sin(t*9))); for(const p of MAP.props) if(p.node==='hq_b1'&&p.type==='server'){ const y=N.world.yAt(p.x); c.fillStyle='rgba(120,255,140,'+(0.35*a).toFixed(3)+')'; c.fillRect(p.x-14,y-66,28,66); }
  }
  // Pam's three mis-slotted SKUs
  const F=G.S.flags; if(F.skuOn&&!F.skuDone&&N.id==='ground') for(const k of ST.SKUS){ if(F['sku_'+k.id]||k.x<V.x0-20||k.x>V.x1+20) continue; const y=N.world.yAt(k.x)-64+Math.sin(t*3+k.x)*1.5;
    c.fillStyle='rgba(242,181,68,.25)'; c.beginPath(); c.arc(k.x,y,10,0,7); c.fill(); c.fillStyle='#f6ecd8'; c.fillRect(k.x-7,y-5,14,10); c.strokeStyle=INK; c.lineWidth=0.7; c.strokeRect(k.x-7,y-5,14,10);
    c.fillStyle=INK; for(let j=0;j<8;j++) c.fillRect(k.x-5.5+j*1.5,y-3.5,(j%3?0.6:1),5); c.fillStyle='#c25a3a'; c.font='700 2.4px "IBM Plex Mono",monospace'; c.fillText(k.label,k.x,y+3.6); }
});

/* the A+ card at the top of the screen */
function wrap(c,text,maxW){ const words=text.split(' '), out=[]; let line=''; for(const w of words){ const tryL=line?line+' '+w:w; if(c.measureText(tryL).width>maxW&&line){ out.push(line); line=w; } else line=tryL; } if(line) out.push(line); return out; }
function bubbles(c,V,G){
  const s=G.story, N=G.cur.node; if(!s||!N||!s.bub.length||G.card||V.quiet) return; const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.font='italic 13px Georgia,serif'; c.textAlign='center'; c.textBaseline='middle';
  for(const b of s.bub){ let P=null; if(b.id==='hero') P=G.pose; else { const q=G.npcs.find(n=>n.def.id===b.id); if(q&&q.node===N) P=q.pose; } if(!P) continue;
    const x=P.head.x*V.zoom+ox, y=P.head.y*V.zoom+oy-48, tw=c.measureText(b.text).width+20; c.globalAlpha=Math.min(1,b.t*2);
    c.fillStyle='rgba(246,236,216,.96)'; rr(c,x-tw/2,y-13,tw,26,9); c.fill(); c.beginPath(); c.moveTo(x-6,y+12); c.lineTo(x+6,y+12); c.lineTo(x,y+20); c.closePath(); c.fill();
    c.fillStyle='#243447'; c.fillText(b.text,x,y+0.5); c.globalAlpha=1; } }
function aplusCard(c,V,G,now){
  const s=G.story; if(!s||!s.ap||G.card||V.quiet||(G.dialog&&G.dialog.who==='A+')) return; const a=s.ap, t=now/1000, alpha=clamp(Math.min(a.t/0.2,(a.dur+a.text.length/32-a.t)/0.5),0,1); if(alpha<=0) return;
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.globalAlpha=alpha; c.font='700 13px "IBM Plex Mono",monospace';
  const maxW=Math.min(520,V.W-120), lines=wrap(c,'A+ > '+a.text,maxW), shown=a.typed+5; const fw=64, fh=50, h=Math.max(fh,16+lines.length*18), w=Math.min(maxW,Math.max(...lines.map(l=>c.measureText(l).width)))+28;
  const x=(V.W-(w+fw+8))/2+fw+8, y=V.W<640?160:118;
  face(c,x-fw-8,y+(h-fh)/2,fw,fh,ST.aplusMood(a.text),t,a.typed<a.text.length,1);
  c.fillStyle='rgba(6,14,8,.92)'; rr(c,x,y,w,h,4); c.fill(); c.strokeStyle='rgba(120,255,140,.55)'; c.lineWidth=1; rr(c,x,y,w,h,4); c.stroke();
  c.fillStyle='#7fe0a0'; c.textAlign='left'; c.textBaseline='middle'; let left=shown;
  let cur=false; lines.forEach((l,i)=>{ const part=l.slice(0,Math.max(0,left)); left-=l.length+1; let tail=''; if(!cur&&a.typed<a.text.length&&part.length<l.length){ cur=true; tail=Math.floor(t*3)%2?'▮':''; } c.fillText(part+tail,x+14,y+h/2+(i-(lines.length-1)/2)*18); });
  c.globalAlpha=1;
}

/* time passing: a clock that spins itself through the years */
const MILESTONES={1938:'Phillips Feed opens its doors',1985:'A+ goes live',1991:'a door gets bricked over',2026:'cutover night'};
function clockCard(c,V,G,k){ const W=V.W, H=V.H, t=k.t, d=k.dur, a=clamp(Math.min(t/0.5,(d-t)/0.5),0,1), p=clamp((t-0.3)/(d-2.1),0,1), e=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
  const y0=k.from||1938, y1=k.to||2026, yr=Math.round(y0+(y1-y0)*e), era=clamp((yr-1938)/88,0,1);
  const mix=(A,B)=>{ const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)); const x=h(A), y=h(B); return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*era)).join(',')+')'; };
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.globalAlpha=Math.max(a,0.001); c.fillStyle=mix('#2a1c10','#0b1220'); c.fillRect(0,0,W,H);
  const cx=W/2, cy=H*0.4, R=Math.min(W,H)*0.2, spin=e*Math.max(4,Math.abs(y1-y0)/6)*2*Math.PI*(y1<y0?-1:1), glow=Math.sin(Math.PI*p);
  c.fillStyle='rgba(242,181,68,'+(0.12*glow).toFixed(3)+')'; c.beginPath(); c.arc(cx,cy,R*1.5,0,7); c.fill();
  c.fillStyle=mix('#e8dcc0','#f6ecd8'); c.strokeStyle=mix('#5a3a24','#243447'); c.lineWidth=Math.max(3,R*0.06); c.beginPath(); c.arc(cx,cy,R,0,7); c.fill(); c.stroke();
  for(let i=0;i<12;i++){ const an=i/12*Math.PI*2, r0=R*(i%3?0.86:0.78); c.lineWidth=i%3?1.5:3; c.beginPath(); c.moveTo(cx+Math.cos(an)*r0,cy+Math.sin(an)*r0); c.lineTo(cx+Math.cos(an)*R*0.94,cy+Math.sin(an)*R*0.94); c.stroke(); }
  const hand=(an,len,w,col,al)=>{ c.globalAlpha=Math.max(a,0.001)*al; c.strokeStyle=col; c.lineWidth=w; c.lineCap='round'; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.sin(an)*len,cy-Math.cos(an)*len); c.stroke(); };
  const fast=glow;                                                                   // motion blur while it races
  for(let g=7;g>=1;g--) hand(spin-g*0.22*fast*Math.sign(y1-y0||1),R*0.8,R*0.05,mix('#5a3a24','#243447'),0.1*fast);
  hand(spin/12,R*0.52,R*0.08,mix('#3a2418','#101a2e'),1); hand(spin,R*0.8,R*0.05,mix('#5a3a24','#243447'),1); hand(spin*1.7+t*9,R*0.86,R*0.015,'#c0392b',0.8);
  c.globalAlpha=Math.max(a,0.001); c.fillStyle=mix('#3a2418','#101a2e'); c.beginPath(); c.arc(cx,cy,R*0.07,0,7); c.fill();
  const yf=Math.min(64,H/7,W/6); c.fillStyle=mix('#f0e0c0','#f2b544'); c.font='700 '+yf+'px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(yr),cx,cy+R+yf*0.9);
  let ms=null; for(const y in MILESTONES) if(y1>=y0?(+y<=yr&&+y>=y0):(+y>=yr&&+y<=y0)) ms=MILESTONES[y]; if(ms&&t<d-1.6){ const mf=D.fitFont(c,ms,'italic ','Georgia,serif',Math.min(20,H/24),W*0.86); c.font='italic '+mf+'px Georgia,serif'; c.fillStyle=mix('#c9b48a','#9ad0f0'); c.fillText(ms,cx,cy+R+yf*1.8); }
  const end=clamp((t-(d-1.9))/0.5,0,1); if(end>0){ c.globalAlpha=Math.max(a,0.001)*end; const tf=D.fitFont(c,k.title,'700 ','Georgia,serif',Math.min(46,H/8,W/16),W*0.82); c.font='700 '+tf+'px Georgia,serif'; c.fillStyle=mix('#f0e0c0','#f6ecd8'); c.fillText(k.title,cx,H*0.12+tf*0.4);
    if(k.sub){ c.font='500 '+D.fitFont(c,k.sub,'500 ','"IBM Plex Sans",sans-serif',16,W*0.9)+'px "IBM Plex Sans",sans-serif'; c.fillStyle=mix('#c9b48a','#c8d2e0'); c.fillText(k.sub,cx,H*0.12+tf*1.35); } }
  c.globalAlpha=Math.max(a,0.001)*0.45; c.fillStyle='#f6ecd8'; c.font='500 11px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to continue':'E or Space to continue',cx,H-26); c.globalAlpha=1; }
/* comic-panel chapter cards */
D.aplusFace=face; D.drawCardStyle=function(c,V,G,k){ if(k.style==='clock'){ clockCard(c,V,G,k); return true; } if(k.style!=='comic') return false; const t=k.t, a=clamp(Math.min(t/0.6,(k.dur-t)/0.6),0,1);
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.globalAlpha=Math.max(a,0.001); c.fillStyle='#0b1220'; c.fillRect(0,0,V.W,V.H);
  c.fillStyle='rgba(242,181,68,.06)'; for(let y=0;y<V.H;y+=8) for(let x=(y/8%2)*4;x<V.W;x+=8){ c.beginPath(); c.arc(x,y,1.3,0,7); c.fill(); }
  const tall=V.W<560, ty=tall?V.H*0.14:V.H*0.2, tf=D.fitFont(c,k.title,'700 ','"IBM Plex Sans Condensed","IBM Plex Sans",sans-serif',Math.min(38,V.H/10,V.W/18),V.W*0.84);
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f2b544'; c.font='700 '+tf+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText(k.title,V.W/2,ty);
  const sf=D.fitFont(c,k.sub||'','italic ','Georgia,serif',Math.min(20,V.H/22),V.W*0.88); c.fillStyle='#f6ecd8'; c.font='italic '+sf+'px Georgia,serif'; c.fillText(k.sub||'',V.W/2,ty+tf*0.6+sf*0.9);
  const ps=k.panels||[], n=ps.length, gap=14;
  let pw,ph,x0,y0; if(tall){ pw=Math.min(300,V.W-60); ph=Math.min(pw*0.5,(V.H*0.62-gap*(n-1))/n); x0=(V.W-pw)/2; y0=ty+tf+sf+34; }                 // portrait: panels stack
  else { pw=Math.min(220,(V.W-40-gap*(n-1))/n); ph=Math.min(pw*0.72,V.H*0.42); x0=(V.W-(n*pw+(n-1)*gap))/2; y0=Math.max(ty+tf+sf+24,V.H*0.4); }
  ps.forEach((p,i)=>{ const show=clamp((t-0.5-i*0.7)/0.35,0,1); if(show<=0) return; const x=tall?x0:x0+i*(pw+gap), y=(tall?y0+i*(ph+gap):y0)+(1-show)*12; c.globalAlpha=a*show;
    c.fillStyle='#f6ecd8'; c.fillRect(x-3,y-3,pw+6,ph+6); c.fillStyle=['#c9a56a','#5a6f8f','#2f5a3a'][i%3]; c.fillRect(x,y,pw,ph);
    c.fillStyle='rgba(0,0,0,.12)'; for(let yy=y+4;yy<y+ph;yy+=6) for(let xx=x+((yy-y)/6%2)*3;xx<x+pw;xx+=6){ c.beginPath(); c.arc(xx,yy,1.1,0,7); c.fill(); }
    c.fillStyle=p.i==='A+'?'#7fe0a0':'#f6ecd8'; c.font=(p.i==='A+'?'700 ':'')+Math.round(Math.min(ph*0.4,pw*0.3))+'px '+(p.i==='A+'?'"IBM Plex Mono",monospace':'system-ui,sans-serif'); c.fillText(p.i,x+pw/2,y+ph*0.42);
    c.fillStyle='#f6ecd8'; c.fillRect(x+6,y+ph-24,pw-12,18); c.strokeStyle=INK; c.lineWidth=1; c.strokeRect(x+6,y+ph-24,pw-12,18); c.fillStyle='#101a2e'; c.font='600 '+D.fitFont(c,p.c,'600 ','"IBM Plex Sans",sans-serif',12,pw-20)+'px "IBM Plex Sans",sans-serif'; c.fillText(p.c,x+pw/2,y+ph-15); });
  c.globalAlpha=a*0.5; c.fillStyle='#f6ecd8'; c.font='500 11px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to continue':'E or Space to continue',V.W/2,V.H-30); c.globalAlpha=1; return true; };

const baseRender=D.render;
D.render=function(c,view,G,now,dt){ curG=G; baseRender(c,view,G,now,dt); bubbles(c,view,G); aplusCard(c,view,G,now); };
})(typeof globalThis!=='undefined'?globalThis:this);
