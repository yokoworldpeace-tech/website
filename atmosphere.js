'use strict';
(() => {
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const selector='.theme-card,.meaning-card,.pattern-node,.wheel-step,.tool,.tech-card,.building,.selected-image,.floating,.hero-center,.process-image,.composition';
  const smallSelector='.theme-card,.pattern-node,.wheel-step,.tool';
  document.querySelectorAll(selector).forEach(n=>n.classList.add('light-sensitive'));
  const loupe=el('div','light-loupe');loupe.id='lightLoupe';loupe.hidden=true;loupe.setAttribute('aria-hidden','true');const loupeImage=el('img'),loupeLabel=el('span');loupe.append(loupeImage,loupeLabel);document.body.append(loupe);
  let lit=null,frame=0,point=null,loupeTarget=null;
  function clearLight(){if(lit)lit.classList.remove('is-lit');lit=null;loupe.hidden=true;loupeTarget=null}
  function lightAt(target,event){if(!fine.matches||!target||document.querySelector('dialog[open]')||document.getElementById('openingScene')?.classList.contains('playing'))return;
    if(lit!==target){if(lit)lit.classList.remove('is-lit');lit=target;target.classList.add('light-sensitive','is-lit')}
    point={target,x:event.clientX,y:event.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const p=point;if(!p||!p.target.isConnected)return;const r=p.target.getBoundingClientRect(),x=(p.x-r.left)/r.width*100,y=(p.y-r.top)/r.height*100;p.target.style.setProperty('--light-x',x+'%');p.target.style.setProperty('--light-y',y+'%');p.target.style.setProperty('--light-angle',Math.atan2(y-50,x-50)*180/Math.PI+'deg');
      const icon=p.target.matches(smallSelector),img=p.target.querySelector('img');if(icon&&img&&!(typeof dragState!=='undefined'&&dragState)){if(loupeTarget!==p.target){const raw=img.getAttribute('src')||'',record=A.find(a=>a.thumb===raw||a.src===raw);loupeImage.src=record?.src||raw;loupeImage.alt='';loupeLabel.textContent=img.alt;loupeTarget=p.target}const width=Math.min(348,innerWidth-32),height=width+43;let left=r.right+22;if(left+width>innerWidth-12)left=r.left-width-22;if(left<12)left=Math.max(12,Math.min(innerWidth-width-12,p.x-width/2));let top=Math.max(100,Math.min(innerHeight-height-18,p.y-height/2));loupe.style.width=width+'px';loupe.style.left=left+'px';loupe.style.top=top+'px';loupe.hidden=false}else{loupe.hidden=true;loupeTarget=null}
    })}
  document.addEventListener('pointerover',e=>{const target=e.target.closest(selector);if(target)lightAt(target,e);else clearLight()},{passive:true});document.addEventListener('pointermove',e=>{const target=e.target.closest(selector);if(target)lightAt(target,e)},{passive:true});document.addEventListener('pointerdown',()=>{loupe.hidden=true},{passive:true});document.addEventListener('focusin',e=>{const target=e.target.closest(selector);if(target)target.classList.add('light-sensitive')});window.addEventListener('scroll',()=>{loupe.hidden=true;loupeTarget=null},{passive:true});window.addEventListener('blur',clearLight);

  // Reveal once; a reduced-motion preference always keeps text immediately visible.
  const revealNodes=document.querySelectorAll('.chapter-head,.subhead,.origin-grid,.history-detail,.meaning-card,.craft-diagram,.flow-compare,.tech-card,.building-story,.heritage-banner,.generation,.person-layout,.journey-check');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-visible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px 20px 0px'});
  revealNodes.forEach((node,i)=>{node.classList.add('reveal-item');node.style.setProperty('--reveal-delay',(node.matches('.meaning-card,.tech-card')?i%4*60:0)+'ms');observer.observe(node)});
  function closeOpening(){window.QX_CLOSE_OPENING?.()}
  // User-provided recordings, synchronized with the currently displayed step.
  const sources={'制胚':'blank.mp3','画稿':'drawing.m4a','放样':'transfer.m4a','粗雕':'rough.mp3','细雕':'detail.mp4','阴干':'dry.mp3','装窑':'load.mp3','焙烧':'fire.m4a','安装':'install.m4a','挑砖':'select.m4a','打磨':'polish.m4a','修补':'repair.m4a'};
  const player=new Audio();player.id='craftRecording';player.hidden=true;player.preload='metadata';player.volume=.4;document.body.append(player);
  const controls=el('details','sound-controls');controls.id='soundControls';
  const summary=el('summary','','工序声音 · 关闭'),panel=el('div','sound-panel');
  const toggle=el('button','sound-toggle','工序音效 · 关闭');toggle.id='soundEffects';toggle.setAttribute('aria-pressed','false');
  const volumeLabel=el('label','sound-volume','音量'),volume=el('input');volume.type='range';volume.id='soundVolume';volume.min='0';volume.max='100';volume.value='40';volume.setAttribute('aria-label','工序音效音量');volumeLabel.append(volume);
  const test=el('button','outlined','试听当前工序'),status=el('p','sound-status','点击“播放工序”后，随对应工序自动播放。');test.id='soundTest';status.id='soundStatus';status.setAttribute('role','status');
  panel.append(el('div','eyebrow','SOUND / 工序实录'),el('h3','','听见制作的过程'),toggle,volumeLabel,test,status,el('small','','切换工序时停止上一段声音。暂停、离开工坊或切到后台时停止播放。'));controls.append(summary,panel);document.body.append(controls);
  const inline=el('button','outlined','工序声音 · 关闭');inline.id='craftSoundToggle';inline.setAttribute('aria-pressed','false');$('playCraft').after(inline);
  let enabled=false,sequence=false,serial=0,advanceTimer=null,loadTimer=null;
  function ui(){summary.textContent='工序声音 · '+(enabled?'开启':'关闭');toggle.textContent=inline.textContent='工序音效 · '+(enabled?'开启':'关闭');toggle.setAttribute('aria-pressed',enabled);inline.setAttribute('aria-pressed',enabled);controls.dataset.audioState=player.paused?'idle':'running'}
  function silence(){serial++;clearTimeout(loadTimer);player.onended=null;player.onerror=null;player.onloadedmetadata=null;player.pause();try{player.currentTime=0}catch{}ui()}
  function queueNext(delay=0){clearTimeout(advanceTimer);if(sequence)advanceTimer=setTimeout(()=>{if(!sequence)return;if(step>=C.routes[route].length-1){stopCraft();status.textContent='本条制作路线已播放完成。';return}step++;drawCraft()},delay)}
  const oldStop=stopCraft;stopCraft=function(){sequence=false;clearTimeout(advanceTimer);oldStop();silence()};
  async function playCurrent(){
    silence();const token=serial,name=C.routes[route][step][0];
    if(!enabled){queueNext(3000);return}
    const file=sources[name];if(!file){status.textContent='此工序暂无音效。';queueNext(3000);return}
    player.src='audio/'+file;controls.dataset.currentStep=name;
    player.onended=()=>{if(token!==serial)return;ui();queueNext(450)};
    function failed(){if(token!==serial)return;clearTimeout(loadTimer);status.textContent=name+'音效暂时无法播放，可继续浏览或重试。';queueNext(3000)}
    player.onerror=failed;
    loadTimer=setTimeout(failed,15000);
    try{await player.play();if(token!==serial)return;clearTimeout(loadTimer);status.textContent='正在播放：'+name;ui()}catch(e){if(token!==serial)return;clearTimeout(loadTimer);if(e.name==='NotAllowedError'){stopCraft();status.textContent='浏览器暂停了声音，请再次点击“播放工序”。'}else failed()}
  }
  const previousCraft=drawCraft;drawCraft=function(){previousCraft();clearTimeout(advanceTimer);playCurrent();$('craftWheel').classList.remove('step-flash');void $('craftWheel').offsetWidth;$('craftWheel').classList.add('step-flash')};
  $('playCraft').onclick=()=>{if(sequence){stopCraft();status.textContent='工序播放已暂停。';return}oldStop();enabled=true;sequence=true;playTimer=-1;if(step===C.routes[route].length-1)step=0;$('playCraft').textContent='暂停工序 Ⅱ';$('playCraft').setAttribute('aria-pressed','true');ui();drawCraft()};
  function toggleSound(){enabled=!enabled;silence();ui();if(enabled)playCurrent();else{status.textContent='工序音效已关闭。';if(sequence)queueNext(3000)}}
  toggle.onclick=inline.onclick=toggleSound;
  test.onclick=()=>{stopCraft();enabled=true;ui();playCurrent()};
  volume.oninput=()=>{player.volume=Number(volume.value)/100};
  controls.addEventListener('toggle',()=>{if(controls.open)clearLight()});
  document.addEventListener('pointerdown',e=>{if(controls.open&&!controls.contains(e.target))controls.open=false});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopCraft();clearLight()}});
  window.addEventListener('pagehide',()=>stopCraft());
  let scrollPending=false;window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;const r=$('craft').getBoundingClientRect();if(r.bottom<90||r.top>innerHeight){if(!player.paused||sequence)stopCraft()}})},{passive:true});
  $('motion').addEventListener('click',()=>{if(!motion){closeOpening();clearLight()}});ui();
})();
