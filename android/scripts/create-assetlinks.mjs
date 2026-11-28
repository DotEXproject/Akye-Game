#!/usr/bin/env node
// Generate a Digital Asset Links statement for the verified Play app-signing
// certificate. Never publish placeholders or upload-key fingerprints.
import { writeFileSync } from 'node:fs';

const fingerprint = process.argv[2]?.trim().toUpperCase();
const expected = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
if (!fingerprint || !expected.test(fingerprint)) {
  console.error('Usage: node android/scripts/create-assetlinks.mjs AA:BB:... (32 SHA-256 bytes, colon-separated)');
  process.exit(1);
}
const statement = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.dotexsolutions.akye',
    sha256_cert_fingerprints: [fingerprint]
  }
}];
const output = JSON.stringify(statement, null, 2) + '\n';
if (process.argv[3]) {
  writeFileSync(process.argv[3], output, { flag: 'wx' });
  console.log('Digital Asset Links statement generated. Review before publishing.');
} else {
  process.stdout.write(output);
}
