import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeGraph,statistics,analyse,applyOperations,normalize} from './engine.mjs';
export const root=new URL('../',import.meta.url);
export const readJSON=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const manifest=await readJSON('originals/manifest.json');
const pin=await readJSON('data/import-provenance.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
if(sha(await readFile(new URL('originals/manifest.json',root)))!==pin.manifest_sha256)throw Error('Manifest integrity');
for(const [name,meta] of Object.entries(manifest.files)){const b=await readFile(new URL('originals/'+name,root));if(b.length!==meta.bytes||sha(b)!==meta.sha256)throw Error('Integrity '+name);}
export function csv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(field.replace(/\r$/,''));field='';if(c==='\n'){rows.push(row);row=[];}}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}const heads=rows.shift();return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]??''])));}
const graphDoc=await readJSON('originals/graph.json'),graph=makeGraph(graphDoc.adjacency),reference=await readJSON('originals/path-analysis.json');
const pages=csv(await readFile(new URL('originals/pages.csv',root),'utf8')), links=csv(await readFile(new URL('originals/links.csv',root),'utf8'));
const metadata=Object.fromEntries(pages.map((p,i)=>[normalize(p.url),{...p,row:i+2}]));
const all=[...new Set([...graph.keys(),...[...graph.values()].flat()])].sort();
const records=Object.fromEntries(all.map(url=>{const u=new URL(url),m=metadata[url];return [url,{url,source_documented:graph.has(url),label:m?.h1||decodeURIComponent(u.pathname.split('/').filter(Boolean).pop()||u.host).replace(/-/g,' '),label_basis:m?'observed_h1':'url_derived',kind:/\.[a-z\d]{2,5}$/i.test(u.pathname)?'resource':'url',metadata:m??null}];}));
const initial={version:manifest.version,from:manifest.roots[0],to:reference.analyses[0].target,operations:[]};
const baseline=analyse(graph,initial.from,initial.to);
const added={type:'add',from:initial.from,to:initial.to};
const path=baseline.paths[0],removed={type:'remove',from:path[path.length-2],to:path.at(-1)};
const guided={add:{operation:added,result:analyse(applyOperations(graph,[added]),initial.from,initial.to)},remove:{operation:removed,result:analyse(applyOperations(graph,[removed]),initial.from,initial.to)}};
if(guided.add.result.distance!==1||guided.remove.result.distance!==baseline.distance||BigInt(guided.remove.result.count)<=0n||BigInt(guided.remove.result.count)>=BigInt(baseline.count))throw Error('Guided cases invalid');
export const display={demo_version:'1.0.0',provenance:{...pin,data_version:manifest.version,observed_at:graphDoc.observed_at,graph_sha256:manifest.files['graph.json'].sha256,inventory_source_sha256:graphDoc.inventory_source_sha256},statistics:statistics(graph),initial,records,link_metadata:links.map((r,i)=>({...r,row:i+2})),references:reference.analyses.map(r=>analyse(graph,r.root,r.target)),guided};
await writeFile(new URL('data/display.json',root),JSON.stringify(display,null,2)+'\n');
console.log(JSON.stringify({integrity:'11 files and manifest verified',statistics:display.statistics,references:display.references.map(r=>({distance:r.distance,count:r.count})),guided:Object.fromEntries(Object.entries(guided).map(([k,v])=>[k,{operation:v.operation,distance:v.result.distance,count:v.result.count}]))}));
