/* ==== LIGHT: tells the people drawer where light comes from (office fixtures, street lamps, the sky, 1938 sun),
   and adds a little light to the world: pools on the floor under fixtures, bloom on lamp heads, glow off screens. ==== */
(function(root){
'use strict';
const D=root.HDRAW, GM=root.HGAME, MAP=root.HMAP, PP=root.HPEOPLE, FH=MAP.FH, CEIL=86;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const FIX=[]; for(const y of [0,-FH]) for(let x=1170;x<1900;x+=140) if(!(x>1556&&x<1724)) FIX.push({x:x,y:y});
const LAMPS=MAP.props.filter(p=>p.type==='lamp').map(p=>({x:p.x+15,node:p.node}));
const SCREENS=MAP.props.filter(p=>p.type==='term'||p.type==='aplus_wall'||p.type==='bigscreen'||p.type==='pimdesk');
let G=null, night=0;
function mins(S){ const m=/(\d+):(\d+)\s*(AM|PM)/.exec(GM.clock(S)||''); if(!m) return 0; let h=+m[1]%12+(m[3]==='PM'?12:0); if(h<12) h+=24; return (h*60+ +m[2])-18*60; }
PP.setLight(function(x,y){
  if(!G) return null; const N=G.cur.node;
  if(N&&N.era) return {dir:1,k:0.6,col:'255,226,170',rim:0.3};
  if(N&&N.future) return N.id==='y2060'?{dir:-1,k:0.7,col:'255,250,240',rim:0.35}:{dir:1,k:0.35,col:'140,220,180',rim:0.4};
  if(N&&(N.dc||N.show)) return {dir:-1,k:0.55,col:N.show?'255,236,200':'235,240,255',rim:0.25};
  if(x>1092&&x<1908&&y<FH-10){ let best=null,bd=1e9; for(const f of FIX){ if(Math.abs(y-f.y)>60) continue; const d=Math.abs(f.x-x); if(d<bd){ bd=d; best=f; } }
    if(best) return {dir:best.x<x?-1:1,k:0.35+0.5*clamp(1-bd/90,0,1),col:'255,242,214',rim:0.18+0.3*clamp(1-bd/70,0,1)}; }
  if(N&&(N.id==='hq_b1'||N.id.indexOf('tun')===0)) return {dir:-1,k:0.2,col:'200,220,255',rim:0.08};
  for(const l of LAMPS){ const d=Math.abs(l.x-x); if(d<70&&y<30) return {dir:l.x<x?-1:1,k:0.45+0.45*(1-d/70)*(0.4+0.6*night),col:'255,214,150',rim:0.2+0.4*(1-d/70)*night}; }
  return night>0.4?{dir:1,k:0.3,col:'190,208,255',rim:0.22*night}:{dir:-1,k:0.55,col:'255,210,160',rim:0.3*(1-night)};
});
/* pools of light on the floor, drawn with the props so people stand in them */
function floorLight(c,now,V){
  c.save(); c.globalCompositeOperation='lighter';
  for(const f of FIX){ if(f.x<V.x0-60||f.x>V.x1+60) continue; const g=c.createRadialGradient(f.x,f.y,2,f.x,f.y,58); g.addColorStop(0,'rgba(255,236,190,.16)'); g.addColorStop(1,'rgba(255,236,190,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(f.x,f.y,58,6,0,0,7); c.fill();
    const h=c.createRadialGradient(f.x,f.y-CEIL+1,0,f.x,f.y-CEIL+1,18); h.addColorStop(0,'rgba(255,246,220,.35)'); h.addColorStop(1,'rgba(255,246,220,0)'); c.fillStyle=h; c.fillRect(f.x-18,f.y-CEIL-6,36,24); }
  for(const l of LAMPS){ if(l.x<V.x0-60||l.x>V.x1+60) continue; const y=MAP.nodes[l.node].world.yAt(l.x), a=0.25+0.55*night;
    const g=c.createRadialGradient(l.x,y,2,l.x,y,50); g.addColorStop(0,'rgba(255,214,150,'+(0.22*a).toFixed(3)+')'); g.addColorStop(1,'rgba(255,214,150,0)'); c.fillStyle=g; c.beginPath(); c.ellipse(l.x,y,50,6,0,0,7); c.fill();
    const b=c.createRadialGradient(l.x,y-102,0,l.x,y-102,16); b.addColorStop(0,'rgba(255,236,190,'+(0.7*a).toFixed(3)+')'); b.addColorStop(1,'rgba(255,236,190,0)'); c.fillStyle=b; c.fillRect(l.x-16,y-118,32,32); }
  for(const p of SCREENS){ if(p.x<V.x0-40||p.x>V.x1+40) continue; const y=MAP.nodes[p.node].world.yAt(p.x)-(p.type==='aplus_wall'?70:p.type==='bigscreen'?44:34), col=p.type==='pimdesk'?'170,200,255':'120,255,150', f=0.8+0.2*Math.sin(now/700+p.x);
    const g=c.createRadialGradient(p.x,y,1,p.x,y,26); g.addColorStop(0,'rgba('+col+','+(0.12*f).toFixed(3)+')'); g.addColorStop(1,'rgba('+col+',0)'); c.fillStyle=g; c.fillRect(p.x-26,y-26,52,52); }
  c.restore(); }
if(D.FLOORHOOKS) D.FLOORHOOKS.push((c,g,now,V)=>floorLight(c,now,V));
const base=D.render;
D.render=function(c,V,g,now,dt){ G=g; night=clamp(mins(g.S)/300,0,1); base(c,V,g,now,dt); };
})(typeof globalThis!=='undefined'?globalThis:this);
