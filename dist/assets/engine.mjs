/** Pure shared engine: browser, build, CLI and tests. No network or DOM. */
export const DEMO_VERSION='1.0.0', DATA_VERSION='1.1.0', MAX_OPS=8, DISPLAY_LIMIT=50;
export function normalize(value){
 const u=new URL(value); if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('url');
 u.hash=''; if(u.pathname!=='/')u.pathname=u.pathname.replace(/\/+$/,''); return u.href;
}
export function makeGraph(adjacency){
 const merged=new Map();
 for(const [from,tos] of Object.entries(adjacency)){const f=normalize(from);if(!merged.has(f))merged.set(f,new Set());for(const to of tos)merged.get(f).add(normalize(to));}
 return new Map([...merged].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,[...v].sort()]));
}
export function nodes(graph){return new Set(graph.knownNodes??[...graph.keys(),...[...graph.values()].flat()]);}
export function statistics(graph){const all=nodes(graph);return {sources:graph.size,urls:all.size,destination_only:all.size-graph.size,unique_relations:[...graph.values()].reduce((n,v)=>n+v.length,0),self_links:[...graph].filter(([k,v])=>v.includes(k)).length};}
export function analyse(graph,from,to,{limit=DISPLAY_LIMIT}={}){
 if(!Number.isInteger(limit)||limit<0||limit>200)throw Error('limit');
 let root,target;try{root=normalize(from);target=normalize(to);}catch{return {status:'unknown',root:from,target:to,distance:null,count:'0',paths:[],shown:0};}
 const all=nodes(graph), base={root,target,target_outgoing_documented:graph.has(target),source_outgoing_documented:graph.has(root)};
 if(!all.has(root)||!all.has(target))return {...base,status:'unknown',distance:null,count:'0',paths:[],shown:0};
 const distance=new Map([[root,0]]), count=new Map([[root,1n]]), pred=new Map([[root,[]]]), queue=[root];
 for(let i=0;i<queue.length;i++){
  const current=queue[i], d=distance.get(current)+1;
  for(const dest of graph.get(current)??[]){
   if(!distance.has(dest)){distance.set(dest,d);count.set(dest,count.get(current));pred.set(dest,[current]);queue.push(dest);}
   else if(distance.get(dest)===d){count.set(dest,count.get(dest)+count.get(current));pred.get(dest).push(current);}
  }
 }
 if(!distance.has(target))return {...base,status:'unreachable',distance:null,count:'0',paths:[],shown:0};
 // Reverse predecessor DAG, then lexicographic forward enumeration. No materialisation of all paths.
 const successor=new Map(),visited=new Set(), pending=[target];
 while(pending.length){const n=pending.pop();if(visited.has(n))continue;visited.add(n);for(const p of pred.get(n)??[]){if(!successor.has(p))successor.set(p,[]);successor.get(p).push(n);pending.push(p);}}
 for(const list of successor.values())list.sort();
 const paths=[],stack=[{node:root,path:[root]}];
 while(stack.length&&paths.length<limit){const {node,path}=stack.pop();if(node===target){paths.push(path);continue;}const next=successor.get(node)??[];for(let i=next.length-1;i>=0;i--)stack.push({node:next[i],path:[...path,next[i]]});}
 return {...base,status:'reachable',distance:distance.get(target),count:count.get(target).toString(),paths,shown:paths.length};
}
export class ScenarioError extends Error {constructor(code){super(code);this.code=code;}}
export function applyOperations(archive,operations){
 if(!Array.isArray(operations)||operations.length>MAX_OPS)throw new ScenarioError('limit');
 const all=nodes(archive),seen=new Set(),copy=new Map([...archive].map(([k,v])=>[k,[...v]]));
 copy.knownNodes=all;
 for(const op of operations){
  if(!op||typeof op!=='object'||Object.keys(op).sort().join(',')!=='from,to,type'||!['add','remove'].includes(op.type))throw new ScenarioError('operation');
  let from,to;try{from=normalize(op.from);to=normalize(op.to);}catch{throw new ScenarioError('unknown');}
  if(!all.has(from)||!all.has(to))throw new ScenarioError('unknown');
  if(!archive.has(from))throw new ScenarioError('undocumented');
  const key=JSON.stringify([from,to]);if(seen.has(key))throw new ScenarioError('conflict');seen.add(key);
  const list=copy.get(from),exists=list.includes(to);
  if(op.type==='add'&&exists)throw new ScenarioError('exists');
  if(op.type==='remove'&&!exists)throw new ScenarioError('missing');
  copy.set(from,op.type==='add'?[...list,to].sort():list.filter(x=>x!==to));
 }
 return copy;
}
export function validateScenario(value,archive){
 if(!value||typeof value!=='object'||Object.keys(value).sort().join(',')!=='from,operations,to,version')throw new ScenarioError('format');
 if(value.version!==DATA_VERSION)throw new ScenarioError('version');
 const all=nodes(archive);let from,to;
 try{from=normalize(value.from);to=normalize(value.to);}catch{throw new ScenarioError('unknown');}
 if(!all.has(from)||!all.has(to))throw new ScenarioError('unknown');
 applyOperations(archive,value.operations);
 return {version:DATA_VERSION,from,to,operations:value.operations.map(o=>({type:o.type,from:normalize(o.from),to:normalize(o.to)}))};
}
export function encodeScenario(value,archive){return '#scenario='+encodeURIComponent(JSON.stringify(validateScenario(value,archive)));}
export function decodeScenario(hash,archive){
 if(hash.length>16000||!hash.startsWith('#scenario='))throw new ScenarioError('format');
 let value;try{value=JSON.parse(decodeURIComponent(hash.slice(10)));}catch{throw new ScenarioError('format');}
 return validateScenario(value,archive);
}
export function exportScenario(value,archive,provenance){
 const scenario=validateScenario(value,archive);
 return {kind:scenario.operations.length?'archived-graph-simulation':'archived-graph-calculation',demo_version:DEMO_VERSION,calculated_at:new Date().toISOString(),provenance,scenario,archive:analyse(archive,scenario.from,scenario.to),simulation:analyse(applyOperations(archive,scenario.operations),scenario.from,scenario.to),notice:'A calculation on a dated archive, not a new site observation or an SEO recommendation.'};
}
