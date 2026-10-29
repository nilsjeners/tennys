// Run: node apps/native/src/lib/version.check.mjs (Node >= 23 strips TS types)
import assert from 'node:assert';
import { isOlderThan } from './version.ts';

assert.equal(isOlderThan('1.0.0', '1.0.1'), true);
assert.equal(isOlderThan('1.9.3', '1.10.0'), true);
assert.equal(isOlderThan('1.10.0', '1.9.3'), false);
assert.equal(isOlderThan('1.2', '1.2.0'), false);
assert.equal(isOlderThan('2.0.0', '2.0.0'), false);
console.log('version.check ok');
