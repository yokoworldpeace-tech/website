'use strict';
(() => {
  const rooms=[
    {id:'origin',name:'溯源识砖',desc:'从清徐的土地与历史出发，认识砖雕的来处。'},
    {id:'patterns',name:'纹样寻意',desc:'沿动物、花木与吉祥图案，读懂砖上的生活愿景。'},
    {id:'craft',name:'工坊探艺',desc:'对照窑前雕与窑后雕，循工序听见制作的过程。'},
    {id:'technique',name:'入院观雕',desc:'比较雕刻深浅与透空关系，看纹样如何进入建筑。'},
    {id:'heritage',name:'匠心传承',desc:'从砖上的图案走近匠人，认识手艺的代际延续。'}
  ];
  // A single state drives every room indicator and navigation entry.
  let state={room:null,progress:0,scene:null,sceneProgress:0,pointer:{x:0,y:0,active:false,speed:0},reducedMotion:false,rendering:false},lockUntil=0,frame=0,returnFocus=null,previousOverflow='';
  const subscribers=new Set();
  let pointerTime=0;
  function inputPoint(e){const now=performance.now(),p=state.pointer,dt=Math.max(8,now-pointerTime);pointerTime=now;state.pointer={x:e.clientX,y:e.clientY,active:true,speed:Math.min(1400,Math.hypot(e.clientX-p.x,e.clientY-p.y)/dt*1000)};document.dispatchEvent(new CustomEvent('qx:pointer',{detail:{...state.pointer,target:e.target,pointerType:e.pointerType}}))}
  document.addEventListener('pointermove',inputPoint,{passive:true});document.addEventListener('pointerdown',inputPoint,{passive:true});
  const header=document.querySelector('header'),actions=el('div','gallery-actions'),position=el('span','gallery-position');position.setAttribute('aria-live','polite');
  const trigger=el('button','gallery-map-toggle');trigger.id='galleryMapToggle';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','galleryMap');trigger.setAttribute('aria-expanded','false');
  const bars=el('span','map-bars');bars.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)bars.append(el('i'));trigger.append(el('span','','展厅导览'),bars);
  actions.append(position,trigger,$('motion'));header.append(actions);
  const dialog=el('dialog','gallery-map');dialog.id='galleryMap';dialog.setAttribute('aria-labelledby','galleryMapTitle');
  const top=el('div','gallery-map-head'),title=el('h2','','展厅导览');title.id='galleryMapTitle';const close=el('button','','关闭');close.setAttribute('aria-label','关闭展厅导览');top.append(title,close);
  const intro=el('p','gallery-map-intro','五个展厅，一条由砖入艺的参观动线。点选展厅，即可前往。');
  const plan=el('nav','floor-plan');plan.setAttribute('aria-label','五厅平面图');
  const buttons=rooms.map((room,i)=>{const b=el('button','plan-room');b.dataset.room=room.id;b.append(el('span','',String(i+1).padStart(2,'0')),el('strong','',room.name));b.onclick=()=>navigate(room.id);plan.append(b);return b});
  plan.append(el('span','plan-courtyard','砖语 · 展览动线'));
  const locationPanel=el('section','gallery-location'),label=el('span','eyebrow','当前位置'),name=el('h3'),description=el('p'),next=el('a','primary');locationPanel.append(label,name,description,next);
  const foot=el('div','gallery-map-foot'),home=el('a','','返回卷首'),notes=el('a','','查看漫游手记');home.href='#home';notes.href='#journeyEnd';foot.append(home,notes);dialog.append(top,intro,plan,locationPanel,foot);document.body.append(dialog);
  function render(){
    const i=rooms.findIndex(r=>r.id===state.room),room=rooms[i];
    position.replaceChildren(el('strong','',i>=0?String(i+1).padStart(2,'0'):'序'),document.createTextNode(room?.name||'砖语 · 卷首'));
    buttons.forEach((b,j)=>{if(j===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
    document.querySelectorAll('header nav a,.journey a').forEach(a=>{const active=a.hash==='#'+state.room;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current',a.closest('.journey')?'step':'location');else a.removeAttribute('aria-current')});
    name.textContent=i>=0?String(i+1).padStart(2,'0')+' / '+room.name:'卷首 / 青砖生花';description.textContent=room?.desc||'将祈愿刻入砖石，把岁月留在院落。由此开启五厅漫游。';
    const destination=i<0?rooms[0]:rooms[i+1];next.href=destination?'#'+destination.id:'#journeyEnd';next.textContent=destination?'下一厅 · '+destination.name+' →':'完成漫游 · 查看手记 →';
    $('readingProgress').style.width=(state.progress*100).toFixed(2)+'%';document.body.dataset.activeRoom=state.room||'home';
  }
  function setState(patch){const changed=patch.room!==undefined&&patch.room!==state.room;state={...state,...patch};$('readingProgress').style.width=(state.progress*100).toFixed(2)+'%';if(changed)render();subscribers.forEach(fn=>fn({...state}))}
  function hide(){if(dialog.open)dialog.close()}
  function navigate(id){hide();const target=$(id);if(!target)return;const isRoom=rooms.some(r=>r.id===id);lockUntil=performance.now()+1200;setState({room:isRoom?id:id==='journeyEnd'?'heritage':null});history.replaceState(null,'','#'+id);target.scrollIntoView({behavior:'instant',block:'start'})}
  trigger.onclick=()=>{if(performance.now()<lockUntil&&state.room)$(state.room).scrollIntoView({behavior:'instant',block:'start'});lockUntil=0;returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';stopCraft();dialog.showModal();trigger.setAttribute('aria-expanded','true');(buttons.find(b=>b.dataset.room===state.room)||buttons[0]).focus()};
  close.onclick=hide;dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;trigger.setAttribute('aria-expanded','false');returnFocus?.focus({preventScroll:true})});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hide()}});
  document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link||link.closest('#imageDialog,#compareDialog'))return;const id=link.hash.slice(1);if(!rooms.some(r=>r.id===id)&&!['home','journeyEnd'].includes(id))return;e.preventDefault();navigate(id)});
  function update(){frame=0;const total=document.documentElement.scrollHeight-innerHeight,progress=total>0?Math.max(0,Math.min(1,scrollY/total)):0;
    let room=state.room;if(performance.now()>=lockUntil){room=null;for(const r of rooms)if($(r.id).getBoundingClientRect().top<180)room=r.id}
    setState({room,progress});
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update)}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('hashchange',()=>{lockUntil=0;schedule()});addEventListener('wheel',()=>{lockUntil=0},{passive:true});
  window.QX_EXHIBITION={getState:()=>({...state}),navigate,subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn)},setExperience:patch=>{const allowed={};for(const key of ['scene','sceneProgress','pointer','reducedMotion','rendering'])if(key in patch)allowed[key]=patch[key];state={...state,...allowed};subscribers.forEach(fn=>fn({...state}))}};render();update();
})();
