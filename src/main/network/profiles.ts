import type { NetworkProfile } from '../../shared/contracts';
import { object, text, provider } from '../ipc/validation';
export function validateNetworkProfile(value:unknown):NetworkProfile{
  const data=object(value,['provider','proxyUrl','certificatePath','launcher']);const profile:NetworkProfile={provider:provider(data.provider)};
  if(data.proxyUrl){
    const url=new URL(text(data.proxyUrl,2048));
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('INVALID_PROXY_URL');
    profile.proxyUrl=url.toString();
  }
  if(data.certificatePath)profile.certificatePath=text(data.certificatePath,4096);
  if(data.launcher){
    const launcher=object(data.launcher,['executable','args','host','port']);const executable=text(launcher.executable,4096);
    if(!Array.isArray(launcher.args)||launcher.args.length>100)throw new Error('INVALID_PROXY_ARGUMENTS');
    const args=launcher.args.map(arg=>text(arg,4096));
    if(args.some(arg=>/(?:--?|\/)(?:password|passwd|username|user|token|secret|credential|authorization)(?:[=:]|$)/i.test(arg)||/:\/\/[^\s/]*@/.test(arg)))throw new Error('PROXY_CREDENTIALS_FORBIDDEN');
    if(!['127.0.0.1','::1','localhost'].includes(String(launcher.host))||!Number.isInteger(launcher.port)||Number(launcher.port)<1||Number(launcher.port)>65535)throw new Error('INVALID_PROXY_LISTENER');
    profile.launcher={executable,args,host:String(launcher.host),port:Number(launcher.port)};
  }
  return profile;
}
export function buildProviderEnv(base:NodeJS.ProcessEnv,profile:NetworkProfile):NodeJS.ProcessEnv{
  const env={...base};
  if(profile.proxyUrl){
    for(const key of Object.keys(env))if(['http_proxy','https_proxy','all_proxy'].includes(key.toLowerCase()))delete env[key];
    env.HTTP_PROXY=profile.proxyUrl;env.HTTPS_PROXY=profile.proxyUrl;env.ALL_PROXY=profile.proxyUrl;
  }
  if(profile.certificatePath)env[profile.provider==='claude'?'NODE_EXTRA_CA_CERTS':'CODEX_CA_CERTIFICATE']=profile.certificatePath;
  return env;
}
