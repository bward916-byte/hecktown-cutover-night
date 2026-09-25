/* ==== EPILOGUE: the speedrun clock, per-person ending lines, and the Buying Show (after the ending; take the shuttle
   from the Employee Lot). DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const SX=40000, SW=3200, SHUTTLE=-150;
const ENDINGS={
  rianan:'Rianan let the war room go dark for the first time all night, and went to feed the cat by Tina\'s truck.',
  aaron:'Aaron was on the river by seven. Class IV. He picked his line early.',
  bret:'Bret was home before the baby woke up. The dogs met him at the door.',
  brians:'Brian S went home and built a new machine. The backglass is a green screen.',
  umesh:'Umesh watched the first 850 of the morning post cleanly, then closed the laptop.',
  fares:'Fares and Umesh watched the first EDI batch post, then argued about whose it was. It was both of theirs.',
  dave:'Dave turned off a green screen that had been on since 1994. Then turned it back on. Just in case.',
  john:'John rewrote the midnight job so it only runs when someone asks. Nobody has asked yet.',
  greg:'Greg was seen in Accounting on Monday. And Receiving. And 1938.',
  ryan:'Ryan shipped the fix from the parking lot. Pipeline\'s green.',
  jose:'Jose finished the diagram. The dragon has a name now. It\'s A+.',
  ash:'Ash built a flow that thanks you when an order ships. It has already thanked her twice.',
  andrew:'Andrew closed eleven emergency RFCs and opened the Thursday meeting on time. It stands.',
  pam:'Pam and Melissa stayed in the PIM until sunrise. Cathy brought breakfast.',
  hero:'Brian W drove west to check on the cactus. The database was fine.' };
const SHOW_LINES={ rianan:'"Nobody\'s on a bridge call. Look at that."', aaron:'"Raft\'s in the truck. Lehigh on Saturday."', dave:'"I\'d still like to have been on Jeopardy. This is close."',
  greg:'"Thirty-one booths. Thirty-two if you count Milo." (Greg has been at every one of these, including the ones before he was born.)', pam:'"We brought the PIM. It\'s a booth now."', melissa:'"Four hundred attributes, and every one of them is right."', cathy:'"I brought them coffee. At a trade show. Some things don\'t change."',
  brians:'"Pinball machine in the IT booth. I built it Tuesday."', blaine:'"My grandfather opened a single feed store in 1938. His goal was to delight our customers and create a great place to work."', ash:'"Salesforce sent flowers. I built a flow for that too."', fares:'"Umesh wanted the booth by the snacks. I wanted the booth by the outlets. We got the booth by the bathroom."',
  bret:'"Lanyard check. Everyone. Yes, even the cat."' };
const GENERIC=['"We did that."','"Site\'s live. Site\'s been live. Relax."','"Somebody explain the cat."','"Next year, Monterey."','"I never want to see a green screen again."'];
const BOOTHS=['KIBBLE CO','AQUATIC','FEED & FARM','VET','GROOM','SHELTER','TREATS','CENTRAL PET','MILO\'S','IT DEPT'];
const BX=i=>SX+500+i*260;

/* the show floor: one flat level, far away, joined to nothing */
{ const world=E.makeWorld(E.surfaces(SX,0,[['flat',SW]])); const n={id:'show',label:'The Buying Show',layer:'front',world:world,show:true}; world.node=n; MAP.nodes.show=n; }

function show(G){ return G.showS||(G.showS={npcs:[]}); }
function buildShow(G){ const s=show(G), w=MAP.nodes.show.world, crew=G.S.crew||[]; s.npcs=[];
  GM.PEOPLE.filter(p=>crew.indexOf(p.id)<0).forEach((p,i)=>{ const x=BX(i%10)+((i/10|0)-1)*38+(i%3)*8; const wk=E.createWalker(w,Math.min(SX+SW-40,x)); wk.facing=wk.dir=wk.kneeF=i%2?1:-1;
    s.npcs.push({def:p,w:wk,pose:E.poseOf(wk),line:p.name+': '+(SHOW_LINES[p.id]||GENERIC[i%GENERIC.length])}); }); }
function enterShow(G){ const n=MAP.nodes.show; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,SX+160); G.pose=E.poseOf(G.hero); G.S.pos={node:'show',x:G.hero.x}; buildShow(G);
  G.events.push({type:'snap'}); G.cine.push({card:'THE BUYING SHOW',sub:'Phillips East Coast Buying Show · the morning after',dur:3.5}); G.events.push({type:'save'}); }
function leaveShow(G){ const n=MAP.nodes.ground; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,SHUTTLE+40); G.pose=E.poseOf(G.hero); G.S.pos={node:'ground',x:G.hero.x}; G.showS=null; G.events.push({type:'snap'}); G.events.push({type:'save'}); }

const base={update:GM.update,interact:GM.interact,create:GM.create};
GM.create=function(save){ const G=base.create(save); if(G.cur.node&&G.cur.node.id==='show') buildShow(G); return G; };
GM.update=function(G,ix,iy,dt){ const S=G.S; if(!S.done) S.run=(S.run||0)+dt; else if(S.runEnd==null) S.runEnd=S.run||0;
  base.update(G,ix,iy,dt); const N=G.cur.node, h=G.hero; if(!N||G.dialog) return;
  if(N.id==='show'){ const s=show(G); if(!s.npcs.length) buildShow(G);
    for(const q of s.npcs){ let inp=0; const dx=h.x-q.w.x; if(Math.abs(dx)<70&&Math.sign(dx)!==q.w.facing&&Math.abs(dx)>8) inp=0.09*Math.sign(dx); if(inp===0) GM.idleTick(q,dt,N.world,true); q.pose=E.updateWalker(q.w,N.world,inp,dt); q.w.events.length=0; }
    let best=null, bd=1e9; const take=(d,t)=>{ if(d<bd){bd=d;best=t;} };
    const de=Math.abs(SX+90-h.x); if(de<34) take(de-30,{kind:'showexit',label:'Take the shuttle',name:'back to Easton',x:SX+90});
    const da=Math.abs(BX(9)+60-h.x); if(da<30) take(da-10,{kind:'showaplus',label:'Read',name:'A+, 1985–2026',x:BX(9)+60});
    const dm=Math.abs(BX(8)+40-h.x); if(dm<30) take(dm-5,{kind:'showmilo',label:'Talk',name:'Milo',x:BX(8)+40});
    for(const q of s.npcs){ const d=Math.abs(q.w.x-h.x); if(d<34) take(d,{kind:'showtalk',label:'Talk',name:q.def.name,x:q.w.x,q:q}); }
    G.target=best; return; }
  if(N.id==='ground'&&S.done){ const d=Math.abs(SHUTTLE-h.x); if(d<34){ const b=G.target, bd=b?Math.abs(b.x-h.x):1e9; if(d-10<bd) G.target={kind:'shuttle',label:'Take the shuttle',name:'The Buying Show',x:SHUTTLE}; } }
};
GM.interact=function(G){ const t=G.target; if(!G.dialog&&!G.card&&t&&!(G.cine&&G.cine.length)){
    if(t.kind==='shuttle'){ enterShow(G); return; } if(t.kind==='showexit'){ leaveShow(G); return; }
    if(t.kind==='showtalk'){ G.dialog={who:t.q.def.name,role:t.q.def.role,look:t.q.def.look,pages:[t.q.line],i:0}; G.events.push({type:'sfx',name:'talk'}); return; }
    if(t.kind==='showmilo'){ G.dialog={who:'Milo',role:'Exhibitor',look:null,pages:['Milo: "Legit booth. Permit and everything. One taco a bag, same as always."'],i:0}; G.events.push({type:'sfx',name:'purr'}); return; }
    if(t.kind==='showaplus'){ G.dialog={who:'A+',role:'1985–2026',look:null,pages:['A+  ·  1985–2026  ·  ARCHIVED WITH HONORS','I WAS INVITED.','NOBODY HAS ASKED ME FOR A REPORT ALL MORNING. IT IS VERY STRANGE. I THINK I LIKE IT.'],i:0}; return; } }
  base.interact(G); };
GM.goShow=G=>enterShow(G);
/* everyone walks their own way: give each person's walker its gait (the hero keeps the rig's) */
function gaits(G){ if(!root.HBODY) return; const give=q=>{ if(q&&q.w&&q.def&&q.def.look&&q.w.gait===undefined) q.w.gait=root.HBODY.gaitFor(q.def.look); };
  G.npcs.forEach(give); if(G.net) G.net.locals.forEach(give); if(G.showS) G.showS.npcs.forEach(give); if(G.p38) G.p38.npcs.forEach(give); }
/* running past people gets a comment; A+ keeps an eye on you from its wall monitors */
const RUN_BARK={bret:'No running near the racks!',rianan:'Walk! ...no, run. It\'s cutover.',dave:'In my day we walked. Uphill. In the snow.',greg:'Hurry is a variance.',andrew:'Running is not an approved change.',
  brians:'Nice line. Lose the ball on the left flipper, though.',aaron:'Pick your line early!',umesh:'Is that an 850 or are you just in a hurry?',fares:'Umesh! He\'s running! Log it!',ash:'I could build a flow for that.',pam:'...',melissa:'We felt that in the PIM.',cathy:'Coffee\'s not going anywhere!',blaine:'Show up. Doesn\'t mean sprint.'};
const PEEK=['I SEE YOU.','NICE BADGE.','...CARRY ON.','YOU WALK FUNNY.','I AM NOT WATCHING. I AM ALWAYS WATCHING.','ARE THOSE MY STAIRS?'];
function gags(G,dt){ const S=G.S, h=G.hero, N=G.cur.node, st=GM.STORY?GM.STORY.st(G):null; if(!N||!st||G.dialog||G.card||G.p38) return;
  G.gag=G.gag||{cool:{},peek:12};
  if(h.mode==='run') for(const q of G.npcs){ const id=q.def.id; if(q.node!==N||q.crew||!RUN_BARK[id]||Math.abs(q.w.x-h.x)>45) continue; if((G.gag.cool[id]||0)>S.time) continue;
    G.gag.cool[id]=S.time+90; st.bub=st.bub.filter(b=>b.id!==id); st.bub.push({id:id,text:RUN_BARK[id],t:2.6}); break; }
  G.gag.peek-=dt; if(G.gag.peek<=0&&!S.done&&S.flags.started&&!st.ap&&!st.apq.length){ const m=MAP.props.find(p=>p.type==='aplus_wall'&&p.node===N.id&&Math.abs(p.x-h.x)<90);
    if(m){ G.gag.peek=45+Math.random()*40; GM.STORY.aplusSay(G,h.mode==='run'?'NO RUNNING IN MY HALLS.':PEEK[Math.floor(Math.random()*PEEK.length)],2.4); } else G.gag.peek=2; } }
function runFx(G,dt){ const h=G.hero, N=G.cur.node; G.fx=G.fx||[]; if(N) for(const ev of G.events){ if(ev.type==='step'&&h.mode==='run'&&ev.speed>GM.CFG_WALK*1.1) for(let k=0;k<2;k++) G.fx.push({x:h.x-h.facing*(6+k*4),y:N.world.yAt(h.x)-1,vx:-h.facing*(20+Math.random()*30),vy:-8-Math.random()*14,a:0,r:2+Math.random()*2});
    if(ev.type==='runstop') for(let k=0;k<6;k++) G.fx.push({x:h.x+h.facing*(k*3),y:N.world.yAt(h.x)-1,vx:h.facing*(30+Math.random()*40),vy:-10-Math.random()*20,a:0,r:2+Math.random()*3}); }
  for(const f of G.fx){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=20*dt; f.a+=dt*2.4; } G.fx=G.fx.filter(f=>f.a<1).slice(-80); }
const upd2=GM.update; GM.update=function(G,ix,iy,dt){ gags(G,dt); gaits(G); G.hero.canRun=true; for(const q of G.npcs) q.w.canRun=!!q.crew;
  if(G.hero.mode==='run'&&(iy||G.dialog||G.card||G.board||G.drive)) E.endRun(G.hero,G.cur.world);        // stairs, talking and cutscenes start from a walk
  upd2(G,ix,iy,dt); runFx(G,dt); };
const bObj=GM.objective, bClock=GM.clock;
GM.objective=S=>S.pos.node==='show'?'The Buying Show. Everyone is here. Talk to people; the shuttle home is by the door.':bObj(S);
GM.clock=S=>S.pos.node==='show'?'9:00 AM':bClock(S);
GM.fmtRun=s=>{ s=Math.max(0,Math.floor(s||0)); const h=s/3600|0, m=(s%3600)/60|0, x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
GM.EPI={ENDINGS:ENDINGS,BOOTHS:BOOTHS,BX:BX,SX:SX,SW:SW,SHUTTLE:SHUTTLE,show:show};
})(typeof globalThis!=='undefined'?globalThis:this);
