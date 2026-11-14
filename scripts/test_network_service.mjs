#!/usr/bin/env node
/**
 * Automated Unit Tests for FINN Network Intelligence Service.
 *
 * Verifies pure TypeScript graph construction, directed/undirected traversal,
 * 2-hop depth capping, explainable relevance scoring, and contact ranking.
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
  calculateGeneralRelevance,
  calculateOverallScore,
  getContactsForCompany,
  getContactsForSector,
  getContactsForExpertise,
  searchNetwork,
  queryNetwork,
  resolveTickerSector,
  isSectorMatch,
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

console.log('=== FINN Network Intelligence Service & Traversal Tests ===\n');

// -------------------------------------------------------------
// 1. Graph Construction Tests
// -------------------------------------------------------------
console.log('1. Graph Construction:');

const graph = buildNetworkGraph(NETWORK_DATASET);

assert(graph !== null && typeof graph === 'object', 'Graph builds successfully');
assert(graph.rootInvestorId === 'INVESTOR_ROOT', 'Graph preserves INVESTOR_ROOT as root');
assert(graph.totalNodes === 17, 'Total nodes equals 17 (16 personas + INVESTOR_ROOT)', graph.totalNodes);
assert(graph.totalEdges === 26, 'Total edges equals 26', graph.totalEdges);
assert(graph.people.size === 16, 'All 16 people indexed in people map', graph.people.size);

// Check all 16 personas exist by ID
for (const person of NETWORK_PERSONAS) {
  assert(graph.people.has(person.id), `Person '${person.id}' indexed in graph.people`);
}

// Directionality verification in adjacency
const rootAdjacency = graph.adjacency.get('INVESTOR_ROOT') || [];
assert(rootAdjacency.length === 16, 'INVESTOR_ROOT has exactly 16 outgoing edges', rootAdjacency.length);

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
// Take edge-p2p-sen-radhika: person-vikram-sen <-> person-radhika-iyer
const senEdges = graph.adjacency.get('person-vikram-sen') || [];
const radhikaEdges = graph.adjacency.get('person-radhika-iyer') || [];
const senHasEdge = senEdges.some(e => e.id === 'edge-p2p-sen-radhika');
const radhikaHasEdge = radhikaEdges.some(e => e.id === 'edge-p2p-sen-radhika');
assert(senHasEdge === true, 'P2P edge present in source persona adjacency (Sen)');
assert(radhikaHasEdge === true, 'P2P edge present in target persona adjacency (Radhika)');

// Input dataset immutability
const originalPeopleCount = NETWORK_DATASET.people.length;
const originalEdgeCount = NETWORK_DATASET.edges.length;
assert(originalPeopleCount === 16, 'Input dataset people count remains 16');
assert(originalEdgeCount === 26, 'Input dataset edge count remains 26');

// Rejection of invalid dataset
let invalidDatasetThrown = false;
try {
  const invalidDataset = {
    ...NETWORK_DATASET,
    people: NETWORK_DATASET.people.slice(0, 10), // Only 10 people -> invalid
  };
  buildNetworkGraph(invalidDataset);
} catch (err) {
  invalidDatasetThrown = true;
  assert(err instanceof Error && err.message.includes('Cannot construct NetworkGraph from invalid dataset'), 'Rejection error message is descriptive');
}
assert(invalidDatasetThrown === true, 'Invalid dataset is rejected during graph construction');

// -------------------------------------------------------------
// 2. Pathfinding Tests
// -------------------------------------------------------------
console.log('\n2. Pathfinding & Accessibility:');

// Direct 1-hop path for Arun Sharma
const arunPaths = findIntroductionPaths('person-arun-sharma', graph);
assert(arunPaths.length >= 1, 'Arun Sharma has at least 1 path from INVESTOR_ROOT', arunPaths.length);
assert(arunPaths[0].degree === 1, 'Direct path degree is 1');
assert(arunPaths[0].hopCount === 1, 'Direct path hopCount is 1');
assert(arunPaths[0].pathStrength === 4, 'Direct path strength matches edge connectionStrength (4)');
assert(arunPaths[0].accessibilityScore === 80, 'Direct accessibility score is 4 * 20 = 80', arunPaths[0].accessibilityScore);
assert(arunPaths[0].intermediary === undefined, 'Direct path has no intermediary');

// Second-degree paths for Radhika Iyer
// Direct: INVESTOR_ROOT -> Radhika (strength 3, access 60)
// 2-hop: INVESTOR_ROOT -> Vikram Sen (strength 5) -> Radhika (strength 4) -> pathStrength 4, access: 4*20 - 15 = 65
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

// Traversal depth capped at 2
for (const person of NETWORK_PERSONAS) {
  const paths = findIntroductionPaths(person.id, graph);
  for (const p of paths) {
    assert(p.hopCount <= 2, `Path to ${person.id} does not exceed max depth of 2 (hopCount: ${p.hopCount})`);
  }
}

// No repeated nodes
for (const person of NETWORK_PERSONAS) {
  const paths = findIntroductionPaths(person.id, graph);
  for (const p of paths) {
    const uniqueNodes = new Set(p.nodeIds);
    assert(uniqueNodes.size === p.nodeIds.length, `Path to ${person.id} has no repeated nodes (${p.nodeIds.join(' -> ')})`);
  }
}

// Deterministic ordering across multiple calls
const pathsCall1 = findIntroductionPaths('person-radhika-iyer', graph);
const pathsCall2 = findIntroductionPaths('person-radhika-iyer', graph);
assert(JSON.stringify(pathsCall1) === JSON.stringify(pathsCall2), 'Pathfinding produces identical deterministic results across repeated calls');

// Non-existent target
const nonExistentPaths = findIntroductionPaths('person-does-not-exist', graph);
assert(Array.isArray(nonExistentPaths) && nonExistentPaths.length === 0, 'Non-existent target returns empty paths array');

// -------------------------------------------------------------
// 3. Relevance Scoring Tests
// -------------------------------------------------------------
console.log('\n3. Relevance Scoring:');

// Company scoring: Current vs Past vs Unrelated
const vikramPerson = graph.people.get('person-vikram-sen');
const arunPerson = graph.people.get('person-arun-sharma');
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

// Unrelated company (Dr. Deepa Menon at Sun Pharma / Healthcare queried for RELIANCE / Energy)
const deepaRelianceRel = calculateCompanyRelevance(deepaPerson, 'RELIANCE', graph);
assert(deepaRelianceRel.relevanceScore === 0, 'Unrelated company query yields 0 relevance score', deepaRelianceRel.relevanceScore);
assert(deepaRelianceRel.reasons.length === 0, 'Zero relevance yields 0 reasons');

// Sector scoring: Current vs Past vs Unrelated
const energyRel = calculateSectorRelevance(arunPerson, 'Energy');
assert(energyRel.relevanceScore > 0, 'Arun Sharma has positive relevance for Energy sector', energyRel.relevanceScore);

const pharmaRel = calculateSectorRelevance(deepaPerson, 'Healthcare');
assert(pharmaRel.relevanceScore >= 50, 'Current role in Healthcare scores >= 50', pharmaRel.relevanceScore);

// Expertise scoring: Exact vs Partial & Proficiency
const exactExpertise = calculateExpertiseRelevance(arunPerson, 'O2C Refining & Petrochemical Crack Spreads');
assert(exactExpertise.relevanceScore >= 60, 'Exact expertise tag match scores >= 60', exactExpertise.relevanceScore);
assert(exactExpertise.reasons.some(r => r.category === 'EXPERTISE_EXACT'), 'Includes EXPERTISE_EXACT reason');

const partialExpertise = calculateExpertiseRelevance(arunPerson, 'Petrochemical');
assert(partialExpertise.relevanceScore > 0, 'Partial keyword match scores positive', partialExpertise.relevanceScore);
assert(exactExpertise.relevanceScore >= partialExpertise.relevanceScore, 'Exact match scores higher than or equal to partial match');

// General search scoring
const generalNameMatch = calculateGeneralRelevance(vikramPerson, 'Vikram', graph);
assert(generalNameMatch.relevanceScore >= 50, 'General search matches person name', generalNameMatch.relevanceScore);

// Score bounds: all scores between 0 and 100
assert(vikramTcsRel.relevanceScore >= 0 && vikramTcsRel.relevanceScore <= 100, 'Company relevance is bounded [0, 100]');
assert(energyRel.relevanceScore >= 0 && energyRel.relevanceScore <= 100, 'Sector relevance is bounded [0, 100]');
assert(exactExpertise.relevanceScore >= 0 && exactExpertise.relevanceScore <= 100, 'Expertise relevance is bounded [0, 100]');
assert(generalNameMatch.relevanceScore >= 0 && generalNameMatch.relevanceScore <= 100, 'General relevance is bounded [0, 100]');

// Independence of relevance and accessibility:
// A person with strength 5 to investor (100 accessibility) but 0 relevance must have 0 overallScore
const overallWithZeroRel = calculateOverallScore(0, 100);
assert(overallWithZeroRel === 0, 'Zero professional relevance strictly yields 0 overall score regardless of accessibility', overallWithZeroRel);

// -------------------------------------------------------------
// 4. Recommendation API Tests
// -------------------------------------------------------------
console.log('\n4. Recommendation APIs:');

// getContactsForCompany
const relianceRecs = getContactsForCompany('RELIANCE', graph);
assert(relianceRecs.length > 0, 'getContactsForCompany(RELIANCE) returns recommendations', relianceRecs.length);
assert(relianceRecs[0].person.id === 'person-arun-sharma', 'Top recommendation for RELIANCE is Arun Sharma');
assert(relianceRecs[0].overallScore > 0, 'Overall score is positive', relianceRecs[0].overallScore);
assert(relianceRecs[0].provenanceDisclaimer.includes('SYNTHETIC'), 'Includes prototype synthetic provenance disclaimer');
assert(relianceRecs[0].reasons.length >= 2, 'Recommendation includes structured human-readable reasons', relianceRecs[0].reasons.length);

// Zero-relevance candidates excluded
const reliancePersonIds = new Set(relianceRecs.map(r => r.person.id));
assert(!reliancePersonIds.has('person-deepa-menon'), 'Deepa Menon (Healthcare) excluded from RELIANCE recommendations');

// getContactsForCompany for TCS
const tcsRecs = getContactsForCompany('TCS', graph);
assert(tcsRecs.length > 0, 'getContactsForCompany(TCS) returns recommendations', tcsRecs.length);
assert(tcsRecs[0].person.id === 'person-vikram-sen', 'Top recommendation for TCS is Vikram Sen (VP & Global Head of Delivery at TCS)');

// getContactsForSector
const consumerRecs = getContactsForSector('Consumer Services', graph);
assert(consumerRecs.length >= 2, 'Consumer Services recommendations found', consumerRecs.length);
const consumerIds = consumerRecs.map(r => r.person.id);
assert(consumerIds.includes('person-priya-nair'), 'Priya Nair recommended for Consumer Services (Swiggy / Zomato)');
assert(consumerIds.includes('person-sunil-verma'), 'Sunil Verma recommended for Consumer Services (Zomato / Swiggy)');

// getContactsForExpertise
const crackSpreadRecs = getContactsForExpertise('Crack Spreads', graph);
assert(crackSpreadRecs.length > 0, 'getContactsForExpertise(Crack Spreads) returns recommendations', crackSpreadRecs.length);
assert(crackSpreadRecs[0].person.id === 'person-arun-sharma', 'Top recommendation for Crack Spreads is Arun Sharma');

// searchNetwork
const searchVikramRecs = searchNetwork('Vikram', graph);
assert(searchVikramRecs.length > 0, 'searchNetwork(Vikram) returns results', searchVikramRecs.length);
assert(searchVikramRecs[0].person.name === 'Vikram Sen', 'Top search result matches Vikram Sen');

// queryNetwork discriminated union
const queryCompRecs = queryNetwork({ type: 'COMPANY', ticker: 'RELIANCE' }, graph);
assert(queryCompRecs.length === relianceRecs.length, 'queryNetwork with COMPANY query matches getContactsForCompany');

const querySectorRecs = queryNetwork({ type: 'SECTOR', sector: 'Consumer Services' }, graph);
assert(querySectorRecs.length === consumerRecs.length, 'queryNetwork with SECTOR query matches getContactsForSector');

// Deterministic ranking order verification: overallScore desc, relevanceScore desc, accessibilityScore desc
for (const recs of [relianceRecs, tcsRecs, consumerRecs]) {
  for (let i = 0; i < recs.length - 1; i++) {
    const a = recs[i];
    const b = recs[i + 1];
    if (a.overallScore === b.overallScore) {
      if (a.relevanceScore === b.relevanceScore) {
        if (a.accessibilityScore === b.accessibilityScore) {
          assert(a.degree <= b.degree, 'Equal scores tie-break by degree ascending');
        } else {
          assert(a.accessibilityScore >= b.accessibilityScore, 'Equal overall and relevance tie-break by accessibility desc');
        }
      } else {
        assert(a.relevanceScore >= b.relevanceScore, 'Equal overall scores tie-break by relevance desc');
      }
    } else {
      assert(a.overallScore >= b.overallScore, 'Recommendations are sorted by overallScore desc');
    }
  }
}

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n========================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
