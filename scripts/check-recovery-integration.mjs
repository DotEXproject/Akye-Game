import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 const sent=[],env={AKYE_MAILER:{send:async m=>sent.push(m)}};let cookie='';
 async function call(route,body,authenticated=false){
  const response=await handle(new Request('https://test.example/api/achi/'+route,{method:body===undefined?'GET':'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':'203.0.113.88',...(authenticated&&cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)}),db,env);
  if(authenticated&&response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  return {status:response.status,data:await response.json()};
 }
 const registered=await call('account/register',{handle:'recover_alpha',ageGroup:'adult',name:'Recover Alpha'},true);
 assert.equal(registered.status,201);const original=registered.data.signInCode;
 assert.equal((await call('account/email/request',{email:'owner@example.test'},true)).status,200);
 assert.equal(sent.length,1);
 const verify=sent[0].text.match(/code is: ([a-f0-9]{64})/)[1];
 assert.equal((await call('account/email/verify',{recoveryCode:'0'.repeat(64)},true)).status,400);
 assert.equal((await call('account/email/verify',{recoveryCode:verify},true)).status,200);
 assert.equal((await call('account/email/verify',{recoveryCode:verify},true)).status,400);
 const requested=await call('account/recovery/request',{handle:'recover_alpha'});
 assert.equal(requested.status,200);assert.equal(sent.length,2);
 const recovery=sent[1].text.match(/code is: ([a-f0-9]{64})/)[1];
 assert.equal((await call('account/recovery/complete',{handle:'recover_alpha',recoveryCode:'0'.repeat(64)})).status,400);
 const completed=await call('account/recovery/complete',{handle:'recover_alpha',recoveryCode:recovery});
 assert.equal(completed.status,200);assert.match(completed.data.signInCode,/^[a-f0-9]{64}$/);
 assert.notEqual(completed.data.signInCode,original);
 assert.equal((await call('account/recovery/complete',{handle:'recover_alpha',recoveryCode:recovery})).status,400);
 assert.equal((await call('account/login',{handle:'recover_alpha',signInCode:original})).status,401);
 assert.equal((await call('account/login',{handle:'recover_alpha',signInCode:completed.data.signInCode})).status,200);
 assert.equal((await call('account/recovery/request',{handle:'unknown_alpha'})).status,200);
 assert.equal(sent.length,2);
 console.log('Passed: verified email, invalid/replayed codes, private code rotation, old-code invalidation, unknown account privacy.');
}finally{await mf.dispose();}
