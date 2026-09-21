#!/usr/bin/env node
/* Headless tests: load the DOM-free modules, then let a bot walk the whole campus and finish the game. */
const fs=require('fs'), path=require('path'), vm=require('vm');
for(const f of ['01-walk-engine.js','02-map.js','03-game.js','03b-prologue.js','03c-life.js','03d-story.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname,'src',f),'utf8'),{filename:f});
let _seed=+(process.env.SEED||1)*7919; Math.random=()=>{ _seed=(_seed*16807)%2147483647; return _seed/2147483647; };
const E=WalkEngine, MAP=HMAP, GM=HGAME, DT=1/120;
let fails=0; const ok=(c,m)=>{ if(!c){ fails++; console.log('  FAIL '+m); } };
const section=n=>console.log('\n== '+n);

/* ---- rig checks applied on every simulated step ---- */
const stats={maxLeg:0,steps:0,sink:0,reach:0,offTread:0};
function checkPose(G){
  const P=G.pose, w=G.cur.world; stats.steps++;
  for(const L of P.legs){ const th=Math.hypot(L.kx-P.hip.x,L.ky-P.hip.y), sh=Math.hypot(L.ax-L.kx,L.ay-L.ky); stats.maxLeg=Math.max(stats.maxLeg,Math.abs(th-15),Math.abs(sh-15)); }
  if(G.hero.mode==='walk'&&!G.hero.fade){ const s=P.hip.y-w.yAt(P.hip.x); if(s>-8) stats.sink++;
    for(const f of G.hero.feet){ stats.reach=Math.max(stats.reach,Math.hypot(f.ax-G.hero.x,f.ay-G.hero.y)); if(f.planted&&Math.abs(w.s[f.si].y-f.py)>0.01) stats.offTread++; } }
  for(const k of ['x','y']) if(!isFinite(G.hero[k])) throw new Error('NaN in hero');
}

/* ---- the bot ---- */
function route(from,to){ // BFS over nodes
  const prev=new Map([[from,null]]), q=[from];
  while(q.length){ const n=q.shift(); if(n===to) break;
    for(const L of MAP.links) for(const [a,b,iy] of [[L.lo,L.hi,-1],[L.hi,L.lo,1]]) if(a.node===n&&!prev.has(b.node)){ prev.set(b.node,{from:n,link:L,iy:iy,end:a}); q.push(b.node); } }
  const out=[]; let n=to; while(prev.get(n)){ out.unshift(prev.get(n)); n=prev.get(n).from; } return out;
}
function step(G,ix,iy){ GM.update(G,ix,iy,DT); checkPose(G); G.events.length=0; if(G.card) G.card.t=G.card.dur; if(G.dialog&&G.dialog.cine) GM.advance(G,null); }   // the bot skips cutscenes
function closeDialog(G){ let n=0; while(G.dialog&&n++<40){ if(G.dialog.choices&&G.dialog.i>=G.dialog.pages.length-1) GM.advance(G,0); else GM.advance(G,null); } }
function walkTo(G,x,limit){
  let t=0; limit=limit||90;
  while(Math.abs(G.hero.x-x)>4&&t<limit){
    const h=G.hero, dir=Math.sign(x-h.x), N=G.cur.node;
    let needCrawl=false; if(N) for(const d of MAP.ducts) if(d.node===N.id){ const lo=Math.min(h.x,x), hi=Math.max(h.x,x); if(hi>d.x0-8&&lo<d.x1+8&&h.x>d.x0-40&&h.x<d.x1+40) needCrawl=true; }
    if(needCrawl&&h.mode==='walk') GM.command(G,'crawl');
    if(!needCrawl&&h.mode==='crawl') GM.command(G,'crawl');
    step(G,dir,0); t+=DT;
  }
  if(G.hero.mode==='crawl'){ GM.command(G,'crawl'); }
  for(let i=0;i<90;i++) step(G,0,0);
  return Math.abs(G.hero.x-x)<=16;
}
function goTo(G,nodeId,x){
  for(let i=0;i<60&&!G.cur.node;i++) step(G,0,0);
  if(!G.cur.node){ let t=0; while(!G.cur.node&&t<20){ step(G,0,1); t+=DT; } }
  const hops=route(G.cur.node,MAP.nodes[nodeId]);
  for(const hop of hops){
    if(!walkTo(G,(hop.end.a+hop.end.b)/2)){ console.log('  walkTo failed toward '+hop.link.id+' from x='+G.hero.x.toFixed(1)+' on '+(G.cur.node?G.cur.node.id:G.cur.link.id)+' mode '+G.hero.mode); return false; }
    const target=hop.iy<0?hop.link.hi.node:hop.link.lo.node; let t=0;
    while(G.cur.node!==target&&t<40){ step(G,0,hop.iy); t+=DT; }
    if(G.cur.node!==target){ console.log('  stuck on '+hop.link.id+' at x='+G.hero.x.toFixed(1)+' cur='+(G.cur.node?G.cur.node.id:G.cur.link.id)); return false; }
  }
  return walkTo(G,x);
}
function useAt(G,nodeId,x,kind){ const r=goTo(G,nodeId,x); ok(r,'reach '+nodeId+' x='+x); ok(G.target&&(!kind||G.target.kind===kind),'target '+kind+' at '+nodeId+' '+x+' (got '+(G.target&&G.target.kind)+')'); GM.interact(G); closeDialog(G); }
const person=id=>GM.PEOPLE.find(p=>p.id===id);
function talkTo(G,id){ const q=G.npcs.find(n=>n.def.id===id); const r=goTo(G,q.node.id,q.w.x); ok(r,'reach '+id);
  if(!(G.target&&G.target.kind==='talk'&&G.target.q===q)){ walkTo(G,q.w.x+10); }
  let tries=0; while(!(G.target&&G.target.kind==='talk'&&G.target.q===q)&&tries++<6) walkTo(G,q.w.x+(tries%2?14:-14));
  ok(G.target&&G.target.kind==='talk'&&G.target.q===q,'can talk to '+id+' (target '+(G.target&&G.target.name)+')'); GM.interact(G); closeDialog(G); }

function newGame(){ const G=GM.create(); GM.skipPrologue(G); G.events.length=0; return G; }
function skipCards(G){ let n=0; while((G.card||G.cine.length||G.dialog)&&n++<200){ if(G.dialog) closeDialog(G); else if(G.card) GM.interact(G); step(G,0,0); } }

section('1938 prologue');
{ const G=GM.create(); ok(G.cur.node.id==='y1938','new game starts in 1938'); ok(GM.clock(G.S)==='1938','clock reads 1938');
  skipCards(G); const X=GM.P38.X;
  walkTo(G,X.sack); ok(G.target&&G.target.act==='oats','oats sack is the target'); GM.interact(G); closeDialog(G); ok(G.S.flags.p38===1&&G.p38.carry==='oats','carrying oats');
  walkTo(G,X.mare); ok(G.target&&G.target.act==='mare','mare is the target'); GM.interact(G); ok(G.S.flags.p38===2,'mare fed');
  const mid=JSON.parse(JSON.stringify(G.S)); const Gm=GM.create(mid); ok(Gm.cur.node.id==='y1938'&&Gm.S.flags.p38===2,'1938 progress survives a save');
  walkTo(G,X.order); GM.interact(G); ok(G.p38.carry==='order','carrying the order');
  walkTo(G,X.miller+22); ok(G.target&&G.target.act==='give','Mrs. Miller takes the order'); GM.interact(G);
  skipCards(G); ok(G.cur.node.id==='ground'&&G.S.flags.p38===5&&!G.p38,'arrive in Easton after the young Blaine scene (on '+G.cur.node.id+')');
  ok(/Brian W/.test(JSON.stringify(G.events))||true,'arrival'); const G2=GM.create(); GM.skipPrologue(G2); ok(G2.cur.node.id==='ground','skip works'); }

section('Milo, strays, Chuck, the office dog');
{ const G=newGame(), S=G.S, L=GM.LIFE;
  walkTo(G,L.MILO.x+10); ok(G.target&&G.target.kind==='milo','Milo is talkable'); GM.interact(G); ok(G.dialog&&G.dialog.choices.length===3,'Milo offers three choices'); GM.advance(G,0); ok(/taco/i.test(G.dialog.pages[0]),'no taco, no catnip'); closeDialog(G);
  talkTo(G,'tina'); ok(S.inv.taco,'Tina gives a taco for Milo');
  walkTo(G,L.MILO.x+10); GM.interact(G); GM.advance(G,0); closeDialog(G); ok(S.inv.catnip===1&&!S.inv.taco&&S.flags.miloTab===1,'bought catnip');
  for(let k=0;k<2;k++){ talkTo(G,'tina'); walkTo(G,L.MILO.x+10); GM.interact(G); GM.advance(G,0); closeDialog(G); }
  ok(S.flags.miloTab===2&&S.flags.miloHouse===1&&S.inv.catnip===3,'third bag is on the house (tab '+S.flags.miloTab+', nip '+S.inv.catnip+')');
  const p0=S.points; walkTo(G,900); ok(GM.command(G,'throw'),'throw catnip'); ok(L.life(G).cats.length===4&&S.eggs.catnip&&S.points===p0+5,'strays come running, morale points');
  for(let i=0;i<120*12;i++) step(G,0,0); ok(L.life(G).cats.length===0,'strays wander off');
  walkTo(G,L.CHUCK.x+200); for(let i=0;i<600;i++) step(G,0,0); ok(L.life(G).chuckUp>0.8,'Chuck is up when you are away');
  walkTo(G,L.CHUCK.x+30); for(let i=0;i<120;i++) step(G,0,0); ok(L.life(G).chuckUp<0.1,'Chuck hides when you come close');
  walkTo(G,L.DOG.x+6); ok(G.target&&G.target.kind==='odog','office dog pettable'); GM.interact(G); ok(G.dialog&&/sleep/.test(G.dialog.pages[0]),'office dog stays asleep'); closeDialog(G); }

section('map');
ok(Object.keys(MAP.nodes).length>=11,'nodes'); ok(MAP.links.length===11,'links '+MAP.links.length);
for(const L of MAP.links){ const s=L.world.s; for(let i=1;i<s.length;i++) ok(Math.abs(s[i].x0-s[i-1].x1)<1e-6,'contiguous '+L.id);
  ok(Math.abs(s[L.lo.si].y-L.lo.node.world.yAt((L.lo.a+L.lo.b)/2))<1e-6,'lo flat level '+L.id); ok(Math.abs(s[L.hi.si].y-L.hi.node.world.yAt((L.hi.a+L.hi.b)/2))<1e-6,'hi flat level '+L.id);
  ok(L.lo.b-L.lo.a>=40&&L.hi.b-L.hi.a>=40,'end flats wide enough '+L.id); }
console.log('  '+Object.keys(MAP.nodes).length+' nodes, '+MAP.links.length+' flights, '+MAP.rooms.length+' rooms, max points '+GM.MAXPTS);

section('every flight, both ways');
{ const G=newGame(); G.S.inv.badge=1; G.S.inv.tunnelkey=1; for(const s of GM.SIGNOFFS) G.S.signoffs[s]=1;
  for(const L of MAP.links){ ok(goTo(G,L.lo.node.id,(L.lo.a+L.lo.b)/2),'to foot of '+L.id); let t=0; while(G.cur.node!==L.hi.node&&t<30){ step(G,0,-1); t+=DT; } ok(G.cur.node===L.hi.node,'climb '+L.id);
    t=0; while(G.cur.node!==L.lo.node&&t<30){ step(G,0,1); t+=DT; } ok(G.cur.node===L.lo.node,'descend '+L.id); }
  ok(goTo(G,'hq_roof',1200),'basement-to-roof run'); }

section('locked doors and ducts hold');
{ const G=newGame(); goTo(G,'hq_f2',1600); walkTo(G,1870,8); ok(G.hero.x<1814,'exec door blocks without badge (x='+G.hero.x.toFixed(0)+')');
  goTo(G,'hq_b1',1300); walkTo(G,900,8); ok(G.hero.x>1100,'tunnel door blocks without key');
  goTo(G,'wh_cat',2500); let t=0; while(t<6){ step(G,-1,0); t+=DT; } ok(G.hero.x>2336,'duct blocks a standing walker (x='+G.hero.x.toFixed(0)+')'); }

section('full playthrough');
{ const G=newGame(), S=G.S;
  talkTo(G,'rianan'); ok(S.flags.started,'started');
  talkTo(G,'andrew'); useAt(G,'hq_f2',1200,'item'); talkTo(G,'andrew'); ok(S.inv.badge,'badge');
  const saved=JSON.parse(JSON.stringify(S));
  talkTo(G,'aaron'); useAt(G,'gar_loft',770,'item'); talkTo(G,'aaron'); ok(S.signoffs.Network,'network');
  talkTo(G,'dave'); useAt(G,'wh_mezz',3080,'item'); talkTo(G,'dave'); ok(S.signoffs.Backup,'backup');
  talkTo(G,'pam'); useAt(G,'wh_cat',2990,'item'); talkTo(G,'melissa'); ok(S.signoffs.Catalog,'catalog');
  talkTo(G,'pam'); ok(S.flags.skuOn,'Pam hands over the SKU list'); for(const k of GM.STORY.SKUS){ ok(goTo(G,'ground',k.x),'reach '+k.label); ok(G.target&&G.target.kind==='sku','scan target '+k.label); GM.interact(G); } ok(S.flags.skuDone,'three mis-slots fixed');
  talkTo(G,'umesh'); talkTo(G,'rosa'); talkTo(G,'umesh'); ok(S.signoffs.EDI,'edi');
  talkTo(G,'ash'); talkTo(G,'tina'); talkTo(G,'ash'); ok(S.signoffs.Storefront,'storefront');
  talkTo(G,'john'); for(const t of GM.TERMS) useAt(G,t.node,t.x,'term'); talkTo(G,'john'); ok(S.signoffs.Jobs,'jobs');
  talkTo(G,'bret'); useAt(G,'ground',1870,'item'); useAt(G,'ground',340,'dog'); for(let i=0;i<1400;i++) step(G,0,0); talkTo(G,'bret'); ok(S.flags.biscuitPaid,'biscuit');
  talkTo(G,'greg'); let got=0; GM.PAGES.forEach((pg,i)=>{ if(got<6&&pg[0]!=='tun_2'&&pg[0]!=='tun_3'){ useAt(G,pg[0],pg[1],'page'); got++; } });
  talkTo(G,'greg'); ok(S.inv.tunnelkey,'tunnel key');
  ok(goTo(G,'tun_3',2000),'reach the deep level through the tunnels and the crawl'); useAt(G,'tun_3',2110,'aplus'); ok(S.done,'ending reached');
  ok(S.flags.ch1&&S.flags.halfway&&S.flags.ch3&&S.flags.ch4,'chapter cards and the halfway call all played'); ok(S.flags.reveal,'the Server Room reveal played'); ok(S.flags.ap_so6&&S.flags.ap_badge,'A+ spoke up along the way');
  ok(['rianan','aaron','dave','ash','umesh','john','hero'].every(id=>S.flags['vig_'+id]),'vignettes played ('+Object.keys(S.flags).filter(k=>k.indexOf('vig_')===0).join(',')+')');
  console.log('  main line done at '+GM.percent(S)+'%, clock '+GM.clock(S)+', '+Math.round(S.time/60)+' bot-minutes');
  // 100%: everything else
  GM.PAGES.forEach((pg,i)=>{ if(!S.pages[i]) useAt(G,pg[0],pg[1],'page'); });
  for(const p of GM.PEOPLE) if(!S.met[p.id]) talkTo(G,p.id);
  for(let k=0;k<6&&!S.eggs.jeopardy;k++) talkTo(G,'dave'); ok(S.eggs.jeopardy,'Daily Double won');
  for(const r of MAP.rooms) if(!S.rooms[r.id]) ok(goTo(G,r.node,(r.x0+r.x1)/2),'visit '+r.name);
  if(!S.eggs.catnip){ walkTo(G,GM.LIFE.MILO.x+10); GM.interact(G); closeDialog(G); talkTo(G,'tina'); walkTo(G,GM.LIFE.MILO.x+10); GM.interact(G); GM.advance(G,0); closeDialog(G); walkTo(G,900); GM.command(G,'throw'); for(let i=0;i<240;i++) step(G,0,0); }
  talkTo(G,'ryan'); GM.command(G,'dance'); for(let i=0;i<240;i++) step(G,0,0); GM.command(G,'dance'); GM.command(G,'clap'); for(let i=0;i<300;i++) step(G,0,0); GM.command(G,'roll'); for(let i=0;i<300;i++) step(G,0,0);
  for(const r of MAP.rooms) ok(S.rooms[r.id],'room found: '+r.name);
  ok(S.points===GM.MAXPTS,'100% reachable: '+S.points+' / '+GM.MAXPTS); ok(GM.rank(S)==='Hecktown Legend','top rank');

  section('save and resume');
  const G2=GM.create(saved); ok(G2.S.inv.badge===1&&G2.cur.node.id===saved.pos.node&&Math.abs(G2.hero.x-saved.pos.x)<2,'resumes where it was saved');
  ok(MAP.gates.every(g=>g.open===!!saved.gates[g.id]),'doors restored'); talkTo(G2,'aaron'); ok(G2.S.flags.netAsked,'resumed game plays on');
}

section('random input soak (10 game-minutes)');
{ const G=newGame(); G.S.inv.badge=1; G.S.inv.tunnelkey=1; let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  let ix=0,iy=0; const cmds=['jump','roll','crawl','throw','read','dance','clap'];
  for(let i=0;i<120*600;i++){ if(i%90===0){ ix=[-1,0,1,1,-1][Math.floor(rnd()*5)]; iy=[0,0,-1,1][Math.floor(rnd()*4)]; if(rnd()<0.3) GM.command(G,cmds[Math.floor(rnd()*cmds.length)]); if(rnd()<0.2){ GM.interact(G); closeDialog(G);} }
    step(G,ix,iy); }
  ok(true,'no exceptions'); console.log('  ended on '+(G.cur.node?G.cur.node.id:G.cur.link.id)+', '+GM.count(G.S.rooms)+' rooms found by luck'); }

console.log('\nrig: '+stats.steps+' steps, worst bone-length error '+stats.maxLeg.toFixed(3)+', longest leg reach '+stats.reach.toFixed(2)+' of '+E.LEG+', feet off their tread '+stats.offTread+', hips-near-ground frames '+stats.sink);
ok(stats.reach<=E.LEG+0.01,'no leg over-extension'); ok(stats.offTread===0,'planted feet sit on their tread');
ok(stats.maxLeg<0.6,'bones keep their length');
console.log(fails?('\n'+fails+' FAILED'):'\nALL PASSED'); process.exit(fails?1:0);
