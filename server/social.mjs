import {initial} from './rules.mjs';

const reply=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
export const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>crypto.randomUUID().replaceAll('-','');
const secretKey=()=>random()+random();
const cookie=secret=>`__Host-achi=${secret}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`;
const handleOf=value=>String(value||'').trim().toLowerCase();
const validHandle=value=>/^[a-z][a-z0-9_]{2,19}$/.test(value);
const pair=(a,b)=>[a,b].sort().join(':');
const ready=new WeakMap();

// Additive, idempotent upgrade: existing players, rooms and results are retained.
export const socialSchema=[
  `CREATE TABLE IF NOT EXISTS akye_accounts (player_id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, key_hash TEXT NOT NULL, discoverable INTEGER NOT NULL DEFAULT 1, visible INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS akye_sessions (token_hash TEXT PRIMARY KEY, player_id TEXT NOT NULL, expires INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS akye_sessions_player ON akye_sessions(player_id)`,
  `CREATE TABLE IF NOT EXISTS akye_presence (player_id TEXT PRIMARY KEY, last_seen INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS akye_friends (pair TEXT PRIMARY KEY, sender TEXT NOT NULL, receiver TEXT NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS akye_friends_receiver ON akye_friends(receiver,status)`,
  `CREATE INDEX IF NOT EXISTS akye_friends_sender ON akye_friends(sender,status)`,
  `CREATE TABLE IF NOT EXISTS akye_blocks (owner TEXT NOT NULL, target TEXT NOT NULL, PRIMARY KEY(owner,target))`,
  `CREATE TABLE IF NOT EXISTS akye_challenges (id TEXT PRIMARY KEY, sender TEXT NOT NULL, receiver TEXT NOT NULL, room TEXT UNIQUE NOT NULL, status TEXT NOT NULL, settings TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS akye_challenges_receiver ON akye_challenges(receiver,status,expires)`,
  `CREATE INDEX IF NOT EXISTS akye_challenges_sender ON akye_challenges(sender,status,expires)`,
  `CREATE TABLE IF NOT EXISTS akye_limits (key TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(key,bucket))`
];
export async function ensureSocial(db){
  if(!ready.has(db))ready.set(db,db.batch(socialSchema.map(sql=>db.prepare(sql))).catch(e=>{ready.delete(db);throw e;}));
  await ready.get(db);
}
export async function identify(request,db){
  const token=(request.headers.get('cookie')||'').match(/(?:^|;\s*)__Host-achi=([a-f0-9]{32})(?:;|$)/)?.[1];
  if(!token)return {id:null,player:null,token:null,account:null};
  const tokenHash=await digest(token),now=Date.now();
  const session=await db.prepare('SELECT player_id FROM akye_sessions WHERE token_hash=? AND expires>?').bind(tokenHash,now).first();
  let id=session?.player_id||tokenHash;
  let account=await db.prepare('SELECT handle,discoverable,visible FROM akye_accounts WHERE player_id=?').bind(id).first();
  // A former guest cookie cannot bypass account sign-in after conversion.
  if(account&&!session)return {id:null,player:null,token:null,account:null};
  const player=await db.prepare('SELECT * FROM players WHERE id=?').bind(id).first();
  return {id:player?id:null,player,token,tokenHash,account};
}
async function limited(db,key,max,period=60000){
  const now=Date.now(),bucket=Math.floor(now/period)*period;
  const r=await db.prepare('INSERT INTO akye_limits(key,bucket,count) VALUES(?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET count=count+1 RETURNING count').bind(key,bucket).first();
  // Bound old rate records, expired sessions and stale presence without scheduled services.
  if(r.count===1)await db.batch([
    db.prepare('DELETE FROM akye_limits WHERE bucket<?').bind(now-172800000),
    db.prepare('DELETE FROM akye_sessions WHERE expires<?').bind(now),
    db.prepare('DELETE FROM akye_presence WHERE last_seen<?').bind(now-86400000),
    db.prepare("DELETE FROM akye_challenges WHERE expires<?").bind(now-86400000)
  ]);
  return r.count<=max;
}
async function blocked(db,a,b){return !!await db.prepare('SELECT 1 FROM akye_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(a,b,b,a).first();}
async function targetAccount(db,handle){return db.prepare('SELECT a.*,p.name FROM akye_accounts a JOIN players p ON p.id=a.player_id WHERE a.handle=?').bind(handleOf(handle)).first();}
async function busy(db,id,now=Date.now()){return !!await db.prepare("SELECT 1 FROM rooms WHERE (p1=? OR p2=?) AND json_extract(state,'$.status')='playing' AND json_extract(state,'$.deadline')>? LIMIT 1").bind(id,id,now).first();}
async function signIn(db,id){const token=random();await db.prepare('INSERT INTO akye_sessions(token_hash,player_id,expires) VALUES(?,?,?)').bind(await digest(token),id,Date.now()+2592000000).run();return cookie(token);}
const accountView=ctx=>({handle:ctx.account.handle,name:ctx.player.name,discoverable:!!ctx.account.discoverable,visible:!!ctx.account.visible});

export async function social(request,db,ctx,path,body){
  const action=path.join('/'),post=request.method==='POST',now=Date.now();
  if(path[0]!=='account'&&path[0]!=='friends'&&path[0]!=='challenges')return null;
  if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
  if(action==='account'&&!post)return reply({account:ctx.account?accountView(ctx):null});
  if(action==='account/register'&&post){
    if(ctx.account)return reply({error:'You already have a player account.'},409);
    const handle=handleOf(body.handle);
    if(!validHandle(handle))return reply({error:'Player IDs need 3–20 letters, numbers or underscores and must begin with a letter.'},400);
    const ip=await digest(request.headers.get('CF-Connecting-IP')||'local');
    if(!await limited(db,'register:'+ip,5,86400000))return reply({error:'Please try creating an account tomorrow.'},429);
    if(await targetAccount(db,handle))return reply({error:'That player ID is already taken.'},409);
    const id=ctx.id||random(),key=secretKey(),name=String(body.name||handle).trim().slice(0,24)||handle;
    try{await db.batch([
      db.prepare('INSERT INTO players(id,name,created) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').bind(id,name,now),
      db.prepare('INSERT INTO akye_accounts(player_id,handle,key_hash) VALUES(?,?,?)').bind(id,handle,await digest(key))
    ]);}catch{return reply({error:'That player ID is already taken. Choose another.'},409);}
    return reply({account:{handle,name,discoverable:true,visible:true},signInCode:key},201,{'set-cookie':await signIn(db,id)});
  }
  if(action==='account/login'&&post){
    const handle=handleOf(body.handle),key=String(body.signInCode||'').trim().toLowerCase();
    const ip=await digest(request.headers.get('CF-Connecting-IP')||'local');
    if(!await limited(db,'login-ip:'+ip,30)||!await limited(db,'login-id:'+handle,15))return reply({error:'Too many sign-in attempts. Wait a minute.'},429);
    const a=validHandle(handle)?await targetAccount(db,handle):null;
    const hashed=await digest(key);
    if(!a||! /^[a-f0-9]{64}$/.test(key)||hashed!==a.key_hash)return reply({error:'Player ID or private sign-in code is incorrect.'},401);
    if(ctx.tokenHash)await db.prepare('DELETE FROM akye_sessions WHERE token_hash=?').bind(ctx.tokenHash).run();
    return reply({account:{handle:a.handle,name:a.name,discoverable:!!a.discoverable,visible:!!a.visible}},200,{'set-cookie':await signIn(db,a.player_id)});
  }
  if(!ctx.account)return reply({error:'Create a player account or sign in to use friends.'},401);
  const id=ctx.id;
  if(action==='account/logout'&&post){
    if(ctx.tokenHash)await db.prepare('DELETE FROM akye_sessions WHERE token_hash=?').bind(ctx.tokenHash).run();
    await db.prepare('DELETE FROM akye_presence WHERE player_id=?').bind(id).run();
    return reply({ok:true},200,{'set-cookie':'__Host-achi=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'});
  }
  if(action==='account/settings'&&post){
    if(typeof body.visible!=='boolean'||typeof body.discoverable!=='boolean')return reply({error:'Choose valid privacy settings.'},400);
    await db.prepare('UPDATE akye_accounts SET visible=?,discoverable=? WHERE player_id=?').bind(+body.visible,+body.discoverable,id).run();
    return reply({ok:true});
  }
  if(action==='account/rotate'&&post){
    const key=secretKey();
    await db.batch([db.prepare('UPDATE akye_accounts SET key_hash=? WHERE player_id=?').bind(await digest(key),id),db.prepare('DELETE FROM akye_sessions WHERE player_id=?').bind(id)]);
    return reply({signInCode:key},200,{'set-cookie':await signIn(db,id)});
  }
  if(action==='friends/pulse'&&post){
    if(!await limited(db,'pulse:'+id,12))return reply({error:'Please wait before refreshing.'},429);
    await db.prepare('INSERT INTO akye_presence(player_id,last_seen) VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET last_seen=excluded.last_seen').bind(id,now).run();
    const rows=await db.prepare(`SELECT f.status,f.sender,f.receiver,a.handle,p.name,a.visible,pr.last_seen,
      EXISTS(SELECT 1 FROM rooms r WHERE (r.p1=a.player_id OR r.p2=a.player_id) AND json_extract(r.state,'$.status')='playing' AND json_extract(r.state,'$.deadline')>?) in_game
      FROM akye_friends f JOIN akye_accounts a ON a.player_id=CASE WHEN f.sender=? THEN f.receiver ELSE f.sender END
      JOIN players p ON p.id=a.player_id LEFT JOIN akye_presence pr ON pr.player_id=a.player_id
      WHERE (f.sender=? OR f.receiver=?) AND NOT EXISTS(SELECT 1 FROM akye_blocks b WHERE (b.owner=? AND b.target=a.player_id) OR (b.target=? AND b.owner=a.player_id)) ORDER BY p.name LIMIT 200`).bind(now,id,id,id,id,id).all();
    const friends=rows.results.map(r=>({handle:r.handle,name:r.name,relationship:r.status==='accepted'?'friend':r.sender===id?'sent':'received',status:r.status==='accepted'&&r.visible&&r.last_seen>now-60000?(r.in_game?'In a game':'Online'):'Offline'}));
    const c=await db.prepare(`SELECT c.id,c.room,c.status,c.sender,c.created,c.expires,c.settings,a.handle,p.name FROM akye_challenges c JOIN akye_accounts a ON a.player_id=CASE WHEN c.sender=? THEN c.receiver ELSE c.sender END JOIN players p ON p.id=a.player_id
      WHERE (c.sender=? OR c.receiver=?) AND c.expires>? AND c.status IN ('pending','accepted')
      AND NOT EXISTS(SELECT 1 FROM akye_blocks b WHERE (b.owner=? AND b.target=a.player_id) OR (b.target=? AND b.owner=a.player_id)) ORDER BY c.created DESC LIMIT 30`).bind(id,id,id,now,id,id).all();
    const blocks=await db.prepare('SELECT a.handle,p.name FROM akye_blocks b JOIN akye_accounts a ON a.player_id=b.target JOIN players p ON p.id=a.player_id WHERE b.owner=?').bind(id).all();
    return reply({account:accountView(ctx),friends,challenges:c.results.map(r=>({id:r.id,room:r.status==='accepted'?r.room:null,status:r.status,direction:r.sender===id?'sent':'received',handle:r.handle,name:r.name,expires:r.expires,settings:JSON.parse(r.settings)})),blocks:blocks.results});
  }
  if(action==='friends/search'&&!post){
    if(!await limited(db,'search:'+id,20))return reply({error:'Please wait before searching again.'},429);
    const q=handleOf(new URL(request.url).searchParams.get('q'));
    if(!/^[a-z][a-z0-9_]{2,19}$/.test(q))return reply({players:[]});
    // Escape LIKE metacharacters: an underscore in an ID is a literal character.
    const prefix=q.replaceAll('_','\\_')+'%';
    const r=await db.prepare(`SELECT a.handle,p.name FROM akye_accounts a JOIN players p ON p.id=a.player_id WHERE a.discoverable=1 AND a.player_id<>? AND a.handle LIKE ? ESCAPE '\\'
      AND NOT EXISTS(SELECT 1 FROM akye_blocks b WHERE (b.owner=? AND b.target=a.player_id) OR (b.target=? AND b.owner=a.player_id)) ORDER BY a.handle LIMIT 10`).bind(id,prefix,id,id).all();
    return reply({players:r.results});
  }
  if(action==='friends/action'&&post){
    if(!await limited(db,'friends:'+id,20))return reply({error:'Please wait before sending another request.'},429);
    const a=await targetAccount(db,body.handle);
    if(!a||a.player_id===id)return reply({error:'Player not available.'},404);
    const target=a.player_id,key=pair(id,target),op=body.action;
    if(op==='unblock'){await db.prepare('DELETE FROM akye_blocks WHERE owner=? AND target=?').bind(id,target).run();return reply({ok:true});}
    if(op==='block'){
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO akye_blocks(owner,target) VALUES(?,?)').bind(id,target),
        db.prepare('DELETE FROM akye_friends WHERE pair=?').bind(key),
        db.prepare("UPDATE akye_challenges SET status='cancelled' WHERE status='pending' AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?))").bind(id,target,target,id)
      ]);return reply({ok:true});
    }
    if(await blocked(db,id,target))return reply({error:'Player not available.'},404);
    if(op==='request'){
      if(!a.discoverable)return reply({error:'Player not available.'},404);
      const total=await db.prepare('SELECT COUNT(*) n FROM akye_friends WHERE sender=? OR receiver=?').bind(id,id).first();
      if(total.n>=100)return reply({error:'Your friends list is full. Remove an old request or friend first.'},409);
      await db.prepare("INSERT OR IGNORE INTO akye_friends(pair,sender,receiver,status,created) VALUES(?,?,?,'pending',?)").bind(key,id,target,now).run();return reply({ok:true});
    }
    if(op==='accept'){
      const r=await db.prepare("UPDATE akye_friends SET status='accepted' WHERE pair=? AND receiver=? AND status='pending'").bind(key,id).run();
      return r.meta.changes?reply({ok:true}):reply({error:'Friend request no longer available.'},409);
    }
    if(op==='remove'||op==='decline'){
      await db.batch([
        db.prepare('DELETE FROM akye_friends WHERE pair=? AND (sender=? OR receiver=?)').bind(key,id,id),
        db.prepare("UPDATE akye_challenges SET status='cancelled' WHERE status='pending' AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?))").bind(id,target,target,id)
      ]);return reply({ok:true});
    }
    return reply({error:'Unknown friend action.'},400);
  }
  if(action==='challenges'&&post){
    if(!await limited(db,'challenge:'+id,5))return reply({error:'Please wait a minute before sending another challenge.'},429);
    const a=await targetAccount(db,body.handle);
    if(!a||a.player_id===id||await blocked(db,id,a.player_id))return reply({error:'Friend not available.'},404);
    const f=await db.prepare("SELECT 1 FROM akye_friends WHERE pair=? AND status='accepted'").bind(pair(id,a.player_id)).first();
    if(!f)return reply({error:'You need to be accepted friends first.'},403);
    const presence=await db.prepare('SELECT last_seen FROM akye_presence WHERE player_id=?').bind(a.player_id).first();
    if(!a.visible||!presence||presence.last_seen<now-60000)return reply({error:'Your friend is offline. Try again when they are online.'},409);
    if(await busy(db,id)||await busy(db,a.player_id))return reply({error:'Finish the current match before starting another.'},409);
    const existing=await db.prepare("SELECT 1 FROM akye_challenges WHERE status='pending' AND expires>? AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?))").bind(now,id,a.player_id,a.player_id,id).first();
    if(existing)return reply({error:'A challenge between you is already waiting.'},409);
    const tokens=Array.isArray(body.tokens)&&body.tokens.length===2&&body.tokens.every(x=>['cowrie','gye','star'].includes(x))&&body.tokens[0]!==body.tokens[1]?body.tokens:['cowrie','gye'];
    const settings={count:body.count===3?3:4,centre:body.centre===true,tokens};
    const code=random();await db.prepare("INSERT INTO akye_challenges(id,sender,receiver,room,status,settings,created,expires) VALUES(?,?,?,?,'pending',?,?,?)").bind(code,id,a.player_id,random(),JSON.stringify(settings),now,now+300000).run();
    return reply({challenge:code});
  }
  if(path[0]==='challenges'&&/^[a-f0-9]{32}$/.test(path[1]||'')&&post){
    const c=await db.prepare('SELECT * FROM akye_challenges WHERE id=?').bind(path[1]).first();
    if(!c||![c.sender,c.receiver].includes(id))return reply({error:'Challenge not found.'},404);
    if(path[2]==='dismiss'){
      // Acknowledgements are local to each browser; never hide a match from its opponent.
      return reply({ok:true});
    }
    if(c.status==='accepted'&&path[2]==='accept'&&c.receiver===id)return reply({room:c.room});
    if(c.status!=='pending'||c.expires<=now)return reply({error:'This challenge is no longer available.'},410);
    if(path[2]==='cancel'&&c.sender===id||path[2]==='decline'&&c.receiver===id){
      await db.prepare("UPDATE akye_challenges SET status=? WHERE id=? AND status='pending'").bind(path[2]==='cancel'?'cancelled':'declined',c.id).run();return reply({ok:true});
    }
    if(path[2]!=='accept'||c.receiver!==id)return reply({error:'Only the invited friend can accept.'},403);
    if(await blocked(db,c.sender,c.receiver)||!await db.prepare("SELECT 1 FROM akye_friends WHERE pair=? AND status='accepted'").bind(pair(c.sender,c.receiver)).first())return reply({error:'Friendship no longer available.'},403);
    const settings=JSON.parse(c.settings),s=initial(settings.count,settings.centre,settings.tokens);s.status='playing';s.deadline=now+300000;
    // Batch is atomic; INSERT's condition serialises simultaneous accepts into different rooms.
    const result=await db.batch([
      db.prepare(`INSERT OR IGNORE INTO rooms(id,p1,p2,state,created,updated)
        SELECT room,sender,receiver,?,?,? FROM akye_challenges WHERE id=? AND status='pending' AND expires>?
        AND NOT EXISTS(SELECT 1 FROM rooms WHERE (p1 IN (?,?) OR p2 IN (?,?)) AND json_extract(state,'$.status')='playing' AND json_extract(state,'$.deadline')>?)`).bind(JSON.stringify(s),now,now,c.id,now,c.sender,c.receiver,c.sender,c.receiver,now),
      db.prepare("UPDATE akye_challenges SET status='accepted' WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM rooms WHERE id=?)").bind(c.id,c.room),
      db.prepare("UPDATE akye_challenges SET status='cancelled' WHERE id<>? AND status='pending' AND EXISTS(SELECT 1 FROM rooms WHERE id=?) AND (sender IN (?,?) OR receiver IN (?,?))").bind(c.id,c.room,c.sender,c.receiver,c.sender,c.receiver)
    ]);
    if(!result[0].meta.changes){const existing=await db.prepare("SELECT room FROM akye_challenges WHERE id=? AND status='accepted'").bind(c.id).first();return existing?reply({room:existing.room}):reply({error:'One of you is already in a match.'},409);}
    return reply({room:c.room});
  }
  return reply({error:'Action not found.'},404);
}
