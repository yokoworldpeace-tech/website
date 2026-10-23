'use strict';
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const buttonSelector='.primary,.outlined,.icon-button,.wish-button,.sound-toggle,.opening-action';
  function dress(root=document){root.querySelectorAll(buttonSelector).forEach(b=>{
    if(b.querySelector('.button-shader'))return;b.classList.add('material-button');
    const canvas=document.createElement('canvas');canvas.className='button-shader';canvas.width=256;canvas.height=96;canvas.setAttribute('aria-hidden','true');b.prepend(canvas);
  })}dress();
  const buttonObserver=new MutationObserver(()=>dress());buttonObserver.observe(document.body,{childList:true,subtree:true});
  // A single GPU shader supplies the moving surface to visible button canvases.
  const surface=document.createElement('canvas');surface.width=256;surface.height=96;
  const gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});let program=null;
  if(gl){try{
    function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');return s}
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;uniform float t;uniform vec2 m;void main(){vec2 uv=gl_FragCoord.xy/vec2(256.,96.);float wave=sin(uv.x*8.+uv.y*3.-t*.6)*.5+.5;float sheen=pow(max(0.,1.-abs(uv.x-uv.y*.23-fract(t*.045))*3.2),7.);float halo=exp(-length((uv-m)*vec2(1.,.55))*4.);gl_FragColor=vec4(mix(vec3(.42,.57,.57),vec3(.83,.72,.53),wave),.035+sheen*.16+halo*.055);}'));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  }catch{program=null}}
  let shaderTick=0,shaderLast=0,pointer=[.5,.5];
  function shaderFrame(time){shaderTick=0;if(!program||!motion||reduced.matches||document.hidden)return;
    if(time-shaderLast>65){shaderLast=time;gl.uniform1f(gl.getUniformLocation(program,'t'),time/1000);gl.uniform2f(gl.getUniformLocation(program,'m'),pointer[0],pointer[1]);gl.drawArrays(gl.TRIANGLES,0,6);
      document.querySelectorAll('.material-button .button-shader').forEach(c=>{const r=c.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&r.width){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(surface,0,0)}})}
    shaderTick=requestAnimationFrame(shaderFrame);
  }
  function resumeShader(){if(!shaderTick&&program&&motion&&!reduced.matches&&!document.hidden)shaderTick=requestAnimationFrame(shaderFrame)}resumeShader();
  document.addEventListener('visibilitychange',resumeShader);$('motion').addEventListener('click',resumeShader);reduced.addEventListener('change',resumeShader);
  document.addEventListener('click',e=>{const b=e.target.closest(buttonSelector);if(!b||!motion||reduced.matches)return;
    const r=b.getBoundingClientRect(),ripple=el('span','material-ripple');ripple.setAttribute('aria-hidden','true');const size=Math.max(r.width,r.height)*2;ripple.style.cssText=`width:${size}px;height:${size}px;left:${e.detail?e.clientX-r.left:r.width/2}px;top:${e.detail?e.clientY-r.top:r.height/2}px`;b.append(ripple);setTimeout(()=>ripple.remove(),650);
  });
  const cards=[...document.querySelectorAll('.theme-card,.meaning-card,.tech-card,.building,.selected-pattern,.history-detail,.heritage-banner')];cards.forEach(c=>{c.classList.add('material-card');const edge=el('span','material-edge');edge.setAttribute('aria-hidden','true');c.append(edge)});
  let pointerJob=0,lastPointer=null;
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!motion)return;lastPointer={x:e.clientX,y:e.clientY};pointer=[e.clientX/innerWidth,1-e.clientY/innerHeight];if(pointerJob)return;
    pointerJob=requestAnimationFrame(()=>{pointerJob=0;const p=lastPointer;cards.forEach(c=>{const r=c.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      const outside=Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));
      const edgeDistance=outside>0?outside:Math.min(p.x-r.left,r.right-p.x,p.y-r.top,r.bottom-p.y);
      const strength=Math.max(0,1-edgeDistance/110)*(outside>100?0:1);
      c.style.setProperty('--edge-opacity',strength.toFixed(3));c.style.setProperty('--edge-angle',Math.atan2(p.y-r.top-r.height/2,p.x-r.left-r.width/2)*180/Math.PI+90+'deg');c.style.setProperty('--edge-x',(p.x-r.left)+'px');c.style.setProperty('--edge-y',(p.y-r.top)+'px');
    })});
  },{passive:true});
  window.addEventListener('blur',()=>cards.forEach(c=>c.style.setProperty('--edge-opacity','0')));
  // Analyse the recordings, never a synthetic beat or microphone input.
  const player=$('craftRecording'),flower=document.querySelector('.craft-flower');
  const badge=el('span','flower-sound-state','声音播放中');badge.setAttribute('role','status');badge.hidden=true;flower.after(badge);
  const meter=el('span','flower-meter');meter.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)meter.append(el('i'));flower.append(meter);
  let context=null,analyser=null,source=null,samples=null,audioFrame=0,level=0;
  function prepareAudio(){if(!context){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;context=new AC();analyser=context.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.8;source=context.createMediaElementSource(player);source.connect(analyser);analyser.connect(context.destination);samples=new Uint8Array(analyser.fftSize)}catch{analyser=null}}
    if(context?.state==='suspended')context.resume().catch(()=>{});
  }
  document.addEventListener('click',e=>{if(e.target.closest('#playCraft,#soundTest,#craftSoundToggle,#soundEffects,.wheel-step,.flow-node,#stepPrev,#stepNext,#steps button'))prepareAudio()},{capture:true});
  function resetFlower(){cancelAnimationFrame(audioFrame);audioFrame=0;level=0;flower.classList.remove('audio-active');flower.style.setProperty('--audio-level','0');flower.style.setProperty('--audio-turn','0deg');badge.hidden=true}
  function dance(time){audioFrame=0;const audible=!player.paused&&!player.ended&&!player.muted&&player.volume>0&&!document.hidden&&player.readyState>=3;
    flower.classList.toggle('audio-active',audible);badge.hidden=!audible;
    if(!audible){flower.style.setProperty('--audio-level','0');flower.style.setProperty('--audio-turn','0deg');return}
    let rms=0;if(analyser){analyser.getByteTimeDomainData(samples);for(const n of samples)rms+=((n-128)/128)**2;rms=Math.sqrt(rms/samples.length)*player.volume}
    level=level*.78+Math.sqrt(Math.min(1,rms*110))*.22;
    flower.style.setProperty('--audio-level',motion&&!reduced.matches?level.toFixed(4):'0');flower.style.setProperty('--audio-turn',motion&&!reduced.matches?(Math.sin(time/460)*level*2).toFixed(3)+'deg':'0deg');
    audioFrame=requestAnimationFrame(dance);
  }
  function startDance(){cancelAnimationFrame(audioFrame);audioFrame=requestAnimationFrame(dance)}
  player.addEventListener('playing',startDance);player.addEventListener('volumechange',()=>{if(player.volume>0&&!player.paused)startDance();else resetFlower()});
  ['pause','ended','waiting','emptied','error'].forEach(type=>player.addEventListener(type,resetFlower));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetFlower()});
  window.QX_DRESS_BUTTONS=dress;
})();
