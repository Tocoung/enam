import {
  NetworkDataset,
  NetworkGraph,
  Person,
  NetworkEdge,
  IntroductionPath,
  ContactRecommendation,
  RecommendationReason,
  NetworkQuery,
  ConnectionStrength,
  SYNTHETIC_DATASET_DISCLAIMER,
  OrganisationRef,
} from '../types/network';
import { validateNetworkDataset } from '../data/networkData';
import { LOCAL_VERIFIED_SYMBOL_REGISTRY } from '../data/researchData';
import { PORTFOLIO_RAW_DATA } from '../data/portfolioData';

/**
 * FINN Network Intelligence Service.
 *
 * Implements pure deterministic graph construction, directed/undirected pathfinding
 * capped at degree 2, explainable relevance scoring, and contact ranking.
 *
 * Architecture Principles:
 * 1. Immutability: Input datasets are never mutated.
 * 2. Strict Directionality: Direct investor edges are outward directed from INVESTOR_ROOT.
 *    Person-to-person edges are undirected and symmetric.
 * 3. Explainability: Every positive score component generates a human-readable RecommendationReason.
 * 4. Separation of Concerns: Professional relevance and relationship accessibility are computed
 *    independently. Candidates with zero professional relevance are never recommended.
 * 5. Deterministic Ranking: Strict tie-breaking guarantees reproducible ordering across runs.
 * 6. Synthetic Provenance: All results carry the prototype synthetic dataset disclaimer.
 */

// Scoring weight configuration
export const SCORING_WEIGHTS = {
  RELEVANCE_WEIGHT: 0.65,
  ACCESSIBILITY_WEIGHT: 0.35,
  SECOND_HOP_PENALTY: 15,
  MAX_HOPS: 2,
} as const;

// Proficiency multipliers for expertise weighting
export const PROFICIENCY_MULTIPLIERS = {
  DEEP_OPERATIONAL_EXPERT: 1.0,
  EXECUTIVE_OVERSIGHT: 0.85,
  PRACTITIONER: 0.7,
} as const;

/**
 * Constructs an in-memory indexed NetworkGraph from a validated NetworkDataset.
 * Throws an explicit Error if the dataset fails validation.
 *
 * Invariants:
 * - Direct investor edges (sourceNodeId === 'INVESTOR_ROOT') are directed from INVESTOR_ROOT.
 * - Person-to-person edges (sourceNodeId !== 'INVESTOR_ROOT') are undirected and added symmetrically.
 * - Input dataset remains untouched and unmutated.
 */
export function buildNetworkGraph(dataset: NetworkDataset): NetworkGraph {
  const validation = validateNetworkDataset(dataset);
  if (!validation.isValid) {
    throw new Error(
      `Cannot construct NetworkGraph from invalid dataset: ${validation.failures.join('; ')}`
    );
  }

  const peopleMap = new Map<string, Person>();
  for (const person of dataset.people) {
    peopleMap.set(person.id, Object.freeze({ ...person }));
  }

  const adjacencyMap = new Map<string, NetworkEdge[]>();
  adjacencyMap.set(dataset.rootInvestorId, []);
  for (const person of dataset.people) {
    adjacencyMap.set(person.id, []);
  }

  for (const edge of dataset.edges) {
    const frozenEdge = Object.freeze({ ...edge });
    if (edge.sourceNodeId === dataset.rootInvestorId) {
      // Investor edge: strictly directed from INVESTOR_ROOT only
      adjacencyMap.get(dataset.rootInvestorId)!.push(frozenEdge);
    } else {
      // Person-to-person edge: strictly undirected, traversable from both endpoints
      adjacencyMap.get(edge.sourceNodeId)!.push(frozenEdge);
      adjacencyMap.get(edge.targetNodeId)!.push(frozenEdge);
    }
  }

  const readonlyAdjacency = new Map<string, readonly NetworkEdge[]>();
  for (const [key, edges] of adjacencyMap.entries()) {
    readonlyAdjacency.set(key, Object.freeze([...edges]));
  }

  return Object.freeze({
    rootInvestorId: dataset.rootInvestorId,
    people: peopleMap,
    adjacency: readonlyAdjacency,
    totalNodes: dataset.people.length + 1,
    totalEdges: dataset.edges.length,
  });
}

/**
 * Calculates relationship accessibility score (0 to 100) for a given introduction path.
 *
 * Formula:
 * - Direct connection (hopCount: 1): connection strength (1-5) * 20 (range: 20 to 100)
 * - Second-degree connection (hopCount: 2): weakest connection strength along the path * 20
 *   minus SECOND_HOP_PENALTY (15 points) (range: 5 to 85).
 *
 * Grounding rationale:
 * The weakest link on a path bounds the accessibility of the introduction. Each additional hop
 * increases social friction, modelled here as a fixed 15-point penalty.
 */
export function calculatePathAccessibility(
  pathStrength: ConnectionStrength,
  hopCount: number
): number {
  const penalty = (hopCount - 1) * SCORING_WEIGHTS.SECOND_HOP_PENALTY;
  const rawScore = pathStrength * 20 - penalty;
  return Math.max(0, Math.min(100, rawScore));
}

/**
 * Finds all valid introduction paths from INVESTOR_ROOT to targetPersonId capped at 2 hops.
 *
 * Path constraints:
 * - Traversal depth is strictly capped at 2 edges.
 * - No repeated nodes (no cycles or self-referential paths).
 * - Investor edges are directed and cannot be traversed in reverse.
 * - Person-to-person edges are undirected and traversable in either direction.
 *
 * Returns paths in deterministic sorted order:
 * 1. Hop count ascending (degree 1 before degree 2)
 * 2. Accessibility score descending
 * 3. Intermediary person ID ascending (lexicographical)
 * 4. Edge IDs ascending
 */
export function findIntroductionPaths(
  targetPersonId: string,
  graph: NetworkGraph
): IntroductionPath[] {
  const targetPerson = graph.people.get(targetPersonId);
  if (!targetPerson) {
    return [];
  }

  const paths: IntroductionPath[] = [];

  // 1. Direct 1-hop path from INVESTOR_ROOT
  const rootEdges = graph.adjacency.get(graph.rootInvestorId) || [];
  for (const edge of rootEdges) {
    if (edge.targetNodeId === targetPersonId) {
      const pathStrength = edge.connectionStrength;
      const accessibilityScore = calculatePathAccessibility(pathStrength, 1);
      paths.push({
        degree: 1,
        nodeIds: [graph.rootInvestorId, targetPersonId],
        edges: [edge],
        hopCount: 1,
        pathStrength,
        accessibilityScore,
        explanation: `Direct relationship from ${graph.rootInvestorId} (${edge.relationshipType}, strength ${edge.connectionStrength}/5)`,
      });
    }
  }

  // 2. Second-degree paths (INVESTOR_ROOT -> Intermediary -> Target)
  for (const edge1 of rootEdges) {
    const intermediaryId = edge1.targetNodeId;
    // Skip if intermediary is the target itself (already handled as 1-hop direct path)
    if (intermediaryId === targetPersonId) {
      continue;
    }

    const intermediaryPerson = graph.people.get(intermediaryId);
    if (!intermediaryPerson) {
      continue;
    }

    const intermediaryEdges = graph.adjacency.get(intermediaryId) || [];
    for (const edge2 of intermediaryEdges) {
      // Must not be an investor edge
      if (
        edge2.sourceNodeId === graph.rootInvestorId ||
        edge2.targetNodeId === graph.rootInvestorId
      ) {
        continue;
      }

      // Check whether edge2 connects intermediaryId and targetPersonId symmetrically
      const connects =
        (edge2.sourceNodeId === intermediaryId && edge2.targetNodeId === targetPersonId) ||
        (edge2.targetNodeId === intermediaryId && edge2.sourceNodeId === targetPersonId);

      if (connects) {
        const pathStrength = Math.min(
          edge1.connectionStrength,
          edge2.connectionStrength
        ) as ConnectionStrength;
        const accessibilityScore = calculatePathAccessibility(pathStrength, 2);
        paths.push({
          degree: 2,
          nodeIds: [graph.rootInvestorId, intermediaryId, targetPersonId],
          edges: [edge1, edge2],
          intermediary: intermediaryPerson,
          hopCount: 2,
          pathStrength,
          accessibilityScore,
          explanation: `2-degree introduction via ${intermediaryPerson.name} (${edge1.relationshipType} -> ${edge2.relationshipType}, path strength ${pathStrength}/5)`,
        });
      }
    }
  }

  // Deterministic sorting
  paths.sort((a, b) => {
    if (a.hopCount !== b.hopCount) {
      return a.hopCount - b.hopCount;
    }
    if (b.accessibilityScore !== a.accessibilityScore) {
      return b.accessibilityScore - a.accessibilityScore;
    }
    const intA = a.intermediary?.id ?? '';
    const intB = b.intermediary?.id ?? '';
    if (intA !== intB) {
      return intA.localeCompare(intB);
    }
    const edgeIdA = a.edges.map((e) => e.id).join(';');
    const edgeIdB = b.edges.map((e) => e.id).join(';');
    return edgeIdA.localeCompare(edgeIdB);
  });

  return paths;
}

/**
 * Resolves the primary sector for a listed equity ticker.
 * Grounded in:
 * 1. Listed employment records in the network graph.
 * 2. PORTFOLIO_RAW_DATA definitions.
 */
export function resolveTickerSector(ticker: string, graph?: NetworkGraph): string | undefined {
  const normTicker = ticker.trim().toUpperCase();

  // Check graph personas for an explicit listed organisation ref with sector
  if (graph) {
    for (const person of graph.people.values()) {
      for (const emp of person.employmentHistory) {
        if (
          emp.organisation.type === 'LISTED_NSE_BSE' &&
          emp.organisation.ticker === normTicker &&
          emp.organisation.sector
        ) {
          return emp.organisation.sector;
        }
      }
    }
  }

  // Fallback to portfolio registry
  const portfolioStock = PORTFOLIO_RAW_DATA.find((s) => s.ticker === normTicker);
  if (portfolioStock?.sector) {
    return portfolioStock.sector;
  }

  return undefined;
}

/**
 * Safely extracts sector string from an OrganisationRef if present.
 */
export function getOrganisationSector(org: OrganisationRef): string | undefined {
  if ('sector' in org && typeof org.sector === 'string') {
    return org.sector;
  }
  return undefined;
}

/**
 * Checks whether two sector strings are compatible/matching,
 * accounting for synonyms in financial reporting (e.g. IT vs Information Technology).
 */
export function isSectorMatch(sectorA: string, sectorB: string): boolean {
  const sA = sectorA.toLowerCase().trim();
  const sB = sectorB.toLowerCase().trim();
  if (sA === sB) return true;

  // Multi-word substring inclusion (only for terms longer than 3 characters to avoid false matches like "it" in "credit")
  if (sA.length > 3 && sB.length > 3) {
    if (sA.includes(sB) || sB.includes(sA)) return true;
  }

  const isIT = (s: string) =>
    /\b(it|information technology|it services|software)\b/i.test(s);
  if (isIT(sA) && isIT(sB)) return true;

  const isBank = (s: string) =>
    /\b(bank|banking|financial|financials|financial services|nbfc)\b/i.test(s);
  if (isBank(sA) && isBank(sB)) return true;

  const isHealth = (s: string) =>
    /\b(health|healthcare|pharma|pharmaceutical|pharmaceuticals)\b/i.test(s);
  if (isHealth(sA) && isHealth(sB)) return true;

  const isTelecom = (s: string) =>
    /\b(telecom|telecommunication|telecommunications)\b/i.test(s);
  if (isTelecom(sA) && isTelecom(sB)) return true;

  const isConsumer = (s: string) =>
    /\b(consumer|consumer services|consumer staples|consumer discretionary|retail)\b/i.test(s);
  if (isConsumer(sA) && isConsumer(sB)) return true;

  const isEnergy = (s: string) =>
    /\b(energy|petrochemical|petrochemicals|refining|oil & gas)\b/i.test(s);
  if (isEnergy(sA) && isEnergy(sB)) return true;

  const isAuto = (s: string) =>
    /\b(auto|automobile|automotive|vehicles)\b/i.test(s);
  if (isAuto(sA) && isAuto(sB)) return true;

  return false;
}

/**
 * Calculates professional relevance score and reasons for a COMPANY ticker query.
 *
 * Potential signals:
 * - Current employment at the requested company (+60 points, CURRENT_ROLE)
 * - Previous employment at the requested company (+35 points, PAST_ROLE)
 * - Employment at a peer company in the same sector (+20 points current / +10 points past, PEER_ROLE)
 * - Explicit expertise matching company sector/domain (+15 points exact / +10 points partial * proficiency)
 *
 * Bounded between 0 and 100.
 */
export function calculateCompanyRelevance(
  person: Person,
  rawTicker: string,
  graph: NetworkGraph
): { relevanceScore: number; reasons: RecommendationReason[] } {
  const ticker = rawTicker.trim().toUpperCase();
  const reasons: RecommendationReason[] = [];
  let score = 0;

  const companyMeta = LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker];
  const targetSector = resolveTickerSector(ticker, graph);

  // 1. Direct employment records at target company
  for (const emp of person.employmentHistory) {
    if (emp.organisation.type === 'LISTED_NSE_BSE' && emp.organisation.ticker === ticker) {
      if (emp.isCurrent) {
        const contribution = 60;
        score += contribution;
        reasons.push({
          category: 'CURRENT_ROLE',
          description: `Currently serves as ${emp.roleTitle} at ${emp.organisation.name} (${ticker})`,
          scoreContribution: contribution,
          supportingEvidence: `Current role since ${emp.startDate}. Responsibilities: ${emp.responsibilities.slice(0, 2).join('; ')}`,
        });
      } else {
        const contribution = 35;
        score += contribution;
        reasons.push({
          category: 'PAST_ROLE',
          description: `Previously served as ${emp.roleTitle} at ${emp.organisation.name} (${ticker})`,
          scoreContribution: contribution,
          supportingEvidence: `Tenure: ${emp.startDate} to ${emp.endDate}. Responsibilities: ${emp.responsibilities.slice(0, 2).join('; ')}`,
        });
      }
    }
  }

  // 2. Peer organisation employment in the same sector
  if (targetSector) {
    for (const emp of person.employmentHistory) {
      const isSameCompany =
        emp.organisation.type === 'LISTED_NSE_BSE' && emp.organisation.ticker === ticker;
      if (isSameCompany) continue;

      const empSector = getOrganisationSector(emp.organisation);
      if (empSector && isSectorMatch(empSector, targetSector)) {
        if (emp.isCurrent) {
          const contribution = 20;
          score += contribution;
          reasons.push({
            category: 'PEER_ROLE',
            description: `Currently holds peer role as ${emp.roleTitle} at ${emp.organisation.name} in matching sector (${targetSector})`,
            scoreContribution: contribution,
            supportingEvidence: `Active role in same competitive landscape (${emp.organisation.name}, ${empSector})`,
          });
        } else {
          const contribution = 10;
          score += contribution;
          reasons.push({
            category: 'PEER_ROLE',
            description: `Prior experience in peer organisation ${emp.organisation.name} in matching sector (${targetSector})`,
            scoreContribution: contribution,
            supportingEvidence: `Past tenure (${emp.startDate} to ${emp.endDate}) in sector peer`,
          });
        }
        // At most one peer role contribution to avoid runaway accumulation
        break;
      }
    }
  }

  // 3. Relevant expertise tags for company/sector
  if (targetSector) {
    for (const exp of person.expertise) {
      const mult = PROFICIENCY_MULTIPLIERS[exp.proficiency] ?? 0.8;
      const tagLower = exp.name.toLowerCase();
      const sectorLower = targetSector.toLowerCase();

      const exactMatch = tagLower.includes(sectorLower) || sectorLower.includes(tagLower);
      if (exactMatch) {
        const contribution = Math.round(15 * mult);
        score += contribution;
        reasons.push({
          category: 'EXPERTISE_EXACT',
          description: `Demonstrated ${exp.proficiency} expertise in '${exp.name}' matching company domain`,
          scoreContribution: contribution,
          supportingEvidence: `Category: ${exp.category}, Tag ID: ${exp.id}`,
        });
        break;
      }
    }
  }

  // Check company name / domain in headline or summary
  if (companyMeta) {
    const compNameLower = companyMeta.companyName.toLowerCase();
    if (
      person.currentHeadline.toLowerCase().includes(compNameLower) ||
      person.summary.toLowerCase().includes(compNameLower)
    ) {
      const contribution = 10;
      score += contribution;
      reasons.push({
        category: 'EXPERTISE_PARTIAL',
        description: `Direct focus on ${companyMeta.companyName} reflected in professional profile`,
        scoreContribution: contribution,
        supportingEvidence: person.currentHeadline,
      });
    }
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return { relevanceScore: boundedScore, reasons };
}

/**
 * Calculates professional relevance score and reasons for a SECTOR query.
 *
 * Signals:
 * - Current role in sector (+50 points, CURRENT_ROLE)
 * - Past role in sector (+25 points, PAST_ROLE)
 * - Expertise tag exact match (+25 points * proficiency, EXPERTISE_EXACT)
 * - Expertise tag partial match (+15 points * proficiency, EXPERTISE_PARTIAL)
 *
 * Bounded between 0 and 100.
 */
export function calculateSectorRelevance(
  person: Person,
  sectorQuery: string
): { relevanceScore: number; reasons: RecommendationReason[] } {
  const query = sectorQuery.trim();
  const reasons: RecommendationReason[] = [];
  let score = 0;

  // 1. Employment history matching sector
  let hasCurrentSectorMatch = false;
  let hasPastSectorMatch = false;

  for (const emp of person.employmentHistory) {
    const empSector = getOrganisationSector(emp.organisation);
    if (empSector && isSectorMatch(empSector, query)) {
      if (emp.isCurrent && !hasCurrentSectorMatch) {
        const contribution = 50;
        score += contribution;
        reasons.push({
          category: 'CURRENT_ROLE',
          description: `Active role as ${emp.roleTitle} at ${emp.organisation.name} in sector '${query}'`,
          scoreContribution: contribution,
          supportingEvidence: `Current organisation sector: ${empSector}`,
        });
        hasCurrentSectorMatch = true;
      } else if (!emp.isCurrent && !hasPastSectorMatch) {
        const contribution = 25;
        score += contribution;
        reasons.push({
          category: 'PAST_ROLE',
          description: `Prior experience as ${emp.roleTitle} at ${emp.organisation.name} in sector '${query}'`,
          scoreContribution: contribution,
          supportingEvidence: `Tenure: ${emp.startDate} to ${emp.endDate}. Organisation sector: ${empSector}`,
        });
        hasPastSectorMatch = true;
      }
    }
  }

  // 2. Expertise matching sector
  for (const exp of person.expertise) {
    const mult = PROFICIENCY_MULTIPLIERS[exp.proficiency] ?? 0.8;
    const tagName = exp.name.toLowerCase();
    const qLower = query.toLowerCase();

    if (tagName === qLower || tagName.includes(qLower) || isSectorMatch(tagName, qLower)) {
      const contribution = Math.round(25 * mult);
      score += contribution;
      reasons.push({
        category: 'EXPERTISE_EXACT',
        description: `Recognized ${exp.proficiency} in sector domain '${exp.name}'`,
        scoreContribution: contribution,
        supportingEvidence: `Tag ID: ${exp.id}, Category: ${exp.category}`,
      });
    } else if (exp.category === 'SECTOR_INDUSTRY') {
      const contribution = Math.round(15 * mult);
      score += contribution;
      reasons.push({
        category: 'EXPERTISE_PARTIAL',
        description: `Operational experience in sector domain '${exp.name}'`,
        scoreContribution: contribution,
        supportingEvidence: `Tag ID: ${exp.id}`,
      });
    }
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return { relevanceScore: boundedScore, reasons };
}

/**
 * Calculates professional relevance score and reasons for an EXPERTISE query.
 *
 * Signals:
 * - Exact tag name match (+60 points * proficiency, EXPERTISE_EXACT)
 * - Partial keyword match (+35 points * proficiency, EXPERTISE_PARTIAL)
 * - Relevant headline / summary responsibilities (+15 points, CURRENT_ROLE)
 *
 * Bounded between 0 and 100.
 */
export function calculateExpertiseRelevance(
  person: Person,
  expertiseQuery: string
): { relevanceScore: number; reasons: RecommendationReason[] } {
  const query = expertiseQuery.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter((t) => t.length > 2);
  const reasons: RecommendationReason[] = [];
  let score = 0;

  for (const exp of person.expertise) {
    const mult = PROFICIENCY_MULTIPLIERS[exp.proficiency] ?? 0.8;
    const tagNameLower = exp.name.toLowerCase();
    const tagIdLower = exp.id.toLowerCase();

    // Exact match
    if (tagNameLower === query || tagIdLower === query) {
      const contribution = Math.round(60 * mult);
      score += contribution;
      reasons.push({
        category: 'EXPERTISE_EXACT',
        description: `Exact expertise match on '${exp.name}' (${exp.proficiency})`,
        scoreContribution: contribution,
        supportingEvidence: `Expertise tag ID: ${exp.id}, category: ${exp.category}`,
      });
    } else {
      // Partial keyword match
      const matchesTokens = tokens.some(
        (token) => tagNameLower.includes(token) || tagIdLower.includes(token)
      );
      if (matchesTokens) {
        const contribution = Math.round(35 * mult);
        score += contribution;
        reasons.push({
          category: 'EXPERTISE_PARTIAL',
          description: `Relevant specialization in '${exp.name}' (${exp.proficiency})`,
          scoreContribution: contribution,
          supportingEvidence: `Matches query keywords. Tag ID: ${exp.id}`,
        });
      }
    }
  }

  // Profile headline/responsibilities match
  const headlineLower = person.currentHeadline.toLowerCase();
  const summaryLower = person.summary.toLowerCase();
  const headlineMatch = tokens.some((t) => headlineLower.includes(t) || summaryLower.includes(t));
  if (headlineMatch) {
    const contribution = 15;
    score += contribution;
    reasons.push({
      category: 'CURRENT_ROLE',
      description: `Headline or professional summary directly highlights '${expertiseQuery}'`,
      scoreContribution: contribution,
      supportingEvidence: person.currentHeadline,
    });
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return { relevanceScore: boundedScore, reasons };
}

/**
 * Calculates professional relevance score and reasons for a GENERAL text search.
 * Searches across name, current organisation/role, past organisation/role, and expertise.
 */
export function calculateGeneralRelevance(
  person: Person,
  query: string,
  graph: NetworkGraph
): { relevanceScore: number; reasons: RecommendationReason[] } {
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  const reasons: RecommendationReason[] = [];
  let score = 0;

  // Check if query corresponds to a verified company ticker
  const normQ = query.trim().toUpperCase();
  if (normQ in LOCAL_VERIFIED_SYMBOL_REGISTRY) {
    const compResult = calculateCompanyRelevance(person, normQ, graph);
    if (compResult.relevanceScore > 0) {
      score += compResult.relevanceScore;
      reasons.push(...compResult.reasons);
    }
  }

  // 1. Name match
  const nameLower = person.name.toLowerCase();
  if (nameLower === q) {
    const contribution = 80;
    score += contribution;
    reasons.push({
      category: 'RELATIONSHIP_PATH',
      description: `Exact name match for '${person.name}'`,
      scoreContribution: contribution,
      supportingEvidence: `Person ID: ${person.id}`,
    });
  } else if (tokens.some((t) => nameLower.includes(t))) {
    const contribution = 50;
    score += contribution;
    reasons.push({
      category: 'RELATIONSHIP_PATH',
      description: `Name match for '${person.name}'`,
      scoreContribution: contribution,
      supportingEvidence: `Person ID: ${person.id}`,
    });
  }

  // 2. Current company & role
  if (person.currentOrganisation) {
    const orgNameLower = person.currentOrganisation.name.toLowerCase();
    const roleTitleLower = (person.currentRoleTitle ?? '').toLowerCase();
    if (orgNameLower.includes(q) || (roleTitleLower && roleTitleLower.includes(q))) {
      const contribution = 40;
      score += contribution;
      reasons.push({
        category: 'CURRENT_ROLE',
        description: `Current role as ${person.currentRoleTitle} at ${person.currentOrganisation.name}`,
        scoreContribution: contribution,
        supportingEvidence: person.currentHeadline,
      });
    }
  }

  // 3. Expertise match
  const expResult = calculateExpertiseRelevance(person, query);
  if (expResult.relevanceScore > 0) {
    score += expResult.relevanceScore;
    reasons.push(...expResult.reasons);
  }

  // 4. Past company
  for (const emp of person.employmentHistory) {
    if (!emp.isCurrent) {
      const orgNameLower = emp.organisation.name.toLowerCase();
      if (orgNameLower.includes(q)) {
        const contribution = 20;
        score += contribution;
        reasons.push({
          category: 'PAST_ROLE',
          description: `Prior experience at ${emp.organisation.name}`,
          scoreContribution: contribution,
          supportingEvidence: `Role: ${emp.roleTitle} (${emp.startDate} - ${emp.endDate})`,
        });
        break;
      }
    }
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  return { relevanceScore: boundedScore, reasons };
}

/**
 * Calculates overall ranking score from relevance and accessibility scores.
 *
 * Formula:
 * - overallScore = Math.round(0.65 * relevanceScore + 0.35 * accessibilityScore)
 * - INVARIANT: If relevanceScore is 0, overallScore is strictly 0.
 *   A strong personal relationship alone never justifies professional recommendation.
 */
export function calculateOverallScore(
  relevanceScore: number,
  accessibilityScore: number
): number {
  if (relevanceScore <= 0) {
    return 0;
  }
  const weighted =
    SCORING_WEIGHTS.RELEVANCE_WEIGHT * relevanceScore +
    SCORING_WEIGHTS.ACCESSIBILITY_WEIGHT * accessibilityScore;
  return Math.max(0, Math.min(100, Math.round(weighted)));
}

/**
 * Deterministically sorts contact recommendations:
 * 1. overallScore descending
 * 2. relevanceScore descending
 * 3. accessibilityScore descending
 * 4. degree ascending (degree 1 before degree 2)
 * 5. person.name ascending (lexicographical tie-break)
 */
export function sortRecommendations(recommendations: ContactRecommendation[]): void {
  recommendations.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    if (b.accessibilityScore !== a.accessibilityScore) {
      return b.accessibilityScore - a.accessibilityScore;
    }
    if (a.degree !== b.degree) {
      return a.degree - b.degree;
    }
    return a.person.name.localeCompare(b.person.name);
  });
}

/**
 * Builds a ContactRecommendation object given a person, paths, relevance score, and reasons.
 * Returns null if relevanceScore is 0 or if no introduction path exists.
 */
function buildRecommendation(
  person: Person,
  paths: IntroductionPath[],
  relevanceScore: number,
  reasons: RecommendationReason[]
): ContactRecommendation | null {
  if (relevanceScore <= 0 || paths.length === 0) {
    return null;
  }

  const bestPath = paths[0];
  const accessibilityScore = bestPath.accessibilityScore;
  const overallScore = calculateOverallScore(relevanceScore, accessibilityScore);

  // Add relationship path reason explaining the introduction route
  const completeReasons: RecommendationReason[] = [
    ...reasons,
    {
      category: 'RELATIONSHIP_PATH',
      description: bestPath.explanation,
      scoreContribution: Math.round(
        SCORING_WEIGHTS.ACCESSIBILITY_WEIGHT * accessibilityScore
      ),
      supportingEvidence: `Degree: ${bestPath.degree}, Path Strength: ${bestPath.pathStrength}/5, Accessibility Score: ${accessibilityScore}`,
    },
  ];

  return {
    person,
    path: bestPath,
    allPaths: paths,
    degree: bestPath.degree,
    accessibilityScore,
    relevanceScore,
    overallScore,
    reasons: completeReasons,
    provenanceDisclaimer: SYNTHETIC_DATASET_DISCLAIMER,
  };
}

/**
 * Returns contact recommendations for a given company ticker.
 * Excludes candidates with zero professional relevance.
 */
export function getContactsForCompany(
  ticker: string,
  graph: NetworkGraph
): ContactRecommendation[] {
  const recommendations: ContactRecommendation[] = [];

  for (const person of graph.people.values()) {
    const { relevanceScore, reasons } = calculateCompanyRelevance(person, ticker, graph);
    if (relevanceScore <= 0) continue;

    const paths = findIntroductionPaths(person.id, graph);
    const rec = buildRecommendation(person, paths, relevanceScore, reasons);
    if (rec) {
      recommendations.push(rec);
    }
  }

  sortRecommendations(recommendations);
  return recommendations;
}

/**
 * Returns contact recommendations for a given sector.
 * Excludes candidates with zero professional relevance.
 */
export function getContactsForSector(
  sector: string,
  graph: NetworkGraph
): ContactRecommendation[] {
  const recommendations: ContactRecommendation[] = [];

  for (const person of graph.people.values()) {
    const { relevanceScore, reasons } = calculateSectorRelevance(person, sector);
    if (relevanceScore <= 0) continue;

    const paths = findIntroductionPaths(person.id, graph);
    const rec = buildRecommendation(person, paths, relevanceScore, reasons);
    if (rec) {
      recommendations.push(rec);
    }
  }

  sortRecommendations(recommendations);
  return recommendations;
}

/**
 * Returns contact recommendations for an expertise query.
 * Excludes candidates with zero professional relevance.
 */
export function getContactsForExpertise(
  query: string,
  graph: NetworkGraph
): ContactRecommendation[] {
  const recommendations: ContactRecommendation[] = [];

  for (const person of graph.people.values()) {
    const { relevanceScore, reasons } = calculateExpertiseRelevance(person, query);
    if (relevanceScore <= 0) continue;

    const paths = findIntroductionPaths(person.id, graph);
    const rec = buildRecommendation(person, paths, relevanceScore, reasons);
    if (rec) {
      recommendations.push(rec);
    }
  }

  sortRecommendations(recommendations);
  return recommendations;
}

/**
 * Free-text search across the network for a keyword, name, role, or company.
 * Excludes candidates with zero professional relevance.
 */
export function searchNetwork(
  query: string,
  graph: NetworkGraph
): ContactRecommendation[] {
  const recommendations: ContactRecommendation[] = [];

  for (const person of graph.people.values()) {
    const { relevanceScore, reasons } = calculateGeneralRelevance(person, query, graph);
    if (relevanceScore <= 0) continue;

    const paths = findIntroductionPaths(person.id, graph);
    const rec = buildRecommendation(person, paths, relevanceScore, reasons);
    if (rec) {
      recommendations.push(rec);
    }
  }

  sortRecommendations(recommendations);
  return recommendations;
}

/**
 * Dispatches a typed NetworkQuery discriminated union to the appropriate recommendation API.
 */
export function queryNetwork(
  query: NetworkQuery,
  graph: NetworkGraph
): ContactRecommendation[] {
  switch (query.type) {
    case 'COMPANY':
      return getContactsForCompany(query.ticker, graph);
    case 'SECTOR':
      return getContactsForSector(query.sector, graph);
    case 'EXPERTISE':
      return getContactsForExpertise(query.query, graph);
    case 'GENERAL':
      return searchNetwork(query.query, graph);
  }
}
