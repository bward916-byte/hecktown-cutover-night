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

/* wall monitors */
D.PROPS.aplus_wall=(x,y,now,c)=>{ const G=curG; if(!G) return; const w=26, h=20, top=y-80, t=now/1000, sp=speaking(G);
  c.fillStyle='#22262e'; c.fillRect(x-1.5,top+h,3,5);
  if(sp){ face(c,x-w/2,top,w,h,ST.aplusMood(sp.text),t,sp.talk,0.6); c.save(); c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(x,top+h/2,3,x,top+h/2,40); g.addColorStop(0,'rgba(120,255,140,.22)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-40,top-30,80,80); c.restore(); return; }
  c.fillStyle='#0a1a0e'; rr(c,x-w/2,top,w,h,2); c.fill(); c.strokeStyle='rgba(120,255,140,.4)'; c.lineWidth=0.7; rr(c,x-w/2,top,w,h,2); c.stroke();
  c.fillStyle='#7fe0a0'; c.font='700 3.6px "IBM Plex Mono",monospace'; c.textAlign='left'; c.textBaseline='alphabetic';
  if(G.S.done){ c.fillText('ARCHIVED',x-10,top+8); c.fillStyle='rgba(120,255,140,.5)'; c.fillText('thank you',x-10,top+14); }
  else{ c.fillText('A+ >'+(Math.floor(t*2)%2?'_':''),x-10,top+8); c.fillStyle='rgba(120,255,140,.5)'; c.fillText('CUTOVER 00:00',x-10,top+14); } };

/* in the world: the reveal, bubbles, SKU tags */
D.HOOKS.push(function(c,G,now,V){
  const s=G.story, t=now/1000, N=G.cur.node; if(!s||!N) return;
  if(s.reveal>0&&N.id==='hq_b1'){ const a=clamp(s.reveal/3.5,0,1)*(0.6+0.4*Math.abs(Math.sin(t*9))); for(const p of MAP.props) if(p.node==='hq_b1'&&p.type==='server'){ const y=N.world.yAt(p.x); c.fillStyle='rgba(120,255,140,'+(0.35*a).toFixed(3)+')'; c.fillRect(p.x-14,y-66,28,66); }
    face(c,1790,N.world.yAt(1790)-78,34,26,'talk',t,true,1); }
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

/* comic-panel chapter cards */
D.aplusFace=face; D.drawCardStyle=function(c,V,G,k){ if(k.style!=='comic') return false; const t=k.t, a=clamp(Math.min(t/0.6,(k.dur-t)/0.6),0,1);
  c.setTransform(V.DPR,0,0,V.DPR,0,0); c.globalAlpha=Math.max(a,0.001); c.fillStyle='#0b1220'; c.fillRect(0,0,V.W,V.H);
  c.fillStyle='rgba(242,181,68,.06)'; for(let y=0;y<V.H;y+=8) for(let x=(y/8%2)*4;x<V.W;x+=8){ c.beginPath(); c.arc(x,y,1.3,0,7); c.fill(); }
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#f2b544'; c.font='700 '+Math.min(40,V.W/12)+'px "IBM Plex Sans Condensed","IBM Plex Sans",sans-serif'; c.fillText(k.title,V.W/2,V.H*0.2);
  c.fillStyle='#f6ecd8'; c.font='italic '+Math.min(20,V.W/24)+'px Georgia,serif'; c.fillText(k.sub||'',V.W/2,V.H*0.2+Math.min(34,V.W/14));
  const ps=k.panels||[], n=ps.length, gap=14, pw=Math.min(220,(V.W-40-gap*(n-1))/n), ph=pw*0.72, x0=(V.W-(n*pw+(n-1)*gap))/2, y0=V.H*0.42;
  ps.forEach((p,i)=>{ const show=clamp((t-0.5-i*0.7)/0.35,0,1); if(show<=0) return; const x=x0+i*(pw+gap), y=y0+(1-show)*12; c.globalAlpha=a*show;
    c.fillStyle='#f6ecd8'; c.fillRect(x-3,y-3,pw+6,ph+6); c.fillStyle=['#c9a56a','#5a6f8f','#2f5a3a'][i%3]; c.fillRect(x,y,pw,ph);
    c.fillStyle='rgba(0,0,0,.12)'; for(let yy=y+4;yy<y+ph;yy+=6) for(let xx=x+((yy-y)/6%2)*3;xx<x+pw;xx+=6){ c.beginPath(); c.arc(xx,yy,1.1,0,7); c.fill(); }
    c.fillStyle=p.i==='A+'?'#7fe0a0':'#f6ecd8'; c.font=(p.i==='A+'?'700 ':'')+Math.round(ph*0.4)+'px '+(p.i==='A+'?'"IBM Plex Mono",monospace':'system-ui,sans-serif'); c.fillText(p.i,x+pw/2,y+ph*0.42);
    c.fillStyle='#f6ecd8'; c.fillRect(x+6,y+ph-24,pw-12,18); c.strokeStyle=INK; c.lineWidth=1; c.strokeRect(x+6,y+ph-24,pw-12,18); c.fillStyle='#101a2e'; c.font='600 '+Math.min(12,pw/16)+'px "IBM Plex Sans",sans-serif'; c.fillText(p.c,x+pw/2,y+ph-15); });
  c.globalAlpha=a*0.5; c.fillStyle='#f6ecd8'; c.font='500 11px "IBM Plex Sans",sans-serif'; c.fillText(V.touch?'tap to continue':'E or Space to continue',V.W/2,V.H-30); c.globalAlpha=1; return true; };

const baseRender=D.render;
D.render=function(c,view,G,now,dt){ curG=G; baseRender(c,view,G,now,dt); bubbles(c,view,G); aplusCard(c,view,G,now); };
})(typeof globalThis!=='undefined'?globalThis:this);
