import { useMemo } from 'react';
import type { SyntaxHighlighterProps } from '@assistant-ui/react-markdown';
import { highlight, languageName } from './highlight';
import { UiIcon } from '../app/UiIcon';

export function CodeHighlight({language,code,components:{Pre,Code}}:SyntaxHighlighterProps){
  const command=['bash','sh','shell','zsh','powershell','ps1','ps','pwsh','cmd','bat','batch'].includes(language.toLowerCase());
  const html=useMemo(()=>{
    const name=languageName(language);
    // Keep long/unknown blocks readable without running expensive language detection.
    if(code.length>30_000)return undefined;
    return name?highlight(code,name):undefined;
  },[language,code]);
  // highlight.js escapes input; only its generated token markup reaches innerHTML.
  return <div className={`code-block-body ${command?'command-snippet':''}`}><span className="code-gutter" title={command?'Extrait de commande · non exécuté':'Extrait de code'}><UiIcon name={command?'terminal':'file'} flat/></span><Pre>{html===undefined?<Code>{code}</Code>:<Code className="hljs" dangerouslySetInnerHTML={{__html:html}}/>}</Pre></div>;
}
