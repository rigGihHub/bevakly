import assert from 'node:assert/strict';
import { initializeNewsSeenSnapshot, markNewsSeen, normalizeNewsKey, parseNewsSeenSnapshot, unseenNewsKeys } from '../lib/intelligence/news-seen-state.ts';

const a='https://example.com/news/one?utm_source=test';
const a2='https://example.com/news/one/?fbclid=abc';
const b='https://example.com/news/two';
const c='https://example.com/news/three';

assert.equal(normalizeNewsKey(a),normalizeNewsKey(a2),'tracking params and trailing slash must not create false new items');

const baseline=initializeNewsSeenSnapshot([a,b],'2026-09-13T10:00:00.000Z');
assert.equal(unseenNewsKeys(baseline,[a2,b]).size,0,'baseline items must not be new');

const unseen=unseenNewsKeys(baseline,[a2,b,c]);
assert.equal(unseen.size,1,'one genuinely new URL should be unseen');
assert.ok(unseen.has(normalizeNewsKey(c)),'new URL should be marked unseen');

const afterOpen=markNewsSeen(baseline,[c]);
assert.equal(unseenNewsKeys(afterOpen,[a,b,c]).size,0,'opening/marking an item should clear its unseen state');

const parsed=parseNewsSeenSnapshot(JSON.stringify(afterOpen));
assert.ok(parsed,'persisted snapshot should parse');
assert.equal(unseenNewsKeys(parsed,[a,b,c]).size,0,'persisted state should retain seen items');

assert.equal(parseNewsSeenSnapshot('{broken'),null,'corrupt browser state must fail closed without crashing');
console.log('v3.19 new-since-last QA PASS');
