'use strict';
const $ = (selector) => document.querySelector(selector);
const status = $('#status'), list = $('#list-view'), map = $('#map-view'), drawer = $('#details'), backdrop = $('#backdrop');
let data, previousFocus;
const icons = {
 target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 shield:'<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"/><circle cx="12" cy="12" r="7.5"/>',
 scale:'<path d="M12 3v17M5 7h14M12 3l-2 4m2-4 2 4M5 7l-3 7h6L5 7Zm14 0-3 7h6l-3-7ZM8 21h8"/>',
 server:'<rect x="3" y="4" width="18" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h7M11 16.5h7"/>'
};
function el(tag, className, text) { const element = document.createElement(tag); if (className) element.className = className; if (text != null) element.textContent = text; return element; }
function tree(items, color, clickable = false) {
 const ul = el('ul','tree'); ul.style.setProperty('--color',color);
 for (const item of items) { const li = el('li'); if(clickable) { const b=el('button','specialty-button',item.name); b.type='button'; b.addEventListener('click',()=>openDetails(item, color)); li.append(b); } else li.append(document.createTextNode(item.name)); if(item.children?.length) li.append(tree(item.children,color,clickable)); ul.append(li); } return ul;
}
function openDetails(item, color) {
 if (drawer.hidden) previousFocus = document.activeElement;
 const content=$('#detail-content'); content.replaceChildren(); content.style.setProperty('--color',color || '#B7A2E8');
 const title=el('h2','',item.name); title.id='detail-title'; content.append(title);
 if(item.description) content.append(el('p','',item.description));
 else content.append(el('p','',`A specialty within ${item.parentName || 'cybersecurity'}. Explore how it connects to the broader domain.`));
 if(item.specialties && item.related_certs?.length){ const related=el('p','drawer-cert-link'); const link=el('a','','Explore related certifications'); link.href='certifications.html?domain='+encodeURIComponent(item.id); related.append(link); content.append(related); }
 if(item.specialties){const related=el('p','drawer-cert-link');const link=el('a','','Explore related resources');link.href='resources.html?domain='+encodeURIComponent(item.id);related.append(link);content.append(related);}
 const children=item.specialties || item.children || [];
 if(children.length){content.append(el('h3','','SPECIALTIES')); content.append(tree(children,color));}
 if(item.id==='offensive'||item.id==='defense'){ const note=el('p','drawer-bridge'); note.append('Connected through '); const b=el('button','','Purple Teaming'); b.type='button'; b.addEventListener('click',()=>openDetails(data.bridges[0], '#B7A2E8')); note.append(b); content.append(note); }
 if(item.connects){content.append(el('h3','','CONNECTS')); for(const id of item.connects){const d=data.domains.find(x=>x.id===id); if(d){const p=el('p','drawer-bridge');const b=el('button','',d.name);b.style.color=d.color;b.addEventListener('click',()=>openDetails(d,d.color));p.append(b);content.append(p);}}}
 backdrop.hidden=false;drawer.hidden=false;document.body.style.overflow='hidden';$('#close-details').focus();
}
function closeDetails(){drawer.hidden=true;backdrop.hidden=true;document.body.style.overflow='';if(previousFocus)previousFocus.focus();}
$('#close-details').addEventListener('click',closeDetails);backdrop.addEventListener('click',closeDetails);
document.addEventListener('keydown',event=>{if(drawer.hidden)return;if(event.key==='Escape')closeDetails(); if(event.key==='Tab'){const controls=[...drawer.querySelectorAll('button:not([disabled]),a[href]')];if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
function renderList(){
 list.replaceChildren();
 const pair=el('div','domain-pair');
 data.domains.forEach(domain=>{
   const section=el('section','domain-card'); section.style.setProperty('--color',domain.color);
   const button=el('button','domain-title'); button.type='button';
   button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[domain.icon] || ''}</svg>`;
   button.append(document.createTextNode(domain.name)); button.addEventListener('click',()=>openDetails(domain,domain.color));
   section.append(button,tree(domain.specialties,domain.color,true));
   if(domain.id==='offensive'||domain.id==='defense')pair.append(section);
   else list.append(section);
 });
 const bridge=el('div','bridge-note'), bridgeButton=el('button','','Purple Teaming');
 bridgeButton.type='button'; bridgeButton.addEventListener('click',()=>openDetails(data.bridges[0],'#B7A2E8'));
 bridge.append(bridgeButton);pair.append(bridge);
 list.prepend(pair);
}
function renderGraph(){
 if(!window.d3)return;
 const columnWidth=408, left=26, headingY=90, firstY=170, gap=43, childGap=36;
 const sections=data.domains.map((domain,index)=>{
   let cursor=firstY;
   const entries=domain.specialties.map(item=>{
     const entry={item,y:cursor,children:[]}; cursor+=gap;
     (item.children||[]).forEach(child=>{entry.children.push({item:child,y:cursor});cursor+=childGap;});
     return entry;
   });
   return {domain,index,x:left+index*columnWidth,entries};
 });
 const bottom=Math.max(...sections.map(s=>{
   const last=s.entries.at(-1);
   return last ? (last.children.at(-1)?.y ?? last.y) : firstY;
 }));
 const svg=d3.select('#graph').attr('viewBox',`0 0 ${left*2+sections.length*columnWidth} ${bottom+55}`);
 svg.selectAll('*').remove();
 const g=svg.append('g');
 const activate=(node,item,color)=>node.attr('role','button').attr('tabindex',0).attr('aria-label',`Explore ${item.name}`)
   .on('click',()=>openDetails(item,color))
   .on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetails(item,color);}});
 const offensive=sections.find(s=>s.domain.id==='offensive'), defense=sections.find(s=>s.domain.id==='defense');
 if(offensive && defense){
   const a=offensive.x+19,b=defense.x+19, mid=(a+b)/2;
   g.append('path').attr('d',`M${a},${headingY-11} V32 H${b} V${headingY-11}`).attr('fill','none').attr('stroke','#B7A2E8').attr('stroke-width',1.4);
   const bridge=g.append('g').attr('class','map-node bridge').attr('transform',`translate(${mid},32)`);
   activate(bridge,data.bridges[0],'#B7A2E8');
   bridge.append('rect').attr('x',-70).attr('y',-13).attr('width',140).attr('height',26).attr('fill','#151515');
   bridge.append('text').attr('class','bridge-label').attr('text-anchor','middle').attr('dy','.35em').text('Purple Teaming');
 }
 sections.forEach(({domain,x,entries})=>{
   const section=g.append('g').attr('class','map-section').attr('data-domain',domain.id).attr('transform',`translate(${x},0)`);
   const root=section.append('g').attr('class','map-node domain').attr('transform',`translate(0,${headingY})`);
   activate(root,domain,domain.color);
   root.append('rect').attr('x',0).attr('y',-19).attr('width',380).attr('height',38).attr('fill','transparent');
   const icon=root.append('svg').attr('class','node-icon').attr('x',8).attr('y',-11).attr('width',22).attr('height',22).attr('viewBox','0 0 24 24').style('color',domain.color);
   icon.html(icons[domain.icon]||'');
   root.append('text').attr('class','domain-label').attr('x',42).attr('dy','.35em').style('fill',domain.color).text(domain.name);
   if(entries.length){
     section.append('path').attr('d',`M19,${headingY+18} V${entries.at(-1).y}`).attr('fill','none').attr('stroke',domain.color).attr('stroke-opacity',.65);
   }
   entries.forEach(({item,y,children})=>{
     section.append('path').attr('d',`M19,${y} H33`).attr('fill','none').attr('stroke',domain.color).attr('stroke-opacity',.65);
     const node=section.append('g').attr('class','map-node specialty').attr('transform',`translate(34,${y})`);
     activate(node,item,domain.color);
     node.append('rect').attr('x',0).attr('y',-16).attr('width',350).attr('height',32).attr('fill','transparent');
     node.append('text').attr('class','node-label').attr('x',9).attr('dy','.35em').text(item.name);
     if(children.length){
       section.append('path').attr('d',`M34,${y+5} V${y+16} H55 V${children.at(-1).y}`).attr('fill','none').attr('stroke',domain.color).attr('stroke-opacity',.5);
       children.forEach(child=>{
         section.append('path').attr('d',`M55,${child.y} H67`).attr('fill','none').attr('stroke',domain.color).attr('stroke-opacity',.5);
         const sub=section.append('g').attr('class','map-node specialty child').attr('transform',`translate(68,${child.y})`);
         activate(sub,child.item,domain.color);
         sub.append('rect').attr('x',0).attr('y',-16).attr('width',310).attr('height',32).attr('fill','transparent');
         sub.append('text').attr('class','minor-label').attr('x',9).attr('dy','.35em').text(child.item.name);
       });
     }
   });
 });
}
function setActive(view){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{const view=button.dataset.view;setActive(view);map.hidden=view!=='map';list.hidden=view!=='list';status.textContent='';if(view==='map'&&!window.d3){map.hidden=true;list.hidden=false;setActive('list');status.textContent='The map requires an internet connection for D3.js. List view is available.';}}));
fetch('domains.json').then(response=>{if(!response.ok)throw Error('Unable to load domains.json');return response.json();}).then(json=>{data=json;data.domains.forEach(d=>{function mark(items){items.forEach(i=>{i.parentName=d.name;mark(i.children||[]);});}mark(d.specialties);});status.textContent='';renderList();list.hidden=false;renderGraph();const wanted=new URLSearchParams(location.search).get('domain');const target=data.domains.find(d=>d.id===wanted);if(target)openDetails(target,target.color);}).catch(()=>{status.textContent='Unable to load domains.json. Start a local web server in this folder, then open its address in your browser.';});

