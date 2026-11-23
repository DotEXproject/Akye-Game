import {initial,play} from './rules.mjs';
import {ensureSocial,identify,social,limited,digest} from './social.mjs';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
const random=()=>crypto.randomUUID().replaceAll('-','');
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const clean=x=>String(x||'Player').trim().slice(0,24)||'Player';
export async function handle(request,db,env={}){try{
const url=new URL(request.url),path=url.pathname.replace(/^\/api\/achi\/?/,'').split('/');
if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405,{Allow:'GET, POST'});
const route=path.join('/');
const getRoutes=/^(profile|leaderboard|account|friends\/search|rooms\/[a-f0-9]{32})$/;
const postRoutes=/^(profile|rooms|account\/(register|login|logout|settings|rotate|delete|email\/(request|verify)|recovery\/(request|complete)|guardian\\/(decision|revoke\\/request))|friends\/(pulse|action)|challenges|challenges\/[a-f0-9]{32}\/(accept|cancel|decline|dismiss)|rooms\/[a-f0-9]{32}\/(join|move|pass|resign))$/;
if(!(request.method==='GET'?getRoutes:postRoutes).test(route))return json({error:'Action not found.'},404);
if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Open the game on its own website.'},403);
if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Open the game on its own website.'},403);
let body={};
if(request.method==='POST'){
 if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')return json({error:'Use application/json.'},415);
 if(request.headers.get('content-encoding'))return json({error:'Encoded bodies are not supported.'},415);
 if(Number(request.headers.get('content-length'))>4096)return json({error:'Request too large.'},413);
 const reader=request.body?.getReader();let size=0,chunks=[];
 if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return json({error:'Request too large.'},413);}chunks.push(value);}}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)||'{}');}catch{return json({error:'Invalid JSON.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Expected a JSON object.'},400);
 for(const field of ['name','handle','signInCode','action'])if(field in body&&typeof body[field]!=='string')return json({error:'Invalid field type.'},400);
 if('name' in body&&(body.name.length>24||/[\u0000-\u001f\u007f]/.test(body.name)))return json({error:'Use a display name of up to 24 characters.'},400);
}
await ensureSocial(db);
// Cloudflare overwrites CF-Connecting-IP at the edge; never use forwarded headers.
const ip=await digest(request.headers.get('CF-Connecting-IP')||'local');
if(!await limited(db,'api:'+ip,600))return json({error:'Too many requests. Please wait a minute.'},429,{'Retry-After':'60'});
const identity=await identify(request,db);let secret=identity.token,id=identity.id,player=identity.player;
if(path[0]==='leaderboard'){const rows=await db.prepare(`SELECT p.name,p.id,COUNT(r.room) games,SUM(CASE WHEN (r.p1=p.id AND r.winner=1) OR (r.p2=p.id AND r.winner=2) THEN 1 ELSE 0 END) wins,SUM(CASE WHEN r.winner=0 THEN 1 ELSE 0 END) draws,SUM(CASE WHEN (r.p1=p.id AND r.winner=1) OR (r.p2=p.id AND r.winner=2) THEN 3 WHEN r.winner=0 THEN 1 ELSE 0 END) points FROM players p JOIN results r ON r.p1=p.id OR r.p2=p.id GROUP BY p.id ORDER BY points DESC,wins DESC,p.created ASC LIMIT 50`).all();return json({players:rows.results.map(({id,...p})=>p),policy:'Online leaderboard · 3 points per win, 1 per draw. No local or Okyere results.'});}
const socialResponse=await social(request,db,identity,path,body,env);if(socialResponse)return socialResponse;
if(path[0]==='profile'&&request.method==='POST'){if(!player){if(!await limited(db,'guest:'+ip,20))return json({error:'Please wait before creating another player.'},429,{'Retry-After':'60'});secret=random();id=await hash(secret);await db.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?)').bind(id,clean(body.name),Date.now()).run();}else await db.prepare('UPDATE players SET name=? WHERE id=?').bind(clean(body.name),id).run();return json({name:clean(body.name),lives:{enabled:false,cap:5,regenerationSeconds:300,purchasesEnabled:false}},200,{'set-cookie':`__Host-achi=${secret}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=31536000`});}
if(!player)return json({error:'Choose your player name first.'},401);
if(path[0]==='profile')return json({name:player.name,lives:{enabled:false,cap:5,regenerationSeconds:300,purchasesEnabled:false}});
const now=Date.now();
if(path[0]==='rooms'&&request.method==='POST'&&!path[1]){if(!await limited(db,'room:'+id,5))return json({error:'Please wait a minute before creating another room.'},429);const code=random();const tokens=Array.isArray(body.tokens)&&body.tokens.length===2&&body.tokens.every(x=>['cowrie','gye','star'].includes(x))&&body.tokens[0]!==body.tokens[1]?body.tokens:['cowrie','gye'];await db.prepare('INSERT INTO rooms(id,p1,state,created,updated) VALUES(?,?,?,?,?)').bind(code,id,JSON.stringify(initial(body.count===3?3:4,body.centre===true,tokens)),now,now).run();return json({room:code});}
if(path[0]!=='rooms'||! /^[a-f0-9]{32}$/.test(path[1]||''))return json({error:'Room not found.'},404);
const code=path[1];let r=await db.prepare('SELECT * FROM rooms WHERE id=?').bind(code).first();if(!r)return json({error:'Room not found.'},404);let s=JSON.parse(r.state);
if(path[2]==='join'&&request.method==='POST'){if(r.p1===id||r.p2===id){}else if(r.p2)return json({error:'This room already has two players.'},409);else if(now-r.created>86400000)return json({error:'This invitation has expired.'},410);else {s.status='playing';s.deadline=now+300000;const change=await db.prepare('UPDATE rooms SET p2=?,state=?,version=version+1,updated=? WHERE id=? AND p2 IS NULL AND version=?').bind(id,JSON.stringify(s),now,code,r.version).run();if(!change.meta.changes)return json({error:'Another player joined first.'},409);}}
else {const who=r.p1===id?1:r.p2===id?2:0;if(!who)return json({error:'Join the room to see this match.'},403);
if(request.method==='POST'){
if(s.status!=='playing')return json({error:'This match is not active.'},409);if(body.version!==r.version)return json({error:'Board changed; refreshing.',refresh:true},409);
if(path[2]==='resign'){s.status='finished';s.winner=3-who;s.reason='resignation';}
else if(now>s.deadline){s.status='finished';s.winner=3-s.turn;s.reason='turn time expired';}
else if(path[2]==='move'||path[2]==='pass'){if(s.turn!==who)return json({error:'Wait for your turn.'},409);s=play(s,body.move,path[2]==='pass');s.deadline=now+300000;}else return json({error:'Unknown action.'},404);
const statements=[db.prepare('UPDATE rooms SET state=?,version=version+1,updated=? WHERE id=? AND version=?').bind(JSON.stringify(s),now,code,r.version)];
if(s.status==='finished')statements.push(db.prepare('INSERT OR IGNORE INTO results(room,p1,p2,winner,created) SELECT id,p1,p2,?,? FROM rooms WHERE id=? AND version=? AND state=?').bind(s.winner,now,code,r.version+1,JSON.stringify(s)));
const result=await db.batch(statements);if(!result[0].meta.changes)return json({error:'Board changed; refreshing.',refresh:true},409);
}}
r=await db.prepare('SELECT * FROM rooms WHERE id=?').bind(code).first();const names=await db.prepare('SELECT id,name FROM players WHERE id IN (?,?)').bind(r.p1,r.p2||'').all();return json({room:code,version:r.version,you:r.p1===id?1:2,state:JSON.parse(r.state),names:[names.results.find(x=>x.id===r.p1)?.name||'Player 1',names.results.find(x=>x.id===r.p2)?.name||'Waiting for opponent'],serverNow:Date.now()});
}catch(e){if(['Invalid move.','You have a legal move.'].includes(e.message))return json({error:e.message},400);const reference=crypto.randomUUID();console.warn(JSON.stringify({event:'akye_api_failure',reference}));return json({error:'Unable to complete the request. Please retry.',reference},503);}}