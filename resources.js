'use strict';
const $ = s => document.querySelector(s);
const search = $('#resource-search'), domain = $('#resource-domain'), type = $('#resource-type'), list = $('#resource-list'), categoryList = $('#category-list');
const make = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text != null) e.textContent = text; return e; };
let resources = [], domains = [], activeCategory = '';
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
function renderCategories() {
  categoryList.replaceChildren();
  for (const category of ['', ...new Set(resources.map(r=>r.group))]) {
    const button=make('button','category-button');button.type='button';button.setAttribute('aria-pressed',String(activeCategory===category));
    const count=category ? resources.filter(r=>r.group===category).length : resources.length;
    button.append(make('span','',category || 'All resources'),make('span','category-count',String(count)));
    button.addEventListener('click',()=>{activeCategory=category;for(const item of categoryList.children)item.setAttribute('aria-pressed',String(item===button));render();});categoryList.append(button);
  }
}
function render() {
 const query=search.value.trim().toLowerCase();
 const visible=resources.filter(r=>(!activeCategory||r.group===activeCategory)&&(!domain.value||r.domains.includes(domain.value))&&(!type.value||r.type===type.value)&&(!query||[r.name,r.description,r.group,r.type].join(' ').toLowerCase().includes(query)));
 $('#resource-count').textContent=`${visible.length} ${visible.length===1?'resource':'resources'}`;
 $('#resource-empty').hidden=visible.length!==0;$('#resource-reset').hidden=!(activeCategory||domain.value||type.value||search.value.trim());list.replaceChildren();
 for(const group of [...new Set(resources.map(r=>r.group))]) {
  const entries=visible.filter(r=>r.group===group);if(!entries.length)continue;
  const section=make('section','library-section');const heading=make('h2','library-section-title',group);section.append(heading);
  const grid=make('div','library-items');
  for(const r of entries) {
   const article=make('article','library-item');
   const body=make('div','library-item-body');
   const title=make('h3','library-item-title');const link=make('a','library-item-link',r.name);link.href=r.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`${r.name} (opens in a new tab)`);link.insertAdjacentHTML('beforeend',arrow);title.append(link);
   body.append(title,make('p','library-description',r.description));
   const meta=make('div','library-meta');meta.append(make('span','library-type',r.type));
   if(r.access && r.access!=='Not verified')meta.append(make('span','library-access',r.access));
   for(const id of r.domains){const d=domains.find(x=>x.id===id);if(d){const a=make('a','library-domain',d.name);a.href=`index.html?domain=${encodeURIComponent(id)}`;a.style.setProperty('--domain-color',d.color);meta.append(a);}}
   body.append(meta);if(r.note)body.append(make('p','library-note',r.note));
   article.append(body);grid.append(article);
  }
  section.append(grid);list.append(section);
 }
}
Promise.all([fetch('resources.json'),fetch('domains.json')]).then(async responses=>{if(responses.some(r=>!r.ok))throw Error('Unable to load data');return Promise.all(responses.map(r=>r.json()));}).then(([catalog,roadmap])=>{
 resources=catalog.resources;domains=roadmap.domains;
 for(const d of domains){const o=make('option','',d.name);o.value=d.id;domain.append(o);}
 for(const t of [...new Set(resources.map(r=>r.type))].sort()){const o=make('option','',t);o.value=t;type.append(o);}
 const requested=new URLSearchParams(location.search).get('domain');if(domains.some(d=>d.id===requested))domain.value=requested;
 renderCategories();render();
}).catch(()=>{$('#resource-count').textContent='Unable to load resources. Start the local server and try again.';});
[search,domain,type].forEach(e=>e.addEventListener(e===search?'input':'change',render));
$('#resource-reset').addEventListener('click',()=>{search.value='';domain.value='';type.value='';activeCategory='';renderCategories();render();search.focus();});

