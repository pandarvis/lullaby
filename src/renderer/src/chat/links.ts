/** Preserve local HTML references for the preview button, never as navigable URLs. */
export function htmlPath(url:string):string|undefined{
  let value:string;try{value=decodeURIComponent(url);}catch{return undefined;}
  value=value.replace(/^file:\/\/\//i,'').replace(/^\/([a-z]:\/)/i,'$1');
  if(!/\.html?$/i.test(value))return undefined;
  if(/^[a-z]:[\\/]/i.test(value))return value;
  if(/^[a-z][a-z0-9+.-]*:/i.test(value)||value.startsWith('//')||value.startsWith('\\\\'))return undefined;
  return value;
}
export function safeMarkdownUrl(url:string):string{
  if(htmlPath(url))return url;
  return /^(?:https?:|mailto:|#)/i.test(url)||!/:/.test(url)?url:'';
}
