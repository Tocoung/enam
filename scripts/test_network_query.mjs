#!/usr/bin/env node
/**
 * Direct Unit Tests for FINN Natural-Language Network Intelligence Query Workflow.
 *
 * Verifies query interpretation, company/sector/expertise/org/person intent mapping,
 * unknown entity handling, person connection paths, and deterministic execution.
 *
 * Run: node scripts/test_network_query.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load TypeScript service via jiti
const jiti = require(path.join(rootDir, 'node_modules/jiti'))(path.join(rootDir, 'index.js'));
const networkData = jiti('./src/data/networkData.ts');
const networkService = jiti('./src/services/networkService.ts');
const networkQueryService = jiti('./src/services/networkQueryService.ts');

const { buildNetworkGraph } = networkService;
const {
  interpretNetworkQuery,
  executeNetworkQuery,
  queryNetworkNaturalLanguage,
  getContactsForOrganisationHistory,
} = networkQueryService;

const graph = buildNetworkGraph(networkData.NETWORK_DATASET);

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

console.log('=== FINN Natural-Language Network Query Unit Tests ===\n');

// 1. Company Query Interpretation
console.log('1. Company Query Interpretation:');

const q1 = interpretNetworkQuery('Who can help me understand Reliance?', graph);
assert(q1.intent === 'COMPANY', 'Maps "Who can help me understand Reliance?" to COMPANY');
assert(q1.ticker === 'RELIANCE', 'Resolves ticker to RELIANCE');
assert(q1.confidence === 'EXACT', 'Confidence is EXACT');
assert(q1.interpretationLabel.includes('RELIANCE'), 'Label includes RELIANCE');

const q1b = interpretNetworkQuery('Tell me about TCS', graph);
assert(q1b.intent === 'COMPANY', 'Maps "Tell me about TCS" to COMPANY');
assert(q1b.ticker === 'TCS', 'Resolves ticker to TCS');

const q1c = interpretNetworkQuery('Who covers HDFC Bank?', graph);
assert(q1c.intent === 'COMPANY', 'Maps "Who covers HDFC Bank?" to COMPANY');
assert(q1c.ticker === 'HDFCBANK', 'Resolves ticker to HDFCBANK');

const q1d = interpretNetworkQuery('Who understands Infosys?', graph);
assert(q1d.intent === 'COMPANY', 'Maps "Who understands Infosys?" to COMPANY');
assert(q1d.ticker === 'INFY', 'Resolves ticker to INFY');

const q1e = interpretNetworkQuery('Who can help me understand Company Reliance?', graph);
assert(q1e.intent === 'COMPANY', 'Maps "Who can help me understand Company Reliance?" to COMPANY');
assert(q1e.ticker === 'RELIANCE', 'Resolves "Company Reliance" ticker to RELIANCE');


// 2. Sector Query Interpretation
console.log('\n2. Sector Query Interpretation:');

const q2 = interpretNetworkQuery('Who has experience in the banking sector?', graph);
assert(q2.intent === 'SECTOR', 'Maps "Who has experience in the banking sector?" to SECTOR');
assert(q2.sector === 'Financial Services', 'Resolves sector to Financial Services');
assert(q2.confidence === 'EXACT', 'Confidence is EXACT');

const q2b = interpretNetworkQuery('Who understands the energy industry?', graph);
assert(q2b.intent === 'SECTOR', 'Maps "Who understands the energy industry?" to SECTOR');
assert(q2b.sector === 'Energy', 'Resolves sector to Energy');

const q2c = interpretNetworkQuery('Who knows about telecom?', graph);
assert(q2c.intent === 'SECTOR', 'Maps "Who knows about telecom?" to SECTOR');
assert(q2c.sector === 'Telecommunications', 'Resolves sector to Telecommunications');


// 3. Expertise Query Interpretation
console.log('\n3. Expertise Query Interpretation:');

const q3 = interpretNetworkQuery('Who understands refining margins?', graph);
assert(q3.intent === 'EXPERTISE', 'Maps "Who understands refining margins?" to EXPERTISE');
assert(q3.expertiseQuery === 'Refining Margins', 'Resolves expertise to Refining Margins');

const q3b = interpretNetworkQuery('Who knows about cloud migration?', graph);
assert(q3b.intent === 'EXPERTISE', 'Maps "Who knows about cloud migration?" to EXPERTISE');
assert(q3b.expertiseQuery === 'Cloud Migration', 'Resolves expertise to Cloud Migration');

const q3c = interpretNetworkQuery('Who has expertise in NPA provisioning?', graph);
assert(q3c.intent === 'EXPERTISE', 'Maps "Who has expertise in NPA provisioning?" to EXPERTISE');
assert(q3c.expertiseQuery === 'NPA Provisioning', 'Resolves expertise to NPA Provisioning');

const q3d = interpretNetworkQuery('Who understands crack spreads?', graph);
assert(q3d.intent === 'EXPERTISE', 'Maps "Who understands crack spreads?" to EXPERTISE (alias for Refining Margins)');
assert(q3d.expertiseQuery === 'Refining Margins', 'Resolves crack spreads alias');


// 4. Organisation History Query Interpretation
console.log('\n4. Organisation History Query Interpretation:');

const q4 = interpretNetworkQuery('Who has worked at TCS?', graph);
assert(q4.intent === 'ORGANISATION_HISTORY', 'Maps "Who has worked at TCS?" to ORGANISATION_HISTORY');
assert(q4.ticker === 'TCS', 'Resolves organisation ticker to TCS');

const q4b = interpretNetworkQuery('Who worked at McKinsey?', graph);
assert(q4b.intent === 'ORGANISATION_HISTORY', 'Maps "Who worked at McKinsey?" to ORGANISATION_HISTORY');
assert(q4b.orgId === 'org-mckinsey-india', 'Resolves McKinsey orgId');

const q4c = interpretNetworkQuery('Who has worked at Bain?', graph);
assert(q4c.intent === 'ORGANISATION_HISTORY', 'Maps "Who has worked at Bain?" to ORGANISATION_HISTORY');
assert(q4c.orgId === 'org-bain-india', 'Resolves Bain orgId');

const q4d = interpretNetworkQuery('Who previously worked at SEBI?', graph);
assert(q4d.intent === 'ORGANISATION_HISTORY', 'Maps "Who previously worked at SEBI?" to ORGANISATION_HISTORY');
assert(q4d.orgId === 'org-sebi', 'Resolves SEBI orgId');


// 5. Person Connection Query Interpretation
console.log('\n5. Person Connection Query Interpretation:');

const q5 = interpretNetworkQuery('Who can connect me to Vikram Sen?', graph);
assert(q5.intent === 'PERSON_CONNECTION', 'Maps "Who can connect me to Vikram Sen?" to PERSON_CONNECTION');
assert(q5.personName === 'Vikram Sen', 'Resolves personName to Vikram Sen');
assert(q5.targetPerson !== undefined, 'Target person object is found');
assert(q5.confidence === 'EXACT', 'Confidence is EXACT');

const q5b = interpretNetworkQuery('How can I reach Arun Sharma?', graph);
assert(q5b.intent === 'PERSON_CONNECTION', 'Maps "How can I reach Arun Sharma?" to PERSON_CONNECTION');
assert(q5b.personName === 'Arun Sharma', 'Resolves personName to Arun Sharma');

const q5c = interpretNetworkQuery('Who can connect me to Dr. Deepa Menon?', graph);
assert(q5c.intent === 'PERSON_CONNECTION', 'Maps "Who can connect me to Dr. Deepa Menon?" to PERSON_CONNECTION');
assert(q5c.targetPerson.id === 'person-deepa-menon', 'Resolves Dr. Deepa Menon ID');

const q5d = interpretNetworkQuery('Who can connect me to the new MD of Reliance?', graph);
assert(q5d.intent === 'COMPANY', 'Maps "Who can connect me to the new MD of Reliance?" to COMPANY');
assert(q5d.ticker === 'RELIANCE', 'Resolves ticker to RELIANCE');

const q5e = interpretNetworkQuery('Who can connect me to the new MD of Company Reliance?', graph);
assert(q5e.intent === 'COMPANY', 'Maps "Who can connect me to the new MD of Company Reliance?" to COMPANY');
assert(q5e.ticker === 'RELIANCE', 'Resolves "Company Reliance" ticker to RELIANCE');

const res5e = executeNetworkQuery(q5e, graph);
assert(res5e.status === 'SUCCESS', 'Execution succeeds for "Who can connect me to the new MD of Company Reliance?"');
assert(res5e.recommendations.length > 0, 'Returns recommendations for Reliance contacts');
assert(res5e.recommendations[0].person.id === 'person-arun-sharma', 'Top recommendation is Arun Sharma');

const q5f = interpretNetworkQuery('Who can connect me to the CEO of TCS?', graph);
assert(q5f.intent === 'COMPANY', 'Maps "Who can connect me to the CEO of TCS?" to COMPANY');
assert(q5f.ticker === 'TCS', 'Resolves CEO query to TCS');


// 6. Unknown Entity & Non-Inference Handling
console.log('\n6. Unknown Entity & Non-Inference Handling:');

// Unknown Person / Target
const q6a = interpretNetworkQuery('Who can connect me to the new MD of Company X?', graph);
assert(q6a.intent === 'PERSON_CONNECTION', 'Classifies as PERSON_CONNECTION');
assert(q6a.targetPerson === undefined, 'Does not fabricate a person object');
assert(q6a.confidence === 'UNRESOLVED', 'Confidence is UNRESOLVED');
assert(q6a.interpretationLabel.includes('Unknown Persona'), 'Label flags unknown persona');

const res6a = executeNetworkQuery(q6a, graph);
assert(res6a.status === 'UNKNOWN_ENTITY', 'Execution status is UNKNOWN_ENTITY');
assert(res6a.recommendations.length === 0, 'Returns zero recommendations for unknown person');
assert(res6a.personConnectionPaths.length === 0, 'Returns zero connection paths');
assert(res6a.statusMessage.includes('Company X'), 'Status message explains Company X was not found');

// Unknown Company
const q6b = interpretNetworkQuery('Who can help me understand Company X?', graph);
assert(q6b.intent === 'UNKNOWN', 'Maps unknown company to UNKNOWN intent');
assert(q6b.confidence === 'UNRESOLVED', 'Confidence is UNRESOLVED');

const res6b = executeNetworkQuery(q6b, graph);
assert(res6b.status === 'UNKNOWN_ENTITY', 'Execution status is UNKNOWN_ENTITY');
assert(res6b.recommendations.length === 0, 'Zero recommendations for unindexed company');

// Unknown Organisation
const q6c = interpretNetworkQuery('Who has worked at Google?', graph);
assert(q6c.intent === 'UNKNOWN', 'Maps unindexed organisation Google to UNKNOWN');
assert(q6c.confidence === 'UNRESOLVED', 'Confidence is UNRESOLVED');

// Empty and whitespace queries
const qEmpty = interpretNetworkQuery('', graph);
assert(qEmpty.intent === 'UNKNOWN', 'Empty query returns UNKNOWN');
const resEmpty = executeNetworkQuery(qEmpty, graph);
assert(resEmpty.status === 'AMBIGUOUS' || resEmpty.status === 'UNKNOWN_ENTITY', 'Empty query handled safely');

const qWhitespace = interpretNetworkQuery('   ', graph);
assert(qWhitespace.intent === 'UNKNOWN', 'Whitespace query returns UNKNOWN');

// Ambiguous query
const qAmbig = interpretNetworkQuery('Tell me something about investing', graph);
assert(qAmbig.intent === 'UNKNOWN', 'Ambiguous query returns UNKNOWN');
assert(qAmbig.confidence === 'AMBIGUOUS', 'Confidence is AMBIGUOUS');


// 7. Query Execution Pipeline & Deterministic Ranking
console.log('\n7. Query Execution Pipeline & Deterministic Ranking:');

// Company: Reliance
const execReliance = queryNetworkNaturalLanguage('Who can help me understand Reliance?', graph);
assert(execReliance.status === 'SUCCESS', 'Reliance execution succeeds');
assert(execReliance.recommendations.length > 0, 'Returns recommendations for Reliance');
assert(execReliance.recommendations[0].person.name === 'Arun Sharma', 'Top recommendation for Reliance is Arun Sharma (former VP Refining)');
assert(execReliance.recommendations[0].degree === 1, 'Arun Sharma is 1st degree');
assert(execReliance.recommendations[0].relevanceScore >= 50, 'Arun Sharma has positive relevance for Reliance');
assert(execReliance.recommendations[0].scoreBreakdown.overallScore > 0, 'Score breakdown has overallScore');
assert(execReliance.recommendations[0].reasons.length >= 2, 'Has at least 2 explainable reasons');

// Sector: Banking
const execBanking = queryNetworkNaturalLanguage('Who has experience in the banking sector?', graph);
assert(execBanking.status === 'SUCCESS', 'Banking sector execution succeeds');
assert(execBanking.recommendations.length > 0, 'Returns recommendations for Banking');
const bankingPeople = execBanking.recommendations.map(r => r.person.name);
assert(bankingPeople.includes('Rohit Gupta'), 'Includes Rohit Gupta (Bajaj Finance)');
assert(bankingPeople.includes('Ananya Deshmukh'), 'Includes Ananya Deshmukh (ICICI Bank)');

// Expertise: Refining Margins
const execRefining = queryNetworkNaturalLanguage('Who understands refining margins?', graph);
assert(execRefining.status === 'SUCCESS', 'Refining margins execution succeeds');
assert(execRefining.recommendations[0].person.name === 'Arun Sharma', 'Top recommendation for refining margins is Arun Sharma');

// Organisation History: TCS
const execTcs = queryNetworkNaturalLanguage('Who has worked at TCS?', graph);
assert(execTcs.status === 'SUCCESS', 'TCS organisation history succeeds');
assert(execTcs.recommendations.length === 1, 'Exactly 1 contact worked at TCS');
assert(execTcs.recommendations[0].person.name === 'Vikram Sen', 'Vikram Sen worked at TCS');
assert(execTcs.recommendations[0].relevanceScore === 100, 'Current role at TCS gives 100 relevance');

// Organisation History: McKinsey
const execMckinsey = queryNetworkNaturalLanguage('Who worked at McKinsey?', graph);
assert(execMckinsey.status === 'SUCCESS', 'McKinsey history succeeds');
assert(execMckinsey.recommendations.length === 1, 'Exactly 1 contact worked at McKinsey');
assert(execMckinsey.recommendations[0].person.name === 'Amit Tandon', 'Amit Tandon worked at McKinsey');

// Person Connection: Vikram Sen
const execVikram = queryNetworkNaturalLanguage('Who can connect me to Vikram Sen?', graph);
assert(execVikram.status === 'SUCCESS', 'Vikram Sen connection query succeeds');
assert(execVikram.personConnectionPaths.length > 0, 'Returns introduction paths to Vikram Sen');
assert(execVikram.recommendations.length > 0, 'Returns target recommendation');
assert(execVikram.recommendations[0].person.name === 'Vikram Sen', 'Primary recommendation is target person');

// Verify direct helper getContactsForOrganisationHistory
const orgHistBain = getContactsForOrganisationHistory('bain', graph);
assert(orgHistBain.length === 1, 'getContactsForOrganisationHistory finds Bain');
assert(orgHistBain[0].person.name === 'Karan Mehta', 'Karan Mehta worked at Bain');

const orgHistTcs = getContactsForOrganisationHistory('TCS', graph);
assert(orgHistTcs.length === 1, 'getContactsForOrganisationHistory finds TCS');
assert(orgHistTcs[0].person.name === 'Vikram Sen', 'Vikram Sen worked at TCS');
assert(orgHistTcs[0].relevanceScore === 100, 'TCS current role scores 100 relevance');

const orgHistMck = getContactsForOrganisationHistory('org-mckinsey-india', graph);
assert(orgHistMck.length === 1, 'getContactsForOrganisationHistory finds McKinsey by orgId');
assert(orgHistMck[0].person.name === 'Amit Tandon', 'Amit Tandon worked at McKinsey');

const orgHistSebi = getContactsForOrganisationHistory('sebi', graph);
assert(orgHistSebi.length === 1, 'getContactsForOrganisationHistory finds SEBI');
assert(orgHistSebi[0].person.name === 'Kavita Iyer', 'Kavita Iyer worked at SEBI');
assert(orgHistSebi[0].relevanceScore === 80, 'SEBI past role scores 80 relevance');

// Negative tests for strict organisation-history matching (no substring false positives)
const negativeOrgTests = ['India', 'Bank', 'Tata', 'Ventures', 'Securities', 'Advisory', 'Consultancy', 'Company'];
for (const badTerm of negativeOrgTests) {
  const badMatches = getContactsForOrganisationHistory(badTerm, graph);
  assert(badMatches.length === 0, `No false positive matches for partial organisation name "${badTerm}"`);
}

// Separate Introduction Facilitator Semantics in PERSON_CONNECTION
console.log('\n7b. Introduction Facilitators Semantics (PERSON_CONNECTION):');

// 1. Direct target person with NO second-degree facilitator (Arun Sharma)
const execDirectTarget = queryNetworkNaturalLanguage('Who can connect me to Arun Sharma?', graph);
assert(execDirectTarget.status === 'SUCCESS', 'Arun Sharma connection query succeeds');
assert(execDirectTarget.recommendations.length === 1, 'Target persona is solely in recommendations');
assert(execDirectTarget.recommendations[0].person.name === 'Arun Sharma', 'Target persona is Arun Sharma');
assert(execDirectTarget.targetRecommendation?.person.name === 'Arun Sharma', 'targetRecommendation holds Arun Sharma');
assert(execDirectTarget.introductionFacilitators?.length === 0, 'No facilitators when only direct 1st-degree tie exists');

// 2. Target person with ONE intermediary (Rohit Gupta via Ananya Deshmukh)
const execOneFacilitator = queryNetworkNaturalLanguage('Who can connect me to Rohit Gupta?', graph);
assert(execOneFacilitator.status === 'SUCCESS', 'Rohit Gupta connection query succeeds');
assert(execOneFacilitator.recommendations.length === 1, 'Target persona is solely in recommendations (Rohit Gupta)');
assert(execOneFacilitator.recommendations[0].person.name === 'Rohit Gupta', 'Target recommendation is Rohit Gupta');
assert(execOneFacilitator.introductionFacilitators?.length === 1, 'Exactly 1 intermediary facilitator for Rohit Gupta');
assert(execOneFacilitator.introductionFacilitators[0].person.name === 'Ananya Deshmukh', 'Facilitator is Ananya Deshmukh');
assert(execOneFacilitator.introductionFacilitators[0].targetPerson.name === 'Rohit Gupta', 'Facilitator targets Rohit Gupta');
assert(execOneFacilitator.introductionFacilitators[0].roleBadge === 'Introduction Facilitator', 'Role badge is Introduction Facilitator');

// 3. Target person with MULTIPLE distinct intermediaries (Vikram Sen via Amit Tandon & Radhika Iyer)
const execMultiFacilitator = queryNetworkNaturalLanguage('Who can connect me to Vikram Sen?', graph);
assert(execMultiFacilitator.status === 'SUCCESS', 'Vikram Sen connection query succeeds');
assert(execMultiFacilitator.recommendations.length === 1, 'Target persona is solely in recommendations (Vikram Sen)');
assert(execMultiFacilitator.recommendations[0].person.name === 'Vikram Sen', 'Target recommendation is Vikram Sen');
assert(execMultiFacilitator.introductionFacilitators?.length === 2, 'Exactly 2 distinct intermediary facilitators for Vikram Sen');
const facNames = execMultiFacilitator.introductionFacilitators.map(f => f.person.name);
assert(facNames.includes('Amit Tandon') && facNames.includes('Radhika Iyer'), 'Facilitators are Amit Tandon and Radhika Iyer');

// 4. No duplicate facilitator IDs
const facIds = execMultiFacilitator.introductionFacilitators.map(f => f.person.id);
assert(new Set(facIds).size === facIds.length, 'No duplicate facilitator IDs');

// 5. Facilitator reason identifies the actual path
const fac0 = execMultiFacilitator.introductionFacilitators[0];
assert(fac0.facilitatedPathSummary.includes('INVESTOR_ROOT ->') && fac0.facilitatedPathSummary.includes('Vikram Sen'), 'facilitatedPathSummary identifies full referral path');
assert(fac0.reasons[0].supportingEvidence.includes('Facilitates referral path:'), 'Supporting evidence identifies referral path');

// 6. Facilitator is NOT represented as a professional expert merely because of graph edge
for (const fac of execMultiFacilitator.introductionFacilitators) {
  assert(fac.reasons.every(r => r.category === 'RELATIONSHIP_PATH'), `Facilitator ${fac.person.name} has strictly RELATIONSHIP_PATH reasons`);
  assert(!fac.reasons.some(r => r.category === 'CURRENT_ROLE' || r.category === 'PAST_ROLE' || r.category === 'EXPERTISE'), `Facilitator ${fac.person.name} is not represented as domain/professional expert`);
  assert(fac.rankingScore === fac.accessibilityScore, `Ranking score is path-accessibility heuristic (${fac.accessibilityScore})`);
  assert(fac.explanation.includes('not domain expertise'), `Explanation explicitly disclaims domain expertise for ${fac.person.name}`);
}

// 7. Target and facilitator results remain distinguishable
const recIds = execMultiFacilitator.recommendations.map(r => r.person.id);
const hasIntersection = facIds.some(id => recIds.includes(id));
assert(!hasIntersection, 'Target persona and facilitators have zero ID intersection and remain completely distinguishable');

// 8. Non-Inference & Adversarial Unknown Persona Checks
console.log('\n8. Non-Inference & Adversarial Unknown Persona Checks:');

const qAdversarial1 = interpretNetworkQuery('Who can connect me to Sundar Pichai?', graph);
assert(qAdversarial1.intent === 'PERSON_CONNECTION', 'Classifies as PERSON_CONNECTION');
assert(qAdversarial1.targetPerson === undefined, 'No synthetic person match for Sundar Pichai');
assert(qAdversarial1.confidence === 'UNRESOLVED', 'Confidence is UNRESOLVED');

const resAdv1 = executeNetworkQuery(qAdversarial1, graph);
assert(resAdv1.status === 'UNKNOWN_ENTITY', 'Returns UNKNOWN_ENTITY for unindexed living executive');
assert(resAdv1.recommendations.length === 0, 'Zero recommendations generated');
assert(resAdv1.personConnectionPaths.length === 0, 'Zero paths generated');
assert(!resAdv1.statusMessage.includes('IIT'), 'Does not infer relationship via education');

const qAdversarial2 = interpretNetworkQuery('Who can connect me to N. Chandrasekaran?', graph);
assert(qAdversarial2.targetPerson === undefined, 'No synthetic person match for N. Chandrasekaran');
const resAdv2 = executeNetworkQuery(qAdversarial2, graph);
assert(resAdv2.status === 'UNKNOWN_ENTITY', 'Returns UNKNOWN_ENTITY for unknown executive');
assert(resAdv2.recommendations.length === 0, 'No false co-tenure connection created');


// 9. Mathematical Reconciliation of Query Results
console.log('\n9. Mathematical Reconciliation of Query Results:');

const testQueries = [
  'Who can help me understand Reliance?',
  'Who has experience in the banking sector?',
  'Who understands refining margins?',
  'Who has worked at TCS?',
  'Who worked at McKinsey?',
  'Who can connect me to Vikram Sen?',
];

for (const q of testQueries) {
  const res = queryNetworkNaturalLanguage(q, graph);
  for (const rec of res.recommendations) {
    const sb = rec.scoreBreakdown;
    const reconciled =
      sb.weightedRelevanceContribution +
      sb.weightedAccessibilityContribution +
      sb.roundingAdjustment;
    assert(
      reconciled === rec.overallScore,
      `Score breakdown reconciles for ${rec.person.name} in query "${q}"`
    );
    assert(
      rec.overallScore >= 0 && rec.overallScore <= 100,
      `Overall score is bounded [0, 100] for ${rec.person.name}`
    );
  }
}

console.log('\n========================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
