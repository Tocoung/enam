import React, { useState, useMemo } from 'react';
import {
  CorporateAnnouncement,
  AnnouncementCategoryFilter,
  AnnouncementPriorityFilter,
  AnnouncementProvenanceFilter,
  AnnouncementSortOption,
  AnnouncementCategory,
} from '../types/announcements';
import { CORPORATE_ANNOUNCEMENTS } from '../data/announcementData';
import {
  filterAndSortAnnouncements,
  computeAnnouncementMetrics,
} from '../services/announcementService';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  X,
  RotateCcw,
  Sparkles,
  Newspaper,
  CheckCircle2,
  FileText,
} from './icons';

interface AnnouncementFeedProps {
  onOpenResearch?: (ticker: string) => void;
}

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  FINANCIAL_RESULTS: 'Financial Results',
  ORDERS_CONTRACTS: 'Orders & Contracts',
  CORPORATE_ACTIONS_FUNDRAISING: 'Corporate Actions & Fundraising',
  MANAGEMENT_GOVERNANCE: 'Management & Governance',
  REGULATORY_LEGAL: 'Regulatory & Legal',
};

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({ onOpenResearch }) => {
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategoryFilter>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<AnnouncementPriorityFilter>('ALL');
  const [selectedProvenance, setSelectedProvenance] = useState<AnnouncementProvenanceFilter>('ALL');
  const [sortBy, setSortBy] = useState<AnnouncementSortOption>('NEWEST_FIRST');

  // Compute metrics across entire dataset
  const metrics = useMemo(() => {
    return computeAnnouncementMetrics(CORPORATE_ANNOUNCEMENTS);
  }, []);

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    return filterAndSortAnnouncements(CORPORATE_ANNOUNCEMENTS, {
      searchQuery,
      category: selectedCategory,
      priority: selectedPriority,
      provenance: selectedProvenance,
      sortBy,
    });
  }, [searchQuery, selectedCategory, selectedPriority, selectedProvenance, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedPriority('ALL');
    setSelectedProvenance('ALL');
    setSortBy('NEWEST_FIRST');
  };

  const isFilteringActive =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedProvenance !== 'ALL' ||
    sortBy !== 'NEWEST_FIRST';

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* 1. Header & Protocol Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-1.5 sm:gap-2 leading-tight">
                <span>Corporate Announcement Intelligence</span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                  SEBI LODR
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Statutory exchange filings, material disclosures, and corporate developments across monitored equities.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Counters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono shrink-0">
          <div
            title="Exact official statutory filing or company release specifically linked"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{metrics.primaryDocCount} Primary Docs</span>
          </div>
          <div
            title="Official exchange/issuer archive repository (individual filing PDF not resolved)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]"
          >
            <FileText className="w-3 h-3 text-sky-400 shrink-0" />
            <span>{metrics.archiveLinkCount} Archive Links</span>
          </div>
          {metrics.secondarySourceCount > 0 && (
            <div
              title="Event details supported by reputable financial media citing regulatory disclosures"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]"
            >
              <Newspaper className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{metrics.secondarySourceCount} Secondary</span>
            </div>
          )}
          <div
            title="Illustrative synthetic entry for interface evaluation"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{metrics.demoCount} DEMO</span>
          </div>
        </div>
      </div>

      {/* 2. Provenance & Priority Methodology Legend */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2.5">
        <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Filing Integrity & Editorial Assessment Policy</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400 text-[11px] leading-relaxed">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>4-Tier Provenance Classification</span>
            </div>
            <p>
              FINN strictly distinguishes <span className="font-semibold text-emerald-300">VERIFIED PRIMARY DOCUMENT</span> (exact official filing linked directly), <span className="font-semibold text-sky-300">OFFICIAL ARCHIVE LINK</span> (official exchange archive; specific document not individually resolved), <span className="font-semibold text-purple-300">SECONDARY SOURCE</span> (financial press reporting citing disclosures), and <span className="font-semibold text-amber-300">DEMO ANNOUNCEMENT</span> (synthetic illustrations for interface evaluation).
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
              <span>FINN Editorial Assessment (Materiality)</span>
            </div>
            <p>
              Priority ratings (<span className="text-rose-300 font-semibold">HIGH</span>, <span className="text-indigo-300 font-semibold">MEDIUM</span>, <span className="text-slate-300 font-semibold">ROUTINE</span>) represent <span className="italic text-slate-300">FINN&apos;s editorial assessment</span> based on disclosed scale, capital dilution, and statutory requirements—not an objective market price forecast or official exchange classification.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="space-y-3 bg-slate-900/40 p-3 sm:p-4 rounded-xl border border-slate-800 overflow-hidden min-w-0 max-w-full">
        {/* Top Row: Search and Quick Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticker, company, keyword, or sector..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Priority Toggle & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Priority Filter */}
            <button
              onClick={() =>
                setSelectedPriority((prev) => (prev === 'HIGH_ONLY' ? 'ALL' : 'HIGH_ONLY'))
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                selectedPriority === 'HIGH_ONLY'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedPriority === 'HIGH_ONLY' ? 'bg-rose-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="whitespace-nowrap">High Materiality Only</span>
            </button>

            {/* Sort Selector */}
            <div className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as AnnouncementSortOption)}
                aria-label="Sort announcements by"
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="NEWEST_FIRST" className="bg-slate-900 text-slate-200">
                  Newest First
                </option>
                <option value="OLDEST_FIRST" className="bg-slate-900 text-slate-200">
                  Oldest First
                </option>
                <option value="PRIORITY_DESC" className="bg-slate-900 text-slate-200">
                  Highest Materiality
                </option>
              </select>
            </div>

            {/* Reset Button (visible when filters are active) */}
            {isFilteringActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
            }`}
          >
            All Announcements ({CORPORATE_ANNOUNCEMENTS.length})
          </button>

          {(Object.keys(CATEGORY_LABELS) as AnnouncementCategory[]).map((cat) => {
            const count = metrics.categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                <span>{CATEGORY_LABELS[cat]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Results Status & Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredAnnouncements.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{CORPORATE_ANNOUNCEMENTS.length}</span> announcements
          {selectedCategory !== 'ALL' && (
            <span> in <span className="text-indigo-300 font-medium">{CATEGORY_LABELS[selectedCategory]}</span></span>
          )}
          {selectedPriority === 'HIGH_ONLY' && (
            <span> (High Materiality only)</span>
          )}
          {searchQuery && (
            <span> matching &ldquo;<span className="text-indigo-300">{searchQuery}</span>&rdquo;</span>
          )}
        </div>
        {filteredAnnouncements.length > 0 && (
          <div className="hidden sm:block font-mono text-[11px] text-slate-500">
            Sorted by: {sortBy === 'NEWEST_FIRST' ? 'Date (Newest)' : sortBy === 'OLDEST_FIRST' ? 'Date (Oldest)' : 'Materiality'}
          </div>
        )}
      </div>

      {/* 5. Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center space-y-3 bg-slate-900/20 border border-slate-800/80 rounded-xl">
          <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-300">No announcements match your criteria</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, switching categories, or clearing the high-materiality filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              onOpenResearch={onOpenResearch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: CorporateAnnouncement;
  onOpenResearch?: (ticker: string) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onOpenResearch,
}) => {
  const isHigh = announcement.priority === 'HIGH';
  const isMedium = announcement.priority === 'MEDIUM';

  // Determine button label according to Section 6 & 7 guidelines
  const getSourceLinkLabel = () => {
    if (announcement.provenance === 'VERIFIED_PRIMARY_DOCUMENT') {
      if (
        announcement.source?.type === 'COMPANY_PRESS_RELEASE' ||
        announcement.source?.type === 'COMPANY_REGULATORY_DISCLOSURE'
      ) {
        return 'Open company disclosure ↗';
      }
      return 'Open filing ↗';
    }
    if (announcement.provenance === 'OFFICIAL_ARCHIVE_LINK') {
      return 'Open exchange archive ↗';
    }
    if (announcement.provenance === 'SECONDARY_SOURCE') {
      return 'Read secondary coverage ↗';
    }
    return 'Inspect exchange portal ↗';
  };

  // Determine button styling based on provenance
  const getSourceLinkStyle = () => {
    switch (announcement.provenance) {
      case 'VERIFIED_PRIMARY_DOCUMENT':
        return 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border-emerald-500/30 hover:text-white';
      case 'OFFICIAL_ARCHIVE_LINK':
        return 'bg-sky-950/40 hover:bg-sky-950/70 text-sky-300 border-sky-500/30 hover:text-white';
      case 'SECONDARY_SOURCE':
        return 'bg-purple-950/40 hover:bg-purple-950/70 text-purple-300 border-purple-500/30 hover:text-white';
      case 'DEMO_DATA':
      default:
        return 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white';
    }
  };

  return (
    <article className="p-4 sm:p-5 rounded-xl bg-[#0d1424] border border-slate-800/80 hover:border-slate-700 transition space-y-3.5 relative">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Company & Sector Identity */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-mono font-bold text-white text-sm">
              {announcement.ticker}
            </span>
          </div>
          <span className="text-slate-400 font-medium">
            {announcement.companyName}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500 text-[11px]">
            {announcement.sector}
          </span>
        </div>

        {/* Right: Badges & Date */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provenance Badge */}
          {announcement.provenance === 'VERIFIED_PRIMARY_DOCUMENT' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              VERIFIED PRIMARY DOCUMENT
            </span>
          )}
          {announcement.provenance === 'OFFICIAL_ARCHIVE_LINK' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              OFFICIAL ARCHIVE LINK
            </span>
          )}
          {announcement.provenance === 'SECONDARY_SOURCE' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              SECONDARY SOURCE
            </span>
          )}
          {announcement.provenance === 'DEMO_DATA' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              DEMO ANNOUNCEMENT
            </span>
          )}

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              isHigh
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : isMedium
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHigh ? 'bg-rose-400' : isMedium ? 'bg-indigo-400' : 'bg-slate-400'
              }`}
            />
            {isHigh ? 'HIGH MATERIALITY' : isMedium ? 'MEDIUM' : 'ROUTINE'}
          </span>

          {/* Timestamp / Date */}
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{announcement.displayDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Title & Summary */}
      <div className="space-y-1.5">
        <h2 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
          {announcement.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {announcement.summary}
        </p>
      </div>

      {/* Key Highlights (Quantified Points) */}
      {announcement.keyHighlights && announcement.keyHighlights.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Disclosed Highlights & Terms:
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
            {announcement.keyHighlights.map((hl, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-indigo-400 font-bold shrink-0">•</span>
                <span className="leading-snug">{hl}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Context: Category, Editorial Assessment, and Action Links */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Category & Editorial Assessment Rationale */}
        <div className="flex flex-wrap items-center gap-2 text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
            {CATEGORY_LABELS[announcement.category]}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 italic">
            FINN Editorial Assessment: {announcement.priorityRationale}
          </span>
        </div>

        {/* Right: Source Link & Copilot Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Research Copilot Shortcut */}
          {onOpenResearch && (
            <button
              onClick={() => onOpenResearch(announcement.ticker)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
              title={`Inspect comprehensive research dossier for ${announcement.ticker}`}
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Research {announcement.ticker}</span>
            </button>
          )}

          {/* Source Link with Strict Target Wording */}
          {announcement.source && (
            <a
              href={announcement.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition ${getSourceLinkStyle()}`}
              title={announcement.source.title}
            >
              <ExternalLink className="w-3 h-3" />
              <span>{getSourceLinkLabel()}</span>
            </a>
          )}
        </div>
      </div>

      {/* Notice for Demo Announcements */}
      {announcement.isDemo && announcement.demoNotice && (
        <div className="pt-1 text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
          <span>*</span>
          <span>{announcement.demoNotice}</span>
        </div>
      )}
    </article>
  );
};
