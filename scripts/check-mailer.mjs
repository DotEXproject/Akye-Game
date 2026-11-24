import assert from 'node:assert/strict';
import {mailerFor,withMailer} from '../server/mailer.mjs';
assert.equal(mailerFor({}),null);
assert.equal(withMailer({}).AKYE_MAILER,undefined);
const stub={send:async()=>true};
assert.equal(mailerFor({AKYE_MAILER:stub}),stub);
const original=globalThis.fetch;
let calls=[];
try{
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id:'message-1'}),{status:200});};
 const mailer=mailerFor({RESEND_API_KEY:'test-only',AKYE_MAIL_FROM:'Akye <no-reply@example.test>'});
 await mailer.send({to:'guardian@example.test',subject:'Approval',text:'Code: test'});
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.resend.com/emails');
 assert.equal(calls[0].options.headers.Authorization,'Bearer test-only');
 await assert.rejects(()=>mailer.send({to:'not-an-email',subject:'Approval',text:'Code: test'}),/Invalid outbound email payload/);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(calls[0].options.body).to,['guardian@example.test']);
 globalThis.fetch=async()=>new Response('Unavailable',{status:503});
 await assert.rejects(()=>mailer.send({to:'guardian@example.test',subject:'Approval',text:'Code: test'}),/HTTP 503/);
 console.log('Passed: opt-in email adapter, request construction and provider failure propagation.');
}finally{globalThis.fetch=original;}
