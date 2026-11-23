'use strict';
const $ = s => document.querySelector(s);
const search = $('#resource-search'), domain = $('#resource-domain'), type = $('#resource-type'), list = $('#resource-list'), categoryList = $('#category-list');
const make = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text != null) e.textContent = text; return e; };
let resources = [], domains = [], activeCategory = '';
const icons = {
  'Guide':'<path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4z"/>',
  'Course':'<path d="m3 9 9-5 9 5-9 5zM7 11v5c3 3 7 3 10 0v-5M21 9v6"/>',
  'Lab':'<path d="M8 3h8M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8"/>',
  'Tool':'<path d="M14 6a5 5 0 0 0-7 6L3 16l5 5 4-4a5 5 0 0 0 6-7l-3 3-3-3z"/>',
  'Reference':'<path d="M6 3h10l3 3v15H6zM9 10h7M9 14h7M9 18h5M16 3v4h3"/>',
  'Video':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  'Directory':'<path d="M3 6h7l2 2h9v11H3z"/>',
  'Archive':'<path d="M4 7h16v13H4zM3 4h18v3H3zM10 11h4"/>',
  'Learning path':'<path d="M5 19V5h14M8 15l3-3 3 2 4-5"/>',
};
icons.Courses=icons.Course;
const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
function renderCategories() {
  categoryList.replaceChildren();
  for (const category of ['', ...new Set(resources.map(r=>r.group))]) {
    const button=make('button','category-button');button.type='button';button.setAttribute('aria-pressed',String(activeCategory===category));
    const count=category ? resources.filter(r=>r.group===category).length : resources.length;
    button.append(make('span','',category || 'All resources'),make('span','category-count',String(count)));
    button.addEventListener('click',()=>{activeCategory=category;renderCategories();render();});categoryList.append(button);
  }
}
function render() {
 const query=search.value.trim().toLowerCase();
 const visible=resources.filter(r=>(!activeCategory||r.group===activeCategory)&&(!domain.value||r.domains.includes(domain.value))&&(!type.value||r.type===type.value)&&(!query||[r.name,r.description,r.group,r.type].join(' ').toLowerCase().includes(query)));
 $('#resource-count').textContent=`${visible.length} ${visible.length===1?'resource':'resources'}`;
 $('#resource-empty').hidden=visible.length!==0;list.replaceChildren();
 for(const group of [...new Set(resources.map(r=>r.group))]) {
  const entries=visible.filter(r=>r.group===group);if(!entries.length)continue;
  const section=make('section','library-section');const heading=make('h2','library-section-title',group);section.append(heading);
  const grid=make('div','library-items');
  for(const r of entries) {
   const article=make('article','library-item');
   const icon=make('div','library-icon');icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${icons[r.type]||icons.Reference}</svg>`;
   const body=make('div','library-item-body');
   const title=make('h3','library-item-title');const link=make('a','library-item-link',r.name);link.href=r.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`${r.name} (opens in a new tab)`);link.insertAdjacentHTML('beforeend',arrow);title.append(link);
   body.append(title,make('p','library-description',r.description));
   const meta=make('div','library-meta');meta.append(make('span','library-type',r.type));
   if(r.access && r.access!=='Not verified')meta.append(make('span','library-access',r.access));
   for(const id of r.domains){const d=domains.find(x=>x.id===id);if(d){const a=make('a','library-domain',d.name);a.href=`index.html?domain=${encodeURIComponent(id)}`;a.style.setProperty('--domain-color',d.color);meta.append(a);}}
   body.append(meta);if(r.note)body.append(make('p','library-note',r.note));
   article.append(icon,body);grid.append(article);
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

