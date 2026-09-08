import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trackerPath = path.join(rootDir, 'data', 'seo-phase-5-tracker.json');
const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
const errors = [];
const siteUrl = tracker.siteUrl;
const allowedAuthorityStatuses = new Set([
  'reference_exists_unverified',
  'owner_action_required',
  'candidate',
  'blocked_pending_evidence',
  'measured',
  'do_not_pursue'
]);
const ids = new Set();

function addError(message) {
  errors.push(message);
}

function checkId(id, label) {
  if (!id || ids.has(id)) addError(`${label}: missing or duplicate id`);
  else ids.add(id);
}

function checkSiteUrl(url, label) {
  if (!url) return;
  let parsed;
  try { parsed = new URL(url); }
  catch { addError(`${label}: invalid URL`); return; }
  if (parsed.origin !== siteUrl) addError(`${label}: destination must stay on ${siteUrl}`);
  if (parsed.search) addError(`${label}: destination must not contain a query`);
}

if (tracker.schemaVersion !== 1) addError('schemaVersion must be 1');
if (tracker.phase !== 5) addError('phase must be 5');
if (tracker.siteUrl !== 'https://www.glorystarpack.com') addError('siteUrl must use the production www origin');

for (const [index, target] of (tracker.authorityTargets ?? []).entries()) {
  const label = `authorityTargets[${index}]`;
  checkId(target.id, label);
  if (!allowedAuthorityStatuses.has(target.status)) addError(`${label}: unsupported status ${target.status}`);
  if (!target.channel || !target.type || !target.nextAction) addError(`${label}: missing channel, type or nextAction`);
  if (!Array.isArray(target.evidenceRequired) || target.evidenceRequired.length === 0) addError(`${label}: evidenceRequired must not be empty`);
  checkSiteUrl(target.siteDestination, `${label}.siteDestination`);
  if (target.publicUrl) {
    try { new URL(target.publicUrl); }
    catch { addError(`${label}.publicUrl: invalid URL`); }
  }
  if (target.status === 'reference_exists_unverified' && !target.publicUrl) addError(`${label}: an existing reference needs publicUrl`);
}

const queryIds = new Set();
for (const [index, query] of (tracker.aiCitationQueries ?? []).entries()) {
  const label = `aiCitationQueries[${index}]`;
  if (!query.id || queryIds.has(query.id)) addError(`${label}: missing or duplicate id`);
  else queryIds.add(query.id);
  if (!query.platforms?.length || !query.locale || !query.query || !query.intent) addError(`${label}: missing platform, locale, query or intent`);
  if (!Array.isArray(query.targetUrls) || query.targetUrls.length === 0) addError(`${label}: targetUrls must not be empty`);
  for (const url of query.targetUrls ?? []) checkSiteUrl(url, `${label}.targetUrls`);
  if (!Array.isArray(query.observations)) addError(`${label}.observations must be an array`);
}

if (!tracker.weeklyIteration?.steps?.length) addError('weeklyIteration.steps must not be empty');
if (!tracker.weeklyIteration?.acceptanceCriteria?.length) addError('weeklyIteration.acceptanceCriteria must not be empty');
for (const url of tracker.policyReferences ?? []) {
  try { new URL(url); }
  catch { addError(`policyReferences: invalid URL ${url}`); }
}

if (errors.length) {
  console.error(`Phase 5 tracker checks failed (${errors.length}):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Phase 5 tracker checks passed: ${tracker.authorityTargets.length} authority targets, ${tracker.aiCitationQueries.length} AI citation queries, ${tracker.weeklyIteration.steps.length} weekly steps.`);
