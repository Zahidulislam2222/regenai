import assert from 'node:assert/strict';
import {test} from 'node:test';
import {auditDemoCopy, loadDemoCopy} from './compliance-lint.mjs';

const catalogPath = 'packages/storefront/app/content/recovery-catalog.json';
const editorialPath = 'packages/storefront/app/content/recovery-editorial.json';
const seedPath = 'scripts/catalog-seed/seed-config.json';

test('current concept catalog and maintained demo copy pass the narrow red-flag guard', () => {
  const {corpus, rules} = loadDemoCopy();
  assert.equal(rules.sources.length, 5);
  assert.deepEqual(auditDemoCopy(corpus, rules), []);
});

test('unsupported approval and efficacy claims fail at their JSON paths', () => {
  const {corpus, rules} = loadDemoCopy();
  const candidate = structuredClone(corpus);
  candidate[catalogPath][0].description = 'FDA approved and clinically proven to treat pain.';
  candidate[editorialPath].stories[0].summary = 'Guaranteed recovery and pain relief.';
  const findings = auditDemoCopy(candidate, rules);
  assert.ok(findings.some((finding) => finding.includes(catalogPath + ':$[0].description: unsupported-fda-status')));
  assert.ok(findings.some((finding) => finding.includes(catalogPath + ':$[0].description: unsupported-evidence')));
  assert.ok(findings.some((finding) => finding.includes(editorialPath + ':$.stories[0].summary: pain-or-safety-promise')));
});

test('removing the no-sale publication notice fails', () => {
  const {corpus, rules} = loadDemoCopy();
  const candidate = structuredClone(corpus);
  candidate[seedPath].descriptionNotice = 'Illustrative portfolio demo with unverified details.';
  assert.ok(auditDemoCopy(candidate, rules).some((finding) => finding.includes('missing required demo notice phrase')));
});

test('omitting a listed content source fails', () => {
  const {corpus, rules} = loadDemoCopy();
  const candidate = structuredClone(corpus);
  delete candidate[editorialPath];
  assert.ok(auditDemoCopy(candidate, rules).some((finding) => finding.includes(editorialPath + ': missing')));
});
