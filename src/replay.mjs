import {readFile} from 'node:fs/promises';
import {makeGraph,exportScenario,decodeScenario} from './engine.mjs';
const graph=makeGraph(JSON.parse(await readFile(new URL('../originals/graph.json',import.meta.url))).adjacency);
const display=JSON.parse(await readFile(new URL('../data/display.json',import.meta.url)));
let scenario=display.initial;const arg=process.argv[2];
if(arg){if(arg.startsWith('https://')||arg.startsWith('#scenario='))scenario=decodeScenario(arg.startsWith('#')?arg:new URL(arg).hash,graph);else{const doc=JSON.parse(await readFile(arg,'utf8'));scenario=doc.scenario??doc;}}
console.log(JSON.stringify(exportScenario(scenario,graph,display.provenance),null,2));
