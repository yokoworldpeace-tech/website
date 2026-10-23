/* Click-driven interpretation of undulating lines; no scroll hijacking. */
(() => {
  const target=document.getElementById('historyText');
  const original=selectHistory;
  let generation=0,animations=[];
  function finish(){generation++;animations.forEach(a=>a.cancel());animations=[]}
  function reveal(){
    finish(); const token=generation, text=target.textContent;
    target.getAnimations().forEach(a=>a.cancel());
    if(!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const fragment=document.createDocumentFragment();
    Array.from(text).forEach(char=>{const span=document.createElement('span');span.textContent=char;span.style.display='inline-block';span.setAttribute('aria-hidden','true');fragment.append(span)});
    target.setAttribute('aria-label',text);target.replaceChildren(fragment);
    const chars=[...target.children],rows=[];
    chars.forEach(span=>{const y=span.offsetTop;let row=rows.find(r=>Math.abs(r.y-y)<3);if(!row){row={y,items:[]};rows.push(row)}row.items.push(span)});
    rows.forEach((row,line)=>{
      const center=(row.items.length-1)/2;
      row.items.forEach((span,index)=>{
        const distance=Math.abs(index-center)/Math.max(1,center);
        const x=(center-index)*1.1;
        const a=span.animate([
          {transform:`translate(${x}px,${24+distance*17}px) rotate(${(index-center)*.12}deg)`,opacity:0},
          {transform:`translate(${x*.16}px,-3px) rotate(0deg)`,opacity:1,offset:.74},
          {transform:'translate(0,0)',opacity:1}
        ],{duration:760,delay:line*100+distance*130,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'});
        animations.push(a);
      });
    });
    Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(token!==generation)return;target.textContent=text;target.removeAttribute('aria-label');animations.forEach(a=>a.cancel());animations=[]});
  }
  selectHistory=function(i,b){finish();original(i,b);reveal()};
  const stop=()=>{const text=target.getAttribute('aria-label');finish();if(text){target.textContent=text;target.removeAttribute('aria-label')}};
  addEventListener('resize',stop,{passive:true});
  document.getElementById('motion').addEventListener('click',stop);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stop);
  addEventListener('pagehide',stop);
})();
