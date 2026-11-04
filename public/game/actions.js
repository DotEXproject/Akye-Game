/* No inline scripts or string evaluation: only these UI actions are executable. */
document.addEventListener('click', event => {
 const button=event.target.closest('[data-game-action]');if(!button)return;
 switch(button.dataset.gameAction){
 case 'archive':archive();break;case 'history':archive('history');break;case 'rules':archive('rules');break;
 case 'closeArchive':closeArchive();break;case 'closeModal':closeModal();break;
 case 'menu':menu();break;case 'newRound':newRound();break;case 'friendsPage':friendsPage();break;
 case 'dedication':dedication();break;case 'originalSymbols':originalSymbols();break;
 case 'tutorial':tutorial();break;case 'shareInvite':shareInvite();break;
 case 'sound':document.querySelector('#sound').click();break;
 case 'heritage':if(['atumpan','kete'].includes(button.dataset.sound))playHeritageSound(button.dataset.sound,button);break;
 }
});
