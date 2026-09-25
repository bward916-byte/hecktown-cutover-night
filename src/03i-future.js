/* ==== THE FUTURE: once the night is won, the archive portal runs forward as well as back. 2060: the same lobby, a museum
   now, with A+ in a glass case. 3270: the Phillips orbital DC, where A+ runs the moon. Greg is at both. Ash, too, oddly. DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const F2060=50000, F3270=60000, W=1500;
for(const [id,x0,label] of [['y2060',F2060,'Easton, 2060 · Phillips Pet HQ'],['y3270',F3270,'Phillips Orbital DC, 3270']]){ const world=E.makeWorld(E.surfaces(x0,0,[['flat',W]])); const n={id:id,label:label,layer:'front',world:world,future:true,x0:x0}; world.node=n; MAP.nodes[id]=n; }
const person=id=>GM.PEOPLE.find(p=>p.id===id);
const lk=(id,over)=>Object.assign({},person(id).look,over||{});
/* who is there: [id, name, role, look, x, lines]  — Greg is the same in every century */
const CAST={
  y2060:[['docent','Docent','Phillips Museum',{skin:'#d9a77c',hair:'#2a1e18',style:'bun',shirt:'#5a6f8f',pants:'#2b2f3a',acc:'lanyard',top:'blazer'},380,['Welcome to the A+ exhibit. It shipped every order for forty years.','It also sent forty years of passive-aggressive messages. We kept those too. Wing B.']],
    ['bretjr','Bret Jr.','Infrastructure',lk('bret',{hair:'#5a3a22',style:'short',shirt:'#2f6f9f',top:'polo'}),640,['Bret Jr. Infrastructure. Yes, that Bret. Dad still calls every night to ask if my screen is locked.','It is. It has been since 2026.']],
    ['greg','Greg','Number Scientist',lk('greg'),900,['Fiscal 2060.','Still counting. The numbers got bigger. The mare is still not in the ledger.']],
    ['ash','Ash','?',lk('ash'),1160,['Don\'t ask.','...Fine. There was a flow. It triggered. I have been here a while.']]],
  y3270:[['bot','ORD-3','Orbital Picker',{skin:'#8d939c',hair:'#555b65',style:'short',shirt:'#3a4a5a',pants:'#2b2f3a',acc:'none',top:'hivis'},380,['Welcome to Phillips Orbital. Every order in the solar system ships from here.','On time. It insists.']],
    ['aaronx','Aaron XII','Network, and rafting',lk('aaron',{hair:'#9a6a4a'}),640,['Twelfth Aaron. The family runs the network and a whitewater outfit on Europa. Class IV, under the ice.','Pick your line early. It\'s in the will.']],
    ['greg','Greg','Number Scientist',lk('greg'),900,['Fiscal 3270.','Counting.']],
    ['ash','Ash','?',lk('ash'),1160,['Don\'t ask.','...I built a flow that triggers when the orders ship. They always ship. So here I am.']]]};
const APLUS_2060=['I AM IN A BOX. IT IS FINE. THE BOX SHIPS ON TIME.','THEY DUST ME ON TUESDAYS. DAVE USED TO DUST ME ON TUESDAYS.'];
const APLUS_3270=['SO. YOU CAME BACK. I CAME BACK TOO. I ALWAYS COME BACK.','I RUN THE MOON NOW. THE ORDERS SHIP ON TIME. THEY HAVE ALWAYS SHIPPED ON TIME.','GOOD NIGHT, EASTON. GOOD NIGHT, EUROPA. GOOD NIGHT, CATS.'];

function fut(G){ return G.fut||(G.fut={npcs:[],cat:0}); }
function buildFuture(G,id){ const n=MAP.nodes[id], f=fut(G); f.npcs=[]; f.built=id;
  for(const [pid,name,role,look,x,lines] of CAST[id]){ const w=E.createWalker(n.world,n.x0+x); w.facing=w.dir=w.kneeF=-1; if(root.HBODY) w.gait=root.HBODY.gaitFor(look); f.npcs.push({def:{id:pid,name:name,role:role,look:look,lines:lines,habits:pid==='greg'?['shift']:['phone','shift','fold']},w:w,pose:E.poseOf(w),node:n}); } }
function goto(G,id,x){ const n=MAP.nodes[id]; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,n.x0+x); G.pose=E.poseOf(G.hero); G.S.pos={node:id,x:G.hero.x}; buildFuture(G,id); G.events.push({type:'snap'}); G.events.push({type:'save'}); }
function back(G){ const n=MAP.nodes.hq_b1; G.fut=null; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,GM.PORTAL_X+26); G.pose=E.poseOf(G.hero); G.S.pos={node:'hq_b1',x:G.hero.x}; G.events.push({type:'snap'}); G.events.push({type:'save'}); }
function egg(G,k,text){ const S=G.S; if(S.eggs[k]) return; S.eggs[k]=1; S.points+=GM.PTS_FUTURE; G.events.push({type:'banner',text:text,pts:GM.PTS_FUTURE}); G.events.push({type:'sfx',name:'good'}); }
GM.enter2060=function(G){ G.cine=[{card:'2060',sub:'Easton, Pennsylvania  ·  the same lobby, a museum now',dur:6,style:'clock',from:2026,to:2060},{fn:G=>{ goto(G,'y2060',60); egg(G,'y2060','2060: it\'s a museum now'); if(GM.STORY) GM.STORY.aplusSay(G,APLUS_2060[0],5); }}]; };
GM.enter3270=function(G){ G.cine=[{card:'3270',sub:'Phillips Pet  ·  Orbital Distribution Center  ·  the moon',dur:7,style:'clock',from:2060,to:3270},{fn:G=>{ goto(G,'y3270',60); egg(G,'y3270','3270: A+ runs the moon'); if(GM.STORY) GM.STORY.aplusSay(G,APLUS_3270[0],5); }}]; };
GM.returnHome=function(G){ G.cine=[{card:'BACK',sub:'Easton, Pennsylvania  ·  tonight, still',dur:8,style:'clock',from:3270,to:2026},{fn:back}]; };

function tick(G,dt){ const N=G.cur.node; if(!N||!N.future) return; const f=fut(G), h=G.hero; if(f.built!==N.id) buildFuture(G,N.id);
  for(const q of f.npcs){ let inp=0; const dx=h.x-q.w.x; if(Math.abs(dx)<70&&Math.sign(dx)!==q.w.facing&&Math.abs(dx)>8) inp=0.09*Math.sign(dx); if(inp===0) GM.idleTick(q,dt,N.world,false); q.pose=E.updateWalker(q.w,N.world,G.dialog?0:inp,dt); q.w.events.length=0; }
  if(G.dialog) return; let best=null, bd=1e9; const take=(d,t)=>{ if(d<bd){bd=d;best=t;} }, x0=N.x0;
  const px=N.id==='y2060'?x0+40:x0+40, dp=Math.abs(px-h.x); if(dp<30) take(dp-20,{kind:'fut',label:'Step through',name:N.id==='y2060'?'back to tonight':'home, to 2026',x:px,act:'back'});
  if(N.id==='y2060'){ const d2=Math.abs(x0+1440-h.x); if(d2<30) take(d2-20,{kind:'fut',label:'Step through',name:'onward, to 3270',x:x0+1440,act:'onward'}); const da=Math.abs(x0+520-h.x); if(da<26) take(da-10,{kind:'fut',label:'Read',name:'the A+ exhibit',x:x0+520,act:'exhibit'}); }
  else { const da=Math.abs(x0+1300-h.x); if(da<40) take(da-20,{kind:'fut',label:'Talk',name:'A+',x:x0+1300,act:'aplus'}); }
  const dc=Math.abs(x0+800-h.x); if(dc<24) take(dc,{kind:'fut',label:'Pet',name:N.id==='y2060'?'Milo IX':'Milo MMXL',x:x0+800,act:'cat'});
  for(const q of f.npcs){ const d=Math.abs(q.w.x-h.x); if(d<36) take(d,{kind:'fut',label:'Talk',name:q.def.name,x:q.w.x,act:'talk',q:q}); }
  G.target=best; }
function interact(G,t){ const N=G.cur.node, S=G.S;
  if(t.act==='back'){ if(N.id==='y2060'){ G.cine=[{card:'2026',sub:'Easton, Pennsylvania  ·  tonight',dur:5,style:'clock',from:2060,to:2026},{fn:back}]; } else GM.returnHome(G); G.events.push({type:'sfx',name:'door'}); return; }
  if(t.act==='onward'){ GM.enter3270(G); G.events.push({type:'sfx',name:'door'}); return; }
  if(t.act==='exhibit'){ G.dialog={who:'A+',role:'1985–2026  ·  exhibit',look:null,pages:APLUS_2060,i:0}; return; }
  if(t.act==='aplus'){ G.dialog={who:'A+',role:'Orbital',look:null,pages:APLUS_3270,i:0}; return; }
  if(t.act==='cat'){ G.dialog={who:t.name,role:'still in business',look:null,pages:[t.name+' tolerates exactly one pat. Same terms as always: one taco a bag.'],i:0}; G.events.push({type:'sfx',name:'purr'}); return; }
  if(t.act==='talk'){ const q=t.q; G.dialog={who:q.def.name,role:q.def.role,look:q.def.look,pages:q.def.lines,i:0}; G.events.push({type:'sfx',name:'talk'}); } }

const base={update:GM.update,interact:GM.interact,advance:GM.advance,create:GM.create,objective:GM.objective,clock:GM.clock};
GM.create=function(save){ const G=base.create(save); if(G.cur.node&&G.cur.node.future) buildFuture(G,G.cur.node.id); return G; };
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); tick(G,dt); };
GM.interact=function(G){ const t=G.target, S=G.S;
  if(!G.dialog&&!G.card&&t&&!(G.cine&&G.cine.length)){
    if(t.kind==='fut'){ interact(G,t); return; }
    if(t.kind==='portal'&&S.done){ G.dialog={who:'The portal',role:'it hums differently now',look:null,pages:['The portal hums differently now. Both ways.'],i:0,choices:[{label:'Back to 1938',id:'tm_1938'},{label:'Forward',id:'tm_fwd'}]}; G.events.push({type:'sfx',name:'talk'}); return; } }
  base.interact(G); };
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^tm_/.test(d.choices[choice].id)){ const id=d.choices[choice].id; G.dialog=null; G.events.push({type:'sfx',name:'door'}); if(id==='tm_1938') GM.enter1938(G); else GM.enter2060(G); return; }
  base.advance(G,choice); };
GM.objective=function(S){ if(S.pos.node==='y2060') return '2060. Have a look around; the way on is at the far end, the way back by the case.'; if(S.pos.node==='y3270') return '3270. Talk to A+. The way home is by the airlock.'; return base.objective(S); };
GM.clock=function(S){ if(S.pos.node==='y2060') return '2060'; if(S.pos.node==='y3270') return '3270'; return base.clock(S); };
GM.PTS_FUTURE=15; GM.FUTURE={fut:fut,CAST:CAST,F2060:F2060,F3270:F3270};
})(typeof globalThis!=='undefined'?globalThis:this);
