/* A progressive, native-scroll exhibition. Existing nodes and their handlers are retained. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
 const clamp=v=>Math.max(0,Math.min(1,v)), smooth=v=>v*v*(3-2*v);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const abort=new AbortController(),signal=abort.signal;
 const panels=[],rooms=[],originalText=new Map();
 const retainedNodes=[...document.querySelector('main').querySelectorAll('*')].flatMap(n=>[...n.childNodes].filter(t=>t.nodeType===3&&t.textContent.trim()));
 const baseline={text:document.querySelector('main').textContent.replace(/\s/g,''),images:all('main img').length};
 const state={room:'home',scene:0,progress:0,global:0,modal:false,reading:false};
 let frame=0,last=0,stable=0,active=-1,autoHistory=-1,autoStep=-1,manualY=null,previousY=scrollY;
 const names={home:'卷首 · 一砖一世界',origin:'溯源识砖',patterns:'纹样寻意',craft:'工坊探艺',technique:'入院观雕',heritage:'匠心传承',journeyEnd:'漫游手记'};
 function take(root,selector){return [...root.querySelectorAll(':scope > '+selector)]}
 function chunks(root,selector,size){const grid=root.querySelector(selector);if(!grid)return[];const children=[...grid.children],result=[];for(let i=0;i<children.length;i+=size){const box=i?document.createElement('div'):grid;if(i)box.className=grid.className;children.slice(i,i+size).forEach(c=>box.append(c));result.push(box)}return result}
 function setup(id,groups){
   const root=document.getElementById(id),stage=document.createElement('div');stage.className='narrative-stage';
   const bar=document.createElement('div');bar.className='narrative-caption';
   const hall=document.createElement('span');hall.textContent=names[id];const title=document.createElement('span');bar.append(hall,title);
   const light=document.createElement('div');light.className='narrative-light';light.setAttribute('aria-hidden','true');stage.append(bar,light);
   groups.forEach(([label,nodes,kind,weight=1])=>{
     nodes=nodes.flat().filter(Boolean);if(!nodes.length)return;
     const panel=document.createElement('section');panel.className='narrative-panel '+(kind||'');panel.setAttribute('aria-label',label);
     const body=document.createElement('div');body.className='narrative-content';nodes.forEach(n=>body.append(n));panel.append(body);stage.append(panel);
     const p={panel,body,id,label,weight,index:panels.length,local:0};panels.push(p);
     originalText.set(panel,body.textContent);
   });
   // Move every remaining original node into a final scene rather than dropping content.
   const rest=[...root.children].filter(n=>n!==stage);
   if(rest.length){const body=document.createElement('div');body.className='narrative-content';rest.forEach(n=>body.append(n));const panel=document.createElement('section');panel.className='narrative-panel';panel.setAttribute('aria-label','补充阅读');panel.append(body);stage.append(panel);panels.push({panel,body,id,label:'补充阅读',weight:1,index:panels.length,local:0})}
   root.classList.add('narrative-room');root.append(stage);rooms.push({root,stage,title,id,panels:panels.filter(p=>p.id===id)});
 }
 const home=document.getElementById('home'),homeCopy=document.createElement('div');homeCopy.className='narrative-hero';while(home.firstChild)homeCopy.append(home.firstChild);
 setup('home',[['一砖一世界',[homeCopy,document.querySelector('.journey')],'scene-home',1.1]]);
 let r=document.getElementById('origin'),sub=take(r,'.subhead');
 setup('origin',[
  ['清徐 · 砖雕的来处',[r.querySelector('.chapter-head'),r.querySelector('.origin-grid')],'scene-origin'],
  ['从信仰走向生活',[sub[0],r.querySelector('#origins')],'scene-prose'],
  ['历史四章',[sub[1],r.querySelector('.timeline-scrub'),r.querySelector('#timeline'),r.querySelector('.history-detail')],'scene-history',2.4],
  ['三种文化表达',[sub[2],r.querySelector('#themes'),r.querySelector('.next-link')],'scene-themes']
 ]);
 r=document.getElementById('patterns');sub=take(r,'.subhead');const meaning=chunks(r,'#meaningGrid',4);
 setup('patterns',[
  ['有图必有意',[r.querySelector('.chapter-head'),r.querySelector('.section-lead'),r.querySelector('.chart-intro'),r.querySelector('#categoryChart'),r.querySelector('#wishControls'),r.querySelector('#wishHint')],'scene-taxonomy'],
  ['循纹寻意',[r.querySelector('#patternFilters'),r.querySelector('.pattern-layout'),r.querySelector('.orbit-navigation')],'scene-orbit',2.1],
  ...meaning.map((g,i)=>['纹样寓意 · '+(i+1),[...(i===0?[sub[0],r.querySelector('#meaning')]:[]),g,...(i===meaning.length-1?[r.querySelector('.next-link')]:[])],'scene-meanings'])
 ]);
 r=document.getElementById('craft');sub=take(r,'.subhead');
 setup('craft',[
  ['泥火淬炼',[r.querySelector('.chapter-head'),r.querySelector('#craftIntro')],'scene-prose'],
  ['循序听见制作',[r.querySelector('.craft-top'),r.querySelector('.craft-diagram'),r.querySelector('.craft-layout'),r.querySelector('#steps')],'scene-craft',2.7],
  ['两条制作路径',[r.querySelector('.flow-compare')],'scene-flow'],
  ['工艺的取舍',[r.querySelector('.craft-notes')],'scene-prose'],
  ['同源而异彩',[sub[0],r.querySelector('.schools-layout'),r.querySelector('.next-link')],'scene-schools']
 ]);
 r=document.getElementById('technique');sub=take(r,'.subhead');
 setup('technique',[
  ['深浅成境 · 构图与表现',[r.querySelector('.chapter-head'),r.querySelector('.two-columns')],'scene-composition'],
  ['四种雕刻技法',[sub[0],r.querySelector('.compare-launch'),r.querySelector('#techCards'),r.querySelector('.tech-description')],'scene-tech'],
  ['十四件工具',[sub[1],r.querySelector('#toolOrbit'),r.querySelector('#toolCaption')],'scene-tools'],
  ['砖雕进入建筑',[sub[2],r.querySelector('#architecture')],'scene-prose'],
  ['由局部，看见院落',[r.querySelector('.building-story'),r.querySelector('#buildings'),r.querySelector('.next-link')],'scene-buildings']
 ]);
 r=document.getElementById('heritage');sub=take(r,'.subhead');
 setup('heritage',[
  ['手艺有温度',[r.querySelector('.chapter-head'),r.querySelector('.heritage-banner')],'scene-prose'],
  ['传承的脉络',[sub[0],r.querySelector('#inheritance')],'scene-prose'],
  ['一门手艺，代际延续',[r.querySelector('#generations'),r.querySelector('.micro')],'scene-generations'],
  ['走近韩永胜',[r.querySelector('.person-layout'),r.querySelector('.next-link')],'scene-person']
 ]);
 r=document.getElementById('journeyEnd');setup('journeyEnd',[['带走砖上的心意',[[...r.children]],'scene-ending']]);
 const tail=document.createElement('div');tail.className='narrative-tail';tail.setAttribute('aria-hidden','true');document.querySelector('main').append(tail);
 document.body.classList.add('pinned-exhibition');document.documentElement.style.scrollBehavior='auto';
 all('.reveal-item').forEach(n=>n.classList.add('reveal-visible'));
 const hud=document.createElement('aside');hud.className='narrative-hud';
 hud.innerHTML='<span class="narrative-status" aria-live="polite"></span><div class="narrative-meter" aria-hidden="true"><i></i></div><div class="narrative-controls"><button type="button" data-action="prev" aria-label="上一幕">←</button><button type="button" data-action="read">完整阅读</button><button type="button" data-action="next">下一幕 →</button><button type="button" data-action="mode">图文模式</button></div>';
 document.body.append(hud);const status=hud.querySelector('.narrative-status'),meter=hud.querySelector('i');
 const reader=document.createElement('dialog');reader.className='narrative-reader';reader.setAttribute('aria-labelledby','narrativeReaderTitle');reader.innerHTML='<div class="narrative-reader-top"><h2 id="narrativeReaderTitle"></h2><button type="button" aria-label="关闭全文">关闭 ×</button></div><div class="narrative-reader-body"></div>';document.body.append(reader);
 let readingPanel=null,placeholder=null,focusBefore=null;
 function read(){const p=panels[active];if(!p)return;stopCraft();focusBefore=document.activeElement;readingPanel=p;placeholder=document.createComment('reader');p.body.before(placeholder);reader.querySelector('h2').textContent=p.label;reader.querySelector('.narrative-reader-body').append(p.body);reader.showModal();document.body.style.overflow='hidden';reader.querySelector('button').focus()}
 reader.querySelector('button').onclick=()=>reader.close();reader.addEventListener('close',()=>{if(placeholder&&readingPanel){placeholder.replaceWith(readingPanel.body);readingPanel=null;placeholder=null}document.body.style.overflow='';focusBefore?.focus({preventScroll:true});measure();wake()},{signal});
 function regular(){return state.reading||reduced.matches||!motion||innerWidth<760||innerHeight<590}
 function measure(){
  const top=Math.ceil(document.querySelector('header').getBoundingClientRect().height)+12;document.documentElement.style.setProperty('--exhibit-top',top+'px');document.documentElement.style.setProperty('--exhibit-height',Math.max(300,innerHeight-top-116)+'px');
  document.body.classList.toggle('narrative-regular',regular());
  rooms.forEach(room=>{let offset=0;room.panels.forEach(p=>{p.offset=offset;offset+=p.weight});room.weight=offset;room.travel=offset*innerHeight*.85;room.root.style.setProperty('--room-height',room.travel+'px')});
  requestAnimationFrame(()=>panels.forEach(p=>{if(p.body.parentElement!==p.panel)return;p.panel.classList.toggle('has-overflow',p.body.scrollHeight>p.panel.clientHeight-32)}));
 }
 function desired(){const top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--exhibit-top'))||100;let room=rooms[0];for(const x of rooms){if(x.root.getBoundingClientRect().top<=top+10)room=x}const y=clamp((top-room.root.getBoundingClientRect().top)/room.travel)*room.weight;let p=room.panels[room.panels.length-1];for(const x of room.panels)if(y<x.offset+x.weight){p=x;break}return {room,p,q:clamp((y-p.offset)/p.weight)}}
 function go(index,localProgress=.22){index=Math.max(0,Math.min(panels.length-1,index));const p=panels[index],room=rooms.find(r=>r.id===p.id),top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--exhibit-top'))||100;
  if(regular()){p.panel.scrollIntoView({behavior:'instant',block:'start'})}else window.scrollTo({top:scrollY+room.root.getBoundingClientRect().top-top+(p.offset+p.weight*localProgress)*innerHeight*.85,behavior:'instant'});
  history.replaceState(null,'','#'+p.id);manualY=null;wake()
 }
 hud.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.action;if(action==='prev')go(active-1);if(action==='next')go(active+1);if(action==='read')read();if(action==='mode'){state.reading=!state.reading;e.target.textContent=state.reading?'沉浸模式':'图文模式';const at=active;measure();requestAnimationFrame(()=>go(at))}},{signal});
 document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link||link.closest('dialog'))return;const index=panels.findIndex(p=>p.id===link.hash.slice(1));if(index<0)return;e.preventDefault();e.stopImmediatePropagation();if(location.hash!==link.hash)history.pushState(null,'',link.hash);go(index)},{capture:true,signal});
 function syncContent(p,q){
  if(manualY!==null&&Math.abs(scrollY-manualY)<32)return;
  if(p.panel.classList.contains('scene-history')){const i=Math.min(3,Math.floor(q*4));if(i!==autoHistory){autoHistory=i;selectHistory(i,document.getElementById('timeline').children[i])}}
  if(p.panel.classList.contains('scene-craft')&&!playTimer){const i=Math.min(C.routes[route].length-1,Math.floor(q*C.routes[route].length));if(i!==autoStep){autoStep=i;step=i;drawCraft()}}
 }
 document.addEventListener('click',e=>{if(e.target.closest('#timeline,#historyScrub,#craftWheel,#steps,[data-route],#stepPrev,#stepNext,#playCraft'))manualY=scrollY},{capture:true,signal});
 document.getElementById('historyScrub').addEventListener('input',()=>{manualY=scrollY},{signal});
 let turn=0,spread=0,kick=0,orbitError=0;
 function orbit(p,q,dt){if(!p.panel.classList.contains('scene-orbit')){orbitError=0;return}const goal=(-.28+clamp((q-.12)/.7)*2.2);turn+=(goal-turn)*(1-Math.exp(-12*dt));orbitError=Math.abs(goal-turn);spread+=(kick-spread)*(1-Math.exp(-9*dt));kick*=Math.exp(-5*dt);const nodes=all('#patternOrbit .pattern-node');nodes.forEach((n,i)=>{const a=i/nodes.length*Math.PI*2-Math.PI/2+orbitAngle+turn,rad=38+spread*Math.sin(i*1.7+1);n.style.left=50+rad*Math.cos(a)+'%';n.style.top=50+rad*Math.sin(a)+'%'});document.getElementById('patternOrbit').dataset.scrollAngle=turn.toFixed(4)}
 function update(t){frame=0;if(document.hidden)return;state.modal=!!document.querySelector('dialog[open]');if(state.modal)return;
  const dt=Math.min(.04,(t-last)/1000||.016);last=t;
  if(regular()){panels.forEach(p=>{p.panel.inert=false;p.panel.removeAttribute('aria-hidden')});const near=panels.reduce((best,p)=>Math.abs(p.panel.getBoundingClientRect().top-180)<Math.abs(best.panel.getBoundingClientRect().top-180)?p:best,panels[0]);if(near){active=near.index;state.room=near.id;state.scene=near.index;all('header nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+near.id))}return}
  const {room,p,q}=desired();state.room=p.id;state.scene=p.index;state.progress=q;state.global=(p.index+q)/panels.length;document.body.dataset.narrativeRoom=p.id;
  if(active!==p.index){if(active>=0&&panels[active].id==='craft'&&p.id!=='craft')stopCraft();active=p.index;panels.forEach(x=>{const yes=x===p;x.panel.classList.toggle('is-current',yes);x.panel.inert=!yes;x.panel.setAttribute('aria-hidden',String(!yes))});status.textContent=names[p.id]+' · '+p.label;room.title.textContent=String(room.panels.indexOf(p)+1).padStart(2,'0')+' / '+String(room.panels.length).padStart(2,'0');all('header nav a').forEach(a=>{const yes=a.hash==='#'+p.id;a.classList.toggle('active',yes);if(yes)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});hud.querySelector('[data-action=prev]').disabled=p.index===0;hud.querySelector('[data-action=next]').disabled=p.index===panels.length-1;hud.querySelector('[data-action=next]').textContent=p.index===panels.length-1?'已到终幕':'下一幕 →';hud.dataset.scene=String(p.index);hud.dataset.room=p.id}
  const first=p.index===0,lastScene=p.index===panels.length-1;const incoming=first?1:smooth(clamp(q/.14)),outgoing=lastScene?0:smooth(clamp((q-.88)/.12));const alpha=incoming;
  rooms.forEach(x=>{x.root.classList.toggle('is-room',x===room);x.stage.style.opacity='1'});
  panels.forEach(x=>{if(x!==p)x.panel.style.opacity='0'});
  const previous=panels[p.index-1];if(previous&&incoming<1){previous.panel.style.opacity=String(1-incoming);previous.panel.style.transform='translate3d(0,'+(-incoming*20)+'px,0)';const pr=rooms.find(x=>x.id===previous.id);if(pr!==room){pr.root.classList.add('is-room');previous.panel.style.opacity='1';room.stage.style.opacity=String(incoming)}}
  p.panel.classList.toggle('has-overflow',p.body.scrollHeight>p.panel.clientHeight-32);
  p.panel.style.opacity=String(alpha);p.panel.style.transform='translate3d(0,'+((1-incoming)*25-outgoing*20)+'px,0)';room.stage.style.setProperty('--scene-transition',String(Math.max(1-incoming,outgoing)*.45));room.stage.style.zIndex='4';rooms.filter(x=>x!==room).forEach(x=>x.stage.style.zIndex='3');
  hud.dataset.progress=q.toFixed(4);meter.style.transform='scaleX('+state.global+')';document.getElementById('readingProgress').style.width=state.global*100+'%';syncContent(p,q);orbit(p,q,dt);
  stable=Math.abs(kick)+Math.abs(spread)+orbitError>.008?0:stable+1;if(stable<3)frame=requestAnimationFrame(update);
 }
 function wake(){stable=0;if(!frame&&!document.hidden&&!document.querySelector('dialog[open]')){last=performance.now();frame=requestAnimationFrame(update)}}
 addEventListener('scroll',()=>{const d=Math.abs(scrollY-previousY);previousY=scrollY;kick=Math.min(2,kick+d*.01);wake()},{passive:true,signal});
 addEventListener('resize',()=>{const at=active,q=state.progress;measure();requestAnimationFrame(()=>{if(at>=0)go(at,q);else wake()})},{signal});document.addEventListener('visibilitychange',wake,{signal});
 document.addEventListener('click',e=>{if(e.target.closest('#patternFilters,#wishControls,#orbitPrev,#orbitNext,#patternOrbit'))wake()},{signal});
 const modals=new MutationObserver(()=>{wake()});all('dialog').forEach(d=>modals.observe(d,{attributes:true,attributeFilter:['open']}));
 reduced.addEventListener('change',()=>{measure();wake()},{signal});document.getElementById('motion').addEventListener('click',()=>{measure();wake()},{signal});
 new ResizeObserver(()=>{requestAnimationFrame(()=>{if(!state.modal)panels.forEach(p=>{if(p.body.parentElement===p.panel)p.panel.classList.toggle('has-overflow',p.body.scrollHeight>p.panel.clientHeight-32)})})}).observe(document.querySelector('main'));
 measure();wake();document.fonts.ready.then(()=>{measure();wake()});
 document.body.dataset.narrativeTextNodes=String(retainedNodes.length);document.body.dataset.narrativeTextNodesRetained=String(retainedNodes.filter(n=>n.isConnected).length);
 document.body.dataset.narrativeScenes=String(panels.length);document.body.dataset.narrativeOriginalImages=String(baseline.images);document.body.dataset.narrativeRetainedImages=String(document.querySelectorAll('main img').length);
 window.QX_NARRATIVE={getState:()=>({...state}),navigate:go,scenes:panels.map(p=>({room:p.id,title:p.label})),baseline};
 const hash=location.hash.slice(1);if(hash){const i=panels.findIndex(p=>p.id===hash);if(i>=0)requestAnimationFrame(()=>go(i))}
 addEventListener('popstate',()=>{const i=panels.findIndex(p=>p.id===location.hash.slice(1));if(i>=0)go(i)},{signal});
 addEventListener('hashchange',()=>{const i=panels.findIndex(p=>p.id===location.hash.slice(1));if(i>=0)go(i)},{signal});
 addEventListener('pagehide',e=>{cancelAnimationFrame(frame);if(!e.persisted){abort.abort();modals.disconnect()}},{signal});addEventListener('pageshow',wake,{signal});
})();

