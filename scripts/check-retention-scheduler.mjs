import assert from 'node:assert/strict';
import worker from '../standalone/worker.mjs';
assert.equal(typeof worker.scheduled,'function');
let waited;
const events=[];
const db={prepare(sql){
 if(sql.includes('FROM akye_account_activity a JOIN akye_accounts p'))return {bind(){return {all:async()=>({results:[]})}}};
 if(sql.includes('FROM akye_account_activity a'))return {bind(){return {all:async()=>({results:[]})}}};
 throw new Error('Unexpected SQL in scheduled retention: '+sql);
}};
const oldLog=console.info;
try{
 console.info=(...args)=>events.push(args);
 await worker.scheduled({}, {DB:db,AKYE_RETENTION_WARNINGS_ENABLED:'false'}, {waitUntil(p){waited=p}});
 assert.ok(waited,'scheduler must register async work');
 await waited;
 assert.ok(events.some(e=>e[0]==='Akye retention summary'));
 const summary=JSON.parse(events.find(e=>e[0]==='Akye retention summary')[1]);
 assert.equal(summary.dryRun,true);
 assert.equal(summary.sent,0);
 console.log=oldLog;
 oldLog('Passed: scheduled retention execution, waitUntil and disabled-by-default warning delivery.');
}finally{console.info=oldLog;}
