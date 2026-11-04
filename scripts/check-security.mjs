import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {handle} from '../server/api.mjs';
import worker from '../standalone/worker.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8')).split('--> statement-breakpoint'))await db.prepare(sql).run();
 const req=(path='profile',body='{}',headers={},method='POST')=>new Request('https://test.example/api/achi/'+path,{method,headers:{origin:'https://test.example','content-type':'application/json',...headers},...(method==='GET'?{}:{body})});
 for(const [request,status] of [
 [req('profile','{}',{},'DELETE'),405], [req('leaderboard','{}'),404],
 [req('profile','{}',{origin:'https://evil.example'}),403],
 [req('profile','{}',{'sec-fetch-site':'cross-site'}),403],
 [req('profile','{}',{'content-type':'text/plain'}),415],
 [req('profile','{}',{'content-encoding':'gzip'}),415],
 [req('profile','null'),400],[req('profile','[]'),400],[req('profile','{'),400],
 [req('profile','{"name":{}}'),400],[req('profile',JSON.stringify({name:'a'.repeat(25)})),400],
 [req('profile',JSON.stringify({padding:'界'.repeat(2000)})),413],
 [req('rooms/'+'a'.repeat(32)+'/move/extra'),404]
 ])assert.equal((await handle(request,db)).status,status);
 // Rejections happen before any player creation. Parallel issuance is bounded atomically.
 const responses=await Promise.all(Array.from({length:25},()=>handle(req(),db)));
 assert.equal(responses.filter(r=>r.status===200).length,20);
 assert.equal(responses.filter(r=>r.status===429).length,5);
 const cookie=responses.find(r=>r.status===200).headers.get('set-cookie').split(';')[0];
 const rooms=await Promise.all(Array.from({length:10},()=>handle(req('rooms','{}',{cookie}),db)));
 assert.equal(rooms.filter(r=>r.status===200).length,5);
 assert.equal(rooms.filter(r=>r.status===429).length,5);
 const room=(await rooms.find(r=>r.status===200).json()).room;
 assert.equal((await handle(req('rooms/'+room+'/unexpected','{}',{cookie}),db)).status,404);
 // The Worker applies security headers even to redirects, API failures and asset failures.
 const env={DB:db,ASSETS:{fetch:async()=>new Response('<html></html>',{headers:{'Content-Type':'text/html'}})}};
 for(const request of [new Request('https://test.example/'),new Request('https://test.example/akye/'),req('profile','null')]){
  const r=await worker.fetch(request,env);
  assert.match(r.headers.get('Content-Security-Policy'),/script-src 'self'; script-src-attr 'none'/);
  assert.equal(r.headers.get('X-Frame-Options'),'DENY');assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');
  assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff');assert.match(r.headers.get('Strict-Transport-Security'),/31536000/);
 }
 const failed=await worker.fetch(new Request('https://test.example/akye/'),{ASSETS:{fetch(){throw Error('secret internal details');}}});
 assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('secret'));
 for(const file of ['index.html','game.js','experience.js','friends.js','online.js'])assert.doesNotMatch(await readFile(new URL('../public/game/'+file,import.meta.url),'utf8'),/\bonclick\s*=["\x27]/);
 console.log('Passed: exact routes/methods, origin/fetch metadata, JSON media type/shape/types, bounded UTF-8 bodies, concurrent guest/room limits, security headers across responses and safe failure envelope.');
}finally{await mf.dispose();}
