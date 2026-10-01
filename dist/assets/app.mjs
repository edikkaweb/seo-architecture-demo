import {makeGraph,analyse,applyOperations,decodeScenario,encodeScenario,exportScenario,MAX_OPS} from './engine.mjs';
import {esc,tr,resultCard,pathMarkup,evidenceMarkup,summary,quickResult} from './render.mjs';
const $=id=>document.getElementById(id),lang=document.documentElement.lang,t=(fr,en)=>tr(lang,fr,en);
const messages={limit:t('Huit modifications au maximum. Annulez une modification avant de continuer.','Up to eight changes. Undo a change before continuing.'),unknown:t('Une URL n’appartient pas au corpus.','An URL is absent from the corpus.'),undocumented:t('Cette source ne possède pas d’adjacence documentée.','This source has no documented adjacency.'),conflict:t('Ce couple a déjà été modifié. Annulez cette modification avant d’inverser votre choix.','This pair was already modified. Undo that change before reversing your choice.'),exists:t('Cette relation existe déjà dans l’archive.','This relation already exists in the archive.'),missing:t('Cette relation n’existe pas dans l’archive, dans ce sens.','This relation does not exist in the archive in that direction.'),format:t('Le lien de scénario est invalide ou trop long.','The scenario link is invalid or too long.'),version:t('La version du jeu de données demandée est indisponible.','The requested data version is unavailable.'),operation:t('Une opération du scénario est invalide.','A scenario operation is invalid.')};
let display,archive,state,current,simulated,chosen=0,model='archive';
const initial=()=>structuredClone(display.initial);
function announce(message){$('announcement').textContent=message;}
function label(r){return r.label+(r.kind==='resource'?t(' [ressource]',' [resource]'):'')+' — '+r.url;}
function populate(id,selected){
 const select=$(id),filter=$(id+'-search').value.trim().toLocaleLowerCase(),restricted=id==='op-from';
 const records=Object.values(display.records).filter(r=>(!restricted||r.source_documented)&&(r.url===selected||label(r).toLocaleLowerCase().includes(filter)));
 select.replaceChildren();
 for(const documented of [true,false]){const group=document.createElement('optgroup');group.label=documented?t('Sources documentées','Documented sources'):t('Destinations · liens sortants inconnus','Destinations · unknown outgoing links');for(const r of records.filter(r=>r.source_documented===documented)){const opt=document.createElement('option');opt.value=r.url;opt.textContent=label(r);opt.selected=r.url===selected;group.append(opt);}if(group.children.length)select.append(group);}
 if(selected)select.value=selected;
}
function setPickers(){for(const [id,value] of [['from',state.from],['to',state.to],['op-from',state.from],['op-to',state.to]]){ $(id+'-search').value='';populate(id,id==='op-from'&&!archive.has(value)?display.initial.from:value);}}
function languageLink(){const link=$('language');link.href=(lang==='en'?'index.html':'index-en.html')+encodeScenario(state,archive);}
function renderPath(){const result=model==='simulation'?simulated:current;const ops=model==='simulation'?state.operations:[];chosen=Math.min(chosen,Math.max(0,result.paths.length-1));$('path-choice').innerHTML=result.paths.map((p,i)=>`<option value="${i}" ${i===chosen?'selected':''}>${i+1} / ${result.shown}</option>`).join('');$('path-choice').disabled=!result.paths.length;$('path-view').innerHTML=pathMarkup(result.paths[chosen],display,lang,ops);$('evidence-view').innerHTML=evidenceMarkup(result.paths[chosen],display,lang,ops,archive);$('path-limit').textContent=t(`${result.shown} chemin(s) affiché(s) sur ${result.count} au total. Limite : 50, ordre lexicographique des URL. Modèle : ${model==='archive'?'archive':'simulation'}.`,`${result.shown} path(s) shown out of ${result.count} in total. Limit: 50, URL lexicographic order. Model: ${model}.`);}
function effect(){if(current.distance===simulated.distance&&current.count===simulated.count)return t('Effet calculé nul : même longueur minimale et même nombre de chemins. Les relations modifiées restent visibles ci-dessous.','No calculated effect: same minimum length and same number of paths. Changed relations remain visible below.');return t(`Effet calculé : longueur ${current.distance??'indisponible'} → ${simulated.distance??'indisponible'} ; chemins minimaux ${current.count} → ${simulated.count}.`,`Calculated effect: length ${current.distance??'unavailable'} → ${simulated.distance??'unavailable'}; shortest paths ${current.count} → ${simulated.count}.`);}
function render(shouldAnnounce=true){
 current=analyse(archive,state.from,state.to);simulated=analyse(applyOperations(archive,state.operations),state.from,state.to);
 $('quick-result').innerHTML=quickResult(current,display,lang);
 $('comparison').innerHTML=resultCard(current,lang,t('Plus court chemin dans le graphe archivé','Shortest path in the archived graph'))+(state.operations.length?resultCard(simulated,lang,t('Modification simulée','Simulated change')):'');
 $('comparison').classList.toggle('has-simulation',!!state.operations.length);$('effect').hidden=!state.operations.length;$('effect').textContent=effect();
 $('calculation-scope').textContent=state.from===display.initial.from?t('Calcul depuis la racine publiée du manifeste.','Calculation from the root published in the manifest.'):t('Calcul exploratoire sur l’archive, depuis un autre départ que la racine publiée.','Exploratory calculation on the archive, from a different start than the published root.');
 $('operations').innerHTML=state.operations.length?state.operations.map((o,i)=>`<li><div><strong>${i+1}. ${o.type==='add'?t('Ajout simulé','Simulated addition'):t('Retrait simulé','Simulated removal')}</strong><span class="url">${esc(o.from)} → ${esc(o.to)}</span></div><button type="button" data-undo="${i}">${t('Annuler','Undo')} ${i+1}</button></li>`).join(''):`<li>${t('Aucune modification. Le graphe archivé est intact.','No changes. The archived graph is intact.')}</li>`;
 $('undo').disabled=$('reset').disabled=state.operations.length===0;
 if(!state.operations.length)model='archive';$('path-model').value=model;$('path-model').disabled=!state.operations.length;
 renderPath();languageLink();$('share-output').hidden=true;$('export-output').hidden=true;
 if(shouldAnnounce)announce(summary(current,lang)+(state.operations.length?' '+effect():''));
}
function commit(next){applyOperations(archive,next.operations);state=next;chosen=0;render();$('operation-error').textContent='';$('scenario-error').hidden=true;history.replaceState(null,'',encodeScenario(state,archive));}
function recover(){state=initial();setPickers();commit(state);$('explore').scrollIntoView();$('from-search').focus();}
function loadHash(){if(location.hash.startsWith('#scenario')){try{state=decodeScenario(location.hash,archive);}catch(e){state=initial();$('scenario-error').hidden=false;$('scenario-error-text').textContent=t('Scénario non chargé. ','Scenario not loaded. ')+(messages[e.code]||messages.format);}}else state=initial();}
try{
 const responses=await Promise.all([fetch('data/display.json'),fetch('originals/graph.json')]);if(responses.some(r=>!r.ok))throw Error('HTTP');
 [display,current]=await Promise.all(responses.map(r=>r.json()));archive=makeGraph(current.adjacency);
 loadHash();setPickers();render(false);
 $('explore-controls').disabled=$('simulation-controls').disabled=$('share-button').disabled=$('export-button').disabled=false;$('path-controls').hidden=false;$('load-note').textContent=t('Calcul local prêt · aucune analyse du site actuel.','Local calculation ready · no analysis of the current site.');
 for(const id of ['from','to','op-from','op-to'])$(id+'-search').addEventListener('input',()=>populate(id,$(id).value));
 $('explore-form').addEventListener('submit',event=>{event.preventDefault();commit({...state,from:$('from').value,to:$('to').value});});
 $('operation-form').addEventListener('submit',event=>{event.preventDefault();try{model='simulation';commit({...state,operations:[...state.operations,{type:$('operation-type').value,from:$('op-from').value,to:$('op-to').value}]});}catch(e){model=state.operations.length?'simulation':'archive';$('operation-error').textContent=messages[e.code]||messages.operation;}});
 for(const type of ['add','remove'])$('guided-'+type).addEventListener('click',()=>{state={...initial(),operations:[structuredClone(display.guided[type].operation)]};model='simulation';setPickers();commit(state);$('explore').scrollIntoView();});
 $('undo').addEventListener('click',()=>commit({...state,operations:state.operations.slice(0,-1)}));
 $('operations').addEventListener('click',event=>{const button=event.target.closest('[data-undo]');if(button)commit({...state,operations:state.operations.filter((_,i)=>i!==Number(button.dataset.undo))});});
 $('reset').addEventListener('click',()=>commit({...state,operations:[]}));$('recover').addEventListener('click',recover);
 $('path-model').addEventListener('change',()=>{model=$('path-model').value;chosen=0;renderPath();announce(t('Modèle affiché : ','Displayed model: ')+$('path-model').selectedOptions[0].textContent);});
 $('path-choice').addEventListener('change',()=>{chosen=Number($('path-choice').value);renderPath();announce(t('Chemin affiché : ','Displayed path: ')+(chosen+1));});
 $('share-button').addEventListener('click',()=>{const url=new URL(location.href);url.hash=encodeScenario(state,archive);$('share-url').value=url.href;$('share-open').href=url.href;$('share-output').hidden=false;$('share-url').focus();$('share-url').select();announce(t('Lien prêt à copier.','Link ready to copy.'));});
 let exportURL;
 $('export-button').addEventListener('click',()=>{const payload=exportScenario(state,archive,display.provenance),json=JSON.stringify(payload,null,2)+'\n';if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(new Blob([json],{type:'application/json'}));$('export-json').value=json;$('export-download').href=exportURL;$('export-output').hidden=false;$('export-download').focus();announce(t('JSON prêt : téléchargez-le ou copiez son contenu.','JSON ready: download it or copy its content.'));});
 window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#scenario')){loadHash();setPickers();render();}else openEvidence();});
 function openEvidence(){const id=decodeURIComponent(location.hash.slice(1));if(/^relation-\d+$/.test(id)||id==='node-proof'){const el=$(id);if(el){el.open=true;el.scrollIntoView();}}}
 document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#relation-"],a[href="#node-proof"]');if(a){const el=$(a.hash.slice(1));if(el)el.open=true;}});openEvidence();
}catch(error){$('load-note').textContent=t('L’interactivité n’a pas pu se charger. Les exemples statiques et la reproduction ci-dessous restent disponibles.','Interactivity could not load. Static examples and reproduction instructions below remain available.');console.error('Demo initialization failed',error);}
