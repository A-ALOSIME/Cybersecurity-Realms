'use strict';
const $ = s => document.querySelector(s);
const search = $('#resource-search'), domain = $('#resource-domain'), type = $('#resource-type'), list = $('#resource-list');
const make = (tag, className, content) => { const e = document.createElement(tag); if (className) e.className = className; if (content != null) e.textContent = content; return e; };
let resources = [], domains = [];
function render() {
 const q = search.value.trim().toLowerCase();
 const visible = resources.filter(r => (!domain.value || r.domains.includes(domain.value)) && (!type.value || r.type === type.value) && (!q || [r.name,r.description,r.group,r.type].join(' ').toLowerCase().includes(q)));
 $('#resource-count').textContent = `${visible.length} of ${resources.length} resources`;
 $('#resource-empty').hidden = visible.length !== 0; list.replaceChildren();
 for (const group of [...new Set(resources.map(r => r.group))]) {
  const entries = visible.filter(r => r.group === group); if (!entries.length) continue;
  const section = make('section','resource-section'), heading = make('div','resource-section-heading');
  heading.append(make('h2','',group),make('span','',String(entries.length).padStart(2,'0'))); section.append(heading);
  const grid = make('div','resource-grid');
  for (const r of entries) {
   const article = make('article','resource-item'), top = make('div','resource-item-top');
   const meta = make('div','resource-meta'); meta.append(make('span','resource-type',r.type),make('span','resource-access',r.access)); top.append(meta);
   const link = make('a','resource-link',r.name); link.href=r.url; link.target='_blank'; link.rel='noopener noreferrer'; link.setAttribute('aria-label',`${r.name} (opens in a new tab)`);
   const arrow=make('span','resource-arrow','?'); arrow.setAttribute('aria-hidden','true'); link.append(arrow);
   const title=make('h3','resource-title');title.append(link);article.append(top,title,make('p','resource-description',r.description));
   if(r.note) article.append(make('p','resource-note',r.note));
   if(r.domains.length){const tags=make('div','resource-domains');for(const id of r.domains){const d=domains.find(x=>x.id===id);if(d){const a=make('a','resource-domain',d.name);a.href=`index.html?domain=${encodeURIComponent(id)}`;a.style.setProperty('--domain-color',d.color);tags.append(a);}}article.append(tags);}
   grid.append(article);
  }
  section.append(grid);list.append(section);
 }
}
Promise.all([fetch('resources.json'),fetch('domains.json')]).then(async responses=>{if(responses.some(r=>!r.ok))throw Error('Unable to load data');return Promise.all(responses.map(r=>r.json()));}).then(([catalog,roadmap])=>{
 resources=catalog.resources;domains=roadmap.domains;
 for(const d of domains){const o=make('option','',d.name);o.value=d.id;domain.append(o);}
 for(const t of [...new Set(resources.map(r=>r.type))].sort()){const o=make('option','',t);o.value=t;type.append(o);}
 const requested=new URLSearchParams(location.search).get('domain');if(domains.some(d=>d.id===requested))domain.value=requested;render();
}).catch(()=>{$('#resource-count').textContent='Unable to load resources. Start the local server and try again.';});
[search,domain,type].forEach(e=>e.addEventListener(e===search?'input':'change',render));
$('#resource-reset').addEventListener('click',()=>{search.value='';domain.value='';type.value='';render();search.focus();});

