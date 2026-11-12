/* ==== HELP DESK QUEUE. Side work that is always there: ten tickets around campus, three open at a time.
   Three kinds. "fix": walk up, press Use, then press again while the needle is in the green. "ask": the user
   describes the problem and you pick the fix. "carry": fetch a part from one place and install it in another.
   Every chapter that plays on campus has the queue; each save keeps its own. DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const PTS_TICKET=15, PTS_QUEUE=50, OPEN_AT_ONCE=3;
const TICKETS=[
 {id:'tk_monitor',kind:'fix',node:'hq_f2',x:1235,where:'PIM Room',title:'Second monitor says NO SIGNAL',done:'Cable reseated. Two monitors again.'},
 {id:'tk_print',kind:'ask',node:'ground',x:1305,where:'Accounting',title:'Nothing will print',who:'Accounting',
   q:'"Month-end and nothing prints. The queue shows forty-one jobs. All of them are mine."',
   a:['Clear the stuck job at the front of the queue','Reinstall the printer on every PC in the building','Tell them printing is a legacy process'],ok:0,
   no:'"That sounds like it takes all night. I have until nine."',yes:'One stuck job from Tuesday. The other forty come out warm.'},
 {id:'tk_toner',kind:'carry',node:'hq_b1',x:1255,where:'Basement Storage',to:{node:'hq_f2',x:1172,where:'Dev Bullpen'},item:'toner cartridge',title:'Bullpen printer is out of toner',done:'Toner in. The printer stops blinking at everybody.'},
 {id:'tk_hvac',kind:'fix',node:'hq_roof',x:1425,where:'Antenna Farm',title:'Rooftop unit tripped. Server room is at 69.',done:'Breaker reset. Back to 68, where Bret keeps it.'},
 {id:'tk_cradle',kind:'fix',node:'ground',x:2560,where:'Pick Aisles',title:'Scanner cradle is not charging',done:'Bent pin straightened. Six scanners, six green lights.'},
 {id:'tk_label',kind:'ask',node:'ground',x:3020,where:'Shipping Dock',title:'Label printer prints blanks',who:'Shipping',
   q:'"Every label comes out blank. I have a truck at the door and a roll of nothing."',
   a:['Order a new printer','Flip the roll. The labels are loaded face down','Print them in the office and run them over'],ok:1,
   no:'"The truck leaves in ten minutes. Got anything faster?"',yes:'Roll flipped. Labels have words on them again.'},
 {id:'tk_ups',kind:'carry',node:'gar_loft',x:835,where:"Lou's Loft",to:{node:'ground',x:975,where:'Security Gate'},item:'UPS battery',title:'Gate kiosk beeps every thirty seconds',done:'New battery in the kiosk. The beeping stops. The guard nearly cries.'},
 {id:'tk_headset',kind:'fix',node:'ground',x:1830,where:'Customer Care',title:'Headset only works in one ear',done:'It was the mute switch on the cord. It is always the mute switch.'},
 {id:'tk_proj',kind:'ask',node:'hq_f2',x:1420,where:'War Room',title:'Big screen is upside down',who:'War Room',
   q:'"The cutover dashboard is upside down on the big screen. We go live at midnight."',
   a:['Turn the laptop over','Suggest everyone stand on the table','Ceiling-mount mode got switched off. Turn it back on'],ok:2,
   no:'"I am going to pretend you did not say that."',yes:'One menu, one checkbox. The dashboard is right side up.'},
 {id:'tk_drive',kind:'fix',node:'hq_b1',x:1845,where:'Server Room',title:'Amber light on drive bay 3',done:'Spare seated, array rebuilding. Nobody upstairs will ever know.'}];
const byId=id=>TICKETS.find(t=>t.id===id);
const count=o=>Object.keys(o).length;

function tk(S){ return S.tk||(S.tk={done:{},open:[],carry:null,clean:0,told:0}); }
function active(S){ return !!S.flags.started; }
function onCampus(G){ const N=G.cur.node; return !!N&&!N.era&&!N.dc&&!N.show&&!N.river&&!N.studio&&!N.future; }
function busy(G){ return !!(G.dialog||G.card||G.drive||G.board||G.p38||G.pin||(G.cine&&G.cine.length)); }
function refill(G){ const S=G.S, t=tk(S); let added=null;
  for(const d of TICKETS){ if(t.open.length>=OPEN_AT_ONCE) break; if(!t.done[d.id]&&t.open.indexOf(d.id)<0){ t.open.push(d.id); added=d; } }
  return added; }
/* where an open ticket wants you right now */
function spotOf(S,d){ const t=tk(S); if(d.kind==='carry'&&t.carry===d.id) return {node:d.to.node,x:d.to.x,where:d.to.where,label:'Install',name:d.item};
  return {node:d.node,x:d.x,where:d.where,label:d.kind==='carry'?'Take':(d.kind==='ask'?'Help':'Fix'),name:d.kind==='carry'?d.item:d.title}; }
function openSpots(S){ if(!active(S)) return []; const t=tk(S); return t.open.map(id=>{ const d=byId(id); return Object.assign({d:d},spotOf(S,d)); }); }

function close(G,d,line){ const S=G.S, t=tk(S); t.done[d.id]=1; t.open=t.open.filter(id=>id!==d.id); if(t.carry===d.id) t.carry=null;
  S.points+=PTS_TICKET; G.events.push({type:'banner',text:'Ticket closed: '+d.title+' ('+count(t.done)+' of '+TICKETS.length+')',pts:PTS_TICKET}); G.events.push({type:'sfx',name:'good'});
  G.tkFx={x:G.hero.x,y:G.hero.y,t:0};
  for(const q of G.npcs) if(q.node===G.cur.node&&!q.crew&&Math.abs(q.w.x-G.hero.x)<150&&!(q.clap>0)) q.clap=0.25+Math.random()*0.5;   // whoever is in the room gives you a hand
  if(line) G.dialog={who:'Ticket #'+(4100+TICKETS.indexOf(d)),role:'closed',look:null,pages:[line],i:0};
  const next=refill(G);
  if(count(t.done)>=TICKETS.length){ S.points+=PTS_QUEUE; G.events.push({type:'banner',text:'Queue zero. Nobody has seen that since 1985.',pts:PTS_QUEUE}); }
  else if(next) G.events.push({type:'hint',text:'New ticket: '+next.title+' ('+next.where+')'});
  G.events.push({type:'save'}); }

/* the needle: back and forth across the bar; the green zone is forgiving and gets wider after a miss */
function needle(f){ return 0.5-0.5*Math.cos(f.t*2.6); }
function zone(f){ const half=0.13+Math.min(f.tries,3)*0.035; return [f.c-half,f.c+half]; }
function startFix(G,d){ const h=G.hero; G.fix={id:d.id,t:0,tries:0,c:0.34+((TICKETS.indexOf(d)*37)%40)/100};
  if(h.mode==='walk'&&!h.reading){ E.command(h,G.cur.world,'read'); } G.events.push({type:'sfx',name:'pick'}); }
function endFix(G){ const h=G.hero; if(h.reading&&!G.dialog) E.command(h,G.cur.world,'read'); G.fix=null; }
function pressFix(G){ const f=G.fix, d=byId(f.id), z=zone(f), p=needle(f);
  if(p>=z[0]&&p<=z[1]){ const t=tk(G.S); if(!f.tries) t.clean=(t.clean||0)+1; endFix(G); close(G,d,d.done+(f.tries?'':'  First try.')); }
  else{ f.tries++; G.events.push({type:'sfx',name:'deny'}); G.events.push({type:'hint',text:'Not yet. Press when the needle is in the green.'}); } }

function ask(G,d){ G.dialog={who:d.who,role:'ticket: '+d.title,look:null,pages:[d.q],i:0,choices:d.a.map((l,k)=>({label:l,id:(k===d.ok?'tkok_':'tkno_')+d.id}))}; G.events.push({type:'sfx',name:'talk'}); }
function answer(G,id){ const ok=id.indexOf('tkok_')===0, d=byId(id.slice(5)); G.dialog=null;
  if(ok){ const t=tk(G.S); if(!G.tkMiss||!G.tkMiss[d.id]) t.clean=(t.clean||0)+1; close(G,d,d.yes); }
  else{ (G.tkMiss||(G.tkMiss={}))[d.id]=1; G.events.push({type:'sfx',name:'deny'}); G.dialog={who:d.who,role:'still waiting',look:null,pages:[d.no],i:0}; } }

function target(G){ const S=G.S, h=G.hero, N=G.cur.node; if(!N||!active(S)||!onCampus(G)||busy(G)||h.mode==='air'||h.mode==='roll'||h.mode==='crawl') return null;
  if(G.fix) return {kind:'fixing',label:'Now',name:byId(G.fix.id).title,x:h.x};
  let best=null, bd=24; for(const s of openSpots(S)) if(s.node===N.id){ const dd=Math.abs(s.x-h.x); if(dd<bd){ bd=dd; best={kind:'ticket',label:s.label,name:s.name,x:s.x,d:s.d}; } }
  return best; }

const base={update:GM.update,interact:GM.interact,advance:GM.advance,command:GM.command,create:GM.create};
GM.create=function(save){ const G=base.create(save); if(active(G.S)) refill(G); return G; };
GM.update=function(G,ix,iy,dt){
  if(G.fix){ ix=0; iy=0; }
  base.update(G,ix,iy,dt);
  const S=G.S; if(!active(S)) return; const t=tk(S);
  if(!t.told&&onCampus(G)&&!busy(G)){ t.told=1; refill(G); if(t.open.length) G.events.push({type:'hint',text:'Help Desk: '+t.open.length+' tickets open. Look for the orange tags.'}); }
  if(G.tkFx){ G.tkFx.t+=dt; if(G.tkFx.t>1.6) G.tkFx=null; }
  if(G.fix){ G.fix.t+=dt; if(G.dialog||G.card||!G.cur.node||G.hero.mode!=='walk'||G.fix.t>14){ endFix(G); } }
  const mine=target(G); if(mine&&(mine.kind==='fixing'||!G.target||(G.target.kind==='talk'&&Math.abs(mine.x-G.hero.x)<Math.abs(G.target.x-G.hero.x)))) G.target=mine;   // a person standing nearer than the ticket still gets talked to
};
GM.interact=function(G){
  if(!G.dialog&&!G.card){ if(G.fix){ pressFix(G); return; }
    const t=G.target; if(t&&t.kind==='ticket'){ const S=G.S, d=t.d, q=tk(S);
      if(d.kind==='fix') startFix(G,d);
      else if(d.kind==='ask') ask(G,d);
      else if(q.carry===d.id) close(G,d,d.done);
      else if(q.carry){ G.events.push({type:'hint',text:'Hands full. Install the '+byId(q.carry).item+' first ('+byId(q.carry).to.where+').'}); }
      else{ q.carry=d.id; G.events.push({type:'banner',text:'Picked up the '+d.item+'. It goes to '+d.to.where+'.'}); G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'save'}); }
      return; } }
  base.interact(G);
};
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^tk(ok|no)_/.test(d.choices[choice].id)){ answer(G,d.choices[choice].id); return; }
  base.advance(G,choice); };
GM.command=function(G,name){ if(G.fix){ if(name==='jump'||name==='crawl'){ endFix(G); return true; } return false; } return base.command(G,name); };

GM.PTS_TICKET=PTS_TICKET; GM.PTS_QUEUE=PTS_QUEUE;
GM.TICKETS={LIST:TICKETS,tk:tk,active:active,openSpots:openSpots,spotOf:spotOf,needle:needle,zone:zone,byId:byId,total:TICKETS.length*PTS_TICKET+PTS_QUEUE};
})(typeof globalThis!=='undefined'?globalThis:this);
