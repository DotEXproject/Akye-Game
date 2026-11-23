import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 let cookie='';
 async function call(route,body){
  const response=await handle(new Request('https://test.example/api/achi/'+route,{method:'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':'192.0.2.119',...(cookie?{cookie}:{})},body:JSON.stringify(body)}),db);
  if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  return {status:response.status,data:await response.json()};
 }
 const registered=await call('account/register',{handle:'erase_alpha',name:'Erase Alpha',ageGroup:'adult'});
 assert.equal(registered.status,201);
 const secret=registered.data.signInCode;
 const id=(await db.prepare("SELECT player_id FROM akye_accounts WHERE handle='erase_alpha'").first()).player_id;
 await db.prepare('INSERT INTO results(room,p1,p2,winner,created) VALUES(?,?,?,?,?)').bind('e'.repeat(32),id,'other-player',1,Date.now()).run();
 assert.equal((await call('account/delete',{signInCode:'0'.repeat(64)})).status,403);
 assert.equal((await db.prepare('SELECT 1 FROM akye_accounts WHERE player_id=?').bind(id).first())?.[1],undefined);
 const deleted=await call('account/delete',{signInCode:secret});
 assert.equal(deleted.status,200);assert.equal(deleted.data.history,'anonymised');
 for(const [table,column] of [['players','id'],['akye_accounts','player_id'],['akye_sessions','player_id'],['akye_account_activity','player_id'],['akye_recovery','player_id'],['akye_guardians','player_id']])
  assert.equal(await db.prepare('SELECT 1 FROM '+table+' WHERE '+column+'=?').bind(id).first(),null,table);
 const row=await db.prepare("SELECT p1,p2,winner FROM results WHERE room=?").bind('e'.repeat(32)).first();
 assert.ok(row);assert.match(row.p1,/^deleted:[a-f0-9]{32}$/);assert.notEqual(row.p1,id);assert.equal(row.p2,'other-player');assert.equal(row.winner,1);
 assert.equal((await call('account/login',{handle:'erase_alpha',signInCode:secret})).status,401);
 console.log('Passed: deletion requires private code, removes account/session/activity data, preserves anonymised match statistics, rejects old login.');
}finally{await mf.dispose();}
