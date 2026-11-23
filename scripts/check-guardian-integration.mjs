import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 const sent=[];
 const env={AKYE_MAILER:{send:async mail=>{sent.push(mail);}}};
 let cookie='';
 async function call(route,body,withCookie=false){
  const r=await handle(new Request('https://test.example/api/achi/'+route,{method:body===undefined?'GET':'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':'198.51.100.72',...(withCookie&&cookie?{cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)}),db,env);
  if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  return {status:r.status,data:await r.json()};
 }
 assert.equal((await call('account/register',{handle:'child_alpha',ageGroup:'child',guardianEmail:'guardian@example.test'})).status,201);
 assert.equal(sent.length,1);
 const child=await db.prepare("SELECT a.player_id FROM akye_accounts a WHERE a.handle='child_alpha'").first();
 assert.equal((await call('account/login',{handle:'child_alpha',signInCode:'0'.repeat(64)})).status,401);
 assert.equal((await call('account/guardian/decision',{handle:'child_alpha',guardianCode:'0'.repeat(64),decision:'approve'})).status,400);
 const approvalCode=sent[0].text.match(/Code: ([a-f0-9]{64})/)[1];
 assert.equal((await call('account/guardian/decision',{handle:'child_alpha',guardianCode:approvalCode,decision:'approve'})).status,200);
 assert.equal((await call('account/guardian/decision',{handle:'child_alpha',guardianCode:approvalCode,decision:'approve'})).status,400);
 await db.prepare('INSERT INTO rooms(id,p1,p2,state,created,updated) VALUES(?,?,?,?,?,?)').bind('b'.repeat(32),child.player_id,'another-player',JSON.stringify({status:'playing',deadline:Date.now()+60000}),Date.now(),Date.now()).run();
 const revoke=await call('account/guardian/revoke/request',{handle:'child_alpha'});
 assert.equal(revoke.status,200);assert.equal(sent.length,2);
 const revokeCode=sent[1].text.match(/code is: ([a-f0-9]{64})/)[1];
 assert.equal((await call('account/guardian/decision',{handle:'child_alpha',guardianCode:revokeCode,decision:'revoke'})).status,200);
 assert.equal((await db.prepare('SELECT status FROM akye_guardians WHERE player_id=?').bind(child.player_id).first()).status,'revoked');
 assert.equal(await db.prepare('SELECT 1 FROM rooms WHERE p1=? OR p2=?').bind(child.player_id,child.player_id).first(),null,'revocation must end active rooms');
 assert.equal((await call('account/guardian/decision',{handle:'child_alpha',guardianCode:revokeCode,decision:'revoke'})).status,400);
 const failed=await handle(new Request('https://test.example/api/achi/account/register',{method:'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':'198.51.100.200'},body:JSON.stringify({handle:'failed_child',ageGroup:'child',guardianEmail:'guardian@example.test'})}),db,{AKYE_MAILER:{send:async()=>{throw new Error('Provider outage')}}});
 assert.equal(failed.status,503);
 assert.equal(await db.prepare("SELECT 1 FROM akye_accounts WHERE handle='failed_child'").first(),null);
 console.log('Passed: guardian registration, email challenge, invalid/one-time approval and revocation, persisted status.');
}finally{await mf.dispose();}
