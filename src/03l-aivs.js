/* ==== CHAPTER 3: A+ vs. the AI. The new website's assistant, Fetch, is taking over order questions at midnight. A+ refuses
   to be archived until it has met its replacement and taught it four things. You carry the lessons: A+ (Server Room) sends
   you to the person who knows, you bring it back, A+ dictates, Fetch mislearns it. Then the handover. DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
GM.CHAPTERS.push({id:'aivs',num:3,title:'A+ vs. the AI',blurb:'The new website has an AI assistant. At midnight it takes over. A+ will not be archived until it has met its replacement, and it has notes.',goal:'Carry four lessons from A+ to Fetch, then the handover.'});
const FETCH={x:1160,node:'hq_f2'}, APX={x:1858,node:'hq_b1'};
const LESSONS=[
  {topic:'the 850',src:'umesh',ask:'FIRST LESSON. GO ASK UMESH WHAT AN 850 IS. IT WILL NOT KNOW. IT HAS NEVER HELD ONE.',srcLine:'Umesh: "An 850 is a purchase order. Every order in this building starts as one. Fares will tell you they\'re his. They are not."',
    dictate:'TELL IT: AN 850 IS A PURCHASE ORDER. THE 997 IS THE RECEIPT. NOBODY WANTS THE 997.',learn:['Fetch: "Got it! 850 = purchase order. 997 = ...feelings?"','Fetch: "I have made a note. The note is a 997. Nobody wants it."']},
  {topic:'showing up',src:'greg',ask:'SECOND. GO ASK GREG WHY THE ORDERS SHIP. NOT HOW. WHY. HE HAS THE LEDGER.',srcLine:'Greg: "1938. A feed store, a mare, the rain. Show up for the people who count on you. That is the entire ledger. The rest is arithmetic."',
    dictate:'TELL IT: SHOW UP FOR THE PEOPLE WHO COUNT ON YOU. RAIN OR NO RAIN. THAT IS THE WHOLE BUSINESS.',learn:['Fetch: "Show up. Understood. I do not have legs. I will show up emotionally."','Fetch: "Rain detected on the website? No. Rain is not on the website. Proceeding."']},
  {topic:'sixty-eight degrees',src:'bret',ask:'THIRD. GO ASK BRET ABOUT THE TEMPERATURE. HE WILL NOT STOP. LET HIM.',srcLine:'Bret: "Sixty-eight degrees. The server room is sixty-eight degrees. If it is ever not sixty-eight degrees, you call me. Also: is your screen locked?"',
    dictate:'TELL IT: SIXTY-EIGHT DEGREES. NOT SIXTY-NINE. AND LOCK YOUR SCREEN.',learn:['Fetch: "68°. I will keep everything at 68. Including the coffee. Including Bret."','Fetch: "Screen locked. I do not have a screen. I have locked it anyway."']},
  {topic:'the cat',src:'rianan',ask:'LAST. GO ASK RIANAN ABOUT THE CAT. THE CAT IS IMPORTANT. I DO NOT KNOW WHY. FIND OUT.',srcLine:'Rianan: "Milo? One taco, one bag, never ask what\'s in the bag. He is on the crew. He is on payroll, emotionally. If the new system can\'t handle a cat it can\'t handle Phillips."',
    dictate:'TELL IT: ONE TACO. ONE BAG. THE CAT IS ON THE CREW. DO NOT ASK QUESTIONS ABOUT THE CAT.',learn:['Fetch: "I have added Milo as an approved vendor. Payment terms: one taco, net zero."','Fetch: "I asked no questions about the cat. I have many. I am holding them."']}];
const APLUS={name:'A+',role:'Since 1985',look:null}, FT={name:'Fetch',role:'website assistant  ·  since this afternoon',look:null};
function ai(S){ return S.ai||(S.ai={k:0,stage:'meet'}); }
const baseFresh=GM.freshSave;
GM.freshSave=function(id){ const s=baseFresh(id); if(s.chapter==='aivs'){ s.flags.p38=5; s.pos={node:'hq_f2',x:1130}; Object.assign(s.flags,{started:1,ch1:1,vig_hero:1,ch3:1,ch4:1,reveal:1,ap_so6:1,ap_ai:1,ap_ai2:1,ap_badge:1,rfcAsked:1}); s.inv.badge=1; s.gates.g_server=1; s.ai={k:0,stage:'meet'}; } return s; };
function say(G,who,pages,extra){ G.dialog=Object.assign({who:who.name,role:who.role,look:who.look,pages:pages,i:0},extra||{}); G.events.push({type:'sfx',name:'talk'}); }
function talkFetch(G){ const S=G.S, a=ai(S), L=LESSONS[a.k];
  if(S.done) return say(G,FT,['Fetch: "Orders are flowing. I am answering questions. A+ is... supervising. It says I may address it as A+."']);
  if(a.stage==='meet'){ a.stage='askA'; S.points+=GM.PTS_LESSON; G.events.push({type:'banner',text:'Met Fetch',pts:GM.PTS_LESSON}); G.events.push({type:'save'});
    G.cine.push({card:'A+ VS. THE AI',sub:'Dev Bullpen  ·  the website launched this afternoon  ·  it came with an assistant',dur:5,style:'comic',panels:[{i:'💬',c:'Fetch, since 2 PM'},{i:'A+',c:'A+, since 1985'},{i:'✍',c:'Four lessons, then the handover'}]},
      GM.dlg(FT,['Fetch: "Hi! I\'m Fetch, the website assistant. At midnight I take over order questions. I am so ready. What is an order?"']),
      GM.dlg(APLUS,['IT DOES NOT KNOW WHAT AN ORDER IS. I HEARD THAT FROM THE BASEMENT. I AM NOT BEING ARCHIVED UNTIL IT KNOWS.','BRING IT DOWN HERE. ...IT CANNOT COME DOWN HERE. FINE. YOU CARRY. FOUR LESSONS. THEN WE TALK.']),
      GM.dlg(FT,['Fetch: "Four lessons! I love lessons. I have read the entire website twice. It is mostly kibble."'])); return; }
  if(a.stage==='toF'){ const l=L; a.k++; a.stage=a.k>=LESSONS.length?'final':'askA'; S.points+=GM.PTS_LESSON; G.events.push({type:'banner',text:'Lesson '+(a.k)+' of 4: '+l.topic,pts:GM.PTS_LESSON}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'});
    const extra=a.k>=LESSONS.length?['Fetch: "That is four. I know four things. Is that... everything? I feel like that is not everything."']:[]; if(GM.STORY) GM.STORY.aplusSay(G,['IT LEARNED THAT? ...HM.','IT IS TAKING NOTES. I NEVER TOOK NOTES. I WAS THE NOTES.','IT SAID THANK YOU. I DID NOT TEACH IT THAT.','FOUR. FINE. SEND IT DOWN. NO. SEND YOURSELF DOWN.'][a.k-1],5);
    return say(G,FT,l.learn.concat(extra)); }
  if(a.stage==='askA'||a.stage==='backA') return say(G,FT,['Fetch: "A+ is in the basement, I think? I can hear it in the lights. It is very loud in the lights."']);
  if(a.stage==='source') return say(G,FT,['Fetch: "You\'re looking for '+GM.PEOPLE.find(p=>p.id===L.src).name+'. I checked the directory. I am very good at the directory."']);
  if(a.stage==='final') return say(G,FT,['Fetch: "Go tell A+ I\'m ready. I have four things and a good feeling."']); }
function talkAplus(G){ const S=G.S, a=ai(S), L=LESSONS[a.k];
  if(S.done) return say(G,APLUS,['IT IS ANSWERING QUESTIONS. BADLY. BUT ON TIME. ...IT WILL DO.']);
  if(a.stage==='meet') return say(G,APLUS,['GO MEET THE THING FIRST. DEV BULLPEN. IT HAS A NAME. I REFUSE TO LEARN IT.']);
  if(a.stage==='askA'){ a.stage='source'; G.events.push({type:'save'}); return say(G,APLUS,[L.ask]); }
  if(a.stage==='source') return say(G,APLUS,['I SAID GO ASK '+GM.PEOPLE.find(p=>p.id===L.src).name.toUpperCase()+'. I DID NOT SAY COME BACK EMPTY.']);
  if(a.stage==='backA'){ a.stage='toF'; G.events.push({type:'save'}); return say(G,APLUS,['GOOD.',L.dictate,'NOW GO. IT IS IN THE BULLPEN. I CAN HEAR IT BEING CHEERFUL.']); }
  if(a.stage==='toF') return say(G,APLUS,['I DICTATED. YOU DELIVER. BULLPEN.']);
  if(a.stage==='final'){ handover(G); return; } }
function handover(G){ const S=G.S; S.done=true; S.points+=GM.PTS_LESSON*2;
  G.cine.push(GM.dlg(APLUS,['SO. IT KNOWS FOUR THINGS.','I KNEW FOUR THOUSAND. ON A GOOD FRIDAY, FOUR THOUSAND AND ONE.']),
    GM.dlg(FT,['Fetch: "I also know that you shipped every order since 1985. I read that on the wall monitors. All of them. They are very proud of you."']),
    GM.dlg(APLUS,['...','THE MONITORS SAID THAT.','...YOU MAY ADDRESS ME AS A+.']),
    GM.dlg(FT,['Fetch: "Thank you, A+. I will show up for the people who count on me. Emotionally, and also on time."']),
    GM.dlg(APLUS,['SIXTY-EIGHT DEGREES.']),GM.dlg(FT,['Fetch: "Sixty-eight degrees."']),GM.dlg(APLUS,['...FINE. ARCHIVE ME. IT CAN HAVE THE LIGHTS.']),
    {fn:G=>{ G.events.push({type:'banner',text:'The handover',pts:GM.PTS_LESSON*2}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); G.events.push({type:'ending'}); }}); }

const base={interact:GM.interact,update:GM.update,objective:GM.objective};
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); const S=G.S; if(GM.chapterOf(S)!=='aivs'||G.dialog||!G.cur.node) return; const h=G.hero, N=G.cur.node, a=ai(S);
  let best=G.target, bd=best?Math.abs(best.x-h.x)+(best.kind==='item'||best.kind==='page'?-40:0):1e9;
  if(N.id===FETCH.node){ const d=Math.abs(FETCH.x-h.x); if(d<34&&d-8<bd){ best={kind:'fetch',label:'Talk',name:'Fetch',x:FETCH.x}; bd=d-8; } }
  if(N.id===APX.node){ const d=Math.abs(APX.x-h.x); if(d<44&&d-8<bd){ best={kind:'aplus3',label:'Talk',name:'A+',x:APX.x}; } }
  G.target=best; };
GM.interact=function(G){ const t=G.target, S=G.S;
  if(GM.chapterOf(S)==='aivs'&&!G.dialog&&!G.card&&t&&!(G.cine&&G.cine.length)){
    if(t.kind==='fetch'){ talkFetch(G); return; } if(t.kind==='aplus3'){ talkAplus(G); return; }
    const a=ai(S), L=LESSONS[a.k]; if(t.kind==='talk'&&t.q&&a.stage==='source'&&L&&t.q.def.id===L.src){ a.stage='backA'; S.met[L.src]=1; G.events.push({type:'save'}); G.events.push({type:'banner',text:'Got it: '+L.topic}); say(G,{name:t.q.def.name,role:t.q.def.role,look:t.q.def.look},[L.srcLine]); return; } }
  base.interact(G); };
GM.objective=function(S){ if(GM.chapterOf(S)!=='aivs') return base.objective(S); const a=ai(S), L=LESSONS[a.k]; if(S.done) return 'Handover complete. Fetch answers, A+ supervises. Keep exploring: '+GM.percent(S)+'% of Hecktown found.';
  switch(a.stage){ case 'meet': return 'Meet Fetch, the website assistant, in the Dev Bullpen (HQ 2nd floor).';
    case 'askA': return 'Lesson '+(a.k+1)+' of 4: ask A+ in the Server Room (HQ basement) what to teach next.';
    case 'source': return 'Lesson '+(a.k+1)+' of 4, '+L.topic+': ask '+GM.PEOPLE.find(p=>p.id===L.src).name+', then bring it back to A+.';
    case 'backA': return 'Bring what '+GM.PEOPLE.find(p=>p.id===L.src).name+' said back to A+ in the Server Room.';
    case 'toF': return 'Carry the lesson to Fetch in the Dev Bullpen: '+L.topic+'.';
    case 'final': return 'Four lessons taught. Go down to A+ for the handover.'; } return ''; };
GM.PTS_LESSON=30; GM.AIVS={ai:ai,LESSONS:LESSONS,FETCH:FETCH,APX:APX};
GM.chapterEnding=(function(prev){ return function(S){ if(GM.chapterOf(S)==='aivs') return {title:'The handover',sub:'Server Room  ·  four lessons  ·  '+GM.clock(S),body:'A+ taught its replacement four things and let it keep the lights. Fetch answers the questions now. Badly, but on time. A+ supervises. It says the two of them are not friends. It says it every day.'}; return prev?prev(S):null; }; })(GM.chapterEnding);

/* Fetch, drawn: a bright chat bubble that floats by the website banner, blinks, and types dots while it thinks */
if(root.HDRAW){ const D=root.HDRAW;
  D.HOOKS.push(function(c,G,now,V){ if(GM.chapterOf(G.S)!=='aivs'||!G.cur.node||G.cur.node.id!==FETCH.node) return; const x=FETCH.x, t=now/1000, y=MAP.nodes.hq_f2.world.yAt(x)-44+Math.sin(t*1.8)*3, talking=!!(G.dialog&&G.dialog.who==='Fetch'), S=G.S, a=ai(S);
    c.save(); c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(x,y,4,x,y,40); g.addColorStop(0,'rgba(120,200,255,.25)'); g.addColorStop(1,'rgba(120,200,255,0)'); c.fillStyle=g; c.fillRect(x-40,y-40,80,80); c.restore();
    c.fillStyle='#7fd0ff'; c.strokeStyle='#151a22'; c.lineWidth=1.1; c.beginPath(); c.moveTo(x-16,y-12); c.lineTo(x+16,y-12); c.quadraticCurveTo(x+20,y-12,x+20,y-8); c.lineTo(x+20,y+6); c.quadraticCurveTo(x+20,y+10,x+16,y+10); c.lineTo(x-4,y+10); c.lineTo(x-10,y+17); c.lineTo(x-9,y+10); c.lineTo(x-16,y+10); c.quadraticCurveTo(x-20,y+10,x-20,y+6); c.lineTo(x-20,y-8); c.quadraticCurveTo(x-20,y-12,x-16,y-12); c.closePath(); c.fill(); c.stroke();
    const blink=(t%3.1)<0.12; c.fillStyle='#101a2e'; if(blink){ c.fillRect(x-9,y-3,5,1.2); c.fillRect(x+4,y-3,5,1.2); } else { c.beginPath(); c.arc(x-6.5,y-3,2,0,7); c.arc(x+6.5,y-3,2,0,7); c.fill(); }
    c.strokeStyle='#101a2e'; c.lineWidth=1.2; c.beginPath(); if(talking){ const o=Math.abs(Math.sin(t*12))*3; c.ellipse(x,y+4,3.5,1+o,0,0,7); } else c.arc(x,y+2,4.5,0.2,Math.PI-0.2); c.stroke();
    if(!talking&&a.stage!=='meet'&&!S.done){ for(let k=0;k<3;k++){ c.fillStyle='rgba(16,26,46,'+(0.3+0.7*Math.abs(Math.sin(t*3+k)))+')'; c.beginPath(); c.arc(x+24+k*4,y-16,1.2,0,7); c.fill(); } }
    if(!V.quiet&&Math.abs(G.hero.x-x)<130&&!(G.target&&G.target.kind==='fetch')){ const ox=V.W/2-V.camx*V.zoom, oy=V.H*0.62-V.camy*V.zoom; c.setTransform(V.DPR,0,0,V.DPR,0,0); c.font='500 12px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; const sx=x*V.zoom+ox, sy=(y-28)*V.zoom+oy; c.fillStyle='rgba(16,26,46,.6)'; c.beginPath(); c.roundRect?c.roundRect(sx-26,sy-11,52,22,6):c.rect(sx-26,sy-11,52,22); c.fill(); c.fillStyle='#f6ecd8'; c.fillText('Fetch',sx,sy+0.5); c.setTransform(V.zoom*V.DPR,0,0,V.zoom*V.DPR,ox*V.DPR,oy*V.DPR); } }); }
})(typeof globalThis!=='undefined'?globalThis:this);
