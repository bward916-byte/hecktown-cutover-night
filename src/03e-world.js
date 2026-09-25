/* ==== WORLD: weather that arrives instead of switching, a forklift working the drop yard, and the portal to 1938
   that opens in the Legacy Archive once every ledger page is found. DOM-free. ==== */
(function(root){
'use strict';
const GM=root.HGAME;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v), ss=t=>{ t=clamp(t,0,1); return t*t*(3-2*t); };
const PORTAL_X=1350;                                      // west end of the archive, clear of Greg's pacing
const LIFT={x0:3236,x1:3440};

/* A seven-minute sky: clear, clouds build, rain, it clears, a little mist, clear again. Driven by play time so it survives a save. */
function weatherAt(time){ const p=time%420;
  const rain=p<150?0:(p<190?ss((p-150)/40):(p<300?1:(p<340?1-ss((p-300)/40):0)));
  const cloud=p<130?0:(p<170?ss((p-130)/40):(p<320?1:(p<360?1-ss((p-320)/40):0)));
  const mist=p<330?0:(p<360?ss((p-330)/30):(p<400?1:1-ss((p-400)/20)));
  const wind=p<40?0:(p<60?ss((p-40)/20):(p<150?1:(p<175?1-ss((p-150)/25):0)));
  const puddle=p<190?0:(p<300?ss((p-190)/60):(p<400?1-ss((p-300)/100):0));
  return {rain:rain,cloud:cloud,mist:mist*0.7,wind:wind,puddle:puddle}; }
function tick(G,dt){
  const S=G.S; G.wx=weatherAt(S.time); if(G.wx.rain>0.7&&Math.random()<dt*0.02) G.wx.flash=1; G.flash=Math.max(0,(G.flash||0)-dt*3); if(G.wx.flash) G.flash=1;
  // the yard forklift: out, pause, beep back
  const f=G.lift||(G.lift={x:LIFT.x0+40,dir:1,wait:0,t:0}); f.t+=dt;
  if(f.wait>0){ f.wait-=dt; if(f.wait<=0){ f.dir=-f.dir; if(f.dir<0) f.beep=1.4; } }
  else{ f.x+=f.dir*(f.dir>0?38:26)*dt; if(f.x>LIFT.x1-30||f.x<LIFT.x0+30){ f.x=clamp(f.x,LIFT.x0+30,LIFT.x1-30); f.wait=2.5; } }
  if(f.beep>0){ const was=f.beep; f.beep-=dt; if(Math.floor(was*2.5)!==Math.floor(f.beep*2.5)&&G.cur.node&&G.cur.node.id==='ground'&&Math.abs(G.hero.x-f.x)<320) G.events.push({type:'sfx',name:'beep'}); }
  // the portal
  G.portalOpen=GM.count(S.pages)>=GM.PAGES.length;
  if(G.portalOpen&&!S.flags.ap_portal&&GM.STORY){ S.flags.ap_portal=1; GM.STORY.aplusSay(G,'YOU READ THE WHOLE LEDGER. NOBODY READS THE LEDGER. I OPENED A DOOR IN THE ARCHIVE. GO SEE WHERE IT STARTED.'); }
  const N=G.cur.node, h=G.hero;
  if(G.portalOpen&&N&&N.id==='hq_b1'&&!G.dialog&&!G.p38){ const d=Math.abs(PORTAL_X-h.x); let best=G.target, bd=best?Math.abs(best.x-h.x)+(best.kind==='item'||best.kind==='page'?-40:0):1e9;
    if(d<28&&d-10<bd) best={kind:'portal',label:'Step through',name:'1938',x:PORTAL_X}; G.target=best; }
}
const base={update:GM.update,interact:GM.interact};
GM.update=function(G,ix,iy,dt){ base.update(G,ix,iy,dt); tick(G,dt); };
GM.interact=function(G){ const t=G.target; if(!G.dialog&&!G.card&&t&&t.kind==='portal'&&!(G.cine&&G.cine.length)){ G.events.push({type:'sfx',name:'door'}); GM.enter1938(G); return; } base.interact(G); };
GM.PORTAL_X=PORTAL_X; GM.PTS_1938=20; GM.WORLD={weatherAt:weatherAt,LIFT:LIFT};
})(typeof globalThis!=='undefined'?globalThis:this);
