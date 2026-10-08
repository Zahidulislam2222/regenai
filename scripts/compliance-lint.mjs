import {readFileSync, readdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_FILE = 'scripts/compliance-lint.rules.json';
const SOURCE_PATH = /^(?:packages\/storefront\/app\/content|scripts\/catalog-seed)\/[a-z0-9-]+\.json$/;

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
}

function validateRules(rules) {
  if (rules.contentDirectory !== 'packages/storefront/app/content' ||
      !Array.isArray(rules.sources) || rules.sources.length === 0 ||
      new Set(rules.sources).size !== rules.sources.length ||
      rules.sources.some((file) => typeof file !== 'string' || !SOURCE_PATH.test(file)) ||
      !rules.notice || !rules.sources.includes(rules.notice.file) ||
      typeof rules.notice.field !== 'string' ||
      !Array.isArray(rules.notice.requiredPhrases) ||
      rules.notice.requiredPhrases.length === 0 ||
      rules.notice.requiredPhrases.some((phrase) => typeof phrase !== 'string' || !phrase.trim()) ||
      !Array.isArray(rules.redFlags) || rules.redFlags.length === 0 ||
      rules.redFlags.some((rule) => typeof rule.id !== 'string' || !rule.id ||
        typeof rule.pattern !== 'string' || !rule.pattern)) {
    throw new Error('Product copy guard rules are incomplete.');
  }
  return rules.redFlags.map((rule) => ({id: rule.id, expression: new RegExp(rule.pattern, 'iu')}));
}

function visitStrings(value, jsonPath, visit) {
  if (typeof value === 'string') {
    visit(value, jsonPath);
  } else if (Array.isArray(value)) {
    value.forEach((entry, index) => visitStrings(entry, jsonPath + '[' + index + ']', visit));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => visitStrings(entry, jsonPath + '.' + key, visit));
  }
}

export function loadDemoCopy(root = PROJECT_ROOT) {
  const rules = readJson(root, RULES_FILE);
  validateRules(rules);
  const actualContentSources = readdirSync(resolve(root, rules.contentDirectory))
    .filter((name) => name.endsWith('.json'))
    .map((name) => rules.contentDirectory + '/' + name);
  const listedContentSources = rules.sources.filter((file) => file.startsWith(rules.contentDirectory + '/'));
  if (actualContentSources.length !== listedContentSources.length ||
      actualContentSources.some((file) => !listedContentSources.includes(file))) {
    throw new Error('Product copy guard must include every maintained content JSON file.');
  }
  const corpus = Object.fromEntries(rules.sources.map((file) => [file, readJson(root, file)]));
  return {corpus, rules};
}

export function auditDemoCopy(corpus, rules) {
  const patterns = validateRules(rules);
  const findings = [];
  for (const file of rules.sources) {
    if (!Object.hasOwn(corpus, file)) {
      findings.push(file + ': missing checked-in copy source');
      continue;
    }
    visitStrings(corpus[file], '$', (value, jsonPath) => {
      for (const rule of patterns) {
        if (rule.expression.test(value)) {
          findings.push(file + ':' + jsonPath + ': ' + rule.id);
        }
      }
    });
  }
  const notice = corpus[rules.notice.file]?.[rules.notice.field];
  for (const phrase of rules.notice.requiredPhrases) {
    if (typeof notice !== 'string' || !notice.toLocaleLowerCase('en-US').includes(phrase.toLocaleLowerCase('en-US'))) {
      findings.push(rules.notice.file + ':$.' + rules.notice.field + ': missing required product notice phrase');
    }
  }
  return findings;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const {corpus, rules} = loadDemoCopy();
  const findings = auditDemoCopy(corpus, rules);
  if (findings.length) {
    findings.forEach((finding) => console.error(finding));
    process.exitCode = 1;
  } else {
    console.log('Product copy guard passed for ' + rules.sources.length + ' checked-in JSON sources.');
  }
}
