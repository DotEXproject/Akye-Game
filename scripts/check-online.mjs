import {Miniflare} from 'miniflare';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {handle} from '../server/api.mjs';
import {regeneratedLives} from '../server/rules.mjs';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-01',d1Databases:['DB']});
try {const db=await mf.getD1Database('DB');const sql=await readFile(new URL('../drizzle/0000_perpetual_blink.sql',import.meta.url),'utf8');for(const stmt of sql.split('--> statement-breakpoint'))await db.prepare(stmt).run();
const clients=[{}, {}, {}];async function call(w,path,body){const c=clients[w];const req=new Request('https://test.example/api/achi/'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://test.example',...(c.cookie?{cookie:c.cookie}:{}),...(body===undefined?{}:{'content-type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});const r=await handle(req,db);if(r.headers.has('set-cookie'))c.cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};}
for(let i=0;i<3;i++)assert.equal((await call(i,'profile',{name:'Player '+i})).status,200);
let room=(await call(0,'rooms',{count:3,centre:false,tokens:['cowrie','gye']})).data.room;
assert.equal((await call(0,'rooms/'+room+'/join',{})).data.state.status,'waiting');
let s=(await call(1,'rooms/'+room+'/join',{})).data;assert.equal(s.state.status,'playing');assert.equal((await call(2,'rooms/'+room+'/join',{})).status,409);
assert.equal((await call(1,'rooms/'+room+'/move',{version:s.version,move:[-1,0]})).status,409);
assert.equal((await call(0,'rooms/'+room+'/move',{version:s.version,move:[-1,99]})).status,400);
for(const [who,at] of [[0,0],[1,3],[0,1],[1,4],[0,2]]){let r=await call(who,'rooms/'+room+'/move',{version:s.version,move:[-1,at]});assert.equal(r.status,200);s=r.data;}
assert.equal(s.state.winner,1);assert.equal((await call(0,'rooms/'+room+'/move',{version:s.version,move:[-1,8]})).status,409);
assert.equal((await call(1,'rooms/'+room)).data.state.winner,1);assert.equal((await call(2,'rooms/'+room)).status,403);
let ranks=(await call(2,'leaderboard')).data.players;assert.equal(ranks[0].points,3);assert.equal(ranks[0].wins,1);
assert.equal((await db.prepare('SELECT COUNT(*) n FROM results').first()).n,1);
room=(await call(0,'rooms',{count:4,centre:true})).data.room;s=(await call(1,'rooms/'+room+'/join',{})).data;
const simultaneous=await Promise.all([call(0,'rooms/'+room+'/move',{version:s.version,move:[-1,0]}),call(0,'rooms/'+room+'/move',{version:s.version,move:[-1,1]})]);assert.equal(simultaneous.filter(x=>x.status===200).length,1);
s=(await call(1,'rooms/'+room)).data;assert.equal(s.state.moves,1);let conceded=await call(1,'rooms/'+room+'/resign',{version:s.version});assert.equal(conceded.data.state.winner,1);
assert.deepEqual(regeneratedLives(1,0,600001),{balance:3,anchor:600000});assert.equal(regeneratedLives(4,0,600001).balance,5);assert.equal(regeneratedLives(3,600000,1).balance,3);
console.log('Passed: separate sessions, invitations, room capacity, turn ownership, server legality, synchronized win, reconnect, private room access, atomic concurrent moves, single result credit, leaderboard, resignation and future lives clock policy.');
}finally{await mf.dispose();}
