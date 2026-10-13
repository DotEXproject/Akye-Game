/* Setup first, explicit play view, visible reserve inventory and fitted full-screen board. */
const detailedRender=render;
let fittingFrame=null;
let setupStage='welcome';
function reserveTokensRemaining(w){return Math.max(0,count-placed[w]);}
function renderReserves(){
  if(!active)return;
  $('#banks').innerHTML=[1,2].map(w=>{const remaining=reserveTokensRemaining(w);return `<section class="reserve-player"><div class="reserve-heading"><strong>${esc(playerLabel(w))}</strong><span>${remaining} ${prefs.lang==='tw'?'aka':'in reserve'}</span></div><div class="reserve-slots">${Array.from({length:count},(_,i)=>i<remaining?`<button class="reserve-piece" data-bank="${w}" aria-label="${esc(playerLabel(w))}: ${remaining} tokens in reserve">${tokenMarkup(w)}</button>`:'<span class="reserve-empty" aria-hidden="true"></span>').join('')}</div></section>`;}).join('');
}
render=function(){detailedRender();syncPlayLayout();};
function syncPlayLayout(){
  document.body.classList.toggle('selecting',!active&&setupStage==='selection');document.body.classList.toggle('welcome',!active&&setupStage==='welcome');
  const phase=$('#phaseChip'),hud=$('#playScore');if(!phase||!hud)return;
  phase.textContent=tr(placed[1]===count&&placed[2]===count?'The slide':'The drop');
  hud.classList.toggle('hidden',!active);hud.textContent=$('#score').textContent;
  if(active&&!ended&&!online){$('#instruction').textContent=prefs.lang==='tw'?(placed[p]<count?tr('Place a coin on any empty point.'):tr('Select your coin, then a connected empty point.')):(placed[p]<count?'Place one token on an empty point.':'Select a token, then an adjacent empty point.');}
  renderReserves();
  $('#focusRestart').disabled=!!online&&online.status==='playing';
  $('#focusPass').disabled=ended||legal(b,p,placed).length>0||(online?(p!==online.you||online.status!=='playing'):(ai&&p===2));
  $('#focusInvite').classList.toggle('hidden',!online);$('#instruction').title=$('#instruction').textContent;$('#fullscreen').setAttribute('aria-label',$('#fullscreen').textContent);
  scheduleBoardFit();
}
function fitBoard(){
  if(!active||!document.body.classList.contains('focus-play'))return;
  const area=document.querySelector('.layout>section'),board=document.querySelector('.boardShell');if(!area||!board)return;
  const bounds=area.getBoundingClientRect(),reserveHeight=$('#banks').getBoundingClientRect().height;
  const size=Math.floor(Math.min(bounds.width-8,bounds.height-reserveHeight-18));
  if(size>100)board.style.setProperty('--fitted-board-size',size+'px');
}
function scheduleBoardFit(){if(fittingFrame!==null)return;fittingFrame=requestAnimationFrame(()=>{fittingFrame=null;fitBoard();});}
async function setPlayView(full){
  if(!full){if(document.fullscreenElement)await document.exitFullscreen?.();document.body.classList.remove('focus-play');$('#fullscreen').textContent='⛶ Full screen';}
  else {let native=!!document.fullscreenElement;try{if(!native&&document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();native=!!document.fullscreenElement;}}catch{}
    document.body.classList.add('focus-play');$('#fullscreen').textContent=native?'Exit full screen':'Exit board view';}
  syncPlayLayout();
}
async function toggleFullScreen(){await setPlayView(!(document.body.classList.contains('focus-play')||document.fullscreenElement));}
function choosePlayView(startMatch){
  showModal(`${closeButton()}<div class="eyebrow">READY TO PLAY</div><h2>Choose your play view</h2><p>Your names, tokens and rules are ready. How would you like to play?</p><div class="view-choices"><button class="gold" id="chooseFull"><strong>⛶ Full-screen play</strong><span>A larger board with compact controls.</span></button><button id="chooseNormal"><strong>Normal board view</strong><span>Board and match panel together.</span></button></div><p class="note">On browsers without native full screen, the focused board view uses the available page space.</p>`);
  $('#chooseFull').onclick=()=>{closeModal();startMatch();return setPlayView(true);};
  $('#chooseNormal').onclick=()=>{closeModal();startMatch();return setPlayView(false);};
}
$('#startMatch').onclick=()=>{if(selectedOpponent===null)return;const opponent=selectedOpponent;choosePlayView(()=>begin(opponent));};
const startConnectedMatch=startOnline;startOnline=function(snapshot){choosePlayView(()=>startConnectedMatch(snapshot));};
$('#fullscreen').onclick=()=>toggleFullScreen();
$('#focusRestart').onclick=()=>$('#restart').click();$('#focusPass').onclick=()=>$('#pass').click();
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){document.body.classList.remove('focus-play');$('#fullscreen').textContent='⛶ Full screen';}syncPlayLayout();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){document.body.classList.remove('focus-play');$('#fullscreen').textContent='⛶ Full screen';syncPlayLayout();}});
window.addEventListener?.('resize',scheduleBoardFit);window.visualViewport?.addEventListener('resize',scheduleBoardFit);
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(scheduleBoardFit);observer.observe($('#app'));}
syncPlayLayout();

function showPlayerSelection(){setupStage='selection';resetOpponentChoice();syncPlayLayout();$('#setup').scrollIntoView?.({block:'start',behavior:prefs.reduced?'auto':'smooth'});}
function showWelcome(){setupStage='welcome';resetOpponentChoice();closeModal();syncPlayLayout();window.scrollTo?.({top:0,behavior:prefs.reduced?'auto':'smooth'});}
const chooseOpponent=selectOpponent;selectOpponent=function(computer){setupStage='selection';chooseOpponent(computer);syncPlayLayout();};
const returnToSetup=menu;menu=function(){returnToSetup();if(!active){setupStage='welcome';syncPlayLayout();}};
const leaveConnected=leaveOnline;leaveOnline=function(){setupStage='welcome';leaveConnected();syncPlayLayout();};
$('#selectPlayers').onclick=showPlayerSelection;$('#backWelcome').onclick=showWelcome;$('#menu').onclick=()=>menu();
syncPlayLayout();
