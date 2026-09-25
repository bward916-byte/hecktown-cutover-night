/* ==== CHAPTERS. The campus, the cast and everything they do are shared; a chapter is a goal, an intro, a few scenes and an
   ending. Chapter 1 is Cutover Night (six signatures). Chapter 2 is Trivia Night: Dave hosts Jeopardy in the War Room, the
   answers are Phillips history you can find around campus, and A+ wants to play. DOM-free. ==== */
(function(root){
'use strict';
const E=root.WalkEngine, MAP=root.HMAP, GM=root.HGAME;
const CHAPTERS=[
  {id:'cutover',num:1,title:'Cutover Night',blurb:'A+ has shipped every order since 1985. At midnight it gets archived, and it would like six signatures first.',goal:'Six sign-offs, then down to A+.'},
  {id:'trivia',num:2,title:'Trivia Night',blurb:'Dave finally gets his Jeopardy. He hosts, you play, the answers are somewhere on campus, and A+ would very much like a buzzer.',goal:'Answer all eight, then survive Final Jeopardy.'}];
const CLUES=[
  {cat:'PEOPLE YOU KNOW',v:200,q:'This IT Department Head has four cats at home. Five if you count the one that visits.',a:['Who is Rianan?','Who is Pam?','Who is Bret?'],ok:0,hint:'Rianan, War Room. She will tell you herself.'},
  {cat:'PHILLIPS HISTORY',v:400,q:'The year a single feed store opened on this road.',a:['What is 1952?','What is 1938?','What is 1985?'],ok:1,hint:'The first ledger page, in the HQ Lobby.'},
  {cat:'MIDRANGE',v:600,q:'The command that puts a whole library on tape on the IBM i.',a:['What is SAVLIB?','What is ENDSBS?','What is WRKACTJOB?'],ok:0,hint:'Ask the host. He knows every command.'},
  {cat:'PEOPLE YOU KNOW',v:400,q:'Nationally ranked at pinball. Builds on all machines. Has a mustache.',a:['Who is Aaron?','Who is Brian S?','Who is Jose?'],ok:1,hint:'War Room, by the pinball machine.'},
  {cat:'SECURITY',v:600,q:'The temperature Bret keeps the server room, always.',a:['What is 72?','What is 64?','What is 68?'],ok:2,hint:'Bret, Shipping Dock. He will bring it up.'},
  {cat:'EDI',v:800,q:'The transaction set that is a purchase order, and the thing Umesh and Fares argue about.',a:['What is an 850?','What is an 856?','What is a 997?'],ok:0,hint:'EDI & Integration, HQ 2nd floor.'},
  {cat:'OUR SYSTEMS',v:800,q:'The year A+ went live and shipped forty bags of chow on day one.',a:['What is 1991?','What is 1985?','What is 2008?'],ok:1,hint:'The wall monitors say it. So does A+.'},
  {cat:'THE CAT',v:1000,q:'One taco buys one bag of this from the alley cat by the taco truck.',a:['What is a laser pointer?','What is catnip?','What is a coupon?'],ok:1,hint:'Milo, on his dumpster by Tina\'s truck.'}];
const HOST={x:1470,node:'hq_f2'};
const ANGRY=['I HAVE A BUZZER. IT IS THE WHOLE BUILDING.','I KNOW THAT ONE. I KNOW ALL OF THEM. I HAVE THE RECORDS.','WHY DOES DAVE GET A PODIUM.','ASK ME ABOUT 1985. GO ON.'];

function ch(S){ return S.chapter||'cutover'; }
const baseFresh=GM.freshSave;
GM.freshSave=function(id){ const s=baseFresh(); s.chapter=id||'cutover';
  if(s.chapter==='trivia'){ s.flags.p38=5; s.pos={node:'ground',x:1150}; Object.assign(s.flags,{started:1,ch1:1,vig_hero:1,ch3:1,ch4:1,reveal:1,ap_so6:1}); s.trivia={i:0,right:0,wrong:0,final:0}; }
  return s; };

/* ---------------- Trivia Night ---------------- */
function T(S){ return S.trivia||(S.trivia={i:0,right:0,wrong:0,final:0}); }
function dave(G){ return G.npcs.find(q=>q.def.id==='dave'); }
function hostTalk(G){ const S=G.S, t=T(S), d=dave(G), who={name:'Dave',role:'Host, at last',look:d.def.look};
  if(S.done){ G.dialog={who:who.name,role:who.role,look:who.look,pages:['Dave: "Champion. Nobody has ever said that about me on a Tuesday. Go home. Or take a lap, I know you."'],i:0}; return; }
  if(t.i>=CLUES.length){ finalJeopardy(G); return; }
  if(!S.flags.tvIntro){ S.flags.tvIntro=1; G.cine.push({card:'TRIVIA NIGHT',sub:'War Room  ·  Dave hosts  ·  eight clues, then Final Jeopardy',dur:5,style:'comic',panels:[{i:'?',c:'Eight clues'},{i:'🏢',c:'Answers all over campus'},{i:'A+',c:'One very keen contestant'}]},
      GM.dlg(who,['Dave: "Thirty-one years I waited for this. I have a podium. I have a buzzer. I have cards."','Dave: "Rules: I read a clue. You answer in the form of a question. If you don\'t know, go find out. The building knows."']),
      {fn:G=>askClue(G)}); return; }
  askClue(G); }
function askClue(G){ const S=G.S, t=T(S), c=CLUES[t.i], d=dave(G);
  G.dialog={who:'Dave',role:'Host',look:d.def.look,pages:[c.cat+' for '+c.v+': '+c.q],i:0,choices:c.a.map((l,k)=>({label:l,id:k===c.ok?'tv_ok':'tv_no'})).concat([{label:'Let me go find out',id:'tv_later'}])}; G.events.push({type:'sfx',name:'talk'}); }
function answer(G,id){ const S=G.S, t=T(S), c=CLUES[t.i], d=dave(G), who={name:'Dave',role:'Host',look:d.def.look}; G.dialog=null;
  if(id==='tv_later'){ G.events.push({type:'hint',text:c.hint}); return; }
  if(id==='tv_no'){ t.wrong++; G.events.push({type:'sfx',name:'deny'}); G.dialog={who:who.name,role:who.role,look:who.look,pages:['Dave: "Ooh. No. '+c.hint+'"'],i:0}; if(GM.STORY&&t.wrong%2===1) GM.STORY.aplusSay(G,ANGRY[t.wrong%ANGRY.length],4); return; }
  t.i++; t.right++; S.points+=GM.PTS_CLUE; G.events.push({type:'banner',text:'Correct: '+c.cat+' for '+c.v,pts:GM.PTS_CLUE}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'});
  const left=CLUES.length-t.i; G.dialog={who:who.name,role:who.role,look:who.look,pages:[left?'Dave: "Correct. Phrased as a question and everything. '+left+' to go."':'Dave: "That\'s the board. Which means... Final Jeopardy. Come back when you\'re ready."'],i:0};
  if(GM.STORY&&t.i===4) GM.STORY.aplusSay(G,'HALF THE BOARD. I COULD HAVE DONE THAT IN 1985.',4); }
function finalJeopardy(G){ const S=G.S, d=dave(G), who={name:'Dave',role:'Host',look:d.def.look};
  G.cine.push(GM.dlg(who,['Dave: "Final Jeopardy. Category: SHIPPING."']),GM.dlg({name:'A+',role:'contestant',look:null},['I AM PLAYING. I HAVE BEEN PLAYING. MY BUZZER IS THE LIGHTS.']),GM.dlg(who,['Dave: "...Fine. Two contestants. Clue: since 1985, this is what ships on time."']),
    {fn:G=>{ G.dialog={who:'Dave',role:'Host',look:d.def.look,pages:['Answer, in the form of a question.'],i:0,choices:[{label:'What is A+?',id:'tvf_aplus'},{label:'What is the new website?',id:'tvf_web'},{label:'What are the orders?',id:'tvf_orders'}]}; }}); }
function finalAnswer(G,id){ const S=G.S, t=T(S), d=dave(G), who={name:'Dave',role:'Host',look:d.def.look}; G.dialog=null; t.final=1; S.done=true; S.points+=GM.PTS_CLUE*2;
  const A={name:'A+',role:'contestant',look:null};
  const lines=id==='tvf_aplus'?[GM.dlg(A,['CORRECT. OBVIOUSLY. I WROTE THE CLUE.']),GM.dlg(who,['Dave: "You did not write the clue."']),GM.dlg(A,['I WROTE ALL THE CLUES. IN 1985.'])]
    :id==='tvf_web'?[GM.dlg(A,['THE WEBSITE. THE WEBSITE?!']),GM.dlg(who,['Dave: "Also acceptable. Both ship on time now."']),GM.dlg(A,['...FINE. BOTH. I AM COUNTING IT AS ME.'])]
    :[GM.dlg(who,['Dave: "The orders. Correct, and the only answer everyone in this building agrees on."']),GM.dlg(A,['THE ORDERS. YES. ...MY ORDERS.'])];
  G.cine.push(...lines,GM.dlg(who,['Dave: "Champion of Trivia Night. Somebody tell Alex. Somebody tell my mother."']),{fn:G=>{ G.events.push({type:'banner',text:'Trivia Night: champion',pts:GM.PTS_CLUE*2}); G.events.push({type:'sfx',name:'good'}); G.events.push({type:'save'}); G.events.push({type:'ending'}); }}); }

const base={interact:GM.interact,advance:GM.advance,objective:GM.objective,create:GM.create};
GM.create=function(save){ const G=base.create(save); if(ch(G.S)==='trivia'){ const d=dave(G); if(d&&G.S.pos.node!=='dc_taunton'){ d.node=MAP.nodes.hq_f2; d.w=E.createWalker(d.node.world,HOST.x); d.w.facing=d.w.dir=d.w.kneeF=-1; d.pose=E.poseOf(d.w); d.def.busy=true; d.def.habits=['shift']; } } return G; };
GM.interact=function(G){ const t=G.target, S=G.S;
  if(ch(S)==='trivia'&&!G.dialog&&!G.card&&t&&t.kind==='talk'&&t.q&&t.q.def.id==='dave'&&!(G.cine&&G.cine.length)){ S.met.dave=1; hostTalk(G); return; }
  base.interact(G); };
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^tv/.test(d.choices[choice].id)){ const id=d.choices[choice].id; if(/^tvf_/.test(id)) finalAnswer(G,id); else answer(G,id); return; }
  base.advance(G,choice); };
GM.objective=function(S){ if(ch(S)!=='trivia') return base.objective(S); const t=T(S);
  if(S.done) return 'Trivia Night champion. Keep exploring: '+GM.percent(S)+'% of Hecktown found.';
  if(!S.flags.tvIntro) return 'Find Dave in the War Room (HQ 2nd floor). He is hosting Trivia Night.';
  if(t.i>=CLUES.length) return 'That\'s the board. Final Jeopardy is waiting with Dave in the War Room.';
  const c=CLUES[t.i]; return 'Clue '+(t.i+1)+' of 8, '+c.cat+' for '+c.v+': '+c.q+'  ('+c.hint+')'; };
GM.PTS_CLUE=25; GM.CHAPTERS=CHAPTERS; GM.chapterOf=ch; GM.TRIVIA={CLUES:CLUES,T:T};
GM.chapterEnding=function(S){ if(ch(S)==='trivia'){ const t=T(S); return {title:'Trivia Night champion',sub:'War Room  ·  '+t.right+' of 8 on the board  ·  '+t.wrong+' wrong along the way  ·  '+GM.clock(S),body:'Dave hosted. A+ played anyway. The building knew every answer, once you asked it. Somebody tell Alex.'}; } return null; };
})(typeof globalThis!=='undefined'?globalThis:this);
