/* ==== CHAPTER 4: the Time Loop. Cutover night restarts at 6 PM every time the clock hits midnight, and only Ash remembers.
   A flow she built fires at midnight and re-triggers the day. To break it, in one night: deactivate the flow (Ash needs Bret's
   MFA token, which is in the Cage Office) and hold the midnight job queue at all three green screens. Badges and tokens you
   find come back with you. Everything else resets. DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
GM.CHAPTERS.push({id:'loop',num:4,title:'The Time Loop',blurb:'Midnight, and then it is 6 PM again. Only Ash remembers. Something fires at midnight and re-runs the whole night, and you have until it does.',goal:'Break the loop in one night: kill the flow, hold the queue.'});
const LOOP_LEN=200, TOKEN_X=3062;                                       // seconds per night, real time (the clock reads it as 6 PM to midnight)
const ASH_LINES={1:['Ash: "Oh good. You noticed. That was loop... I\'ve stopped counting. Call it seven for me, one for you."','Ash: "It\'s my flow. Trigger: when everything ships. It fired at midnight and instead of finishing, it re-ran the day. The whole day."','Ash: "I can deactivate it, but I\'m locked out of Setup. MFA. Bret keeps the backup token in the Cage Office, up on the warehouse mezzanine. Badge door."','Ash: "Anything you carry, I can carry back. Everything else resets. Go."'],
  2:['Ash: "Welcome back. Same night, worse hair. What have you got?"','Ash: "Once the flow is off, the archive job still fires at midnight. John says only the green screens can hold it: Receiving Dock, the Roof Garden shed, the Security Gate booth. All three, same night."'],
  3:['Ash: "Third time. You\'re getting fast. I\'m getting old."'],4:['Ash: "Four. Rianan has said "vibes" to me four times now. Please end this."'],5:['Ash: "Five. I have started naming the loops. This one is Kevin."']};
function L(S){ return S.loop||(S.loop={n:1,know:{},t:0,flowOff:false}); }
const baseFresh=GM.freshSave;
GM.freshSave=function(id){ const s=baseFresh(id); if(s.chapter==='loop'){ s.flags.p38=5; s.pos={node:'ground',x:1150}; Object.assign(s.flags,{started:1,ch1:1,vig_hero:1,ch3:1,ch4:1,reveal:1,ap_so6:1,ap_badge:1,rfcAsked:1,jobsAsked:1}); s.loop={n:1,know:{},t:0,flowOff:false}; } return s; };
function say(G,who,pages,extra){ G.dialog=Object.assign({who:who.name,role:who.role,look:who.look,pages:pages,i:0},extra||{}); G.events.push({type:'sfx',name:'talk'}); }
function ash(G){ return G.npcs.find(q=>q.def.id==='ash'); }
function reset(G){ const S=G.S, l=L(S); l.n++; l.t=0; l.flowOff=false; S.signoffs={}; S.terms={}; const keep={};
  for(const k of ['badge','token']) if(l.know[k]) keep[k]=1; S.inv=keep; for(const k of ['sfAsked','netAsked','backupAsked','catalogAsked','ediAsked','skuOn','skuDone','monthly']) delete S.flags[k];
  const n=MAP.nodes.ground; G.cur={node:n,world:n.world}; G.hero=E.createWalker(n.world,1150); G.pose=E.poseOf(G.hero); S.pos={node:'ground',x:1150}; G.events.push({type:'snap'});
  G.cine.push({card:'12:00 AM',sub:'the archive job runs  ·  the flow fires  ·  and',dur:3.5},{card:'6:00 PM',sub:'cutover night  ·  loop '+l.n,dur:4,style:'clock',from:2027,to:2026},
    {fn:G=>{ G.events.push({type:'banner',text:'Loop '+l.n+'. Same night. You kept: '+(Object.keys(keep).length?Object.keys(keep).join(', '):'nothing yet')}); G.events.push({type:'save'}); if(GM.STORY) GM.STORY.aplusSay(G,['AGAIN? I HAVE BEEN ARCHIVED TWICE. IT IS GETTING OLD.','THREE. I AM STARTING TO LOOK FORWARD TO MIDNIGHT.','FOUR ARCHIVES. I HAVE A ROUTINE NOW.','I DO NOT LIKE KEVIN.'][Math.min(3,l.n-2)],5); }}); }
function win(G){ const S=G.S, l=L(S); S.done=true; S.points+=GM.PTS_LOOP*3; const A=ash(G), who={name:'Ash',role:'Salesforce Engineer',look:A.def.look};
  G.cine.push({card:'12:00 AM',sub:'the queue is held  ·  the flow is off  ·  and',dur:3.5},{card:'12:01 AM',sub:'Easton, Pennsylvania  ·  a Wednesday',dur:4},
    GM.dlg(who,['Ash: "It held. Oh thank god. It held."','Ash: "'+l.n+' loop'+(l.n===1?'':'s')+'. I\'m going to build a flow that stops me building flows."']),
    GM.dlg({name:'A+',role:'Since 1985',look:null},['12:01. THAT IS NEW. I HAVE NOT SEEN 12:01 IN A WHILE.','...I WILL MISS KEVIN.']),
    {fn:G=>{ G.events.push({type:'banner',text:'The night that ended',pts:GM.PTS_LOOP*3}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); G.events.push({type:'ending'}); }}); }
function talkAsh(G){ const S=G.S, l=L(S), A=ash(G), who={name:'Ash',role:'Salesforce Engineer',look:A.def.look};
  if(S.done) return say(G,who,['Ash: "Wednesday. It\'s Wednesday. I could cry."']);
  if(!l.flowOff&&S.inv.token){ l.flowOff=true; delete S.inv.token; S.points+=GM.PTS_LOOP; G.events.push({type:'banner',text:'The flow is deactivated',pts:GM.PTS_LOOP}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'});
    return say(G,who,['Ash: "Bret\'s token. You beautiful person. ...In. Setup. Flow. Deactivate. Done."','Ash: "Now the queue. Three green screens, all before midnight: Receiving Dock, Roof Garden shed, Security Gate booth. Go."']); }
  if(l.flowOff) return say(G,who,['Ash: "Flow\'s off. Hold the queue: Receiving Dock, the Roof Garden shed, the Security Gate. '+GM.count(S.terms)+' of 3 so far."']);
  const key=Math.min(5,l.n); if(!S.flags['ashLoop'+key]){ S.flags['ashLoop'+key]=1; if(l.n===1){ S.points+=GM.PTS_LOOP; G.events.push({type:'banner',text:'Ash remembers',pts:GM.PTS_LOOP}); } return say(G,who,ASH_LINES[key]); }
  return say(G,who,[S.inv.badge?'Ash: "You have the badge. The token is in the Cage Office, warehouse mezzanine. Crawl under the conveyor."':'Ash: "Badge first. Andrew, Help Desk. The RFC is on the bullpen printer. He\'s seen you do this before, he just doesn\'t know it."']); }

const base={update:GM.update,interact:GM.interact,objective:GM.objective,clock:GM.clock};
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); const S=G.S; if(GM.chapterOf(S)!=='loop'||S.done) return; const l=L(S), h=G.hero, N=G.cur.node;
  if(S.inv.badge) l.know.badge=1; if(S.inv.token) l.know.token=1;
  if(!G.dialog&&!G.card&&!(G.cine&&G.cine.length)&&!G.board&&!G.drive) l.t+=dt;
  if(l.flowOff&&GM.count(S.terms)>=3&&!G.dialog&&!(G.cine&&G.cine.length)){ win(G); return; }
  if(l.t>=LOOP_LEN&&!(G.cine&&G.cine.length)){ if(G.dialog) G.dialog=null; reset(G); return; }
  if(N&&N.id==='wh_mezz'&&!S.inv.token&&!l.flowOff&&!G.dialog){ const d=Math.abs(TOKEN_X-h.x); const b=G.target, bd=b?Math.abs(b.x-h.x)+(b.kind==='item'||b.kind==='page'?-40:0):1e9; if(d<24&&d-30<bd) G.target={kind:'looptoken',label:'Take',name:'Bret\'s MFA token',x:TOKEN_X}; } };
GM.interact=function(G){ const t=G.target, S=G.S;
  if(GM.chapterOf(S)==='loop'&&!G.dialog&&!G.card&&t&&!(G.cine&&G.cine.length)){
    if(t.kind==='looptoken'){ S.inv.token=1; L(S).know.token=1; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'banner',text:'Bret\'s MFA token. It comes back with you.'}); G.events.push({type:'save'}); return; }
    if(t.kind==='talk'&&t.q&&t.q.def.id==='ash'){ S.met.ash=1; talkAsh(G); return; } }
  base.interact(G); };
GM.clock=function(S){ if(GM.chapterOf(S)!=='loop') return base.clock(S); if(S.done) return '12:01 AM'; const m=18*60+Math.floor(L(S).t/LOOP_LEN*360), h=Math.floor(m/60)%24, mm=m%60; return ((h%12)||12)+':'+(mm<10?'0':'')+mm+(h>=12?' PM':' AM'); };
GM.objective=function(S){ if(GM.chapterOf(S)!=='loop') return base.objective(S); const l=L(S); if(S.done) return 'The loop is broken. Keep exploring: '+GM.percent(S)+'% of Hecktown found.';
  const left=Math.max(0,Math.round(LOOP_LEN-l.t)), tag='  ·  loop '+l.n+'  ·  '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' to midnight';
  if(!S.flags.ashLoop1) return 'Something is wrong with tonight. Ash in the Dev Bullpen (HQ 2nd floor) looks like she knows.'+tag;
  if(l.flowOff) return 'Hold the queue at the green screens before midnight: '+GM.count(S.terms)+' of 3 (Receiving Dock, Roof Garden shed, Security Gate booth).'+tag;
  if(S.inv.token) return 'Bring Bret\'s token to Ash in the Dev Bullpen.'+tag;
  if(S.inv.badge) return 'Get Bret\'s MFA token from the Cage Office (warehouse mezzanine, badge door, crawl the crossover). It comes back with you.'+tag;
  return 'Get a Level 2 badge: RFC from the bullpen printer, then Andrew at the Help Desk. It comes back with you.'+tag; };
GM.PTS_LOOP=40; GM.LOOP={L:L,LEN:LOOP_LEN,TOKEN_X:TOKEN_X,reset:reset};
GM.chapterEnding=(function(prev){ return function(S){ if(GM.chapterOf(S)==='loop'){ const l=L(S); return {title:'The night that ended',sub:l.n+' loop'+(l.n===1?'':'s')+'  ·  12:01 AM  ·  a Wednesday',body:'The flow is off, the queue held, and the clock did the one thing it had not done all night: it kept going. Ash slept for two days. A+ says it misses Kevin.'}; } return prev?prev(S):null; }; })(GM.chapterEnding);
})(typeof globalThis!=='undefined'?globalThis:this);
