import type { ChatItem } from '../../../shared/contracts';
import { UiIcon } from '../app/UiIcon';
import { actionPresentation } from './actionPresentation';
type Action=ChatItem['actions'][number];
type Kind='terminal'|'edit'|'read'|'search'|'tool';
export type WorkRow={id:string;kind:Kind;verb:string;targets:string[];titles:string[];state:Action['state'];actions:Action[]};
const icons:Record<Kind,string>={terminal:'terminal',edit:'file',read:'search',search:'search',tool:'settings'};
const baseName=(path:string)=>path.split(/[\\/]/).filter(Boolean).pop()??path;
function classify(action:Action):{kind:Kind|'thinking';target:string;title:string;label:string} {
  const presentation=actionPresentation(action);const name=action.label.toLowerCase();
  const kind=presentation.icon==='spark'?'thinking':presentation.icon==='terminal'?'terminal':presentation.icon==='file'?'edit':presentation.icon==='search'?(/read/.test(name)?'read':'search'):'tool';
  const path=kind==='edit'||kind==='read';
  return {kind,target:path?baseName(presentation.context):presentation.context,title:presentation.context,label:presentation.label};
}
const worst=(states:Action['state'][])=>states.includes('error')?'error':states.includes('running')?'running':'done';
// Thinking is shown by the activity indicator; consecutive edits or reads read as one line.
export function workLog(actions:Action[]){
  const rows:WorkRow[]=[];
  for(const action of actions){
    const {kind,target,title,label}=classify(action);if(kind==='thinking')continue;
    const last=rows.at(-1);
    if(last&&last.kind===kind&&(kind==='edit'||kind==='read')){
      last.actions.push(action);if(target&&!last.targets.includes(target)){last.targets.push(target);last.titles.push(title);}
      last.state=worst(last.actions.map(item=>item.state));continue;
    }
    rows.push({id:action.id,kind,verb:kind==='terminal'?'Commande':kind==='edit'?'Modifié':kind==='read'?'Lu':kind==='search'?'Recherché':label,targets:target?[target]:[],titles:title?[title]:[],state:action.state,actions:[action]});
  }
  for(const row of rows)if(row.targets.length>1)row.verb=`${row.kind==='edit'?'Modifié':'Lu'} ${row.targets.length} fichiers`;
  const counted=rows.flatMap(row=>row.actions);
  const files=new Set(rows.filter(row=>row.kind==='edit').flatMap(row=>row.titles));
  return {rows,summary:{actions:counted.length,files:files.size,commands:rows.filter(row=>row.kind==='terminal').length,errors:counted.filter(action=>action.state==='error').length}};
}
function Row({row}:{row:WorkRow}){
  return <details className={`work-row ${row.state}`}>
    <summary><UiIcon name={icons[row.kind]} flat/><span className="work-verb">{row.verb}</span>{row.targets.length>0&&<code title={row.titles.join('\n')}>{row.targets.join(', ')}</code>}
      {row.state==='running'&&<span className="work-running" aria-label="En cours"/>}{row.state==='error'&&<span className="work-error">à vérifier</span>}</summary>
    {row.actions.map(action=><pre key={action.id}>{action.detail}</pre>)}
  </details>;
}
const plural=(count:number,word:string)=>`${count} ${word}${count>1?'s':''}`;
// While a turn runs, rows show progress; afterwards the whole log folds into one line.
export function WorkLog({actions,live}:{actions:Action[];live:boolean}){
  const {rows,summary}=workLog(actions);if(!rows.length)return null;
  const list=<div className="work-rows">{rows.map(row=><Row key={row.id} row={row}/>)}</div>;
  if(live)return <div className="work-log">{list}</div>;
  const parts=[summary.files&&`${plural(summary.files,'fichier')} ${summary.files>1?'modifiés':'modifié'}`,summary.commands&&plural(summary.commands,'commande')].filter(Boolean).join(', ');
  return <details className="work-log work-summary">
    <summary><UiIcon name="chevron" flat/><span>Travail · {plural(summary.actions,'action')}{parts&&` — ${parts}`}</span>{summary.errors>0&&<span className="work-error">{summary.errors} à vérifier</span>}</summary>
    {list}
  </details>;
}
