import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../server/social.mjs',import.meta.url),'utf8');
for(const needle of ['akye_guardians','account/guardian/decision','account/guardian/revoke/request',"guardian.status!=='approved'",'DELETE FROM akye_guardians','Child accounts require a guardian email'])assert.ok(s.includes(needle),needle);
console.log('Guardian policy static checks passed (not integration tests)');
