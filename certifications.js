'use strict';
const $ = s => document.querySelector(s);
const make = (tag, className, text) => {const e=document.createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=text;return e;};
const search=$('#search'), domain=$('#domain'), provider=$('#provider'), level=$('#level'), results=$('#cert-results');
const selected=new Set();let certs=[],domains=[],categories=[],previousFocus;
function option(select,value,label){const o=make('option','',label);o.value=value;select.append(o);}
function domainLabel(id){return domains.find(d=>d.id===id)?.name || id;}
function compareState(){const n=selected.size;$('#compare-count').textContent=n;$('#compare-open').disabled=n!==2;}
function abbreviation(cert){
 const match=cert.name.match(/\(([^()]*)\)\s*$/); return match?match[1]:cert.name;
}
function closeDetail(){ $('#cert-detail').hidden=true;$('#cert-backdrop').hidden=true;document.body.style.overflow='';previousFocus?.focus(); }
function openDetail(cert){
 previousFocus=document.activeElement;
 const root=$('#cert-detail-content');root.replaceChildren();
 const title=make('h2','',cert.name);title.id='cert-detail-title';root.append(title,make('p','',cert.summary));
 root.append(make('h3','','Provider'),make('p','',cert.provider),make('h3','','Level'),make('p','',cert.level||'Not specified'));
 const domainsList=make('div','cert-detail-domains');cert.domains.forEach(id=>{const a=make('a','',domainLabel(id));a.href=`index.html?domain=${encodeURIComponent(id)}`;domainsList.append(a);});root.append(make('h3','','Domains'),domainsList);
 const link=make('a','official-link','Official details');link.href=cert.url;link.target='_blank';link.rel='noopener noreferrer';root.append(link);
 const label=make('label','detail-compare');const check=make('input');check.type='checkbox';check.checked=selected.has(cert.id);check.disabled=!check.checked&&selected.size>=2;check.addEventListener('change',()=>{check.checked?selected.add(cert.id):selected.delete(cert.id);compareState();});label.append(check,document.createTextNode('Add to comparison'));root.append(label);
 $('#cert-backdrop').hidden=false;$('#cert-detail').hidden=false;document.body.style.overflow='hidden';$('#cert-close').focus();
}
function render(){
 const query=search.value.trim().toLowerCase();
 const matches=cert=> (!query||[cert.name,cert.provider,cert.summary].some(v=>v.toLowerCase().includes(query)))&&(!domain.value||cert.domains.includes(domain.value))&&(!provider.value||cert.provider===provider.value)&&(!level.value||cert.level===level.value);
 const filtered=certs.filter(matches);
 $('#result-count').textContent=`${filtered.length} of ${certs.length} certifications`;
 $('#cert-empty').hidden=filtered.length!==0;
 results.replaceChildren();
 const tracks=[];
 categories.forEach(category=>category.subcategories.forEach(subcategory=>tracks.push({category,subcategory})));
 results.style.setProperty('--roadmap-columns',String(tracks.length));
 const corner=make('div','roadmap-corner','Level');corner.style.gridColumn='1';corner.style.gridRow='1 / span 2';results.append(corner);
 let column=2;
 categories.forEach(category=>{
   const heading=make('div','roadmap-category',category.name);heading.title=category.full_name;heading.style.setProperty('--category-color',category.color);
   heading.style.gridColumn=`${column} / span ${category.subcategories.length}`;heading.style.gridRow='1';results.append(heading);
   category.subcategories.forEach(subcategory=>{
     const sub=make('div','roadmap-subcategory',subcategory.name);sub.style.gridColumn=String(column++);sub.style.gridRow='2';sub.style.setProperty('--category-color',category.color);
     if(subcategory.name)sub.classList.add('is-subcategory');results.append(sub);
   });
 });
 const bands=[{level:'Expert',label:'Expert'}, {level:'Intermediate',label:'Intermediate'}, {level:'Beginner',label:'Beginner'}, {level:null,label:'Level not specified'}];
 let firstRow=3;
 const trackCerts=(track,band)=>certs.filter(c=>c.roadmap_categories.includes(track.category.id)&&(c.level||null)===band.level&&(c.roadmap_subcategories?.[track.category.id]||'general')===track.subcategory.id);
 bands.forEach(band=>{
   const rowsPerBand=Math.max(3,...tracks.map(track=>trackCerts(track,band).length));
   const label=make('div','roadmap-band',band.label);label.dataset.level=band.level||'unspecified';label.style.gridColumn='1';label.style.gridRow=`${firstRow} / span ${rowsPerBand}`;results.append(label);
   tracks.forEach((track,index)=>{
     const entries=trackCerts(track,band);
     for(let row=0;row<rowsPerBand;row++){
       const cell=make('div','roadmap-slot');cell.style.gridColumn=String(2+index);cell.style.gridRow=String(firstRow+row);cell.style.setProperty('--category-color',track.category.color);
       if(track.subcategory.name)cell.classList.add('is-subcategory');
       const cert=entries[row];if(cert&&matches(cert)){
         const chip=make('button','roadmap-chip',abbreviation(cert));chip.type='button';chip.title=cert.name;chip.setAttribute('aria-label',`${cert.name}, ${cert.provider}`);chip.addEventListener('click',()=>openDetail(cert));cell.append(chip);
       }
       results.append(cell);
     }
   });
   firstRow+=rowsPerBand;
 });
 results.style.setProperty('--roadmap-rows',String(firstRow-3));
 compareState();
}
function closeCompare(){ $('#compare-panel').hidden=true;$('#compare-backdrop').hidden=true;document.body.style.overflow='';previousFocus?.focus(); }
function openCompare(){
 const picks=certs.filter(c=>selected.has(c.id));if(picks.length!==2)return;previousFocus=document.activeElement;
 const root=$('#compare-content');root.replaceChildren();const grid=make('div','compare-grid');
 picks.forEach(cert=>{const col=make('section','compare-column');col.append(make('h3','',cert.name),make('p','compare-provider',cert.provider),make('p','',cert.summary));
  for(const [label,value] of [['Level',cert.level||'Not specified'],['Domains',cert.domains.map(domainLabel).join(', ')]]){col.append(make('h4','',label),make('p','',value));}
  const a=make('a','official-link','Official details');a.href=cert.url;a.target='_blank';a.rel='noopener noreferrer';col.append(a);grid.append(col);});
 root.append(grid);$('#compare-backdrop').hidden=false;$('#compare-panel').hidden=false;document.body.style.overflow='hidden';$('#compare-close').focus();
}
$('#filter-toggle').addEventListener('click',()=>{const panel=$('#filter-panel');panel.hidden=!panel.hidden;$('#filter-toggle').setAttribute('aria-expanded',String(!panel.hidden));$('#filter-toggle').textContent=panel.hidden?'Show filters':'Hide filters';});
[search,domain,provider,level].forEach(e=>e.addEventListener(e===search?'input':'change',render));
$('#reset').addEventListener('click',()=>{search.value='';domain.value='';provider.value='';level.value='';render();});
$('#cert-close').addEventListener('click',closeDetail);$('#cert-backdrop').addEventListener('click',closeDetail);
$('#compare-open').addEventListener('click',openCompare);$('#compare-close').addEventListener('click',closeCompare);$('#compare-backdrop').addEventListener('click',closeCompare);
document.addEventListener('keydown',event=>{if(!$('#cert-detail').hidden){if(event.key==='Escape')closeDetail();if(event.key==='Tab'){const items=[...$('#cert-detail').querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}}return;}if($('#compare-panel').hidden)return;if(event.key==='Escape')closeCompare();if(event.key==='Tab'){const items=[...$('#compare-panel').querySelectorAll('button:not([disabled]),a[href]')];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
Promise.all([fetch('certifications.json'),fetch('domains.json')]).then(async responses=>{if(responses.some(r=>!r.ok))throw Error('Unable to load data');return Promise.all(responses.map(r=>r.json()));}).then(([catalog,roadmap])=>{
 certs=catalog.certifications;categories=catalog.roadmap_categories;domains=roadmap.domains;domains.forEach(d=>option(domain,d.id,d.name));[...new Set(certs.map(c=>c.provider))].sort().forEach(v=>option(provider,v,v));[...new Set(certs.map(c=>c.level).filter(Boolean))].sort().forEach(v=>option(level,v,v));
 const requested=new URLSearchParams(location.search).get('domain');if(domains.some(d=>d.id===requested))domain.value=requested;render();
}).catch(()=>{$('#result-count').textContent='Unable to load certification data. Run the site using the local server and try again.';});
