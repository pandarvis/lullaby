import { useMemo } from 'react';
import type { SyntaxHighlighterProps } from '@assistant-ui/react-markdown';
import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import diff from 'highlight.js/lib/languages/diff';
import { UiIcon } from '../app/UiIcon';

Object.entries({csharp,javascript,typescript,xml,css,json,bash,powershell,python,sql,yaml,diff}).forEach(([name,grammar])=>hljs.registerLanguage(name,grammar));
const aliases:Record<string,string>={'c#':'csharp',cs:'csharp',jsx:'javascript',tsx:'typescript',html:'xml',htm:'xml',vue:'xml',shell:'bash',sh:'bash',ps1:'powershell',ps:'powershell',yml:'yaml'};
export function CodeHighlight({language,code,components:{Pre,Code}}:SyntaxHighlighterProps){
  const command=['bash','sh','shell','zsh','powershell','ps1','ps','pwsh','cmd','bat','batch'].includes(language.toLowerCase());
  const html=useMemo(()=>{
    const requested=language.toLowerCase();const name=Object.hasOwn(aliases,requested)?aliases[requested]:requested;
    // Keep long/unknown blocks readable without running expensive language detection.
    if(code.length>30_000)return undefined;
    try{if(!hljs.getLanguage(name))return undefined;return hljs.highlight(code,{language:name,ignoreIllegals:true}).value;}catch{return undefined;}
  },[language,code]);
  // highlight.js escapes input; only its generated token markup reaches innerHTML.
  return <div className={`code-block-body ${command?'command-snippet':''}`}><span className="code-gutter" title={command?'Extrait de commande · non exécuté':'Extrait de code'}><UiIcon name={command?'terminal':'file'}/></span><Pre>{html===undefined?<Code>{code}</Code>:<Code className="hljs" dangerouslySetInnerHTML={{__html:html}}/>}</Pre></div>;
}
