import React, { useState, useMemo } from 'react';
import {
  Person,
  ContactRecommendation,
  NetworkSearchResult,
  ExpertiseCategory,
  QueryExecutionResult,
} from '../types/network';
import { NETWORK_DATASET } from '../data/networkData';
import {
  buildNetworkGraph,
  computeNetworkOverviewMetrics,
  getContactsForCompany,
  getContactsForSector,
  getContactsForExpertise,
  searchNetwork,
  findIntroductionPaths,
} from '../services/networkService';
import {
  queryNetworkNaturalLanguage,
} from '../services/networkQueryService';
import { NetworkOverviewCards } from './network/NetworkOverviewCards';
import { NetworkContactCard } from './network/NetworkContactCard';
import { NetworkContactProfileModal } from './network/NetworkContactProfileModal';
import { NetworkPathVisualizer } from './network/NetworkPathVisualizer';
import {
  Search,
  Building2,
  Filter,
  Users,
  Compass,
  Tag,
  Briefcase,
  RotateCcw,
  Info,
  Sparkles,
} from './icons';

export type NetworkQueryMode =
  | 'NATURAL_QUERY'
  | 'DISCOVERY'
  | 'COMPANY'
  | 'SECTOR'
  | 'EXPERTISE'
  | 'ALL_DIRECTORY';

const SUGGESTED_COPILOT_QUESTIONS = [
  'Who can help me understand Reliance?',
  'Who has experience in the banking sector?',
  'Who can connect me to Vikram Sen?',
  'Who understands refining margins?',
  'Who has worked at TCS?',
  'Who can connect me to the new MD of Company X?',
];

const SUGGESTED_COMPANIES = [
  'RELIANCE',
  'TCS',
  'INFY',
  'HDFCBANK',
  'SWIGGY',
  'ZOMATO',
  'BAJFINANCE',
  'BHARTIARTL',
  'MARUTI',
  'SUNPHARMA',
];

const SUGGESTED_SECTORS = [
  'Energy',
  'Information Technology',
  'Financial Services',
  'Consumer Services',
  'Consumer Discretionary',
  'Healthcare',
  'Telecommunications',
  'Construction',
];

const SUGGESTED_EXPERTISE = [
  'Refining Margins',
  'Cloud Migration',
  'NPA Provisioning',
  'Quick Commerce',
  'Automobile Distribution',
  'Specialty Generics',
  'Telecom Tariffs',
  'Capital Allocation',
];

const SUGGESTED_DISCOVERY_QUERIES = [
  'Vikram Sen',
  'Director',
  'Reliance',
  'Refining',
  'Banking',
  'Swiggy',
  'McKinsey',
];

export const NetworkView: React.FC = () => {
  // 1. Build and memoize the immutable NetworkGraph instance
  const graph = useMemo(() => {
    return buildNetworkGraph(NETWORK_DATASET);
  }, []);

  // 2. Compute high-level overview metrics
  const metrics = useMemo(() => {
    return computeNetworkOverviewMetrics(graph);
  }, [graph]);

  // 3. UI State
  const [queryMode, setQueryMode] = useState<NetworkQueryMode>('NATURAL_QUERY');
  const [naturalQueryInput, setNaturalQueryInput] = useState<string>('Who can help me understand Reliance?');
  const [executedNaturalQuery, setExecutedNaturalQuery] = useState<string>('Who can help me understand Reliance?');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('RELIANCE');
  const [selectedSector, setSelectedSector] = useState<string>('Energy');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('Refining Margins');
  const [degreeFilter, setDegreeFilter] = useState<'ALL' | '1' | '2'>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [overviewCategoryFilter, setOverviewCategoryFilter] = useState<ExpertiseCategory | 'ALL'>('ALL');

  // 4. Natural query execution
  const naturalQueryResult: QueryExecutionResult | null = useMemo(() => {
    if (queryMode !== 'NATURAL_QUERY' || !executedNaturalQuery.trim()) {
      return null;
    }
    return queryNetworkNaturalLanguage(executedNaturalQuery, graph);
  }, [queryMode, executedNaturalQuery, graph]);

  // 5. Derive contacts based on the active query mode
  const { recommendations, searchResults, directoryPeople } = useMemo(() => {
    let recs: ContactRecommendation[] | undefined = undefined;
    let sResults: NetworkSearchResult[] | undefined = undefined;
    let dirList: Person[] | undefined = undefined;

    if (queryMode === 'NATURAL_QUERY') {
      recs = naturalQueryResult ? Array.from(naturalQueryResult.recommendations) : [];
    } else if (queryMode === 'DISCOVERY') {
      if (searchQuery.trim()) {
        sResults = searchNetwork(searchQuery, graph);
      } else {
        sResults = [];
      }
    } else if (queryMode === 'COMPANY') {
      recs = getContactsForCompany(selectedCompany, graph);
    } else if (queryMode === 'SECTOR') {
      recs = getContactsForSector(selectedSector, graph);
    } else if (queryMode === 'EXPERTISE') {
      recs = getContactsForExpertise(selectedExpertise, graph);
    } else if (queryMode === 'ALL_DIRECTORY') {
      dirList = Array.from(graph.people.values());
    }

    return {
      recommendations: recs,
      searchResults: sResults,
      directoryPeople: dirList,
    };
  }, [queryMode, naturalQueryResult, searchQuery, selectedCompany, selectedSector, selectedExpertise, graph]);

  // 5. Apply degree filter and category filter
  const filteredItems = useMemo(() => {
    if (queryMode === 'DISCOVERY' && searchResults) {
      let list = searchResults;
      if (degreeFilter !== 'ALL') {
        const targetDeg = Number(degreeFilter);
        list = list.filter((r) => r.degree === targetDeg);
      }
      if (overviewCategoryFilter !== 'ALL') {
        list = list.filter((r) =>
          r.person.expertise.some((e) => e.category === overviewCategoryFilter)
        );
      }
      return { kind: 'SEARCH', items: list };
    }

    if (recommendations) {
      let list = recommendations;
      if (degreeFilter !== 'ALL') {
        const targetDeg = Number(degreeFilter);
        list = list.filter((r) => r.degree === targetDeg);
      }
      if (overviewCategoryFilter !== 'ALL') {
        list = list.filter((r) =>
          r.person.expertise.some((e) => e.category === overviewCategoryFilter)
        );
      }
      return { kind: 'RECOMMENDATION', items: list };
    }

    if (directoryPeople) {
      let list = directoryPeople;
      if (degreeFilter !== 'ALL') {
        const targetDeg = Number(degreeFilter);
        list = list.filter((p) => {
          const paths = findIntroductionPaths(p.id, graph);
          return paths.some((path) => path.degree === targetDeg);
        });
      }
      if (overviewCategoryFilter !== 'ALL') {
        list = list.filter((p) =>
          p.expertise.some((e) => e.category === overviewCategoryFilter)
        );
      }
      return { kind: 'DIRECTORY', items: list };
    }

    return { kind: 'EMPTY', items: [] };
  }, [queryMode, recommendations, searchResults, directoryPeople, degreeFilter, overviewCategoryFilter, graph]);

  const resetFilters = () => {
    setQueryMode('NATURAL_QUERY');
    setNaturalQueryInput('Who can help me understand Reliance?');
    setExecutedNaturalQuery('Who can help me understand Reliance?');
    setSearchQuery('');
    setDegreeFilter('ALL');
    setOverviewCategoryFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Overview Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                <span>Network Intelligence</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                16 Prototype Ties
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deterministic relationship intelligence graph for Indian equity markets. Discover synthetic network profiles, past corporate tenure, peer-sector operators, and introduction paths.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Active Investor Root:</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-bold">
              INVESTOR_ROOT
            </span>
          </div>
        </div>

        {/* Dynamic Graph KPI Overview */}
        <div className="pt-2">
          <NetworkOverviewCards
            metrics={metrics}
            selectedCategory={overviewCategoryFilter}
            onSelectCategory={setOverviewCategoryFilter}
          />
        </div>
      </div>

      {/* 2. Query Mode Tabs & Filters */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Navigation Mode Pill Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setQueryMode('NATURAL_QUERY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'NATURAL_QUERY'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Network Copilot</span>
            </button>

            <button
              onClick={() => setQueryMode('DISCOVERY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'DISCOVERY'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discovery Search</span>
            </button>

            <button
              onClick={() => setQueryMode('COMPANY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'COMPANY'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>By Listed Company</span>
            </button>

            <button
              onClick={() => setQueryMode('SECTOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'SECTOR'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>By Sector</span>
            </button>

            <button
              onClick={() => setQueryMode('EXPERTISE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'EXPERTISE'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>By Expertise</span>
            </button>

            <button
              onClick={() => setQueryMode('ALL_DIRECTORY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                queryMode === 'ALL_DIRECTORY'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Full Directory ({metrics.totalContacts})</span>
            </button>
          </div>

          {/* Relationship Degree Filter Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Degree:</span>
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setDegreeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition ${
                  degreeFilter === 'ALL'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDegreeFilter('1')}
                className={`px-2.5 py-1 rounded-md transition ${
                  degreeFilter === '1'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Direct 1st-Degree Investor Connections"
              >
                1st Degree
              </button>
              <button
                onClick={() => setDegreeFilter('2')}
                className={`px-2.5 py-1 rounded-md transition ${
                  degreeFilter === '2'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Second-Degree Mutual Referral Ties"
              >
                2nd Degree
              </button>
            </div>
          </div>
        </div>

        {/* Mode-Specific Input Controls */}
        <div>
          {queryMode === 'NATURAL_QUERY' ? (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (naturalQueryInput.trim()) {
                    setExecutedNaturalQuery(naturalQueryInput.trim());
                  }
                }}
                className="space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={naturalQueryInput}
                      onChange={(e) => setNaturalQueryInput(e.target.value)}
                      placeholder="Ask an investment question (e.g. 'Who can help me understand Reliance?', 'Who has worked at TCS?')..."
                      className="w-full pl-10 pr-14 py-2.5 rounded-lg bg-slate-950 border border-indigo-500/40 focus:border-indigo-400 focus:outline-none text-white text-xs sm:text-sm font-sans placeholder-slate-500 shadow-inner"
                    />
                    {naturalQueryInput && (
                      <button
                        type="button"
                        onClick={() => setNaturalQueryInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Copilot</span>
                  </button>
                </div>

                {/* Example Inquiries Pills */}
                <div className="flex items-center flex-wrap gap-1.5 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">Example Inquiries:</span>
                  {SUGGESTED_COPILOT_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setNaturalQueryInput(q);
                        setExecutedNaturalQuery(q);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-indigo-950 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 text-[11px] font-sans border border-slate-700/60 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </form>

              {/* Interpretation Banner */}
              {naturalQueryResult && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">Interpreted Intent:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          naturalQueryResult.query.intent === 'COMPANY'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : naturalQueryResult.query.intent === 'SECTOR'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : naturalQueryResult.query.intent === 'EXPERTISE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : naturalQueryResult.query.intent === 'ORGANISATION_HISTORY'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : naturalQueryResult.query.intent === 'PERSON_CONNECTION'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {naturalQueryResult.query.interpretationLabel}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Match: <strong className="text-indigo-300">{naturalQueryResult.query.confidence}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {naturalQueryResult.query.explanation}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="font-medium text-slate-300">{naturalQueryResult.statusMessage}</span>
                    <span className="italic text-slate-500 hidden sm:inline">{naturalQueryResult.provenanceNotice}</span>
                  </div>
                </div>
              )}
            </div>
          ) : queryMode === 'DISCOVERY' ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search network contacts by name, role, organisation, or skill (e.g. 'Vikram', 'Refining', 'Director')..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:outline-none text-white text-xs sm:text-sm font-sans placeholder-slate-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick suggestion search pills */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Suggested Searches:</span>
                {SUGGESTED_DISCOVERY_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setSearchQuery(q)}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : queryMode === 'COMPANY' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                <span>Select or query a listed NSE/BSE equity ticker to rank relevant contacts:</span>
                <span className="font-mono text-indigo-300">
                  Active Company: <strong className="text-white">{selectedCompany}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_COMPANIES.map((ticker) => {
                  const isSelected = selectedCompany === ticker;
                  return (
                    <button
                      key={ticker}
                      onClick={() => setSelectedCompany(ticker)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {ticker}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : queryMode === 'SECTOR' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                <span>Select an industry sector to rank contacts by operator & advisory experience:</span>
                <span className="font-mono text-indigo-300">
                  Active Sector: <strong className="text-white">{selectedSector}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SECTORS.map((sector) => {
                  const isSelected = selectedSector === sector;
                  return (
                    <button
                      key={sector}
                      onClick={() => setSelectedSector(sector)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm border border-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : queryMode === 'EXPERTISE' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                <span>Select a domain specialty or operational capability:</span>
                <span className="font-mono text-indigo-300">
                  Active Skill: <strong className="text-white">{selectedExpertise}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_EXPERTISE.map((exp) => {
                  const isSelected = selectedExpertise === exp;
                  return (
                    <button
                      key={exp}
                      onClick={() => setSelectedExpertise(exp)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm border border-indigo-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {exp}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Browsing all {metrics.totalContacts} synthetic profiles in the network index.</span>
              <span className="font-mono text-indigo-300">Ranked by Connection Strength</span>
            </div>
          )}
        </div>

        {/* Scoring Distinction Callout */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[11px] leading-relaxed">
            {queryMode === 'NATURAL_QUERY' ? (
              <span>
                <strong>Copilot Natural Query:</strong> Deterministic intent interpretation maps your investment question to companies, sectors, expertise, or persona connection paths. Contacts are ranked by domain relevance (65%) and accessibility (35%).
              </span>
            ) : queryMode === 'DISCOVERY' ? (
              <span>
                <strong>Discovery Mode:</strong> Search Ranking combines textual match quality (70%) with relationship accessibility (30%). Search matches are highlighted across names, roles, and profiles.
              </span>
            ) : queryMode === 'ALL_DIRECTORY' ? (
              <span>
                <strong>Directory Mode:</strong> Viewing all synthetic network profiles. Click on any contact card to inspect full career history, mutual paths, and domain proficiencies.
              </span>
            ) : (
              <span>
                <strong>Relevance Ranking:</strong> Overall Score strictly balances <strong>Domain Relevance (65%)</strong> (direct corporate tenure, sector peer experience, profile domain skills) and <strong>Relationship Accessibility (35%)</strong> (path length & tie strengths).
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Results Section */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {queryMode === 'NATURAL_QUERY'
                ? naturalQueryResult?.query.intent === 'PERSON_CONNECTION'
                  ? `Target Contact (${filteredItems.items.length})`
                  : `Copilot Recommendations (${filteredItems.items.length})`
                : queryMode === 'DISCOVERY'
                ? `Search Results (${filteredItems.items.length})`
                : queryMode === 'COMPANY'
                ? `Relevant Contacts for ${selectedCompany} (${filteredItems.items.length})`
                : queryMode === 'SECTOR'
                ? `Relevant Contacts for ${selectedSector} (${filteredItems.items.length})`
                : queryMode === 'EXPERTISE'
                ? `Relevant Contacts for "${selectedExpertise}" (${filteredItems.items.length})`
                : `Network Contacts Directory (${filteredItems.items.length})`}
            </span>
            {degreeFilter !== 'ALL' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {degreeFilter === '1' ? '1st Degree Only' : '2nd Degree Only'}
              </span>
            )}
            {overviewCategoryFilter !== 'ALL' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {overviewCategoryFilter.replace('_', ' ')}
              </span>
            )}
          </div>

          {(degreeFilter !== 'ALL' || overviewCategoryFilter !== 'ALL' || searchQuery || (queryMode === 'NATURAL_QUERY' && naturalQueryInput)) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Introduction Paths Visualizer for Person Connection queries */}
        {queryMode === 'NATURAL_QUERY' &&
          naturalQueryResult?.query.intent === 'PERSON_CONNECTION' &&
          naturalQueryResult.personConnectionPaths &&
          naturalQueryResult.personConnectionPaths.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Introduction Paths to {naturalQueryResult.query.targetPerson?.name}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  {naturalQueryResult.personConnectionPaths.length} Available Path{naturalQueryResult.personConnectionPaths.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {naturalQueryResult.personConnectionPaths.map((p, idx) => (
                  <NetworkPathVisualizer key={idx} path={p} />
                ))}
              </div>
            </div>
        )}

        {/* Empty State / Helpful Guidance */}
        {filteredItems.items.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Compass className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">No Matching Contacts Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {queryMode === 'NATURAL_QUERY'
                ? naturalQueryResult?.statusMessage || 'Enter an investment question to query the network.'
                : queryMode === 'DISCOVERY'
                ? searchQuery.trim()
                  ? `No synthetic network profiles matched "${searchQuery}". Try searching for another persona name, company, or domain skill.`
                  : 'Type a query in the search bar above or choose a suggested topic to explore the network.'
                : 'No contacts met the active degree or category filter requirements.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.kind === 'SEARCH'
              ? (filteredItems.items as NetworkSearchResult[]).map((result) => (
                  <NetworkContactCard
                    key={result.person.id}
                    person={result.person}
                    searchResult={result}
                    onSelectPerson={setSelectedPerson}
                  />
                ))
              : filteredItems.kind === 'RECOMMENDATION'
              ? (filteredItems.items as ContactRecommendation[]).map((rec) => (
                  <NetworkContactCard
                    key={rec.person.id}
                    person={rec.person}
                    recommendation={rec}
                    onSelectPerson={setSelectedPerson}
                  />
                ))
              : (filteredItems.items as Person[]).map((person) => {
                  const paths = findIntroductionPaths(person.id, graph);
                  return (
                    <NetworkContactCard
                      key={person.id}
                      person={person}
                      path={paths[0]}
                      onSelectPerson={setSelectedPerson}
                    />
                  );
                })}
          </div>
        )}

        {/* Introduction Facilitators (Separate from professional relevance) */}
        {queryMode === 'NATURAL_QUERY' &&
          naturalQueryResult?.query.intent === 'PERSON_CONNECTION' &&
          naturalQueryResult.introductionFacilitators &&
          naturalQueryResult.introductionFacilitators.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Introduction Facilitators ({naturalQueryResult.introductionFacilitators.length})
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Warm Referral Bridges
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Path Reachability • Not Industry Domain Experts
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                The contacts below are mutual peers along verified 2nd-degree paths from INVESTOR_ROOT who can facilitate an introduction to{' '}
                <strong className="text-white">{naturalQueryResult.query.targetPerson?.name}</strong>. Their position represents graph relationship reachability, not domain expertise in {naturalQueryResult.query.targetPerson?.name}&apos;s sector.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {naturalQueryResult.introductionFacilitators.map((fac) => (
                  <div
                    key={fac.person.id}
                    onClick={() => setSelectedPerson(fac.person)}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                            {fac.person.name}
                          </h5>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {fac.roleBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {fac.person.currentRoleTitle} at {fac.person.currentOrganisation?.name}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                        Reachability: {fac.accessibilityScore}/100
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-indigo-300/90 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-900/40 flex items-center justify-between">
                      <span>Facilitates:</span>
                      <span className="text-slate-300">{fac.facilitatedPathSummary}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      {fac.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* 4. Slide-over / Modal Contact Profile Details */}
      <NetworkContactProfileModal
        person={selectedPerson}
        graph={graph}
        onClose={() => setSelectedPerson(null)}
      />
    </div>
  );
};
