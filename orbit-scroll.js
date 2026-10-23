/* Local pinned motif gallery. Native scroll owns absolute progress. */
(() => {
 'use strict';
 const orbit=document.getElementById('patternOrbit'),layout=orbit.closest('.pattern-layout');
 const filter=document.getElementById('patternFilters'),nav=document.querySelector('.orbit-navigation');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),abort=new AbortController(),signal=abort.signal;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ease=v=>v*v*(3-2*v);
 const wrapper=document.createElement('div');wrapper.id='patternPin';wrapper.className='pattern-pin';
 const stage=document.createElement('div');stage.className='pattern-pin-stage';stage.setAttribute('aria-label','滚动观察纹样图谱');
 filter.before(wrapper);stage.append(filter,layout,nav);wrapper.append(stage);
 const foot=document.createElement('div');foot.className='pattern-pin-foot';
 foot.innerHTML='<span class="pattern-pin-hint">向下滚动 · 循纹寻意</span><span class="pattern-pin-meter" aria-hidden="true"><i></i></span><a href="#patternReading">继续阅读 ↓</a>';
 stage.append(foot);const reading=document.createElement('div');reading.id='patternReading';wrapper.after(reading);
 let frame=0,last=0,progress=0,target=0,kick=0,spread=0,previousY=scrollY,visible=false,paused=false,travel=0,top=0,disabled=false;
 const state={progress:0,angle:0,radius:38,rendering:false};
 function modal(){return !!document.querySelector('dialog[open]')}
 function absoluteProgress(){return disabled?0:clamp((top-wrapper.getBoundingClientRect().top)/Math.max(1,travel))}
 function measure(){
   const header=document.querySelector('header').getBoundingClientRect();top=Math.ceil(header.height)+12;
   disabled=!motion||reduce.matches||innerWidth<760||innerHeight<700;
   const height=Math.max(380,innerHeight-top-80);travel=innerHeight*(innerWidth<1000?1.5:1.7);
   wrapper.classList.toggle('pin-disabled',disabled);wrapper.style.setProperty('--pin-top',top+'px');wrapper.style.setProperty('--pin-height',height+'px');wrapper.style.setProperty('--pin-length',(height+travel)+'px');
   target=absoluteProgress();if(disabled){progress=0;spread=kick=0;paint()}wake();
 }
 function paint(){
   const rotation=ease(clamp((progress-.15)/.6))*Math.PI*2/3;
   const base=disabled?38:35+3*ease(clamp(progress/.15));
   const disturbance=spread*(1-ease(clamp((progress-.75)/.15)));
   const nodes=[...orbit.querySelectorAll('.pattern-node')];
   nodes.forEach((node,i)=>{const angle=i/Math.max(1,nodes.length)*Math.PI*2-Math.PI/2+orbitAngle+rotation;const radius=base+disturbance*Math.sin(i*1.71+1);node.style.left=(50+radius*Math.cos(angle))+'%';node.style.top=(50+radius*Math.sin(angle))+'%'});
   state.progress=progress;state.angle=rotation;state.radius=base;foot.querySelector('i').style.transform='scaleX('+progress+')';
   wrapper.dataset.progress=progress.toFixed(4);wrapper.dataset.angle=rotation.toFixed(4);wrapper.dataset.radius=base.toFixed(3);
 }
 function tick(t){frame=0;if(document.hidden||paused||!visible||disabled){state.rendering=false;return}
   state.rendering=true;const dt=Math.min(.04,(t-last)/1000||.016);last=t;target=absoluteProgress();
   const f=1-Math.exp(-15*dt);progress+=(target-progress)*f;if(Math.abs(target-progress)<.0001)progress=target;
   spread+=(kick-spread)*(1-Math.exp(-10*dt));kick*=Math.exp(-6*dt);paint();
   if(Math.abs(target-progress)>.0001||Math.abs(spread)>.003||kick>.003)frame=requestAnimationFrame(tick);else state.rendering=false;
 }
 function wake(){if(frame||document.hidden||paused||!visible||disabled)return;last=performance.now();frame=requestAnimationFrame(tick)}
 function scroll(){const delta=scrollY-previousY;previousY=scrollY;target=absoluteProgress();if(disabled)return;
   if(target>0&&target<1)kick=clamp(kick+Math.min(Math.abs(delta),100)*.012,0,1.7);
   wake();
 }
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){target=absoluteProgress();if(Math.abs(target-progress)>.8)progress=target;wake()}else{cancelAnimationFrame(frame);frame=0;state.rendering=false;progress=absoluteProgress();paint()}},{threshold:0,rootMargin:'100px 0px'});observer.observe(wrapper);
 // Existing filtering, selection, and drag handlers keep their behavior; this final paint supplies the scroll position.
 const decorate=decorateOrbit;decorateOrbit=function(){decorate();paint();wake()};
 filter.addEventListener('pointerdown',e=>{const button=e.target.closest('button');if(button&&e.pointerType!=='touch'){e.preventDefault();button.focus({preventScroll:true})}},{signal});
 const children=new MutationObserver(()=>{paint();wake()});children.observe(orbit,{childList:true});
 const dialogs=new MutationObserver(()=>{paused=modal();if(paused){cancelAnimationFrame(frame);frame=0;state.rendering=false}else wake()});
 document.querySelectorAll('dialog').forEach(d=>dialogs.observe(d,{attributes:true,attributeFilter:['open']}));
 paused=modal();
 addEventListener('scroll',scroll,{passive:true,signal});addEventListener('resize',measure,{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;state.rendering=false}else{previousY=scrollY;wake()}},{signal});
 reduce.addEventListener('change',measure,{signal});document.getElementById('motion').addEventListener('click',measure,{signal});
 foot.querySelector('a').addEventListener('click',e=>{e.preventDefault();reading.scrollIntoView({behavior:'instant',block:'start'})},{signal});
 document.fonts.ready.then(measure);wrapper.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',measure,{once:true,signal})});
 function dispose(){cancelAnimationFrame(frame);observer.disconnect();children.disconnect();dialogs.disconnect();abort.abort();if(decorateOrbit===decorated)decorateOrbit=decorate}
 const decorated=decorateOrbit;
 addEventListener('pagehide',e=>{cancelAnimationFrame(frame);frame=0;if(!e.persisted)dispose()},{signal});addEventListener('pageshow',()=>{measure();wake()},{signal});
 window.QX_PATTERN_PIN={getState:()=>({...state,disabled,paused}),refresh:measure,dispose};
 measure();paint();
})();


