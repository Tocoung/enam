#!/usr/bin/env node
/**
 * Direct TypeScript Unit Tests for FINN Network Intelligence Domain Model & Dataset.
 *
 * Executes the ACTUAL production TypeScript code in src/data/networkData.ts
 * via jiti (bundled in node_modules).
 *
 * Run: node scripts/test_network_dataset.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize jiti to load TypeScript directly
const jiti = require(path.join(rootDir, 'node_modules/jiti'))(path.join(rootDir, 'index.js'));

const networkData = jiti('./src/data/networkData.ts');
const researchData = jiti('./src/data/researchData.ts');

const {
  NETWORK_DATASET,
  NETWORK_PERSONAS,
  NETWORK_EDGES,
  validateNetworkDataset,
  isValidDateFormat,
  parseDateToComparable,
} = networkData;
const { LOCAL_VERIFIED_SYMBOL_REGISTRY } = researchData;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${details ? ': ' + details : ''}`);
  }
}

console.log('=== FINN Network Intelligence Domain Model & Dataset Tests ===\n');

// 1. Production Dataset Validation
console.log('1. Production NETWORK_DATASET Validation:');
const prodValidation = validateNetworkDataset(NETWORK_DATASET);
assert(prodValidation.isValid === true, 'Production dataset isValid is true');
assert(prodValidation.failures.length === 0, 'Production dataset has 0 failures', JSON.stringify(prodValidation.failures));
assert(prodValidation.totalPersonas === 16, 'Validation reports exactly 16 personas', prodValidation.totalPersonas);
assert(prodValidation.totalEdges === 26, 'Validation reports exactly 26 edges', prodValidation.totalEdges);
assert(prodValidation.directInvestorEdges === 16, 'Validation reports 16 direct investor edges', prodValidation.directInvestorEdges);
assert(prodValidation.personToPersonEdges === 10, 'Validation reports 10 person-to-person edges', prodValidation.personToPersonEdges);

// 2. Metadata Consistency
console.log('\n2. Metadata Consistency:');
const meta = NETWORK_DATASET.metadata;
assert(meta.schemaVersion === '1.0.0', 'Schema version is 1.0.0', meta.schemaVersion);
assert(meta.totalPersonas === NETWORK_DATASET.people.length, 'Metadata totalPersonas matches people.length');
assert(meta.totalDirectEdges === prodValidation.directInvestorEdges, 'Metadata totalDirectEdges matches directInvestorEdges');
assert(meta.totalSecondDegreeEdges === prodValidation.personToPersonEdges, 'Metadata totalSecondDegreeEdges matches personToPersonEdges');
assert(meta.provenanceNotice.includes('SYNTHETIC'), 'Metadata provenanceNotice contains SYNTHETIC');

// 3. Exact Persona and Edge Shape
console.log('\n3. Exact Persona & Edge Shapes:');
assert(NETWORK_PERSONAS.length === 16, 'NETWORK_PERSONAS has exactly 16 elements', NETWORK_PERSONAS.length);
assert(NETWORK_EDGES.length === 26, 'NETWORK_EDGES has exactly 26 elements', NETWORK_EDGES.length);
assert(NETWORK_DATASET.rootInvestorId === 'INVESTOR_ROOT', 'Root investor ID is INVESTOR_ROOT');

// 4. Directionality Semantics on Production Edges
console.log('\n4. Relationship Directionality Semantics:');
const investorEdges = NETWORK_DATASET.edges.filter((e) => e.sourceNodeId === 'INVESTOR_ROOT');
const p2pEdges = NETWORK_DATASET.edges.filter((e) => e.sourceNodeId !== 'INVESTOR_ROOT');

assert(investorEdges.length === 16, 'Exactly 16 investor edges');
assert(
  investorEdges.every((e) => e.directionality === 'DIRECTED' && e.isDirected === true),
  'All 16 investor edges are explicitly DIRECTED (isDirected: true)'
);

assert(p2pEdges.length === 10, 'Exactly 10 person-to-person edges');
assert(
  p2pEdges.every((e) => e.directionality === 'UNDIRECTED' && e.isDirected === false),
  'All 10 person-to-person edges are explicitly UNDIRECTED (isDirected: false)'
);

// 5. Current Employment Consistency on Production Personas
console.log('\n5. Current Employment Consistency on Production Personas:');
let allCurrentConsistent = true;
for (const person of NETWORK_DATASET.people) {
  const currentRoles = person.employmentHistory.filter((e) => e.isCurrent);
  if (currentRoles.length !== 1) {
    allCurrentConsistent = false;
    break;
  }
  const cur = currentRoles[0];
  if (person.currentRoleTitle !== cur.roleTitle) {
    allCurrentConsistent = false;
    break;
  }
  if (!person.currentOrganisation) {
    allCurrentConsistent = false;
    break;
  }
  if (person.currentOrganisation.type !== cur.organisation.type) {
    allCurrentConsistent = false;
    break;
  }
  if (person.currentOrganisation.name !== cur.organisation.name) {
    allCurrentConsistent = false;
    break;
  }
}
assert(allCurrentConsistent, 'All 16 personas have strictly matching currentOrganisation and currentRoleTitle');

// 6. Reachability from INVESTOR_ROOT
console.log('\n6. Investor Direct Reachability:');
const directTargets = new Set(
  NETWORK_DATASET.edges
    .filter((e) => e.sourceNodeId === 'INVESTOR_ROOT')
    .map((e) => e.targetNodeId)
);
assert(directTargets.size === 16, 'All 16 personas directly reachable from INVESTOR_ROOT', directTargets.size);
for (const person of NETWORK_DATASET.people) {
  assert(directTargets.has(person.id), `Person '${person.id}' is reachable directly`);
}

// 7. Second-Degree Path Traversal
console.log('\n7. Second-Degree Path Traversal (2 hops via mutual connections):');
const firstDegree = new Set(directTargets);
const p2pAdj = new Map();
for (const edge of NETWORK_DATASET.edges) {
  if (edge.sourceNodeId !== 'INVESTOR_ROOT') {
    if (!p2pAdj.has(edge.sourceNodeId)) p2pAdj.set(edge.sourceNodeId, new Set());
    if (!p2pAdj.has(edge.targetNodeId)) p2pAdj.set(edge.targetNodeId, new Set());
    p2pAdj.get(edge.sourceNodeId).add(edge.targetNodeId);
    p2pAdj.get(edge.targetNodeId).add(edge.sourceNodeId);
  }
}

const secondDegreeReachable = new Set();
for (const [node, neighbours] of p2pAdj.entries()) {
  if (firstDegree.has(node) && neighbours.size > 0) {
    for (const neighbour of neighbours) {
      secondDegreeReachable.add(neighbour);
    }
  }
}
assert(
  secondDegreeReachable.size >= 8,
  `At least 8 distinct personas are reachable via 2-hop paths (found: ${secondDegreeReachable.size})`,
  Array.from(secondDegreeReachable).join(', ')
);

// 8. Equity Ticker & Registry Verification
console.log('\n8. Equity Ticker & Registry Verification:');
let allTickersValid = true;
let totalListedRefs = 0;
for (const person of NETWORK_DATASET.people) {
  for (const emp of person.employmentHistory) {
    if (emp.organisation.type === 'LISTED_NSE_BSE') {
      totalListedRefs++;
      const ticker = emp.organisation.ticker;
      if (!LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker]) {
        allTickersValid = false;
        console.error(`Invalid ticker found: ${ticker}`);
      }
    }
  }
}
assert(allTickersValid, 'All listed company references match LOCAL_VERIFIED_SYMBOL_REGISTRY');
assert(totalListedRefs >= 15, `Found substantial listed company coverage (found: ${totalListedRefs})`);

// 9. Strict Synthetic Provenance Tracking
console.log('\n9. Strict Synthetic Provenance Tracking:');
const allSynthetic = NETWORK_DATASET.people.every(
  (p) =>
    p.provenance === 'SYNTHETIC' &&
    p.isSynthetic === true &&
    p.employmentHistory.every((e) => e.provenance === 'SYNTHETIC') &&
    p.educationHistory.every((ed) => ed.provenance === 'SYNTHETIC')
);
assert(allSynthetic, 'All personas, employment, and education records strictly marked SYNTHETIC');

const allEdgesSynthetic = NETWORK_DATASET.edges.every((e) => e.provenance === 'SYNTHETIC');
assert(allEdgesSynthetic, 'All 26 edges have provenance === SYNTHETIC');

// 10. Date Format Helper Unit Tests
console.log('\n10. Date Format Helper Unit Tests:');
assert(isValidDateFormat('2020') === true, 'Accepts bare year YYYY');
assert(isValidDateFormat('2020-04') === true, 'Accepts YYYY-MM');
assert(isValidDateFormat('2020-13') === false, 'Rejects month 13');
assert(isValidDateFormat('2020-00') === false, 'Rejects month 00');
assert(isValidDateFormat('May 2020') === false, 'Rejects text dates');
assert(isValidDateFormat('2020/04') === false, 'Rejects slashes');
assert(isValidDateFormat('') === false, 'Rejects empty string');
assert(isValidDateFormat(null) === false, 'Rejects null');

// 11. Corrupted Dataset Edge Case Rejection
console.log('\n11. Corrupted Dataset Edge Case Rejection:');

// Helper to deep clone dataset
function cloneDataset() {
  return JSON.parse(JSON.stringify(NETWORK_DATASET));
}

// Test A: Duplicate Person ID
{
  const corrupted = cloneDataset();
  corrupted.people[1].id = corrupted.people[0].id;
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Duplicate person ID rejected');
  assert(res.failures.some((f) => f.includes('Duplicate person ID')), 'Detects duplicate person ID error');
}

// Test B: Invalid Company Ticker
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory.push({
    id: 'emp-bad-ticker',
    organisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'NON_EXISTENT_TICKER',
      name: 'Fake Corp',
    },
    roleTitle: 'Consultant',
    seniority: 'PRACTITIONER_ANALYST',
    startDate: '2020-01',
    endDate: '2021-01',
    isCurrent: false,
    responsibilities: [],
    relevantDomainTags: [],
    provenance: 'SYNTHETIC',
  });
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Invalid company ticker rejected');
  assert(res.failures.some((f) => f.includes('NON_EXISTENT_TICKER')), 'Detects unindexed ticker error');
}

// Test C: Dangling Edge Endpoint
{
  const corrupted = cloneDataset();
  corrupted.edges.push({
    id: 'edge-dangling',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-ghost-does-not-exist',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    contextAndEvidence: 'Test phantom edge',
    provenance: 'SYNTHETIC',
  });
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Dangling edge target rejected');
  assert(res.failures.some((f) => f.includes('person-ghost-does-not-exist')), 'Detects unknown person target node');
}

// Test D: Invalid Connection Strength (0 and 6)
{
  const corruptedLow = cloneDataset();
  corruptedLow.edges[0].connectionStrength = 0;
  const resLow = validateNetworkDataset(corruptedLow);
  assert(resLow.isValid === false, 'Connection strength 0 rejected');
  assert(resLow.failures.some((f) => f.includes('connectionStrength')), 'Detects out-of-range strength (< 1)');

  const corruptedHigh = cloneDataset();
  corruptedHigh.edges[0].connectionStrength = 6;
  const resHigh = validateNetworkDataset(corruptedHigh);
  assert(resHigh.isValid === false, 'Connection strength 6 rejected');
  assert(resHigh.failures.some((f) => f.includes('connectionStrength')), 'Detects out-of-range strength (> 5)');
}

// Test E: Multiple Current Employment Records
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory.push({
    id: 'emp-second-current',
    organisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-another',
      name: 'Another Org',
    },
    roleTitle: 'Second Simultaneous Current Role',
    seniority: 'DIRECTOR_LEAD',
    startDate: '2024-01',
    endDate: null,
    isCurrent: true,
    responsibilities: [],
    relevantDomainTags: [],
    provenance: 'SYNTHETIC',
  });
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Multiple current employment records rejected');
  assert(res.failures.some((f) => f.includes('current roles (maximum 1 permitted)')), 'Detects multiple current roles violation');
}

// Test F: Missing Synthetic Provenance
{
  const corrupted = cloneDataset();
  corrupted.people[0].provenance = 'PUBLIC_PROFILE';
  corrupted.people[0].isSynthetic = false;
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Non-synthetic persona rejected in synthetic dataset');
  assert(res.failures.some((f) => f.includes('provenance')), 'Detects provenance violation');
}

// Test G: Self-Edge
{
  const corrupted = cloneDataset();
  corrupted.edges.push({
    id: 'edge-self',
    sourceNodeId: 'person-arun-sharma',
    targetNodeId: 'person-arun-sharma',
    relationshipType: 'FORMER_COLLEAGUE',
    connectionStrength: 3,
    directionality: 'UNDIRECTED',
    isDirected: false,
    contextAndEvidence: 'Connected to self',
    provenance: 'SYNTHETIC',
  });
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Self-edge rejected');
  assert(res.failures.some((f) => f.includes('Self-edge detected')), 'Detects self-edge violation');
}

// Test H: Invalid Employment Date Format (YYYY-13 and non-ISO strings)
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory[0].startDate = '2020-13'; // invalid month
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Invalid month 2020-13 rejected');
  assert(res.failures.some((f) => f.includes("Invalid startDate format '2020-13'")), 'Detects invalid startDate month format');

  const corruptedText = cloneDataset();
  corruptedText.people[0].employmentHistory[0].startDate = 'April 2020'; // text format
  const resText = validateNetworkDataset(corruptedText);
  assert(resText.isValid === false, 'Text date April 2020 rejected');
  assert(resText.failures.some((f) => f.includes("Invalid startDate format 'April 2020'")), 'Detects text date format error');
}

// Test I: Reversed Previous Employment Dates (startDate > endDate)
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory[1].startDate = '2023-01';
  corrupted.people[0].employmentHistory[1].endDate = '2014-04';
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Reversed previous employment dates rejected');
  assert(
    res.failures.some((f) => f.includes('reversed dates') && f.includes('startDate (2023-01) is after endDate (2014-04)')),
    'Detects reversed previous employment dates'
  );
}

// Test J: Reversed Current Employment Dates
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory[0].endDate = '2022-01'; // earlier than startDate 2023-04
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Reversed current employment dates rejected');
  assert(res.failures.some((f) => f.includes('Current employment') && f.includes('reversed dates')), 'Detects reversed current employment dates');
  assert(res.failures.some((f) => f.includes('must have endDate === null')), 'Detects current role non-null endDate');

  // Career chronology reversed: current role started before previous role
  const corruptedCareer = cloneDataset();
  corruptedCareer.people[0].employmentHistory[0].startDate = '2010-01'; // prior role started 2014-04
  const resCareer = validateNetworkDataset(corruptedCareer);
  assert(resCareer.isValid === false, 'Reversed career chronology rejected');
  assert(
    resCareer.failures.some((f) => f.includes('reversed career dates')),
    'Detects current role startDate prior to previous role startDate'
  );
}

// Test K: isCurrent and endDate Mismatch in Both Directions
{
  // Direction 1: isCurrent === true with endDate !== null
  const corruptedTrueWithEnd = cloneDataset();
  corruptedTrueWithEnd.people[0].employmentHistory[0].endDate = '2024-05';
  const resTrueWithEnd = validateNetworkDataset(corruptedTrueWithEnd);
  assert(resTrueWithEnd.isValid === false, 'isCurrent true with non-null endDate rejected');
  assert(
    resTrueWithEnd.failures.some((f) => f.includes('must have endDate === null')),
    'Detects isCurrent: true with endDate error'
  );

  // Direction 2: isCurrent === false with endDate === null
  const corruptedFalseWithNull = cloneDataset();
  corruptedFalseWithNull.people[0].employmentHistory[1].endDate = null;
  const resFalseWithNull = validateNetworkDataset(corruptedFalseWithNull);
  assert(resFalseWithNull.isValid === false, 'isCurrent false with null endDate rejected');
  assert(
    resFalseWithNull.failures.some((f) => f.includes('must have a non-null endDate')),
    'Detects isCurrent: false with null endDate error'
  );
}

// Test L: Current Organisation Mismatch
{
  const corrupted = cloneDataset();
  corrupted.people[0].currentOrganisation = {
    type: 'LISTED_NSE_BSE',
    ticker: 'TCS',
    name: 'Tata Consultancy Services Limited',
  };
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Mismatched currentOrganisation rejected');
  assert(
    res.failures.some((f) => f.includes('currentOrganisation does not match current employment organisation')),
    'Detects currentOrganisation mismatch'
  );
}

// Test M: Current Role Title Mismatch
{
  const corrupted = cloneDataset();
  corrupted.people[0].currentRoleTitle = 'Chief Strategy Officer';
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Mismatched currentRoleTitle rejected');
  assert(
    res.failures.some((f) => f.includes('currentRoleTitle') && f.includes('does not match current employment roleTitle')),
    'Detects currentRoleTitle mismatch'
  );
}

// Test N: Missing Current Record with Current Fields Set
{
  const corrupted = cloneDataset();
  corrupted.people[0].employmentHistory[0].isCurrent = false;
  corrupted.people[0].employmentHistory[0].endDate = '2024-05';
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Missing current employment record with current fields populated rejected');
  assert(
    res.failures.some((f) => f.includes('no current employment record, but currentOrganisation or currentRoleTitle is specified')),
    'Detects missing current role with populated current fields'
  );
}

// Test O: Duplicate ID Across Different Record Categories
{
  const corruptedEdu = cloneDataset();
  corruptedEdu.people[0].educationHistory[0].id = corruptedEdu.people[0].employmentHistory[0].id;
  const resEdu = validateNetworkDataset(corruptedEdu);
  assert(resEdu.isValid === false, 'Cross-category duplicate ID (education & employment) rejected');
  assert(
    resEdu.failures.some((f) => f.includes('Duplicate ID detected across dataset')),
    'Detects cross-category duplicate ID between education and employment'
  );

  const corruptedEdge = cloneDataset();
  corruptedEdge.edges[0].id = corruptedEdge.people[0].id;
  const resEdge = validateNetworkDataset(corruptedEdge);
  assert(resEdge.isValid === false, 'Cross-category duplicate ID (edge & person) rejected');
  assert(
    resEdge.failures.some((f) => f.includes('Duplicate ID detected across dataset')),
    'Detects cross-category duplicate ID between edge and person'
  );
}

// Test P: Invalid or Reversed Education Years
{
  const corruptedReversed = cloneDataset();
  corruptedReversed.people[0].educationHistory[0].startYear = 2005;
  corruptedReversed.people[0].educationHistory[0].endYear = 2000;
  const resReversed = validateNetworkDataset(corruptedReversed);
  assert(resReversed.isValid === false, 'Reversed education years rejected');
  assert(
    resReversed.failures.some((f) => f.includes('reversed years: startYear (2005) > endYear (2000)')),
    'Detects reversed education years'
  );

  const corruptedFloat = cloneDataset();
  corruptedFloat.people[0].educationHistory[0].startYear = 2005.5;
  const resFloat = validateNetworkDataset(corruptedFloat);
  assert(resFloat.isValid === false, 'Non-integer education year rejected');
  assert(
    resFloat.failures.some((f) => f.includes('invalid year values')),
    'Detects non-integer education year'
  );
}

// Test Q: Relationship Directionality Invariants
{
  const corruptedInvDir = cloneDataset();
  corruptedInvDir.edges[0].directionality = 'UNDIRECTED';
  corruptedInvDir.edges[0].isDirected = false;
  const resInvDir = validateNetworkDataset(corruptedInvDir);
  assert(resInvDir.isValid === false, 'Investor edge marked UNDIRECTED rejected');
  assert(
    resInvDir.failures.some((f) => f.includes('Investor edge') && f.includes('must be DIRECTED')),
    'Detects investor edge directionality violation'
  );

  const corruptedP2PDir = cloneDataset();
  const p2pIdx = corruptedP2PDir.edges.findIndex((e) => e.sourceNodeId !== 'INVESTOR_ROOT');
  corruptedP2PDir.edges[p2pIdx].directionality = 'DIRECTED';
  corruptedP2PDir.edges[p2pIdx].isDirected = true;
  const resP2PDir = validateNetworkDataset(corruptedP2PDir);
  assert(resP2PDir.isValid === false, 'Person-to-person edge marked DIRECTED rejected');
  assert(
    resP2PDir.failures.some((f) => f.includes('Person-to-person edge') && f.includes('must be UNDIRECTED')),
    'Detects person-to-person edge directionality violation'
  );
}

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
