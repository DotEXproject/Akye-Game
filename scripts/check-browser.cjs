const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
 fs.mkdirSync('browser-evidence',{recursive:true});
 try {
 for(const [name,options] of [['desktop',{viewport:{width:1440,height:900}}],['mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]]){
  const context=await browser.newContext(options);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto('http://127.0.0.1:8765/game/',{waitUntil:'domcontentloaded'});
   // The production introduction is intentionally modal and makes the page inert.
   // Dismiss it through its normal silent-entry action before testing the game UI.
   const silentEntry=page.locator('#akye-arrival [data-silent]');
   if(await silentEntry.isVisible()){
    await silentEntry.click();
    const skip=page.locator('#akye-arrival [data-skip]');
    if(await skip.isVisible())await skip.click();
   }
   const click=async selector=>{const l=page.locator(selector);await l.waitFor({state:'visible'});if(options.hasTouch)await l.tap();else await l.click();};
   if(await page.locator('#selectPlayers').isVisible())await click('#selectPlayers');
   await click('#local');
   await click('#counts [data-n="3"]');
   await page.locator('#variant').selectOption('all');
   await click('#startMatch');
   await click('#chooseNormal');
   await page.locator('#board .node').first().waitFor();
   assert.equal(await page.locator('#board .node').count(),9);
   const board=await page.locator('#board').boundingBox();
   assert(board.x>=-1 && board.x+board.width<=options.viewport.width+1,'board exceeds viewport');
   for(const i of [0,3,1,4,2])await click('#board .node:nth-match(button, 1)'.replace('.node:nth-match(button, 1)', '.node')+'[aria-label^="Point '+(i+1)+':"]');
   assert.equal(await page.locator('#board .node.win').count(),3,'winning line');
   assert.equal(errors.length,0,errors.join('\n'));
   await page.screenshot({path:'browser-evidence/'+name+'.png',fullPage:true});
   console.log(name+' placement, victory and layout passed');
  }finally{await context.close();}
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
