/* ==== THE NETWORK: nine distribution centers, the truck and the drive, and a crew that follows you. DOM-free. ====
   After the halfway call, A+ has locked each DC out of its own terminal. Each lockout needs one teammate from campus:
   recruit them (crew of two, plus you), drive out, do the site's three-part job, and let them clear it. No bosses. */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const W=1800, BASE=8000, GAP=3000;
const DCS=[
 {id:'taunton',name:'Taunton, MA',loc:'Taunton, Massachusetts',miles:280,lat:41.9,lon:-71.09,needs:['bret'],task:'readers',label:'frozen badge reader',
  lead:'Receiving Lead',a:'THIS BUILDING HAS SHIPPED 11,206 ORDERS THIS WEEK. UNDER ME.',clear:'Bret: "Rack room\'s mine again. Receiving is live. The fog can stay."'},
 {id:'spartanburg',name:'Spartanburg, SC',loc:'Spartanburg, South Carolina',miles:640,lat:34.95,lon:-81.93,needs:['dave'],task:'readers',label:'storm-tripped breaker',
  lead:'Dock Supervisor',a:'IT IS RAINING. THE ORDERS DO NOT CARE. NEITHER DO I.',clear:'Dave: "Green screen blinked first. Spartanburg\'s back."'},
 {id:'plantcity',name:'Plant City, FL',loc:'Plant City, Florida',miles:1030,lat:28.02,lon:-82.12,needs:['umesh'],task:'readers',label:'flood valve',
  lead:'Facilities Lead',a:'THE WATER IS RISING. SO ARE MY PRIVILEGES.',clear:'Umesh: "Every 850 in Plant City is back where it belongs. The water can keep the 997s."'},
 {id:'lansing',name:'Lansing, MI',loc:'Lansing, Michigan',miles:660,lat:42.73,lon:-84.55,needs:['john'],task:'readers',label:'iced-over reader',
  lead:'Cold Storage Lead',a:'COLD STORAGE. I KEEP EVERYTHING COLD.',clear:'John: "Scheduler\'s clean. Nothing runs here at midnight unless we say so."'},
 {id:'billings',name:'Billings, MT',loc:'Billings, Montana',miles:1900,lat:45.78,lon:-108.5,needs:['ryan'],task:'readers',label:'wind-tripped switch',wind:true,
  lead:'Yard Lead',a:'THE WIND IS ON MY SIDE.',clear:'Ryan: "Pipeline\'s green. I checked while we walked. It\'s a condition."'},
 {id:'portland',name:'Portland, OR',loc:'Portland, Oregon',miles:2800,lat:45.52,lon:-122.68,needs:['greg'],task:'readers',label:'jammed belt sensor',belts:true,
  lead:'Conveyor Tech',a:'EVERY BELT IN THIS BUILDING RUNS ON MY SCHEDULE.',clear:'Greg: "Counted the belts. All of them. Portland balances."'},
 {id:'sacramento',name:'West Sacramento, CA',loc:'West Sacramento, California',miles:2780,lat:38.58,lon:-121.53,needs:['brians'],task:'dogs',label:'shelter dog',
  lead:'Grace',leadRole:'Shelter Coordinator',a:'THE SHELTER DOGS ARE NOT IN MY SYSTEM. THAT IS THEIR PROBLEM.',clear:'Brian S: "Changed the console wallpaper back to a dog. Sacramento\'s live."'},
 {id:'aurora',name:'Aurora, CO',loc:'Aurora, Colorado (new, 155,250 sq ft)',miles:1700,lat:39.73,lon:-104.83,needs:['ash'],task:'hold',label:'go-live gate',
  lead:'Go-Live Lead',a:'THIS BUILDING IS NEW. IT HAS NEVER KNOWN ANYONE BUT ME.',clear:'Ash: "Flow\'s live end to end. Aurora took its first real order."'},
 {id:'merge',name:'The Merge',loc:'Central Pet legacy DC, mid-migration',miles:420,lat:38.4,lon:-79.2,needs:['jose','umesh','ash','dave'],task:'readers',label:'schema check',
  lead:'Central Pet Ops Lead',a:'CENTRAL PET HAD A SYSTEM TOO. I HAVE ITS TABLES NOW.',clear:'Jose: "Two schemas, one warehouse. I drew the diagram. The dragon approves."'},
];
const EASTON={id:'easton',name:'Easton, PA',loc:'Easton, Pennsylvania',lat:40.69,lon:-75.22};
const X={truck:150,scans:[380,560,740],pad:600,lead:860,term:922,door:960,wall0:940,wall1:1760};
const TRUCK_E=2088;                                         // the Phillips truck in The Yard, Easton
const LOCALS={merge:[['Central Pet · IT',1240],['Central Pet · Warehouse',1360],['Central Pet · Finance',1480]]};
const LOOKS=[['#e8b48e','#3a2c22','cap','#f2b544','#2b2f3a','vest'],['#c48a62','#1a1410','short','#f2b544','#2b2f3a','vest'],['#f1c9a5','#8a6a4a','ponytail','#5a6f8f','#2b2f3a','lanyard'],['#d9a77c','#2a1e18','bun','#2f7f4f','#2b2f3a','lanyard']];
const lk=a=>({skin:a[0],hair:a[1],style:a[2],shirt:a[3],pants:a[4],acc:a[5]});

/* one flat level per DC, far east of Easton and joined to nothing */
DCS.forEach((d,i)=>{ d.x0=BASE+i*GAP; const world=E.makeWorld(E.surfaces(d.x0,0,[['flat',W]])); const n={id:'dc_'+d.id,label:d.name+' · Phillips DC',layer:'front',world:world,dc:d}; world.node=n; MAP.nodes[n.id]=n; d.node=n;
  MAP.gates.push({id:'g_dc_'+d.id,node:n.id,x:d.x0+X.door,needs:'dc',dc:d.id,label:d.name+' DC door',open:false}); });   // the door opens itself once the lockout clears
if(DCS[8]) DCS[8].node.label='The Merge · Central Pet';
const byId=id=>DCS.find(d=>d.id===id);
const dcOf=G=>G.cur.node&&G.cur.node.dc;
const person=id=>GM.PEOPLE.find(p=>p.id===id);
const npcOf=(G,id)=>G.npcs.find(q=>q.def.id===id);

/* ---------------- crew ---------------- */
function crewList(G){ return (G.S.crew||[]).map(id=>npcOf(G,id)).filter(Boolean); }
function place(G,q,x){ const N=G.cur.node; q.node=N; q.w=E.createWalker(N.world,clamp(x,N.world.hx0,N.world.hx1)); q.w.facing=q.w.dir=q.w.kneeF=G.hero.facing; q.pose=E.poseOf(q.w); }
function sendHome(G,q){ q.crew=false; const n=MAP.nodes[q.def.node]; q.node=n; q.w=E.createWalker(n.world,q.def.x); q.pose=E.poseOf(q.w); q.goal=q.def.x; }
function recruit(G,id){ const S=G.S, q=npcOf(G,id); S.crew=(S.crew||[]).filter(x=>x!==id); S.crew.push(id);
  while(S.crew.length>2){ const out=S.crew.shift(), o=npcOf(G,out); if(o){ sendHome(G,o); G.events.push({type:'hint',text:o.def.name+' heads back to their desk.'}); } }
  q.crew=true; G.events.push({type:'banner',text:q.def.name+' joins the crew'}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); }
function dismiss(G,id){ const q=npcOf(G,id); G.S.crew=(G.S.crew||[]).filter(x=>x!==id); if(q) sendHome(G,q); G.events.push({type:'hint',text:q.def.name+' heads back to their desk.'}); G.events.push({type:'save'}); }
function tickCrew(G,dt){
  const h=G.hero, N=G.cur.node; crewList(G).forEach((q,k)=>{ q.crew=true; if(!N) return;
    const goal=h.x-h.facing*(26+20*k);
    if(q.node!==N||Math.abs(q.w.x-h.x)>320) place(G,q,goal);
    const d=goal-q.w.x; const inp=Math.abs(d)>6?Math.sign(d)*clamp(Math.abs(d)/40,0.25,1):(Math.sign(h.x-q.w.x)!==q.w.facing&&Math.abs(h.x-q.w.x)>6?0.09*Math.sign(h.x-q.w.x):0);
    q.pose=E.updateWalker(q.w,N.world,G.dialog?0:inp,dt); q.w.events.length=0; });
}

/* ---------------- a DC visit ---------------- */
function net(G){ return G.net||(G.net={locals:[],dogs:[],hold:0,gust:0,t:0,built:null}); }
function scanDone(S,d,k){ return !!S.flags['dc_'+d.id+'_'+k]; }
function taskDone(S,d){ return d.task==='dogs'?!!S.flags['dc_'+d.id+'_dogs']:(d.task==='hold'?!!S.flags['dc_'+d.id+'_hold']:[0,1,2].every(k=>scanDone(S,d,k))); }
function buildDC(G,d){ const n=net(G); n.built=d.id; n.locals=[]; n.dogs=[]; n.hold=0; const w=d.node.world;
  const mk=(name,role,x,look,face)=>{ const wk=E.createWalker(w,d.x0+x); wk.facing=wk.dir=wk.kneeF=face||-1; n.locals.push({def:{id:'loc_'+name,name:name,role:role,look:look},w:wk,pose:E.poseOf(wk),home:d.x0+x}); };
  mk(d.lead,d.leadRole||(d.id==='merge'?'Central Pet':'Phillips DC'),X.lead,lk(LOOKS[d.lead.length%LOOKS.length]),-1);
  (LOCALS[d.id]||[['Picker',1300],['Loader',1520]]).forEach((p,i)=>mk(p[0],d.id==='merge'?'Central Pet':'Phillips DC',p[1],lk(LOOKS[(i+2)%LOOKS.length]),i%2?1:-1));
  if(d.task==='dogs'&&!G.S.flags['dc_'+d.id+'_dogs']) for(let i=0;i<3;i++) n.dogs.push({x:d.x0+300+i*60,follow:false,home:false,t:Math.random()*5,col:['#b98a55','#6a5a4a','#e8dcc8'][i]});
}
function helper(G,d){ return crewList(G).find(q=>d.needs.indexOf(q.def.id)>=0); }
function leadLines(G,d){ const S=G.S, done=S.flags['dc_'+d.id], need=person(d.needs[0]).name;
  if(done) return [d.lead+': "We\'re back on the network. Tell Easton thanks."'];
  if(!taskDone(S,d)){ if(d.task==='dogs') return ['Grace: "A+ won\'t open the doors until the shelter dogs are checked in. There are three loose in the yard. Walk them over to me?"'];
    if(d.task==='hold') return [d.lead+': "The go-live gate has to be held open until it takes. Stand on the pad by the dock. It takes a while."'];
    return [d.lead+': "A+ locked us out. Three '+d.label+'s need resetting before the terminal will even talk to us. They\'re between here and the truck."']; }
  return [d.lead+': "That\'s everything out here. Now the terminal wants '+(d.id==='merge'?'someone who knows both systems. Jose, Umesh, Ash or Dave':need)+'."']; }
function termUse(G,d){ const S=G.S, A={name:'A+',role:d.name,look:null};
  if(S.flags['dc_'+d.id]){ G.dialog={who:'A+',role:d.name,look:null,pages:['ARCHIVED. '+d.name.toUpperCase()+' SHIPS WITHOUT ME NOW.'],i:0}; return; }
  if(!taskDone(S,d)){ G.dialog={who:'A+',role:d.name,look:null,pages:[d.a,'DOOR LOCKED. '+(d.task==='dogs'?'THREE DOGS UNACCOUNTED FOR.':(d.task==='hold'?'GO-LIVE GATE CLOSED.':'THREE '+d.label.toUpperCase()+'S FROZEN.'))],i:0}; return; }
  const q=helper(G,d); if(!q){ const nm=d.id==='merge'?'Jose, Umesh, Ash or Dave':person(d.needs[0]).name; G.dialog={who:'A+',role:d.name,look:null,pages:['YOU ARE NOT ON MY LIST.','(This one needs '+nm+'. Bring them from Easton in the truck.)'],i:0}; return; }
  S.flags['dc_'+d.id]=1; S.points+=GM.PTS_DC;
  G.cine.push(GM.dlg({name:'A+',role:d.name,look:null},[d.a,'...FINE.']),GM.dlg({name:q.def.name,role:q.def.role,look:q.def.look},[d.clear]),
    {fn:G=>{ G.events.push({type:'banner',text:d.name+' is back on the network',pts:GM.PTS_DC}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'});
      const all=DCS.every(z=>G.S.flags['dc_'+z.id]); if(all&&GM.STORY&&!G.S.flags.ap_net){ G.S.flags.ap_net=1; GM.STORY.aplusSay(G,'NINE BUILDINGS. NINE TERMINALS. ALL OF THEM SAID THANK YOU. I DID NOT TEACH THEM THAT.'); } }}); }
function tickDC(G,dt,d){
  const S=G.S, n=net(G), h=G.hero; if(n.built!==d.id) buildDC(G,d); n.t+=dt;
  for(const q of n.locals){ let inp=0; const dx=h.x-q.w.x; if(Math.abs(dx)<70&&Math.sign(dx)!==q.w.facing&&Math.abs(dx)>8) inp=0.09*Math.sign(dx); if(inp===0) GM.idleTick(q,dt); q.pose=E.updateWalker(q.w,d.node.world,G.dialog?0:inp,dt); q.w.events.length=0; }
  if(d.task==='dogs'&&!S.flags['dc_'+d.id+'_dogs']){ let k=0; for(const g of n.dogs){ g.t+=dt; if(g.home) continue; if(!g.follow&&Math.abs(g.x-h.x)<40){ g.follow=true; G.events.push({type:'sfx',name:'bark'}); }
      if(g.follow){ const goal=h.x-h.facing*(18+k*16); g.x+=clamp(goal-g.x,-120*dt,120*dt); k++; if(Math.abs(g.x-(d.x0+X.lead))<46){ g.home=true; g.x=d.x0+X.lead-30-n.dogs.filter(z=>z.home).length*14; G.events.push({type:'hint',text:'Checked in: '+n.dogs.filter(z=>z.home).length+' of 3'}); } } }
    if(n.dogs.every(z=>z.home)){ S.flags['dc_'+d.id+'_dogs']=1; G.events.push({type:'banner',text:'All three shelter dogs checked in'}); G.events.push({type:'save'}); } }
  if(d.task==='hold'&&!S.flags['dc_'+d.id+'_hold']){ const on=Math.abs(h.x-(d.x0+X.pad))<30&&Math.abs(h.vx)<20; if(on) n.hold+=dt; if(n.hold>=15){ S.flags['dc_'+d.id+'_hold']=1; G.events.push({type:'banner',text:'Go-live gate held. It took.'}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); } }
  // targets
  if(!G.dialog){ let best=null, bd=1e9; const take=(dd,t)=>{ if(dd<bd){bd=dd;best=t;} };
    const dT=Math.abs(d.x0+X.truck-h.x); if(dT<40) take(dT,{kind:'truck',label:'Drive',name:'the Phillips truck',x:d.x0+X.truck});
    const dm=Math.abs(d.x0+X.term-h.x); if(dm<24) take(dm-30,{kind:'dcterm',label:'Use',name:'A+ terminal',x:d.x0+X.term});
    if(d.task==='readers') X.scans.forEach((sx,k)=>{ if(scanDone(S,d,k)) return; const ds=Math.abs(d.x0+sx-h.x); if(ds<24) take(ds-40,{kind:'dcscan',label:'Reset',name:d.label,x:d.x0+sx,k:k}); });
    for(const q of n.locals){ const dd=Math.abs(q.w.x-h.x); if(dd<36) take(dd,{kind:'dclocal',label:'Talk',name:q.def.name,x:q.w.x,q:q}); }
    for(const q of G.npcs) if(q.node===G.cur.node){ const dd=Math.abs(q.w.x-h.x); if(dd<36) take(dd+(q.crew?60:4),{kind:'talk',label:'Talk',name:q.def.name,x:q.w.x,q:q}); }
    G.target=best; }
}

/* ---------------- the truck, the route board, the drive ---------------- */
const STOPS=[EASTON].concat(DCS);
function openBoard(G){ const cur=dcOf(G)?dcOf(G).id:'easton'; G.board={sel:Math.max(0,STOPS.findIndex(s=>s.id!==cur&&!(s.id!=='easton'&&G.S.flags['dc_'+s.id]))),from:cur,lastX:0}; G.events.push({type:'sfx',name:'talk'}); }
function pick(G,id){ const to=STOPS.find(s=>s.id===id), from=G.board?G.board.from:(dcOf(G)?dcOf(G).id:'easton'); G.board=null; if(!to||to.id===from) return false;
  const miles=to.id==='easton'?(byId(from)||{miles:0}).miles:(from==='easton'?to.miles:Math.round(Math.abs(to.miles-(byId(from)||{miles:0}).miles)+300));
  G.drive={to:to.id,from:from,t:0,dur:11,x:0,hop:0,vy:0,bumps:0,miles:miles,holes:[2.4,4.1,5.3,6.9,8.6,9.5].map(t=>({t:t}))}; G.events.push({type:'sfx',name:'door'}); return true; }
function arriveAt(G,id){ const S=G.S; G.drive=null;
  const N=id==='easton'?MAP.nodes.ground:byId(id).node, x=id==='easton'?TRUCK_E+40:byId(id).x0+X.truck+50;
  G.cur={node:N,world:N.world}; G.hero=E.createWalker(N.world,x); G.pose=E.poseOf(G.hero); S.pos={node:N.id,x:x};
  crewList(G).forEach((q,k)=>place(G,q,x-26-20*k)); G.events.push({type:'snap'}); G.events.push({type:'save'});
  const d=byId(id); if(d){ G.cine.push({card:d.name,sub:d.loc+(d.id==='merge'?'':' · Phillips DC'),dur:3.2}); if(!S.flags['dc_'+d.id]&&!S.flags['dca_'+d.id]&&GM.STORY){ S.flags['dca_'+d.id]=1; GM.STORY.aplusSay(G,d.a); } } }
function tickDrive(G,dt){ const v=G.drive; v.t+=dt; v.x+=dt;
  if(v.hop>0||v.vy){ v.hop+=v.vy*dt; v.vy-=160*dt; if(v.hop<=0){ v.hop=0; v.vy=0; } }
  for(const hl of v.holes) if(!hl.hit&&Math.abs(v.t-hl.t)<0.08){ hl.hit=true; if(v.hop<3){ v.bumps++; G.events.push({type:'sfx',name:'deny'}); v.shake=0.4; } else G.events.push({type:'sfx',name:'point'}); }
  v.shake=Math.max(0,(v.shake||0)-dt); if(v.t>=v.dur) arriveAt(G,v.to); }

/* ---------------- hooks ---------------- */
const base={update:GM.update,interact:GM.interact,advance:GM.advance,command:GM.command,create:GM.create};
GM.create=function(save){ const G=base.create(save); const S=G.S; if(S.flags.halfway&&!S.flags.network) S.flags.network=1;
  for(const id of (S.crew||[])){ const q=npcOf(G,id); if(q){ q.crew=true; if(G.cur.node) place(G,q,G.hero.x-30); } } return G; };
GM.update=function(G,ix,iy,dt){
  if(G.drive){ G.S.time+=dt; tickDrive(G,dt); return; }
  if(G.board){ const s=ix>0.5?1:(ix<-0.5?-1:0); if(s&&s!==G.board.lastX) G.board.sel=(G.board.sel+s+STOPS.length)%STOPS.length; G.board.lastX=s; ix=0; iy=0; }
  const d=dcOf(G); if(d&&!G.dialog&&!G.card){ const n=net(G); if(d.wind){ n.gust=Math.sin(n.t*0.7)>0.35?-1:0; ix=clamp(ix+n.gust*(ix?0.35:0.14),-1,1); } if(d.belts){ const bx=G.hero.x-d.x0; if(bx>300&&bx<800) ix=clamp(ix-(ix?0.3:0.14),-1,1); } }
  base.update(G,ix,iy,dt); tickCrew(G,dt);
  if(d) tickDC(G,dt,d);
  else if(G.cur.node&&G.cur.node.id==='ground'&&G.S.flags.network&&!G.dialog){ const dd=Math.abs(TRUCK_E-G.hero.x); if(dd<40){ const b=G.target, bd=!b||(b.kind==='talk'&&b.q&&b.q.crew)?1e9:Math.abs(b.x-G.hero.x)+(b.kind==='item'||b.kind==='page'?-40:0); if(dd<bd) G.target={kind:'truck',label:'Drive',name:'the Phillips truck',x:TRUCK_E}; } }
};
GM.interact=function(G){
  if(G.drive){ G.events.push({type:'sfx',name:'honk'}); return; }
  if(G.board){ pick(G,STOPS[G.board.sel].id); return; }
  const t=G.target, S=G.S; if(G.dialog||G.card||!t||G.p38||(G.cine&&G.cine.length)){ base.interact(G); return; }
  if(G._pass){ G._pass=false; base.interact(G); return; }
  const d=dcOf(G);
  if(t.kind==='truck'){ openBoard(G); return; }
  if(d&&t.kind==='dcterm'){ termUse(G,d); return; }
  if(d&&t.kind==='dcscan'){ S.flags['dc_'+d.id+'_'+t.k]=1; const n=[0,1,2].filter(k=>scanDone(S,d,k)).length; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:n<3?'hint':'banner',text:(n<3?'Reset '+n+' of 3':'All three '+d.label+'s reset. Now the terminal.')}); G.events.push({type:'save'}); return; }
  if(d&&t.kind==='dclocal'){ G.dialog={who:t.q.def.name,role:t.q.def.role,look:t.q.def.look,pages:t.q===net(G).locals[0]?leadLines(G,d):[t.q.def.name+': "'+(d.id==='merge'?'Two systems, one building. We\'re told it gets easier.':'A+ locked the doors on us. Whatever you\'re doing, keep doing it.')+'"'],i:0}; G.events.push({type:'sfx',name:'talk'}); return; }
  if(t.kind==='talk'&&S.flags.network&&S.met[t.q.def.id]){ const id=t.q.def.id, q=t.q;
    if(q.crew){ G.dialog={who:q.def.name,role:q.def.role,look:q.def.look,pages:[q.def.name+': "Where to?"'],i:0,choices:[{label:'Keep going',id:'crew_keep'},{label:'Head back to your desk',id:'crew_home'}],crewId:id}; G.events.push({type:'sfx',name:'talk'}); return; }
    const want=DCS.find(z=>z.needs.indexOf(id)>=0&&!S.flags['dc_'+z.id]);
    if(want){ G.dialog={who:q.def.name,role:q.def.role,look:q.def.look,pages:[q.def.name+': "Heard about '+want.name+'. Need me?"'],i:0,choices:[{label:'Just saying hi',id:'crew_hi'},{label:'Come with me',id:'crew_join'}],crewId:id}; G.events.push({type:'sfx',name:'talk'}); return; } }
  base.interact(G);
};
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^crew_/.test(d.choices[choice].id)){ const id=d.choices[choice].id, who=d.crewId; G.dialog=null;
    if(id==='crew_join') recruit(G,who); else if(id==='crew_home') dismiss(G,who); else if(id==='crew_hi'){ G._pass=true; GM.interact(G); } return; }
  base.advance(G,choice); };
GM.command=function(G,name){ if(G.drive){ if(name==='jump'&&G.drive.hop<=0){ G.drive.vy=70; G.drive.hop=0.01; G.events.push({type:'sfx',name:'point'}); } return false; }
  if(G.board){ if(name==='jump'||name==='roll') G.board=null; return false; } return base.command(G,name); };
const baseObj=GM.objective;
GM.objective=function(S){ const id=(S.pos.node||'').indexOf('dc_')===0?S.pos.node.slice(3):null, d=id&&byId(id); if(!d) return baseObj(S);
  if(S.flags['dc_'+d.id]) return d.name+' is back on the network. The truck will take you home, or on to the next one.';
  if(!taskDone(S,d)) return d.task==='dogs'?'Walk the three shelter dogs over to Grace.':(d.task==='hold'?'Stand on the go-live pad until the gate takes.':'Reset the three '+d.label+'s, then try the A+ terminal by the door.');
  return 'The terminal by the door needs '+(d.id==='merge'?'Jose, Umesh, Ash or Dave':person(d.needs[0]).name)+' in your crew.'; };
GM.PTS_DC=25;
GM.NET={DCS:DCS,EASTON:EASTON,STOPS:STOPS,X:X,TRUCK_E:TRUCK_E,byId:byId,pick:pick,openBoard:openBoard,net:net,crewList:crewList,taskDone:taskDone,dcOf:dcOf};
})(typeof globalThis!=='undefined'?globalThis:this);
