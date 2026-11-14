#!/usr/bin/env node
/**
 * Automated Unit Tests for FINN Network Intelligence Service.
 *
 * Verifies pure TypeScript graph construction, runtime immutability, directed/undirected traversal,
 * 2-hop depth capping, precise sector matching, mathematically reconciled score breakdowns,
 * free-text discovery search semantics, and adversarial mutation guards.
 *
 * Run: node scripts/test_network_service.mjs
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
const networkService = jiti('./src/services/networkService.ts');

const { NETWORK_DATASET, NETWORK_PERSONAS, NETWORK_EDGES } = networkData;
const {
  buildNetworkGraph,
  findIntroductionPaths,
  calculatePathAccessibility,
  calculateCompanyRelevance,
  calculateSectorRelevance,
  calculateExpertiseRelevance,
  calculateOverallScore,
  calculateScoreBreakdown,
  sanitizeScore,
  computeNetworkOverviewMetrics,
  getContactsForCompany,
  getContactsForSector,
  getContactsForExpertise,
  searchNetwork,
  queryNetwork,
  resolveTickerSector,
  isSectorMatch,
  ReadOnlyMap,
  deepFreeze,
  CANONICAL_SECTOR_MAP,
  SCORING_WEIGHTS,
  PROFICIENCY_MULTIPLIERS,
} = networkService;

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

function assertThrows(fn, testName, expectedErrorSubstr = '') {
  try {
    fn();
    failed++;
    console.error(`  [FAIL] ${testName}: Expected error to be thrown but function succeeded`);
  } catch (err) {
    if (expectedErrorSubstr && !err.message.includes(expectedErrorSubstr)) {
      failed++;
      console.error(`  [FAIL] ${testName}: Error message '${err.message}' does not contain '${expectedErrorSubstr}'`);
    } else {
      passed++;
      console.log(`  [PASS] ${testName}`);
    }
  }
}

console.log('=== FINN Network Intelligence Service & Traversal Tests ===\n');

// -------------------------------------------------------------
// 1. Graph Construction & Runtime Immutability
// -------------------------------------------------------------
console.log('1. Graph Construction & Runtime Immutability:');

const graph = buildNetworkGraph(NETWORK_DATASET);

assert(graph !== null && typeof graph === 'object', 'Graph builds successfully');
assert(graph.rootInvestorId === 'INVESTOR_ROOT', 'Graph preserves INVESTOR_ROOT as root');
assert(graph.totalNodes === 17, 'Total nodes equals 17 (16 personas + INVESTOR_ROOT)', graph.totalNodes);
assert(graph.totalEdges === 26, 'Total edges equals 26', graph.totalEdges);
assert(graph.people.size === 16, 'All 16 people indexed in people map', graph.people.size);

// Network overview metrics computation
const overviewMetrics = computeNetworkOverviewMetrics(graph);
assert(overviewMetrics.totalContacts === 16, 'overviewMetrics.totalContacts is 16');
assert(overviewMetrics.firstDegreeCount === 16, 'overviewMetrics.firstDegreeCount is 16');
assert(overviewMetrics.secondDegreeCount === 13, 'overviewMetrics.secondDegreeCount is 13');
assert(overviewMetrics.totalEdges === 26, 'overviewMetrics.totalEdges is 26');
assert(overviewMetrics.directInvestorEdges === 16, 'overviewMetrics.directInvestorEdges is 16');
assert(overviewMetrics.peerToPeerEdges === 10, 'overviewMetrics.peerToPeerEdges is 10');
assert(overviewMetrics.totalExpertiseTags === 48, 'overviewMetrics.totalExpertiseTags is 48');
assert(overviewMetrics.provenanceNotice.includes('SYNTHETIC'), 'overviewMetrics.provenanceNotice contains SYNTHETIC');
assert(overviewMetrics.expertiseCategoryCounts.SECTOR_INDUSTRY > 0, 'SECTOR_INDUSTRY tags present');
assert(overviewMetrics.expertiseCategoryCounts.FUNCTIONAL_OPERATIONS > 0, 'FUNCTIONAL_OPERATIONS tags present');

// ReadOnlyMap verification
assert(graph.people instanceof ReadOnlyMap, 'graph.people is an instance of ReadOnlyMap');
assert(graph.adjacency instanceof ReadOnlyMap, 'graph.adjacency is an instance of ReadOnlyMap');

// Attempted mutation of graph.people methods
assertThrows(() => {
  graph.people.set('person-hacked', {});
}, 'graph.people.set() throws runtime Error', 'Cannot mutate ReadOnlyMap');

assertThrows(() => {
  graph.people.delete('person-arun-sharma');
}, 'graph.people.delete() throws runtime Error', 'Cannot mutate ReadOnlyMap');

assertThrows(() => {
  graph.people.clear();
}, 'graph.people.clear() throws runtime Error', 'Cannot mutate ReadOnlyMap');

// Attempted mutation of graph.adjacency methods
assertThrows(() => {
  graph.adjacency.set('INVESTOR_ROOT', []);
}, 'graph.adjacency.set() throws runtime Error', 'Cannot mutate ReadOnlyMap');

assertThrows(() => {
  graph.adjacency.delete('INVESTOR_ROOT');
}, 'graph.adjacency.delete() throws runtime Error', 'Cannot mutate ReadOnlyMap');

assertThrows(() => {
  graph.adjacency.clear();
}, 'graph.adjacency.clear() throws runtime Error', 'Cannot mutate ReadOnlyMap');

// Attempted mutation of nested Person records
const arunPerson = graph.people.get('person-arun-sharma');
assertThrows(() => {
  arunPerson.name = 'Hacked Name';
}, 'Modifying person.name throws TypeError (frozen object)');

assertThrows(() => {
  arunPerson.employmentHistory.push({});
}, 'Modifying person.employmentHistory array throws TypeError (frozen array)');

assertThrows(() => {
  arunPerson.employmentHistory[0].roleTitle = 'Hacked Role';
}, 'Modifying person.employmentHistory[0] throws TypeError');

assertThrows(() => {
  arunPerson.expertise.push({});
}, 'Modifying person.expertise array throws TypeError');

assertThrows(() => {
  arunPerson.expertise[0].name = 'Hacked Expertise';
}, 'Modifying person.expertise[0] throws TypeError');

// Attempted mutation of adjacency list arrays
const rootEdges = graph.adjacency.get('INVESTOR_ROOT');
assertThrows(() => {
  rootEdges.push({});
}, 'Modifying graph.adjacency list array throws TypeError');

// Attempted mutation of graph root
assertThrows(() => {
  graph.rootInvestorId = 'HACKED';
}, 'Modifying graph.rootInvestorId throws TypeError');

// Adversarial deep immutability tests (Step 3.2 Hardening)
// 1. Shallow-frozen parent with mutable nested child
const mutableChild = { role: 'analyst', tags: ['equities'] };
const shallowParent = Object.freeze({ child: mutableChild });
assert(Object.isFrozen(shallowParent) === true, 'Parent is initially shallow-frozen');
assert(Object.isFrozen(mutableChild) === false, 'Child is initially unfrozen');
deepFreeze(shallowParent);
assert(Object.isFrozen(mutableChild) === true, 'deepFreeze traverses and freezes child of already shallow-frozen parent');
assert(Object.isFrozen(mutableChild.tags) === true, 'deepFreeze freezes nested array of shallow-frozen parent');
assertThrows(() => {
  mutableChild.role = 'mutated';
}, 'Mutating child property throws TypeError');
assertThrows(() => {
  mutableChild.tags.push('fixed-income');
}, 'Mutating child array throws TypeError');

// 2. Nested symbol-keyed object
const symKey = Symbol('privateMetadata');
const symChild = { credentialId: 'synthetic-001' };
const objWithSymbol = { [symKey]: symChild, title: 'Profile' };
deepFreeze(objWithSymbol);
assert(Object.isFrozen(objWithSymbol) === true, 'Object with symbol key is frozen');
assert(Object.isFrozen(symChild) === true, 'Symbol-keyed nested object is frozen');
assertThrows(() => {
  symChild.credentialId = 'mutated';
}, 'Mutating symbol-keyed object throws TypeError');

// 3. Cyclic object graph (cycle protection via WeakSet)
const cyclicNodeA = { id: 'node-a' };
const cyclicNodeB = { id: 'node-b', refA: cyclicNodeA };
cyclicNodeA.refB = cyclicNodeB;
deepFreeze(cyclicNodeA);
assert(Object.isFrozen(cyclicNodeA) === true, 'Cyclic node A is frozen without infinite recursion');
assert(Object.isFrozen(cyclicNodeB) === true, 'Cyclic node B is frozen without infinite recursion');
assertThrows(() => {
  cyclicNodeA.id = 'mutated-a';
}, 'Mutating cyclic node A throws TypeError');
assertThrows(() => {
  cyclicNodeB.id = 'mutated-b';
}, 'Mutating cyclic node B throws TypeError');

// 4. Map and Set handling (rejection of mutable Map/Set, deep-freezing of ReadOnlyMap values)
assertThrows(() => {
  deepFreeze(new Map([['k', 'v']]));
}, 'deepFreeze rejects mutable standard Map', 'deepFreeze rejects mutable Map and Set instances');

assertThrows(() => {
  deepFreeze(new Set(['item']));
}, 'deepFreeze rejects mutable standard Set', 'deepFreeze rejects mutable Map and Set instances');

assertThrows(() => {
  deepFreeze({ nestedMap: new Map() });
}, 'deepFreeze rejects nested mutable Map', 'deepFreeze rejects mutable Map and Set instances');

assertThrows(() => {
  deepFreeze({ nestedSet: new Set() });
}, 'deepFreeze rejects nested mutable Set', 'deepFreeze rejects mutable Map and Set instances');

const romChildObj = { portfolioName: 'Core Growth' };
const testRom = new ReadOnlyMap([['p1', romChildObj]]);
deepFreeze(testRom);
assert(Object.isFrozen(testRom) === true, 'ReadOnlyMap instance is frozen');
assert(Object.isFrozen(romChildObj) === true, 'deepFreeze recursively freezes values stored in ReadOnlyMap');
assertThrows(() => {
  romChildObj.portfolioName = 'Mutated';
}, 'Mutating object inside ReadOnlyMap throws TypeError');

// Input dataset immutability
const originalPeopleCount = NETWORK_DATASET.people.length;
const originalEdgeCount = NETWORK_DATASET.edges.length;
assert(originalPeopleCount === 16, 'Input dataset people count remains 16');
assert(originalEdgeCount === 26, 'Input dataset edge count remains 26');

// Rejection of invalid dataset
assertThrows(() => {
  const invalidDataset = {
    ...NETWORK_DATASET,
    people: NETWORK_DATASET.people.slice(0, 10),
  };
  buildNetworkGraph(invalidDataset);
}, 'Invalid dataset is rejected during graph construction', 'Cannot construct NetworkGraph from invalid dataset');

// Directionality verification in adjacency
assert(rootEdges.length === 16, 'INVESTOR_ROOT has exactly 16 outgoing edges', rootEdges.length);

// Investor edges must NOT be traversable backwards
let backwardInvestorEdgesFound = 0;
for (const person of NETWORK_PERSONAS) {
  const personEdges = graph.adjacency.get(person.id) || [];
  for (const edge of personEdges) {
    if (edge.sourceNodeId === 'INVESTOR_ROOT' && edge.targetNodeId === person.id) {
      backwardInvestorEdgesFound++;
    }
  }
}
assert(backwardInvestorEdgesFound === 0, 'Directed investor edges not traversable backwards from people to investor', backwardInvestorEdgesFound);

// P2P edges must be traversable symmetrically
const senEdges = graph.adjacency.get('person-vikram-sen') || [];
const radhikaEdges = graph.adjacency.get('person-radhika-iyer') || [];
const senHasEdge = senEdges.some(e => e.id === 'edge-p2p-sen-radhika');
const radhikaHasEdge = radhikaEdges.some(e => e.id === 'edge-p2p-sen-radhika');
assert(senHasEdge === true, 'P2P edge present in source persona adjacency (Sen)');
assert(radhikaHasEdge === true, 'P2P edge present in target persona adjacency (Radhika)');

// -------------------------------------------------------------
// 2. Sector Matching Precision & Negative Overlap
// -------------------------------------------------------------
console.log('\n2. Sector Matching Precision:');

// Equivalent sector synonyms must match
assert(isSectorMatch('IT Services', 'Information Technology') === true, 'IT Services matches Information Technology');
assert(isSectorMatch('IT Services & Consulting', 'Information Technology') === true, 'IT Services & Consulting matches Information Technology');
assert(isSectorMatch('Banking & Financials', 'Financial Services') === true, 'Banking & Financials matches Financial Services');
assert(isSectorMatch('Non-Banking Financial Company (NBFC)', 'Financial Services') === true, 'NBFC matches Financial Services');
assert(isSectorMatch('Oil & Gas Refining & Marketing', 'Energy') === true, 'Oil & Gas Refining matches Energy');
assert(isSectorMatch('Quick Commerce / Food Delivery', 'Consumer Services') === true, 'Quick Commerce matches Consumer Services');
assert(isSectorMatch('Automobile Manufacturers', 'Consumer Discretionary') === true, 'Automobile Manufacturers matches Consumer Discretionary');
assert(isSectorMatch('Pharmaceuticals', 'Healthcare') === true, 'Pharmaceuticals matches Healthcare');
assert(isSectorMatch('Telecom Services', 'Telecommunications') === true, 'Telecom Services matches Telecommunications');
assert(isSectorMatch('Civil Construction & Engineering', 'Construction') === true, 'Civil Construction matches Construction');

// Negative tests: Distinct sectors sharing generic words MUST NOT match
assert(isSectorMatch('Consumer Staples', 'Consumer Discretionary') === false, 'Consumer Staples does NOT match Consumer Discretionary');
assert(isSectorMatch('Consumer Discretionary', 'Consumer Services') === false, 'Consumer Discretionary does NOT match Consumer Services');
assert(isSectorMatch('Consumer Staples', 'Consumer Services') === false, 'Consumer Staples does NOT match Consumer Services');
assert(isSectorMatch('Management Consulting', 'IT Consulting & Software') === false, 'Management Consulting does NOT match IT Consulting');
assert(isSectorMatch('Financial Technology (Fintech)', 'Information Technology') === false, 'Fintech does NOT match Information Technology');
assert(isSectorMatch('Private Credit & Special Situations', 'Information Technology') === false, 'Private Credit does NOT match Information Technology');
assert(isSectorMatch('Civil Construction & Engineering', 'Energy') === false, 'Civil Construction does NOT match Energy');
assert(isSectorMatch('Apparel Retail', 'Personal Care & Household Products') === false, 'Apparel Retail does NOT match Personal Care');

// Unknown or ambiguous classifications must NOT match
assert(isSectorMatch('Aerospace & Defense', 'Information Technology') === false, 'Unknown sector does not match IT');
assert(isSectorMatch('Cryptocurrency Mining', 'Financial Services') === false, 'Unknown sector does not match Financial Services');
assert(isSectorMatch('Services', 'Services') === false, 'Generic word "Services" without registered cluster does not match');
assert(isSectorMatch('Technology', 'Technology') === false, 'Generic word "Technology" without registered cluster does not match');
assert(isSectorMatch('', 'Information Technology') === false, 'Empty string does not match');
assert(isSectorMatch('Information Technology', '') === false, 'Empty target does not match');

// Step 3.2 Hardening: Unambiguous Energy aliases (Positive tests)
assert(isSectorMatch('Energy', 'Energy') === true, 'Exact "Energy" matches "Energy"');
assert(isSectorMatch('energy', 'ENERGY') === true, 'Case-insensitive "energy" matches "ENERGY"');
assert(isSectorMatch('Energy & Petrochemicals', 'Energy') === true, 'Energy & Petrochemicals matches Energy');
assert(isSectorMatch('Oil & Gas Refining & Marketing', 'Energy') === true, 'Oil & Gas Refining & Marketing matches Energy');
assert(isSectorMatch('Energy & Industrials Advisory', 'Energy') === true, 'Energy & Industrials Advisory matches Energy');

// Step 3.2 Hardening: Ambiguous & multi-sector labels must NOT be classified as Energy (Negative tests)
assert(isSectorMatch('Energy, Retail & Telecommunications', 'Energy') === false, 'Multi-sector "Energy, Retail & Telecommunications" does NOT match Energy');
assert(isSectorMatch('Conglomerate / Energy', 'Energy') === false, 'Ambiguous "Conglomerate / Energy" does NOT match Energy');
assert(isSectorMatch('Conglomerate', 'Energy') === false, 'Conglomerate does NOT match Energy');
assert(isSectorMatch('Diversified Conglomerate', 'Energy') === false, 'Diversified Conglomerate does NOT match Energy');
assert(isSectorMatch('Consumer Goods & Internet Services', 'Consumer Services') === false, 'Multi-sector "Consumer Goods & Internet Services" does NOT match Consumer Services');
assert(isSectorMatch('Consumer Goods & Internet Services', 'Consumer Staples') === false, 'Multi-sector "Consumer Goods & Internet Services" does NOT match Consumer Staples');

// -------------------------------------------------------------
// 3. Pathfinding & Accessibility
// -------------------------------------------------------------
console.log('\n3. Pathfinding & Accessibility:');

// Direct 1-hop path for Arun Sharma
const arunPaths = findIntroductionPaths('person-arun-sharma', graph);
assert(arunPaths.length >= 1, 'Arun Sharma has at least 1 path from INVESTOR_ROOT', arunPaths.length);
assert(arunPaths[0].degree === 1, 'Direct path degree is 1');
assert(arunPaths[0].hopCount === 1, 'Direct path hopCount is 1');
assert(arunPaths[0].pathStrength === 4, 'Direct path strength matches edge connectionStrength (4)');
assert(arunPaths[0].accessibilityScore === 80, 'Direct accessibility score is 4 * 20 = 80', arunPaths[0].accessibilityScore);
assert(arunPaths[0].intermediary === undefined, 'Direct path has no intermediary');

// Second-degree paths for Radhika Iyer
const radhikaPaths = findIntroductionPaths('person-radhika-iyer', graph);
assert(radhikaPaths.length >= 2, 'Radhika Iyer has multiple paths (direct + 2-hop)', radhikaPaths.length);
assert(radhikaPaths[0].degree === 1, 'First path in sorted order is direct 1-hop path');
const secondDegreePath = radhikaPaths.find(p => p.degree === 2);
assert(secondDegreePath !== undefined, 'Second-degree path found for Radhika Iyer');
assert(secondDegreePath.hopCount === 2, 'Second-degree path hopCount is 2');
assert(secondDegreePath.intermediary?.id === 'person-vikram-sen', 'Intermediary is Vikram Sen');
assert(secondDegreePath.pathStrength === 4, 'Path strength is min(5, 4) = 4');
assert(secondDegreePath.accessibilityScore === 65, 'Accessibility score is 4 * 20 - 15 = 65', secondDegreePath.accessibilityScore);
assert(secondDegreePath.nodeIds.length === 3, 'Path nodeIds contains exactly 3 nodes');

// Traversal depth capped at 2 across all personas
for (const person of NETWORK_PERSONAS) {
  const paths = findIntroductionPaths(person.id, graph);
  for (const p of paths) {
    assert(p.hopCount <= 2, `Path to ${person.id} does not exceed max depth of 2 (hopCount: ${p.hopCount})`);
  }
}

// No repeated nodes across all personas
for (const person of NETWORK_PERSONAS) {
  const paths = findIntroductionPaths(person.id, graph);
  for (const p of paths) {
    const uniqueNodes = new Set(p.nodeIds);
    assert(uniqueNodes.size === p.nodeIds.length, `Path to ${person.id} has no repeated nodes (${p.nodeIds.join(' -> ')})`);
  }
}

// Deterministic ordering across repeated calls
const pathsCall1 = findIntroductionPaths('person-radhika-iyer', graph);
const pathsCall2 = findIntroductionPaths('person-radhika-iyer', graph);
assert(JSON.stringify(pathsCall1) === JSON.stringify(pathsCall2), 'Pathfinding produces identical deterministic results across repeated calls');

// Non-existent target
const nonExistentPaths = findIntroductionPaths('person-does-not-exist', graph);
assert(Array.isArray(nonExistentPaths) && nonExistentPaths.length === 0, 'Non-existent target returns empty paths array');

// -------------------------------------------------------------
// 4. Relevance Scoring & Reconciliation
// -------------------------------------------------------------
console.log('\n4. Relevance Scoring & Reconciliation:');

const vikramPerson = graph.people.get('person-vikram-sen');
const deepaPerson = graph.people.get('person-deepa-menon');

// Current company role at TCS
const vikramTcsRel = calculateCompanyRelevance(vikramPerson, 'TCS', graph);
assert(vikramTcsRel.relevanceScore >= 60, 'Current company employment scores >= 60 points', vikramTcsRel.relevanceScore);
assert(vikramTcsRel.reasons.some(r => r.category === 'CURRENT_ROLE'), 'Includes CURRENT_ROLE reason');

// Past company role at RELIANCE
const arunRelianceRel = calculateCompanyRelevance(arunPerson, 'RELIANCE', graph);
assert(arunRelianceRel.relevanceScore >= 35, 'Previous company employment scores >= 35 points', arunRelianceRel.relevanceScore);
assert(arunRelianceRel.reasons.some(r => r.category === 'PAST_ROLE'), 'Includes PAST_ROLE reason');

// Current vs Past comparison
assert(vikramTcsRel.relevanceScore > arunRelianceRel.relevanceScore, 'Current company employment scores higher than past company employment');

// Unrelated company: Deepa Menon (Healthcare) queried for RELIANCE (Energy)
const deepaRelianceRel = calculateCompanyRelevance(deepaPerson, 'RELIANCE', graph);
assert(deepaRelianceRel.relevanceScore === 0, 'Unrelated company query yields 0 relevance score', deepaRelianceRel.relevanceScore);
assert(deepaRelianceRel.reasons.length === 0, 'Zero relevance yields 0 reasons');

// Unknown ticker handling
const unknownTickerRel = calculateCompanyRelevance(vikramPerson, 'UNKNOWN_TICKER_XYZ', graph);
assert(unknownTickerRel.relevanceScore === 0, 'Unknown ticker yields 0 relevance score');
assert(unknownTickerRel.reasons.length === 0, 'Unknown ticker yields 0 reasons');

// Empty and whitespace ticker
assert(calculateCompanyRelevance(vikramPerson, '', graph).relevanceScore === 0, 'Empty ticker yields 0 relevance');
assert(calculateCompanyRelevance(vikramPerson, '   ', graph).relevanceScore === 0, 'Whitespace ticker yields 0 relevance');

// Sector scoring: Current vs Past vs Unrelated
const energyRel = calculateSectorRelevance(arunPerson, 'Energy');
assert(energyRel.relevanceScore > 0, 'Arun Sharma has positive relevance for Energy sector', energyRel.relevanceScore);

const pharmaRel = calculateSectorRelevance(deepaPerson, 'Healthcare');
assert(pharmaRel.relevanceScore >= 50, 'Current role in Healthcare scores >= 50', pharmaRel.relevanceScore);

// Empty sector query
assert(calculateSectorRelevance(arunPerson, '').relevanceScore === 0, 'Empty sector query yields 0 relevance');
assert(calculateSectorRelevance(arunPerson, '   ').relevanceScore === 0, 'Whitespace sector query yields 0 relevance');

// Expertise scoring: Exact vs Partial & Proficiency
const exactExpertise = calculateExpertiseRelevance(arunPerson, 'O2C Refining & Petrochemical Crack Spreads');
assert(exactExpertise.relevanceScore >= 60, 'Exact expertise tag match scores >= 60', exactExpertise.relevanceScore);
assert(exactExpertise.reasons.some(r => r.category === 'EXPERTISE_EXACT'), 'Includes EXPERTISE_EXACT reason');

const partialExpertise = calculateExpertiseRelevance(arunPerson, 'Petrochemical');
assert(partialExpertise.relevanceScore > 0, 'Partial keyword match scores positive', partialExpertise.relevanceScore);
assert(exactExpertise.relevanceScore >= partialExpertise.relevanceScore, 'Exact match scores higher than or equal to partial match');

// Empty expertise query
assert(calculateExpertiseRelevance(arunPerson, '').relevanceScore === 0, 'Empty expertise query yields 0 relevance');
assert(calculateExpertiseRelevance(arunPerson, '   ').relevanceScore === 0, 'Whitespace expertise query yields 0 relevance');

// Score Breakdown & Mathematical Reconciliation
const b1 = calculateScoreBreakdown(70, 100);
assert(b1.rawRelevanceScore === 70, 'b1 rawRelevanceScore is 70');
assert(b1.rawAccessibilityScore === 100, 'b1 rawAccessibilityScore is 100');
assert(b1.weightedRelevanceContribution === 46, 'b1 weightedRelevanceContribution is round(0.65 * 70) = 46', b1.weightedRelevanceContribution);
assert(b1.weightedAccessibilityContribution === 35, 'b1 weightedAccessibilityContribution is round(0.35 * 100) = 35', b1.weightedAccessibilityContribution);
assert(b1.overallScore === 81, 'b1 overallScore is 81');
assert(
  b1.weightedRelevanceContribution + b1.weightedAccessibilityContribution + b1.roundingAdjustment === b1.overallScore,
  'b1 reconciliation: weightedRelevance + weightedAccessibility + roundingAdjustment === overallScore'
);

const b2 = calculateScoreBreakdown(35, 65);
assert(
  b2.weightedRelevanceContribution + b2.weightedAccessibilityContribution + b2.roundingAdjustment === b2.overallScore,
  'b2 reconciliation: weightedRelevance + weightedAccessibility + roundingAdjustment === overallScore'
);

const bZero = calculateScoreBreakdown(0, 100);
assert(bZero.overallScore === 0, 'Zero relevance strictly yields overallScore = 0 regardless of accessibility', bZero.overallScore);
assert(bZero.weightedRelevanceContribution === 0, 'Zero relevance has 0 weighted relevance');
assert(bZero.weightedAccessibilityContribution === 0, 'Zero relevance has 0 weighted accessibility');

// Step 3.2 Hardening: Exhaustive test over all 10,201 integer relevance/accessibility pairs (0-100)
let exhaustivePairs = 0;
let exhaustiveIdentityFailures = 0;
let exhaustiveRangeFailures = 0;
let zeroRelevanceFailures = 0;

for (let r = 0; r <= 100; r++) {
  for (let a = 0; a <= 100; a++) {
    exhaustivePairs++;
    const breakdown = calculateScoreBreakdown(r, a);

    if (breakdown.overallScore < 0 || breakdown.overallScore > 100) {
      exhaustiveRangeFailures++;
    }

    if (r === 0) {
      if (
        breakdown.overallScore !== 0 ||
        breakdown.weightedRelevanceContribution !== 0 ||
        breakdown.weightedAccessibilityContribution !== 0 ||
        breakdown.roundingAdjustment !== 0
      ) {
        zeroRelevanceFailures++;
      }
    } else {
      const reconciled =
        breakdown.weightedRelevanceContribution +
        breakdown.weightedAccessibilityContribution +
        breakdown.roundingAdjustment;
      if (reconciled !== breakdown.overallScore) {
        exhaustiveIdentityFailures++;
      }
      if (Math.abs(breakdown.roundingAdjustment) > 1) {
        exhaustiveRangeFailures++;
      }
    }
  }
}

assert(exhaustivePairs === 10201, 'Exhaustive verification checked exactly 10,201 integer pairs (0-100 x 0-100)');
assert(exhaustiveIdentityFailures === 0, 'Reconciliation identity holds for all 10,201 integer pairs (0 violations)');
assert(exhaustiveRangeFailures === 0, 'All 10,201 overall scores and rounding adjustments are strictly bounded');
assert(zeroRelevanceFailures === 0, 'Zero relevance strictly yields 0 overall score across all 101 accessibility values');

// Step 3.2 Hardening: Boundary and non-standard number tests (NaN, Infinity, negative, > 100)
const bNaNRel = calculateScoreBreakdown(NaN, 80);
assert(bNaNRel.rawRelevanceScore === 0, 'NaN relevance score is sanitized to 0');
assert(bNaNRel.overallScore === 0, 'NaN relevance yields overallScore = 0');
assert(bNaNRel.weightedRelevanceContribution === 0, 'NaN relevance has 0 weighted relevance');

const bNaNAcc = calculateScoreBreakdown(70, NaN);
assert(bNaNAcc.rawAccessibilityScore === 0, 'NaN accessibility score is sanitized to 0');
assert(
  bNaNAcc.weightedRelevanceContribution + bNaNAcc.weightedAccessibilityContribution + bNaNAcc.roundingAdjustment === bNaNAcc.overallScore,
  'NaN accessibility breakdown reconciles mathematically'
);

const bNegRel = calculateScoreBreakdown(-50, 80);
assert(bNegRel.rawRelevanceScore === 0, 'Negative relevance score clamped to 0');
assert(bNegRel.overallScore === 0, 'Negative relevance yields overallScore = 0');

const bNegInfRel = calculateScoreBreakdown(-Infinity, 50);
assert(bNegInfRel.rawRelevanceScore === 0, '-Infinity relevance clamped to 0');
assert(bNegInfRel.overallScore === 0, '-Infinity relevance yields overallScore = 0');

const bNegAcc = calculateScoreBreakdown(80, -20);
assert(bNegAcc.rawAccessibilityScore === 0, 'Negative accessibility clamped to 0');
assert(
  bNegAcc.weightedRelevanceContribution + bNegAcc.weightedAccessibilityContribution + bNegAcc.roundingAdjustment === bNegAcc.overallScore,
  'Negative accessibility breakdown reconciles mathematically'
);

const bAbove100 = calculateScoreBreakdown(150, 200);
assert(bAbove100.rawRelevanceScore === 100, 'Relevance score > 100 clamped to 100');
assert(bAbove100.rawAccessibilityScore === 100, 'Accessibility score > 100 clamped to 100');
assert(bAbove100.overallScore === 100, 'Clamped scores yield overallScore = 100');
assert(
  bAbove100.weightedRelevanceContribution + bAbove100.weightedAccessibilityContribution + bAbove100.roundingAdjustment === 100,
  'Scores > 100 breakdown reconciles'
);

const bPosInf = calculateScoreBreakdown(Infinity, Infinity);
assert(bPosInf.rawRelevanceScore === 100, '+Infinity relevance clamped to 100');
assert(bPosInf.rawAccessibilityScore === 100, '+Infinity accessibility clamped to 100');
assert(bPosInf.overallScore === 100, '+Infinity yields overallScore = 100');

// -------------------------------------------------------------
// 5. Recommendation APIs
// -------------------------------------------------------------
console.log('\n5. Recommendation APIs:');

// getContactsForCompany
const relianceRecs = getContactsForCompany('RELIANCE', graph);
assert(relianceRecs.length > 0, 'getContactsForCompany(RELIANCE) returns recommendations', relianceRecs.length);
assert(relianceRecs[0].person.id === 'person-arun-sharma', 'Top recommendation for RELIANCE is Arun Sharma');
assert(relianceRecs[0].overallScore > 0, 'Overall score is positive', relianceRecs[0].overallScore);
assert(relianceRecs[0].scoreBreakdown !== undefined, 'Recommendation includes scoreBreakdown');
assert(
  relianceRecs[0].scoreBreakdown.weightedRelevanceContribution +
    relianceRecs[0].scoreBreakdown.weightedAccessibilityContribution +
    relianceRecs[0].scoreBreakdown.roundingAdjustment ===
    relianceRecs[0].scoreBreakdown.overallScore,
  'Recommendation scoreBreakdown reconciles mathematically with overallScore'
);
assert(relianceRecs[0].relevanceScore === relianceRecs[0].scoreBreakdown.rawRelevanceScore, 'Recommendation relevanceScore matches scoreBreakdown.rawRelevanceScore');
assert(relianceRecs[0].accessibilityScore === relianceRecs[0].scoreBreakdown.rawAccessibilityScore, 'Recommendation accessibilityScore matches scoreBreakdown.rawAccessibilityScore');
assert(relianceRecs[0].overallScore === relianceRecs[0].scoreBreakdown.overallScore, 'Recommendation overallScore matches scoreBreakdown.overallScore');
assert(
  !relianceRecs[0].reasons.some(r => r.category === 'RELATIONSHIP_PATH'),
  'reasons array contains strictly professional domain relevance reasons (no RELATIONSHIP_PATH)'
);

// Zero relevance candidate strictly excluded
const reliancePersonIds = new Set(relianceRecs.map(r => r.person.id));
assert(!reliancePersonIds.has('person-deepa-menon'), 'Deepa Menon (Healthcare) excluded from RELIANCE recommendations');

// Unknown ticker returns empty array
const unknownTickerRecs = getContactsForCompany('UNKNOWN_XYZ', graph);
assert(Array.isArray(unknownTickerRecs) && unknownTickerRecs.length === 0, 'Unknown ticker returns empty array');

// Empty & whitespace ticker returns empty array
assert(getContactsForCompany('', graph).length === 0, 'Empty ticker returns empty array');
assert(getContactsForCompany('   ', graph).length === 0, 'Whitespace ticker returns empty array');

// getContactsForCompany for TCS: exactly 2 verified contacts (Sen, Radhika)
const tcsRecs = getContactsForCompany('TCS', graph);
assert(tcsRecs.length === 2, 'getContactsForCompany(TCS) returns exactly 2 verified contacts', tcsRecs.length);
assert(tcsRecs[0].person.id === 'person-vikram-sen', 'Top recommendation for TCS is Vikram Sen (TCS)');
assert(tcsRecs[1].person.id === 'person-radhika-iyer', 'Second recommendation for TCS is Radhika Iyer (Infosys peer)');

// getContactsForSector
const consumerRecs = getContactsForSector('Consumer Services', graph);
assert(consumerRecs.length === 2, 'Consumer Services returns exactly 2 contacts (Swiggy / Zomato)', consumerRecs.length);
const consumerIds = consumerRecs.map(r => r.person.id);
assert(consumerIds.includes('person-priya-nair'), 'Priya Nair recommended for Consumer Services');
assert(consumerIds.includes('person-sunil-verma'), 'Sunil Verma recommended for Consumer Services');

// Negative sector check: Maruti / Trent (Consumer Discretionary) must NOT appear in Consumer Services
assert(!consumerIds.includes('person-manish-kapoor'), 'Manish Kapoor (Automobile / Discretionary) excluded from Consumer Services');
assert(!consumerIds.includes('person-neha-singh'), 'Neha Singh (Trent / Discretionary) excluded from Consumer Services');

// getContactsForExpertise
const crackSpreadRecs = getContactsForExpertise('Crack Spreads', graph);
assert(crackSpreadRecs.length > 0, 'getContactsForExpertise(Crack Spreads) returns recommendations', crackSpreadRecs.length);
assert(crackSpreadRecs[0].person.id === 'person-arun-sharma', 'Top recommendation for Crack Spreads is Arun Sharma');

// -------------------------------------------------------------
// 6. Free-Text Discovery Search Semantics
// -------------------------------------------------------------
console.log('\n6. Free-Text Discovery Search Semantics:');

// Name search
const vikramSearch = searchNetwork('Vikram', graph);
assert(vikramSearch.length > 0, 'searchNetwork(Vikram) returns results', vikramSearch.length);
assert(vikramSearch[0].person.name === 'Vikram Sen', 'Top result is Vikram Sen');
assert(vikramSearch[0].searchMatchScore > 0, 'searchMatchScore is positive', vikramSearch[0].searchMatchScore);
assert(vikramSearch[0].searchRankingScore > 0, 'searchRankingScore is positive', vikramSearch[0].searchRankingScore);
assert(
  vikramSearch[0].matchReasons.some(m => m.field === 'NAME'),
  'Match reasons identifies NAME field'
);
assert(
  !vikramSearch[0].matchReasons.some(m => m.category === 'CURRENT_ROLE'),
  'Search match reasons do NOT assign professional CURRENT_ROLE category'
);

// Empty and whitespace search queries
assert(searchNetwork('', graph).length === 0, 'searchNetwork("") returns empty array');
assert(searchNetwork('   ', graph).length === 0, 'searchNetwork("   ") returns empty array');

// Deduplication: No duplicate points from same field
for (const res of vikramSearch) {
  const fields = res.matchReasons.map(m => m.field);
  const uniqueFields = new Set(fields);
  assert(fields.length === uniqueFields.size, `Person '${res.person.id}' has deduplicated search match reasons`);
}

// Search by role title
const directorSearch = searchNetwork('Director', graph);
assert(directorSearch.length > 0, 'searchNetwork(Director) returns matching personas', directorSearch.length);
assert(
  directorSearch.some(r => r.matchReasons.some(m => m.field === 'CURRENT_ROLE' || m.field === 'PAST_ROLE')),
  'Director search matches role fields'
);

// Search by company
const relianceSearch = searchNetwork('Reliance', graph);
assert(relianceSearch.length > 0, 'searchNetwork(Reliance) returns matching personas', relianceSearch.length);
assert(
  relianceSearch.some(r => r.person.id === 'person-arun-sharma'),
  'Arun Sharma found via Reliance organisation search'
);

// Deterministic tie-breaking in search
for (let i = 0; i < relianceSearch.length - 1; i++) {
  const a = relianceSearch[i];
  const b = relianceSearch[i + 1];
  if (a.searchRankingScore === b.searchRankingScore) {
    if (a.searchMatchScore === b.searchMatchScore) {
      if (a.accessibilityScore === b.accessibilityScore) {
        assert(a.degree <= b.degree, 'Equal search scores tie-break by degree ascending');
      } else {
        assert(a.accessibilityScore >= b.accessibilityScore, 'Equal search scores tie-break by accessibility desc');
      }
    } else {
      assert(a.searchMatchScore >= b.searchMatchScore, 'Equal search ranking scores tie-break by searchMatchScore desc');
    }
  } else {
    assert(a.searchRankingScore >= b.searchRankingScore, 'Search results sorted by searchRankingScore desc');
  }
}

// queryNetwork discriminated union
const queryCompRecs = queryNetwork({ type: 'COMPANY', ticker: 'RELIANCE' }, graph);
assert(queryCompRecs.length === relianceRecs.length, 'queryNetwork with COMPANY query matches getContactsForCompany');

const querySectorRecs = queryNetwork({ type: 'SECTOR', sector: 'Consumer Services' }, graph);
assert(querySectorRecs.length === consumerRecs.length, 'queryNetwork with SECTOR query matches getContactsForSector');

const queryGeneralRecs = queryNetwork({ type: 'GENERAL', query: 'Vikram' }, graph);
assert(queryGeneralRecs.length === vikramSearch.length, 'queryNetwork with GENERAL query matches searchNetwork');

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n========================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
