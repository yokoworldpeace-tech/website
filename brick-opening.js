'use strict';
(() => {
  const NS='http://www.w3.org/2000/svg';
  function svgNode(tag,attrs,parent){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(parent)parent.append(n);return n}
  const opening=el('dialog','brick-intro');opening.id='openingScene';opening.setAttribute('aria-labelledby','brickIntroTitle');
  const top=el('div','brick-intro-top');top.append(el('span','','砖语 / 清徐砖雕数字展'));
  const skip=el('button','text-button','直接进入 →');top.append(skip);
  const copy=el('div','brick-intro-copy');copy.append(el('span','eyebrow','A UNIVERSE WITHIN A BRICK'),el('h2','','青砖之上，一方乾坤'));copy.querySelector('h2').id='brickIntroTitle';
  const subtitle=el('p','','向下滚动或点击，让砖上的花逐层绽放。');copy.append(subtitle);
  const stage=el('div','brick-intro-art');
  const svg=svgNode('svg',{viewBox:'0 0 1000 620',role:'img','aria-label':'重新绘制的青砖花卉浮雕，花瓣随操作展开'},stage);
  const defs=svgNode('defs',{},svg);
  const stone=svgNode('linearGradient',{id:'brickStone',x1:'0',y1:'0',x2:'1',y2:'1'},defs);
  [['0%','#8b9a99'],['42%','#657b7d'],['100%','#344e53']].forEach(([offset,color])=>svgNode('stop',{offset,'stop-color':color},stone));
  const petalGradient=svgNode('linearGradient',{id:'petalStone',x1:'0',y1:'0',x2:'.8',y2:'1'},defs);
  [['0%','#c8d0c8'],['38%','#8fa2a0'],['70%','#536e73'],['100%','#314b51']].forEach(([offset,color])=>svgNode('stop',{offset,'stop-color':color},petalGradient));
  const filter=svgNode('filter',{id:'carvedShadow',x:'-40%',y:'-40%',width:'180%',height:'180%'},defs);svgNode('feDropShadow',{dx:'1.5',dy:'4',stdDeviation:'2','flood-color':'#142e34','flood-opacity':'.6'},filter);
  const grain=svgNode('filter',{id:'brickGrain',x:'0',y:'0',width:'100%',height:'100%'},defs);svgNode('feTurbulence',{type:'fractalNoise',baseFrequency:'.7',numOctaves:'3',seed:'7'},grain);svgNode('feColorMatrix',{type:'saturate',values:'0'},grain);
  const pattern=svgNode('pattern',{id:'keyCarving',width:'56',height:'56',patternUnits:'userSpaceOnUse'},defs);
  // Raised meander bands: recessed contact shadow, stone face, upper-left bevel.
  const keyPath='M4 4H48V48H4V16H36V36H16V28H28V24H12V44H44V8H8';
  const keyShadow=svgNode('filter',{id:'keyRelief',x:'-25%',y:'-25%',width:'160%',height:'160%'},defs);
  svgNode('feDropShadow',{dx:1.8,dy:2.2,stdDeviation:.8,'flood-color':'#1d383e','flood-opacity':'.65'},keyShadow);
  svgNode('path',{d:keyPath,fill:'none',stroke:'#354f54','stroke-width':4.7,'stroke-linejoin':'miter',filter:'url(#keyRelief)'},pattern);
  svgNode('path',{d:keyPath,fill:'none',stroke:'#829794','stroke-width':3.2,'stroke-linejoin':'miter'},pattern);
  svgNode('path',{d:keyPath,transform:'translate(-.65 -.7)',fill:'none',stroke:'#b4c1b7','stroke-width':.85,opacity:'.72'},pattern);

  const slab=svgNode('g',{class:'intro-slab'},svg);
  svgNode('rect',{x:63,y:72,width:886,height:505,rx:7,fill:'#203b41',opacity:'.16'},slab);
  svgNode('rect',{x:55,y:52,width:890,height:510,rx:5,fill:'url(#brickStone)',stroke:'#8da3a1','stroke-width':2},slab);
  svgNode('rect',{x:70,y:67,width:860,height:480,rx:2,fill:'none',stroke:'#c4cebf','stroke-width':1.5,opacity:'.6'},slab);
  svgNode('rect',{x:79,y:76,width:842,height:462,fill:'none',stroke:'#243f47','stroke-width':7},slab);
  svgNode('rect',{x:88,y:85,width:824,height:444,fill:'url(#keyCarving)'},slab);
  svgNode('rect',{x:55,y:52,width:890,height:510,rx:5,filter:'url(#brickGrain)',opacity:'.065'},slab);
  svgNode('path',{d:'M500 108 Q526 167 583 188 Q607 234 689 307 Q607 375 583 422 Q526 443 500 506 Q474 443 417 422 Q393 375 311 307 Q393 234 417 188 Q474 167 500 108Z',fill:'#587174',stroke:'#bcc8bd','stroke-width':2,filter:'url(#carvedShadow)'},slab);
  svgNode('path',{d:'M500 127 Q530 182 574 198 Q599 244 668 307 Q599 370 574 412 Q530 432 500 486 Q470 432 426 412 Q401 370 332 307 Q401 244 426 198 Q470 182 500 127Z',fill:'none',stroke:'#233f46','stroke-width':4},slab);
  // The foliage and petal relief are original vector shapes, not cutouts from a photo.
  [210,790].forEach(cx=>{const g=svgNode('g',{transform:`translate(${cx} 307)`,opacity:'.7'},slab);for(let i=0;i<8;i++)svgNode('path',{d:'M0 5C-35-8-36-42-14-51C-5-56 0-47 0-37C0-47 5-56 14-51C36-42 35-8 0 5Z',transform:`rotate(${i*45}) scale(.75)`,fill:'url(#petalStone)',stroke:'#aabbb2','stroke-width':1},g);svgNode('circle',{r:10,fill:'#aeb9a7'},g)});
  const flower=svgNode('g',{transform:'translate(500 307)',filter:'url(#carvedShadow)'},slab),petals=[];
  [{count:14,size:1.05,reach:47},{count:11,size:.82,reach:25},{count:8,size:.58,reach:9}].forEach((ring,layer)=>{
    for(let i=0;i<ring.count;i++){
      const angle=i*360/ring.count+(layer%2?15:0),g=svgNode('g',{},flower);
      svgNode('path',{d:'M0 15C-23 2-49-23-46-57C-43-81-22-110-9-100C-1-95-2-82 0-77C2-82 1-95 9-100C22-110 43-81 46-57C49-23 23 2 0 15Z',fill:'url(#petalStone)',stroke:'#becbbf','stroke-width':'1.1'},g);
      svgNode('path',{d:'M0 10Q-3-35 0-83M-5-8Q-24-32-28-60M5-8Q24-32 28-60',fill:'none',stroke:'#334f56','stroke-width':'1.3',opacity:'.7'},g);
      petals.push({g,angle,ring,layer});
    }
  });
  const heart=svgNode('g',{},flower);svgNode('circle',{r:20,fill:'#abb8a7',stroke:'#d3d7c4','stroke-width':1.4},heart);for(let i=0;i<18;i++){const a=i*2.4,r=4+Math.sqrt(i)*3;svgNode('circle',{cx:Math.cos(a)*r,cy:Math.sin(a)*r,r:1.6,fill:'#3c585b'},heart)}
  const caption=el('div','brick-intro-caption');const phase=el('span','','01 / 唤醒砖纹'),percent=el('span','','0%');caption.append(phase,percent);
  const progress=el('div','brick-intro-progress'),fill=el('span');progress.append(fill);
  const action=el('button','opening-action','唤醒砖纹 →');action.id='bloomAction';
  const foot=el('div','brick-intro-foot');foot.append(action,el('span','','滚动 / 点击 / 方向键 · 由你展开'));opening.append(top,copy,stage,caption,progress,foot);document.body.append(opening);window.QX_DRESS_BUTTONS?.(opening);
  let target=0,current=0,raf=0,openedAt=0,completeAt=0,lastFocus=null,oldOverflow='',closing=false;
  function render(p){
    const ease=p*p*(3-2*p);petals.forEach(({g,angle,ring,layer})=>{
      const local=Math.max(0,Math.min(1,(ease-layer*.09)/(1-layer*.09)));
      g.setAttribute('transform',`rotate(${angle}) translate(0 ${-ring.reach*local}) scale(${ring.size*(.22+.78*local)} ${ring.size*(.62+.38*local)})`);
    });
    heart.setAttribute('transform',`scale(${.65+.35*ease})`);opening.style.setProperty('--bloom',p.toFixed(4));fill.style.width=p*100+'%';percent.textContent=Math.round(p*100)+'%';
  }
  function tick(){raf=0;current+=(target-current)*.075;if(Math.abs(target-current)<.001)current=target;render(current);if(current!==target)raf=requestAnimationFrame(tick)}
  function setProgress(value){target=Math.max(0,Math.min(1,value));if(!motion||matchMedia('(prefers-reduced-motion: reduce)').matches){current=target;render(current)}else if(!raf)raf=requestAnimationFrame(tick);
    const index=target<.34?0:target<.85?1:2;phase.textContent=['01 / 唤醒砖纹','02 / 刀下生花','03 / 砖上乾坤'][index];
    // Canvas stays intact while button copy changes.
    let label=action.querySelector('.bloom-label');if(!label){[...action.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());label=el('span','bloom-label');action.append(label)}
    label.textContent=target>=1?'进入数字展 →':target>.1?'继续绽放 →':'唤醒砖纹 →';
    if(target>=1&&!completeAt)completeAt=performance.now();if(target<1)completeAt=0;
    subtitle.textContent=target>=1?'一砖一世界，一刻一春秋。继续滚动或点击，走进清徐砖雕。':'向下滚动或点击，让砖上的花逐层绽放。';
  }
  function close(){if(!opening.open||closing)return;closing=true;cancelAnimationFrame(raf);raf=0;opening.classList.remove('playing');opening.close();document.body.style.overflow=oldOverflow;try{sessionStorage.setItem('qingxu-bloom-seen-v1','1')}catch{}lastFocus?.focus({preventScroll:true});closing=false}
  function advance(){if(target>=1){if(performance.now()-completeAt>650)close()}else setProgress(target+.5)}
  action.onclick=advance;skip.onclick=close;
  opening.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();if(performance.now()-openedAt<450)return;if(target>=1&&e.deltaY>0){if(performance.now()-completeAt>1100)close();return}setProgress(target+Math.max(-.18,Math.min(.18,e.deltaY/1100)))},{passive:false});
  let touchStart=0;opening.addEventListener('touchstart',e=>{touchStart=e.touches[0].clientY},{passive:true});opening.addEventListener('touchmove',e=>{e.preventDefault()},{passive:false});opening.addEventListener('touchend',e=>{const d=touchStart-e.changedTouches[0].clientY;if(d>35)advance();else if(d< -35)setProgress(target-.5)},{passive:true});
  opening.addEventListener('keydown',e=>{if(['ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();advance()}else if(['ArrowUp','PageUp'].includes(e.key)){e.preventDefault();setProgress(target-.5)}});
  opening.addEventListener('cancel',e=>{e.preventDefault();close()});
  function play(){if(opening.open)return;lastFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';target=current=0;completeAt=0;openedAt=performance.now();opening.classList.add('playing');opening.showModal();setProgress(0);render(0);action.focus({preventScroll:true});stopCraft()}
  window.QX_CLOSE_OPENING=close;
  const replay=el('button','text-button replay-opening','重看青砖生花 ↻');replay.id='replayOpening';replay.onclick=play;document.querySelector('.hero-copy').insertBefore(replay,document.querySelector('.hero-foot'));
  let seen=false;try{seen=!!sessionStorage.getItem('qingxu-bloom-seen-v1')}catch{}if(!location.hash||location.hash==='#home')play();
})();
