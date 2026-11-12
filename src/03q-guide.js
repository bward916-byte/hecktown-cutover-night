/* ==== GUIDE: where the next main-line step is, and which way to walk to get there. Chapter 1 only.
   spot(G) is the place; hop(G) is what to do from where you stand: walk to an x on this floor, and maybe take stairs there. DOM-free. ==== */
(function(root){
'use strict';
const MAP=root.HMAP, GM=root.HGAME;
const count=o=>Object.keys(o).length;
function npc(G,id){ const q=G.npcs.find(n=>n.def.id===id); return q&&q.node?{node:q.node.id,x:q.w.x,name:q.def.name}:null; }
function item(id){ const it=GM.ITEMS.find(i=>i.id===id); return {node:it.node,x:it.x,name:it.name}; }
/* after the cutover: the nearest thing still unfound on campus. Pages first, then people, then rooms. */
function campus(id){ const n=MAP.nodes[id]; return !!n&&!n.era&&!n.dc&&!n.show&&!n.river&&!n.studio&&!n.future&&!n.mid; }
function leftover(G){ const S=G.S, h=G.hero, N=G.cur.node, here=N?N.id:null, score=(node,x)=>(node===here?0:5000)+Math.abs(x-h.x); let best=null, bs=1e9; const take=(o)=>{ const s=score(o.node,o.x); if(s<bs){ bs=s; best=o; } };
  GM.PAGES.forEach((p,i)=>{ if(!S.pages[i]&&campus(p[0])) take({node:p[0],x:p[1],name:'ledger page'}); }); if(best) return best;
  for(const q of G.npcs) if(!S.met[q.def.id]&&q.node&&campus(q.node.id)&&!q.crew) take({node:q.node.id,x:q.w.x,name:q.def.name}); if(best) return best;
  for(const r of MAP.rooms) if(!S.rooms[r.id]&&campus(r.node)) take({node:r.node,x:(r.x0+r.x1)/2,name:r.name}); return best; }
function spot(G){ const S=G.S, F=S.flags; if((GM.chapterOf?GM.chapterOf(S):'cutover')!=='cutover'||!F.p38||F.p38<5) return null;
  if(S.done) return leftover(G);
  if(!F.started) return npc(G,'rianan');
  if(!S.inv.badge) return !F.rfcAsked?npc(G,'andrew'):(S.inv.rfc?npc(G,'andrew'):item('rfc'));
  const so=S.signoffs;
  if(!so.Network) return F.netAsked&&!S.inv.spool?item('spool'):npc(G,'aaron');
  if(!so.Storefront) return F.sfAsked&&!S.inv.coffee?npc(G,'tina'):npc(G,'ash');
  if(!so.Catalog) return F.catalogAsked&&!S.inv.label?item('label'):npc(G,'pam');
  if(!so.EDI) return F.ediAsked&&!S.inv.bol?npc(G,'rosa'):npc(G,'umesh');
  if(!so.Jobs){ if(F.jobsAsked&&count(S.terms)<3){ const t=GM.TERMS.find(t=>!S.terms[t.id]); return {node:t.node,x:t.x,name:'terminal'}; } return npc(G,'john'); }
  if(!so.Backup) return F.backupAsked&&!S.inv.tape?item('tape'):npc(G,'dave');
  if(!S.inv.tunnelkey){ if(count(S.pages)<6){ const i=GM.PAGES.findIndex((p,k)=>!S.pages[k]); if(i>=0) return {node:GM.PAGES[i][0],x:GM.PAGES[i][1],name:'ledger page'}; } return npc(G,'greg'); }
  return {node:'tun_3',x:2120,name:'A+'}; }
function route(from,to){ const prev=new Map([[from,null]]), q=[from];
  while(q.length){ const n=q.shift(); if(n===to) break;
    for(const L of MAP.links) for(const [a,b,up] of [[L.lo,L.hi,true],[L.hi,L.lo,false]]) if(a.node===n&&!prev.has(b.node)){ prev.set(b.node,{from:n,end:a,up:up}); q.push(b.node); } }
  if(!prev.has(to)) return null; let n=to, first=null; while(prev.get(n)){ first=prev.get(n); n=first.from; } return first; }
function hop(G){ const N=G.cur.node; if(!N) return null; const s=spot(G); if(!s) return null; const T=MAP.nodes[s.node]; if(!T) return null;
  if(T===N) return {x:s.x,stairs:0,name:s.name,here:true};
  const f=route(N,T); if(!f) return null; return {x:(f.end.a+f.end.b)/2,stairs:f.up?-1:1,name:s.name,here:false}; }
GM.GUIDE={spot:spot,hop:hop};
})(typeof globalThis!=='undefined'?globalThis:this);
