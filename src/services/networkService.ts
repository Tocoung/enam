import {
  NetworkDataset,
  NetworkGraph,
  Person,
  NetworkEdge,
  IntroductionPath,
  ContactRecommendation,
  RecommendationReason,
  ScoreBreakdown,
  NetworkSearchResult,
  SearchMatchReason,
  NetworkQuery,
  CompanyNetworkQuery,
  SectorNetworkQuery,
  ExpertiseNetworkQuery,
  GeneralSearchNetworkQuery,
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
 * Implements pure deterministic graph construction, directed/undirected traversal
 * capped at degree 2, explainable relevance scoring, and contact ranking.
 *
 * Architecture Principles:
 * 1. Runtime Immutability: Public graph collections are protected by ReadOnlyMap abstractions;
 *    nested person and edge records are deeply frozen. Input datasets are never mutated.
 * 2. Strict Directionality: Direct investor edges are outward directed from INVESTOR_ROOT.
 *    Person-to-person edges are undirected and symmetric.
 * 3. Sector Matching Precision: Strict canonical sector cluster mapping; generic word overlap
 *    and broad substring guessing are prohibited.
 * 4. Mathematical Explainability & Reconciliation: Professional relevance and relationship
 *    accessibility are separated. Overall score explicitly reconciles raw points, weighted contributions,
 *    and rounding adjustments.
 * 5. Distinct Search Semantics: Free-text discovery search is decoupled from professional recommendation scoring.
 * 6. Deterministic Ranking: Strict tie-breaking guarantees reproducible ordering across runs.
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
 * A protected read-only Map implementation that wraps an internal private Map.
 * Exposes lookup and iteration but rejects all mutation attempts at runtime.
 */
export class ReadOnlyMap<K, V> implements ReadonlyMap<K, V> {
  private readonly _map: Map<K, V>;

  constructor(entries?: readonly (readonly [K, V])[] | Iterable<readonly [K, V]>) {
    this._map = new Map(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this._map.size;
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  get(key: K): V | undefined {
    return this._map.get(key);
  }

  entries(): IterableIterator<[K, V]> {
    return this._map.entries();
  }

  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  values(): IterableIterator<V> {
    return this._map.values();
  }

  forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void {
    this._map.forEach((value, key) => callbackfn.call(thisArg, value, key, this));
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._map[Symbol.iterator]();
  }

  // Explicitly prevent mutation methods at runtime
  set(): never {
    throw new Error('Cannot mutate ReadOnlyMap: set() is not supported on immutable graph collections.');
  }

  delete(): never {
    throw new Error('Cannot mutate ReadOnlyMap: delete() is not supported on immutable graph collections.');
  }

  clear(): never {
    throw new Error('Cannot mutate ReadOnlyMap: clear() is not supported on immutable graph collections.');
  }
}

/**
 * Recursively freezes an object, its properties, and nested arrays/objects.
 *
 * Immutability guarantees:
 * - Traverses all own properties, including symbol-keyed properties (via Reflect.ownKeys).
 * - Does not stop recursion merely because the parent object is already shallow-frozen.
 * - Protects against cyclic object graphs using a WeakSet to prevent infinite recursion.
 * - Explicit collection policy:
 *   - ReadOnlyMap instances are explicitly supported: their values are deeply frozen and instance frozen.
 *   - Standard mutable Map and Set instances are explicitly REJECTED with a TypeError because their internal
 *     collection slots cannot be protected against mutation via Object.freeze.
 */
export function deepFreeze<T>(obj: T, seen: WeakSet<object> = new WeakSet()): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent cycles from causing infinite recursion
  if (seen.has(obj as object)) {
    return obj as Readonly<T>;
  }
  seen.add(obj as object);

  // Policy: Explicitly support ReadOnlyMap instances
  if (obj instanceof ReadOnlyMap) {
    for (const val of obj.values()) {
      if (val !== null && typeof val === 'object') {
        deepFreeze(val, seen);
      }
    }
    Object.freeze(obj);
    return obj as Readonly<T>;
  }

  // Policy: Explicitly reject standard mutable Map and Set instances
  if (obj instanceof Map || obj instanceof Set) {
    throw new TypeError(
      'deepFreeze rejects mutable Map and Set instances: standard JavaScript Map/Set collections cannot be made runtime-immutable via Object.freeze. Use ReadOnlyMap or plain arrays/objects instead.'
    );
  }

  // Traverse all own property keys, including symbol keys, even if parent is already frozen
  const keys = Reflect.ownKeys(obj as object);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && desc.value !== null && typeof desc.value === 'object') {
      deepFreeze(desc.value, seen);
    }
  }

  Object.freeze(obj);
  return obj as Readonly<T>;
}

/**
 * Constructs an in-memory indexed NetworkGraph from a validated NetworkDataset.
 * Throws an explicit Error if the dataset fails validation.
 *
 * Immutability guarantees:
 * - Public `people` and `adjacency` are wrapped in `ReadOnlyMap` instances.
 * - All nested `Person`, `EmploymentRecord`, `EducationRecord`, `ExpertiseTag`, and `NetworkEdge`
 *   objects and arrays are deeply frozen.
 * - Input dataset remains completely unmutated.
 *
 * Edge directionality:
 * - Direct investor edges (sourceNodeId === 'INVESTOR_ROOT') are directed from INVESTOR_ROOT.
 * - Person-to-person edges (sourceNodeId !== 'INVESTOR_ROOT') are undirected and added symmetrically.
 */
export function buildNetworkGraph(dataset: NetworkDataset): NetworkGraph {
  const validation = validateNetworkDataset(dataset);
  if (!validation.isValid) {
    throw new Error(
      `Cannot construct NetworkGraph from invalid dataset: ${validation.failures.join('; ')}`
    );
  }

  // Deep clone and deep freeze person records to isolate from input mutations
  const peopleEntries: [string, Person][] = dataset.people.map((person) => {
    const cloned = JSON.parse(JSON.stringify(person)) as Person;
    return [person.id, deepFreeze(cloned)];
  });
  const peopleMap = new ReadOnlyMap<string, Person>(peopleEntries);

  // Build raw adjacency entries
  const tempAdjacency = new Map<string, NetworkEdge[]>();
  tempAdjacency.set(dataset.rootInvestorId, []);
  for (const person of dataset.people) {
    tempAdjacency.set(person.id, []);
  }

  for (const edge of dataset.edges) {
    const clonedEdge = deepFreeze(JSON.parse(JSON.stringify(edge)) as NetworkEdge);
    if (edge.sourceNodeId === dataset.rootInvestorId) {
      // Investor edge: strictly directed outward from INVESTOR_ROOT only
      tempAdjacency.get(dataset.rootInvestorId)!.push(clonedEdge);
    } else {
      // Person-to-person edge: strictly undirected, traversable symmetrically from both endpoints
      tempAdjacency.get(edge.sourceNodeId)!.push(clonedEdge);
      tempAdjacency.get(edge.targetNodeId)!.push(clonedEdge);
    }
  }

  // Deep-freeze each adjacency list and wrap in ReadOnlyMap
  const adjacencyEntries: [string, readonly NetworkEdge[]][] = [];
  for (const [key, edges] of tempAdjacency.entries()) {
    adjacencyEntries.push([key, Object.freeze([...edges])]);
  }
  const adjacencyMap = new ReadOnlyMap<string, readonly NetworkEdge[]>(adjacencyEntries);

  return Object.freeze({
    rootInvestorId: dataset.rootInvestorId,
    people: peopleMap,
    adjacency: adjacencyMap,
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
    if (intermediaryId === targetPersonId) {
      continue;
    }

    const intermediaryPerson = graph.people.get(intermediaryId);
    if (!intermediaryPerson) {
      continue;
    }

    const intermediaryEdges = graph.adjacency.get(intermediaryId) || [];
    for (const edge2 of intermediaryEdges) {
      if (
        edge2.sourceNodeId === graph.rootInvestorId ||
        edge2.targetNodeId === graph.rootInvestorId
      ) {
        continue;
      }

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
 * Explicit canonical sector cluster mapping.
 * Substring matching is strictly prohibited to eliminate false positives between distinct
 * industries sharing generic words (e.g. "Consumer", "Technology", "Services", "Consulting").
 */
export const CANONICAL_SECTOR_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Information Technology
  'information technology': 'INFORMATION_TECHNOLOGY',
  'it services': 'INFORMATION_TECHNOLOGY',
  'it services & consulting': 'INFORMATION_TECHNOLOGY',
  'it consulting & software': 'INFORMATION_TECHNOLOGY',

  // Financial Services / Banking
  'financial services': 'FINANCIAL_SERVICES',
  'banking & financials': 'FINANCIAL_SERVICES',
  'banking & financial services': 'FINANCIAL_SERVICES',
  'private sector bank': 'FINANCIAL_SERVICES',
  'public sector bank': 'FINANCIAL_SERVICES',
  'non-banking financial company (nbfc)': 'FINANCIAL_SERVICES',

  // Energy & Petrochemicals (unambiguous canonical labels)
  'energy': 'ENERGY',
  'energy & petrochemicals': 'ENERGY',
  'oil & gas refining & marketing': 'ENERGY',
  'energy & industrials advisory': 'ENERGY',

  // Consumer Services (Quick Commerce / Food Delivery / Consumer Internet)
  'consumer services': 'CONSUMER_SERVICES',
  'consumer internet & services': 'CONSUMER_SERVICES',
  'quick commerce / food delivery': 'CONSUMER_SERVICES',
  'internet & direct marketing retail': 'CONSUMER_SERVICES',
  'consumer internet ipo': 'CONSUMER_SERVICES',

  // Consumer Discretionary (Automobile / Apparel Retail)
  'consumer discretionary': 'CONSUMER_DISCRETIONARY',
  'automobile': 'CONSUMER_DISCRETIONARY',
  'automobile manufacturers': 'CONSUMER_DISCRETIONARY',
  'apparel retail': 'CONSUMER_DISCRETIONARY',
  'retail / consumer discretionary': 'CONSUMER_DISCRETIONARY',

  // Consumer Staples (FMCG / Personal Care)
  'consumer staples': 'CONSUMER_STAPLES',
  'personal care & household products': 'CONSUMER_STAPLES',
  'fmcg / diversified': 'CONSUMER_STAPLES',
  'consumer goods': 'CONSUMER_STAPLES',

  // Healthcare & Pharmaceuticals
  'healthcare': 'HEALTHCARE',
  'healthcare & pharma': 'HEALTHCARE',
  'pharmaceuticals': 'HEALTHCARE',

  // Telecommunications
  'telecommunication': 'TELECOMMUNICATIONS',
  'telecommunications': 'TELECOMMUNICATIONS',
  'telecom services': 'TELECOMMUNICATIONS',

  // Construction & Civil Engineering
  'construction': 'CONSTRUCTION',
  'civil construction & engineering': 'CONSTRUCTION',
  'infrastructure & engineering': 'CONSTRUCTION',
  'capital goods / infrastructure': 'CONSTRUCTION',

  // Financial Technology (Fintech)
  'financial technology (fintech)': 'FINTECH',

  // Alternative Investments / Specialist Advisory
  'private credit & special situations': 'PRIVATE_CREDIT',
  'venture capital & growth equity': 'VENTURE_CAPITAL',
  'management consulting': 'MANAGEMENT_CONSULTING',
  'governance & regulatory advisory': 'GOVERNANCE_ADVISORY',
  'strategy practice': 'STRATEGY_PRACTICE',
  'infrastructure & private equity practice': 'INFRASTRUCTURE_PE',
  'private equity & consumer tech practice': 'CONSUMER_TECH_PE',
});

/**
 * Checks whether two sector strings are compatible/matching.
 * Strictly uses exact case-insensitive match or canonical cluster match.
 * Unknown or ambiguous classifications return false.
 */
export function isSectorMatch(sectorA: string, sectorB: string): boolean {
  if (!sectorA || !sectorB) return false;
  const sA = sectorA.trim().toLowerCase();
  const sB = sectorB.trim().toLowerCase();

  const clusterA = CANONICAL_SECTOR_MAP[sA];
  const clusterB = CANONICAL_SECTOR_MAP[sB];

  if (!clusterA || !clusterB) {
    return false;
  }

  return clusterA === clusterB;
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
 * Resolves the primary sector for a listed equity ticker.
 * Grounded in:
 * 1. Listed employment records in the network graph.
 * 2. PORTFOLIO_RAW_DATA definitions.
 */
export function resolveTickerSector(ticker: string, graph?: NetworkGraph): string | undefined {
  if (!ticker || typeof ticker !== 'string') return undefined;
  const normTicker = ticker.trim().toUpperCase();

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

  const portfolioStock = PORTFOLIO_RAW_DATA.find((s) => s.ticker === normTicker);
  if (portfolioStock?.sector) {
    return portfolioStock.sector;
  }

  return undefined;
}

/**
 * Calculates professional relevance score and reasons for a COMPANY ticker query.
 *
 * Signals:
 * - Current employment at target company (+60 points, CURRENT_ROLE)
 * - Previous employment at target company (+35 points, PAST_ROLE)
 * - Employment at a peer company in the same sector (+20 points current / +10 points past, PEER_ROLE)
 * - Explicit expertise matching company sector (+15 points exact / +10 points partial * proficiency)
 *
 * Unknown tickers yield 0 relevance and empty reasons.
 * Bounded between 0 and 100.
 */
export function calculateCompanyRelevance(
  person: Person,
  rawTicker: string,
  graph: NetworkGraph
): { relevanceScore: number; reasons: RecommendationReason[] } {
  if (!rawTicker || typeof rawTicker !== 'string' || !rawTicker.trim()) {
    return { relevanceScore: 0, reasons: [] };
  }

  const ticker = rawTicker.trim().toUpperCase();
  const reasons: RecommendationReason[] = [];
  let score = 0;

  const companyMeta = LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker];
  const targetSector = resolveTickerSector(ticker, graph);

  // If ticker is completely unverified in registry and has no sector, yield 0
  if (!companyMeta && !targetSector) {
    return { relevanceScore: 0, reasons: [] };
  }

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

  // 2. Peer organisation employment in the same verified sector
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
        break; // At most one peer role contribution to avoid inflated accumulation
      }
    }
  }

  // 3. Relevant expertise tags for company/sector
  if (targetSector) {
    for (const exp of person.expertise) {
      const mult = PROFICIENCY_MULTIPLIERS[exp.proficiency] ?? 0.8;
      const tagLower = exp.name.toLowerCase();
      const sectorLower = targetSector.toLowerCase();

      if (isSectorMatch(tagLower, sectorLower)) {
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

  // Check company name focus in headline or summary
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
  if (!sectorQuery || typeof sectorQuery !== 'string' || !sectorQuery.trim()) {
    return { relevanceScore: 0, reasons: [] };
  }

  const query = sectorQuery.trim();
  const reasons: RecommendationReason[] = [];
  let score = 0;

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

  for (const exp of person.expertise) {
    const mult = PROFICIENCY_MULTIPLIERS[exp.proficiency] ?? 0.8;
    const tagName = exp.name.toLowerCase();
    const qLower = query.toLowerCase();

    if (tagName === qLower || isSectorMatch(tagName, qLower)) {
      const contribution = Math.round(25 * mult);
      score += contribution;
      reasons.push({
        category: 'EXPERTISE_EXACT',
        description: `Recognized ${exp.proficiency} in sector domain '${exp.name}'`,
        scoreContribution: contribution,
        supportingEvidence: `Tag ID: ${exp.id}, Category: ${exp.category}`,
      });
    } else if (exp.category === 'SECTOR_INDUSTRY' && tagName.includes(qLower)) {
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
  if (!expertiseQuery || typeof expertiseQuery !== 'string' || !expertiseQuery.trim()) {
    return { relevanceScore: 0, reasons: [] };
  }

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
      const matchesTokens = tokens.length > 0 && tokens.some(
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
  const headlineMatch = tokens.length > 0 && tokens.some((t) => headlineLower.includes(t) || summaryLower.includes(t));
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
 * Sanitizes and bounds a numerical score input to the [0, 100] interval.
 *
 * Boundary & edge-case behavior:
 * - NaN, null, undefined, or non-number types: Sanitized to 0.
 * - Negative numbers (< 0) and -Infinity: Clamped to 0.
 * - Values > 100 and +Infinity: Clamped to 100.
 * - Finite numbers in [0, 100]: Preserved as-is.
 */
export function sanitizeScore(val: number): number {
  if (typeof val !== 'number' || Number.isNaN(val)) {
    return 0;
  }
  if (val === -Infinity || val < 0) {
    return 0;
  }
  if (val === Infinity || val > 100) {
    return 100;
  }
  return val;
}

/**
 * Calculates mathematically reconciled ScoreBreakdown object.
 *
 * Scoring invariants:
 * - Relevance weight: 65% (0.65), Accessibility weight: 35% (0.35).
 * - Boundary handling:
 *   - NaN or non-number inputs are sanitized to 0.
 *   - Negative numbers or -Infinity are clamped to 0.
 *   - Scores above 100 or +Infinity are clamped to 100.
 * - If rawRelevanceScore is 0 (or sanitized to 0):
 *   overallScore is strictly 0 (no professional relevance).
 *   weightedRelevanceContribution = 0, weightedAccessibilityContribution = 0, roundingAdjustment = 0.
 * - Mathematical reconciliation identity:
 *   weightedRelevanceContribution + weightedAccessibilityContribution + roundingAdjustment === overallScore
 *   holds unconditionally across all inputs.
 */
export function calculateScoreBreakdown(
  relevanceScore: number,
  accessibilityScore: number
): ScoreBreakdown {
  const rawRelevanceScore = sanitizeScore(relevanceScore);
  const rawAccessibilityScore = sanitizeScore(accessibilityScore);

  if (rawRelevanceScore <= 0) {
    return {
      rawRelevanceScore,
      rawAccessibilityScore,
      weightedRelevanceContribution: 0,
      weightedAccessibilityContribution: 0,
      roundingAdjustment: 0,
      overallScore: 0,
      reconciliationSummary: `Relevance is 0 -> overallScore strictly 0 (no professional relevance)`,
    };
  }

  const exactWeightedRel = SCORING_WEIGHTS.RELEVANCE_WEIGHT * rawRelevanceScore;
  const exactWeightedAcc = SCORING_WEIGHTS.ACCESSIBILITY_WEIGHT * rawAccessibilityScore;
  const exactTotal = exactWeightedRel + exactWeightedAcc;
  const overallScore = Math.max(0, Math.min(100, Math.round(exactTotal)));

  const weightedRelevanceContribution = Math.round(exactWeightedRel);
  const weightedAccessibilityContribution = Math.round(exactWeightedAcc);
  const roundingAdjustment =
    overallScore - (weightedRelevanceContribution + weightedAccessibilityContribution);

  const reconciliationSummary = `65% * ${rawRelevanceScore} (${weightedRelevanceContribution}) + 35% * ${rawAccessibilityScore} (${weightedAccessibilityContribution})${
    roundingAdjustment !== 0
      ? ` + rounding (${roundingAdjustment > 0 ? '+' : ''}${roundingAdjustment})`
      : ''
  } = ${overallScore}`;

  return {
    rawRelevanceScore,
    rawAccessibilityScore,
    weightedRelevanceContribution,
    weightedAccessibilityContribution,
    roundingAdjustment,
    overallScore,
    reconciliationSummary,
  };
}

/**
 * Calculates overall ranking score from relevance and accessibility scores.
 *
 * Formula:
 * - overallScore = Math.round(0.65 * relevanceScore + 0.35 * accessibilityScore)
 * - INVARIANT: If relevanceScore is 0, overallScore is strictly 0.
 */
export function calculateOverallScore(
  relevanceScore: number,
  accessibilityScore: number
): number {
  return calculateScoreBreakdown(relevanceScore, accessibilityScore).overallScore;
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
  const sanitizedRel = sanitizeScore(relevanceScore);
  if (sanitizedRel <= 0 || paths.length === 0) {
    return null;
  }

  const bestPath = paths[0];
  const accessibilityScore = bestPath.accessibilityScore;
  const scoreBreakdown = calculateScoreBreakdown(relevanceScore, accessibilityScore);

  return {
    person,
    path: bestPath,
    allPaths: paths,
    degree: bestPath.degree,
    accessibilityScore: scoreBreakdown.rawAccessibilityScore,
    relevanceScore: scoreBreakdown.rawRelevanceScore,
    overallScore: scoreBreakdown.overallScore,
    scoreBreakdown,
    reasons,
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
  if (!ticker || typeof ticker !== 'string' || !ticker.trim()) {
    return [];
  }

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
  if (!sector || typeof sector !== 'string' || !sector.trim()) {
    return [];
  }

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
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

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
 * Free-text discovery search across the network.
 *
 * Distinct from professional investment recommendation scoring:
 * - Supports name, current role, current organisation, past role, past organisation, and expertise.
 * - Empty or whitespace queries return [] immediately.
 * - Deduplicates match contributions across fields to prevent inflated scores.
 * - Returns NetworkSearchResult with explicit searchMatchScore and searchRankingScore.
 */
export function searchNetwork(
  query: string,
  graph: NetworkGraph
): NetworkSearchResult[] {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) {
    return [];
  }

  const results: NetworkSearchResult[] = [];

  for (const person of graph.people.values()) {
    const matchReasons: SearchMatchReason[] = [];
    let score = 0;

    // 1. Name match (at most one contribution)
    const nameLower = person.name.toLowerCase();
    if (nameLower === q) {
      const contribution = 60;
      score += contribution;
      matchReasons.push({
        field: 'NAME',
        description: `Exact name match for '${person.name}'`,
        matchedText: person.name,
        scoreContribution: contribution,
      });
    } else if (tokens.some((t) => nameLower.includes(t))) {
      const contribution = 35;
      score += contribution;
      matchReasons.push({
        field: 'NAME',
        description: `Name matches search keyword '${query}'`,
        matchedText: person.name,
        scoreContribution: contribution,
      });
    }

    // 2. Current Organisation match (at most one contribution)
    if (person.currentOrganisation) {
      const orgLower = person.currentOrganisation.name.toLowerCase();
      if (tokens.some((t) => orgLower.includes(t))) {
        const contribution = 25;
        score += contribution;
        matchReasons.push({
          field: 'CURRENT_ORGANISATION',
          description: `Current organisation '${person.currentOrganisation.name}' matches query`,
          matchedText: person.currentOrganisation.name,
          scoreContribution: contribution,
        });
      }
    }

    // 3. Current Role match (at most one contribution)
    if (person.currentRoleTitle) {
      const roleLower = person.currentRoleTitle.toLowerCase();
      if (tokens.some((t) => roleLower.includes(t))) {
        const contribution = 20;
        score += contribution;
        matchReasons.push({
          field: 'CURRENT_ROLE',
          description: `Current role '${person.currentRoleTitle}' matches query`,
          matchedText: person.currentRoleTitle,
          scoreContribution: contribution,
        });
      }
    }

    // 4. Past Organisation match (at most one contribution across all past roles)
    let pastOrgMatched = false;
    for (const emp of person.employmentHistory) {
      if (!emp.isCurrent) {
        const pastOrgLower = emp.organisation.name.toLowerCase();
        if (tokens.some((t) => pastOrgLower.includes(t)) && !pastOrgMatched) {
          const contribution = 15;
          score += contribution;
          matchReasons.push({
            field: 'PAST_ORGANISATION',
            description: `Prior experience at '${emp.organisation.name}' matches query`,
            matchedText: emp.organisation.name,
            scoreContribution: contribution,
          });
          pastOrgMatched = true;
          break;
        }
      }
    }

    // 5. Past Role match (at most one contribution across all past roles)
    let pastRoleMatched = false;
    for (const emp of person.employmentHistory) {
      if (!emp.isCurrent) {
        const pastRoleLower = emp.roleTitle.toLowerCase();
        if (tokens.some((t) => pastRoleLower.includes(t)) && !pastRoleMatched) {
          const contribution = 10;
          score += contribution;
          matchReasons.push({
            field: 'PAST_ROLE',
            description: `Prior title '${emp.roleTitle}' matches query`,
            matchedText: emp.roleTitle,
            scoreContribution: contribution,
          });
          pastRoleMatched = true;
          break;
        }
      }
    }

    // 6. Expertise tag match (at most one contribution)
    let expMatched = false;
    for (const exp of person.expertise) {
      const expLower = exp.name.toLowerCase();
      if (expLower === q) {
        const contribution = 30;
        score += contribution;
        matchReasons.push({
          field: 'EXPERTISE',
          description: `Exact expertise match on '${exp.name}'`,
          matchedText: exp.name,
          scoreContribution: contribution,
        });
        expMatched = true;
        break;
      } else if (tokens.some((t) => expLower.includes(t)) && !expMatched) {
        const contribution = 15;
        score += contribution;
        matchReasons.push({
          field: 'EXPERTISE',
          description: `Expertise '${exp.name}' matches query keyword`,
          matchedText: exp.name,
          scoreContribution: contribution,
        });
        expMatched = true;
        break;
      }
    }

    // 7. Headline or summary match (only if neither role nor org matched)
    if (matchReasons.length === 0 || (!pastRoleMatched && !pastOrgMatched)) {
      const headlineLower = person.currentHeadline.toLowerCase();
      const summaryLower = person.summary.toLowerCase();
      if (tokens.some((t) => headlineLower.includes(t) || summaryLower.includes(t))) {
        const contribution = 10;
        score += contribution;
        matchReasons.push({
          field: 'HEADLINE_OR_SUMMARY',
          description: `Profile summary highlights matching terms`,
          matchedText: person.currentHeadline,
          scoreContribution: contribution,
        });
      }
    }

    if (score <= 0 || matchReasons.length === 0) {
      continue;
    }

    const searchMatchScore = Math.max(0, Math.min(100, score));
    const paths = findIntroductionPaths(person.id, graph);
    const bestPath = paths[0];
    const accessibilityScore = bestPath ? bestPath.accessibilityScore : 0;
    const searchRankingScore = Math.max(
      0,
      Math.min(100, Math.round(0.7 * searchMatchScore + 0.3 * accessibilityScore))
    );

    results.push({
      person,
      path: bestPath,
      allPaths: paths,
      degree: bestPath ? bestPath.degree : 1,
      searchMatchScore,
      accessibilityScore,
      searchRankingScore,
      matchReasons,
      provenanceDisclaimer: SYNTHETIC_DATASET_DISCLAIMER,
    });
  }

  // Deterministic sorting
  results.sort((a, b) => {
    if (b.searchRankingScore !== a.searchRankingScore) {
      return b.searchRankingScore - a.searchRankingScore;
    }
    if (b.searchMatchScore !== a.searchMatchScore) {
      return b.searchMatchScore - a.searchMatchScore;
    }
    if (b.accessibilityScore !== a.accessibilityScore) {
      return b.accessibilityScore - a.accessibilityScore;
    }
    if (a.degree !== b.degree) {
      return a.degree - b.degree;
    }
    return a.person.name.localeCompare(b.person.name);
  });

  return results;
}

/**
 * Dispatches a typed NetworkQuery discriminated union to the appropriate service API.
 */
export function queryNetwork(
  query: CompanyNetworkQuery | SectorNetworkQuery | ExpertiseNetworkQuery,
  graph: NetworkGraph
): ContactRecommendation[];
export function queryNetwork(
  query: GeneralSearchNetworkQuery,
  graph: NetworkGraph
): NetworkSearchResult[];
export function queryNetwork(
  query: NetworkQuery,
  graph: NetworkGraph
): ContactRecommendation[] | NetworkSearchResult[];
export function queryNetwork(
  query: NetworkQuery,
  graph: NetworkGraph
): ContactRecommendation[] | NetworkSearchResult[] {
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
