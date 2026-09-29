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
// One embedded highlighter for chat code blocks and Git diffs, limited to these grammars.
Object.entries({csharp,javascript,typescript,xml,css,json,bash,powershell,python,sql,yaml,diff}).forEach(([name,grammar])=>hljs.registerLanguage(name,grammar));
const aliases:Record<string,string>={'c#':'csharp',cs:'csharp',jsx:'javascript',js:'javascript',mjs:'javascript',cjs:'javascript',ts:'typescript',tsx:'typescript',mts:'typescript',cts:'typescript',
  html:'xml',htm:'xml',vue:'xml',svg:'xml',csproj:'xml',props:'xml',targets:'xml',xaml:'xml',shell:'bash',sh:'bash',ps1:'powershell',psm1:'powershell',ps:'powershell',yml:'yaml',py:'python',scss:'css'};
export function languageName(requested:string):string|undefined {
  const lower=requested.toLowerCase();const name=Object.hasOwn(aliases,lower)?aliases[lower]:lower;
  return hljs.getLanguage(name)?name:undefined;
}
export function languageForPath(path:string):string|undefined {
  const extension=/\.([a-z0-9]+)$/i.exec(path)?.[1];return extension?languageName(extension):undefined;
}
// highlight.js escapes its input; callers may pass the returned markup to innerHTML.
export function highlight(code:string,language:string):string|undefined {
  try{return hljs.highlight(code,{language,ignoreIllegals:true}).value;}catch{return undefined;}
}
