const fs=require('fs'),vm=require('vm');
let base=fs.readFileSync('scripts/check-game.cjs','utf8');base=base.slice(0,base.indexOf("console.log('Passed:"));
const extra=`
(async()=>{
  c.URL=URL;c.URLSearchParams=URLSearchParams;c.location={search:'',origin:'https://test.example',pathname:'/akye/'};c.history={replaceState(){}};c.localStorage.removeItem=k=>local.delete(k);
  const calls=[],model={account:null,friends:[],challenges:[],blocks:[]};
  const room='a'.repeat(32),challenge='b'.repeat(32),privateCode='c'.repeat(64);
  c.fetch=async(path,options={})=>{
    const action=path.replace('/api/achi/','');calls.push(action);let data={};
    if(action==='account')data={account:model.account};
    if(action==='account/register'){model.account={handle:'ama_obeng',name:'Ama',visible:true,discoverable:true};data={account:model.account,signInCode:privateCode};}
    if(action==='friends/pulse')data=structuredClone(model);
    if(action==='rooms/'+room+'/join')data={room,version:0,you:1,names:['Ama','Kofi'],serverNow:Date.now(),state:{board:Array(9).fill(0),placed:[0,0,0],count:4,centre:false,tokens:['cowrie','gye'],turn:1,moves:0,slides:0,line:[],lastMove:null,status:'playing',deadline:Date.now()+300000}};
    return {ok:true,json:async()=>data};
  };
  vm.runInContext(fs.readFileSync('public/game/online.js','utf8'),c);
  vm.runInContext(fs.readFileSync('public/game/friends.js','utf8'),c);
  const settle=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
  await settle();await vm.runInContext('friendsPage()',c);
  check(\`if(!document.querySelector('#modal').innerHTML.includes('Create player account'))throw Error('guest account entry');document.querySelector('#friendHandle').value='ama_obeng';document.querySelector('#friendName').value='Ama';document.querySelector('#friendAuthForm').onsubmit({preventDefault(){}});\`);
  await settle();check(\`if(document.querySelector('#newFriendCode').value!=='c'.repeat(64))throw Error('private code not displayed');if(!document.querySelector('#modal').innerHTML.includes('Save your private code'))throw Error('backup instruction');\`);
  for(const value of local.values())if(String(value).includes(privateCode))throw Error('private sign-in code stored in local storage');
  model.friends=[{handle:'kofi_obeng',name:'<img onerror=alert(1)>',relationship:'friend',status:'Online'},{handle:'abena_obeng',name:'Abena',relationship:'received',status:'Offline'}];
  await vm.runInContext('friendsPage()',c);await settle();
  check(\`if(!document.querySelector('#friendsLists').innerHTML.includes('Challenge')||!document.querySelector('#friendsLists').innerHTML.includes('data-friend-action="accept"'))throw Error('friend controls');if(document.querySelector('#friendsLists').innerHTML.includes('<img onerror'))throw Error('stored name injection');\`);
  // A closed modal retains its DOM. It must not trigger a match switch during local play.
  check('closeModal();active=true;ended=false;online=null;');
  model.challenges=[{id:challenge,room,status:'accepted',direction:'sent',handle:'kofi_obeng',name:'Kofi',expires:Date.now()+300000,settings:{count:4,centre:false,tokens:['cowrie','gye']}}];
  await vm.runInContext('friendPulse()',c);await settle();
  if(calls.includes('rooms/'+room+'/join'))throw Error('accepted challenge interrupted local play');
  check('active=false;');await vm.runInContext('friendPulse()',c);await settle();
  check(\`if(!online||online.room!=='a'.repeat(32))throw Error('sender did not join accepted challenge');if(!friendSeen.has('b'.repeat(32)))throw Error('challenge not acknowledged');\`);
  const joins=calls.filter(x=>x==='rooms/'+room+'/join').length;await vm.runInContext('friendPulse()',c);await settle();
  if(calls.filter(x=>x==='rooms/'+room+'/join').length!==joins)throw Error('accepted challenge reopened');
  check(\`leaveOnline();count=3;centre=true;begin(false);b=[1,2,1,2,0,2,1,0,0];placed=[0,3,3];p=1;slides=38;seen=new Map();move([6,7]);if(ended||slides!==39)throw Error('early local draw');move([5,8]);if(!ended||slides!==40)throw Error('local draw cap');\`);
  console.log('Passed: guest/account entry, private-code backup without local storage, safe friend rendering, request/challenge controls, non-disruptive notifications, automatic accepted-match entry, duplicate suppression and local 40-slide boundary. Browser/device visual QA remains separate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
`;
vm.runInThisContext('(function(require){'+base+extra+'})')(require);
