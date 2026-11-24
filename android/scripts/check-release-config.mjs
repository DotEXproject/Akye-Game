import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gradle = readFileSync('android/app/build.gradle.kts', 'utf8');
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const launcher = readFileSync('android/app/src/main/java/com/dotexsolutions/akye/MainActivity.java', 'utf8');
const strings = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');

assert.match(gradle, /applicationId\s*=\s*"com\.dotexsolutions\.akye"/);
assert.match(gradle, /namespace\s*=\s*"com\.dotexsolutions\.akye"/);
assert.match(gradle, /targetSdk\s*=\s*35/);
assert.match(gradle, /versionCode\s*=\s*[1-9]\d*/);
assert.match(launcher, /https:\/\/games\.dotexsolutions\.com\/akye\//);
assert.match(manifest, /android\.permission\.INTERNET/);
assert.match(manifest, /android:exported="true"/);
assert.match(manifest, /android:icon="@drawable\/ic_akye"/);
assert.match(strings, /Akye/);
const permissions = [...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map(x => x[1]);
assert.deepEqual(permissions, ['android.permission.INTERNET'],
  'Android permissions must be explicitly reviewed before adding them');
assert.doesNotMatch(manifest, /android:usesCleartextTraffic="true"/);
console.log('Android package identity, launch URL, icon and permissions verified.');
