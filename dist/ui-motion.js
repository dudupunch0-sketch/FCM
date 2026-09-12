// Presentation only. Editing commits before any animation starts.
export function captureSlots(container){
  return Array.from(container.children).map(node=>node.getBoundingClientRect?.());
}
export function animateSlots(container,before,operation,reduced=false){
  if(reduced)return;
  Array.from(container.children).forEach((node,index)=>{
    if(!node.animate)return;
    let from=index;
    if(operation.type==='move'){
      const to=operation.index+operation.direction;
      if(index===to)from=operation.index;else if(index===operation.index)from=to;
    }else if(operation.type==='remove'&&index>=operation.index)from=index+1;
    const old=before[from],now=node.getBoundingClientRect();
    if(old&&Math.abs(old.left-now.left)>.5){
      node.animate([{transform:`translateX(${old.left-now.left}px)`},{transform:'translateX(0)'}],{duration:120,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    const highlight=operation.type==='undo'||operation.type==='replace'&&index===operation.index||operation.type==='add'&&index===operation.index;
    if(highlight)node.animate([{opacity:.35},{opacity:1}],{duration:140,easing:'ease-out'});
  });
}
