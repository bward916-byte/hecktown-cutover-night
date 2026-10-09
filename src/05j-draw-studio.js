/* ==== STUDIO B, drawn. Trivia Night's set: a tent on the Employee Lot with a bulb sign, a blue curtain, the board, three
   podiums (yours, Dave's, and one A+ insisted on), risers full of coworkers who cheer and groan, two cameras, an ON AIR sign.
   Also the tent itself out on the lot, so you can find your way back in. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, PP=root.HPEOPLE, INK=PP.INK, TV=GM.TRIVIA;
if(!TV) return;
const SX=TV.SX, SEAT=TV.SEAT, CLUES=TV.CLUES;
const rr=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
const rnd=k=>{ const v=Math.sin(k*12.9898+78.233)*43758.5453; return v-Math.floor(v); };
const R=(c,x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(x,y,w,h); };
const CROWD=(GM.PEOPLE||[]).filter(p=>p.id!=='dave').map(p=>p.look);
function people(c,G,T){ const talking=name=>!!(G.dialog&&(G.dialog.who===name||(G.dialog.pages[G.dialog.i]||'').indexOf(name+':')===0)), gy=()=>0;
  for(const q of G.npcs) if(q.node&&q.node.id==='studio'&&q.pose) PP.person(c,q.pose,q.def.look,{ground:gy,mode:q.w.mode,w:q.w,t:T,talk:talking(q.def.name),mood:q.mood?q.mood.name:null});
  PP.person(c,G.pose,D.HERO_LOOK,{scarf:G.hero.scarf,ground:gy,mode:G.hero.mode,w:G.hero,t:T}); }
function tags(c,G,V,ox,oy){ if(V.quiet) return;
  const tag=(text,wx,wy,bg,fg,bold)=>{ c.font=(bold?'600 ':'500 ')+'12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(text).width+16, x=wx*V.zoom+ox, y=wy*V.zoom+oy; c.fillStyle=bg; rr(c,x-w/2,y-11,w,22,6); c.fill(); c.fillStyle=fg; c.fillText(text,x,y+0.5); };
  for(const q of G.npcs) if(q.node&&q.node.id==='studio'&&q.pose&&Math.abs(q.w.x-G.hero.x)<130&&!(G.target&&G.target.q===q)) tag(q.def.name,q.w.x,q.pose.head.y-16,'rgba(16,26,46,.6)','#f6ecd8');
  if(G.target&&!G.dialog&&!G.card){ const T=G.target, y=(T.q&&T.q.pose?T.q.pose.head.y:(T.act==='aplus'?-96:-70))-18; tag((V.touch?'':'E  ')+T.label+'  ·  '+T.name,T.x,y,'#f2b544','#101a2e',true); } }

/* one coworker in a seat. mood: 0 sit, cheer>0 arms up and bouncing, groan>0 head in hands */
function seated(c,x,y,look,k,t,cheer,groan){ const bounce=cheer>0?Math.abs(Math.sin(t*9+k*1.7))*4*Math.min(1,cheer):0, lean=groan>0?Math.min(1,groan)*(k%2?1:-1)*3:0;
  c.save(); c.translate(x,y-bounce); c.strokeStyle=INK; c.lineWidth=0.8;
  c.fillStyle=look.shirt||'#5a6f8f'; rr(c,-7,-22,14,20,3); c.fill(); c.stroke();                                   // torso on the seat
  if(cheer>0){ c.strokeStyle=look.skin||'#efc39d'; c.lineWidth=2.6; c.lineCap='round'; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*6,-18); c.lineTo(s*(9+Math.sin(t*9+k)*2),-36-bounce*0.5); c.stroke(); } }
  else if(groan>0){ c.strokeStyle=look.skin||'#efc39d'; c.lineWidth=2.6; c.lineCap='round'; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*6,-18); c.lineTo(s*4+lean,-30); c.stroke(); } }
  c.fillStyle=look.skin||'#efc39d'; c.strokeStyle=INK; c.lineWidth=0.8; c.beginPath(); c.arc(lean*0.6,-29,6,0,7); c.fill(); c.stroke();                       // head
  c.fillStyle=look.hair||'#4a3626'; c.beginPath(); c.arc(lean*0.6,-31,6.2,Math.PI,0); c.fill(); if(look.style==='pony'||look.style==='bun'){ c.beginPath(); c.arc(lean*0.6-6,-28,3,0,7); c.fill(); }
  if(look.acc==='glasses'){ c.strokeStyle=INK; c.lineWidth=0.7; c.strokeRect(lean*0.6-5,-30,4,3); c.strokeRect(lean*0.6+1,-30,4,3); }
  c.restore(); }
function risers(c,x0,n,t,f,seed,flip){ // three rows of seats, stepping back and up
  for(let row=0;row<3;row++){ const y=-row*14, back=row*6; R(c,x0-10,y-2,n*22+20,4,'#3a3e47'); R(c,x0-10,y+2,n*22+20,12-row*2,'#2b2f3a');
    for(let i=0;i<n;i++){ const look=CROWD[(seed+row*7+i*3)%CROWD.length]||{}; const cheer=f.cheer>0?Math.max(0,f.cheer-rnd(seed+i+row)*0.5):0, groan=f.groan>0?Math.max(0,f.groan-rnd(seed+i*2)*0.4):0; seated(c,x0+i*22+(row%2)*11,y,look,seed+i+row*9,t,cheer,groan); } }
  // the people in the back are only heads; the tent is dark back there
  for(let i=0;i<n+1;i++){ c.fillStyle='rgba(20,26,40,.9)'; c.beginPath(); c.arc(x0+i*22-6,-56,6,0,7); c.fill(); } }
/* craft services by the stage door: road cases, a coffee urn, the donuts nobody admits to */
function craft(c,x,t){ c.save(); c.translate(x,0); c.strokeStyle=INK; c.lineWidth=0.8;
  for(const [bx,by,w,h] of [[0,-30,44,30],[6,-56,36,26],[50,-24,30,24]]){ c.fillStyle='#2b2f3a'; rr(c,bx,by,w,h,2); c.fill(); c.stroke(); R(c,bx+2,by+2,w-4,2,'#8a8070'); R(c,bx+2,by+h-4,w-4,2,'#8a8070'); c.fillStyle='#f6ecd8'; c.font='700 3.6px "IBM Plex Mono",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS PET A/V',bx+w/2,by+h/2); }
  R(c,90,-40,70,4,'#8a5a2a'); for(const lx of [94,152]) R(c,lx,-36,3,36,'#5a3a1a'); c.fillStyle='#f6ecd8'; c.fillRect(88,-44,74,5);
  c.fillStyle='#c0c4cc'; rr(c,96,-66,14,24,3); c.fill(); c.stroke(); R(c,100,-70,6,4,'#3a3e47'); c.fillStyle='#e0563a'; c.beginPath(); c.arc(103,-54,1.2,0,7); c.fill();
  for(let k=0;k<5;k++){ c.fillStyle=['#e8a0b0','#8a5a2a','#f6ecd8','#e8a0b0','#5a3a1a'][k]; c.beginPath(); c.arc(120+k*7,-47,3.4,0,7); c.fill(); c.stroke(); c.fillStyle='#3a1c1c'; c.beginPath(); c.arc(120+k*7,-47,1,0,7); c.fill(); }
  c.fillStyle='#f6ecd8'; c.font='600 3.6px "IBM Plex Sans",sans-serif'; c.textAlign='center'; c.fillText('craft services  ·  Dave\'s mother sent the donuts',125,-76);
  c.restore(); }
function podium(c,x,label,score,col,glow,t){ c.save(); c.translate(x,0);
  if(glow>0){ const g=c.createRadialGradient(0,-30,4,0,-30,60); g.addColorStop(0,'rgba(242,181,68,'+(0.35*glow)+')'); g.addColorStop(1,'rgba(242,181,68,0)'); c.fillStyle=g; c.fillRect(-70,-100,140,110); }
  c.strokeStyle=INK; c.lineWidth=1; c.fillStyle=col; rr(c,-22,-54,44,54,3); c.fill(); c.stroke(); R(c,-24,-58,48,6,'#1a1d2a'); R(c,-20,-50,40,22,'#101422');
  c.fillStyle='#f6ecd8'; c.font='700 7px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(label,0,-44);
  c.fillStyle=glow>0?'#f2b544':'#7fe0a0'; c.font='700 9px "IBM Plex Mono",monospace'; c.fillText(score,0,-33);
  R(c,-16,-24,32,2,'#f2b544'); c.fillStyle=glow>0.2&&Math.sin(t*14)>0?'#ff6a4a':'#5a2a2a'; c.beginPath(); c.arc(0,-62,3,0,7); c.fill();   // the buzzer light
  c.restore(); }
function camera(c,x,t,aim){ c.save(); c.translate(x,0); c.strokeStyle='#2b2f3a'; c.lineWidth=2; for(const k of [-9,0,9]){ c.beginPath(); c.moveTo(0,-40); c.lineTo(k,0); c.stroke(); }
  c.translate(0,-44); c.rotate(aim); c.fillStyle='#3a3e47'; rr(c,-14,-8,24,16,2); c.fill(); c.strokeStyle=INK; c.lineWidth=0.8; c.stroke(); R(c,10,-5,10,10,'#1a1d2a'); c.fillStyle='rgba(120,200,255,.8)'; c.beginPath(); c.arc(20,0,3.5,0,7); c.fill();
  c.fillStyle=Math.sin(t*3)>0?'#ff3b30':'#5a1a1a'; c.beginPath(); c.arc(-10,-11,1.6,0,7); c.fill(); c.restore(); }
function board(c,x,y,t,S){ const tv=TV.T(S), w=320, h=96; R(c,x-w/2-6,y-6,w+12,h+12,'#0e1322'); R(c,x-w/2,y,w,h,'#162042');
  const cw=w/4, ch=h/2; for(let k=0;k<8;k++){ const col=k%4, r=Math.floor(k/4), tx=x-w/2+col*cw+3, ty=y+r*ch+3, cl=CLUES[k], done=k<tv.i, cur=k===tv.i&&!S.done;
      c.fillStyle=done?'#0e1430':cur?('rgba(242,181,68,'+(0.55+0.35*Math.sin(t*4))+')'):'#2541a0'; rr(c,tx,ty,cw-6,ch-6,2); c.fill();
      if(!done){ c.fillStyle=cur?'#101a2e':'#c9d6ff'; c.font='600 4.2px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(cl.cat,tx+(cw-6)/2,ty+9); c.fillStyle=cur?'#101a2e':'#f2b544'; c.font='700 12px "IBM Plex Mono",monospace'; c.fillText('$'+cl.v,tx+(cw-6)/2,ty+28); } }
  if(S.done){ c.fillStyle='rgba(14,19,34,.8)'; c.fillRect(x-w/2,y,w,h); c.fillStyle='#f2b544'; c.font='700 16px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('CHAMPION',x,y+h/2); } }
function bulbs(c,x,y,text,t){ c.font='700 22px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(text).width+40; R(c,x-w/2,y-20,w,40,'#3a1c1c'); c.strokeStyle='#f2b544'; c.lineWidth=1.5; c.strokeRect(x-w/2,y-20,w,40);
  for(let i=0;i<Math.floor(w/9);i++){ const on=((i+Math.floor(t*6))%3)===0; c.fillStyle=on?'#fff1b8':'#7a5a2a'; for(const yy of [y-16,y+16]){ c.beginPath(); c.arc(x-w/2+5+i*9,yy,1.6,0,7); c.fill(); } }
  c.fillStyle='#fff1b8'; c.shadowColor='#f2b544'; c.shadowBlur=8; c.fillText(text,x,y+1); c.shadowBlur=0; }

function render(c,V,G,now,dt){ const t=now/1000, W=V.W, H=V.H, S=G.S, f=TV.fx(G), tv=TV.T(S);
  c.setTransform(V.DPR,0,0,V.DPR,0,0); const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#07090f'); g.addColorStop(1,'#141a2e'); c.fillStyle=g; c.fillRect(0,0,W,H);
  const ox=W/2-V.camx*V.zoom, oy=H*0.62-V.camy*V.zoom; c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR);
  // tent: striped canvas roof, poles, a blue curtain behind the set
  R(c,SX-400,-260,2200,260,'#1a2238'); for(let x=SX-400;x<SX+1800;x+=36) R(c,x,-260,18,90,'rgba(255,255,255,.05)');
  c.fillStyle='#f0e6d2'; c.beginPath(); c.moveTo(SX-400,-170); c.lineTo(SX-400,-230); c.lineTo(SX+650,-300); c.lineTo(SX+1700,-230); c.lineTo(SX+1700,-170); c.closePath(); c.fill();
  c.fillStyle='rgba(200,60,60,.55)'; for(let x=SX-400;x<SX+1700;x+=60){ c.beginPath(); c.moveTo(x,-170); c.lineTo(x+30,-170); c.lineTo(x+30+(x<SX+650?-2:2)*10,-232); c.lineTo(x+(x<SX+650?-2:2)*10,-232); c.closePath(); c.fill(); }
  for(let x=SX+100;x<SX+1300;x+=300) R(c,x-3,-250,6,250,'#8a8070');
  R(c,SX+160,-172,960,172,'#1c3a8a'); for(let x=SX+160;x<SX+1120;x+=22) R(c,x,-172,10,172,'rgba(0,0,0,.18)');                             // the curtain
  for(let i=0;i<60;i++){ const sx=SX+170+rnd(i)*930, sy=-165+rnd(i+3)*150; c.fillStyle='rgba(255,241,184,'+(0.3+0.5*Math.abs(Math.sin(t*2+i)))+')'; c.fillRect(sx,sy,1.5,1.5); }   // star drape
  // lighting truss
  R(c,SX+120,-196,1060,6,'#2b2f3a'); for(let x=SX+170;x<SX+1180;x+=110){ R(c,x-6,-190,12,10,'#3a3e47'); const on=0.55+0.1*Math.sin(t*0.7+x); c.fillStyle='rgba(255,236,190,'+on*0.14+')'; c.beginPath(); c.moveTo(x-5,-180); c.lineTo(x-70,0); c.lineTo(x+70,0); c.lineTo(x+5,-180); c.closePath(); c.fill(); c.fillStyle='#fff1b8'; c.beginPath(); c.arc(x,-180,3,0,7); c.fill(); }
  bulbs(c,SX+655,-216,'TRIVIA NIGHT',t);
  // floor: glossy, with the set's reflections
  R(c,SX-400,0,2200,400,'#0e1426'); R(c,SX-400,0,2200,2,'#2b3a6a'); for(let x=SX-400;x<SX+1800;x+=80) R(c,x,0,1,400,'rgba(255,255,255,.03)');
  for(const [px,col] of [[SEAT.player,'rgba(47,111,159,.25)'],[SEAT.host,'rgba(242,181,68,.25)'],[SEAT.aplus,'rgba(127,224,160,.25)']]){ const rg=c.createLinearGradient(0,0,0,70); rg.addColorStop(0,col); rg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=rg; c.fillRect(px-30,0,60,70); }
  // the stage: a low riser under the podiums
  R(c,SX+380,-8,560,8,'#243447'); R(c,SX+380,-10,560,3,'#f2b544');
  // the board behind Dave, the ON AIR sign and door at the left end, APPLAUSE sign at the right
  board(c,SEAT.host,-150,t,S);
  { const on=Math.sin(t*2)>-0.6; R(c,SEAT.door-30,-150,60,22,'#1a1d2a'); c.fillStyle=on?'#ff3b30':'#5a1a1a'; c.font='700 12px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; if(on){ c.shadowColor='#ff3b30'; c.shadowBlur=10; } c.fillText('ON AIR',SEAT.door,-139); c.shadowBlur=0;
    R(c,SEAT.door-26,-112,52,112,'#0a0d16'); c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(SEAT.door-20,-106,40,106); R(c,SEAT.door-26,-116,52,4,'#f0e6d2'); c.fillStyle='#f6ecd8'; c.font='700 6px "IBM Plex Sans",sans-serif'; c.fillText('STAGE DOOR  ·  LOT',SEAT.door,-122); }
  { const lit=f.cheer>0; R(c,SX+1140,-150,120,26,'#1a1d2a'); c.fillStyle=lit?'#fff1b8':'#4a4030'; c.font='700 13px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; if(lit){ c.shadowColor='#f2b544'; c.shadowBlur=12; } c.fillText('APPLAUSE',SX+1200,-137); c.shadowBlur=0; }
  // risers of coworkers at both ends
  risers(c,SX+1000,12,t,f,3,false); craft(c,SX+150,t);
  // podiums: yours, Dave's, A+'s
  let won=0; for(let k=0;k<tv.i;k++) won+=CLUES[k].v;
  podium(c,SEAT.player,'YOU','$'+won,'#2f6f9f',f.cheer>0?Math.min(1,f.cheer):0,t);
  podium(c,SEAT.host,'DAVE  ·  HOST','',"#8a5a2a",0,t); { c.fillStyle='#f6ecd8'; for(let k=0;k<4;k++) R(c,SEAT.host-10+k*1.5,-66-k,14,9,'#f6ecd8'); c.strokeStyle=INK; c.lineWidth=0.6; c.strokeRect(SEAT.host-10+4.5,-69,14,9); }   // Dave's cards
  podium(c,SEAT.aplus,'A+  ·  SINCE 1985','1985','#2a5a3a',f.groan>0||f.quip>0?Math.min(1,Math.max(f.groan,f.quip)):0,t);
  if(D.aplusMonster) D.aplusMonster(c,SEAT.aplus+40,0,0.72,t,G.dialog&&G.dialog.who==='A+'?'talk':(f.groan>0?'smug':(f.cheer>0?'mean':'quiet')),{dir:-1,talk:!!(G.dialog&&G.dialog.who==='A+')});
  // cameras in the foreground, the floor manager's tape marks
  for(const [mx,lbl] of [[SEAT.player,'1'],[SEAT.aplus,'3']]){ c.strokeStyle='#f2b544'; c.lineWidth=1.5; c.beginPath(); c.moveTo(mx-6,2); c.lineTo(mx+6,2); c.moveTo(mx,-4); c.lineTo(mx,8); c.stroke(); }
  people(c,G,t);
  camera(c,SX+330,t,0.15+Math.sin(t*0.5)*0.08); camera(c,SX+790,t,Math.PI-0.15-Math.sin(t*0.4)*0.08);
  if(S.done){ for(let i=0;i<40;i++){ const cx=SX+380+rnd(i)*560, cy=-200+((t*40+rnd(i+7)*300)%260); c.fillStyle=['#f2b544','#e0563a','#7fe0a0','#5aa0e0'][i%4]; c.fillRect(cx,cy,3,5); } }   // confetti forever
  // boom mic drifting over whoever is talking
  { const bx=G.dialog?(G.dialog.who==='A+'?SEAT.aplus:SEAT.host):SEAT.host+Math.sin(t*0.6)*40; c.strokeStyle='#2b2f3a'; c.lineWidth=2; c.beginPath(); c.moveTo(bx-120,-260); c.lineTo(bx,-92); c.stroke(); c.fillStyle='#3a3e47'; rr(c,bx-7,-92,14,22,6); c.fill(); }
  c.setTransform(V.DPR,0,0,V.DPR,0,0); tags(c,G,V,ox,oy); }
D.ALTS.push({test:(V,G)=>V.camx>SX-800&&V.camx<SX+TV.SLEN+800&&!G.drive,render:render});

/* the tent out on the Employee Lot, with a production truck, only during Trivia Night */
D.FLOORHOOKS.push(function(c,G,now,V){ if(!GM.chapterOf||GM.chapterOf(G.S)!=='trivia') return; if(V.x0>60||V.x1<-260) return; const t=now/1000, x=TV.LOT_DOOR, y=MAP.nodes.ground.world.yAt(x);
  c.save(); c.translate(x,y);
  R(c,-130,-62,110,56,'#2b2f3a'); R(c,-20,-50,34,44,'#3a3e47'); R(c,-130,-6,110,4,'#1a1d2a'); c.fillStyle='#f6ecd8'; c.font='700 7px "IBM Plex Sans Condensed",sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('PHILLIPS PET  ·  MOBILE UNIT',-75,-40); c.fillText('(it is Bret\'s van)',-75,-30);
  for(const wx of [-108,-40,8]){ c.fillStyle='#111'; c.beginPath(); c.arc(wx,-2,7,0,7); c.fill(); c.fillStyle='#777'; c.beginPath(); c.arc(wx,-2,3,0,7); c.fill(); }
  c.fillStyle='#f0e6d2'; c.beginPath(); c.moveTo(20,0); c.lineTo(20,-70); c.lineTo(70,-104); c.lineTo(120,-70); c.lineTo(120,0); c.closePath(); c.fill(); c.strokeStyle=INK; c.lineWidth=0.8; c.stroke();
  c.fillStyle='rgba(200,60,60,.5)'; for(let k=0;k<5;k++){ c.beginPath(); c.moveTo(20+k*20,0); c.lineTo(30+k*20,0); c.lineTo(70+(k-2)*4+5,-100); c.lineTo(70+(k-2)*4,-100); c.closePath(); c.fill(); }
  R(c,56,-64,28,64,'#0a0d16'); c.fillStyle='rgba(255,241,184,'+(0.5+0.3*Math.sin(t*3))+')'; c.fillRect(60,-60,20,60);
  const on=Math.sin(t*2)>-0.6; R(c,42,-124,56,16,'#1a1d2a'); c.fillStyle=on?'#ff3b30':'#5a1a1a'; c.font='700 9px "IBM Plex Sans Condensed",sans-serif'; c.fillText('STUDIO B',70,-116);
  c.fillStyle='#f6ecd8'; c.font='600 5px "IBM Plex Sans",sans-serif'; c.fillText('TRIVIA NIGHT  ·  tonight  ·  audience in the lot',70,-80);
  for(let k=0;k<6;k++){ c.strokeStyle='#8a8070'; c.lineWidth=1; c.beginPath(); c.moveTo(20,-70+k*2); c.lineTo(-6+k*2,0); c.stroke(); }
  c.restore(); });
})(typeof globalThis!=='undefined'?globalThis:this);
