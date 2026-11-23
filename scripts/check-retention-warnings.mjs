import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
import {sendRetentionWarnings,inactivityCutoffs} from '../server/social.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 const now=Date.UTC(2026,10,23,12),{warningBefore}=inactivityCutoffs(now);
 const sent=[],env={AKYE_MAILER:{send:async m=>sent.push(m)}};
 const response=await handle(new Request('https://test.example/api/achi/account/register',{method:'POST',headers:{origin:'https://test.example','content-type':'application/json','CF-Connecting-IP':'198.51.100.25'},body:JSON.stringify({handle:'warning_alpha',ageGroup:'adult'})}),db,env);
 assert.equal(response.status,201);
 const id=(await db.prepare("SELECT player_id FROM akye_accounts WHERE handle='warning_alpha'").first()).player_id;
 await db.prepare('INSERT INTO akye_recovery(player_id,email,verified) VALUES(?,?,1)').bind(id,'verified@example.test').run();
 await db.prepare('UPDATE akye_account_activity SET last_active=? WHERE player_id=?').bind(warningBefore-1000,id).run();
 const dry=await sendRetentionWarnings(db,env,now);
 assert.equal(dry.eligible,1);assert.equal(dry.sent,0);assert.equal(sent.length,0);
 const actual=await sendRetentionWarnings(db,env,now,{dryRun:false});
 assert.equal(actual.sent,1);assert.equal(sent.length,1);assert.equal(sent[0].to,'verified@example.test');
 assert.ok((await db.prepare('SELECT warned_at FROM akye_account_activity WHERE player_id=?').bind(id).first()).warned_at);
 assert.equal((await sendRetentionWarnings(db,env,now,{dryRun:false})).sent,0);
 assert.equal(sent.length,1);
 assert.ok(await db.prepare('SELECT 1 FROM akye_accounts WHERE player_id=?').bind(id).first());
 console.log('Passed: retention warnings are dry-run by default, use verified email, send once and never delete accounts.');
}finally{await mf.dispose();}
