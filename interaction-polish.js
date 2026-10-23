'use strict';
(() => {
  const aura=el('div','cursor-aura');aura.setAttribute('aria-hidden','true');document.body.append(aura);
  const selector='.meaning-card,.theme-card,.pattern-node,.wheel-step,.tool,.tech-card,.building,.selected-image,.floating,.hero-center,.process-image,.composition,.map-figure,.school-map,.person-layout figure,.tool-orbit-center,.craft-flower,[data-asset]';
  let active=null,frame=0,point=null;
  function reset(){active?.classList.remove('art-hover');if(active){active.style.setProperty('--art-tilt-x','0deg');active.style.setProperty('--art-tilt-y','0deg')}active=null;aura.classList.remove('visible')}
  function track(e){if(e.pointerType==='touch'||!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;point={x:e.clientX,y:e.clientY,target:e.target};if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;const {x,y,target}=point,modal=document.querySelector('dialog[open]');
      if(modal){reset();modal.style.setProperty('--art-x',x-modal.getBoundingClientRect().left+'px');modal.style.setProperty('--art-y',y-modal.getBoundingClientRect().top+'px');return}
      aura.style.left=x+'px';aura.style.top=y+'px';aura.classList.add('visible');
      const node=target.closest('.map-figure,.school-map')||target.closest(selector);if(node!==active){active?.classList.remove('art-hover');active=node;if(node){node.classList.add('reactive-art','art-hover')}}
      if(node){const r=node.getBoundingClientRect(),px=Math.max(0,Math.min(1,(x-r.left)/r.width)),py=Math.max(0,Math.min(1,(y-r.top)/r.height));node.style.setProperty('--art-x',px*100+'%');node.style.setProperty('--art-y',py*100+'%');node.style.setProperty('--art-tilt-x',(0.5-py)*2+'deg');node.style.setProperty('--art-tilt-y',(px-.5)*2+'deg')}
    });
  }
  document.addEventListener('qx:pointer',e=>track({clientX:e.detail.x,clientY:e.detail.y,target:e.detail.target,pointerType:e.detail.pointerType}));document.addEventListener('pointerleave',reset);addEventListener('blur',reset);addEventListener('scroll',()=>{active?.classList.remove('art-hover');active=null},{passive:true});$('motion').addEventListener('click',()=>{if(!motion)reset()});
  // All thumbnail cards now retain a visible floating glass preview, including
  // those injected while switching a pattern category.
  const map=document.querySelector('.map-figure'),mapImage=map.querySelector('img'),mapHost=map.querySelector('[data-asset]');
  const overlay=document.createElement('canvas');overlay.className='map-region-light';overlay.setAttribute('aria-hidden','true');mapHost.append(overlay);
  let mask=null,preparing=false;
  async function prepareMap(){if(mask||preparing)return;preparing=true;try{await mapImage.decode();const w=900,h=Math.round(w*mapImage.naturalHeight/mapImage.naturalWidth),source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(mapImage,0,0,w,h);const data=ctx.getImageData(0,0,w,h);
      for(let i=0;i<data.data.length;i+=4){const r=data.data[i],g=data.data[i+1],b=data.data[i+2],inside=r>145&&r<226&&Math.abs(r-g)<12&&Math.abs(g-b)<12&&data.data[i+3]>128;data.data[i]=255;data.data[i+1]=255;data.data[i+2]=255;data.data[i+3]=inside?255:0}ctx.putImageData(data,0,0);mask=source;drawMap();
    }catch{}finally{preparing=false}}
  function drawMap(){if(!mask)return;const r=mapHost.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(devicePixelRatio||1,2);overlay.width=Math.round(r.width*dpr);overlay.height=Math.round(r.height*dpr);const ctx=overlay.getContext('2d');ctx.scale(dpr,dpr);const scale=Math.min(r.width/mask.width,r.height/mask.height),w=mask.width*scale,h=mask.height*scale,x=(r.width-w)/2,y=(r.height-h)/2;
    ctx.shadowColor='#e6ae5b';ctx.shadowBlur=15;ctx.drawImage(mask,x,y,w,h);ctx.shadowBlur=0;ctx.globalCompositeOperation='destination-out';ctx.drawImage(mask,x,y,w,h);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#e9b76d';ctx.fillRect(0,0,r.width,r.height);ctx.globalCompositeOperation='source-over';
    // Fine outside contour, with the underlying gray region left untouched.
    ctx.globalAlpha=.85;ctx.shadowBlur=5;ctx.shadowColor='#d99b42';ctx.drawImage(mask,x-1,y,w,h);ctx.drawImage(mask,x+1,y,w,h);ctx.drawImage(mask,x,y-1,w,h);ctx.drawImage(mask,x,y+1,w,h);ctx.shadowBlur=0;ctx.globalCompositeOperation='destination-out';ctx.drawImage(mask,x,y,w,h);ctx.globalCompositeOperation='source-over';
  }
  map.addEventListener('pointerenter',prepareMap);map.addEventListener('focusin',prepareMap);new ResizeObserver(drawMap).observe(mapHost);
  // Marks reuse actual exhibit motifs/tools instead of unrelated stock symbols.
  const marks=[['#origin .chapter-head h2','2-20'],['#patterns .chapter-head h2','2-103'],['#craft .chapter-head h2','3-7'],['#technique .chapter-head h2','3-78'],['#heritage .chapter-head h2','3-38']];
  marks.forEach(([query,id])=>{const h=document.querySelector(query),im=imageFor(id,true);im.alt='';im.className='heading-mark';im.setAttribute('aria-hidden','true');h.prepend(im)});
  const meanings={'巫术与原始信仰':'2-25','审美与物质享乐':'2-125','两种工艺的取舍':'3-7','制作说明':'1-86','砖雕溯源':'2-20','历史发展':'2-144','装饰主题':'2-21','纹样寓意':'2-103','地域流派':'1-1','雕刻技法':'3-18','表现手法':'3-78','雕刻工具':'3-8','建筑载体':'3-21','传承情况':'3-38'};
  document.querySelectorAll('.two-columns h3,.subhead h3').forEach(h=>{const id=meanings[h.textContent.trim()];if(!id)return;const im=imageFor(id,true);im.alt='';im.className='heading-mark';im.setAttribute('aria-hidden','true');h.classList.add('marked-heading');h.prepend(im)});
  // Give existing anchor navigation proper button-sized hit areas and names.
  document.querySelectorAll('.journey a').forEach(a=>{a.setAttribute('aria-label','前往'+a.textContent.replace(/\d/g,'').trim());a.classList.add('journey-jump')});
  const oldViewer=openViewer;openViewer=function(src,title,note){reset();oldViewer(src,title,note);$('imageDialog').setAttribute('aria-label','大图观察：'+title)};
})();
