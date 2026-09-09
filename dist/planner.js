import {CARDS,RULES,span,makePlan} from './engine.js';
// Editing and forecasts never receive the hidden opponent plan.
export function editDraft(draft,operation){
  const next=[...draft],{type,index,id,direction}=operation;
  if(type==='clear')return [];
  if(type==='add'){if(!CARDS[id])throw Error('알 수 없는 카드');next.push(id);}
  else if(type==='replace'){if(!CARDS[id]||!next[index])throw Error('교체할 동작이 없습니다');next[index]=id;}
  else if(type==='remove'){if(!next[index])throw Error('삭제할 동작이 없습니다');next.splice(index,1);}
  else if(type==='move'){const to=index+direction;if(!next[index]||!next[to])return next;[next[index],next[to]]=[next[to],next[index]];}
  else throw Error('알 수 없는 편집');
  if(span(next)>RULES.slots)throw Error('남은 칸이 부족합니다');
  return next;
}
export function forecast(draft,fighter){
  let stamina=fighter.stamina;const failed=[];
  for(const p of makePlan(draft)){
    const c=CARDS[p.id];
    if(stamina<c.cost)failed.push(p.start);else stamina-=c.cost;
    if(c.kind==='rest')stamina=Math.min(RULES.maxStamina,stamina+RULES.restRecovery*(1-fighter.damage.body/200));
  }
  return {stamina,failed};
}
