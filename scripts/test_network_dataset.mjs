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

const { NETWORK_DATASET, NETWORK_PERSONAS, NETWORK_EDGES, validateNetworkDataset } = networkData;
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

// 2. Metadata Counts Verification
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

// 4. Reachability from INVESTOR_ROOT
console.log('\n4. Investor Direct Reachability:');
const directTargets = new Set(
  NETWORK_DATASET.edges
    .filter((e) => e.sourceNodeId === 'INVESTOR_ROOT')
    .map((e) => e.targetNodeId)
);
assert(directTargets.size === 16, 'All 16 personas directly reachable from INVESTOR_ROOT', directTargets.size);
for (const person of NETWORK_DATASET.people) {
  assert(directTargets.has(person.id), `Person '${person.id}' is reachable directly`);
}

// 5. Second-Degree Reachability
console.log('\n5. Second-Degree Path Traversal (2 hops via intermediate personas):');
// Build 1-hop neighbours from INVESTOR_ROOT
const firstDegree = new Set(directTargets);
// Build adjacency map for P2P edges (directed or undirected context)
const p2pAdj = new Map();
for (const edge of NETWORK_DATASET.edges) {
  if (edge.sourceNodeId !== 'INVESTOR_ROOT') {
    if (!p2pAdj.has(edge.sourceNodeId)) p2pAdj.set(edge.sourceNodeId, new Set());
    if (!p2pAdj.has(edge.targetNodeId)) p2pAdj.set(edge.targetNodeId, new Set());
    p2pAdj.get(edge.sourceNodeId).add(edge.targetNodeId);
    p2pAdj.get(edge.targetNodeId).add(edge.sourceNodeId);
  }
}

// For each person in firstDegree, any person they connect to via P2P is reachable in 2 hops
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

// 6. Ticker Provenance and Verification
console.log('\n6. Equity Ticker & Registry Verification:');
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

// 7. Synthetic Provenance Enforcement
console.log('\n7. Strict Synthetic Provenance Tracking:');
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

// 8. Corrupted Dataset Tests
console.log('\n8. Corrupted Dataset Edge Case Rejection:');

// Helper to deep clone dataset
function cloneDataset() {
  return JSON.parse(JSON.stringify(NETWORK_DATASET));
}

// Test A: Duplicate Person ID
{
  const corrupted = cloneDataset();
  corrupted.people[1].id = corrupted.people[0].id; // duplicate ID
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
  corrupted.people[0].provenance = 'PUBLIC_PROFILE'; // mismatched
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
    contextAndEvidence: 'Connected to self',
    provenance: 'SYNTHETIC',
  });
  const res = validateNetworkDataset(corrupted);
  assert(res.isValid === false, 'Self-edge rejected');
  assert(res.failures.some((f) => f.includes('Self-edge detected')), 'Detects self-edge violation');
}

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
