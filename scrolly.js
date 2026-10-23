'use strict';
(() => {
  const chapters = [
    {id:'origin',name:'溯源识砖',steps:[
      ['从一方土地开始','清徐，位于山西省中部。先找到这门手艺生长的地方，再沿着砖石上的痕迹走进它的历史。','2-20','山西 · 太原 · 清徐'],
      ['从构件走向装饰','砖雕的用途与表现随着历史变化。墓室、建筑与日常生活，逐渐成为理解砖雕的不同入口。','2-116','从历史走向生活'],
      ['装饰，也是愿望','祈福纳吉、伦理教化、驱灾辟邪，构成三种文化表达。接下来，试着读懂藏在图案中的心意。','2-21','图案背后的人生愿望']
    ]},
    {id:'patterns',name:'纹样寻意',steps:[
      ['一只蝠，一份福','蝙蝠借“蝠”与“福”的谐音，表达祈福的愿望。线条组成形象，形象又通向日常生活的期盼。','2-146','动物纹样 · 蝙蝠'],
      ['花木，也有寄托','牡丹承载富贵吉祥的寓意。沿花瓣与枝叶细看，感受植物形象如何被组织成砖上的装饰语言。','2-103','植物纹样 · 牡丹'],
      ['从单个形象到一套语言','动物、植物、人物及文字、器物，构成四类纹样。下方图表展示本展收录种类，点选即可继续探索。','2-140','四类纹样 · 二十种形象']
    ]},
    {id:'craft',name:'工坊探艺',steps:[]},
    {id:'technique',name:'入院观雕',steps:[
      ['先读线，再看面','深浅、轮廓和透空，让同一块砖产生不同的观看层次。先观察浅浮雕的线面关系。','3-18','雕刻技法 · 浅浮雕'],
      ['让形体从砖面中走出来','继续观察高浮雕，比较主体与底面的层次。下方双图对照，可以把两种技法放在一起细看。','3-19','雕刻技法 · 高浮雕'],
      ['走进院落，看见整体','当雕刻进入影壁、门楼与屋脊，纹样不再只是独立图案，它也成为建筑空间中的观看线索。','3-24','建筑载体 · 影壁']
    ]},
    {id:'heritage',name:'匠心传承',steps:[
      ['从图案，回到双手','每一道轮廓背后，都有画稿、定位、修整与刻制。工具与手的配合，让技艺进入具体的日常。','3-8','工具 · 锤子'],
      ['手艺有温度，传承有名字','将目光从砖面移向匠人。走近韩永胜的故事，认识一门手艺如何被学习、实践与延续。','3-38','匠人故事 · 韩永胜'],
      ['把观察带回生活','再遇见一面影壁、一座门楼时，试着从纹样、技法与建筑之间寻找联系。这段漫游，也可以从下一次细看继续。','3-21','从展览走向日常']
    ]}
  ];
  // Use the existing route and explanations rather than inventing new process data.
  ['挑砖','画稿','放样','粗雕','细雕','打磨','修补','安装'].forEach(name=>{
    const item=C.routes.after.find(x=>x[0]===name);
    if(item)chapters[2].steps.push([name,stepDescriptions[name],item[1],'窑后雕 · '+name]);
  });
  const stories=[];
  const chartObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('chart-entered');chartObserver.unobserve(entry.target)}
  }),{threshold:.15});
  document.querySelectorAll('#categoryChart,.flow-compare,.generation-grid').forEach(chart=>{
    chart.classList.add('scroll-chart');chartObserver.observe(chart);
  });
  document.body.classList.add('scrolly-mode');
  document.querySelector('.hero-copy .primary').firstChild.textContent='向下开启砖上旅程 ';
  document.querySelector('.hero-foot').firstElementChild.textContent='随滚动展开 · 随时停下细看';
  const replay=$('replayOpening');if(replay)replay.remove();
  const opening=$('openingScene');if(opening){opening.hidden=true;opening.classList.remove('playing')}
  // Keep the previous generated hero concepts out of this narrative.
  chapters.forEach((chapter,chapterIndex)=>{
    const host=$(chapter.id),story=el('div','scroll-story');
    story.setAttribute('aria-label',chapter.name+'滚动叙事');
    const stage=el('figure','story-stage'),wash=el('div','story-wash');stage.append(wash);
    const frames=chapter.steps.map((item,i)=>{
      const frame=el('div','story-frame');frame.classList.toggle('is-active',i===0);
      frame.setAttribute('aria-hidden',String(i!==0));
      const image=imageFor(item[2]);if(i===0)image.loading='eager';
      const button=el('button','story-image');button.setAttribute('aria-label','放大观察 '+item[3]);button.onclick=()=>viewAsset(item[2],item[3]);button.append(image);
      frame.append(button,el('figcaption','',item[3]));stage.append(frame);return frame;
    });
    const progress=el('div','story-progress'),bar=el('span');progress.append(bar);stage.append(progress);
    const count=el('span','story-count','01 / '+String(chapter.steps.length).padStart(2,'0'));stage.append(count);
    const copy=el('div','story-copy');
    const steps=chapter.steps.map((item,i)=>{
      const section=el('article','story-step');section.classList.toggle('is-active',i===0);
      section.append(el('span','eyebrow',String(chapterIndex+1).padStart(2,'0')+' / '+chapter.name+' · '+String(i+1).padStart(2,'0')),el('h3','',item[0]),el('p','',item[1]),el('span','story-step-hint',i===chapter.steps.length-1?'继续向下 · 展开图表与自由探索':'继续滚动 ↓'));
      copy.append(section);return section;
    });
    story.append(stage,copy);host.querySelector('.chapter-head').after(story);
    stories.push({story,stage,frames,steps,bar,count,active:0});
  });
  const rail=el('nav','story-rail');rail.setAttribute('aria-label','五站叙事进度');
  chapters.forEach((c,i)=>{const a=el('a','',String(i+1).padStart(2,'0'));a.href='#'+c.id;a.setAttribute('aria-label',c.name);a.title=c.name;rail.append(a)});document.body.append(rail);
  let pending=false;
  function update(){
    pending=false;const focus=innerHeight*.57;
    stories.forEach((s,chapterIndex)=>{
      const bounds=s.story.getBoundingClientRect();
      if(bounds.bottom<0||bounds.top>innerHeight)return;
      let active=0;s.steps.forEach((step,i)=>{if(step.getBoundingClientRect().top<=focus)active=i});
      if(active!==s.active){s.active=active;s.frames.forEach((f,i)=>{f.classList.toggle('is-active',i===active);f.setAttribute('aria-hidden',String(i!==active));const b=f.querySelector('button');b.tabIndex=i===active?0:-1});s.steps.forEach((step,i)=>step.classList.toggle('is-active',i===active));s.count.textContent=String(active+1).padStart(2,'0')+' / '+String(s.steps.length).padStart(2,'0')}
      const progress=Math.max(0,Math.min(1,(focus-bounds.top)/bounds.height));s.bar.style.transform='scaleX('+progress+')';
      s.stage.style.setProperty('--scene-drift',motion?((progress-.5)*18)+'px':'0px');
      if(bounds.top<innerHeight*.6&&bounds.bottom>innerHeight*.4)rail.querySelectorAll('a').forEach((a,i)=>{a.classList.toggle('active',i===chapterIndex);if(i===chapterIndex)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});
    });
  }
  function requestUpdate(){if(!pending){pending=true;requestAnimationFrame(update)}}
  addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',requestUpdate);
  $('motion').addEventListener('click',requestUpdate);
  stories.forEach(s=>s.frames.forEach((f,i)=>{f.querySelector('button').tabIndex=i===0?0:-1}));
  update();
})();
