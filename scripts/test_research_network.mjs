#!/usr/bin/env node
/**
 * Automated Unit Tests for FINN Phase 1, Step 6:
 * Contextual Network Intelligence in Research Copilot.
 *
 * Verifies:
 * 1. Reliance dossier resolves to correct ticker and expected network contacts.
 * 2. TCS dossier retrieves its correct contextual recommendations.
 * 3. Changing ticker changes recommendations dynamically and deterministically.
 * 4. Unsupported ticker produces no fabricated recommendations (strict non-inference).
 * 5. Empty recommendation results render safely for companies with zero network contacts.
 * 6. Professional relevance and accessibility remain strictly distinct.
 * 7. Profile selection opens the correct person with complete verification history.
 * 8. Existing Network service and query behavior remain completely unchanged.
 *
 * Run: node scripts/test_research_network.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize jiti to load TypeScript files directly
const jiti = require(path.join(rootDir, 'node_modules/jiti'))(path.join(rootDir, 'index.js'));

const networkData = jiti('./src/data/networkData.ts');
const networkService = jiti('./src/services/networkService.ts');
const networkQueryService = jiti('./src/services/networkQueryService.ts');
const researchData = jiti('./src/data/researchData.ts');

const { NETWORK_DATASET } = networkData;
const {
  buildNetworkGraph,
  getContactsForCompany,
  findIntroductionPaths,
} = networkService;
const { queryNetworkNaturalLanguage } = networkQueryService;
const { VERIFIED_RESEARCH_REGISTRY, LOCAL_VERIFIED_SYMBOL_REGISTRY } = researchData;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('\n=== FINN Step 6: Contextual Network Intelligence in Research Copilot Tests ===\n');

// Build shared graph
const graph = buildNetworkGraph(NETWORK_DATASET);

// -----------------------------------------------------------------------------
// 1. Reliance dossier resolves to correct ticker and retrieves expected contacts
// -----------------------------------------------------------------------------
console.log('1. Reliance Dossier Resolution & Expected Contacts:');
{
  const relianceDossier = VERIFIED_RESEARCH_REGISTRY['RELIANCE'];
  assert(relianceDossier !== undefined, 'Reliance curated dossier exists in registry');
  assert(relianceDossier.ticker === 'RELIANCE', 'Reliance dossier has canonical ticker RELIANCE');
  assert(relianceDossier.hasCuratedCoverage === true, 'Reliance dossier has curated coverage');

  const contacts = getContactsForCompany('RELIANCE', graph);
  assert(contacts.length >= 1, `Reliance has contextual contacts (found: ${contacts.length})`);

  const arunRec = contacts.find((c) => c.person.id === 'person-arun-sharma');
  assert(arunRec !== undefined, 'Top Reliance contact is Arun Sharma');
  assert(arunRec.person.name === 'Arun Sharma', 'Arun Sharma name is exact');
  assert(
    arunRec.person.currentOrganisation?.name === 'ValueBridge Capital Advisory',
    'Arun Sharma current organization is ValueBridge Capital Advisory'
  );
  assert(
    arunRec.person.currentRoleTitle === 'Senior Energy Transition Advisor',
    'Arun Sharma current role is Senior Energy Transition Advisor'
  );

  // Check relevance reasons citation of Reliance past role
  const relianceReason = arunRec.reasons.find((r) =>
    r.description.includes('Reliance Industries Limited') || r.description.includes('RELIANCE')
  );
  assert(relianceReason !== undefined, 'Arun Sharma has past role reason citing Reliance');
  assert(relianceReason.category === 'PAST_ROLE', 'Reason category is PAST_ROLE');
  assert(arunRec.relevanceScore === 55, 'Arun Sharma relevance score is 55 (past role + expertise)');
  assert(arunRec.accessibilityScore === 80, 'Arun Sharma accessibility score is 80 (strength 4 direct)');
  assert(arunRec.degree === 1, 'Arun Sharma is a 1st-degree direct connection');
  assert(arunRec.overallScore === 64, 'Overall match score is 64 (round(0.65 * 55 + 0.35 * 80) = 64)');
  assert(
    arunRec.scoreBreakdown.reconciliationSummary.includes('65%') &&
      arunRec.scoreBreakdown.reconciliationSummary.includes('35%'),
    'Score breakdown summary reflects 65/35 formula'
  );
  assert(arunRec.person.provenance === 'SYNTHETIC', 'Arun Sharma provenance is strictly SYNTHETIC');
}

// -----------------------------------------------------------------------------
// 2. TCS dossier retrieves its correct contextual recommendations
// -----------------------------------------------------------------------------
console.log('\n2. TCS Dossier Resolution & Contextual Recommendations:');
{
  const tcsDossier = VERIFIED_RESEARCH_REGISTRY['TCS'];
  assert(tcsDossier !== undefined, 'TCS curated dossier exists in registry');
  assert(tcsDossier.ticker === 'TCS', 'TCS dossier has canonical ticker TCS');

  const contacts = getContactsForCompany('TCS', graph);
  assert(contacts.length >= 2, `TCS has multiple contextual contacts (found: ${contacts.length})`);

  const topRec = contacts[0];
  assert(topRec.person.id === 'person-vikram-sen', 'Top TCS contact is Vikram Sen');
  assert(topRec.person.name === 'Vikram Sen', 'Vikram Sen name is exact');

  const vikramReason = topRec.reasons.find((r) =>
    r.description.includes('Tata Consultancy Services') || r.description.includes('TCS')
  );
  assert(vikramReason !== undefined, 'Vikram Sen has role reason citing TCS');
  assert(vikramReason.category === 'CURRENT_ROLE', 'Vikram Sen reason category is CURRENT_ROLE');
  assert(topRec.relevanceScore === 70, 'Vikram Sen relevance score is 70');
  assert(topRec.accessibilityScore === 100, 'Vikram Sen accessibility score is 100 (strength 5 direct)');
  assert(topRec.overallScore === 81, 'Vikram Sen overall score is 81 (round(0.65 * 70 + 0.35 * 100) = 81)');

  const secondaryRec = contacts.find((c) => c.person.id === 'person-radhika-iyer');
  assert(secondaryRec !== undefined, 'Secondary TCS contact is Radhika Iyer');
  assert(secondaryRec.person.name === 'Radhika Iyer', 'Radhika Iyer name is exact');
  assert(
    secondaryRec.reasons.some((r) => r.description.includes('Information Technology') || r.description.includes('IT')),
    'Radhika Iyer matches TCS through Information Technology peer leadership'
  );
}

// -----------------------------------------------------------------------------
// 3. Changing ticker dynamically changes recommendations
// -----------------------------------------------------------------------------
console.log('\n3. Dynamic Ticker Switching & Recommendation Differentiation:');
{
  const relianceContacts = getContactsForCompany('RELIANCE', graph);
  const tcsContacts = getContactsForCompany('TCS', graph);
  const hdfcContacts = getContactsForCompany('HDFCBANK', graph);
  const bhartiContacts = getContactsForCompany('BHARTIARTL', graph);

  assert(
    relianceContacts[0].person.id !== tcsContacts[0].person.id,
    'Reliance and TCS have distinct top recommendations'
  );
  assert(
    relianceContacts[0].person.name === 'Arun Sharma' && tcsContacts[0].person.name === 'Vikram Sen',
    'Reliance top is Arun Sharma, TCS top is Vikram Sen'
  );

  assert(hdfcContacts.length >= 2, `HDFCBANK has banking recommendations (found: ${hdfcContacts.length})`);
  assert(
    hdfcContacts.every((c) => c.person.name !== 'Arun Sharma'),
    'HDFCBANK recommendations do not contain energy advisor Arun Sharma'
  );

  const hdfcTop = hdfcContacts[0];
  assert(
    hdfcTop.reasons.some((r) => r.description.includes('HDFC') || r.description.includes('Financial Services')),
    'HDFCBANK top recommendation matches HDFC past tenure / Financial Services'
  );

  assert(bhartiContacts.length >= 1, 'BHARTIARTL returns telecommunications recommendations');
  assert(
    bhartiContacts[0].person.name === 'Siddharth Mehta',
    'BHARTIARTL top contact is Siddharth Mehta (Telecommunications VP)'
  );

  // Deterministic memoization / purity check: multiple calls yield identical results
  const secondCallReliance = getContactsForCompany('RELIANCE', graph);
  assert(
    secondCallReliance.length === relianceContacts.length &&
      secondCallReliance[0].person.id === relianceContacts[0].person.id &&
      secondCallReliance[0].overallScore === relianceContacts[0].overallScore,
    'Purity check: repeated calls for RELIANCE yield strictly identical results'
  );
}

// -----------------------------------------------------------------------------
// 4. Unsupported ticker produces no fabricated recommendations
// -----------------------------------------------------------------------------
console.log('\n4. Strict Non-Inference for Unsupported / Unknown Tickers:');
{
  const unindexed1 = getContactsForCompany('UNKNOWN_CORP', graph);
  assert(unindexed1.length === 0, 'Unsupported ticker UNKNOWN_CORP returns exactly 0 recommendations');

  const unindexed2 = getContactsForCompany('CGFSDYMGUJHVGF', graph);
  assert(unindexed2.length === 0, 'Unindexed ticker CGFSDYMGUJHVGF returns exactly 0 recommendations');

  const unindexed3 = getContactsForCompany('XYZ123', graph);
  assert(unindexed3.length === 0, 'Non-existent ticker XYZ123 returns exactly 0 recommendations');

  const emptyStr = getContactsForCompany('', graph);
  assert(emptyStr.length === 0, 'Empty string ticker returns 0 recommendations');

  const whitespaceStr = getContactsForCompany('   ', graph);
  assert(whitespaceStr.length === 0, 'Whitespace string ticker returns 0 recommendations');

  const nullVal = getContactsForCompany(null, graph);
  assert(nullVal.length === 0, 'Null ticker returns 0 recommendations');

  const undefinedVal = getContactsForCompany(undefined, graph);
  assert(undefinedVal.length === 0, 'Undefined ticker returns 0 recommendations');
}

// -----------------------------------------------------------------------------
// 5. Empty recommendation results render safely for companies with 0 contacts
// -----------------------------------------------------------------------------
console.log('\n5. Empty Recommendation Results & Edge State Safety:');
{
  // Tickers in LOCAL_VERIFIED_SYMBOL_REGISTRY that currently have 0 network contacts
  const asianPaintRecs = getContactsForCompany('ASIANPAINT', graph);
  assert(
    LOCAL_VERIFIED_SYMBOL_REGISTRY['ASIANPAINT'] !== undefined,
    'ASIANPAINT is in verified symbol registry'
  );
  assert(
    asianPaintRecs.length === 0,
    'ASIANPAINT returns empty array safely (0 synthetic contacts in network)'
  );

  const belRecs = getContactsForCompany('BEL', graph);
  assert(LOCAL_VERIFIED_SYMBOL_REGISTRY['BEL'] !== undefined, 'BEL is in verified symbol registry');
  assert(belRecs.length === 0, 'BEL returns empty array safely');

  const kotakRecs = getContactsForCompany('KOTAKBANK', graph);
  assert(
    LOCAL_VERIFIED_SYMBOL_REGISTRY['KOTAKBANK'] !== undefined,
    'KOTAKBANK is in verified symbol registry'
  );
  assert(kotakRecs.length === 0, 'KOTAKBANK returns empty array safely');

  // Verify empty graph safety
  const emptyGraph = {
    people: new Map(),
    edges: [],
    adjacency: new Map(),
    investorEdges: new Map(),
  };
  const emptyGraphRecs = getContactsForCompany('RELIANCE', emptyGraph);
  assert(Array.isArray(emptyGraphRecs) && emptyGraphRecs.length === 0, 'Empty graph returns empty array safely');
}

// -----------------------------------------------------------------------------
// 6. Professional relevance and accessibility remain distinct
// -----------------------------------------------------------------------------
console.log('\n6. Distinct Professional Relevance and Relationship Accessibility:');
{
  const testCompanies = ['RELIANCE', 'TCS', 'HDFCBANK', 'BHARTIARTL', 'ZOMATO', 'SWIGGY'];

  for (const ticker of testCompanies) {
    const recs = getContactsForCompany(ticker, graph);
    for (const rec of recs) {
      assert(
        rec.relevanceScore >= 0 && rec.relevanceScore <= 100,
        `${ticker} - ${rec.person.name}: relevanceScore ${rec.relevanceScore} bounded [0, 100]`
      );
      assert(
        rec.accessibilityScore >= 0 && rec.accessibilityScore <= 100,
        `${ticker} - ${rec.person.name}: accessibilityScore ${rec.accessibilityScore} bounded [0, 100]`
      );
      assert(
        rec.overallScore >= 0 && rec.overallScore <= 100,
        `${ticker} - ${rec.person.name}: overallScore ${rec.overallScore} bounded [0, 100]`
      );

      // Verify formula reconciliation: round(0.65 * relevance + 0.35 * accessibility)
      const expectedOverall = Math.round(0.65 * rec.relevanceScore + 0.35 * rec.accessibilityScore);
      assert(
        rec.overallScore === expectedOverall,
        `${ticker} - ${rec.person.name}: overall score ${rec.overallScore} equals 65/35 formula result ${expectedOverall}`
      );

      assert(
        rec.scoreBreakdown.rawRelevanceScore === rec.relevanceScore,
        `${ticker} - ${rec.person.name}: breakdown rawRelevance matches relevanceScore`
      );
      assert(
        rec.scoreBreakdown.rawAccessibilityScore === rec.accessibilityScore,
        `${ticker} - ${rec.person.name}: breakdown rawAccessibility matches accessibilityScore`
      );
      assert(
        rec.provenanceDisclaimer.includes('SYNTHETIC') || rec.provenanceDisclaimer.includes('Synthetic'),
        `${ticker} - ${rec.person.name}: provenance disclaimer contains synthetic notice`
      );
    }
  }
}

// -----------------------------------------------------------------------------
// 7. Profile selection opens correct person with complete history
// -----------------------------------------------------------------------------
console.log('\n7. Profile Selection & Detail Integrity:');
{
  const relianceRecs = getContactsForCompany('RELIANCE', graph);
  const selectedPerson = relianceRecs[0].person;

  assert(selectedPerson.id === 'person-arun-sharma', 'Selected person is Arun Sharma');
  assert(selectedPerson.name === 'Arun Sharma', 'Selected person name is Arun Sharma');
  assert(typeof selectedPerson.currentHeadline === 'string', 'Headline is valid string');
  assert(selectedPerson.currentHeadline.length > 0, 'Headline is non-empty');
  assert(selectedPerson.currentOrganisation !== undefined, 'Current organisation exists');
  assert(typeof selectedPerson.currentRoleTitle === 'string', 'Current role title is string');

  // Verify employment history integrity
  assert(
    Array.isArray(selectedPerson.employmentHistory) && selectedPerson.employmentHistory.length >= 2,
    `Arun Sharma has employment history (count: ${selectedPerson.employmentHistory.length})`
  );
  const currentEmp = selectedPerson.employmentHistory.find((e) => e.isCurrent);
  assert(currentEmp !== undefined, 'Arun Sharma has current employment record');
  assert(currentEmp.endDate === null, 'Current employment endDate is null');

  const pastEmp = selectedPerson.employmentHistory.find((e) => !e.isCurrent);
  assert(pastEmp !== undefined, 'Arun Sharma has past employment record');
  assert(pastEmp.endDate !== null, 'Past employment endDate is non-null');

  // Verify education history records
  assert(
    Array.isArray(selectedPerson.educationHistory) && selectedPerson.educationHistory.length >= 1,
    'Arun Sharma has educationHistory records'
  );

  // Verify expertise tags
  assert(
    Array.isArray(selectedPerson.expertise) && selectedPerson.expertise.length >= 1,
    'Arun Sharma has expertise tags'
  );

  // Verify relationship paths from INVESTOR_ROOT
  const paths = findIntroductionPaths(selectedPerson.id, graph);
  assert(paths.length >= 1, `Arun Sharma has valid introduction paths (count: ${paths.length})`);
  assert(paths[0].nodeIds[0] === 'INVESTOR_ROOT', 'Path begins with INVESTOR_ROOT');
  assert(
    paths[0].nodeIds[paths[0].nodeIds.length - 1] === selectedPerson.id,
    'Path ends with Arun Sharma ID'
  );
  assert(paths[0].degree === relianceRecs[0].degree, 'Path degree matches recommendation degree (1)');

  // Provenance flags
  assert(selectedPerson.provenance === 'SYNTHETIC', 'Person provenance is SYNTHETIC');
  assert(selectedPerson.isSynthetic === true, 'Person isSynthetic is true');
}

// -----------------------------------------------------------------------------
// 8. Existing Network service and query behaviour remain unchanged
// -----------------------------------------------------------------------------
console.log('\n8. Regression Safety for Existing Network Query & Service Behavior:');
{
  // Natural language company query
  const nlCompanyRes = queryNetworkNaturalLanguage('Who can help me understand Reliance?', graph);
  assert(nlCompanyRes.status === 'SUCCESS', 'Natural query for Reliance succeeds');
  assert(nlCompanyRes.query.intent === 'COMPANY', 'Intent is COMPANY');
  assert(nlCompanyRes.recommendations.length >= 1, 'Generates recommendations');
  assert(
    nlCompanyRes.recommendations[0].person.name === 'Arun Sharma',
    'Top natural recommendation is Arun Sharma'
  );

  // Natural language sector query
  const nlSectorRes = queryNetworkNaturalLanguage('Who has experience in the banking sector?', graph);
  assert(nlSectorRes.status === 'SUCCESS', 'Natural query for banking succeeds');
  assert(nlSectorRes.query.intent === 'SECTOR', 'Intent is SECTOR');
  assert(nlSectorRes.recommendations.length >= 2, 'Generates banking recommendations');

  // Natural language person connection query
  const nlConnRes = queryNetworkNaturalLanguage('Who can connect me to Vikram Sen?', graph);
  assert(nlConnRes.status === 'SUCCESS', 'Natural query for connection succeeds');
  assert(nlConnRes.query.intent === 'PERSON_CONNECTION', 'Intent is PERSON_CONNECTION');
  assert(
    nlConnRes.targetRecommendation?.person.name === 'Vikram Sen',
    'Target contact is Vikram Sen'
  );
  assert(
    nlConnRes.introductionFacilitators !== undefined && nlConnRes.introductionFacilitators.length === 2,
    'Vikram Sen has exactly 2 introduction facilitators'
  );

  // Graph immutability
  assert(Object.isFrozen(graph) || typeof graph.people.set === 'undefined', 'Graph collection maintains runtime protection');
}

console.log('\n========================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
