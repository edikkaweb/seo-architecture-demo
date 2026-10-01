import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base='https://www.edikka.com/docbd/data/architecture-seo-decision-matrix-v1.1/';
const dir=new URL('../originals/',import.meta.url); await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
async function get(name){const r=await fetch(base+name);if(!r.ok)throw Error(`${name}: HTTP ${r.status}`);return Buffer.from(await r.arrayBuffer());}
const manifestBytes=await get('manifest.json'); const manifest=JSON.parse(manifestBytes);
if(manifest.version!=='1.1.0')throw Error('Unexpected data version');
const files={};
for(const [name,expect] of Object.entries(manifest.files)){
 if(!/^[a-zA-Z0-9.-]+$/.test(name))throw Error('Unsafe manifest path');
 const bytes=await get(name); if(bytes.length!==expect.bytes||hash(bytes)!==expect.sha256)throw Error(`Integrity failure ${name}`);
 files[name]=bytes;
}
// Existing originals may only be verified, never silently replaced.
for(const [name,bytes] of Object.entries({'manifest.json':manifestBytes,...files})){
 const url=new URL(name,dir);try{const existing=await readFile(url);if(!existing.equals(bytes))throw Error(`Original differs: ${name}`);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(url,bytes);}
}
const pin={source:base,accessed_at:new Date().toISOString(),manifest_sha256:hash(manifestBytes),files_verified:Object.keys(files).length};
await writeFile(new URL('../data/import-provenance.json',import.meta.url),JSON.stringify(pin,null,2)+'\n');
console.log(JSON.stringify(pin));
