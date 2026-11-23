import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
import {retentionCandidates,inactivityCutoffs} from '../server/social.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 const now=Date.UTC(2026,10,23,12),{warningBefore,expiryBefore}=inactivityCutoffs(now);
 async function register(handle,ip){
  const response=await handle(new Request('https://test.example/api/achi/account/register',{method:'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':ip},body:JSON.stringify({handle,ageGroup:'adult'})}),db);
  assert.equal(response.status,201,await response.text());
  return (await db.prepare('SELECT player_id FROM akye_accounts WHERE handle=?').bind(handle).first()).player_id;
 }
 const expired=await register('expired_alpha','192.0.2.1'),warning=await register('warning_alpha','192.0.2.2'),active=await register('active_alpha','192.0.2.3');
 await db.prepare('UPDATE akye_account_activity SET last_active=? WHERE player_id=?').bind(expiryBefore-1000,expired).run();
 await db.prepare('UPDATE akye_account_activity SET last_active=? WHERE player_id=?').bind(warningBefore-1000,warning).run();
 await db.prepare('UPDATE akye_account_activity SET last_active=? WHERE player_id=?').bind(now,active).run();
 const candidates=await retentionCandidates(db,now);
 assert.equal(candidates.length,2);
 assert.equal(candidates.find(x=>x.player_id===expired).status,'expired');
 assert.equal(candidates.find(x=>x.player_id===warning).status,'warning');
 assert.ok(!candidates.some(x=>x.player_id===active));
 for(const id of [expired,warning,active])assert.ok(await db.prepare('SELECT 1 FROM akye_accounts WHERE player_id=?').bind(id).first(),'dry-run must not delete accounts');
 console.log('Passed: 11-month warning and 12-month expiry candidate selection, active exclusion and non-destructive retention review.');
}finally{await mf.dispose();}
