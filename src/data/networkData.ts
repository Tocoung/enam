import { LOCAL_VERIFIED_SYMBOL_REGISTRY } from './researchData';
import {
  NetworkDataset,
  NetworkValidationResult,
  Person,
  NetworkEdge,
  ListedOrganisationRef,
  EmploymentRecord,
} from '../types/network';

/**
 * Deterministic synthetic professional network dataset for FINN demonstration.
 *
 * PROVENANCE NOTICE:
 * All personas, professional affiliations, and relationship records in this dataset
 * are SYNTHETIC and generated exclusively for algorithmic verification and UI demonstration.
 * Any resemblance to real individuals or specific non-public investor interactions is
 * entirely coincidental. Listed company names and verified NSE symbols refer exclusively
 * to public entities in FINN's local equity registry.
 */

export const NETWORK_PERSONAS: readonly Person[] = [
  {
    id: 'person-arun-sharma',
    name: 'Arun Sharma',
    currentHeadline: 'Senior Energy Transition Advisor | Former VP, Refining at RIL',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-unlisted-valuebridge',
      name: 'ValueBridge Capital Advisory',
      sector: 'Energy & Industrials Advisory',
    },
    currentRoleTitle: 'Senior Energy Transition Advisor',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Over 25 years in downstream oil-to-chemicals (O2C), refinery economics, petchem margin management, and energy transition strategies across Western India refining hubs.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-arun-sharma-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-unlisted-valuebridge',
          name: 'ValueBridge Capital Advisory',
          sector: 'Energy & Industrials Advisory',
        },
        roleTitle: 'Senior Energy Transition Advisor',
        department: 'Industrial & Energy Practice',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2023-04',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Advising private equity and institutional investors on refinery margin cycles and crack spreads',
          'Evaluating capital allocation for petrochemical integration and green hydrogen pilots',
        ],
        relevantDomainTags: ['Downstream Petrochemicals', 'Refinery Turnaround', 'Energy Transition'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-arun-sharma-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'RELIANCE',
          name: 'Reliance Industries Limited',
          isin: 'INE002A01018',
          sector: 'Energy',
          subsector: 'Oil & Gas Refining & Marketing',
        },
        roleTitle: 'VP, Refining Operations & Planning',
        department: 'Manufacturing & O2C Operations',
        seniority: 'SENIOR_VP_VP',
        startDate: '2014-04',
        endDate: '2023-03',
        isCurrent: false,
        responsibilities: [
          'Led operational planning for integrated Jamnagar refinery and petrochemical complex',
          'Managed crude feed optimization, hydrocracker operations, and polymer production scheduling',
          'Monitored global transportation fuel crack spreads (gasoil, gasoline, jet fuel) and gross refining margins',
        ],
        relevantDomainTags: ['O2C Refining', 'Petrochemical Crack Spreads', 'Crude Slate Optimization'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-arun-sharma-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Chemical Engineering',
        startYear: 1988,
        endYear: 1992,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-arun-o2c-cracks',
        name: 'O2C Refining & Petrochemical Crack Spreads',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-arun-refinery-ops',
        name: 'Refinery Turnaround & Slate Optimization',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-arun-capex-alloc',
        name: 'Energy Capex & Downstream Integration',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-vikram-sen',
    name: 'Vikram Sen',
    currentHeadline: 'Managing Director, Enterprise Cloud & Cognitive Solutions at TCS',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'TCS',
      name: 'Tata Consultancy Services Limited',
      isin: 'INE467B01029',
      sector: 'Information Technology',
      subsector: 'IT Consulting & Software',
    },
    currentRoleTitle: 'Managing Director, Enterprise Cloud Solutions',
    location: 'Bengaluru, Karnataka, India',
    summary:
      'Over 22 years in enterprise technology architecture, BFSI core banking migrations, and generative AI enterprise deployment across North American and European banking clients.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-vikram-sen-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'TCS',
          name: 'Tata Consultancy Services Limited',
          isin: 'INE467B01029',
          sector: 'Information Technology',
          subsector: 'IT Consulting & Software',
        },
        roleTitle: 'Managing Director, Enterprise Cloud Solutions',
        department: 'Cloud & Cognitive Business Group',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2020-04',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Overseeing global enterprise cloud transitions and multi-year AI pilot implementations',
          'Managing client delivery governance for Tier-1 US and European financial institutions',
        ],
        relevantDomainTags: ['Enterprise IT Services', 'GenAI Implementation', 'Cloud Infrastructure'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-vikram-sen-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'INFY',
          name: 'Infosys Limited',
          isin: 'INE009A01021',
          sector: 'Information Technology',
          subsector: 'IT Consulting & Software',
        },
        roleTitle: 'Global Delivery Head, BFSI Practice',
        department: 'Financial Services Business Unit',
        seniority: 'SENIOR_VP_VP',
        startDate: '2012-06',
        endDate: '2020-03',
        isCurrent: false,
        responsibilities: [
          'Directed offshore and nearshore delivery teams across North American commercial banks',
          'Led core banking modernization programs and compliance remediation technology stacks',
        ],
        relevantDomainTags: ['BFSI Tech Architecture', 'Offshore Delivery Governance', 'Legacy Modernization'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-vikram-sen-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, Delhi, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science and Engineering',
        startYear: 1995,
        endYear: 1999,
        provenance: 'SYNTHETIC',
      },
      {
        id: 'edu-vikram-sen-2',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-ahmedabad',
          name: 'Indian Institute of Management Ahmedabad',
          location: 'Ahmedabad, Gujarat, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Strategy & Systems',
        startYear: 1999,
        endYear: 2001,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-vikram-genai-deployment',
        name: 'Enterprise GenAI Architecture & Deployment',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-vikram-it-deal-gov',
        name: 'Large IT Outsourcing Governance & TCV Execution',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
      {
        id: 'exp-vikram-bfsi-modernization',
        name: 'Core Banking IT Systems Modernization',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
  {
    id: 'person-priya-nair',
    name: 'Priya Nair',
    currentHeadline: 'Chief Product Officer, Quick Commerce & Supply Chain at Swiggy',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'SWIGGY',
      name: 'Swiggy Limited',
      isin: 'INE00H001014',
      sector: 'Consumer Services',
      subsector: 'Internet & Direct Marketing Retail',
    },
    currentRoleTitle: 'Chief Product Officer, Quick Commerce',
    location: 'Bengaluru, Karnataka, India',
    summary:
      'Product and operations leader with 14 years specializing in dark store density, last-mile routing algorithms, FMCG brand partnerships, and contribution margin optimization in quick commerce.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-priya-nair-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'SWIGGY',
          name: 'Swiggy Limited',
          isin: 'INE00H001014',
          sector: 'Consumer Services',
          subsector: 'Internet & Direct Marketing Retail',
        },
        roleTitle: 'Chief Product Officer, Quick Commerce',
        department: 'Instamart & Supply Chain Product',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2022-01',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Spearheading dark store network rollout, SKU assortment optimization, and delivery partner dispatch',
          'Driving contribution margin expansion through FMCG advertising monetization and store throughput',
        ],
        relevantDomainTags: ['Quick Commerce Unit Economics', 'Dark Store Logistics', 'FMCG Monetization'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-priya-nair-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'ZOMATO',
          name: 'Zomato Limited',
          isin: 'INE758T01015',
          sector: 'Consumer Services',
          subsector: 'Internet & Direct Marketing Retail',
        },
        roleTitle: 'VP, Delivery Operations & Partner Experience',
        department: 'Food Delivery & Hyperlocal Fulfillment',
        seniority: 'SENIOR_VP_VP',
        startDate: '2018-05',
        endDate: '2021-12',
        isCurrent: false,
        responsibilities: [
          'Managed hyperlocal delivery fleet logistics across top 15 metros',
          'Engineered batching and dispatch algorithms reducing average transit duration by 18%',
        ],
        relevantDomainTags: ['Food Delivery Operations', 'Fleet Dispatch Algorithms', 'Unit Economics'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-priya-nair-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Mechanical Engineering',
        startYear: 2006,
        endYear: 2010,
        provenance: 'SYNTHETIC',
      },
      {
        id: 'edu-priya-nair-2',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-bangalore',
          name: 'Indian Institute of Management Bangalore',
          location: 'Bengaluru, Karnataka, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Operations & Marketing',
        startYear: 2010,
        endYear: 2012,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-priya-qc-economics',
        name: 'Quick Commerce Contribution Margin Optimization',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-priya-dark-store-ops',
        name: 'Dark Store Network Density & Throughput',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-priya-fleet-algorithms',
        name: 'Hyperlocal Fleet Batching & Dispatch Algorithms',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
  {
    id: 'person-rohit-gupta',
    name: 'Rohit Gupta',
    currentHeadline: 'Chief Risk Officer, Retail Credit & Digital Underwriting at Bajaj Finance',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'BAJFINANCE',
      name: 'Bajaj Finance Limited',
      isin: 'INE296A01024',
      sector: 'Financial Services',
      subsector: 'Non-Banking Financial Company (NBFC)',
    },
    currentRoleTitle: 'Chief Risk Officer, Retail Lending',
    location: 'Pune, Maharashtra, India',
    summary:
      'Risk executive with 19 years in consumer credit scoring, retail asset quality surveillance, algorithmic underwriting, and NBFC liquidity management.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-rohit-gupta-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'BAJFINANCE',
          name: 'Bajaj Finance Limited',
          isin: 'INE296A01024',
          sector: 'Financial Services',
          subsector: 'Non-Banking Financial Company (NBFC)',
        },
        roleTitle: 'Chief Risk Officer, Retail Lending',
        department: 'Credit Risk & Analytics',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2021-08',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Formulating underwriting policy for consumer durable loans, personal loans, and rural lending',
          'Managing portfolio-wide credit loss provisioning, ECL models, and collection efficiency monitoring',
        ],
        relevantDomainTags: ['Retail Credit Underwriting', 'ECL Provisioning', 'Unsecured Loan Risk'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-rohit-gupta-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'HDFCBANK',
          name: 'HDFC Bank Limited',
          isin: 'INE040A01034',
          sector: 'Financial Services',
          subsector: 'Private Sector Bank',
        },
        roleTitle: 'Head of Retail Credit Risk',
        department: 'Retail Assets & Risk Analytics',
        seniority: 'SENIOR_VP_VP',
        startDate: '2015-03',
        endDate: '2021-07',
        isCurrent: false,
        responsibilities: [
          'Oversaw credit scoring scorecards for credit cards and auto loan portfolios',
          'Spearheaded transition to automated algorithmic underwriting for pre-approved customers',
        ],
        relevantDomainTags: ['Credit Card Analytics', 'Retail NPA Surveillance', 'ALM Regulatory Guidelines'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-rohit-gupta-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, Delhi, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Electrical Engineering',
        startYear: 2001,
        endYear: 2005,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-rohit-retail-credit',
        name: 'Unsecured Consumer Credit Underwriting & ECL',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-rohit-risk-analytics',
        name: 'Algorithmic Risk Scoring & Bureau Analytics',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-rohit-nbfc-alm',
        name: 'NBFC Asset-Liability Management & Regulatory Capital',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-ananya-deshmukh',
    name: 'Ananya Deshmukh',
    currentHeadline: 'Executive Director, Treasury & Wholesale Banking at ICICI Bank',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'ICICIBANK',
      name: 'ICICI Bank Limited',
      isin: 'INE090A01021',
      sector: 'Financial Services',
      subsector: 'Private Sector Bank',
    },
    currentRoleTitle: 'Executive Director, Treasury & Markets',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Fixed income and treasury specialist with 20 years managing domestic money market books, foreign exchange liquidity, sovereign bond portfolios, and wholesale asset-liability matching.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-ananya-deshmukh-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'ICICIBANK',
          name: 'ICICI Bank Limited',
          isin: 'INE090A01021',
          sector: 'Financial Services',
          subsector: 'Private Sector Bank',
        },
        roleTitle: 'Executive Director, Treasury & Markets',
        department: 'Global Markets & Balance Sheet Management',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2019-10',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing sovereign G-Sec trading desk, interest rate swap books, and corporate bond structuring',
          'Governing bank-wide Liquidity Coverage Ratio (LCR) and Net Stable Funding Ratio (NSFR)',
        ],
        relevantDomainTags: ['Wholesale Banking', 'Fixed Income Trading', 'LCR & Balance Sheet ALM'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-ananya-deshmukh-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'SBIN',
          name: 'State Bank of India',
          isin: 'INE062A01020',
          sector: 'Financial Services',
          subsector: 'Public Sector Bank',
        },
        roleTitle: 'Chief Dealer, Rates & Foreign Exchange',
        department: 'Global Markets Division',
        seniority: 'SENIOR_VP_VP',
        startDate: '2012-04',
        endDate: '2019-09',
        isCurrent: false,
        responsibilities: [
          'Managed rupee and USD liquidity operations and open market operation (OMO) bidding',
          'Structured hedging facilities for large public sector and infrastructure conglomerates',
        ],
        relevantDomainTags: ['Forex Dealing', 'G-Sec Bidding', 'Sovereign Debt Issuance'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-ananya-deshmukh-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-ahmedabad',
          name: 'Indian Institute of Management Ahmedabad',
          location: 'Ahmedabad, Gujarat, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Finance & Economics',
        startYear: 2004,
        endYear: 2006,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-ananya-treasury-alm',
        name: 'Bank Treasury, G-Sec Trading & ALM Matching',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-ananya-wholesale-markets',
        name: 'Wholesale Bond Syndication & Structured Rates',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-ananya-rbi-reg',
        name: 'RBI Liquidity & Macroprudential Compliance',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-siddharth-mehta',
    name: 'Siddharth Mehta',
    currentHeadline: 'EVP & Head of Network Infrastructure & 5G Rollout at Bharti Airtel',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'BHARTIARTL',
      name: 'Bharti Airtel Limited',
      isin: 'INE397D01024',
      sector: 'Telecommunication',
      subsector: 'Telecom Services',
    },
    currentRoleTitle: 'EVP, Network Operations & Technology Rollout',
    location: 'Gurugram, Haryana, India',
    summary:
      'Telecom infrastructure veteran with 24 years directing nationwide radio access network (RAN) architecture, fiber backhaul deployment, spectrum auction bids, and telecom equipment vendor procurement.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-siddharth-mehta-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'BHARTIARTL',
          name: 'Bharti Airtel Limited',
          isin: 'INE397D01024',
          sector: 'Telecommunication',
          subsector: 'Telecom Services',
        },
        roleTitle: 'EVP, Network Operations & Technology Rollout',
        department: 'Network Operations Group',
        seniority: 'SENIOR_VP_VP',
        startDate: '2020-02',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing non-standalone 5G rollout across 22 telecom circles in India',
          'Managing vendor relationships and multi-billion-dollar capex with Nokia, Ericsson, and local tower cos',
        ],
        relevantDomainTags: ['5G RAN Rollout', 'Telecom Capex Efficiency', 'Tower Infrastructure Sharing'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-siddharth-mehta-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'IDEA',
          name: 'Vodafone Idea Limited',
          isin: 'INE669E01016',
          sector: 'Telecommunication',
          subsector: 'Telecom Services',
        },
        roleTitle: 'Chief Technology Officer, Radio Access Network',
        department: 'Technology & Engineering',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2014-06',
        endDate: '2020-01',
        isCurrent: false,
        responsibilities: [
          'Led pre-merger and post-merger network integration of Vodafone and Idea Cellular radio infrastructure',
          'Executed cell site rationalization and spectrum refarming across 900MHz and 1800MHz bands',
        ],
        relevantDomainTags: ['Post-Merger Network Integration', 'Spectrum Refarming', 'RAN Capex Management'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-siddharth-mehta-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Electrical Engineering',
        startYear: 1998,
        endYear: 2002,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-siddharth-5g-capex',
        name: '5G RAN Deployment & Telecom Capex Sizing',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-siddharth-spectrum-refarm',
        name: 'Spectrum Auction Strategy & Band Refarming',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
      {
        id: 'exp-siddharth-tower-procure',
        name: 'Passive Infrastructure & Fiber Backhaul Optimization',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
    ],
  },
  {
    id: 'person-deepa-menon',
    name: 'Dr. Deepa Menon',
    currentHeadline: 'VP, Global Regulatory Affairs & Formulation Compliance at Sun Pharma',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'SUNPHARMA',
      name: 'Sun Pharmaceutical Industries Limited',
      isin: 'INE044A01036',
      sector: 'Healthcare',
      subsector: 'Pharmaceuticals',
    },
    currentRoleTitle: 'VP, Global Regulatory Affairs & Quality Compliance',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Pharmaceutical executive with 21 years in USFDA cGMP audits, Form 483 remediation, abbreviated new drug application (ANDA) regulatory filings, and active pharmaceutical ingredient (API) synthesis quality.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-deepa-menon-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'SUNPHARMA',
          name: 'Sun Pharmaceutical Industries Limited',
          isin: 'INE044A01036',
          sector: 'Healthcare',
          subsector: 'Pharmaceuticals',
        },
        roleTitle: 'VP, Global Regulatory Affairs & Quality Compliance',
        department: 'Global Regulatory & Quality Audit',
        seniority: 'SENIOR_VP_VP',
        startDate: '2019-03',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing regulatory filings for specialty dermatological and ophthalmology pipeline with USFDA and EMA',
          'Governing site audit preparedness and remediation programs for Halol and Mohali formulation facilities',
        ],
        relevantDomainTags: ['USFDA cGMP Audits', 'ANDA Pipeline Approval', 'Specialty Pharma Formulations'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-deepa-menon-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'DRREDDY',
          name: "Dr. Reddy's Laboratories Limited",
          isin: 'INE089A01023',
          sector: 'Healthcare',
          subsector: 'Pharmaceuticals',
        },
        roleTitle: 'Senior Director, US Formulations Compliance',
        department: 'Regulatory Submissions & QA',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2013-08',
        endDate: '2019-02',
        isCurrent: false,
        responsibilities: [
          'Managed regulatory responses to USFDA inspection observations and warning letter resolution',
          'Supervised analytical method validation and bioequivalence study submissions for generic injectables',
        ],
        relevantDomainTags: ['Warning Letter Remediation', 'Generic Injectables', 'Analytical Method Validation'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-deepa-menon-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'Ph.D.',
        fieldOfStudy: 'Bio-Organic Chemistry & Pharmacology',
        startYear: 1998,
        endYear: 2003,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-deepa-usfda-cgmp',
        name: 'USFDA cGMP Inspections & Warning Letter Remediation',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-deepa-anda-filings',
        name: 'Complex Generics & ANDA Submission Strategy',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-deepa-api-compliance',
        name: 'API Synthesis Process Quality & Data Integrity',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-karan-mehta',
    name: 'Karan Mehta',
    currentHeadline: 'Senior Partner, Infrastructure & EPC Practice at Bain & Company India',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-bain-india',
      name: 'Bain & Company India',
      sector: 'Management Consulting',
      subsector: 'Infrastructure & Private Equity Practice',
    },
    currentRoleTitle: 'Senior Partner, Infrastructure & Industrials',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Strategic advisor with 20 years guiding engineering conglomerates, EPC contractors, and private equity sponsors on order-book profitability, working capital cycles, and project bidding discipline.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-karan-mehta-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-bain-india',
          name: 'Bain & Company India',
          sector: 'Management Consulting',
          subsector: 'Infrastructure & Private Equity Practice',
        },
        roleTitle: 'Senior Partner, Infrastructure & Industrials',
        department: 'Infrastructure, Energy & Private Equity',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2017-01',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Advising sovereign wealth funds and sovereign infra sponsors on port, highway, and transmission assets',
          'Restructuring project procurement and risk-weighted bidding criteria for Tier-1 EPC builders',
        ],
        relevantDomainTags: ['Infrastructure M&A', 'EPC Order Book Risk', 'Capital Goods Expansion'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-karan-mehta-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'LT',
          name: 'Larsen & Toubro Limited',
          isin: 'INE018A01030',
          sector: 'Construction',
          subsector: 'Civil Construction & Engineering',
        },
        roleTitle: 'VP, Heavy Civil Infrastructure Project Planning',
        department: 'Heavy Civil Infrastructure IC',
        seniority: 'SENIOR_VP_VP',
        startDate: '2008-05',
        endDate: '2016-12',
        isCurrent: false,
        responsibilities: [
          'Led operational planning for metro rail packages, deep-water ports, and underground tunneling projects',
          'Managed project working capital cycles, sub-contractor arbitration, and milestone billing collections',
        ],
        relevantDomainTags: ['Heavy Civil Contracting', 'Working Capital Optimization', 'Milestone Cash Flow'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-karan-mehta-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, Delhi, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Civil Engineering',
        startYear: 2000,
        endYear: 2004,
        provenance: 'SYNTHETIC',
      },
      {
        id: 'edu-karan-mehta-2',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-ahmedabad',
          name: 'Indian Institute of Management Ahmedabad',
          location: 'Ahmedabad, Gujarat, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'General Management & Strategy',
        startYear: 2004,
        endYear: 2006,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-karan-epc-bidding',
        name: 'EPC Order Book Quality & Margin Discipline',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-karan-infra-concessions',
        name: 'Public-Private Partnerships & Concession Agreements',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
      {
        id: 'exp-karan-working-capital',
        name: 'Heavy Civil Working Capital Cycles & Billing',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
    ],
  },
  {
    id: 'person-sunil-verma',
    name: 'Sunil Verma',
    currentHeadline: 'VP, Platform Architecture & Engineering at Zomato',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'ZOMATO',
      name: 'Zomato Limited',
      isin: 'INE758T01015',
      sector: 'Consumer Services',
      subsector: 'Internet & Direct Marketing Retail',
    },
    currentRoleTitle: 'VP, Platform Engineering & Distributed Systems',
    location: 'Gurugram, Haryana, India',
    summary:
      'Systems engineer with 15 years designing ultra-high concurrency distributed architectures, dynamic pricing engines, live order tracking pipelines, and dark store inventory synchronization.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-sunil-verma-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'ZOMATO',
          name: 'Zomato Limited',
          isin: 'INE758T01015',
          sector: 'Consumer Services',
          subsector: 'Internet & Direct Marketing Retail',
        },
        roleTitle: 'VP, Platform Engineering & Distributed Systems',
        department: 'Core Platform Engineering',
        seniority: 'SENIOR_VP_VP',
        startDate: '2022-04',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Architecting distributed real-time ordering and location ingestion infrastructure handling 2M+ peak orders/day',
          'Deploying low-latency microservices for Blinkit dark store inventory reservation and surge pricing',
        ],
        relevantDomainTags: ['High Concurrency Systems', 'Dynamic Surge Pricing', 'Inventory Latency'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-sunil-verma-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'SWIGGY',
          name: 'Swiggy Limited',
          isin: 'INE00H001014',
          sector: 'Consumer Services',
          subsector: 'Internet & Direct Marketing Retail',
        },
        roleTitle: 'Director, Platform Architecture',
        department: 'Core Infrastructure',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2017-09',
        endDate: '2022-03',
        isCurrent: false,
        responsibilities: [
          'Architected core event-streaming pipelines (Kafka) powering order tracking and delivery assignment',
          'Optimized cloud server footprints across AWS and GCP, reducing annual cloud compute costs by 22%',
        ],
        relevantDomainTags: ['Event Streaming Architecture', 'Cloud Infrastructure Optimization', 'Real-Time Dispatch'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-sunil-verma-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science and Engineering',
        startYear: 2007,
        endYear: 2011,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-sunil-distributed-systems',
        name: 'Ultra-High Concurrency Distributed Systems',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-sunil-realtime-pricing',
        name: 'Dynamic Pricing & Hyperlocal Demand Forecasting',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'PRACTITIONER',
      },
      {
        id: 'exp-sunil-cloud-unit-economics',
        name: 'Cloud Infrastructure Unit Cost Optimization',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
    ],
  },
  {
    id: 'person-radhika-iyer',
    name: 'Radhika Iyer',
    currentHeadline: 'EVP, Cognitive Systems & AI Transformation at Infosys',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'INFY',
      name: 'Infosys Limited',
      isin: 'INE009A01021',
      sector: 'Information Technology',
      subsector: 'IT Consulting & Software',
    },
    currentRoleTitle: 'EVP, Cognitive Systems & AI Transformation',
    location: 'Bengaluru, Karnataka, India',
    summary:
      'Enterprise software executive with 20 years leading large-scale multi-hundred-million-dollar digital transformations, enterprise SaaS implementations, and developer productivity automation.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-radhika-iyer-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'INFY',
          name: 'Infosys Limited',
          isin: 'INE009A01021',
          sector: 'Information Technology',
          subsector: 'IT Consulting & Software',
        },
        roleTitle: 'EVP, Cognitive Systems & AI Transformation',
        department: 'Enterprise AI & Emerging Tech',
        seniority: 'SENIOR_VP_VP',
        startDate: '2021-06',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing Topaz AI platform commercial rollout and enterprise client generative AI adoption',
          'Managing enterprise IT contract renewal pipelines with Fortune 100 retailers and manufacturers',
        ],
        relevantDomainTags: ['Enterprise AI Platforms', 'IT Services Deal Governance', 'Client Executive Engagement'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-radhika-iyer-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'WIPRO',
          name: 'Wipro Limited',
          isin: 'INE075A01022',
          sector: 'Information Technology',
          subsector: 'IT Consulting & Software',
        },
        roleTitle: 'Senior Director, Cloud Application Services',
        department: 'Cloud & Applications Unit',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2014-11',
        endDate: '2021-05',
        isCurrent: false,
        responsibilities: [
          'Led enterprise SAP/Oracle cloud migrations and managed services delivery across European clients',
          'Oversaw headcount utilization, offshore-onshore margin mix, and billable realization rates',
        ],
        relevantDomainTags: ['Cloud Migrations', 'Margin Mix Optimization', 'Offshore IT Delivery'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-radhika-iyer-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, Delhi, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science and Engineering',
        startYear: 2002,
        endYear: 2006,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-radhika-enterprise-ai',
        name: 'Enterprise Cognitive AI Platform Delivery',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-radhika-large-deal-gov',
        name: 'Tier-1 IT Services Contract Governance & Margins',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
      {
        id: 'exp-radhika-cloud-apps',
        name: 'Enterprise ERP & Cloud Application Transitions',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
  {
    id: 'person-manish-kapoor',
    name: 'Manish Kapoor',
    currentHeadline: 'VP, Global Sourcing & Powertrain Procurement at Maruti Suzuki',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'MARUTI',
      name: 'Maruti Suzuki India Limited',
      isin: 'INE585B01010',
      sector: 'Consumer Discretionary',
      subsector: 'Automobile Manufacturers',
    },
    currentRoleTitle: 'VP, Global Supply Chain & Powertrain Procurement',
    location: 'Gurugram, Haryana, India',
    summary:
      'Automotive supply chain veteran with 23 years in Tier-1 auto-component localization, internal combustion and EV powertrain sourcing, and steel/rare-earth metal price indexing.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-manish-kapoor-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'MARUTI',
          name: 'Maruti Suzuki India Limited',
          isin: 'INE585B01010',
          sector: 'Consumer Discretionary',
          subsector: 'Automobile Manufacturers',
        },
        roleTitle: 'VP, Global Supply Chain & Powertrain Procurement',
        department: 'Supply Chain & Sourcing',
        seniority: 'SENIOR_VP_VP',
        startDate: '2018-09',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing 2,000+ crore annual procurement book for hybrid powertrain assemblies and localized electronics',
          'Managing Tier-1 vendor contracts, commodity hedging pass-through clauses, and inventory turns',
        ],
        relevantDomainTags: ['Automotive Sourcing', 'Tier-1 Vendor Relations', 'Hybrid Powertrain Components'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-manish-kapoor-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'TATAMOTORS',
          name: 'Tata Motors Limited',
          isin: 'INE155A01022',
          sector: 'Consumer Discretionary',
          subsector: 'Automobile Manufacturers',
        },
        roleTitle: 'Head of Powertrain Component Sourcing',
        department: 'Commercial & Passenger Vehicle Procurement',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2011-04',
        endDate: '2018-08',
        isCurrent: false,
        responsibilities: [
          'Managed domestic supply chain localization for commercial vehicle engine and transmission lines',
          'Negotiated long-term steel contracts and auto-component supplier capacity reservation agreements',
        ],
        relevantDomainTags: ['CV Powertrain', 'Steel Price Pass-Through', 'Supplier Localization'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-manish-kapoor-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Mechanical Engineering',
        startYear: 1997,
        endYear: 2001,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-manish-auto-supply-chain',
        name: 'Auto-Component Localization & Vendor Capacity Sizing',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-manish-commodity-pass-through',
        name: 'Raw Material Hedging & Sourcing Contract Pass-Through',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-manish-ev-powertrain',
        name: 'EV & Hybrid Powertrain Component Architecture',
        category: 'TECHNOLOGY_PLATFORMS',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
  {
    id: 'person-neha-singh',
    name: 'Neha Singh',
    currentHeadline: 'Head of Omnichannel Expansion & Merchandising at Trent',
    currentOrganisation: {
      type: 'LISTED_NSE_BSE',
      ticker: 'TRENT',
      name: 'Trent Limited',
      isin: 'INE849A01020',
      sector: 'Consumer Discretionary',
      subsector: 'Apparel Retail',
    },
    currentRoleTitle: 'Head of Omnichannel Merchandising & Store Rollout',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Fashion retail and consumer goods specialist with 16 years in store-level inventory velocity, fast-fashion sourcing cycles, brand category management, and private-label margin enhancement.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-neha-singh-1',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'TRENT',
          name: 'Trent Limited',
          isin: 'INE849A01020',
          sector: 'Consumer Discretionary',
          subsector: 'Apparel Retail',
        },
        roleTitle: 'Head of Omnichannel Merchandising & Store Rollout',
        department: 'Zudio & Westside Growth Division',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2020-07',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Spearheading store network footprint expansion across Tier-2 and Tier-3 urban markets',
          'Governing 14-day design-to-rack fast fashion replenishment cycles and like-for-like sales tracking',
        ],
        relevantDomainTags: ['Fast Fashion Merchandising', 'Store Rollout Economics', 'Working Capital Turns'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-neha-singh-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'HINDUNILVR',
          name: 'Hindustan Unilever Limited',
          isin: 'INE030A01027',
          sector: 'Consumer Staples',
          subsector: 'Personal Care & Household Products',
        },
        roleTitle: 'Senior Category Director, Personal Care',
        department: 'Beauty & Personal Care Business Unit',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2013-05',
        endDate: '2020-06',
        isCurrent: false,
        responsibilities: [
          'Managed modern trade channel placement, distributor margins, and trade spend effectiveness',
          'Launched premium personal care extensions driving double-digit volume growth in urban markets',
        ],
        relevantDomainTags: ['FMCG Trade Spend', 'Distributor Margins', 'Brand Portfolio Management'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-neha-singh-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-bangalore',
          name: 'Indian Institute of Management Bangalore',
          location: 'Bengaluru, Karnataka, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Marketing & Supply Chain',
        startYear: 2009,
        endYear: 2011,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-neha-fast-fashion-turns',
        name: 'Fast Fashion Inventory Velocity & Sourcing Cycles',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-neha-retail-store-capex',
        name: 'Retail Store Rollout Payback & Unit Economics',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-neha-fmcg-distribution',
        name: 'Modern Trade Channel & FMCG Trade Promotion',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
  {
    id: 'person-amit-tandon',
    name: 'Amit Tandon',
    currentHeadline: 'Senior Partner & Consumer Tech Practice Lead at McKinsey & Company India',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-mckinsey-india',
      name: 'McKinsey & Company India',
      sector: 'Management Consulting',
      subsector: 'Private Equity & Consumer Tech Practice',
    },
    currentRoleTitle: 'Senior Partner, Consumer & Technology Practice',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Management consultant with 17 years advising institutional investors, internet conglomerates, and sovereign wealth funds on commercial due diligence, unit economics stress testing, and board governance.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-amit-tandon-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-mckinsey-india',
          name: 'McKinsey & Company India',
          sector: 'Management Consulting',
          subsector: 'Private Equity & Consumer Tech Practice',
        },
        roleTitle: 'Senior Partner, Consumer & Technology Practice',
        department: 'Private Equity & Principal Investors Practice',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2018-01',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Directing commercial diligence engagements on tech and retail market leaders across South Asia',
          'Advising boards and investment committees on competitive moats, CAC payback, and margin sustainability',
        ],
        relevantDomainTags: ['Commercial Due Diligence', 'Unit Economics Audits', 'Retail & Tech M&A'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-amit-tandon-2',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-mckinsey-india',
          name: 'McKinsey & Company India',
          sector: 'Management Consulting',
          subsector: 'Strategy Practice',
        },
        roleTitle: 'Associate Partner, Consumer & Retail',
        department: 'Consumer Goods Practice',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2013-06',
        endDate: '2017-12',
        isCurrent: false,
        responsibilities: [
          'Led growth strategy studies for Indian consumer product companies and omnichannel retailers',
          'Benchmarked supply chain and working capital practices across FMCG multinationals',
        ],
        relevantDomainTags: ['FMCG Growth Strategy', 'Supply Chain Benchmarking', 'Corporate Strategy'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-amit-tandon-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-delhi',
          name: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, Delhi, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Mechanical Engineering',
        startYear: 2005,
        endYear: 2009,
        provenance: 'SYNTHETIC',
      },
      {
        id: 'edu-amit-tandon-2',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-ahmedabad',
          name: 'Indian Institute of Management Ahmedabad',
          location: 'Ahmedabad, Gujarat, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Strategy & Finance',
        startYear: 2009,
        endYear: 2011,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-amit-commercial-dd',
        name: 'Private Equity Commercial Due Diligence & M&A',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-amit-consumer-tech-moats',
        name: 'Internet & Quick Commerce Unit Economic Moats',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-amit-board-gov',
        name: 'Corporate Governance & Strategic Board Advisory',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-kavita-iyer',
    name: 'Kavita Iyer',
    currentHeadline: 'Independent Board Director & Regulatory Counsel | Former Executive Director at SEBI',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-unlisted-valuebridge',
      name: 'ValueBridge Capital Advisory',
      sector: 'Governance & Regulatory Advisory',
    },
    currentRoleTitle: 'Senior Governance Counsel & Independent Director',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Capital markets and securities law authority with 26 years advising listed Indian corporate boards, audit committees, and regulators on SEBI LODR, takeover regulations, and insider trading compliance.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-kavita-iyer-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-unlisted-valuebridge',
          name: 'ValueBridge Capital Advisory',
          sector: 'Governance & Regulatory Advisory',
        },
        roleTitle: 'Senior Governance Counsel & Independent Director',
        department: 'Board Advisory & Corporate Governance',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2020-01',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Serving as Independent Director on audit and stakeholder relationship committees of listed companies',
          'Advising institutional boards on related-party transaction scrutiny and disclosure integrity',
        ],
        relevantDomainTags: ['Board Governance', 'Audit Committee Oversight', 'Related Party Transactions'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-kavita-iyer-2',
        organisation: {
          type: 'REGULATORY_GOVERNMENT',
          orgId: 'org-sebi',
          name: 'Securities and Exchange Board of India',
          jurisdiction: 'India Capital Markets',
        },
        roleTitle: 'Executive Director, Legal & Market Intermediaries',
        department: 'Division of Corporate Restructuring & Compliance',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2012-03',
        endDate: '2019-12',
        isCurrent: false,
        responsibilities: [
          'Formulated and administered SEBI (Listing Obligations and Disclosure Requirements) Regulations',
          'Adjudicated public disclosure enforcements, open offer exemptions, and takeover code matters',
        ],
        relevantDomainTags: ['SEBI LODR Compliance', 'Takeover Regulations', 'Market Conduct Surveillance'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-kavita-iyer-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-nlsiu-bangalore',
          name: 'National Law School of India University',
          location: 'Bengaluru, Karnataka, India',
        },
        degree: 'B.A. LL.B. (Hons)',
        fieldOfStudy: 'Corporate & Securities Law',
        startYear: 1993,
        endYear: 1998,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-kavita-sebi-lodr',
        name: 'SEBI LODR Compliance & Capital Markets Law',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-kavita-board-oversight',
        name: 'Board Audit Committee Governance & Related Party Audits',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-kavita-takeover-code',
        name: 'Takeover Regulations & Corporate Restructuring Law',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-rajesh-kulkarni',
    name: 'Rajesh Kulkarni',
    currentHeadline: 'Senior Managing Director, Special Situations & Distressed Debt at ValueBridge Capital',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-unlisted-valuebridge',
      name: 'ValueBridge Capital Advisory',
      sector: 'Private Credit & Special Situations',
    },
    currentRoleTitle: 'Senior Managing Director, Special Situations',
    location: 'Mumbai, Maharashtra, India',
    summary:
      'Stressed asset resolution and credit syndication specialist with 28 years managing corporate turnarounds, Insolvency and Bankruptcy Code (IBC) processes, and inter-creditor consortium pacts.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-rajesh-kulkarni-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-unlisted-valuebridge',
          name: 'ValueBridge Capital Advisory',
          sector: 'Private Credit & Special Situations',
        },
        roleTitle: 'Senior Managing Director, Special Situations',
        department: 'Stressed Assets & Credit Resolution',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2019-04',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Underwriting senior secured credit and mezzanine financing for corporate turnaround situations',
          'Representing creditor consortiums in NCLT debt resolution plans and asset monetization auctions',
        ],
        relevantDomainTags: ['IBC Stressed Resolution', 'Special Situations Credit', 'Turnaround Financing'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-rajesh-kulkarni-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'SBIN',
          name: 'State Bank of India',
          isin: 'INE062A01020',
          sector: 'Financial Services',
          subsector: 'Public Sector Bank',
        },
        roleTitle: 'Chief General Manager, Stressed Assets Resolution Group',
        department: 'Stressed Assets Resolution Group (SARG)',
        seniority: 'SENIOR_VP_VP',
        startDate: '2010-06',
        endDate: '2019-03',
        isCurrent: false,
        responsibilities: [
          'Led recovery and resolution for large corporate NPA accounts across steel, power, and infrastructure',
          'Chaired Joint Lenders Forums (JLF) and finalized debt resolution packages under RBI frameworks',
        ],
        relevantDomainTags: ['Corporate NPA Recovery', 'Joint Lenders Forums', 'NCLT Proceedings'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-rajesh-kulkarni-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-ahmedabad',
          name: 'Indian Institute of Management Ahmedabad',
          location: 'Ahmedabad, Gujarat, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Banking & Financial Management',
        startYear: 1993,
        endYear: 1995,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-rajesh-ibc-resolution',
        name: 'IBC Insolvency Resolution & NCLT Debt Workouts',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-rajesh-special-credit',
        name: 'Special Situations Mezzanine & Structured Credit',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-rajesh-creditor-consortium',
        name: 'Inter-Creditor Consortium Negotiation & Restructuring',
        category: 'FUNCTIONAL_OPERATIONS',
        proficiency: 'EXECUTIVE_OVERSIGHT',
      },
    ],
  },
  {
    id: 'person-tanvi-joshi',
    name: 'Tanvi Joshi',
    currentHeadline: 'Managing Director, Fintech & Growth Equity at Surge Venture Partners',
    currentOrganisation: {
      type: 'UNLISTED_CORPORATE',
      orgId: 'org-sequoia-surge',
      name: 'Surge Growth Ventures India',
      sector: 'Venture Capital & Growth Equity',
    },
    currentRoleTitle: 'Managing Director, Fintech & Digital Finance',
    location: 'Bengaluru, Karnataka, India',
    summary:
      'Venture capital investor and former payments operator with 15 years in UPI merchant payments, digital lending tech, payment aggregator licensing, and growth equity underwriting.',
    provenance: 'SYNTHETIC',
    isSynthetic: true,
    syntheticNotice: 'Synthetic demonstration profile for FINN Network Intelligence.',
    employmentHistory: [
      {
        id: 'emp-tanvi-joshi-1',
        organisation: {
          type: 'UNLISTED_CORPORATE',
          orgId: 'org-sequoia-surge',
          name: 'Surge Growth Ventures India',
          sector: 'Venture Capital & Growth Equity',
        },
        roleTitle: 'Managing Director, Fintech & Digital Finance',
        department: 'Growth Equity Investment Team',
        seniority: 'C_LEVEL_EXEC',
        startDate: '2021-01',
        endDate: null,
        isCurrent: true,
        responsibilities: [
          'Leading Series B and growth-stage equity investments in fintech, wealthtech, and digital lending platforms',
          'Serving as board observer on fast-growing Indian software and retail payments startups',
        ],
        relevantDomainTags: ['Fintech Venture Capital', 'Payment Gateway Economics', 'Digital Lending Scale'],
        provenance: 'SYNTHETIC',
      },
      {
        id: 'emp-tanvi-joshi-2',
        organisation: {
          type: 'LISTED_NSE_BSE',
          ticker: 'PAYTM',
          name: 'One97 Communications Limited',
          isin: 'INE982J01020',
          sector: 'Financial Services',
          subsector: 'Financial Technology (Fintech)',
        },
        roleTitle: 'Head of Strategic Investments & Merchant Partnerships',
        department: 'Corporate Development & Payments',
        seniority: 'DIRECTOR_LEAD',
        startDate: '2016-03',
        endDate: '2020-12',
        isCurrent: false,
        responsibilities: [
          'Led merchant acquiring ecosystem partnerships and offline QR deployment programs',
          'Managed corporate development investments and commercial partnerships with NBFCs for micro-lending',
        ],
        relevantDomainTags: ['Merchant Acquiring QR', 'Micro-Lending Partnerships', 'Payment Aggregation'],
        provenance: 'SYNTHETIC',
      },
    ],
    educationHistory: [
      {
        id: 'edu-tanvi-joshi-1',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iit-bombay',
          name: 'Indian Institute of Technology Bombay',
          location: 'Mumbai, Maharashtra, India',
        },
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science and Engineering',
        startYear: 2008,
        endYear: 2012,
        provenance: 'SYNTHETIC',
      },
      {
        id: 'edu-tanvi-joshi-2',
        institution: {
          type: 'EDUCATIONAL_INSTITUTION',
          orgId: 'org-iim-bangalore',
          name: 'Indian Institute of Management Bangalore',
          location: 'Bengaluru, Karnataka, India',
        },
        degree: 'Post Graduate Programme in Management (MBA)',
        fieldOfStudy: 'Finance & Strategy',
        startYear: 2012,
        endYear: 2014,
        provenance: 'SYNTHETIC',
      },
    ],
    expertise: [
      {
        id: 'exp-tanvi-fintech-vc',
        name: 'Fintech Valuation & Growth Equity Underwriting',
        category: 'CAPITAL_ALLOCATION',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-tanvi-payments-upi',
        name: 'Merchant Acquiring, UPI Ecosystem & Take Rates',
        category: 'SECTOR_INDUSTRY',
        proficiency: 'DEEP_OPERATIONAL_EXPERT',
      },
      {
        id: 'exp-tanvi-pa-reg',
        name: 'RBI Payment Aggregator (PA/PG) Regulatory Guidelines',
        category: 'GOVERNANCE_REGULATORY',
        proficiency: 'PRACTITIONER',
      },
    ],
  },
];

export const NETWORK_EDGES: readonly NetworkEdge[] = [
  // -------------------------------------------------------------
  // 16 Direct Investor Edges (from INVESTOR_ROOT to each persona)
  // Semantics: DIRECTED from INVESTOR_ROOT to the target persona.
  // -------------------------------------------------------------
  {
    id: 'edge-inv-arun-sharma',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-arun-sharma',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 4,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-09-18',
    contextAndEvidence:
      'Retained commercial advisor on downstream petrochemical crack spreads and refinery margin sensitivity models.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-vikram-sen',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-vikram-sen',
    relationshipType: 'FORMER_COLLEAGUE',
    connectionStrength: 5,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-10-04',
    contextAndEvidence:
      'Long-standing professional relationship spanning 12 years; former co-lead on enterprise software modernization programs.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-priya-nair',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-priya-nair',
    relationshipType: 'PORTFOLIO_EXECUTIVE',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-08-22',
    contextAndEvidence:
      'Met through fund advisory discussions regarding quick commerce store unit economics and supply chain dark store density.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-rohit-gupta',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-rohit-gupta',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 4,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-09-30',
    contextAndEvidence:
      'Consulted regularly for independent perspectives on retail credit asset quality and unsecured lending ECL provisions.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-ananya-deshmukh',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-ananya-deshmukh',
    relationshipType: 'CO_INVESTOR',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-07-15',
    contextAndEvidence:
      'Interacted through fixed income institutional syndicate briefings and commercial banking treasury conferences.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-siddharth-mehta',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-siddharth-mehta',
    relationshipType: 'PROFESSIONAL_ACQUAINTANCE',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-06-12',
    contextAndEvidence:
      'Regular contact established during national telecom infrastructure summits and 5G vendor procurement roundtables.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-deepa-menon',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-deepa-menon',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 4,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-09-05',
    contextAndEvidence:
      'Retained for expert regulatory diligence on USFDA Form 483 inspection observations and generic pipeline viability.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-karan-mehta',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-karan-mehta',
    relationshipType: 'FORMER_COLLEAGUE',
    connectionStrength: 5,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-10-11',
    contextAndEvidence:
      'Close strategic advisor and former consulting colleague; collaborates on infrastructure order book analysis.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-sunil-verma',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-sunil-verma',
    relationshipType: 'PROFESSIONAL_ACQUAINTANCE',
    connectionStrength: 2,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-05-19',
    contextAndEvidence:
      'Met at consumer tech engineering leaders forum; exchange notes on distributed real-time computing.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-radhika-iyer',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-radhika-iyer',
    relationshipType: 'UNIVERSITY_ALUMNI',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-08-14',
    contextAndEvidence:
      'Connected via technical institute alumni circle; consulted on large IT services vendor margin sustainability.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-manish-kapoor',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-manish-kapoor',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-07-28',
    contextAndEvidence:
      'Provides operational perspectives on automotive component localization and raw material cost pass-through mechanisms.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-neha-singh',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-neha-singh',
    relationshipType: 'PROFESSIONAL_ACQUAINTANCE',
    connectionStrength: 2,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-06-03',
    contextAndEvidence:
      'Met during Indian retail leadership conference; shared notes on Tier-2 fast-fashion store economics.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-amit-tandon',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-amit-tandon',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 5,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-10-18',
    contextAndEvidence:
      'Frequent collaborator on commercial due diligence, tech valuation frameworks, and corporate investment committee reviews.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-kavita-iyer',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-kavita-iyer',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 4,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-09-24',
    contextAndEvidence:
      'Serve together on advisory panels for corporate governance, audit standards, and SEBI compliance best practices.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-rajesh-kulkarni',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-rajesh-kulkarni',
    relationshipType: 'CO_INVESTOR',
    connectionStrength: 4,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-08-08',
    contextAndEvidence:
      'Co-participated in credit syndicate assessments and debt restructuring review boards.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-inv-tanvi-joshi',
    sourceNodeId: 'INVESTOR_ROOT',
    targetNodeId: 'person-tanvi-joshi',
    relationshipType: 'CO_INVESTOR',
    connectionStrength: 3,
    directionality: 'DIRECTED',
    isDirected: true,
    lastInteractionDate: '2024-07-02',
    contextAndEvidence:
      'Co-evaluated growth-stage fintech balance sheets and digital payment unit economics.',
    provenance: 'SYNTHETIC',
  },

  // -------------------------------------------------------------
  // 10 Person-to-Person Edges (Explicitly UNDIRECTED mutual ties)
  // Semantics: Symmetric mutual ties between peers; traversal can proceed in either direction.
  // -------------------------------------------------------------
  {
    id: 'edge-p2p-sen-radhika',
    sourceNodeId: 'person-vikram-sen',
    targetNodeId: 'person-radhika-iyer',
    relationshipType: 'FORMER_COLLEAGUE',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-09-12',
    contextAndEvidence:
      'Collaborated on cross-enterprise IT transformation frameworks and global delivery governance while working across tier-1 Indian IT services firms.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-sen-amit',
    sourceNodeId: 'person-vikram-sen',
    targetNodeId: 'person-amit-tandon',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-10-02',
    contextAndEvidence:
      'Joint steering committee members for enterprise digital transformation and AI commercialization initiatives.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-priya-sunil',
    sourceNodeId: 'person-priya-nair',
    targetNodeId: 'person-sunil-verma',
    relationshipType: 'FORMER_COLLEAGUE',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-08-30',
    contextAndEvidence:
      'Collaborated closely across product and platform engineering teams on real-time order dispatch and dark store inventory synchronization.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-priya-amit',
    sourceNodeId: 'person-priya-nair',
    targetNodeId: 'person-amit-tandon',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 3,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-07-19',
    contextAndEvidence:
      'Consulted on quick commerce dark store profitability benchmarks and customer retention economics.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-rohit-ananya',
    sourceNodeId: 'person-rohit-gupta',
    targetNodeId: 'person-ananya-deshmukh',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 3,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-06-25',
    contextAndEvidence:
      'Co-participants on industry retail banking credit risk panels and asset-liability management working groups.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-deepa-kavita',
    sourceNodeId: 'person-deepa-menon',
    targetNodeId: 'person-kavita-iyer',
    relationshipType: 'INDUSTRY_ADVISOR',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-09-14',
    contextAndEvidence:
      'Collaborated on regulatory audit governance, clinical compliance oversight, and pharmaceutical M&A disclosure standards.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-karan-manish',
    sourceNodeId: 'person-karan-mehta',
    targetNodeId: 'person-manish-kapoor',
    relationshipType: 'UNIVERSITY_ALUMNI',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-08-11',
    contextAndEvidence:
      'Long-standing technical institute alumni contact; exchange operational perspectives on capital goods procurement and domestic manufacturing supply chains.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-karan-amit',
    sourceNodeId: 'person-karan-mehta',
    targetNodeId: 'person-amit-tandon',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 5,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-10-15',
    contextAndEvidence:
      'Co-authored strategic infrastructure investment briefings and participated in industrial manufacturing competitiveness roundtables.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-kavita-rajesh',
    sourceNodeId: 'person-kavita-iyer',
    targetNodeId: 'person-rajesh-kulkarni',
    relationshipType: 'BOARD_PEER',
    connectionStrength: 4,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-08-20',
    contextAndEvidence:
      'Collaborated on creditor committee legal governance, IBC distressed asset auctions, and resolution plan compliance.',
    provenance: 'SYNTHETIC',
  },
  {
    id: 'edge-p2p-tanvi-amit',
    sourceNodeId: 'person-tanvi-joshi',
    targetNodeId: 'person-amit-tandon',
    relationshipType: 'CO_INVESTOR',
    connectionStrength: 3,
    directionality: 'UNDIRECTED',
    isDirected: false,
    lastInteractionDate: '2024-07-10',
    contextAndEvidence:
      'Co-evaluated private market fintech commercial due diligence and payment gateway unit economics.',
    provenance: 'SYNTHETIC',
  },
];

export const NETWORK_DATASET: NetworkDataset = {
  rootInvestorId: 'INVESTOR_ROOT',
  metadata: {
    schemaVersion: '1.0.0',
    generatedAt: '2024-11-14T12:00:00Z',
    totalPersonas: 16,
    totalDirectEdges: 16,
    totalSecondDegreeEdges: 10,
    provenanceNotice:
      'SYNTHETIC DEMONSTRATION DATASET: All individuals, relationships, and private affiliations are synthetic constructs for FINN algorithmic validation.',
  },
  people: NETWORK_PERSONAS,
  edges: NETWORK_EDGES,
};

/**
 * Validates whether a date string strictly follows supported YYYY or YYYY-MM format.
 * Rejects non-strings, malformed formats, and invalid calendar months (e.g. 2020-13 or 2020-00).
 */
export function isValidDateFormat(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})(?:-(0[1-9]|1[0-2]))?$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  return year >= 1900 && year <= 2100;
}

/**
 * Parses a valid YYYY or YYYY-MM date string into an integer comparable (YYYYMM).
 * For start dates without a month, defaults to month 01.
 * For end dates without a month, defaults to month 12.
 */
export function parseDateToComparable(dateStr: string, isEnd = false): number | null {
  if (!isValidDateFormat(dateStr)) return null;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts.length === 2 ? parseInt(parts[1], 10) : (isEnd ? 12 : 1);
  return year * 100 + month;
}

/**
 * Validates the network dataset against all structural, domain, and data-integrity constraints.
 * Returns a NetworkValidationResult with complete list of failure diagnostics.
 */
export function validateNetworkDataset(dataset: NetworkDataset): NetworkValidationResult {
  const failures: string[] = [];

  // 1. Verify exactly 16 personas
  if (dataset.people.length !== 16) {
    failures.push(`Expected exactly 16 personas, found ${dataset.people.length}`);
  }

  const personIdSet = new Set<string>();
  const allIdsSet = new Set<string>();

  for (const person of dataset.people) {
    // 2. Person ID non-empty and starts with 'person-'
    if (!person.id || !person.id.startsWith('person-')) {
      failures.push(`Person ID '${person.id}' must be non-empty and start with 'person-'`);
    }

    // 3. Unique person ID
    if (personIdSet.has(person.id)) {
      failures.push(`Duplicate person ID detected: '${person.id}'`);
    }
    personIdSet.add(person.id);

    // Global ID uniqueness across all categories
    if (allIdsSet.has(person.id)) {
      failures.push(`Duplicate ID detected across dataset: '${person.id}'`);
    }
    allIdsSet.add(person.id);

    // 4. Provenance SYNTHETIC and isSynthetic true
    if (person.provenance !== 'SYNTHETIC') {
      failures.push(`Person '${person.id}' has provenance '${person.provenance}', expected 'SYNTHETIC'`);
    }
    if (person.isSynthetic !== true) {
      failures.push(`Person '${person.id}' must have isSynthetic === true`);
    }

    // Employment record checks
    let currentRoleCount = 0;
    let currentEmpRecord: EmploymentRecord | null = null;
    const previousEmpRecords: EmploymentRecord[] = [];

    for (const emp of person.employmentHistory) {
      if (allIdsSet.has(emp.id)) {
        failures.push(`Duplicate ID detected across dataset: '${emp.id}'`);
      }
      allIdsSet.add(emp.id);

      // Validate startDate format strictly
      if (!isValidDateFormat(emp.startDate)) {
        failures.push(`Invalid startDate format '${emp.startDate}' in employment '${emp.id}' of person '${person.id}'. Expected YYYY or YYYY-MM.`);
      }

      if (emp.isCurrent) {
        currentRoleCount += 1;
        currentEmpRecord = emp;

        // Current role must strictly have endDate === null
        if (emp.endDate !== null) {
          failures.push(`Current employment '${emp.id}' of person '${person.id}' must have endDate === null`);

          // If an endDate was provided anyway, check format and chronological ordering
          if (emp.endDate !== undefined && !isValidDateFormat(emp.endDate)) {
            failures.push(`Invalid endDate format '${emp.endDate}' in employment '${emp.id}' of person '${person.id}'. Expected YYYY or YYYY-MM.`);
          } else if (isValidDateFormat(emp.startDate) && isValidDateFormat(emp.endDate)) {
            const startComp = parseDateToComparable(emp.startDate, false)!;
            const endComp = parseDateToComparable(emp.endDate, true)!;
            if (startComp > endComp) {
              failures.push(`Current employment '${emp.id}' of person '${person.id}' has reversed dates: startDate (${emp.startDate}) is after endDate (${emp.endDate})`);
            }
          }
        }
      } else {
        previousEmpRecords.push(emp);

        // Previous role must have non-null endDate
        if (emp.endDate === null || emp.endDate === undefined) {
          failures.push(`Non-current employment '${emp.id}' of person '${person.id}' must have a non-null endDate`);
        } else {
          if (!isValidDateFormat(emp.endDate)) {
            failures.push(`Invalid endDate format '${emp.endDate}' in employment '${emp.id}' of person '${person.id}'. Expected YYYY or YYYY-MM.`);
          } else if (isValidDateFormat(emp.startDate)) {
            const startComp = parseDateToComparable(emp.startDate, false)!;
            const endComp = parseDateToComparable(emp.endDate, true)!;
            if (startComp > endComp) {
              failures.push(`Previous employment '${emp.id}' of person '${person.id}' has reversed dates: startDate (${emp.startDate}) is after endDate (${emp.endDate})`);
            }
          }
        }
      }

      if (emp.organisation.type === 'LISTED_NSE_BSE') {
        const ticker = emp.organisation.ticker;
        if (!LOCAL_VERIFIED_SYMBOL_REGISTRY[ticker]) {
          failures.push(`Employment '${emp.id}' references unindexed ticker '${ticker}' not in LOCAL_VERIFIED_SYMBOL_REGISTRY`);
        }
      }
    }

    // Career chronology check: current role should start after/with earlier roles
    if (currentEmpRecord && isValidDateFormat(currentEmpRecord.startDate)) {
      const currentStartComp = parseDateToComparable(currentEmpRecord.startDate, false)!;
      for (const prev of previousEmpRecords) {
        if (isValidDateFormat(prev.startDate)) {
          const prevStartComp = parseDateToComparable(prev.startDate, false)!;
          if (currentStartComp < prevStartComp) {
            failures.push(`Current employment '${currentEmpRecord.id}' of person '${person.id}' has reversed career dates: startDate (${currentEmpRecord.startDate}) is before previous role '${prev.id}' startDate (${prev.startDate})`);
          }
        }
      }
    }

    // Current employment consistency checks
    if (currentRoleCount > 1) {
      failures.push(`Person '${person.id}' has ${currentRoleCount} current roles (maximum 1 permitted)`);
    } else if (currentRoleCount === 0) {
      if (person.currentOrganisation !== undefined || person.currentRoleTitle !== undefined) {
        failures.push(`Person '${person.id}' has no current employment record, but currentOrganisation or currentRoleTitle is specified`);
      }
    } else if (currentRoleCount === 1 && currentEmpRecord) {
      // Must match currentRoleTitle
      if (!person.currentRoleTitle) {
        failures.push(`Person '${person.id}' has a current employment record but missing currentRoleTitle`);
      } else if (person.currentRoleTitle !== currentEmpRecord.roleTitle) {
        failures.push(`Person '${person.id}' currentRoleTitle ('${person.currentRoleTitle}') does not match current employment roleTitle ('${currentEmpRecord.roleTitle}')`);
      }

      // Must match currentOrganisation
      if (!person.currentOrganisation) {
        failures.push(`Person '${person.id}' has a current employment record but missing currentOrganisation`);
      } else {
        let orgMatches = true;
        if (person.currentOrganisation.type !== currentEmpRecord.organisation.type) {
          orgMatches = false;
        } else if (person.currentOrganisation.name !== currentEmpRecord.organisation.name) {
          orgMatches = false;
        } else if (person.currentOrganisation.type === 'LISTED_NSE_BSE') {
          const pOrg = person.currentOrganisation as ListedOrganisationRef;
          const eOrg = currentEmpRecord.organisation as ListedOrganisationRef;
          if (pOrg.ticker !== eOrg.ticker) orgMatches = false;
        } else {
          const pOrg = person.currentOrganisation as any;
          const eOrg = currentEmpRecord.organisation as any;
          if (pOrg.orgId !== eOrg.orgId) orgMatches = false;
        }

        if (!orgMatches) {
          failures.push(`Person '${person.id}' currentOrganisation does not match current employment organisation`);
        }
      }
    }

    // Education record checks
    for (const edu of person.educationHistory) {
      if (allIdsSet.has(edu.id)) {
        failures.push(`Duplicate ID detected across dataset: '${edu.id}'`);
      }
      allIdsSet.add(edu.id);

      if (edu.institution.type !== 'EDUCATIONAL_INSTITUTION') {
        failures.push(`Education '${edu.id}' institution type must be 'EDUCATIONAL_INSTITUTION', got '${edu.institution.type}'`);
      }

      const validStartYear =
        edu.startYear === undefined ||
        (Number.isInteger(edu.startYear) && edu.startYear >= 1900 && edu.startYear <= 2100);
      const validEndYear =
        edu.endYear === undefined ||
        (Number.isInteger(edu.endYear) && edu.endYear >= 1900 && edu.endYear <= 2100);

      if (!validStartYear || !validEndYear) {
        failures.push(`Education '${edu.id}' of person '${person.id}' has invalid year values (startYear: ${edu.startYear}, endYear: ${edu.endYear})`);
      } else if (edu.startYear !== undefined && edu.endYear !== undefined) {
        if (edu.startYear > edu.endYear) {
          failures.push(`Education '${edu.id}' of person '${person.id}' has reversed years: startYear (${edu.startYear}) > endYear (${edu.endYear})`);
        }
      }
    }

    // Expertise tags check
    if (!person.expertise || person.expertise.length === 0) {
      failures.push(`Person '${person.id}' must have at least one expertise tag`);
    }
    for (const exp of person.expertise) {
      if (allIdsSet.has(exp.id)) {
        failures.push(`Duplicate ID detected across dataset: '${exp.id}'`);
      }
      allIdsSet.add(exp.id);
    }
  }

  // Edge checks
  let directInvestorEdges = 0;
  let personToPersonEdges = 0;
  const connectedToInvestor = new Set<string>();

  for (const edge of dataset.edges) {
    if (allIdsSet.has(edge.id)) {
      failures.push(`Duplicate ID detected across dataset: '${edge.id}'`);
    }
    allIdsSet.add(edge.id);

    // No self-edges
    if (edge.sourceNodeId === edge.targetNodeId) {
      failures.push(`Self-edge detected: '${edge.id}' has sourceNodeId === targetNodeId ('${edge.sourceNodeId}')`);
    }

    // Connection strength 1-5
    if (
      !Number.isInteger(edge.connectionStrength) ||
      edge.connectionStrength < 1 ||
      edge.connectionStrength > 5
    ) {
      failures.push(`Edge '${edge.id}' has invalid connectionStrength ${edge.connectionStrength} (must be integer 1-5)`);
    }

    // Directionality invariants
    if (edge.sourceNodeId === 'INVESTOR_ROOT') {
      if (edge.directionality !== 'DIRECTED' || edge.isDirected !== true) {
        failures.push(`Investor edge '${edge.id}' must be DIRECTED with isDirected === true`);
      }
    } else {
      if (edge.directionality !== 'UNDIRECTED' || edge.isDirected !== false) {
        failures.push(`Person-to-person edge '${edge.id}' must be UNDIRECTED with isDirected === false`);
      }
    }

    // Valid endpoints
    const isSourceInvestor = edge.sourceNodeId === 'INVESTOR_ROOT';
    const isSourcePerson = personIdSet.has(edge.sourceNodeId);
    const isTargetPerson = personIdSet.has(edge.targetNodeId);

    if (!isSourceInvestor && !isSourcePerson) {
      failures.push(`Edge '${edge.id}' sourceNodeId '${edge.sourceNodeId}' is neither 'INVESTOR_ROOT' nor a known person`);
    }
    if (!isTargetPerson) {
      failures.push(`Edge '${edge.id}' targetNodeId '${edge.targetNodeId}' is not a known person`);
    }

    if (isSourceInvestor) {
      directInvestorEdges += 1;
      if (isTargetPerson) {
        connectedToInvestor.add(edge.targetNodeId);
      }
    } else {
      personToPersonEdges += 1;
    }
  }

  // Exactly 16 direct investor edges
  if (directInvestorEdges !== 16) {
    failures.push(`Expected exactly 16 direct investor edges, found ${directInvestorEdges}`);
  }

  // Every person connected directly to INVESTOR_ROOT
  for (const person of dataset.people) {
    if (!connectedToInvestor.has(person.id)) {
      failures.push(`Person '${person.id}' does not have a direct edge connecting from 'INVESTOR_ROOT'`);
    }
  }

  // At least 8 P2P edges
  if (personToPersonEdges < 8) {
    failures.push(`Expected at least 8 person-to-person edges, found ${personToPersonEdges}`);
  }

  return {
    isValid: failures.length === 0,
    totalPersonas: dataset.people.length,
    totalEdges: dataset.edges.length,
    directInvestorEdges,
    personToPersonEdges,
    failures,
  };
}

