import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../server/social.mjs',import.meta.url),'utf8');
for(const needle of ['akye_guardians','account/guardian/decision','account/guardian/revoke/request',"guardian.status!=='approved'",'DELETE FROM akye_guardians','Child accounts require a guardian email'])assert.ok(s.includes(needle),needle);
const api=readFileSync(new URL('../server/api.mjs',import.meta.url),'utf8');
assert.ok(api.includes(String.raw`guardian\\/(decision|revoke\\/request)`),'guardian routes must be allowed by API router');
console.log('Guardian policy static checks passed (not integration tests)');
