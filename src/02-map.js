/* ==== MAP: the Easton campus as walkable levels ("nodes") joined by stair flights ("links"). DOM-free. ====
   Everything is in one coordinate space. y grows downward; the lot is y=0; one storey is FH=98 (14 risers of 7).
   A node is a WalkEngine world the player can stand on. A link is a WalkEngine world for one flight whose end
   flats overlap the two nodes it joins, so a walker can be moved between them without a visible seam. */
(function(root){
'use strict';
const E=root.WalkEngine;
const FH=98, RISE=7;
const MAP={FH:FH,nodes:{},links:[],rooms:[],gates:[],ducts:[],props:[],buildings:[],cores:[]};

function node(id,label,x,y,parts,opt){
  const n=Object.assign({id:id,label:label,layer:'front',world:E.makeWorld(E.surfaces(x,y,parts))},opt||{});
  n.world.node=n; MAP.nodes[id]=n; return n;
}
function flatOf(n,x){ const w=n.world; return w.s[w.indexAt(x)]; }

/* One flight. lo/hi = [nodeId, x] of the foot and the head. */
function flight(id,lo,hi,opt){
  const nLo=MAP.nodes[lo[0]], nHi=MAP.nodes[hi[0]], xLo=lo[1], xHi=hi[1], dir=Math.sign(xHi-xLo);
  const fLo=flatOf(nLo,xLo-dir), fHi=flatOf(nHi,xHi+dir), rise=fLo.y-fHi.y, n=Math.round(rise/RISE), tread=Math.abs(xHi-xLo)/(n-1);
  const eLo=Math.min(56,dir>0?xLo-fLo.x0:fLo.x1-xLo), eHi=Math.min(56,dir>0?fHi.x1-xHi:xHi-fHi.x0);
  const s = dir>0 ? E.surfaces(xLo-eLo,fLo.y,[['flat',eLo],['stairs',n,tread,rise/n],['flat',eHi]])
                  : E.surfaces(xHi-eHi,fHi.y,[['flat',eHi],['stairs',n,tread,-rise/n],['flat',eLo]]);
  const world=E.makeWorld(s); world.x0=world.hx0=s[0].x0+4; world.x1=world.hx1=s[s.length-1].x1-4;
  const first=s[0], last=s[s.length-1];
  const L=Object.assign({id:id,world:world,dir:dir,layer:'back',
    lo:{node:nLo,x:xLo,a:dir>0?first.x0:last.x0,b:dir>0?first.x1:last.x1,si:dir>0?0:s.length-1},
    hi:{node:nHi,x:xHi,a:dir>0?last.x0:first.x0,b:dir>0?last.x1:first.x1,si:dir>0?s.length-1:0}},opt||{});
  world.link=L; MAP.links.push(L); return L;
}

/* A switchback stair core: on every floor a landing [cx,cx+44]; half flights out to a mid landing and back. */
function core(id,cx,floors){
  const c={id:id,x0:cx-4,x1:cx+164,floors:floors,mids:[]}; MAP.cores.push(c);
  for(let k=0;k<floors.length-1;k++){
    const a=MAP.nodes[floors[k]], yA=flatOf(a,cx+20).y, mid=node(id+'_m'+k,'Stair landing',cx+116,yA-FH/2,[['flat',44]],{layer:'back',mid:true});
    mid.world.x0=mid.world.hx0=cx+116-14;                // the stair side is open: hips may lead the feet onto it
    c.mids.push(mid);
    flight(id+'_a'+k,[floors[k],cx+44],[mid.id,cx+116]);
    flight(id+'_b'+k,[mid.id,cx+116],[floors[k+1],cx+44]);
  }
  return c;
}
const room=(nodeId,x0,x1,name,opt)=>MAP.rooms.push(Object.assign({id:'r'+MAP.rooms.length,node:nodeId,x0:x0,x1:x1,name:name},opt||{}));
const gate=(id,nodeId,x,needs,label)=>MAP.gates.push({id:id,node:nodeId,x:x,needs:needs,label:label,open:false});
const duct=(nodeId,x0,x1)=>MAP.ducts.push({node:nodeId,x0:x0,x1:x1});
const prop=(type,nodeId,x,opt)=>MAP.props.push(Object.assign({type:type,node:nodeId,x:x},opt||{}));

/* ---------------- ground: west lot, dog-park knoll, HQ ground floor, yard, raised warehouse floor, east yard ---------------- */
node('ground','Hecktown Road',-200,0,[['flat',260],['flat',80],['stairs',5,26,5],['flat',200],['stairs',5,26,-5],['flat',1582],['stairs',4,12,7],['flat',1034],['stairs',4,12,-7],['flat',264]]);
/* ---------------- HQ office, 1100..1900 ---------------- */
node('hq_b1','HQ Basement',420,FH,[['flat',1480]]);
node('hq_f2','HQ 2nd Floor',1100,-FH,[['flat',800]]);
node('hq_roof','HQ Roof',1100,-2*FH,[['flat',800]]);
core('hq',1560,['hq_b1','ground','hq_f2','hq_roof']);
MAP.buildings.push({id:'hq',name:'Phillips HQ',x0:1100,x1:1900,top:-2*FH,base:0,floors:[0,-FH],basement:FH,style:'office'});
MAP.HQ_TOP=-2*FH;                                        // roof level; the drawing reads this
/* ---------------- Lou's garage, 680..900 ---------------- */
node('gar_loft',"Lou's Loft",680,-FH,[['flat',220]]);
flight('gar_s',['ground',700],['gar_loft',856]);
MAP.buildings.push({id:'garage',name:"Lou's Garage",x0:680,x1:900,top:-2*FH+20,base:0,floors:[0,-FH],style:'garage'});
/* ---------------- warehouse, 2200..3160, floor at -28 ---------------- */
const WY=-28;
node('wh_mezz','Warehouse Mezzanine',2640,WY-FH,[['flat',520]]);
node('wh_cat','Top Rack Catwalk',2260,WY-2*FH,[['flat',800]]);
flight('wh_s1',['ground',2484],['wh_mezz',2640]);
flight('wh_s2',['wh_mezz',2860],['wh_cat',2704]);
MAP.buildings.push({id:'wh',name:'Easton DC',x0:2200,x1:3160,top:WY-3*FH,base:WY,floors:[WY],style:'warehouse',mezz:[2640,3160,WY-FH],cat:[2260,3060,WY-2*FH]});
/* ---------------- tunnels under the lot ---------------- */
node('tun_2','Lower Tunnel',420,2*FH,[['flat',1100]]);
node('tun_3','The Deep Level',1380,3*FH,[['flat',940]]);
flight('tun_s1',['tun_2',484],['hq_b1',640]);
flight('tun_s2',['tun_3',1456],['tun_2',1300]);

/* ---------------- 1938: the feed store, far west of everything and joined to nothing (see 03b-prologue) ---------------- */
node('y1938','Phillips Feed · Germansville, PA',-3000,0,[['flat',2600]],{era:true});
MAP.nodes.y1938.world.x1=MAP.nodes.y1938.world.hx1=-700;   // keep the two eras well apart for the camera

/* ---------------- rooms (each is worth discovery points) ---------------- */
room('ground',-200,60,'Employee Lot');           room('ground',244,444,'Dog Park');                room('ground',520,660,"Tina's Tacos");
room('ground',680,900,"Lou's Garage");            room('ground',930,1060,'Security Gate');
room('ground',1100,1215,'HQ Lobby');              room('ground',1215,1330,'Accounting');              room('ground',1330,1556,'Help Desk');
room('ground',1724,1900,'Customer Care');         room('ground',1930,2130,'The Yard');
room('ground',2200,2480,'Receiving Dock');        room('ground',2480,2900,'Pick Aisles');
room('ground',2900,3160,'Shipping Dock');         room('ground',3236,3400,'Drop Yard');
room('ground',3400,3500,'Canal Towpath');
room('hq_f2',1100,1215,'Dev Bullpen');            room('hq_f2',1215,1330,'PIM Room');            room('hq_f2',1330,1556,'War Room');
room('hq_f2',1724,1812,'EDI & Integration');      room('hq_f2',1812,1900,'Executive Row');
room('hq_roof',1100,1556,'Antenna Farm');         room('hq_roof',1724,1900,'Roof Garden');
room('hq_b1',1724,1900,'Server Room');            room('hq_b1',1330,1556,'Legacy Archive');      room('hq_b1',1110,1330,'Basement Storage');
room('hq_b1',420,1090,'The Old Tunnel',{dark:true});
room('gar_loft',680,900,"Lou's Loft");
room('wh_mezz',2640,2890,'Pick Module');          room('wh_mezz',2900,3160,'Cage Office');
room('wh_cat',2340,3060,'Top Rack Catwalk');      room('wh_cat',2260,2335,'HVAC Duct');
room('tun_2',420,790,'Lower Tunnel',{dark:true}); room('tun_2',790,910,'Collapsed Section',{dark:true});
room('tun_2',910,1520,'Pump Gallery',{dark:true});
room('tun_3',1380,1880,'1938 Feed Cellar',{dark:true}); room('tun_3',1900,2320,'A+ Machine Room',{dark:true});

/* ---------------- locked doors and crawl-only passages ---------------- */
gate('g_server','hq_b1',1726,'badge','Server Room');
gate('g_exec','hq_f2',1814,'badge','Executive Row');
gate('g_cage','wh_mezz',2896,'badge','Cage Office');
gate('g_tunnel','hq_b1',1100,'tunnelkey','Bricked-over door');
gate('g_aplus','tun_3',1890,'signoffs','A+ Machine Room');
duct('wh_cat',2262,2336);
duct('tun_2',800,900);

/* ---------------- props: scenery only ---------------- */
[[300,'bench'],[372,'tree'],[270,'tree'],[430,'lamp'],[590,'tacotruck'],[1000,'booth'],[1060,'lamp'],[1960,'lamp'],[2040,'trailer'],[3300,'trailer'],[3380,'lamp'],[3460,'mule'],
 [1142,'sofa'],[1192,'case'],[1250,'desk'],[1312,'cabinet'],[1400,'helpdesk'],[1500,'plant'],[1760,'desk'],[1820,'desk'],[1870,'jar'],
 [790,'truckcab'],[2260,'term'],[2330,'pallet'],[2400,'pallet'],[2560,'rack'],[2700,'rack'],[2800,'forklift'],[2960,'pallet'],[3040,'conveyor'],[3120,'pallet']
].forEach(p=>prop(p[1],'ground',p[0]));
[[1135,'desk'],[1193,'printer'],[1250,'pimdesk'],[1300,'pimdesk'],[1380,'bigscreen'],[1450,'table'],[1500,'whiteboard'],[1543,'pinball'],[1765,'desk'],[1842,'portrait'],[1872,'sofa']].forEach(p=>prop(p[1],'hq_f2',p[0]));
[[1150,'dish'],[1240,'antenna'],[1340,'antenna'],[1440,'hvac'],[1508,'raft'],[1760,'planter'],[1840,'term'],[1880,'planter']].forEach(p=>prop(p[1],'hq_roof',p[0]));
[[1150,'crates'],[1220,'shelf'],[1290,'crates'],[1370,'cabinet'],[1410,'cabinet'],[1500,'cabinet'],[1760,'server'],[1800,'server'],[1860,'server'],[760,'pipes'],[950,'pipes']].forEach(p=>prop(p[1],'hq_b1',p[0]));
[[720,'crates'],[800,'shelf'],[880,'crates']].forEach(p=>prop(p[1],'gar_loft',p[0]));
[[2720,'shelf'],[2800,'shelf'],[2960,'desk'],[3040,'cabinet'],[3110,'safe']].forEach(p=>prop(p[1],'wh_mezz',p[0]));
[[600,'pipes'],[1000,'pump'],[1150,'pump'],[1400,'pipes']].forEach(p=>prop(p[1],'tun_2',p[0]));
[[1540,'sacks'],[1620,'barrel'],[1700,'scale'],[1780,'sacks'],[1840,'barrel'],[2120,'aplus']].forEach(p=>prop(p[1],'tun_3',p[0]));
prop('term','ground',1010);
[['ground',1290],['hq_f2',1212],['hq_b1',1830]].forEach(p=>prop('aplus_wall',p[0],p[1]));             // A+ watches from these
[[-165,'car',0],[-95,'car',1],[-25,'car',2],[-60,'lamp'],[92,'picnic'],[335,'koi'],[664,'dumpster']].forEach(p=>prop(p[1],'ground',p[0],{v:p[2]||0}));

root.HMAP=MAP;
})(typeof globalThis!=='undefined'?globalThis:this);
