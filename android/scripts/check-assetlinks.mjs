import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const fingerprint = Array.from({length: 32}, (_, i) => i.toString(16).padStart(2, '0')).join(':').toUpperCase();
const ok = spawnSync(process.execPath, ['android/scripts/create-assetlinks.mjs', fingerprint], {encoding:'utf8'});
assert.equal(ok.status, 0, ok.stderr);
const statements = JSON.parse(ok.stdout);
assert.equal(statements.length, 1);
assert.equal(statements[0].target.package_name, 'com.dotexsolutions.akye');
assert.deepEqual(statements[0].target.sha256_cert_fingerprints, [fingerprint]);
assert.deepEqual(statements[0].relation, ['delegate_permission/common.handle_all_urls']);
for (const bad of ['invalid', '00:11', '', 'GG:'.repeat(32)]) {
  const result = spawnSync(process.execPath, ['android/scripts/create-assetlinks.mjs', bad], {encoding:'utf8'});
  assert.notEqual(result.status, 0, 'Invalid certificate fingerprint accepted');
}
assert.equal(existsSync('public/.well-known/assetlinks.json'), false,
  'Do not publish a placeholder assetlinks.json before the Play signing certificate is known');
console.log('Android Digital Asset Links generator validated; no placeholder deployed.');
