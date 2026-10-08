import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {test} from 'node:test';

test('GitHub workflows do not depend on retired common action runtimes',()=>{
 const directory=new URL('../workflows/',import.meta.url);
 for(const name of readdirSync(directory).filter(name=>name.endsWith('.yml'))){
  const source=readFileSync(new URL(name,directory),'utf8');
  assert.doesNotMatch(source,/actions\/(?:checkout|setup-node)@v[1-4]\b|actions\/setup-python@v[1-5]\b|actions\/upload-artifact@v[1-4]\b|github\/codeql-action\/[a-z]+@v3\b|gitleaks\/gitleaks-action@v2\b/,name);
 }
});

test('the required layered security CI fails on scanner errors and enables no paid review',()=>{
 const source=readFileSync(new URL('../workflows/security-ci.yml',import.meta.url),'utf8');
 assert.match(source,/semgrep scan --error/);
 assert.match(source,/gitleaks\/gitleaks-action@v3/);
 assert.match(source,/bandit -q/);
 assert.match(source,/contents: read/);
 assert.doesNotMatch(source,/continue-on-error|\|\| true/);
 assert.doesNotMatch(source,/^\s+claude-security-review:/m);
});

test('optional Workers staging cannot run from an ordinary branch push',()=>{
 const source=readFileSync(new URL('../workflows/deploy-staging.yml',import.meta.url),'utf8');
 assert.match(source,/workflow_dispatch:/);
 assert.doesNotMatch(source,/^  push:/m);
 assert.match(source,/REGENAI_WORKERS_STAGING_APPROVED/);
});

test('JavaScript CI exercises the complete root suite without allowing empty suites',()=>{
 const source=readFileSync(new URL('../workflows/test-unit.yml',import.meta.url),'utf8');
 assert.match(source,/run: npm test\s*$/m);
 assert.doesNotMatch(source,/passWithNoTests/);
});

test('legacy Workers deployment needs dispatch, an explicit opt-in and a successful confirmation',()=>{
 const source=readFileSync(new URL('../workflows/deploy-production.yml',import.meta.url),'utf8');
 assert.match(source,/workflow_dispatch:/);
 assert.doesNotMatch(source,/^  push:/m);
 assert.match(source,/REGENAI_WORKERS_PRODUCTION_APPROVED/);
 assert.match(source,/needs\.confirm\.result == 'success'/);
 assert.doesNotMatch(source,/needs\.confirm\.result == 'skipped'/);
 assert.doesNotMatch(source,/\$\{\{ github\.event\.inputs\.confirm \}\}/);
});

test('the Python assistant has candidate CI with all required source gates and no paid provider calls',()=>{
 const source=readFileSync(new URL('../workflows/test-assistant.yml',import.meta.url),'utf8');
 for(const command of ['pytest','ruff check','mypy','bandit','pip wheel'])assert.ok(source.includes(command),command+' gate missing');
 assert.match(source,/pull_request:/);
 assert.match(source,/contents: read/);
 assert.doesNotMatch(source,/secrets\./);
 assert.doesNotMatch(source,/continue-on-error|\|\| true/);
});
