import assert from 'node:assert/strict';
import {inactivityCutoffs} from '../server/social.mjs';
const x=inactivityCutoffs(Date.UTC(2026,10,23,12));
assert.equal(new Date(x.warningBefore).toISOString(),'2025-12-23T12:00:00.000Z');
assert.equal(new Date(x.expiryBefore).toISOString(),'2025-11-23T12:00:00.000Z');
const leap=inactivityCutoffs(Date.UTC(2025,1,28,12));
assert.equal(new Date(leap.expiryBefore).toISOString(),'2024-02-28T12:00:00.000Z');
console.log('Retention calendar cutoffs passed');
