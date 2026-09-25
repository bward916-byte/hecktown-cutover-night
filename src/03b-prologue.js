/* ==== 1938: the playable prologue, the young Blaine scene, and a small card/cutscene runner the later stages reuse. DOM-free. ====
   The feed store is its own level ('y1938'), far west of the campus and joined to nothing. You play the hired hand:
   oats to the mare, the Millers' order across the fence, then "some years later" and on to cutover night as Brian W. */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const X={start:-2790,sack:-2640,founder:-2700,mare:-2010,order:-1850,miller:-880,yard:-2600};
const HAND={skin:'#e8c09a',hair:'#b08850',style:'short',shirt:'#d8ccb0',pants:'#5a4a38',acc:'none',top:'button',bottom:'work',shoe:'boot',build:{h:1,d:1,belly:0}};
const FOUNDER={skin:'#e6c2a0',hair:'#8a8a8a',style:'cap',shirt:'#2e2a26',pants:'#2a2622',acc:'cardigan',top:'blazer',bottom:'slacks'};
const MILLER={skin:'#f1c9a5',hair:'#6a4a3a',style:'bun',shirt:'#7a5a6a',pants:'#3a2a3a',acc:'none',top:'cardigan',bottom:'slacks',shoe:'dress'};
const KID={skin:'#f1c9a5',hair:'#a8632c',style:'cap',shirt:'#c25a3a',pants:'#2f6f9f',acc:'none',top:'button',bottom:'work',pantsCol:'#4a5a78',shoe:'boot'};
const GREG38={id:'greg38',name:'Greg',role:'Number Scientist'};
const PEOPLE38={founder:{id:'founder',name:'The Founder',role:'1938',look:FOUNDER},miller:{id:'miller',name:'Mrs. Miller',role:'Customer',look:MILLER},kid:{id:'kid',name:'Blaine',role:'a boy',look:KID,kid:true}};
const OBJ=['1938. Pick up the sack of oats on the porch.','Carry the oats to the mare by the road.','Grab the Millers\' order off the wagon.','Take it to Mrs. Miller, across the fence.','Some years later. The same yard.','1938, in black and white. Look around; the way back is by the porch.'];
const ARRIVE='You are Brian W, web developer. Cutover night, 6:00 PM. Rianan wants you upstairs.';

/* ---------------- cards and cutscenes ---------------- */
function card(title,sub,dur){ return {card:title,sub:sub||'',dur:dur||4}; }
function dlg(who,pages){ return {dlg:who,pages:pages}; }
function runCine(G,dt){
  while(G.cine&&G.cine.length){ const s=G.cine[0];
    if(s.card!==undefined){ if(!G.card){ G.card={title:s.card,sub:s.sub,t:0,dur:s.dur,style:s.style,panels:s.panels,from:s.from,to:s.to}; if(s.style==='clock') G.events.push({type:'sfx',name:'whoosh'}); } G.card.t+=dt; if(G.card.t<G.card.dur) return; G.card=null; G.cine.shift(); return; }
    if(s.dlg){ if(!s.started){ s.started=true; const p=s.dlg; G.dialog={who:p.name,role:p.role,look:p.look,pages:s.pages,i:0,cine:true}; G.events.push({type:'sfx',name:'talk'}); return; } if(G.dialog) return; G.cine.shift(); continue; }
    if(s.fn){ G.cine.shift(); s.fn(G); continue; }
    G.cine.shift(); }
}

/* ---------------- the 1938 level ---------------- */
const world38=()=>MAP.nodes.y1938.world;
function carryFor(stage){ return stage===1?'oats':(stage===3?'order':null); }
function addNpc(G,key,x,face){ const w=E.createWalker(world38(),x); w.facing=w.dir=w.kneeF=face||1; const q={def:PEOPLE38[key],w:w,pose:E.poseOf(w),walkTo:null}; G.p38.npcs.push(q); return q; }
function setup38(G){
  const st=G.S.flags.p38|0;
  G.p38={carry:carryFor(st),npcs:[],scene:'yard',hideHero:false};
  addNpc(G,'founder',st>=1?X.sack+40:X.founder,1); addNpc(G,'miller',X.miller,-1);
}
function arrive(G){
  const S=G.S, n=MAP.nodes.ground; S.flags.p38=5; G.p38=null; G.card=null; G.cine=[]; G.dialog=null;
  G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,1150); G.pose=E.poseOf(G.hero); S.pos={node:'ground',x:1150};
  G.events.push({type:'snap'}); G.events.push({type:'banner',text:ARRIVE}); G.events.push({type:'save'});
}
function later(G){                                   // "some years later": the same yard, a grandfather and a boy
  const P=G.p38; P.scene='later'; P.hideHero=true; P.carry=null; P.npcs.length=0;
  G.hero=E.createWalker(world38(),X.yard); G.pose=E.poseOf(G.hero); G.events.push({type:'snap'});
  addNpc(G,'founder',X.yard+40,-1); addNpc(G,'kid',X.yard-34,1);
}
function finish38(G){
  const F=PEOPLE38.founder, K=PEOPLE38.kid, M=PEOPLE38.miller;
  G.cine=[dlg(M,['Mrs. Miller: "In this weather? Well. I suppose you said you would."','Mrs. Miller: "You showed up. That\'s the whole thing, isn\'t it."']),
    {fn:G=>G.events.push({type:'banner',text:'Paid in eggs. Entered as cash.'})},
    {card:'SOME YEARS LATER',sub:'the same yard',dur:4.5,style:'clock',from:1938,to:1946},{fn:later},
    dlg({name:F.name,role:'Grandpa',look:F.look},['"Farmers are counting on that feed, Blaine. Rain or no rain, it goes today."']),
    dlg(K,['Blaine: "Even in the rain, Grandpa?"']),
    dlg({name:F.name,role:'Grandpa',look:F.look},['"Especially in the rain. Show up for the people who count on you. That\'s the whole business."']),
    card('Show up for the people who count on you.','',5),
    {card:'TONIGHT',sub:'Easton, Pennsylvania  ·  6:00 PM  ·  cutover night',dur:8,style:'clock',from:1946,to:2026},{fn:arrive}];
  G.S.flags.p38=4;
}
/* ---------------- the portal: once the Ledger is whole, you can walk back into 1938 as yourself ---------------- */
const PORTAL_BACK=X.start-70, REMARKS=[['founder','"Hmm. That fellow sure is interesting."'],['miller','"Does he work here?"'],['founder','"He was here yesterday, too. And the day before."'],['miller','"I don\'t remember hiring him."'],['founder','"He says he counts things. What things?"']];
function visit38(G){
  const W=world38(), S=G.S; G.cur={node:MAP.nodes.y1938,world:W}; G.hero=E.createWalker(W,PORTAL_BACK+50); G.pose=E.poseOf(G.hero);
  G.p38={carry:null,npcs:[],scene:'visit',hideHero:false,remark:0,remT:6};
  addNpc(G,'founder',X.founder+30,1); addNpc(G,'miller',X.miller,-1);
  const g=GM.PEOPLE.find(p=>p.id==='greg'); PEOPLE38.greg38=Object.assign({},GREG38,{look:g.look}); const q=addNpc(G,'greg38',X.start+200,1); q.walkTo=X.miller-160; q.slow=0.35;
  S.pos={node:'y1938',x:G.hero.x}; G.events.push({type:'snap'});
  if(!S.eggs.y1938){ S.eggs.y1938=1; S.points+=GM.PTS_1938; G.events.push({type:'banner',text:'1938, in black and white',pts:GM.PTS_1938}); }
  G.events.push({type:'save'});
}
function leave38(G){ const n=MAP.nodes.hq_b1; G.p38=null; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,GM.PORTAL_X+26); G.pose=E.poseOf(G.hero); G.S.pos={node:'hq_b1',x:G.hero.x}; G.events.push({type:'snap'}); G.events.push({type:'save'}); }
GM.enter1938=function(G){ G.cine=[{card:'1938',sub:'something is wrong with the light',dur:5,style:'clock',from:2026,to:1938},{fn:visit38}]; };
function target38(G){
  const h=G.hero, P=G.p38, st=G.S.flags.p38|0; if(!P||G.cine.length) return null;
  if(P.scene==='visit'){ let best=null,bd=1e9; const take=(d,t)=>{ if(d<bd){bd=d;best=t;} };
    const dp=Math.abs(PORTAL_BACK-h.x); if(dp<30) take(dp-40,{kind:'p38',label:'Step through',name:'back to tonight',x:PORTAL_BACK,act:'back'});
    for(const q of P.npcs){ const d=Math.abs(q.w.x-h.x); if(d<44) take(d,{kind:'p38',label:'Talk',name:q.def.name,x:q.w.x,act:'talk38',q:q}); }
    return best; }
  if(P.scene!=='yard') return null;
  let best=null,bd=1e9; const take=(d,t)=>{ if(d<bd){bd=d;best=t;} };
  if(st===0){ const d=Math.abs(X.sack-h.x); if(d<26) take(d-40,{kind:'p38',label:'Take',name:'sack of oats',x:X.sack,act:'oats'}); }
  if(st===1){ const d=Math.abs(X.mare-h.x); if(d<44) take(d-40,{kind:'p38',label:'Feed',name:'the mare',x:X.mare,act:'mare'}); }
  if(st===2){ const d=Math.abs(X.order-h.x); if(d<26) take(d-40,{kind:'p38',label:'Take',name:'the Millers\' order',x:X.order,act:'order'}); }
  for(const q of P.npcs){ const d=Math.abs(q.w.x-h.x); if(d<(st===3&&q.def.id==='miller'?48:38)) take(d,st===3&&q.def.id==='miller'?{kind:'p38',label:'Give',name:'Mrs. Miller',x:q.w.x,act:'give',q:q}:{kind:'p38',label:'Talk',name:q.def.name,x:q.w.x,act:'talk',q:q}); }
  return best;
}
function say38(G,p,pages){ G.dialog={who:p.name,role:p.role,look:p.look,pages:pages,i:0}; G.events.push({type:'sfx',name:'talk'}); }
function interact38(G,t){
  const S=G.S, P=G.p38;
  switch(t.act){
    case 'oats': S.flags.p38=1; P.carry='oats'; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'save'});
      const f=P.npcs.find(q=>q.def.id==='founder'); if(f) f.walkTo=X.sack+40;
      say38(G,PEOPLE38.founder,['"Sack of oats for the mare, then the Millers\' order across the road."','"Farmers are counting on that feed. Rain or no rain, it goes today. That\'s the whole business."']); break;
    case 'mare': S.flags.p38=2; P.carry=null; G.events.push({type:'sfx',name:'good'}); G.events.push({type:'banner',text:'The mare eats. It starts to rain.'}); G.events.push({type:'save'}); break;
    case 'order': S.flags.p38=3; P.carry='order'; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'save'}); break;
    case 'back': leave38(G); break;
    case 'talk38': { const id=t.q.def.id;
      if(id==='founder') say38(G,PEOPLE38.founder,['"You\'re not from around here. That\'s all right. Showing up is the business, wherever you\'re from."']);
      else if(id==='miller') say38(G,PEOPLE38.miller,['Mrs. Miller: "The Phillips order came through the rain again. It always does."']);
      else say38(G,PEOPLE38.greg38,['Greg: "Counting."','Greg: "Sacks, mostly. The mare is not in the ledger. I checked."']); break; }
    case 'give': P.carry=null; G.events.push({type:'sfx',name:'good'}); finish38(G); break;
    case 'talk': { const id=t.q.def.id, st=S.flags.p38|0;
      if(id==='founder') say38(G,PEOPLE38.founder,[st<2?'"A store\'s just a building. Showing up is the business."':'"Rain\'s coming down. The Millers are still waiting on that order."']);
      else say38(G,PEOPLE38.miller,[st<3?'Mrs. Miller: "Is that the Phillips boy? We\'re expecting an order today."':'Mrs. Miller: "In this weather? Well. I suppose you said you would."']); break; }
  }
}
function tick38(G,dt){
  const P=G.p38, h=G.hero;
  for(const q of P.npcs){ let inp=0;
    if(q.def.id==='greg38'&&q.walkTo==null) q.walkTo=q.w.x<-1800?X.miller-160:X.start+200;
    if(q.walkTo!=null){ const d=q.walkTo-q.w.x; if(Math.abs(d)>4) inp=Math.sign(d)*(q.slow||0.5); else q.walkTo=null; }
    else if(P.scene!=='later'&&Math.abs(h.x-q.w.x)<70&&Math.sign(h.x-q.w.x)!==q.w.facing&&Math.abs(h.x-q.w.x)>8) inp=0.09*Math.sign(h.x-q.w.x);
    q.pose=E.updateWalker(q.w,world38(),inp,dt); q.w.events.length=0; }
  if(P.scene==='visit'){ P.remT-=dt; const g=P.npcs.find(q=>q.def.id==='greg38');
    if(g&&P.remT<=0) for(const q of P.npcs){ if(q===g||Math.abs(q.w.x-g.w.x)>70) continue; const r=REMARKS[P.remark%REMARKS.length]; P.remark++; P.remT=9;
      G.events.push({type:'hint',text:(r[0]==='founder'?'The Founder':'Mrs. Miller')+': '+r[1]}); break; } }
  G.target=target38(G);
}

/* ---------------- hooks into the game ---------------- */
const base={freshSave:GM.freshSave,create:GM.create,update:GM.update,interact:GM.interact,command:GM.command,objective:GM.objective,clock:GM.clock};
GM.freshSave=function(){ const s=base.freshSave(); s.flags.p38=0; s.pos={node:'y1938',x:X.start}; return s; };
GM.create=function(save){
  const G=base.create(save||GM.freshSave()); G.cine=[]; G.card=null; G.p38=null;
  if(G.cur.node&&G.cur.node.id==='y1938'){ const st=G.S.flags.p38|0;
    if(st>=5){ leave38(G); G.events.length=0; }                         // saved during a portal visit: come back through
    else if(st>=4){ arrive(G); G.events.length=0; }                         // saved mid-cutscene: carry on to Easton
    else{ setup38(G); if(st===0) G.cine.push(card('1938','Germansville, Pennsylvania',4)); } }
  return G;
};
GM.update=function(G,ix,iy,dt){
  const busy=!!(G.card||G.cine.length&&!G.dialog&&G.cine[0].card!==undefined)||(G.p38&&G.p38.scene==='later');
  if(busy){ ix=0; iy=0; }
  base.update(G,ix,iy,dt);
  if(G.p38) tick38(G,dt);
  runCine(G,dt);
};
GM.interact=function(G){
  if(G.card){ G.card.t=G.card.dur; return; }
  if(G.dialog){ base.interact(G); return; }
  if(G.p38){ const t=G.target; if(t&&t.kind==='p38') interact38(G,t); return; }
  base.interact(G);
};
GM.command=function(G,name){ if(G.card||(G.p38&&G.p38.scene==='later')) return false; return base.command(G,name); };
GM.objective=function(S){ return S.pos.node==='y1938'?OBJ[S.flags.p38|0]:base.objective(S); };
GM.clock=function(S){ return S.pos.node==='y1938'?'1938':base.clock(S); };
GM.skipPrologue=function(G){ if(G.p38||(G.cur.node&&G.cur.node.id==='y1938')) arrive(G); };
GM.card=card; GM.dlg=dlg; GM.P38={X:X,HAND:HAND,PEOPLE:PEOPLE38};
GM.HERO={name:'Brian W',role:'Web Developer'};
})(typeof globalThis!=='undefined'?globalThis:this);
