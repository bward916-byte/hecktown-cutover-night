/* ==== LIFE: Milo the alley cat and his catnip, the strays it brings, Chuck the groundhog, the office dog. DOM-free. ====
   Milo sits on the dumpster beside Tina's truck. He trades catnip for a taco (Tina has tacos) and keeps a tab:
   the third bag is on the house. Throw catnip (F) and every cat nearby comes running. */
(function(root){
'use strict';
const GM=root.HGAME, MAP=root.HMAP;
const MILO={name:'Milo',role:'Alley Cat',x:664,node:'ground'};
const CHUCK={x:124,node:'ground'};
const DOG={x:1478,node:'ground',name:'The office dog'};
const CAT_COLS=['#8a8a8a','#2a2a2a','#e8e4dc','#c9823a','#6a5a4a'];
const LINES={
  hello:'Milo: "Psst. You want the good stuff? Organic. Locally grown. One taco a bag."',
  again:t=>'Milo: "You again. Tab\'s at '+t+(t===1?' bag':' bags')+'. Third one\'s on the house."',
  house:'Milo: "Two bags on the tab. House bag, on me. Don\'t tell the dog."',
  what:'Milo: "Meowijuana. Throw it and every cat in the county comes running. The machines upstairs can\'t help it either, but that\'s a different game."',
  broke:'Milo: "One taco. Tina\'s right there. I can smell it from here."',
  sold:'Milo: "Pleasure doing business. Throw it with F. Stand back."',
  pet:['Milo tolerates exactly one pat.','Milo: "That\'s free. Don\'t get used to it."']};

function life(G){ return G.life||(G.life={cats:[],chuckUp:0,chuckT:0,miloBlink:0}); }
function sayMilo(G,pages,choices){ G.dialog={who:'Milo',role:'Alley Cat',look:null,pages:pages,i:0,choices:choices}; G.events.push({type:'sfx',name:'talk'}); }
function talkMilo(G){
  const S=G.S, F=S.flags, tab=F.miloTab|0; F.miloAsked=1;
  const intro=tab>=2&&!F.miloHouse?LINES.house:(tab?LINES.again(tab):LINES.hello);
  sayMilo(G,[intro],[{label:tab>=2&&!F.miloHouse?'Take the house bag':'Catnip (one taco)',id:'milo_buy'},{label:'What is it?',id:'milo_what'},{label:'Pet him',id:'milo_pet'}]);
}
function miloChoice(G,id){
  const S=G.S, F=S.flags, I=S.inv; G.dialog=null;
  if(id==='milo_what'){ sayMilo(G,[LINES.what]); return; }
  if(id==='milo_pet'){ sayMilo(G,LINES.pet); G.events.push({type:'sfx',name:'purr'}); return; }
  const free=(F.miloTab|0)>=2&&!F.miloHouse;
  if(!free&&!I.taco){ sayMilo(G,[LINES.broke]); return; }
  if(free) F.miloHouse=1; else{ delete I.taco; F.miloTab=(F.miloTab|0)+1; }
  I.catnip=(I.catnip|0)+1; G.events.push({type:'sfx',name:'pick'}); G.events.push({type:'banner',text:'Meowijuana ×'+I.catnip+'  ·  F to throw'}); G.events.push({type:'save'});
  sayMilo(G,[LINES.sold]);
}
function throwNip(G){
  const S=G.S, h=G.hero, L=life(G), x=h.x+h.facing*80, N=G.cur.node;
  S.inv.catnip--; if(!S.inv.catnip) delete S.inv.catnip;
  for(let i=0;i<4;i++){ const side=i%2?1:-1; L.cats.push({node:N.id,x:x+side*(260+i*40),goal:x+side*(8+i*9),dir:-side,state:'in',t:0,col:CAT_COLS[(i+(S.time|0))%CAT_COLS.length],run:0}); }
  G.events.push({type:'banner',text:'Every cat in the county comes running.'}); G.events.push({type:'sfx',name:'meow'});
  if(N.id==='ground'&&Math.abs(G.biscuit.x-h.x)<400) G.events.push({type:'hint',text:'Biscuit is not amused.'});
  if(!S.eggs.catnip){ S.eggs.catnip=1; S.points+=GM.PTS_EGG; G.events.push({type:'banner',text:'Morale: catnip',pts:GM.PTS_EGG}); }
  G.events.push({type:'save'});
}
function tick(G,dt){
  const L=life(G), h=G.hero, N=G.cur.node;
  for(let i=L.cats.length-1;i>=0;i--){ const c=L.cats[i]; c.t+=dt;
    if(c.state==='in'){ const d=c.goal-c.x; c.dir=Math.sign(d)||c.dir; c.x+=Math.sign(d)*Math.min(Math.abs(d),150*dt); c.run+=dt; if(Math.abs(d)<1){ c.state='sit'; c.t=0; } }
    else if(c.state==='sit'){ if(c.t>6){ c.state='out'; c.dir=-c.dir; } }
    else{ c.x+=c.dir*170*dt; c.run+=dt; if(c.t>4) L.cats.splice(i,1); } }
  const near=N&&N.id==='ground'&&Math.abs(h.x-CHUCK.x)<120; L.chuckUp+=((near?0:1)-L.chuckUp)*(1-Math.exp(-(near?10:1.5)*dt)); L.chuckT+=dt;
  // extra things you can use, merged with whatever the game already found
  if(N&&N.id==='ground'&&!G.dialog){ let best=G.target, bd=best?Math.abs(best.x-h.x)+(best.kind==='item'||best.kind==='page'?-40:0):1e9;
    const take=(d,t)=>{ if(d<bd){bd=d;best=t;} };
    const dm=Math.abs(MILO.x-h.x); if(dm<34) take(dm,{kind:'milo',label:'Talk',name:'Milo',x:MILO.x});
    const dd=Math.abs(DOG.x-h.x); if(dd<26) take(dd+6,{kind:'odog',label:'Pet',name:'the office dog',x:DOG.x});
    G.target=best; }
}
const base={update:GM.update,interact:GM.interact,advance:GM.advance,command:GM.command};
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); tick(G,dt); };
GM.interact=function(G){
  const t=G.target; if(!G.dialog&&!G.card&&t&&!G.p38){ if(t.kind==='milo'){ talkMilo(G); return; }
    if(t.kind==='odog'){ G.dialog={who:'The office dog',role:'asleep',look:null,pages:['The office dog opens one eye, decides you are not dinner, and goes back to sleep.'],i:0}; G.events.push({type:'sfx',name:'purr'}); return; } }
  if(!G.dialog&&!G.card&&!G.target&&!G.p38&&!G.drive&&!G.board&&G.S.inv.catnip){ GM.command(G,'throw'); return; }
  base.interact(G);
};
GM.advance=function(G,choice){ const d=G.dialog;
  if(d&&d.choices&&d.i>=d.pages.length-1&&choice!=null&&d.choices[choice]&&/^milo_/.test(d.choices[choice].id)){ miloChoice(G,d.choices[choice].id); return; }
  base.advance(G,choice); };
GM.command=function(G,name){ if(name==='throw'&&G.S.inv.catnip&&!G.dialog&&!G.card&&G.hero.mode==='walk'&&G.cur.node){ const ok=base.command(G,name); if(ok) throwNip(G); return ok; } return base.command(G,name); };
GM.PTS_EGG=5; GM.LIFE={MILO:MILO,CHUCK:CHUCK,DOG:DOG,life:life};
})(typeof globalThis!=='undefined'?globalThis:this);
