/* ==== UI: input, sound, saving, HUD, dialog, journal, title, and the main loop. The only module that touches the DOM. ==== */
(function(){
'use strict';
const E=WalkEngine, GM=HGAME, MAP=HMAP, DRAW=HDRAW, PP=HPEOPLE, CFG=E.CFG;
const $=id=>document.getElementById(id), clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const cv=$('c'), ctx=cv.getContext('2d');
const KEY='hecktown2.save.v1';
const V={W:0,H:0,DPR:1,zoom:2,camx:1150,camy:-34,touch:false};
const zoomStops=[310,420,235]; let zi=0;
let G=null, state='title', soundOn=true;

/* ---------------- saving ---------------- */
function loadSave(){ try{ const s=JSON.parse(localStorage.getItem(KEY)||'null'); return s&&s.v===1?s:null; }catch(_){ return null; } }
let saveBlip=0;
function save(){ if(!G||state==='title') return; try{ localStorage.setItem(KEY,JSON.stringify(G.S)); saveBlip=1.6; $('saved').classList.add('on'); }catch(_){ } }
function wipe(){ try{ localStorage.removeItem(KEY); }catch(_){ } }
addEventListener('pagehide',save); document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });

/* ---------------- input ---------------- */
const keys={}, queue=[]; let stick=null;
/* keys are rebindable (Options): each action has a list of codes, the first is the one you can change */
const DEF_KEYS={left:['ArrowLeft','KeyA'],right:['ArrowRight','KeyD'],up:['ArrowUp','KeyW'],down:['ArrowDown','KeyS'],use:['KeyE','Enter'],jump:['Space'],roll:['KeyX'],crawl:['KeyC'],throw:['KeyF'],read:['KeyR'],dance:['KeyG'],clap:['KeyV'],
  stroll:['ShiftLeft','ShiftRight'],journal:['KeyJ','Tab'],zoom:['KeyZ'],sound:['KeyM'],map:['KeyN'],photo:['KeyP']};
const KEYS_KEY='hecktown2.keys';
let KEYS=loadKeys();
function loadKeys(){ const k=JSON.parse(JSON.stringify(DEF_KEYS)); try{ const o=JSON.parse(localStorage.getItem(KEYS_KEY)||'{}'); for(const a in o) if(k[a]) bindKey(k,a,o[a]); }catch(_){ } return k; }
function bindKey(k,a,code){ for(const b in k) if(b!==a) k[b]=k[b].filter(c=>c!==code); k[a]=[code].concat(k[a].slice(1).filter(c=>c!==code)); }
function setKey(a,code){ bindKey(KEYS,a,code); try{ const o={}; for(const b in KEYS) if(KEYS[b][0]!==DEF_KEYS[b][0]) o[b]=KEYS[b][0]; localStorage.setItem(KEYS_KEY,JSON.stringify(o)); }catch(_){ } }
function resetKeys(){ KEYS=JSON.parse(JSON.stringify(DEF_KEYS)); try{ localStorage.removeItem(KEYS_KEY); }catch(_){ } }
const actionOf=code=>{ for(const a in KEYS) if(KEYS[a].indexOf(code)>=0) return a; return null; }, held=a=>KEYS[a].some(c=>keys[c]);
const ACTS={jump:1,roll:1,crawl:1,throw:1,read:1,dance:1,clap:1,use:1};
const EXT={keys:[],after:[],camera:null,ending:null,tick:[]};          // 06b-extras plugs in here
addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab')e.preventDefault(); wake();
  if(e.repeat) return;
  for(const h of EXT.keys) if(h(e,state)) return;
  if(state==='title'){ if(e.code==='Enter') (loadSave()?$('bContinue'):$('bNew')).click(); return; }
  const a=actionOf(e.code);
  if(a==='journal'){ toggleJournal(); return; }
  if(e.code==='Escape'){ if(G&&G.board){ G.board=null; return; } if(state==='journal') toggleJournal(); else if(state==='ending') closeEnding(); return; }
  if(a==='zoom'){ $('bZoom').click(); return; } if(a==='sound'){ $('bSnd').click(); return; }
  if(state!=='play') return;
  if(G.card&&(a==='jump'||a==='use')){ queue.push('use'); return; }
  if(G.dialog){ const dn=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code); if(dn>=0){ pick(dn); return; } if(a==='jump'||a==='use'){ queue.push('use'); } return; }
  if(ACTS[a]) queue.push(a); });
addEventListener('keyup',e=>{ keys[e.code]=false; });
addEventListener('blur',()=>{ for(const k in keys)keys[k]=false; stick=null; });
cv.addEventListener('pointerdown',e=>{ wake(); if(e.pointerType==='touch') setTouch(); if(state!=='play') return; if(G.dialog||G.card){ queue.push('use'); return; }
  if(!stick){ stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY}; try{cv.setPointerCapture(e.pointerId);}catch(_){} } });
cv.addEventListener('pointermove',e=>{ if(stick&&e.pointerId===stick.id){ stick.x=e.clientX; stick.y=e.clientY; } });
const endStick=e=>{ if(stick&&e.pointerId===stick.id) stick=null; }; cv.addEventListener('pointerup',endStick); cv.addEventListener('pointercancel',endStick);
function setTouch(){ if(!V.touch){ V.touch=true; document.body.classList.add('touch'); } }
if(matchMedia('(pointer:coarse)').matches) setTouch();
for(const b of document.querySelectorAll('#pad button[data-act]')) b.addEventListener('pointerdown',e=>{ e.preventDefault(); wake(); queue.push(b.dataset.act); });
const padMap={0:'use',1:'roll',2:'jump',3:'crawl',4:'read',5:'dance',6:'clap',7:'throw'}, padWas={};
function readInput(){
  let ix=0, iy=0;
  if(held('right')) ix+=1; if(held('left')) ix-=1; if(held('up')) iy-=1; if(held('down')) iy+=1;
  if(ix&&held('stroll')) ix*=0.45;
  if(stick){ const dx=stick.x-stick.ox, dy=stick.y-stick.oy; if(Math.abs(dx)>10) ix=clamp(dx/52,-1,1); if(Math.abs(dy)>26&&Math.abs(dy)>Math.abs(dx)*0.7){ iy=Math.sign(dy); if(Math.abs(dx)<Math.abs(dy)) ix=0; } }
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  for(const p of pads){ if(!p)continue; const ax=p.axes[0]||0, ay=p.axes[1]||0; if(Math.abs(ax)>0.25) ix=clamp(ax*1.1,-1,1); if(Math.abs(ay)>0.5) iy=Math.sign(ay);
    const B=k=>p.buttons[k]&&p.buttons[k].pressed; if(B(15)) ix=1; if(B(14)) ix=-1; if(B(12)) iy=-1; if(B(13)) iy=1;
    for(const k in padMap){ const on=!!B(k), id=p.index+':'+k; if(on&&!padWas[id]) queue.push(padMap[k]); padWas[id]=on; }
    const j=!!B(9), jid=p.index+':9'; if(j&&!padWas[jid]) toggleJournal(); padWas[jid]=j; }
  return [ix,iy];
}

/* ---------------- sound ---------------- */
let AC=null, noise=null, master=null, music=null;
function wake(){ if(AC){ if(AC.state==='suspended') AC.resume(); return; } try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=soundOn?1:0; master.connect(AC.destination);
  noise=AC.createBuffer(1,AC.sampleRate*0.2,AC.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; startMusic(); }catch(_){ AC=null; } }
function burst(freq,q,vol,dur,sweep){ if(!AC)return; const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime;
  s.buffer=noise; f.type='bandpass'; f.frequency.setValueAtTime(freq*(0.9+Math.random()*0.2),t); if(sweep) f.frequency.exponentialRampToValueAtTime(sweep,t+dur); f.Q.value=q;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+Math.min(dur+0.05,0.19)); }
function tone(freq,dur,vol,type,to,delay){ if(!AC)return; const o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime+(delay||0); o.type=type||'sine'; o.frequency.setValueAtTime(freq,t); if(to) o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05); }
function footfall(ev,hard){
  switch(ev.type){
    case 'step':  burst(hard||ev.stone?950:520,hard||ev.stone?1.4:0.8,(0.04+0.09*clamp(ev.speed/CFG.walkSpeed,0,1))*(ev.prof==='down'?1.25:1),hard||ev.stone?0.07:0.11); break;
    case 'land':  burst(360,0.8,0.12+0.14*clamp(ev.speed/200,0,1),0.14); break;
    case 'jump':  burst(500,0.7,0.06,0.12,1400); break;   case 'roll': burst(300,0.6,0.10,0.16,700); break;
    case 'throw': burst(900,0.9,0.07,0.13,3200); break;   case 'thud': burst(1500,2.2,0.04+0.08*clamp(ev.speed/250,0,1),0.05); break;
    case 'clap':  burst(2100,1.1,0.20,0.06); break;       case 'pat':  burst(380,0.7,0.035,0.08); break;
  } }
const SFX={ talk:()=>tone(520+Math.random()*120,0.07,0.05,'triangle'), pick:()=>{ tone(660,0.09,0.07,'triangle'); tone(990,0.14,0.07,'triangle',null,0.08); },
  good:()=>[523,659,784,1047].forEach((f,i)=>tone(f,0.22,0.07,'triangle',null,i*0.09)), door:()=>{ burst(240,0.7,0.16,0.18,90); tone(180,0.2,0.05,'square',90); },
  deny:()=>{ tone(196,0.12,0.06,'square'); tone(155,0.2,0.06,'square',null,0.13); }, bark:()=>{ tone(420,0.09,0.10,'sawtooth',250); tone(460,0.1,0.10,'sawtooth',260,0.16); },
  point:()=>tone(880,0.12,0.04,'sine',1320), purr:()=>{ for(let i=0;i<6;i++) burst(120,0.5,0.05,0.09,90); tone(60,0.5,0.03,'sine'); }, honk:()=>{ tone(330,0.28,0.06,'sawtooth'); tone(415,0.28,0.05,'sawtooth'); }, beep:()=>{ tone(1180,0.09,0.04,'square'); }, meow:()=>{ tone(700,0.22,0.05,'triangle',950); tone(980,0.25,0.04,'triangle',620,0.12); } };
/* Voices: a pitched blip per character as their words type out. */
const VOICE={Rianan:520,Aaron:300,Bret:340,'Brian S':280,'Brian W':320,Umesh:380,Dave:250,John:270,Greg:240,Ryan:360,Jose:330,Ash:540,Andrew:350,Blaine:260,'The Founder':220,Pam:500,Melissa:480,Cathy:510,Milo:600,Rosa:460,'Mrs. Miller':470,Kim:490,Ashley:500,Nick:290,Tina:470,Frank:230,Lou:250,'A+':150,Terminal:170};
function voiceOf(name){ if(VOICE[name]) return VOICE[name]; let h=7; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0; return 260+h%240; }
function blip(name,kid){ const f=voiceOf(name)*(kid?1.35:1)*(0.92+Math.random()*0.16), mech=name==='A+'||name==='Terminal'; tone(f,0.05,mech?0.03:0.035,mech?'square':'triangle',f*(0.94+Math.random()*0.1)); }
/* A quiet night-shift bed: two drifting drones and the occasional plucked note, re-rooted by where you are. */
let rainG=null;
function tickRain(){ if(!G) return; if(!rainG){ const s=AC.createBufferSource(), b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; s.buffer=b; s.loop=true; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1400; f.Q.value=0.4; rainG=AC.createGain(); rainG.gain.value=0; s.connect(f); f.connect(rainG); rainG.connect(master); s.start(); }
  const N=G.cur.node, id=N?N.id:'', indoor=N&&(['hq_f2','hq_b1','tun_2','tun_3','wh_mezz','wh_cat','gar_loft'].indexOf(id)>=0||(id==='ground'&&((G.hero.x>1100&&G.hero.x<1900)||(G.hero.x>2200&&G.hero.x<3160)))), era=G.p38&&G.p38.scene==='yard'&&(G.S.flags.p38|0)>=2&&(G.S.flags.p38|0)<4;
  const want=state==='play'?(era?0.07:(G.p38?0:((G.wx&&G.wx.rain)||0)*(indoor?0.025:0.08))):0; rainG.gain.setTargetAtTime(want,AC.currentTime,0.6); }
function startMusic(){ const g=AC.createGain(); g.gain.value=0.0; g.connect(master); const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=700; f.connect(g);
  const o1=AC.createOscillator(), o2=AC.createOscillator(); o1.type='sawtooth'; o2.type='triangle'; o1.connect(f); o2.connect(f); o1.start(); o2.start(); music={g:g,o1:o1,o2:o2,root:0,next:0}; }
function tickMusic(){ if(!music||!G) return; const t=AC.currentTime, n=G.cur.node?G.cur.node.id:(G.cur.link.id.indexOf('tun')===0?'tun_2':'hq'); 
  const root=n.indexOf('tun')===0||(G.room&&G.room.dark)?55:(n.indexOf('wh')===0||(n==='ground'&&G.hero.x>2166&&G.hero.x<3200)?65.4:(n==='ground'&&(G.hero.x<1100||G.hero.x>1900)?73.4:87.3));
  if(root!==music.root){ music.root=root; music.o1.frequency.setTargetAtTime(root,t,1.5); music.o2.frequency.setTargetAtTime(root*1.498,t,1.5); }
  music.g.gain.setTargetAtTime(state==='play'||state==='title'?0.035:0.015,t,0.8);
  if(t>music.next){ music.next=t+2.5+Math.random()*5; const sc=[1,1.125,1.25,1.5,1.667,2], f=root*4*sc[Math.floor(Math.random()*sc.length)]; tone(f,1.6,0.028,'sine'); if(Math.random()<0.4) tone(f*1.5,1.8,0.018,'sine',null,0.35); } }

/* ---------------- HUD, toasts, dialog ---------------- */
function toast(text,pts,hint){ const d=document.createElement('div'); d.className='toast'+(hint?' hint':''); if(pts){ const b=document.createElement('b'); b.textContent='+'+pts; d.appendChild(b); } d.appendChild(document.createTextNode(text));
  const box=$('toasts'); box.appendChild(d); while(box.children.length>4) box.removeChild(box.firstChild); setTimeout(()=>{ if(d.parentNode) d.parentNode.removeChild(d); },hint?2600:3400); }
let hudT=0, shownDialog=null, shownPage=-1, typing=null;
function typeTick(dt){ if(!typing||!G.dialog) return; const T=typing, L=T.text.length; if(T.n>=L) return; T.n=Math.min(L,T.n+dt*60); const k=Math.floor(T.n);
  if(k-T.last>=3){ T.last=k; if(/\S/.test(T.text[k-1]||'')) blip(T.who,T.kid); } $('dtext').textContent=T.text.slice(0,k); }
function typingDone(){ return !typing||!G.dialog||typing.n>=typing.text.length; }
/* the big touch button says what it will do */
const VERB={'Step through':'Enter','Take the shuttle':'Ride'};
function useVerb(){ if(G.card) return 'Next'; if(G.dialog) return 'Next'; if(G.drive) return 'Honk'; if(G.board) return 'Drive';
  const t=G.target; if(t) return VERB[t.label]||t.label.split(' ')[0]; if(G.S.inv.catnip) return 'Throw'; return null; }
function hud(){
  const vb=useVerb(), ub=$('bUse'); ub.textContent=vb||'Use'; ub.classList.toggle('idle',!vb);
  const S=G.S; $('hClock').textContent=GM.clock(S); $('hPlace').textContent=G.room?G.room.name:(G.cur.link||(G.cur.node&&G.cur.node.mid)?'On the stairs':G.cur.node.label);
  $('hGoal').textContent=GM.objective(S); $('hPts').textContent=S.points+' / '+GM.MAXPTS; $('hRank').textContent=GM.percent(S)+'%  ·  '+GM.rank(S); $('hBar').style.width=GM.percent(S)+'%';
  const h=G.hero; for(const b of document.querySelectorAll('#pad button[aria-pressed]')){ const a=b.dataset.act; b.setAttribute('aria-pressed',a==='crawl'?h.mode==='crawl':(a==='read'?h.reading:h.dancing)); }
}
function dialogUI(){
  const d=G.dialog, box=$('dialog');
  document.body.classList.toggle('talking',!!d);
  if(!d){ if(shownDialog){ box.classList.add('hide'); shownDialog=null; } return; }
  if(shownDialog===d&&shownPage===d.i) return; shownDialog=d; shownPage=d.i; box.classList.remove('hide');
  const term=d.who==='A+'||d.who==='Terminal'; box.classList.toggle('term',term);
  $('dwho').innerHTML=''; $('dwho').appendChild(document.createTextNode(d.who)); const r=document.createElement('span'); r.textContent=d.role; $('dwho').appendChild(r);
  const pg=d.pages[d.i], m=/^([A-Z][A-Za-z.+ ]{1,18}):\s/.exec(pg); typing={text:pg,n:0,who:m?m[1]:d.who,kid:d.role==='a boy',last:0}; $('dtext').textContent='';
  const fc=$('dface').getContext('2d'); fc.setTransform(1,0,0,1,0,0); fc.clearRect(0,0,112,112);
  if(d.look) PP.portrait(fc,d.look,112); else if(d.who==='A+'&&DRAW.aplusFace&&GM.STORY) DRAW.aplusFace(fc,0,0,112,112,GM.STORY.aplusMood(d.pages[d.i]),1,false,0); else { fc.fillStyle=term?'#0a1a0e':'#2c3340'; fc.fillRect(0,0,112,112); fc.fillStyle=term?'#6fe08a':'#f2b544'; fc.font='700 44px "IBM Plex Mono",monospace'; fc.textAlign='center'; fc.textBaseline='middle'; fc.fillText(d.who==='A+'?'A+':(d.who==='Biscuit'?'🐾':(d.who==='Milo'?'🐈':(d.who==='The office dog'?'💤':(d.who==='The Ledger'?'§':'>_')))),56,58); }
  const last=d.i>=d.pages.length-1, ch=$('dchoices'); ch.innerHTML='';
  if(last&&d.choices) d.choices.forEach((c,i)=>{ const b=document.createElement('button'); b.textContent=(V.touch?'':(i+1)+'  ')+c.label; b.addEventListener('click',e=>{ e.stopPropagation(); pick(i); }); ch.appendChild(b); });
  $('dmore').textContent=last&&d.choices?'':(V.touch?'Tap to continue':'E or Space to continue')+(d.pages.length>1?'   '+(d.i+1)+' / '+d.pages.length:'');
}
function pick(i){ if(G.dialog&&G.dialog.choices&&G.dialog.i>=G.dialog.pages.length-1){ GM.advance(G,i); } }
$('dialog').addEventListener('click',()=>{ wake(); if(G&&G.dialog) queue.push('use'); });

/* ---------------- journal and ending ---------------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function statsHTML(S){ const st=(n,l)=>'<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>', m=Math.floor(S.time/60);
  return '<div class="stats">'+st(S.points+' / '+GM.MAXPTS,'points, '+GM.percent(S)+'%')+st(GM.count(S.signoffs)+' / 6','sign-offs')+st(GM.count(S.rooms)+' / '+MAP.rooms.length,'places found')+st(GM.count(S.met)+' / '+GM.PEOPLE.length,'people met')+st(GM.count(S.pages)+' / '+GM.PAGES.length,'ledger pages')+st((m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'m','on the clock')+'</div>'; }
function journalHTML(){
  const S=G.S; let h='<button class="btn ghost close" id="jClose">Close</button><h1>Journal</h1><div class="sub">'+esc(GM.HERO.name+', '+GM.HERO.role)+'  ·  '+esc(GM.rank(S))+'  ·  '+esc(GM.clock(S))+'  ·  progress saves on its own</div>'+statsHTML(S);
  h+='<h3>Cutover checklist</h3>'; for(const t of GM.tasks(S)) h+='<div class="task '+t.status+'"><span class="mark">'+(t.status==='done'?'[x]':(t.status==='active'?'[>]':'[ ]'))+'</span><div>'+esc(t.title)+'<small>'+esc(t.note)+'</small></div></div>';
  h+='<h3>Places</h3><div class="places">'; const groups=[['Outside',r=>r.node==='ground'&&(r.x1<=1100||(r.x0>=1900&&r.x1<=2200)||r.x0>=3200)],['Phillips HQ',r=>r.node.indexOf('hq_')===0&&!r.dark||(r.node==='ground'&&r.x0>=1100&&r.x1<=1900)],['Lou\'s Garage',r=>r.node==='gar_loft'],['Easton DC',r=>r.node.indexOf('wh_')===0||(r.node==='ground'&&r.x0>=2200&&r.x1<=3160)],['Underneath',r=>!!r.dark]];
  for(const g of groups){ const rs=MAP.rooms.filter(g[1]); if(!rs.length) continue; h+='<div><b>'+esc(g[0])+'  '+rs.filter(r=>S.rooms[r.id]).length+'/'+rs.length+'</b>'+rs.map(r=>S.rooms[r.id]?'<div>'+esc(r.name)+'</div>':'<div class="un">? ? ?</div>').join('')+'</div>'; } h+='</div>';
  if(S.flags.network){ h+='<h3>The network</h3><div class="places"><div>'+GM.NET.DCS.map(d=>(S.flags['dc_'+d.id]?'<div>':'<div class="un">')+esc(d.name)+(S.flags['dc_'+d.id]?'  ✓':'  · needs '+esc(GM.PEOPLE.find(p=>p.id===d.needs[0]).name))+'</div>').join('')+'</div></div>'; const cr=(S.crew||[]).map(id=>GM.PEOPLE.find(p=>p.id===id).name); h+='<div class="sub" style="margin-top:8px">Crew: '+(cr.length?esc(cr.join(', ')):'just you')+'. Talk to a teammate to bring them along; the truck is in The Yard.</div>'; }
  h+='<h3>The ledger</h3>'; let any=false; GM.PAGES.forEach((p,i)=>{ if(S.pages[i]){ any=true; h+='<div class="page">'+esc(p[2])+'</div>'; } }); if(!any) h+='<div class="sub">No pages yet. They turn up in corners, lofts and places you have to crawl into.</div>';
  h+='<h3>Controls</h3><div class="keys">'+keysHTML()+'</div>'; return h;
}
function keysHTML(){ return V.touch?'Drag a thumb on the left to walk. Push up or down on a stair landing to take the stairs. Use talks, takes and opens. More holds roll, throw, read, dance and clap.'
  :'<kbd>←</kbd> <kbd>→</kbd> walk (<kbd>Shift</kbd> stroll)  ·  <kbd>↑</kbd> <kbd>↓</kbd> take the stairs from a landing  ·  <kbd>E</kbd> talk, take, open  ·  <kbd>Space</kbd> jump  ·  <kbd>C</kbd> crawl  ·  <kbd>X</kbd> roll  ·  <kbd>F</kbd> throw  ·  <kbd>R</kbd> read  ·  <kbd>G</kbd> dance  ·  <kbd>V</kbd> clap  ·  <kbd>J</kbd> journal  ·  <kbd>Z</kbd> zoom  ·  <kbd>M</kbd> sound. Controllers work too.'; }
function toggleJournal(){ if(state==='play'){ state='journal'; $('jBody').innerHTML=journalHTML(); $('journal').classList.remove('hide'); $('journal').scrollTop=0; $('jClose').onclick=toggleJournal; save(); }
  else if(state==='journal'){ state='play'; $('journal').classList.add('hide'); } }
function showEnding(){ state='ending'; const S=G.S;
  $('eBody').innerHTML='<h1>Good night, A+</h1><div class="sub">ENDSBS *ALL  ·  completed normally  ·  '+esc(GM.clock(S))+'</div><p style="font-size:16px;line-height:1.6;max-width:56ch">Forty years of orders, archived with six signatures and nobody raising their voice. Upstairs the new system takes its first order without ceremony. The trucks roll at dawn.</p>'+statsHTML(S)+
   '<p class="sub" style="margin-top:16px">'+(GM.percent(S)>=100?'Every room, every page, every person. Hecktown Legend.':'There is more campus out there: '+(MAP.rooms.length-GM.count(S.rooms))+' places, '+(GM.PAGES.length-GM.count(S.pages))+' ledger pages and '+(GM.PEOPLE.length-GM.count(S.met))+' people you have not found yet.')+'</p><div class="btns"><button class="btn" id="eGo">Keep exploring</button></div>';
  $('ending').classList.remove('hide'); $('eGo').onclick=closeEnding; SFX.good(); }
function closeEnding(){ state='play'; $('ending').classList.add('hide'); }

/* ---------------- title ---------------- */
function snapCam(){ V.camx=G.hero.x; V.camy=G.cur.world.yAt(G.hero.x)-34; }
function begin(saveData){ G=GM.create(saveData||undefined); state='play'; document.body.classList.add('play'); $('title').classList.add('hide'); $('hud').classList.remove('hide'); $('tools').classList.remove('hide');
  V.camx=G.hero.x; V.camy=G.cur.world.yAt(G.hero.x)-34; hud(); save(); }
function refreshTitle(){ const s=loadSave(); $('bContinue').classList.toggle('hide',!s); $('bNew').classList.toggle('ghost',!!s);
  $('resume').textContent=s?('Saved game: '+GM.percent(s)+'%, '+GM.rank(s)+', '+GM.clock(s)+' on cutover night.'):''; $('keysHelp').innerHTML=keysHTML(); }
$('bContinue').onclick=()=>{ wake(); begin(loadSave()); };
let armNew=false; $('bNew').onclick=()=>{ wake(); if(loadSave()&&!armNew){ armNew=true; $('bNew').textContent='Erase the save and start over?'; return; } wipe(); begin(null); };
$('score').onclick=toggleJournal; $('bJournal').onclick=toggleJournal;
$('bZoom').onclick=()=>{ zi=(zi+1)%zoomStops.length; };
$('bSnd').onclick=function(){ soundOn=!soundOn; this.textContent=soundOn?'Sound on':'Sound off'; wake(); if(master) master.gain.value=soundOn?1:0; };

/* ---------------- main loop ---------------- */
function resize(){ V.DPR=Math.min(window.devicePixelRatio||1,2); V.W=innerWidth; V.H=innerHeight; cv.width=Math.round(V.W*V.DPR); cv.height=Math.round(V.H*V.DPR); }
addEventListener('resize',resize); resize();
const STEP=1/120; let last=performance.now(), acc=0, autosave=0, zoomNow=0;
function frame(now){
  const dt=Math.min((now-last)/1000,0.1); last=now;
  if(state==='play'){
    const inp=readInput();
    while(queue.length){ const a=queue.shift(); if(a==='use'){ if(G.dialog&&!typingDone()){ typing.n=typing.text.length; $('dtext').textContent=typing.text; } else GM.interact(G); } else GM.command(G,a); }
    acc+=dt; while(acc>=STEP){ GM.update(G,inp[0],inp[1],STEP); acc-=STEP; }
    const hard=!(G.cur.node&&((G.cur.node.id==='ground'&&G.hero.x<548&&G.hero.x>60)||G.cur.node.era)); for(const ev of G.hero.events) footfall(ev,hard); G.hero.events.length=0;
    for(const ev of G.events){ if(ev.type==='banner'){ toast(ev.text,ev.pts); if(ev.pts) SFX.point(); } else if(ev.type==='hint') toast(ev.text,0,true); else if(ev.type==='sfx'){ if(SFX[ev.name]) SFX[ev.name](); } else if(ev.type==='save') save(); else if(ev.type==='ending'){ if(EXT.ending) EXT.ending(); else showEnding(); } else if(ev.type==='snap') snapCam(); else if(ev.type==='blip'&&AC) blip(ev.who); }
    G.events.length=0;
    autosave+=dt; if(autosave>20){ autosave=0; save(); }
    for(const f of EXT.tick) f(dt);
    typeTick(dt); hudT-=dt; if(hudT<=0){ hudT=0.15; hud(); } dialogUI(); document.body.classList.toggle('card',!!(G.card||G.board||G.drive));
  } else { readInput(); queue.length=0; acc=0; }
  if(saveBlip>0){ saveBlip-=dt; if(saveBlip<=0) $('saved').classList.remove('on'); }
  if(AC){ tickMusic(); tickRain(); }

  const h=G.hero, w=G.cur.world, target=Math.min(V.H/zoomStops[zi],V.W/250); zoomNow=zoomNow?zoomNow+(target-zoomNow)*(1-Math.exp(-6*dt)):target; V.zoom=zoomNow;
  if(EXT.camera&&EXT.camera(state,V,dt)){ }
  else if(state==='title'){ const ph=(now/1000)%28, past=ph<14; V.camx=past?-2600+Math.sin(now/7000)*140:1330+Math.sin(now/9000)*160; V.camy=past?-70:-110; V.titleFade=Math.max(0,1-Math.min(ph,Math.abs(ph-14),28-ph)/0.8); }
  else{ V.camx+=(h.x+h.facing*24+h.vx*0.25-V.camx)*(1-Math.exp(-3.2*dt)); const standY=w.yAt(h.x)-34; V.camy+=(standY+(Math.min(h.y,standY+3)-standY-3)*0.35-V.camy)*(1-Math.exp(-2.8*dt)); }
  V.quiet=state==='title'||state==='photo'||state==='ending-seq'; DRAW.render(ctx,V,G,now,dt);
  if(state==='title'&&V.titleFade>0){ ctx.setTransform(V.DPR,0,0,V.DPR,0,0); ctx.fillStyle='rgba(11,18,32,'+V.titleFade.toFixed(3)+')'; ctx.fillRect(0,0,V.W,V.H); }
  for(const f of EXT.after) f(ctx,V,G,state,dt,now);
  if(stick&&state==='play'){ ctx.setTransform(V.DPR,0,0,V.DPR,0,0); const kx=clamp(stick.x-stick.ox,-52,52), ky=clamp(stick.y-stick.oy,-52,52); ctx.lineWidth=2; ctx.strokeStyle='rgba(246,236,216,.5)'; ctx.beginPath(); ctx.arc(stick.ox,stick.oy,52,0,7); ctx.stroke();
    ctx.fillStyle='rgba(242,181,68,.85)'; ctx.beginPath(); ctx.arc(stick.ox+kx,stick.oy+ky,20,0,7); ctx.fill(); }
  requestAnimationFrame(frame);
}
G=GM.create(loadSave()||undefined); refreshTitle();
window.__hecktown={get G(){return G;},V:V,begin:begin,EXT:EXT,get state(){return state;},setState:s=>{ state=s; },showEnding:showEnding,closeEnding:closeEnding,toast:toast,SFX:SFX,hud:()=>hud(),save:save,
  keys:{get:()=>KEYS,DEF:DEF_KEYS,set:setKey,reset:resetKeys},wake:wake,loadSave:loadSave};     // for the browser tests and 06b-extras
requestAnimationFrame(frame);
})();
