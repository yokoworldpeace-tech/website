// One renderer, one animation loop; scroll owns the camera, pointer owns dust.
import * as THREE from './vendor/three.module.min.js';

const store=window.QX_EXHIBITION;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const controller=new AbortController(),signal=controller.signal;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const assets=new Map(window.QX_ASSETS.map(a=>[a.id,a]));
const config=[
 {id:'origin',asset:'3-78',detail:'2-121',title:'一方青砖，\n容下天地',text:'从完整构图，走近清徐砖雕的来处。',end:'砖石有源，文脉有承',zoom:.12},
 {id:'patterns',asset:'2-116',detail:'2-103',title:'循着花纹，\n读懂心愿',text:'由完整纹样，靠近花叶与线条。',end:'有图必有意，有意必吉祥',zoom:.19},
 {id:'craft',asset:'3-78',detail:'3-7',title:'从一笔，\n到一刀',text:'靠近构图与凿具，再循工序听见制作。',end:'泥火淬炼，刀下生花',zoom:.13},
 {id:'technique',asset:'3-21',detail:'3-18',title:'由一处雕花，\n看见一座院落',text:'在门楼与纹样之间，观察深浅与层次。',end:'深浅成境，入院成景',zoom:.14},
 {id:'heritage',asset:'3-38',detail:null,title:'砖上有纹，\n手艺有人',text:'让视线慢下来，走近传承手艺的人。',end:'手艺有温度，传承有名字',zoom:.055}
];
const pilot=new URLSearchParams(location.search).get('scenePilot')==='1';
const sections=(pilot?config.slice(0,2):config).map((c,i)=>{
 const chapter=document.getElementById(c.id),section=document.createElement('div');
 section.className='scroll-exhibit';section.dataset.scene=c.id;
 const stage=document.createElement('div');stage.className='scene-stage';
 const copy=document.createElement('div');copy.className='scene-copy';
 const label=document.createElement('span');label.className='eyebrow';label.textContent=`${String(i+1).padStart(2,'0')} / 砖上漫游`;
 const title=document.createElement('h3');c.title.split('\n').forEach((line,j)=>{if(j)title.append(document.createElement('br'));title.append(document.createTextNode(line))});
 const desc=document.createElement('p');desc.textContent=c.text;copy.append(label,title,desc);
 const fallback=document.createElement('div');fallback.className='scene-fallback';
 const img=document.createElement('img');img.src=assets.get(c.asset).src;img.alt=c.title.replace('\n','');img.loading='lazy';fallback.append(img);
 const foot=document.createElement('div');foot.className='scene-foot';
 const status=document.createElement('span');const track=document.createElement('span');track.className='scene-track';track.append(document.createElement('i'));status.append(track,document.createTextNode('滚动，走近细节'));
 const skip=document.createElement('a');skip.className='scene-skip';skip.textContent='阅读本厅图文 ↓';skip.href=`#${c.id}-reading`;
 const reading=document.createElement('div');reading.id=`${c.id}-reading`;reading.style.scrollMarginTop='110px';
 skip.addEventListener('click',e=>{e.preventDefault();reading.scrollIntoView({behavior:'instant',block:'start'})},{signal});
 foot.append(status,skip);stage.append(copy,fallback,foot);section.append(stage);
 chapter.querySelector('.chapter-head').after(section,reading);
 return {...c,section,stage,desc,ready:false,loading:false,group:null,meshes:[]};
});

const canvas=document.createElement('canvas');canvas.className='scene-surface';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;document.body.append(canvas);
let contextLost=false;
let renderer,dead=false,raf=0,last=0,current=null,progress=0,w=innerWidth,h=innerHeight,dirty=true,settled=0;
let pointer={x:0,y:0,active:false,speed:0},lastPointerTime=0,modal=false;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30);
const dustScene=new THREE.Scene(),dustCamera=new THREE.OrthographicCamera(0,w,0,h,-10,10);
let dustGeometry,dustMaterial,dust,base,positions,velocity,sizes,count=0,energy=0;
const textures=new Set(),loader=new THREE.TextureLoader();
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const metrics={frames:0,totalMS:0,maxMS:0};
function snapshot(){canvas.dataset.scene=current?.id||'';canvas.dataset.progress=progress.toFixed(4);canvas.dataset.particles=String(count);canvas.dataset.energy=energy.toFixed(3);canvas.dataset.frames=String(metrics.frames);canvas.dataset.meanFrameMs=(metrics.totalMS/Math.max(metrics.frames,1)).toFixed(2)}
function enabled(){return !dead&&!contextLost&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('no-motion')&&!modal}
function fallback(){canvas.hidden=true;!document.body.classList.contains('scene-static')&&document.body.classList.add('scene-static');sections.forEach(s=>s.stage.classList.remove('scene-ready'));store.setExperience({rendering:false,reducedMotion:reduced.matches});}
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x000000,0);renderer.autoClear=false;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<720?1.25:1.6));renderer.setSize(w,h,false)}catch{fallback()}

async function load(s){
 if(!renderer||dead||s.ready||s.loading||s.failed)return;s.loading=true;
 try{
   const ids=[s.asset,s.detail].filter(Boolean);
   const results=await Promise.allSettled(ids.map(id=>loader.loadAsync(assets.get(id).src)));
   const loaded=results.filter(r=>r.status==="fulfilled").map(r=>r.value);
   if(results.some(r=>r.status==="rejected")){loaded.forEach(t=>t.dispose());throw new Error("Texture unavailable")}
   if(dead){loaded.forEach(t=>t.dispose());return}
   s.group=new THREE.Group();
   loaded.forEach((t,i)=>{
     textures.add(t);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
     const aspect=t.image.width/t.image.height;
     // Existing images remain flat, aspect-correct exhibit plates.
     const geometry=new THREE.PlaneGeometry(aspect,1);
     const material=new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide});
     const light={point:{value:new THREE.Vector2(-10,-10)},power:{value:0}};
     material.onBeforeCompile=shader=>{shader.uniforms.qxLight=light.point;shader.uniforms.qxPower=light.power;shader.fragmentShader='uniform vec2 qxLight;uniform float qxPower;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat qxGlow=exp(-dot(vMapUv-qxLight,vMapUv-qxLight)*20.0)*qxPower;diffuseColor.rgb+=vec3(.10,.075,.035)*qxGlow;')};
     const mesh=new THREE.Mesh(geometry,material);mesh.userData.light=light;mesh.userData.aspect=aspect;mesh.userData.detail=i>0;s.group.add(mesh);s.meshes.push(mesh);
   });
   s.ready=true;s.loading=false;dirty=true;wake();
 }catch{s.loading=false;s.failed=true;s.stage.classList.remove('scene-ready')}
}
function createDust(){
 if(dust){dustScene.remove(dust);dustGeometry.dispose();dustMaterial.dispose()}
 count=innerWidth<720?240:1000;base=new Float32Array(count*3);positions=new Float32Array(count*3);velocity=new Float32Array(count*2);sizes=new Float32Array(count);
 const colors=new Float32Array(count*3);let seed=1729;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
 for(let i=0;i<count;i++){base[i*3]=positions[i*3]=rand()*w;base[i*3+1]=positions[i*3+1]=rand()*h;base[i*3+2]=positions[i*3+2]=0;sizes[i]=.8+rand()*1.5;const c=new THREE.Color(rand()>.93?'#a1613f':'#7c9290');colors.set([c.r,c.g,c.b],i*3)}
 dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));dustGeometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));dustGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 dustMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{dpr:{value:renderer.getPixelRatio()},opacity:{value:.3}},vertexShader:`attribute float size; attribute vec3 color; varying vec3 vColor; uniform float dpr; void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*dpr;}`,fragmentShader:`varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(.1,.5,d))*opacity;gl_FragColor=vec4(vColor,a);}`});
 dust=new THREE.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;dustScene.add(dust);
}
function updateDust(dt){
 const radius=Math.min(w,h)*.15,age=performance.now()-lastPointerTime,strength=pointer.active?Math.exp(-Math.max(0,age-80)/230):0;
 energy=0;
 for(let i=0;i<count;i++){
   const k=i*3,j=i*2;let fx=(base[k]-positions[k])*24,fy=(base[k+1]-positions[k+1])*24;
   const dx=positions[k]-pointer.x,dy=positions[k+1]-pointer.y,d=Math.hypot(dx,dy);
   if(d<radius&&d>.01&&strength>.002){const falloff=(1-d/radius)**2,force=falloff*(95+pointer.speed*.09)*strength;fx+=(dx/d-dy/d*.22)*force;fy+=(dy/d+dx/d*.22)*force}
   velocity[j]=(velocity[j]+fx*dt)*Math.exp(-7*dt);velocity[j+1]=(velocity[j+1]+fy*dt)*Math.exp(-7*dt);
   const speed=Math.hypot(velocity[j],velocity[j+1]);if(speed>90){velocity[j]*=90/speed;velocity[j+1]*=90/speed}
   positions[k]+=velocity[j]*dt;positions[k+1]+=velocity[j+1]*dt;
   const ox=positions[k]-base[k],oy=positions[k+1]-base[k+1],offset=Math.hypot(ox,oy);if(offset>28){positions[k]=base[k]+ox/offset*28;positions[k+1]=base[k+1]+oy/offset*28}
   energy+=Math.abs(velocity[j])+Math.abs(velocity[j+1])+Math.abs(ox)+Math.abs(oy);
 }
 dustGeometry.attributes.position.needsUpdate=true;
}
function measure(){
 let best=null,area=0;
 for(const s of sections){const r=s.stage.getBoundingClientRect(),visible=Math.max(0,Math.min(h,r.bottom)-Math.max(95,r.top));if(visible>area){area=visible;best=s}}
 if(area<30)best=null;
 if(best!==current){if(current?.group)scene.remove(current.group);current=best;progress=targetProgress();dirty=true}
 if(current){load(current);const next=sections[sections.indexOf(current)+1];if(next&&!next.failed)load(next)}
 store.setExperience({scene:current?.id||null,sceneProgress:targetProgress()});
}
function targetProgress(){if(!current)return 0;const r=current.section.getBoundingClientRect();return clamp(((parseFloat(getComputedStyle(current.stage).top)||96)-r.top)/Math.max(1,current.section.offsetHeight-current.stage.offsetHeight))}
function renderFrame(time){
 raf=0;if(!enabled()||!renderer){fallback();return}
 const started=performance.now();const dt=Math.min(.04,(time-last)/1000||.016);last=time;
 measure();
 if(!current){canvas.hidden=true;store.setExperience({rendering:false});return}
 document.body.classList.contains('scene-static')&&document.body.classList.remove('scene-static');canvas.hidden=false;store.setExperience({rendering:true,reducedMotion:false});
 const target=targetProgress();progress+=(target-progress)*(1-Math.exp(-14*dt));if(Math.abs(target-progress)<.0002)progress=target;
 const r=current.stage.getBoundingClientRect();const mobile=w<720;
 renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();
 renderer.setScissor(r.left,Math.max(0,h-r.bottom),r.width,Math.max(0,Math.min(h,r.bottom)-Math.max(0,r.top)));renderer.setScissorTest(true);
 renderer.setViewport(r.left,h-r.bottom,r.width,r.height);
 camera.aspect=r.width/r.height;camera.position.set(progress*.12,0,6-progress*current.zoom*6);camera.lookAt(progress*.09,0,0);camera.updateProjectionMatrix();
 if(current.ready){
   if(current.group.parent!==scene)scene.add(current.group);
   const viewH=2*Math.tan(THREE.MathUtils.degToRad(19))*6,viewW=viewH*camera.aspect;
   current.meshes.forEach((mesh,i)=>{
     const a=mesh.userData.aspect;
     const fit=Math.min(viewH*(mobile?.42:.69),viewW*(mobile?.78:.53)/a);
     const size=i?fit*.36:fit;
     mesh.scale.setScalar(size);mesh.position.set(mobile?0:viewW*.20,mobile?-viewH*.14:0,i?.24:0);
     if(i){mesh.position.x+=(mobile?-.25:-.35)*viewW;mesh.position.y-=viewH*.20;mesh.material.opacity=clamp((progress-.25)*2.5)*.9;mesh.rotation.z=(1-progress)*.03}
   });
   scene.updateMatrixWorld(true);camera.updateMatrixWorld();
   current.meshes.forEach(m=>m.userData.light.power.value=0);
   if(pointer.active&&pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top&&pointer.y<=r.bottom){mouse.set((pointer.x-r.left)/r.width*2-1,1-(pointer.y-r.top)/r.height*2);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(current.meshes)[0];if(hit){hit.object.userData.light.point.value.copy(hit.uv);hit.object.userData.light.power.value=1}}
   renderer.render(scene,camera);current.stage.classList.add('scene-ready');
 }
 renderer.setViewport(0,0,w,h);updateDust(dt);dustMaterial.uniforms.opacity.value=current.id==='technique'?.32:.26;renderer.render(dustScene,dustCamera);renderer.setScissorTest(false);
 current.stage.style.setProperty('--scene-p',progress.toFixed(4));current.section.dataset.progress=progress.toFixed(4);
 const text=progress>.67?current.end:current.text;if(current.desc.textContent!==text)current.desc.textContent=text;
 metrics.frames++;const cost=performance.now()-started;metrics.totalMS+=cost;metrics.maxMS=Math.max(metrics.maxMS,cost);snapshot();
 // Demand-driven: stable scroll and settled dust stop the animation loop.
 settled=Math.abs(target-progress)<.0002&&energy<.3&&!dirty?settled+1:0;dirty=false;
 if(settled<3)raf=requestAnimationFrame(renderFrame);else store.setExperience({rendering:false});
}
function wake(){if(renderer&&enabled()&&!raf){last=performance.now();settled=0;raf=requestAnimationFrame(renderFrame)}}
function suspend(){cancelAnimationFrame(raf);raf=0;canvas.hidden=true;store.setExperience({rendering:false})}
function syncMode(){modal=!!document.querySelector('dialog[open]');store.setExperience({reducedMotion:reduced.matches||document.body.classList.contains('no-motion')});if(!enabled()){suspend();if(!modal)fallback()}else{document.body.classList.contains('scene-static')&&document.body.classList.remove('scene-static');dirty=true;wake()}}
function point(e){
 pointer={...store.getState().pointer};lastPointerTime=performance.now();wake();
}
function leave(){pointer={...pointer,active:false,speed:0};store.setExperience({pointer:{...pointer}});wake()}
canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();contextLost=true;suspend();fallback()},{signal});
canvas.addEventListener("webglcontextrestored",()=>{contextLost=false;syncMode()},{signal});
function resize(){w=innerWidth;h=innerHeight;if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,w<720?1.25:1.6));renderer.setSize(w,h,false);dustCamera.right=w;dustCamera.bottom=h;dustCamera.updateProjectionMatrix();createDust();dirty=true;wake()}
document.addEventListener('qx:pointer',point,{signal});document.addEventListener('pointerleave',leave,{signal});document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')leave()},{passive:true,signal});document.addEventListener('pointercancel',leave,{signal});
addEventListener('blur',leave,{signal});addEventListener('scroll',()=>{dirty=true;wake()},{passive:true,signal});addEventListener('resize',resize,{signal});
document.addEventListener('visibilitychange',syncMode,{signal});reduced.addEventListener('change',syncMode,{signal});document.getElementById('motion').addEventListener('click',syncMode,{signal});
const observer=new MutationObserver(syncMode);observer.observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
function dispose(){if(dead)return;dead=true;suspend();controller.abort();observer.disconnect();textures.forEach(t=>t.dispose());sections.forEach(s=>s.meshes.forEach(m=>{m.geometry.dispose();m.material.dispose()}));dustGeometry?.dispose();dustMaterial?.dispose();renderer?.dispose();canvas.remove();fallback()}
addEventListener('pagehide',e=>{if(e.persisted)suspend();else dispose()},{signal});addEventListener('pageshow',syncMode,{signal});
window.QX_SCENE_SYSTEM={dispose,getStats:()=>({...metrics,particles:count,energy,scene:current?.id,progress,renderers:renderer?1:0})};
if(renderer){createDust();load(sections[0]);syncMode()}else fallback();


