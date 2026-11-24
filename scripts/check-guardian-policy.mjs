import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../server/social.mjs',import.meta.url),'utf8');
for(const needle of ['akye_guardians','account/guardian/decision','account/guardian/revoke/request',"guardian.status!=='approved'",'DELETE FROM akye_guardians','Child accounts require a guardian email'])assert.ok(s.includes(needle),needle);
const api=readFileSync(new URL('../server/api.mjs',import.meta.url),'utf8');
assert.ok(api.includes('guardian')&&api.includes('revoke'),'guardian routes must be allowed by API router');
const ui=readFileSync(new URL('../public/game/friends.js',import.meta.url),'utf8');
assert.ok(ui.includes('pendingChildCode')&&ui.includes('copyPendingChildCode'),'pending child private code must be displayed and copyable before guardian approval');
console.log('Guardian policy static checks passed (not integration tests)');
