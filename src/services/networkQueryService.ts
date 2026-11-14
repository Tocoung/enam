/**
 * Natural-Language Network Intelligence Query Interpretation & Execution Service.
 *
 * Implements a deterministic, explainable query interpreter that maps investor questions
 * into typed intents:
 * 1. COMPANY: Professionally relevant contacts for listed equities.
 * 2. SECTOR: Sector-grounded industry operators and executives.
 * 3. EXPERTISE: Operational specialists for verified domain skills.
 * 4. ORGANISATION_HISTORY: Current and past executives of named organisations.
 * 5. PERSON_CONNECTION: Explicit 1st- and 2nd-degree paths to indexed personas.
 *
 * Grounded in FINN's local verified symbol registry and synthetic network graph.
 * Zero external LLM or API dependencies.
 */

import {
  calculateScoreBreakdown,
  findIntroductionPaths,
  getContactsForCompany,
  getContactsForSector,
  getContactsForExpertise,
} from './networkService';
import {
  Person,
  NetworkGraph,
  EmploymentRecord,
  ContactRecommendation,
  RecommendationReason,
  IntroductionFacilitator,
  InterpretedNetworkQuery,
  QueryExecutionResult,
} from '../types/network';
import { LOCAL_VERIFIED_SYMBOL_REGISTRY } from '../data/researchData';

/**
 * Deterministic alias dictionary mapping colloquial company and brand names
 * to canonical listed tickers in LOCAL_VERIFIED_SYMBOL_REGISTRY.
 */
export const COMPANY_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'reliance': 'RELIANCE',
  'ril': 'RELIANCE',
  'reliance industries': 'RELIANCE',
  'reliance industries limited': 'RELIANCE',
  'tcs': 'TCS',
  'tata consultancy': 'TCS',
  'tata consultancy services': 'TCS',
  'tata consultancy services limited': 'TCS',
  'infy': 'INFY',
  'infosys': 'INFY',
  'infosys limited': 'INFY',
  'hdfc': 'HDFCBANK',
  'hdfc bank': 'HDFCBANK',
  'hdfc bank limited': 'HDFCBANK',
  'icici': 'ICICIBANK',
  'icici bank': 'ICICIBANK',
  'icici bank limited': 'ICICIBANK',
  'sbi': 'SBIN',
  'state bank': 'SBIN',
  'state bank of india': 'SBIN',
  'airtel': 'BHARTIARTL',
  'bharti': 'BHARTIARTL',
  'bharti airtel': 'BHARTIARTL',
  'bharti airtel limited': 'BHARTIARTL',
  'vi': 'IDEA',
  'vodafone': 'IDEA',
  'idea': 'IDEA',
  'vodafone idea': 'IDEA',
  'vodafone idea limited': 'IDEA',
  'sun pharma': 'SUNPHARMA',
  'sun pharmaceutical': 'SUNPHARMA',
  'sun pharmaceuticals': 'SUNPHARMA',
  'sun pharmaceutical industries limited': 'SUNPHARMA',
  'dr reddy': 'DRREDDY',
  'dr. reddy': 'DRREDDY',
  'dr reddys': 'DRREDDY',
  "dr reddy's": 'DRREDDY',
  "dr. reddy's": 'DRREDDY',
  "dr. reddy's laboratories": 'DRREDDY',
  "dr. reddy's laboratories limited": 'DRREDDY',
  'dr reddys laboratories': 'DRREDDY',
  'lt': 'LT',
  'l&t': 'LT',
  'larsen': 'LT',
  'larsen & toubro': 'LT',
  'larsen and toubro': 'LT',
  'larsen & toubro limited': 'LT',
  'wipro': 'WIPRO',
  'wipro limited': 'WIPRO',
  'maruti': 'MARUTI',
  'maruti suzuki': 'MARUTI',
  'maruti suzuki india limited': 'MARUTI',
  'tata motors': 'TATAMOTORS',
  'tatamotors': 'TATAMOTORS',
  'tata motors limited': 'TATAMOTORS',
  'trent': 'TRENT',
  'trent limited': 'TRENT',
  'zudio': 'TRENT',
  'westside': 'TRENT',
  'hul': 'HINDUNILVR',
  'hindustan unilever': 'HINDUNILVR',
  'hindustan unilever limited': 'HINDUNILVR',
  'paytm': 'PAYTM',
  'one97': 'PAYTM',
  'one 97': 'PAYTM',
  'one97 communications limited': 'PAYTM',
  'swiggy': 'SWIGGY',
  'swiggy limited': 'SWIGGY',
  'zomato': 'ZOMATO',
  'zomato limited': 'ZOMATO',
  'bajaj finance': 'BAJFINANCE',
  'bajfinance': 'BAJFINANCE',
  'bajaj': 'BAJFINANCE',
  'bajaj finance limited': 'BAJFINANCE',
});

/**
 * Deterministic alias dictionary for unlisted organisations in the network dataset.
 */
export const UNLISTED_ORG_ALIASES: Readonly<Record<string, { readonly orgId: string; readonly name: string }>> = Object.freeze({
  'mckinsey': { orgId: 'org-mckinsey-india', name: 'McKinsey & Company India' },
  'mckinsey & company': { orgId: 'org-mckinsey-india', name: 'McKinsey & Company India' },
  'mckinsey india': { orgId: 'org-mckinsey-india', name: 'McKinsey & Company India' },
  'mckinsey & company india': { orgId: 'org-mckinsey-india', name: 'McKinsey & Company India' },
  'bain': { orgId: 'org-bain-india', name: 'Bain & Company India' },
  'bain & company': { orgId: 'org-bain-india', name: 'Bain & Company India' },
  'bain india': { orgId: 'org-bain-india', name: 'Bain & Company India' },
  'bain & company india': { orgId: 'org-bain-india', name: 'Bain & Company India' },
  'sebi': { orgId: 'org-sebi', name: 'Securities and Exchange Board of India' },
  'securities and exchange board of india': { orgId: 'org-sebi', name: 'Securities and Exchange Board of India' },
  'valuebridge': { orgId: 'org-unlisted-valuebridge', name: 'ValueBridge Capital Advisory' },
  'valuebridge capital': { orgId: 'org-unlisted-valuebridge', name: 'ValueBridge Capital Advisory' },
  'valuebridge capital advisory': { orgId: 'org-unlisted-valuebridge', name: 'ValueBridge Capital Advisory' },
  'surge': { orgId: 'org-sequoia-surge', name: 'Surge Growth Ventures India' },
  'surge growth ventures': { orgId: 'org-sequoia-surge', name: 'Surge Growth Ventures India' },
  'surge growth ventures india': { orgId: 'org-sequoia-surge', name: 'Surge Growth Ventures India' },
  'surge venture partners': { orgId: 'org-sequoia-surge', name: 'Surge Growth Ventures India' },
});

/**
 * Sector alias dictionary mapping colloquial industry terms to canonical FINN sectors.
 */
export const SECTOR_QUERY_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'banking': 'Financial Services',
  'banking sector': 'Financial Services',
  'finance': 'Financial Services',
  'financial services': 'Financial Services',
  'financials': 'Financial Services',
  'nbfc': 'Financial Services',
  'credit': 'Financial Services',
  'lending': 'Financial Services',
  'energy': 'Energy',
  'energy sector': 'Energy',
  'oil & gas': 'Energy',
  'oil and gas': 'Energy',
  'petrochemicals': 'Energy',
  'refining': 'Energy',
  'it': 'Information Technology',
  'it sector': 'Information Technology',
  'tech': 'Information Technology',
  'technology': 'Information Technology',
  'technology sector': 'Information Technology',
  'software': 'Information Technology',
  'information technology': 'Information Technology',
  'consumer services': 'Consumer Services',
  'food delivery': 'Consumer Services',
  'quick commerce': 'Consumer Services',
  'consumer discretionary': 'Consumer Discretionary',
  'retail': 'Consumer Discretionary',
  'retail sector': 'Consumer Discretionary',
  'apparel': 'Consumer Discretionary',
  'fashion': 'Consumer Discretionary',
  'auto': 'Automobile',
  'automobile': 'Automobile',
  'automobiles': 'Automobile',
  'automotive': 'Automobile',
  'pharma': 'Healthcare',
  'pharmaceutical': 'Healthcare',
  'pharmaceuticals': 'Healthcare',
  'healthcare': 'Healthcare',
  'telecom': 'Telecommunications',
  'telecommunications': 'Telecommunications',
  'construction': 'Construction',
  'infrastructure': 'Construction',
  'epc': 'Construction',
});

/**
 * Expertise alias dictionary mapping colloquial skill phrases to canonical expertise skills.
 */
export const EXPERTISE_QUERY_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'refining margins': 'Refining Margins',
  'crack spreads': 'Refining Margins',
  'downstream refining': 'Refining Margins',
  'petrochemical yields': 'Refining Margins',
  'cloud migration': 'Cloud Migration',
  'enterprise cloud': 'Cloud Migration',
  'cognitive solutions': 'Cloud Migration',
  'npa provisioning': 'NPA Provisioning',
  'retail credit': 'NPA Provisioning',
  'digital underwriting': 'NPA Provisioning',
  'credit risk': 'NPA Provisioning',
  'quick commerce': 'Quick Commerce',
  'dark store logistics': 'Quick Commerce',
  'supply chain logistics': 'Quick Commerce',
  'platform architecture': 'Platform Architecture',
  'distributed systems': 'Platform Architecture',
  'foodtech scale': 'Platform Architecture',
  'ai transformation': 'AI Transformation',
  'cognitive systems': 'AI Transformation',
  'enterprise generative ai': 'AI Transformation',
  'generative ai': 'AI Transformation',
  'automobile distribution': 'Automobile Distribution',
  'powertrain procurement': 'Automobile Distribution',
  'global sourcing': 'Automobile Distribution',
  'omnichannel expansion': 'Omnichannel Expansion',
  'retail merchandising': 'Omnichannel Expansion',
  'fashion supply chain': 'Omnichannel Expansion',
  'specialty generics': 'Specialty Generics',
  'formulation compliance': 'Specialty Generics',
  'usfda compliance': 'Specialty Generics',
  'telecom tariffs': 'Telecom Tariffs',
  '5g rollout': 'Telecom Tariffs',
  'network infrastructure': 'Telecom Tariffs',
  'sebi compliance': 'SEBI Compliance',
  'listing regulations': 'SEBI Compliance',
  'board governance': 'SEBI Compliance',
  'special situations': 'Special Situations',
  'distressed debt': 'Special Situations',
  'asset reconstruction': 'Special Situations',
  'fintech growth equity': 'Fintech Growth Equity',
  'fintech equity': 'Fintech Growth Equity',
  'growth investing': 'Fintech Growth Equity',
  'venture capital': 'Fintech Growth Equity',
  'capital allocation': 'Capital Allocation',
  'm&a': 'Capital Allocation',
  'm&a execution': 'Capital Allocation',
});

/**
 * Cleans punctuation and question formatting from a search string.
 */
function cleanQueryTerm(term: string): string {
  return term
    .replace(/[?!.,;:]+$/g, '')
    .replace(/^[?!.,;:]+/g, '')
    .trim();
}

/**
 * Searches for an exact or title-normalized persona match within the graph.
 */
export function findPersonByName(nameQuery: string, graph: NetworkGraph): Person | undefined {
  const clean = cleanQueryTerm(nameQuery).toLowerCase();
  if (!clean) return undefined;

  // Strip prefixes like "dr." or "dr "
  const stripped = clean.replace(/^(?:dr\.\s*|dr\s+|mr\.\s*|ms\.\s*)/i, '').trim();

  for (const person of graph.people.values()) {
    const pName = person.name.toLowerCase();
    const pStripped = pName.replace(/^(?:dr\.\s*|dr\s+|mr\.\s*|ms\.\s*)/i, '').trim();

    if (pName === clean || pStripped === stripped || pStripped === clean || pName === stripped) {
      return person;
    }
  }

  return undefined;
}

/**
 * Resolves a company string against canonical tickers and aliases.
 */
export function resolveCompany(candidate: string): { ticker: string; companyName: string } | undefined {
  const clean = cleanQueryTerm(candidate).toLowerCase();
  const upper = clean.toUpperCase();

  // 1. Direct ticker check
  if (upper in LOCAL_VERIFIED_SYMBOL_REGISTRY) {
    return {
      ticker: upper,
      companyName: LOCAL_VERIFIED_SYMBOL_REGISTRY[upper as keyof typeof LOCAL_VERIFIED_SYMBOL_REGISTRY].companyName,
    };
  }

  // 2. Alias lookup
  if (clean in COMPANY_ALIASES) {
    const ticker = COMPANY_ALIASES[clean];
    if (ticker in LOCAL_VERIFIED_SYMBOL_REGISTRY) {
      return {
        ticker,
        companyName: LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker as keyof typeof LOCAL_VERIFIED_SYMBOL_REGISTRY].companyName,
      };
    }
  }

  // 3. Exact company name lookup in master registry
  for (const [ticker, reg] of Object.entries(LOCAL_VERIFIED_SYMBOL_REGISTRY)) {
    if (reg.companyName.toLowerCase() === clean) {
      return { ticker, companyName: reg.companyName };
    }
  }

  // 4. Strip "company" / "the company" prefix or suffix if present (e.g. "Company Reliance", "Reliance Company")
  const stripped = clean
    .replace(/^(?:the\s+)?company\s+/i, '')
    .replace(/\s+(?:the\s+)?company$/i, '')
    .trim();

  if (stripped && stripped !== clean) {
    return resolveCompany(stripped);
  }

  return undefined;
}

/**
 * Resolves an organisation name against listed and unlisted entities.
 */
export function resolveOrganisation(candidate: string): { name: string; ticker?: string; orgId?: string } | undefined {
  const clean = cleanQueryTerm(candidate).toLowerCase();

  // Check company first
  const comp = resolveCompany(clean);
  if (comp) {
    return { name: comp.companyName, ticker: comp.ticker };
  }

  // Check unlisted alias
  if (clean in UNLISTED_ORG_ALIASES) {
    const unlisted = UNLISTED_ORG_ALIASES[clean];
    return { name: unlisted.name, orgId: unlisted.orgId };
  }

  // Check with stripped "company" / "the company" prefix or suffix
  const stripped = clean
    .replace(/^(?:the\s+)?company\s+/i, '')
    .replace(/\s+(?:the\s+)?company$/i, '')
    .trim();

  if (stripped && stripped !== clean) {
    return resolveOrganisation(stripped);
  }

  return undefined;
}

/**
 * Resolves a sector string against canonical sectors and aliases.
 */
export function resolveSector(candidate: string): string | undefined {
  const clean = cleanQueryTerm(candidate).toLowerCase();

  if (clean in SECTOR_QUERY_ALIASES) {
    return SECTOR_QUERY_ALIASES[clean];
  }

  return undefined;
}

/**
 * Resolves an expertise query against canonical skills and aliases.
 */
export function resolveExpertise(candidate: string): string | undefined {
  const clean = cleanQueryTerm(candidate).toLowerCase();

  if (clean in EXPERTISE_QUERY_ALIASES) {
    return EXPERTISE_QUERY_ALIASES[clean];
  }

  return undefined;
}

/**
 * Interprets a user question into a typed network intent.
 */
export function interpretNetworkQuery(
  rawQuery: string,
  graph: NetworkGraph
): InterpretedNetworkQuery {
  const trimmed = rawQuery.trim();

  // 1. Empty query handling
  if (!trimmed) {
    return {
      rawQuery,
      intent: 'UNKNOWN',
      interpretationLabel: 'Empty Query',
      explanation: 'Please enter an investment question to query the network.',
      confidence: 'UNRESOLVED',
    };
  }

  // 2. Pattern A: Person connection questions
  // e.g. "Who can connect me to Vikram Sen?", "How can I reach Arun Sharma?", "Who can connect me to the new MD of Company X?"
  const connectPatterns = [
    /who\s+(?:can|could)\s+connect\s+me\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /who\s+(?:can|could)\s+introduce\s+me\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /how\s+(?:can|could|do)\s+i\s+(?:reach|connect\s+with|connect\s+to)\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /connect\s+me\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /introduce\s+me\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /introduction\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /path\s+to\s+(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
    /who\s+knows\s+(?!about\b)(?:(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+)?(.+)/i,
  ];

  for (const pattern of connectPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidate = cleanQueryTerm(match[1]);
      const person = findPersonByName(candidate, graph);

      if (person) {
        return {
          rawQuery,
          intent: 'PERSON_CONNECTION',
          personName: person.name,
          targetPerson: person,
          interpretationLabel: `Person Connection: ${person.name}`,
          explanation: `Identified introduction query for synthetic persona ${person.name}. Evaluating direct and 2nd-degree paths from INVESTOR_ROOT.`,
          confidence: 'EXACT',
        };
      }

      // Check if candidate is asking about a company or sector rather than a person
      const maybeComp = resolveCompany(candidate);
      if (maybeComp) {
        return {
          rawQuery,
          intent: 'COMPANY',
          ticker: maybeComp.ticker,
          companyName: maybeComp.companyName,
          interpretationLabel: `Company Query: ${maybeComp.ticker}`,
          explanation: `Identified connection query for listed equity ${maybeComp.companyName} (${maybeComp.ticker}). Retrieving relevant executives and introduction paths.`,
          confidence: 'HIGH',
        };
      }

      // Check if candidate had an inner role title like "MD of Reliance"
      const innerRoleMatch = candidate.match(
        /^(?:the\s+)?(?:new\s+)?(?:md|managing\s+director|ceo|cfo|cto|cxo|promoter|chairman|leadership|management|founder|head)\s+(?:of|at)\s+(.+)/i
      );
      if (innerRoleMatch && innerRoleMatch[1]) {
        const innerCandidate = cleanQueryTerm(innerRoleMatch[1]);
        const innerPerson = findPersonByName(innerCandidate, graph);
        if (innerPerson) {
          return {
            rawQuery,
            intent: 'PERSON_CONNECTION',
            personName: innerPerson.name,
            targetPerson: innerPerson,
            interpretationLabel: `Person Connection: ${innerPerson.name}`,
            explanation: `Identified introduction query for synthetic persona ${innerPerson.name}. Evaluating direct and 2nd-degree paths from INVESTOR_ROOT.`,
            confidence: 'EXACT',
          };
        }
        const innerComp = resolveCompany(innerCandidate);
        if (innerComp) {
          return {
            rawQuery,
            intent: 'COMPANY',
            ticker: innerComp.ticker,
            companyName: innerComp.companyName,
            interpretationLabel: `Company Query: ${innerComp.ticker}`,
            explanation: `Identified connection query for listed equity ${innerComp.companyName} (${innerComp.ticker}). Retrieving relevant executives and introduction paths.`,
            confidence: 'HIGH',
          };
        }
      }

      // Named entity was not found in synthetic dataset
      return {
        rawQuery,
        intent: 'PERSON_CONNECTION',
        personName: candidate,
        targetPerson: undefined,
        interpretationLabel: `Unknown Persona: ${candidate}`,
        explanation: `The person or role "${candidate}" was not found in the synthetic network dataset. FINN only navigates paths between verified indexed personas and never synthesizes unsupported third-party links.`,
        confidence: 'UNRESOLVED',
      };
    }
  }

  // 3. Pattern B: Organisation history questions
  // e.g. "Who has worked at TCS?", "Who worked at McKinsey?", "Who previously worked at SEBI?"
  const orgPatterns = [
    /who\s+(?:has\s+worked|previously\s+worked|formerly\s+worked|worked|has\s+experience\s+working|used\s+to\s+work)\s+(?:at|for|with)\s+(.+)/i,
    /who\s+(?:is|was)\s+at\s+(.+)/i,
    /former\s+(.+)\s+(?:employees|executives|staff|people|colleagues)/i,
  ];

  for (const pattern of orgPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidateOrg = cleanQueryTerm(match[1]);
      const org = resolveOrganisation(candidateOrg);

      if (org) {
        return {
          rawQuery,
          intent: 'ORGANISATION_HISTORY',
          organisationName: org.name,
          ticker: org.ticker,
          orgId: org.orgId,
          interpretationLabel: `Organisation History: ${org.name}${org.ticker ? ` (${org.ticker})` : ''}`,
          explanation: `Identified career tenure query for ${org.name}. Retrieving current and former professionals associated with this organisation.`,
          confidence: 'EXACT',
        };
      }

      // Unknown organisation
      return {
        rawQuery,
        intent: 'UNKNOWN',
        unresolvedEntity: candidateOrg,
        interpretationLabel: `Unknown Organisation: ${candidateOrg}`,
        explanation: `The organisation "${candidateOrg}" was not found in the verified company registry or synthetic network index. FINN cannot infer employment records for unindexed entities.`,
        confidence: 'UNRESOLVED',
      };
    }
  }

  // 4. Pattern C: Sector experience questions
  // e.g. "Who has experience in the banking sector?", "Who understands the energy industry?"
  const sectorPatterns = [
    /who\s+has\s+experience\s+in\s+(?:the\s+)?(.+?)(?:\s+sector|\s+industry|\s+space)?$/i,
    /who\s+(?:knows|understands)\s+(?:the\s+)?(.+?)\s+(?:sector|industry|space)/i,
    /(.+?)\s+(?:sector|industry)\s+experts?/i,
    /who\s+has\s+(?:a\s+)?background\s+in\s+(?:the\s+)?(.+)/i,
  ];

  for (const pattern of sectorPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidateSector = cleanQueryTerm(match[1]);
      const sector = resolveSector(candidateSector);

      if (sector) {
        return {
          rawQuery,
          intent: 'SECTOR',
          sector,
          interpretationLabel: `Sector Query: ${sector}`,
          explanation: `Identified sector query for ${sector}. Evaluating industry operators, domain experts, and peer corporate executives.`,
          confidence: 'EXACT',
        };
      }
    }
  }

  // 5. Pattern D: Expertise / Domain skills questions
  // e.g. "Who understands refining margins?", "Who has expertise in cloud migration?"
  const expertisePatterns = [
    /who\s+(?:understands|knows\s+about|has\s+expertise\s+in)\s+(.+)/i,
    /(?:experts?|specialists?)\s+in\s+(.+)/i,
    /who\s+specializes\s+in\s+(.+)/i,
  ];

  for (const pattern of expertisePatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidateExpertise = cleanQueryTerm(match[1]);

      // Check if it's an expertise skill first
      const exp = resolveExpertise(candidateExpertise);
      if (exp) {
        return {
          rawQuery,
          intent: 'EXPERTISE',
          expertiseQuery: exp,
          interpretationLabel: `Expertise Query: ${exp}`,
          explanation: `Identified domain expertise query for "${exp}". Searching for verified operational proficiencies and executive oversight experience.`,
          confidence: 'EXACT',
        };
      }

      // Check if it's a company (e.g. "Who understands Reliance?")
      const comp = resolveCompany(candidateExpertise);
      if (comp) {
        return {
          rawQuery,
          intent: 'COMPANY',
          ticker: comp.ticker,
          companyName: comp.companyName,
          interpretationLabel: `Company Query: ${comp.ticker}`,
          explanation: `Identified company query for ${comp.companyName} (${comp.ticker}). Evaluating direct corporate tenure, peer-sector experience, and relationship accessibility.`,
          confidence: 'EXACT',
        };
      }

      // Check if it's a sector (e.g. "Who understands banking?")
      const sec = resolveSector(candidateExpertise);
      if (sec) {
        return {
          rawQuery,
          intent: 'SECTOR',
          sector: sec,
          interpretationLabel: `Sector Query: ${sec}`,
          explanation: `Identified sector query for ${sec}. Evaluating industry operators and peer corporate executives.`,
          confidence: 'EXACT',
        };
      }
    }
  }

  // 6. Pattern E: General understanding / Company exploration questions
  // e.g. "Who can help me understand Reliance?", "Tell me about TCS", "Who covers HDFC Bank?"
  const companyPatterns = [
    /who\s+(?:can|could)\s+help\s+me\s+understand\s+(.+)/i,
    /who\s+(?:covers|has\s+perspective\s+on|can\s+speak\s+to|can\s+speak\s+about)\s+(.+)/i,
    /tell\s+me\s+about\s+(.+)/i,
    /who\s+can\s+advise\s+on\s+(.+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidateComp = cleanQueryTerm(match[1]);
      const comp = resolveCompany(candidateComp);

      if (comp) {
        return {
          rawQuery,
          intent: 'COMPANY',
          ticker: comp.ticker,
          companyName: comp.companyName,
          interpretationLabel: `Company Query: ${comp.ticker}`,
          explanation: `Identified company query for ${comp.companyName} (${comp.ticker}). Evaluating direct corporate tenure, peer-sector experience, and relationship accessibility.`,
          confidence: 'EXACT',
        };
      }

      // Check if candidate matches a sector
      const sec = resolveSector(candidateComp);
      if (sec) {
        return {
          rawQuery,
          intent: 'SECTOR',
          sector: sec,
          interpretationLabel: `Sector Query: ${sec}`,
          explanation: `Identified sector query for ${sec}. Evaluating industry operators and peer corporate executives.`,
          confidence: 'EXACT',
        };
      }

      // Unknown company entity
      return {
        rawQuery,
        intent: 'UNKNOWN',
        unresolvedEntity: candidateComp,
        interpretationLabel: `Unknown Company: ${candidateComp}`,
        explanation: `The company "${candidateComp}" is not registered in FINN's master ticker registry or network index. FINN does not guess or fabricate corporate associations for unindexed tickers.`,
        confidence: 'UNRESOLVED',
      };
    }
  }

  // 7. Direct keyword fallbacks (for short inputs like "Reliance", "TCS", "Vikram Sen", "Banking")
  const person = findPersonByName(trimmed, graph);
  if (person) {
    return {
      rawQuery,
      intent: 'PERSON_CONNECTION',
      personName: person.name,
      targetPerson: person,
      interpretationLabel: `Person Connection: ${person.name}`,
      explanation: `Identified persona lookup for ${person.name}. Evaluating direct and 2nd-degree paths from INVESTOR_ROOT.`,
      confidence: 'EXACT',
    };
  }

  const comp = resolveCompany(trimmed);
  if (comp) {
    return {
      rawQuery,
      intent: 'COMPANY',
      ticker: comp.ticker,
      companyName: comp.companyName,
      interpretationLabel: `Company Query: ${comp.ticker}`,
      explanation: `Identified direct company lookup for ${comp.companyName} (${comp.ticker}). Evaluating relevant network executives.`,
      confidence: 'EXACT',
    };
  }

  const sec = resolveSector(trimmed);
  if (sec) {
    return {
      rawQuery,
      intent: 'SECTOR',
      sector: sec,
      interpretationLabel: `Sector Query: ${sec}`,
      explanation: `Identified direct sector lookup for ${sec}. Evaluating industry operators and executives.`,
      confidence: 'EXACT',
    };
  }

  const exp = resolveExpertise(trimmed);
  if (exp) {
    return {
      rawQuery,
      intent: 'EXPERTISE',
      expertiseQuery: exp,
      interpretationLabel: `Expertise Query: ${exp}`,
      explanation: `Identified direct expertise lookup for "${exp}". Searching for verified operational proficiencies.`,
      confidence: 'EXACT',
    };
  }

  const org = resolveOrganisation(trimmed);
  if (org) {
    return {
      rawQuery,
      intent: 'ORGANISATION_HISTORY',
      organisationName: org.name,
      ticker: org.ticker,
      orgId: org.orgId,
      interpretationLabel: `Organisation History: ${org.name}`,
      explanation: `Identified direct organisation lookup for ${org.name}. Retrieving current and former professionals.`,
      confidence: 'EXACT',
    };
  }

  // 8. Unresolved / Ambiguous query fallback
  return {
    rawQuery,
    intent: 'UNKNOWN',
    unresolvedEntity: trimmed,
    interpretationLabel: 'Ambiguous Query',
    explanation: `Could not deterministically map "${trimmed}" to a known listed company, sector, expertise domain, or synthetic persona. Try asking about a specific company (e.g. 'Reliance', 'TCS'), sector ('Banking', 'Energy'), or persona ('Vikram Sen').`,
    confidence: 'AMBIGUOUS',
  };
}

/**
 * Retrieves contacts who currently or previously worked at a specified organisation.
 * Uses strict hierarchy:
 * 1. Prefer canonical ticker equality for listed organisations (e.g. 'TCS', 'RELIANCE').
 * 2. Prefer exact orgId equality for unlisted organisations (e.g. 'org-mckinsey-india', 'org-bain-india').
 * 3. Use normalized exact organisation-name equality only when a canonical identifier is unavailable.
 * 4. Substring-based name matching is strictly removed to prevent false positive matches.
 */
export function getContactsForOrganisationHistory(
  orgIdentifier: string,
  graph: NetworkGraph
): ContactRecommendation[] {
  const norm = cleanQueryTerm(orgIdentifier).toLowerCase();
  if (!norm) return [];

  // 1. Determine canonical ticker for listed entities
  const upper = norm.toUpperCase();
  const directTicker = upper in LOCAL_VERIFIED_SYMBOL_REGISTRY ? upper : undefined;
  const resolvedComp = directTicker ? undefined : resolveCompany(orgIdentifier);
  const targetTicker = directTicker || resolvedComp?.ticker;

  // 2. Determine exact orgId for unlisted entities
  let targetOrgId: string | undefined;
  if (norm.startsWith('org-')) {
    targetOrgId = norm;
  } else {
    const resolvedOrg = resolveOrganisation(orgIdentifier);
    if (resolvedOrg?.orgId) {
      targetOrgId = resolvedOrg.orgId;
    }
  }

  // 3. Fallback normalized exact organisation name
  const targetExactName = norm;

  interface OrgMatch {
    person: Person;
    isCurrent: boolean;
    roleTitle: string;
    orgName: string;
    startDate: string;
    endDate: string | null;
  }

  const matches: OrgMatch[] = [];

  for (const person of graph.people.values()) {
    const personMatches: { emp: EmploymentRecord; isCurrent: boolean }[] = [];

    for (const emp of person.employmentHistory) {
      let isMatch = false;

      // 1. Prefer canonical ticker equality for listed organisations
      if (targetTicker) {
        if (
          emp.organisation.type === 'LISTED_NSE_BSE' &&
          emp.organisation.ticker.toUpperCase() === targetTicker.toUpperCase()
        ) {
          isMatch = true;
        }
      }
      // 2. Prefer exact orgId equality for unlisted organisations
      else if (targetOrgId) {
        if (
          emp.organisation.type !== 'LISTED_NSE_BSE' &&
          'orgId' in emp.organisation &&
          emp.organisation.orgId.toLowerCase() === targetOrgId.toLowerCase()
        ) {
          isMatch = true;
        }
      }
      // 3. Normalized exact organisation-name equality only when a canonical identifier is unavailable
      else {
        const empNameNorm = cleanQueryTerm(emp.organisation.name).toLowerCase();
        if (empNameNorm === targetExactName) {
          isMatch = true;
        }
      }

      if (isMatch) {
        personMatches.push({ emp, isCurrent: emp.isCurrent });
      }
    }

    if (personMatches.length > 0) {
      // Prioritize current role if multiple matching roles exist for this persona
      const bestMatch = personMatches.find((m) => m.isCurrent) || personMatches[0];
      matches.push({
        person,
        isCurrent: bestMatch.emp.isCurrent,
        roleTitle: bestMatch.emp.roleTitle,
        orgName: bestMatch.emp.organisation.name,
        startDate: bestMatch.emp.startDate,
        endDate: bestMatch.emp.endDate,
      });
    }
  }

  const recommendations: ContactRecommendation[] = [];

  for (const match of matches) {
    const paths = findIntroductionPaths(match.person.id, graph);
    if (paths.length === 0) continue;

    const bestPath = paths[0];
    const relevanceScore = match.isCurrent ? 100 : 80;
    const accessibilityScore = bestPath.accessibilityScore;
    const scoreBreakdown = calculateScoreBreakdown(relevanceScore, accessibilityScore);

    const reasons: RecommendationReason[] = [
      {
        category: match.isCurrent ? 'CURRENT_ROLE' : 'PAST_ROLE',
        description: `${match.isCurrent ? 'Current' : 'Past'} ${match.roleTitle} at ${match.orgName}`,
        scoreContribution: relevanceScore,
        supportingEvidence: `${match.roleTitle} (${match.startDate} — ${match.endDate || 'Present'})`,
      },
      {
        category: 'RELATIONSHIP_PATH',
        description:
          bestPath.degree === 1
            ? 'Direct 1st-degree connection from Investor'
            : `Reachable via 2-hop path through ${bestPath.intermediary?.name}`,
        scoreContribution: accessibilityScore,
        supportingEvidence: `Accessibility score ${accessibilityScore}/100 based on path tie strength`,
      },
    ];

    recommendations.push({
      person: match.person,
      path: bestPath,
      allPaths: paths,
      degree: bestPath.degree,
      accessibilityScore,
      relevanceScore,
      overallScore: scoreBreakdown.overallScore,
      scoreBreakdown,
      reasons,
      provenanceDisclaimer:
        "Synthetic network profiles and relationships; company references use the prototype's verified ticker registry.",
    });
  }

  // Deterministic sorting
  return recommendations.sort((a, b) => {
    if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    if (b.accessibilityScore !== a.accessibilityScore) return b.accessibilityScore - a.accessibilityScore;
    if (a.degree !== b.degree) return a.degree - b.degree;
    return a.person.name.localeCompare(b.person.name);
  });
}

/**
 * Executes an interpreted query against the network graph and returns explainable recommendations.
 */
export function executeNetworkQuery(
  interpretedQuery: InterpretedNetworkQuery,
  graph: NetworkGraph
): QueryExecutionResult {
  const provenanceNotice =
    "Synthetic network profiles and relationships; company references use the prototype's verified ticker registry.";

  switch (interpretedQuery.intent) {
    case 'COMPANY': {
      const recs = getContactsForCompany(interpretedQuery.ticker, graph);
      const status = recs.length > 0 ? 'SUCCESS' : 'NO_MATCHES';
      const statusMessage =
        recs.length > 0
          ? `Found ${recs.length} professionally relevant contacts for ${interpretedQuery.companyName} (${interpretedQuery.ticker}).`
          : `No contacts with direct tenure or peer experience in ${interpretedQuery.companyName} were found in the network.`;

      return {
        query: interpretedQuery,
        recommendations: recs,
        status,
        statusMessage,
        provenanceNotice,
      };
    }

    case 'SECTOR': {
      const recs = getContactsForSector(interpretedQuery.sector, graph);
      const status = recs.length > 0 ? 'SUCCESS' : 'NO_MATCHES';
      const statusMessage =
        recs.length > 0
          ? `Found ${recs.length} contacts with verified operational experience in ${interpretedQuery.sector}.`
          : `No contacts with active or past experience in ${interpretedQuery.sector} were found in the network.`;

      return {
        query: interpretedQuery,
        recommendations: recs,
        status,
        statusMessage,
        provenanceNotice,
      };
    }

    case 'EXPERTISE': {
      const recs = getContactsForExpertise(interpretedQuery.expertiseQuery, graph);
      const status = recs.length > 0 ? 'SUCCESS' : 'NO_MATCHES';
      const statusMessage =
        recs.length > 0
          ? `Found ${recs.length} contacts with domain expertise matching "${interpretedQuery.expertiseQuery}".`
          : `No contacts with verified expertise in "${interpretedQuery.expertiseQuery}" were found in the network.`;

      return {
        query: interpretedQuery,
        recommendations: recs,
        status,
        statusMessage,
        provenanceNotice,
      };
    }

    case 'ORGANISATION_HISTORY': {
      const identifier = interpretedQuery.ticker || interpretedQuery.orgId || interpretedQuery.organisationName;
      const recs = getContactsForOrganisationHistory(identifier, graph);
      const status = recs.length > 0 ? 'SUCCESS' : 'NO_MATCHES';
      const statusMessage =
        recs.length > 0
          ? `Found ${recs.length} current or former professionals from ${interpretedQuery.organisationName}.`
          : `No professionals with employment history at ${interpretedQuery.organisationName} were found in the network.`;

      return {
        query: interpretedQuery,
        recommendations: recs,
        status,
        statusMessage,
        provenanceNotice,
      };
    }

    case 'PERSON_CONNECTION': {
      if (!interpretedQuery.targetPerson) {
        return {
          query: interpretedQuery,
          recommendations: [],
          introductionFacilitators: [],
          personConnectionPaths: [],
          status: 'UNKNOWN_ENTITY',
          statusMessage: interpretedQuery.explanation,
          provenanceNotice,
        };
      }

      const target = interpretedQuery.targetPerson;
      const paths = findIntroductionPaths(target.id, graph);

      if (paths.length === 0) {
        return {
          query: interpretedQuery,
          recommendations: [],
          introductionFacilitators: [],
          personConnectionPaths: [],
          status: 'NO_MATCHES',
          statusMessage: `No valid relationship paths could be found to ${target.name} within 2 degrees.`,
          provenanceNotice,
        };
      }

      const bestPath = paths[0];
      const accessibilityScore = bestPath.accessibilityScore;
      const scoreBreakdown = calculateScoreBreakdown(100, accessibilityScore);

      const targetRec: ContactRecommendation = {
        person: target,
        path: bestPath,
        allPaths: paths,
        degree: bestPath.degree,
        accessibilityScore,
        relevanceScore: 100,
        overallScore: scoreBreakdown.overallScore,
        scoreBreakdown,
        reasons: [
          {
            category: 'RELATIONSHIP_PATH',
            description: `Target persona requested in query (${bestPath.degree === 1 ? 'Direct 1st-Degree Connection' : `Reachable via ${bestPath.intermediary?.name}`})`,
            scoreContribution: 100,
            supportingEvidence: `Exact persona match: ${target.name}`,
          },
        ],
        provenanceDisclaimer: provenanceNotice,
      };

      // Gather distinct 2nd-degree intermediary contacts as Introduction Facilitators
      // (Kept strictly separated from professional domain recommendations)
      const facilitators: IntroductionFacilitator[] = [];
      const seenIntermediaryIds = new Set<string>();

      for (const p of paths) {
        if (p.degree === 2 && p.intermediary && !seenIntermediaryIds.has(p.intermediary.id)) {
          seenIntermediaryIds.add(p.intermediary.id);

          const intermediary = p.intermediary;
          const directInvestorEdge = p.edges[0];
          const peerReferralEdge = p.edges[1];
          const pathSummary = `INVESTOR_ROOT -> ${intermediary.name} -> ${target.name}`;

          facilitators.push({
            person: intermediary,
            targetPerson: target,
            path: p,
            facilitatedPathSummary: pathSummary,
            accessibilityScore: p.accessibilityScore,
            rankingScore: p.accessibilityScore,
            roleBadge: 'Introduction Facilitator',
            explanation: `${intermediary.name} can facilitate an introduction to ${target.name} via an active 2-hop referral path. Graph proximity represents relationship accessibility, not domain expertise in ${target.name}'s industry.`,
            reasons: [
              {
                category: 'RELATIONSHIP_PATH',
                description: `Introduction Facilitator for ${target.name}`,
                scoreContribution: p.accessibilityScore,
                supportingEvidence: `Facilitates referral path: ${pathSummary} (Direct tie: ${directInvestorEdge.connectionStrength}/5 stars, Peer tie: ${peerReferralEdge.connectionStrength}/5 stars)`,
              },
            ],
            provenanceDisclaimer: provenanceNotice,
          });
        }
      }

      // Sort facilitators deterministically by accessibilityScore desc, then name asc
      facilitators.sort((a, b) => {
        if (b.accessibilityScore !== a.accessibilityScore) return b.accessibilityScore - a.accessibilityScore;
        return a.person.name.localeCompare(b.person.name);
      });

      return {
        query: interpretedQuery,
        targetRecommendation: targetRec,
        recommendations: [targetRec],
        introductionFacilitators: facilitators,
        personConnectionPaths: paths,
        status: 'SUCCESS',
        statusMessage: `Found ${paths.length} introduction path${paths.length > 1 ? 's' : ''} to ${target.name} (${bestPath.degree === 1 ? '1st-degree direct' : '2nd-degree referral'})${facilitators.length > 0 ? ` with ${facilitators.length} introduction facilitator${facilitators.length > 1 ? 's' : ''}` : ''}.`,
        provenanceNotice,
      };
    }

    case 'UNKNOWN':
    default: {
      return {
        query: interpretedQuery,
        recommendations: [],
        introductionFacilitators: [],
        status: interpretedQuery.confidence === 'UNRESOLVED' ? 'UNKNOWN_ENTITY' : 'AMBIGUOUS',
        statusMessage: interpretedQuery.explanation,
        provenanceNotice,
      };
    }
  }
}

/**
 * End-to-end natural-language network query pipeline.
 * Parses, interprets, and executes the question against the graph.
 */
export function queryNetworkNaturalLanguage(
  rawQuery: string,
  graph: NetworkGraph
): QueryExecutionResult {
  const interpreted = interpretNetworkQuery(rawQuery, graph);
  return executeNetworkQuery(interpreted, graph);
}
