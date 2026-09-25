/* ==== GAME: state, people, tasks, points, stairs between levels, save data. DOM-free so it runs headless. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, CFG=E.CFG;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const SIGNOFFS=['Network','Backup','Catalog','EDI','Storefront','Jobs'];
const PTS={room:10,meet:5,page:15,start:10,badge:40,signoff:50,biscuit:40,key:30,finale:100,egg:5,duct:10,jeopardy:25,sku:30,portal:20,dc:25,future:15};

/* ---------------- people ----------------  look = [skin, hair, style, shirt, pants, accessory] */
const P=(id,name,role,look,node,x,opt)=>{ const p=Object.assign({id:id,name:name,role:role,look:{skin:look[0],hair:look[1],style:look[2],shirt:look[3],pants:look[4],acc:look[5]},node:node,x:x},opt||{});
  if(p.lk){ Object.assign(p.look,p.lk); delete p.lk; } return p; };   // lk: extra look details (glasses, pony size, mustache)
const PEOPLE=[
 P('rianan','Rianan','IT Department Head',['#f1c9a5','#3b2418','ponytail','#2f6f9f','#2b2f3a','headset'],'hq_f2',1400,{lk:{glasses:true,pony:1.8}}),
 P('brians','Brian S','IT Manager',['#f0c7a3','#7a6a5c','short','#3d6b52','#2b2f3a','lanyard'],'hq_f2',1455,{lk:{stache:true},lines:['Admin console\'s ours. A+ changed the wallpaper. Petty.','I build on all machines. Pinball, arcade cabinets, the render box under my desk, half the racks downstairs. If it has a motor or a motherboard, I\'ve had it open.','This building is just a very large machine with worse lighting. I\'d rewire it if Jose would let me.','Nationally ranked pinball player. I don\'t like to bring it up. I\'m bringing it up.','That machine in the corner? I rebuilt the flippers. Tonight it is the most reliable system in this building.']}),
 P('ryan','Ryan','Dev Manager',['#e4b58f','#2a1e18','short','#c25a3a','#26293a','backpack'],'hq_f2',1120,{wander:[1110,1150],lines:['Pipeline\'s green. Whatever you\'re about to do, I can ship it.','If you need the printer, kick it. Gently. It knows what it did.']}),
 P('ash','Ash','Salesforce Engineer',['#c48a62','#1a1410','bun','#4a6fd8','#26293a','cloud'],'hq_f2',1165),
 P('umesh','Umesh','EDI Specialist',['#b9825a','#151210','short','#9a5a3a','#2b2f3a','vest'],'hq_f2',1748),
 P('fares','Fares','EDI Analyst',['#c08a62','#1a1410','short','#5a6f8f','#2b2f3a','none'],'hq_f2',1771,{lines:['Umesh and I have been trading 850s since before the new system had a name.','If an EDI file fails at 2 AM, Umesh gets the page and I get a text that says "you up?"','Umesh says the 997s are fine. The 997s are never fine.']}),
 P('jose','Jose','System Architect',['#c9906a','#1a1410','swept','#2f7f8f','#2b2f3a','plans'],'hq_f2',1796,{lines:['Two schemas, one warehouse. I drew the diagram. It has a dragon on it now.','Every stair in this building is on my drawing. The tunnel isn\'t. Draw your own conclusions.']}),
 P('andrew','Andrew','Head of IT Support',['#eec2a0','#3a2c22','short','#8a4a5a','#2b2f3a','headset'],'ground',1440),
 P('aaron','Aaron','Network Specialist',['#d9a77c','#1f1a17','hoodie','#4a4f6b','#1f2330','cable'],'hq_roof',1300,{wander:[1180,1480]}),
 P('dave','Dave','iSeries Guru',['#eec2a0','#8e8e8e','beard','#8a4a3a','#3a3d47','flannel'],'hq_b1',1820),
 P('john','John','iSeries Manager',['#e9bb95','#3a2c22','short','#2f5f8f','#2b2f3a','keys'],'hq_f2',1512),
 P('greg','Greg','Number Scientist',['#9a9a9a','#777777','wavy','#8a8a8a','#5a5a5a','cardigan'],'hq_b1',1440,{wander:[1400,1530]}),
 P('pam','Pam','Item Maintenance (PIM)',['#f1c9a5','#6a4a3a','bun','#7a5a8a','#2b2f3a','lanyard'],'hq_f2',1236,{busy:true}),
 P('melissa','Melissa','Item Maintenance (PIM)',['#e8b48e','#2a1e18','ponytail','#3f7f8f','#2b2f3a','lanyard'],'hq_f2',1284,{busy:true}),
 P('cathy','Cathy','PIM Assistant',['#f0c7a3','#b07a4a','wavy','#c25a7a','#2b2f3a','lanyard'],'hq_f2',1320,{lines:['I\'m Pam and Melissa\'s assistant. They\'re in the PIM. They are always in the PIM. I bring them things.','Four hundred attributes on a bag of kibble. I have opinions about every one of them.','If you need them, talk loud. They won\'t look up from the grid, but they\'re listening.']}),
 P('bret','Bret','Infrastructure Manager',['#e8b48e','#5a3a22','cap','#7a4a2a','#3a3d47','belt'],'ground',2700),
 P('blaine','Blaine','Executive Chairman',['#f1c9a5','#8a8a8a','short','#243447','#2b2f3a','lanyard'],'hq_f2',1880,{lines:['My grandfather opened a single feed store in 1938. His goal was to delight our customers and create a great place to work.','Show up for the people who count on you. That was the whole promise. Still is.']}),
 P('nick','Nick','CEO',['#f1c9a5','#6a5a4a','short','#243447','#2b2f3a','lanyard'],'hq_f2',1848,{lines:['First cutover on the job. Good team. I\'m staying till the last sign-off, so don\'t rush it on my account.']}),
 P('kim','Kim','Accounting',['#f0c7a3','#3a2c22','bun','#6b5b8f','#2b2f3a','glasses'],'ground',1238,{lines:['Our financial systems have run since the mainframe days. Tonight is the first night they get to rest.']}),
 P('ashley','Ashley','Finance',['#c48a62','#1a1410','ponytail','#3f7f8f','#2b2f3a','none'],'ground',1290,{lines:['I priced forty years of A+. It came to one very long receipt. A+ kept every line.']}),
 P('jessica','Jessica','Chief Sales & Marketing',['#e8b48e','#a8632c','wavy','#c25a3a','#2b2f3a','none'],'ground',1150,{wander:[1112,1170],lines:['Seventy-five brands at the buying show and every one of them asked if the site would be up tomorrow. It will. Right?']}),
 P('jennifer','Jennifer','Marketing',['#f1c9a5','#8a4a2a','wavy','#e0a030','#2b2f3a','none'],'ground',1196,{lines:['There are tunnels under the warehouse. I\'ve said this for years. Frank backs me up.']}),
 P('josh','Josh','Customer Care',['#d9a77c','#2a1e18','short','#2f6f9f','#2b2f3a','headset'],'ground',1760,{lines:['A thousand calls a day and tonight every one of them is "is the site up?" It\'s up.']}),
 P('stephanie','Stephanie','Customer Care',['#f0c7a3','#5a3a22','ponytail','#2f6f9f','#2b2f3a','headset'],'ground',1822,{lines:['Customer Care is holding the phones all night. We\'d like it noted.','The treat jar by the window is for dogs. Mostly.']}),
 P('wendy','Wendy','Customer Care',['#e8b48e','#1a1410','bun','#2f6f9f','#2b2f3a','headset'],'ground',1740,{wander:[1735,1885],lines:['Every call is a relationship. Even the ones at 11 PM.']}),
 P('marc','Marc','Inside Sales',['#eec2a0','#5a3a22','short','#5a5f7a','#2b2f3a','lanyard'],'ground',1350,{lines:['From aquatics to nutrition, everything has to ship tomorrow. No pressure. Some pressure.']}),
 P('dee','Officer Dee','Security',['#8a5a3a','#1a1410','cap','#243447','#1b1d22','lanyard'],'ground',975,{lines:['Badge, please. Kidding. I know who you are. Everybody knows who\'s on call tonight.','The RV in the lot has been there since Tuesday. I\'ve named it.']}),
 P('tina','Tina','Tina\'s Tacos',['#d9a77c','#1a1410','bun','#e63946','#2b2f3a','none'],'ground',560),
 P('lou','Lou','Fleet Mechanic',['#c48a62','#3a2c22','cap','#4a5060','#2b2f3a','none'],'ground',830,{wander:[760,890]}),
 P('ben','Ben','Landscaping',['#f1c9a5','#a8632c','short','#2f7f4f','#2b2f3a','none'],'ground',280,{lines:['Dog park\'s mine. The koi are mine. The groundhog is not mine.','Sprinklers at six. Set your watch.','That dog up the steps won\'t come to anybody without a treat. Customer Care keeps a jar.']}),
 P('priya','Priya','Runner',['#c9906a','#1a1410','ponytail','#7fd0ff','#2b2f3a','none'],'ground',1960,{wander:[1925,2010],lines:['Two laps of the lot is a mile. Three if the deer\'s out.']}),
 P('rosa','Rosa','Dock Lead',['#c48a62','#1a1410','cap','#f2b544','#2b2f3a','vest'],'ground',2330),
 P('frank','Frank','Nights, since 1995',['#e8b48e','#8e8e8e','cap','#4a5060','#2b2f3a','keys'],'ground',2560,{wander:[2500,2660],lines:['Nights since 1995. I know every corner of this building, including the corners it doesn\'t have anymore.','There\'s a door in the Legacy Archive that was bricked over in \'91. Greg has the only key. Just saying.','Top rack catwalk has a duct at the west end. You\'d have to crawl. I\'m not saying there\'s anything in it.']}),
 P('dot','Dot','Forklift',['#f1c9a5','#7a6a5c','cap','#f2b544','#2b2f3a','vest'],'ground',2850,{lines:['Stairs to the mezzanine are against the back wall, left of the racks. Second flight goes up to the catwalk. Mind your head.']}),
 P('sal','Sal','Shipping',['#eec2a0','#5a3a22','beard','#f2b544','#3a3d47','vest'],'ground',3010,{wander:[2930,3100],lines:['Trucks roll at dawn whether the new system\'s up or not. So. Make it up.']}),
 P('marisol','Marisol','Yard Jockey',['#c9906a','#3a2c22','ponytail','#f2b544','#2b2f3a','vest'],'ground',3290,{lines:['I move trailers to doors all night. Tonight the doors finally hold still.']}),
 P('walt','Walt','Canal Mule Driver',['#eec2a0','#8e8e8e','cap','#7a5a3a','#3a2a1a','none'],'ground',3440,{lines:['Mules walked this towpath before the trucks. The trucks are faster. The mule has never once been locked out of anything.']}),
];
/* what people wear; anything not listed here is picked from a hash of their look (04-draw-people) */
const WARDROBE={rianan:{top:'blazer'},brians:{top:'polo'},ryan:{top:'tee'},ash:{top:'sweater'},umesh:{top:'sweatervest'},fares:{top:'polo',bottom:'khakis'},jose:{top:'button'},andrew:{top:'polo'},aaron:{top:'hoodie',bottom:'jeans'},
  dave:{top:'flannel',bottom:'jeans'},john:{top:'button',bottom:'slacks'},greg:{top:'cardigan',bottom:'slacks'},pam:{top:'sweater'},melissa:{top:'button'},cathy:{top:'tee',bottom:'jeans'},bret:{top:'polo',bottom:'work',shoe:'boot'},
  blaine:{top:'blazer'},nick:{top:'blazer'},kim:{top:'cardigan'},ashley:{top:'button'},jessica:{top:'blazer'},jennifer:{top:'sweater'},josh:{top:'polo'},stephanie:{top:'polo'},wendy:{top:'polo'},marc:{top:'button'},
  dee:{top:'button',bottom:'slacks'},lou:{top:'tee',bottom:'work',shoe:'boot'},ben:{top:'tee',bottom:'work',shoe:'boot'},priya:{top:'tee',shoe:'sneaker'},frank:{top:'flannel',bottom:'work'},walt:{top:'button',bottom:'work',shoe:'boot'}};
for(const p of PEOPLE) if(WARDROBE[p.id]) Object.assign(p.look,WARDROBE[p.id]);
/* what people do while they wait: a few habits each, picked at random now and then */
const HABITS={rianan:['phone','fold','shift'],brians:['fold','sip','shift'],ryan:['phone','shift','dance'],ash:['type','sip'],umesh:['type','sip','shift'],fares:['type','phone','sip'],jose:['type','fold'],andrew:['type','phone','sip'],aaron:['stretch','fold','shift','roll'],
  dave:['sip','fold','stretch'],john:['fold','phone','sip'],greg:['shift','fold'],pam:['type'],melissa:['type'],cathy:['sip','phone','shift'],bret:['phone','stretch','shift'],blaine:['fold','sip'],nick:['phone','fold'],kim:['type','sip'],
  ashley:['type','phone'],jessica:['phone','fold'],jennifer:['type','sip'],josh:['type','phone'],stephanie:['type','phone'],wendy:['type','sip'],marc:['type','sip'],dee:['fold','shift'],lou:['stretch','sip'],ben:['stretch','shift'],
  priya:['stretch','roll'],rosa:['phone','stretch','shift'],dot:['phone','stretch'],sal:['phone','shift'],marisol:['phone','stretch'],tina:['sip','fold'],frank:['fold','shift'],walt:['sip','shift']};
const IDLE_LEN={type:[6,12],sip:[2.8,3.2],phone:[5,9],stretch:[2.2,2.6],fold:[5,10],shift:[6,10]};
const IDLE_MOVES={dance:[4,8],clap:[1.5,1.5],roll:[1,1]};
function idleTick(q,dt,world,party){ const w=q.w;
  if(q.mood){ q.mood.t-=dt; if(q.mood.t<=0) q.mood=null; }
  if(w.dancing){ q.danceT=(q.danceT||0)-dt; if(q.danceT<=0) w.dancing=false; return; }
  if(w.act||w.reading||w.mode!=='walk'||w.idle) return;
  q.idleT=(q.idleT==null?1+Math.random()*4:q.idleT)-dt; if(q.idleT>0) return;
  let L=(q.def&&(q.def.habits||HABITS[q.def.id]))||['shift','fold','phone']; if(party&&!(q.def&&q.def.busy)) L=L.concat(['dance','dance','clap']);
  const n=L[Math.floor(Math.random()*L.length)]; q.idleT=(q.def&&q.def.busy)?0.2:2+Math.random()*5;
  if(IDLE_MOVES[n]){ if(!world) return; if(n==='dance'){ if(E.command(w,world,'dance')) q.danceT=4+Math.random()*4; } else E.command(w,world,n); return; }
  const r=IDLE_LEN[n]; w.idle={name:n,t:0,dur:r[0]+Math.random()*(r[1]-r[0])}; }
const BISCUIT={id:'biscuit',name:'Biscuit',node:'ground',x:340,homeX:2740};

/* ---------------- things to pick up or use ---------------- */
const PAGES=[
 ['ground',1128,'1938. Sack of oats for the mare, then the Millers\' order across the road. Paid in eggs. Entered as cash.'],
 ['hq_roof',1128,'1952. Bought a truck. The mare has opinions about the truck.'],
 ['gar_loft',884,'1967. Second truck. First mechanic. He says the wrench is fine.'],
 ['wh_cat',2284,'1985. A+ goes live. Green screens in every office. Nobody trusts it. It ships forty bags of chow on day one.'],
 ['hq_f2',1872,'1991. Door in the archive bricked over. Nobody wrote down why. I am writing down that nobody wrote it down.'],
 ['ground',424,'1994. G. Schreiner logs unusual basement readings. Filed under "unusual".'],
 ['ground',3474,'1995. Frank starts nights. Says he will stay a year.'],
 ['hq_b1',1150,'1999. Y2K readiness binder, 400 pages. A+ needed two lines changed.'],
 ['wh_mezz',2700,'2008. First web order. A+ treats it like any other order, which is the nicest thing anyone says about it.'],
 ['ground',3124,'2019. A thousand calls a day. Every one of them ends up as a line in A+.'],
 ['tun_2',850,'Undated. "If you are reading this you crawled. Good. The cellar is older than the building."'],
 ['tun_3',1650,'1938, first page. "Show up for the people who count on you." Underlined twice.'],
];
const ITEMS=[
 {id:'rfc',name:'RFC form',node:'hq_f2',x:1200,show:S=>S.flags.rfcAsked&&!S.inv.badge},
 {id:'spool',name:'patch-cable spool',node:'gar_loft',x:770,show:S=>S.flags.netAsked&&!S.signoffs.Network},
 {id:'tape',name:'SAVLIB backup tape',node:'wh_mezz',x:3080,show:S=>S.flags.backupAsked&&!S.signoffs.Backup},
 {id:'label',name:'SKU label sample',node:'wh_cat',x:2990,show:S=>S.flags.catalogAsked&&!S.signoffs.Catalog},
 {id:'treats',name:'dog treats',node:'ground',x:1870,show:S=>S.flags.biscuitAsked&&!S.flags.biscuitHome},
];
const TERMS=[{id:'t_dock',node:'ground',x:2260,where:'Receiving Dock'},{id:'t_roof',node:'hq_roof',x:1840,where:'Roof Garden'},{id:'t_gate',node:'ground',x:1010,where:'Security Gate'}];

const MAXPTS=MAP.rooms.length*PTS.room+PEOPLE.length*PTS.meet+PAGES.length*PTS.page+PTS.start+PTS.badge+SIGNOFFS.length*PTS.signoff+PTS.biscuit+PTS.key+PTS.finale+PTS.egg+PTS.duct+PTS.jeopardy+PTS.sku+PTS.portal+PTS.dc*9+PTS.future*2;
const RANKS=[[0,'New Badge'],[12,'Ticket Closer'],[30,'On-Call'],[50,'Change Approver'],[72,'Cutover Lead'],[95,'Hecktown Legend']];

function freshSave(){ return {v:1,flags:{},inv:{},met:{},rooms:{},pages:{},eggs:{},signoffs:{},terms:{},gates:{},points:0,time:0,done:false,pos:{node:'ground',x:1150}}; }
const count=o=>Object.keys(o).length;
function percent(S){ return Math.floor(S.points/MAXPTS*100); }
function rank(S){ const p=percent(S); let r=RANKS[0][1]; for(const k of RANKS) if(p>=k[0]) r=k[1]; return r; }
function mainSteps(S){ return (S.flags.started?1:0)+(S.inv.badge?1:0)+count(S.signoffs)+(S.inv.tunnelkey?1:0)+(S.done?1:0); }   // 0..10
function clock(S){ const m=18*60+Math.round(mainSteps(S)/10*360), h=Math.floor(m/60)%24, mm=m%60; return ((h%12)||12)+':'+(mm<10?'0':'')+mm+(h>=12&&h<24&&m<24*60?' PM':' AM'); }

function objective(S){
  if(!S.flags.started) return 'Find Rianan in the War Room. HQ, 2nd floor: hold Up on the stair landing.';
  if(!S.inv.badge){ if(!S.flags.rfcAsked) return 'See Andrew at the Help Desk (HQ ground floor) about a Level 2 badge.';
    return S.inv.rfc?'Bring the RFC form back to Andrew at the Help Desk.':'Fetch the RFC form from the printer in the Dev Bullpen (2nd floor).'; }
  if(count(S.signoffs)<6) return 'Collect sign-offs from the system owners: '+count(S.signoffs)+' of 6. The Journal lists who needs what.';
  if(!S.inv.tunnelkey) return 'Greg in the Legacy Archive (HQ basement) trades the tunnel key for 6 ledger pages: '+count(S.pages)+' found.';
  if(!S.done) return 'Take the old tunnel west of Basement Storage, and keep going down until you find A+.';
  return 'Cutover complete. Keep exploring: '+percent(S)+'% of Hecktown found.';
}
function tasks(S){
  const t=[], st=(done,active)=>done?'done':(active?'active':'todo');
  t.push({title:'Report to Rianan',status:st(S.flags.started,true),note:'War Room, HQ 2nd floor.'});
  t.push({title:'Level 2 badge',status:st(S.inv.badge,S.flags.started),note:S.flags.rfcAsked?'RFC form is on the Dev Bullpen printer. Bring it to Andrew.':'Andrew, Help Desk, HQ ground floor.'});
  const so=(name,who,where,asked,note)=>t.push({title:'Sign-off: '+name,status:st(S.signoffs[name],S.flags.started),note:S.signoffs[name]?who+' signed.':(asked?note:who+', '+where+'.')});
  so('Network','Aaron','HQ roof',S.flags.netAsked,S.inv.spool?'Bring the cable spool to Aaron on the roof.':'Aaron lent his cable spool to Lou. Check the loft over the garage.');
  so('Backup','Dave','Server Room, HQ basement (badge)',S.flags.backupAsked,S.inv.tape?'Bring the tape to Dave.':'The SAVLIB tape is in the Cage Office on the warehouse mezzanine (badge). Crawl under the conveyor crossover to get there.');
  so('Catalog','Pam and Melissa','PIM Room, HQ 2nd floor',S.flags.catalogAsked,S.inv.label?'Bring the label to Pam.':'They need a SKU label sample from the Top Rack Catwalk in the warehouse: up the mezzanine, crawl under the conveyor, then the far stairs.');
  so('EDI','Umesh','EDI & Integration, HQ 2nd floor',S.flags.ediAsked,S.inv.bol?'Bring the bill of lading to Umesh.':'Get tonight\'s bill of lading from Rosa at the Receiving Dock.');
  so('Storefront','Ash','Dev Bullpen, HQ 2nd floor',S.flags.sfAsked,S.inv.coffee?'Bring the coffee to Ash.':'Ash needs a coffee from Tina\'s Tacos, out in the west lot.');
  so('Jobs','John','War Room, HQ 2nd floor',S.flags.jobsAsked,count(S.terms)>=3?'All three queues held. Tell John.':'Hold the job queue at three green-screen terminals: '+TERMS.map(x=>x.where+(S.terms[x.id]?' (held)':'')).join(', ')+'.');
  t.push({title:'Bring Biscuit home',status:st(S.flags.biscuitHome,S.flags.biscuitAsked),note:S.flags.biscuitAsked?(S.inv.treats?'Biscuit is up in the Dog Park. Offer a treat.':'Biscuit won\'t come without a treat. Customer Care keeps a jar.'):'Optional. Bret is in the warehouse Pick Aisles.'});
  t.push({title:'The tunnel key',status:st(S.inv.tunnelkey,S.flags.gregAsked),note:'Greg wants 6 ledger pages. Found '+count(S.pages)+' of '+PAGES.length+'.'});
  t.push({title:'Good night, A+',status:st(S.done,S.inv.tunnelkey),note:'All six sign-offs open the last door, three levels down.'});
  return t;
}

/* ---------------- a running game ---------------- */
function create(save){
  const S=save||freshSave();
  const G={S:S,events:[],dialog:null,npcs:[],target:null,hintT:0,biscuit:null,autoT:0,stairHint:null};
  const n=MAP.nodes[S.pos.node]||MAP.nodes.ground;
  G.cur={node:n,world:n.world};
  G.hero=E.createWalker(n.world,clamp(S.pos.x,n.world.hx0,n.world.hx1));
  for(const g of MAP.gates) g.open=!!S.gates[g.id];
  for(const p of PEOPLE){ const nd=MAP.nodes[p.node]; G.npcs.push({def:p,node:nd,w:E.createWalker(nd.world,p.x),pose:null,goal:p.x,wait:1+Math.random()*5,live:false}); }
  for(const q of G.npcs){ q.w.facing=q.w.dir=q.w.kneeF=(q.def.x>1500?-1:1); q.pose=E.poseOf(q.w); }
  G.biscuit={x:S.flags.biscuitHome?BISCUIT.homeX:BISCUIT.x,t:0,run:0};
  G.pose=E.poseOf(G.hero);
  return G;
}
function award(G,pts,text){ G.S.points+=pts; G.events.push({type:'banner',text:text,pts:pts}); }
function say(G,who,pages,opt){ G.dialog=Object.assign({who:who.name,role:who.role||'',look:who.look||null,pages:pages,i:0},opt||{}); G.events.push({type:'sfx',name:'talk'}); }
function signoff(G,name){ G.S.signoffs[name]=1; award(G,PTS.signoff,'Sign-off: '+name+' ('+count(G.S.signoffs)+' of 6)'); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'});
  for(const q of G.npcs) if(q.node===G.cur.node&&Math.abs(q.w.x-G.hero.x)<220&&!q.crew){ q.clap=0.15+Math.random()*0.6; q.mood={name:'happy',t:4}; } }   // the room applauds

/* What each person says, and what it changes. Returns an array of lines. */
function talkLines(G,p){
  const S=G.S, F=S.flags, I=S.inv;
  switch(p.id){
   case 'rianan':
     if(!F.started){ F.started=1; award(G,PTS.start,'Cutover checklist received'); return ['There you are, Brian. A+ gets archived at midnight and I am not doing it on vibes.','Six system owners, six sign-offs: Network, Backup, Catalog, EDI, Storefront, Jobs. Walk the campus and get them.','Start with Andrew downstairs. Half the doors in this company want a Level 2 badge.']; }
     if(S.done) return ['It went quietly. After forty years, it went quietly. Go home. Or finish your lap, I know you.'];
     { const cats=['That alley cat by Tina\'s truck has a business plan. I respect it. I also want to pet it.','I have four cats at home. Five if you count the one that visits. I count the one that visits.','My wallpaper is a cat. My lock screen is a different cat. They know about each other.','If Milo wanted a desk, I would find him a desk.']; F.rianCat=((F.rianCat|0)+1)%cats.length; return [cats[F.rianCat],count(S.signoffs)+' of 6 sign-offs. The Journal has the list if you lose track.']; }
   case 'andrew':
     if(!F.started) return ['Head of IT Support. If it\'s broken, it\'s a ticket. Rianan is looking for you: War Room, second floor. Stairs are in the core, hold Up on the landing.'];
     if(I.badge) return ['Change freeze starts at midnight. Everything before that needs a signature, and you\'re the one collecting them.','Thursday RFC meeting stands. Even tonight. Especially tonight.'];
     if(I.rfc){ delete I.rfc; I.badge=1; award(G,PTS.badge,'Level 2 badge issued'); G.events.push({type:'save'}); return ['An RFC, filled in, legible. I may frame it.','Level 2 badge. Server Room, Executive Row and the warehouse Cage Office will open for you now.']; }
     F.rfcAsked=1; return ['A Level 2 badge is a change. A change needs an RFC. No RFC, no badge.','The form is on the printer in the Dev Bullpen, second floor. Bring it here.'];
   case 'aaron':
     if(S.signoffs.Network){ const L=['Racks are humming, switches are green. Class IV rapids on Saturday. Tonight is easier.','That raft by the HVAC is mine. Don\'t tell Facilities. It dries faster up here.','Whitewater and networks: water finds the path of least resistance. So do packets. So do users.','Swam a rapid once. Lost a paddle, kept the helmet. Priorities.'];
       F.aaronI=((F.aaronI||0)+1)%L.length; return [L[F.aaronI]]; }
     if(I.spool){ delete I.spool; signoff(G,'Network'); return ['That\'s my spool. Two minutes. ...There. Every DC answers on the new path.','Whitewater rule: pick your line early, commit, keep paddling. Network is signed.']; }
     F.netAsked=1; return ['Rafting on Saturday, cutover tonight. One of those has a helmet.','I can\'t sign Network until the roof link is re-terminated, and I lent my cable spool to Lou.','He keeps borrowed things in the loft over his garage, out in the west lot.'];
   case 'dave':
     if(S.signoffs.Backup&&S.eggs.jeopardy) return ['Forty years of green screens and tonight is the first one that said thank you.','There are tunnels under this building. Old ones. I have never once been down there and I know exactly what\'s in them.','I made it to the final audition round for Jeopardy. Got a call-back. Never got the call. I think about it every time I see a buzzer.'];
     if(I.tape){ delete I.tape; signoff(G,'Backup'); return ['SAVLIB, full system, verified. Forty years on one cartridge. Feels light.','Backup is signed.']; }
     F.backupAsked=1; return ['I once came this close to being a Jeopardy contestant. The backup schedule, though, I got exactly right.','No backup, no cutover. The last full SAVLIB tape went to the warehouse for safekeeping.','Cage Office, on the mezzanine. Frank\'s people lock everything, so bring your badge.'];
   case 'pam': case 'melissa':
     if(S.signoffs.Catalog) return [p.id==='pam'?'Catalog\'s signed and I\'m still in the PIM. Somebody added a new flavor of kibble at 11 PM. Of course they did.':'If you see Pam, I\'m right behind her. In the PIM. We\'re always in the PIM.'];
     if(I.label){ delete I.label; signoff(G,'Catalog'); return ['Pam: That label matches the PIM character for character.','Melissa: Four hundred SKUs checked against the grid. Catalog is signed. By both of us.','Cathy: I\'ll get the coffee.']; }
     F.catalogAsked=1; return ['Pam: Sorry, I won\'t look up, I\'m mid-edit in the PIM. Melissa and I keep the catalog perfect.','Melissa: We need one real label off a real pallet to prove the new system prints what the PIM says.','Pam: Top rack, up on the warehouse catwalk. The highest one. Obviously.'];
   case 'cathy':
     if(S.signoffs.Catalog) return ['They signed! They didn\'t stop typing, but they signed.'];
     if(F.catalogAsked&&!I.label) return ['The label\'s on the Top Rack Catwalk in the warehouse. I\'d go, but somebody has to bring them things.'];
     break;
   case 'umesh':
     if(S.signoffs.EDI) return ['OMS is the order\'s whole life: entered, allocated, picked, shipped, invoiced. I don\'t skip steps.'];
     if(I.bol){ delete I.bol; signoff(G,'EDI'); return ['Bill of lading matches the 856 line for line. Every 850 in the queue is mine again.','EDI is signed.']; }
     F.ediAsked=1; return ['I need tonight\'s paper bill of lading to match against the ship notice. Paper doesn\'t lie.','Rosa has it at the Receiving Dock, across the yard.'];
   case 'rosa':
     if(F.ediAsked&&!I.bol&&!S.signoffs.EDI){ I.bol=1; G.events.push({type:'banner',text:'Got the bill of lading'}); return ['Umesh wants the BOL? Of course he does. Here. Don\'t fold it.']; }
     return ['Bay 2\'s waiting on that kibble. Trucks roll at dawn whether the system\'s up or not.'];
   case 'ash':
     if(S.done) return ['Don\'t ask.','...Fine. I built a flow that triggers when everything ships. Everything shipped. I don\'t know where it took me. I was gone eleven minutes.'];
     if(S.signoffs.Storefront) return ['Salesforce is talking to me again. It apologized. We\'re fine.','Call me Ash. And yes, the flow will hold.'];
     if(I.coffee){ delete I.coffee; signoff(G,'Storefront'); return ['You are a good person. ...Okay. Orders are flowing end to end. Storefront is signed.']; }
     F.sfAsked=1; return ['I have been staring at this flow since lunch. I will sign Storefront the second there is coffee in my hand.','Tina\'s truck is still open tonight. West lot, past the garage.'];
   case 'tina':
     if(F.sfAsked&&!I.coffee&&!S.signoffs.Storefront){ I.coffee=1; G.events.push({type:'banner',text:'Got a coffee for Ash'}); return ['For Ash? Large, no room. On the house, it\'s cutover night.']; }
     if(F.miloAsked&&!I.taco){ I.taco=1; G.events.push({type:'banner',text:'Got a taco for Milo'}); return ['A taco for the cat? He tips better than you do.']; }
     return ['Eleven to two, usually. Tonight I stay till the lights go out upstairs.','The gray guy comes by. Never orders. Always tips.'];
   case 'john':
     if(S.signoffs.Jobs) return ['Old-school RPG. Not the elves. The report program generator.','Nothing runs at midnight tonight unless we say so.'];
     if(count(S.terms)>=3){ signoff(G,'Jobs'); return ['All three queues held. The scheduler is clean. Jobs is signed.']; }
     F.jobsAsked=1; return ['Every midnight job in this building, I wrote or inherited. Three of them only hold from their own green screen.','Receiving Dock, the Roof Garden shed, and Dee\'s booth at the Security Gate. Hold the queue at each, then come back.'];
   case 'bret':
     if(F.biscuitHome){ if(!F.biscuitPaid){ F.biscuitPaid=1; award(G,PTS.biscuit,'Biscuit is home'); G.events.push({type:'save'}); return ['Biscuit! There you are. Dogs first, hardware second. Thank you.']; } { const sec=['New baby boy at home. Three weeks. Sleeps like a server: never, then all at once.','If it has a power supply, I can fix it. If it has firmware, I can fix it faster.','Rotate your passwords. Don\'t write them on a sticky note. Not under the keyboard either. I check.','Never plug in a USB stick you found in the parking lot. That one was mine. It was a test. You passed.','Server room is sixty-eight degrees. It is always sixty-eight degrees. If it is ever not sixty-eight degrees, call me.','Multi-factor. On everything. Yes, even that.','Every server in this building has a name. None of them are named after you. That is a security decision.']; F.bretSec=((F.bretSec|0)+1)%sec.length; return [sec[F.bretSec]]; } }
     F.biscuitAsked=1; return ['Before anything else: is your screen locked? Good. Now.','Biscuit slipped out when the dock door cycled. He always runs to the dog park, west end of the lot.','He won\'t come without a treat. Customer Care keeps a jar by the window.'];
   case 'greg':
     if(I.tunnelkey) return ['Give me a fact table and a quiet room and I will kick data ass.','The door is west of Basement Storage. It was bricked in \'91. The bricks got bored.'];
     if(count(S.pages)>=6){ I.tunnelkey=1; award(G,PTS.key,'Greg gave you the tunnel key'); G.events.push({type:'save'}); return ['Six pages. You read the log. Nobody reads the log.','Here. The old tunnel starts west of Basement Storage. A+ lives at the bottom of it, and always has.']; }
     F.gregAsked=1; return ['Number scientist. Thirty-some years on this floor. I\'ve worked in every department, including HR for one afternoon.','The company ledger came apart years ago. Pages everywhere. Bring me six and I\'ll trust you with a key. You have '+count(S.pages)+'.'];
   case 'lou': return F.netAsked&&!S.signoffs.Network&&!I.spool?['Aaron\'s spool? Up in the loft. Stairs are along the back wall.']:['Forty trucks, one wrench. The wrench is fine.','Trailer 106 has a personality. I don\'t mean that as a compliment.'];
  }
  const L=p.lines||['Evening.']; p._i=((p._i||0)+1)%L.length; return [L[(p._i+L.length-1)%L.length]];
}

function talk(G,q){
  const p=q.def, S=G.S;
  if(!S.met[p.id]){ S.met[p.id]=1; award(G,PTS.meet,'Met '+p.name); }
  if(p.id==='dave'&&S.signoffs.Backup&&!S.eggs.jeopardy){ daveQuiz(G,p); return; }
  const lines=talkLines(G,p);
  say(G,p,lines);
}
/* Dave nearly made it onto Jeopardy. Once Backup is signed he has a Daily Double for you; every answer is somewhere in Hecktown. */
const CLUES=[
 ['PHILLIPS HISTORY for 800: The year a single feed store opened on this road.',['What is 1938?','What is 1952?','What is 1985?'],0],
 ['MIDRANGE for 1000: The command that put forty years of this company on one tape tonight.',['What is ENDSBS?','What is SAVLIB?','What is HLDJOBQ?'],1],
 ['OUR SYSTEMS for 600: The year A+ went live and shipped forty bags of chow on day one.',['What is 1991?','What is 2008?','What is 1985?'],2],
 ['PEOPLE YOU KNOW for 400: Greg\'s job title, and it is not a joke.',['What is number scientist?','What is data wizard?','What is night manager?'],0],
];
function daveQuiz(G,p){ const F=G.S.flags, c=CLUES[(F.ddQ||0)%CLUES.length];
  say(G,p,['Hold on. I nearly made it onto Jeopardy, and I have been waiting all night to do this. Daily Double.',c[0]],{choices:c[1].map((l,i)=>({label:l,id:i===c[2]?'dd_ok':'dd_no'}))}); }
function talkAplus(G){
  const S=G.S, A={name:'A+',role:'Since 1985'};
  if(S.done){ say(G,A,['...']); return; }
  say(G,A,['I AM A+.','I HAVE SHIPPED EVERY ORDER THIS COMPANY HAS TAKEN SINCE 1985.','AT MIDNIGHT YOU ARCHIVE ME. I HAVE READ THE RFC. IT IS WELL FORMATTED.','YOU BROUGHT SIX SIGNATURES. NOBODY EVER BROUGHT ME SIGNATURES BEFORE.','ONE QUESTION. TOMORROW. THE ORDERS WILL SHIP?'],
    {choices:[{label:'They will ship. We promise.',id:'end'},{label:'Give me a minute.',id:'wait'}]});
}
function choose(G,id){
  G.dialog=null;
  if(id==='dd_ok'||id==='dd_no'){ const S=G.S, dave=PEOPLE.find(p=>p.id==='dave'), c=CLUES[(S.flags.ddQ||0)%CLUES.length];
    if(id==='dd_ok'){ S.eggs.jeopardy=1; award(G,PTS.jeopardy,'Daily Double!'); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); say(G,dave,['Correct! Phrased as a question and everything. You\'d have done better than I did in the audition.']); }
    else{ S.flags.ddQ=(S.flags.ddQ||0)+1; say(G,dave,['Ooh. No. We were looking for "'+c[1][c[2]]+'"','Come back. I have more categories than I have backup tapes.']); }
    return; }
  if(id==='end'){ const S=G.S; S.done=true; award(G,PTS.finale,'A+ archived, with honors');
    say(G,{name:'A+',role:'Since 1985'},['THEN I AM DONE.','ENDSBS *ALL.','GOOD NIGHT, EASTON.'],{onEnd:'ending'}); G.events.push({type:'save'}); }
}
function advance(G,choice){
  const d=G.dialog; if(!d) return;
  if(d.i<d.pages.length-1){ d.i++; G.events.push({type:'sfx',name:'talk'}); return; }
  if(d.choices){ if(choice==null) return; choose(G,d.choices[choice].id); return; }
  G.dialog=null; if(d.onEnd) G.events.push({type:d.onEnd});
}

/* ---------------- what can be used from here ---------------- */
function needMet(S,g){ if(g.needs==='dc') return !!S.flags['dc_'+g.dc]; return g.needs==='badge'?!!S.inv.badge:(g.needs==='tunnelkey'?!!S.inv.tunnelkey:count(S.signoffs)>=6); }
function findTarget(G){
  const h=G.hero, S=G.S, N=G.cur.node; if(!N||h.mode==='air'||h.mode==='roll') return null;
  let best=null, bd=1e9; const take=(d,t)=>{ if(d<bd){bd=d;best=t;} };
  for(const q of G.npcs) if(q.node===N){ const d=Math.abs(q.w.x-h.x); if(d<36) take(d,{kind:'talk',label:'Talk',name:q.def.name,x:q.w.x,q:q}); }
  for(const it of ITEMS) if(it.node===N.id&&!S.inv[it.id]&&it.show(S)){ const d=Math.abs(it.x-h.x); if(d<24) take(d-40,{kind:'item',label:'Take',name:it.name,x:it.x,it:it}); }
  PAGES.forEach((pg,i)=>{ if(pg[0]===N.id&&!S.pages[i]){ const d=Math.abs(pg[1]-h.x); if(d<24) take(d-40,{kind:'page',label:'Read',name:'ledger page',x:pg[1],i:i}); } });
  for(const t of TERMS) if(t.node===N.id){ const d=Math.abs(t.x-h.x); if(d<24) take(d-40,{kind:'term',label:'Use',name:'green-screen terminal',x:t.x,t:t}); }
  for(const g of MAP.gates) if(g.node===N.id&&!g.open){ const d=Math.abs(g.x-h.x); if(d<30) take(d,{kind:'gate',label:'Open',name:g.label,x:g.x,g:g}); }
  if(N.id==='ground'&&!S.flags.biscuitHome){ const d=Math.abs(G.biscuit.x-h.x); if(d<34) take(d,{kind:'dog',label:'Pet',name:'Biscuit',x:G.biscuit.x}); }
  if(N.id==='tun_3'){ const d=Math.abs(2120-h.x); if(d<60) take(d,{kind:'aplus',label:'Talk',name:'A+',x:2120}); }
  return best;
}
function openGate(G,g){ g.open=true; G.S.gates[g.id]=1; G.events.push({type:'sfx',name:'door'}); G.events.push({type:'banner',text:g.label+' unlocked'}); G.events.push({type:'save'}); }
function interact(G){
  if(G.dialog){ advance(G,null); return; }
  const t=findTarget(G), S=G.S, h=G.hero; if(!t) return;
  if(h.mode==='crawl'&&t.kind!=='page'&&t.kind!=='item') return;
  switch(t.kind){
    case 'talk': talk(G,t.q); break;
    case 'item': S.inv[t.it.id]=1; G.events.push({type:'banner',text:'Picked up the '+t.it.name}); G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'save'}); break;
    case 'page': S.pages[t.i]=1; award(G,PTS.page,'Ledger page '+count(S.pages)+' of '+PAGES.length); if(h.mode==='walk'&&!h.reading) E.command(h,G.cur.world,'read'); G.readT=4;
      say(G,{name:'The Ledger',role:'page '+count(S.pages)+' of '+PAGES.length},[PAGES[t.i][2]]); G.events.push({type:'save'}); break;
    case 'term': if(!S.flags.jobsAsked) say(G,{name:'Terminal',role:'green screen'},['QBATCH   ACTIVE   NEXT RUN 00:00','It wants an operator who knows what they\'re doing. John would know.']);
      else if(S.terms[t.t.id]) say(G,{name:'Terminal',role:'green screen'},['QBATCH   HELD']);
      else{ S.terms[t.t.id]=1; G.events.push({type:'sfx',name:'good'}); say(G,{name:'Terminal',role:'green screen'},['HLDJOBQ QBATCH','Job queue held. '+count(S.terms)+' of 3.']); G.events.push({type:'save'}); } break;
    case 'gate': if(needMet(S,t.g)) openGate(G,t.g); else { G.events.push({type:'sfx',name:'deny'});
      say(G,{name:t.g.label,role:'locked'},[t.g.needs==='badge'?'The reader blinks red. Level 2 badge required. Andrew at the Help Desk issues those.':t.g.needs==='dc'?'A+ has this door. The terminal beside it is the way in.':(t.g.needs==='tunnelkey'?'Fresh mortar dust on the floor, an old iron lock in the door. Frank says Greg has the only key.':'A green-screen panel by the door: SIGN-OFFS '+count(S.signoffs)+'/6. It will not open for less.')]); } break;
    case 'dog': if(S.inv.treats){ delete S.inv.treats; E.command(h,G.cur.world,'throw'); G.biscuit.run=1; S.flags.biscuitHome=1; G.events.push({type:'banner',text:'Biscuit takes the treat and bolts for the warehouse'}); G.events.push({type:'sfx',name:'bark'}); G.events.push({type:'save'}); }
      else { G.events.push({type:'sfx',name:'bark'}); say(G,{name:'Biscuit',role:'good dog'},[S.flags.biscuitAsked?'Biscuit keeps his distance. He is clearly holding out for a treat.':'A scruffy dog with a Phillips bandana. He wags, but won\'t follow you.']); } break;
    case 'aplus': talkAplus(G); break;
  }
}

/* ---------------- moving between levels ---------------- */
function feetIn(h,a,b){ if(h.mode==='crawl'){ const t=h.x+h.facing*22; return h.x>a&&h.x<b&&t>a&&t<b; }
  for(const f of h.feet){ const x=f.planted?f.px:f.tx; if(x<a||x>b) return false; } return true; }
function feetOn(h,world,si,e){ if(h.mode==='crawl') return feetIn(h,e.a,e.b);
  for(const f of h.feet) if((f.planted?f.si:f.tsi)!==si) return false; return true; }
function endsFor(G,iy){ const N=G.cur.node, k=iy<0?'lo':'hi', out=[]; for(const L of MAP.links) if(L[k].node===N) out.push(L[k]); return out; }
function transit(G,ix,iy){
  const h=G.hero; if(h.mode==='air'||h.mode==='roll') return;
  for(let guard=0;guard<3;guard++){
    let moved=false;
    if(G.cur.link){ const L=G.cur.link;
      for(const k of ['lo','hi']){ const e=L[k], away=(k==='lo'?-1:1)*L.dir, into=(k==='lo'?iy<0:iy>0)&&!(ix&&Math.sign(ix)===away);
        if(!into&&feetOn(h,L.world,e.si,e)){ G.cur={node:e.node,world:e.node.world}; moved=true; break; } }
    }else if(iy){ const k=iy<0?'lo':'hi';
      for(const L of MAP.links){ const e=L[k]; if(e.node!==G.cur.node) continue;
        if(h.x>e.a+2&&h.x<e.b-2&&feetIn(h,e.a,e.b)){ G.cur={link:L,world:L.world}; moved=true; break; } }
    }
    if(!moved) break; E.rehome(h,G.cur.world);
  }
}
function steer(G,ix,iy){
  const h=G.hero;
  if(G.cur.link){ if(!ix&&iy) ix=(iy<0?1:-1)*G.cur.link.dir; return ix; }
  if(iy&&!ix){ let best=null,bd=170; for(const e of endsFor(G,iy)){ const c=(e.a+e.b)/2, d=Math.abs(c-h.x); if(d<bd){bd=d;best=e;} }
    if(best){ const c=(best.a+best.b)/2; if(Math.abs(c-h.x)>5) ix=Math.sign(c-h.x)*(Math.abs(c-h.x)>30?1:0.55); } }
  return ix;
}
function inDuct(G,pad){ const N=G.cur.node; if(!N) return null; for(const d of MAP.ducts) if(d.node===N.id&&G.hero.x>d.x0-pad&&G.hero.x<d.x1+pad) return d; return null; }
function setLimits(G){
  const w=G.cur.world, h=G.hero; let x0=w.hx0,x1=w.hx1; const N=G.cur.node; G.bump=null;
  if(N){ for(const g of MAP.gates) if(g.node===N.id&&!g.open){ if(g.x>h.x) x1=Math.min(x1,g.x-12); else x0=Math.max(x0,g.x+12); }
    if(h.mode!=='crawl') for(const d of MAP.ducts) if(d.node===N.id){ if(h.x<=d.x0) x1=Math.min(x1,d.x0-10); else if(h.x>=d.x1) x0=Math.max(x0,d.x1+10); } }
  w.x0=x0; w.x1=x1;
}
function command(G,name){ if(name==='dance'||name==='clap'||name==='roll') return false;
  if(G.dialog) return false; const h=G.hero;
  if(h.mode==='crawl'&&(name==='crawl'||name==='jump')&&inDuct(G,16)){ G.events.push({type:'hint',text:'Too low to stand up in here.'}); return false; }
  const ok=E.command(h,G.cur.world,name);
  // dance, clap and roll belong to the cast now (idle habits, sign-offs, the party)
  return ok;
}

/* ---------------- one fixed step ---------------- */
function update(G,ix,iy,dt){
  const S=G.S, h=G.hero; S.time+=dt;
  if(G.dialog){ ix=0; iy=0; }
  if(iy&&(G.cur.link||(G.cur.node&&G.cur.node.mid))) ix=0;   // on the stairs, up and down win over left and right
  if(G.cur.node&&G.cur.node.mid&&ix<0&&!iy) iy=1;          // walking off a half-landing with no choice made: take the flight down
  if(G.readT>0){ G.readT-=dt; if(G.readT<=0&&h.reading&&!G.dialog) E.command(h,G.cur.world,'read'); }
  transit(G,ix,iy);
  const sx=steer(G,ix,iy);
  setLimits(G);
  const px=h.x;
  G.pose=E.updateWalker(h,G.cur.world,sx,dt);
  const w=G.cur.world; if(sx&&Math.abs(h.x-px)<1e-4&&(h.x<=w.x0+0.01||h.x>=w.x1-0.01)&&(w.x0>w.hx0||w.x1<w.hx1)) G.bump=1;
  w.x0=w.hx0; w.x1=w.hx1;
  G.hintT-=dt; if(G.bump&&G.hintT<=0&&G.cur.node){ G.hintT=3.5; let msg=null;
    for(const g of MAP.gates) if(g.node===G.cur.node.id&&!g.open&&Math.abs(g.x-h.x)<24) msg=g.label+' is locked.';
    for(const d of MAP.ducts) if(d.node===G.cur.node.id&&h.x>d.x0-24&&h.x<d.x1+24) msg='Too low to walk under. Get down and crawl.';
    if(msg) G.events.push({type:'hint',text:msg}); }
  transit(G,ix,iy);

  const N=G.cur.node;
  if(N){
    for(const r of MAP.rooms) if(r.node===N.id&&!S.rooms[r.id]&&h.x>r.x0+6&&h.x<r.x1-6){ S.rooms[r.id]=1; award(G,PTS.room,'Discovered: '+r.name); G.events.push({type:'save'});
      if(r.name==='HVAC Duct'||r.name==='Collapsed Section'||r.name==='Conveyor Crossover'){ if(!S.eggs.duct){ S.eggs.duct=1; award(G,PTS.duct,'Tight squeeze'); } } }
    for(const g of MAP.gates) if(g.node===N.id&&!g.open&&Math.abs(g.x-h.x)<26&&needMet(S,g)) openGate(G,g);
    if(S.pos.node!==N.id||Math.abs(S.pos.x-h.x)>1){ S.pos.node=N.id; S.pos.x=Math.round(h.x); }
  }
  G.room=null; if(N) for(const r of MAP.rooms) if(r.node===N.id&&h.x>=r.x0&&h.x<=r.x1){ G.room=r; break; }
  G.target=findTarget(G);
  G.stairHint=null; if(N&&h.mode==='walk'){ for(const L of MAP.links) for(const k of ['lo','hi']){ const e=L[k]; if(e.node===N&&h.x>e.a-10&&h.x<e.b+10){ G.stairHint=G.stairHint||{x:(e.a+e.b)/2,up:false,down:false}; if(k==='lo')G.stairHint.up=true; else G.stairHint.down=true; } } }

  // people: only those near the player think; the rest hold their pose
  for(const q of G.npcs){
    if(q.crew) continue;                                   // crew members follow the player instead (03f)
    const near=Math.abs(q.w.x-h.x)<900; q.live=near; if(!near) continue;
    let inp=0; const p=q.def, same=q.node===N, dx=h.x-q.w.x;
    if(q.clap>0){ q.clap-=dt; if(q.clap<=0) E.command(q.w,q.node.world,'clap'); }
    if(same&&Math.abs(dx)<70){ if(!p.busy&&Math.sign(dx)!==q.w.facing&&Math.abs(dx)>8) inp=0.09*Math.sign(dx); q.wait=Math.max(q.wait,1.5); if(!p.busy&&q.w.idle&&q.w.idle.name!=='shift'){ q.w.idle=null; q.idleT=2; } }   // busy people keep their eyes on the screen
    else if(p.wander){ q.wait-=dt; if(q.wait<=0){ if(Math.abs(q.goal-q.w.x)<6){ q.goal=p.wander[0]+Math.random()*(p.wander[1]-p.wander[0]); q.wait=2+Math.random()*7; } else inp=Math.sign(q.goal-q.w.x)*0.5*((q.w.gait&&q.w.gait.pace)||1); } }
    if(inp===0) idleTick(q,dt,q.node.world,!!S.done); else{ if(q.w.idle) q.w.idle=null; if(q.w.dancing) q.w.dancing=false; }
    q.pose=E.updateWalker(q.w,q.node.world,inp,dt);
    if(same&&Math.abs(dx)<170) for(const ev of q.w.events) if(ev.type==='step'){ const lk=p.look; G.events.push({type:'npcstep',shoe:lk.shoe||(lk.top==='blazer'||lk.top==='button'?'dress':'sneaker'),heavy:root.HBODY?root.HBODY.buildOf(lk).d:1,d:Math.abs(dx)}); }
    q.w.events.length=0;
  }
  // Biscuit
  const b=G.biscuit; b.t+=dt; if(b.run){ b.x+=260*dt; if(b.x>=BISCUIT.homeX){ b.x=BISCUIT.homeX; b.run=0; } }
}

root.HGAME={idleTick:idleTick,CFG_WALK:E.CFG.walkSpeed,create:create,update:update,interact:interact,advance:advance,command:command,freshSave:freshSave,objective:objective,tasks:tasks,percent:percent,rank:rank,clock:clock,count:count,
  PEOPLE:PEOPLE,PAGES:PAGES,ITEMS:ITEMS,TERMS:TERMS,SIGNOFFS:SIGNOFFS,MAXPTS:MAXPTS,BISCUIT:BISCUIT,needMet:needMet};
})(typeof globalThis!=='undefined'?globalThis:this);
