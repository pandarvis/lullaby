import type { Phase } from '../../../shared/contracts';
import { phaseLabels } from './sidebarModel';
export function StateMark({phase}:{phase:Phase}){
  const warning=phase==='waiting'||phase==='interrupted';
  return <span className={`state-mark ${phase}`} role="img" aria-label={phaseLabels[phase]}>
    {warning&&<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 20H2z"/><path className="glyph" d="M12 9v5m0 3h.01"/></svg>}
    {phase==='error'&&<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path className="glyph" d="m9 9 6 6m0-6-6 6"/></svg>}
  </span>;
}
