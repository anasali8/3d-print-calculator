import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Config, Material, PricingSettings } from '../../server/types';
import { defaultConfig, safeCatalog, calculate, validateMaterials, validateSettings } from '../../server/pricing';
const STORE = 'print-calculator-settings';
const KEY = 'config';
const json = (data:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const secret = () => process.env['SESSION_SECRET'] ?? '';
const token = (expiry:number) => `${expiry}.${createHmac('sha256',secret()).update(String(expiry)).digest('hex')}`;
const isAuthed=(request:Request)=>{if(!secret()||secret().length<32)return false;const value=/admin_session=([^;]+)/.exec(request.headers.get('cookie')??'')?.[1];if(!value)return false;const [ex,sig]=decodeURIComponent(value).split('.');const expiry=Number(ex);if(!Number.isSafeInteger(expiry)||expiry<=Date.now()||!sig||!/^[a-f0-9]{64}$/.test(sig))return false;return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(createHmac('sha256',secret()).update(ex).digest('hex'),'hex'))};
const parse=async(request:Request)=>{try{return await request.json()}catch{return null}};
const getConfig=async():Promise<Config>=>{const store=getStore(STORE);return (await store.get(KEY,{type:'json'})) as Config|null ?? structuredClone(defaultConfig)};
const setConfig=async(value:Config)=>getStore(STORE).setJSON(KEY,value);
const same=(a:string,b:string)=>{const ah=createHmac('sha256','login').update(a).digest();const bh=createHmac('sha256','login').update(b).digest();return timingSafeEqual(ah,bh)};
export default async function handler(request:Request){const path=new URL(request.url).pathname.replace(/^\/(?:\.netlify\/functions\/api|api)\/?/,'').replace(/\/$/,'');const method=request.method;
 try{
 if(path==='catalog'&&method==='GET')return json(safeCatalog(await getConfig()));
 if(path==='calculate'&&method==='POST'){const data=await parse(request);try{return json(calculate(await getConfig(),data))}catch(error){return json({error:(error as Error).message},400)}}
 if(path==='login'&&method==='POST'){const data=await parse(request);const username=process.env['ADMIN_USERNAME']??'';const password=process.env['ADMIN_PASSWORD']??'';if(!username||!password||secret().length<32)return json({error:'Admin credentials are not configured.'},503);if(typeof data?.username!=='string'||typeof data?.password!=='string'||!same(data.username,username)||!same(data.password,password))return json({error:'Invalid credentials.'},401);const signed=token(Date.now()+1000*60*60*12);return json({ok:true},200,{'Set-Cookie':`admin_session=${signed}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`})}
 if(path==='session'&&method==='GET')return json({authenticated:isAuthed(request)});
 if(path==='logout'&&method==='POST')return json({ok:true},200,{'Set-Cookie':'admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'});
 if(path.startsWith('admin/')){
 if(!isAuthed(request))return json({error:'Unauthorized'},401);
 if(path==='admin/config'&&method==='GET')return json(await getConfig());
 if(path==='admin/materials'&&method==='PUT'){const body=await parse(request);const materials=validateMaterials(body?.materials);const current=await getConfig();await setConfig({...current,materials});return json({ok:true})}
 if(path==='admin/settings'&&method==='PUT'){const body=await parse(request);const settings=validateSettings(body?.settings);const current=await getConfig();await setConfig({...current,settings});return json({ok:true})}
 }
 return json({error:'Not found'},404)
 }catch(error){if(error instanceof Error&&error.name==='ValidationError')return json({error:error.message},400);console.error(error);return json({error:'Server error. Please retry.'},500)}
}
