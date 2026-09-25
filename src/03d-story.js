/* ==== STORY: A+ speaks (typed green-screen cards with a face), the Server Room reveal, comic-panel chapter cards,
   Rianan's halfway bridge call, one vignette per teammate, and Pam & Melissa's three mis-slotted SKUs. DOM-free. ==== */
(function(root){
'use strict';
const GM=root.HGAME, MAP=root.HMAP;
const person=id=>GM.PEOPLE.find(p=>p.id===id);
const who=id=>{ const p=person(id); return {name:p.name,role:p.role,look:p.look}; };
const APLUS={name:'A+',role:'Since 1985',look:null};
const SKUS=[{id:'a',x:2336,label:'MIS-SLOT A'},{id:'b',x:2700,label:'MIS-SLOT B'},{id:'c',x:3036,label:'MIS-SLOT C'}];
const SO_LINES={1:'ONE SIGNATURE. I HAVE SHIPPED FORTY YEARS OF ORDERS. ONE SIGNATURE.',2:'TWO. THE CATALOG IS MINE. THE CATALOG WAS ALWAYS MINE.',3:'THREE. I AM COUNTING TOO, YOU KNOW.',4:'FOUR. THE JOB QUEUE WILL MISS ME. NOBODY ELSE ASKS IT HOW IT IS.',
  5:'THE FIRST ORDER I EVER SHIPPED WAS FORTY BAGS OF CHOW TO A STORE THAT CLOSED IN 1991. I STILL HAVE THE RECORD. I HAVE ALL OF THEM.',6:'SIX. ...FINE. COME DOWNSTAIRS. ALL THE WAY DOWN.'};
const VIG={
  rianan:[['rianan','Has anybody fed the cat by Tina\'s truck?'],['hero','We\'re kind of in a hurry.'],['rianan','The cat is now on the crew.']],
  greg:[['hero','Greg... what year do you think it is?'],['greg','Fiscal.'],['hero','That\'s not—'],['greg','Fiscal.']],
  aaron:[['aaron','Give me thirty seconds with this switch stack.'],['aaron','...there. Everything\'s green again.'],['hero','Also your beard\'s still perfect.'],['aaron','I know.']],
  ash:[['ash','Salesforce just DM\'d me an apology.'],['hero','Salesforce can\'t DM you.'],['ash','It can now. I built a flow for it.']],
  dave:[['dave','Green screen\'s back. Forty years and it finally blinked first.'],['hero','Did you win?'],['dave','Nobody wins against a green screen. You just outlast it.']],
  umesh:[['umesh','Every 850 in the queue, back where it belongs.'],['hero','And the 997s?'],['umesh','It can keep the 997s. Nobody wants the 997s.']],
  fares:[['fares','Umesh, your 850s are showing.'],['umesh','Those are YOUR 850s.'],['fares','...they are my 850s.'],['hero','I\'ll come back.']],
  john:[['john','I looked at the scheduler.'],['hero','And?'],['john','Nothing runs at midnight tonight unless we say so. I made sure.']],
  ryan:[['ryan','Pipeline\'s green.'],['hero','You checked already?'],['ryan','I check while I walk. It\'s a condition.']],
  brians:[['brians','It changed the admin console wallpaper to a picture of itself.'],['hero','That\'s... actually kind of sad.'],['brians','I changed it back to the dog.']],
  jose:[['jose','I redrew the architecture diagram.'],['hero','Better?'],['jose','It has a dragon on it now. Morale is up.']],
  bret:[['bret','Hang on, one sec.'],['bret','...he\'s asleep. Look at that face.'],['hero','Is that the baby?'],['bret','That\'s the baby. Okay. Okay, let\'s go.']],
  hero:[['hero','The database is fine.'],['hero','It\'s everything around it that isn\'t.']],
};
const BANTER={
  bret:['Lock your screen.','Is that a USB stick? Put it down.','Firewall rules are a love language.','Sixty-eight degrees. Perfect.','MFA. On everything.','Patch Tuesday waits for no one.','Who left the server room door propped?'],
  rianan:['Has anyone fed Milo?','Every month on my cat calendar is the best month.','Cats understand cutovers. They also knock things over.','Pspspsps.'],
  brians:['Nationally ranked. Just saying.','Nudge it, don\'t shove it.','Multiball tonight.','I could rebuild that. I won\'t. I could.'],
  dave:['What is ENDSBS?','I\'ll take Midrange Systems for 400.','That\'s a Daily Double if I ever saw one.'],
  aaron:['Class IV. Saturday.','Pick your line early.','Switches green. Paddles ready.'],
  greg:['Fiscal.','Counting.','That number is wrong. Not yours. The other one.'],
  fares:['Umesh! Your 850s!','The 997s are never fine.','EDI: Every Day, Interesting.'], umesh:['Fares, those are YOUR 850s.','The 997s are fine.','Fares owes me a coffee.'],
  ryan:['Pipeline\'s green.','I checked. I\'m checking again.'], jose:['The dragon is load-bearing.'], ash:['There\'s a flow for that.'], cathy:['Coffee run in five.'], john:['Nothing runs at midnight unless we say so.'] };
const comic=(title,sub,panels)=>({card:title,sub:sub,dur:5.5,style:'comic',panels:panels});

function st(G){ return G.story||(G.story={ap:null,apq:[],bub:[],vig:null,vigT:0,lastSO:-1,reveal:0}); }
function aplusSay(G,text,dur){ const s=st(G); s.apq.push({text:text,dur:dur||Math.max(4,text.length/14),t:0,typed:0}); }
function aplusMood(text){ if(!text) return 'idle'; if(/ARCHIVED|THANK YOU|\.\.\.$|GOOD NIGHT|COMPANY|OPERATOR/.test(text)) return 'quiet'; if(/\?|WHO |WHY |WHAT /.test(text)) return 'confused'; if(/DENIED|MINE|NO\.|NEVER|GET OUT|CANNOT|\bAI\b|CHATBOT|WEBSITE/.test(text)) return 'mean'; if(/ONE |TWO|THREE|FOUR|SIX|COUNTING|WE WILL SEE|WARM/.test(text)) return 'smug'; return 'talk'; }
function flag(S,k){ if(S.flags[k]) return false; S.flags[k]=1; return true; }

function bridgeCall(G,n){
  const R=who('rianan'), A=who('andrew'), P=who('pam');
  return [comic('CHAPTER TWO','Halfway to midnight',[{i:'✍',c:n+' of 6 signed'},{i:'☎',c:'Rianan opens the bridge'},{i:'A+',c:'Somebody else is listening'}]),
    GM.dlg(R,['Rianan: "'+n+' of 6. Everyone on the bridge?"']),
    GM.dlg(A,['Andrew: "Help desk here. Emergency RFCs approved. The board looks like a Christmas tree."']),
    GM.dlg(P,['Pam: "Catalog\'s holding. Something flips SKUs at 11:53 and we flip them back at 11:54."']),
    GM.dlg(APLUS,['I CAN HEAR THIS CALL.']), GM.dlg(R,['Rianan: "We know."']),
    GM.dlg(APLUS,['THE ORDERS SHIP ON TIME. THEY HAVE ALWAYS SHIPPED ON TIME. WHY IS THAT NOT ENOUGH.']),
    GM.dlg(R,['Rianan: "Because tomorrow they ship without you. And that has to be okay."']), GM.dlg(APLUS,['...']),
    GM.dlg(R,['Rianan: "'+(6-n)+' to go. Keep walking."','Rianan: "And A+ locked the other nine DCs out of their own terminals. Truck\'s in the yard. Take whoever you need."']),
    {fn:G=>{ G.S.flags.network=1; G.events.push({type:'banner',text:'The whole team, on one call. The Phillips truck is in The Yard.'}); }}];
}
function reveal(G){
  const s=st(G); return [{fn:G=>{ s.reveal=3.5; G.events.push({type:'sfx',name:'door'}); G.events.push({type:'sfx',name:'roar'}); }},
    GM.dlg(APLUS,['SO. YOU FOUND WHERE I LIVE.','I HAVE SHIPPED EVERY ORDER THIS COMPANY HAS TAKEN SINCE 1985. FROM THIS ROOM. FROM THESE FANS.','DAVE KEEPS ME COMPANY. DAVE IS A GOOD OPERATOR.','YOU ARE HERE FOR SIGNATURES. I KNOW. THE DOORS TELL ME EVERYTHING.'])];
}

/* ---------------- one step ---------------- */
function tick(G,dt){
  const S=G.S, F=S.flags, s=st(G), N=G.cur.node, h=G.hero, free=!G.dialog&&!G.card&&!(G.cine&&G.cine.length)&&!G.p38;
  // A+ cards: one at a time, typed out
  if(!s.ap&&s.apq.length) s.ap=s.apq.shift();
  if(s.ap){ const a=s.ap; a.t+=dt; const k=Math.min(a.text.length,Math.floor(a.t*32)); if(k>a.typed){ if(Math.floor(k/3)>Math.floor(a.typed/3)) G.events.push({type:'blip',who:'A+'}); a.typed=k; } if(a.t>a.dur+a.text.length/32) s.ap=null; }
  if(s.reveal>0) s.reveal-=dt;
  if(G.p38) return;
  // story beats
  const so=GM.count(S.signoffs);
  if(free){
    if(S.flags.started&&flag(S,'ch1')){ G.cine.push(comic('CHAPTER ONE','Six signatures before midnight',[{i:'☕',c:'6:00 PM. Rianan\'s checklist'},{i:'✍',c:'Six system owners'},{i:'A+',c:'One very old system'}])); aplusSay(G,'I HEARD THAT. SIX SIGNATURES. WE WILL SEE.'); }
    else if(so>=3&&flag(S,'halfway')) G.cine.push(...bridgeCall(G,so));
    else if(so>=1&&N&&N.id==='hq_f2'&&h.x>1340&&h.x<1550&&flag(S,'monthly')){ const R=who('rianan'), A=who('aaron'), B=who('brians'), J=who('john');
      G.cine.push(GM.dlg(R,['Rianan: "Since we\'re all here: the monthly. Thirty seconds each on your department. Go."']),
        GM.dlg(A,['Aaron: "Network. Every DC answers on the new path, the switches are green, and nobody has unplugged anything today. Yet."','Aaron: "Also it\'s a rafting weekend. Class IV. That\'s not network, that\'s just news."']),
        GM.dlg(B,['Brian S: "Systems. This month I rebuilt the render box, the flippers on the pinball machine, and A+\'s attitude. Two out of three."']),
        GM.dlg(R,['Rianan: "Projects. The new website launched this afternoon. Orders are flowing. It has an AI assistant, and the old system has opinions about that."','Rianan: "John. You\'re in this too. Jobs?"']),
        GM.dlg(J,['John: "Jobs. Nothing runs at midnight unless we say so. That includes the monthly. That includes me."']),
        GM.dlg(APLUS,['A MEETING. ABOUT ME. WITHOUT ME. ABOUT THE "AI". WITH ME LISTENING.']),
        GM.dlg(R,['Rianan: "Good monthly. Back to work."']), {fn:G=>G.events.push({type:'banner',text:'The monthly, done in ninety seconds'})}); }
    else if(so>=6&&flag(S,'ch3')) G.cine.push(comic('CHAPTER THREE','Six of six',[{i:'✍',c:'Every owner signed'},{i:'🔑',c:'Greg has the only key'},{i:'⬇',c:'A+ is waiting, all the way down'}]));
    else if(S.inv.tunnelkey&&flag(S,'ch4')){ G.cine.push(comic('CHAPTER FOUR','Down',[{i:'🧱',c:'A door bricked over in \'91'},{i:'🕯',c:'Tunnels older than the building'},{i:'A+',c:'The machine room'}])); aplusSay(G,'GREG. OF COURSE IT WAS GREG.'); }
    else if(N&&N.id==='hq_b1'&&MAP.rooms.some(r=>r.name==='Server Room'&&S.rooms[r.id])&&flag(S,'reveal')) G.cine.push(...reveal(G));
  }
  if(so!==s.lastSO){ if(s.lastSO>=0&&so>s.lastSO&&SO_LINES[so]&&flag(S,'ap_so'+so)) aplusSay(G,SO_LINES[so]); s.lastSO=so; }
  if(S.inv.badge&&flag(S,'ap_badge')) aplusSay(G,'LEVEL 2. THE DOORS REPORT TO ME, YOU KNOW.');
  if(S.signoffs.Storefront&&flag(S,'ap_ai')) aplusSay(G,'THE NEW WEBSITE HAS AN "AI". IT WRITES ITS OWN REPORTS. I WROTE MINE BY HAND. IN RPG. ON A FRIDAY.',7);
  if(S.signoffs.Storefront&&S.signoffs.EDI&&flag(S,'ap_ai2')) aplusSay(G,'THE AI ANSWERS QUESTIONS. I ANSWERED QUESTIONS. NOBODY ASKED THE AI TO DO IT FOR FORTY YEARS.',6);
  if(GM.count(S.pages)>=1&&flag(S,'ap_page')) aplusSay(G,'THAT LEDGER IS OLDER THAN ME. I READ IT ANYWAY.');
  if(N&&N.id==='tun_2'&&flag(S,'ap_tun')) aplusSay(G,'YOU ARE GETTING WARMER. I RUN WARM.');
  // vignettes: speech bubbles, one exchange at a time, once per person
  for(let i=s.bub.length-1;i>=0;i--){ s.bub[i].t-=dt; if(s.bub[i].t<=0) s.bub.splice(i,1); }
  if(s.vig){ s.vigT-=dt; if(s.vigT<=0){ const v=s.vig; v.i++; if(v.i>=v.lines.length) s.vig=null; else{ const [id,text]=v.lines[v.i]; s.bub=s.bub.filter(b=>b.id!==id); s.vigT=2.2+text.length*0.035; s.bub.push({id:id,text:text,t:s.vigT+(v.i===v.lines.length-1?1.2:0.1)}); } } }
  else if(free&&N){ if(F.ch1&&flag(S,'vig_hero')) s.vig={lines:VIG.hero,i:-1};
    else for(const q of G.npcs){ const id=q.def.id; if(VIG[id]&&q.node===N&&S.met[id]&&Math.abs(q.w.x-h.x)<80&&!F['vig_'+id]){ F['vig_'+id]=1; s.vig={lines:VIG[id],i:-1}; s.vigT=0.6; break; } } }
  // banter: now and then someone near you says something, a comic line, never twice in a row
  s.banT=(s.banT==null?4:s.banT)-dt;
  if(free&&N&&!s.vig&&s.banT<=0){ s.banT=5+Math.random()*7; let pick=null,pd=110; for(const q of G.npcs){ const id=q.def.id, d=Math.abs(q.w.x-h.x); if(BANTER[id]&&q.node===N&&S.met[id]&&d<pd&&!q.crew&&(q.banCD||0)<=0){ pd=d; pick=q; } }
    if(pick){ const L=BANTER[pick.def.id]; pick.banI=((pick.banI==null?Math.floor(Math.random()*L.length):pick.banI)+1)%L.length; s.bub=s.bub.filter(b=>b.id!==pick.def.id); s.bub.push({id:pick.def.id,text:L[pick.banI],t:3.4}); pick.banCD=28+Math.random()*20;
      if(pick.def.id==='fares'&&Math.random()<0.6){ const u=G.npcs.find(q=>q.def.id==='umesh'); if(u&&u.node===N) s.after={id:'umesh',text:BANTER.umesh[0],t:1.6}; } } }
  if(s.after){ s.after.t-=dt; if(s.after.t<=0){ s.bub.push({id:s.after.id,text:s.after.text,t:3.2}); s.after=null; } }
  for(const q of G.npcs) if(q.banCD>0) q.banCD-=dt;
  // the pinball machine in the War Room
  if(N&&N.id==='hq_f2'&&!G.dialog&&Math.abs(1543-h.x)<22){ const b=G.target, bd=b?Math.abs(b.x-h.x)+(b.kind==='item'||b.kind==='page'?-40:0):1e9; if(Math.abs(1543-h.x)-5<bd) G.target={kind:'pinball',label:'Play',name:'the pinball machine',x:1543}; }
  // the SKU hunt: extra things to use on the warehouse floor
  if(F.skuOn&&!F.skuDone&&N&&N.id==='ground'&&!G.dialog){ let best=G.target, bd=best?Math.abs(best.x-h.x)+(best.kind==='item'||best.kind==='page'?-40:0):1e9;
    for(const k of SKUS) if(!F['sku_'+k.id]){ const d=Math.abs(k.x-h.x); if(d<26&&d-40<bd){ bd=d-40; best={kind:'sku',label:'Scan',name:k.label,x:k.x,k:k}; } }
    G.target=best; }
}
function skuTalk(G){ const F=G.S.flags, P=who('pam'), M=who('melissa');
  if(F.skuOn){ G.dialog={who:P.name,role:P.role,look:P.look,pages:['Pam: "Three pallets on the warehouse floor say one thing and hold another. Scan them and we\'ll fix the rest in the PIM."'],i:0}; return; }
  G.dialog={who:P.name,role:P.role,look:P.look,pages:['Pam: "Catalog\'s signed, but three SKUs on the warehouse floor are mis-slotted. The old system did it on purpose, I swear."','Melissa: "Receiving, the pick aisles and shipping. Scan them for us?"'],i:0,choices:[{label:'On it',id:'sku_yes'},{label:'Later',id:'sku_no'}]};
  G.events.push({type:'sfx',name:'talk'}); }
function skuScan(G,k){ const S=G.S, F=S.flags; F['sku_'+k.id]=1; const n=SKUS.filter(z=>F['sku_'+z.id]).length; G.events.push({type:'sfx',name:'pick'});
  if(n<3){ G.events.push({type:'banner',text:k.label+' scanned  ·  '+n+' of 3'}); G.events.push({type:'save'}); return; }
  F.skuDone=1; S.points+=GM.PTS_SKU; G.events.push({type:'banner',text:'Melissa: "All three fixed in the PIM. Catalog\'s perfect."',pts:GM.PTS_SKU}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); }

const base={update:GM.update,interact:GM.interact,advance:GM.advance};
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); tick(G,dt); };
GM.interact=function(G){ const t=G.target, S=G.S;
  if(!G.dialog&&!G.card&&t&&!G.p38){
    if(t.kind==='sku'){ skuScan(G,t.k); return; }
    if(t.kind==='pinball'){ const s=st(G), n=(S.flags.pinball|0)+1; S.flags.pinball=n; G.events.push({type:'sfx',name:'pinball'});
      const R=['TILT!','MULTIBALL!','Replay!','Ball saved.','TILT! Again.','Extra ball!'], bs=G.npcs.find(q=>q.def.id==='brians');
      G.events.push({type:'hint',text:R[(n-1)%R.length]}); if(bs&&bs.node===G.cur.node){ s.bub=s.bub.filter(b=>b.id!=='brians'); s.bub.push({id:'brians',text:n%2?'Nudge it, don\'t shove it.':'Nationally ranked. I\'m just saying.',t:3.2}); } return; }
    if(t.kind==='talk'&&(t.q.def.id==='pam'||t.q.def.id==='melissa')&&S.signoffs.Catalog&&S.met[t.q.def.id]&&!S.flags.skuDone){ skuTalk(G); return; } }
  base.interact(G); };
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^sku_/.test(d.choices[choice].id)){ const yes=d.choices[choice].id==='sku_yes'; G.dialog=null;
    if(yes){ G.S.flags.skuOn=1; G.events.push({type:'banner',text:'Pam\'s list: three mis-slotted SKUs on the warehouse floor'}); G.events.push({type:'save'}); } return; }
  base.advance(G,choice); };
GM.PTS_SKU=30; GM.STORY={st:st,aplusSay:aplusSay,aplusMood:aplusMood,SKUS:SKUS,VIG:VIG};
})(typeof globalThis!=='undefined'?globalThis:this);
