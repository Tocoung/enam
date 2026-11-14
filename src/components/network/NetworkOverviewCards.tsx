import React from 'react';
import { NetworkOverviewMetrics, ExpertiseCategory } from '../../types/network';
import { Users, UserCheck, Share2, Award, ShieldCheck, Tag } from '../icons';

interface NetworkOverviewCardsProps {
  metrics: NetworkOverviewMetrics;
  selectedCategory?: ExpertiseCategory | 'ALL';
  onSelectCategory?: (category: ExpertiseCategory | 'ALL') => void;
}

const CATEGORY_NAMES: Record<ExpertiseCategory, string> = {
  SECTOR_INDUSTRY: 'Sector & Industry',
  FUNCTIONAL_OPERATIONS: 'Operations & Execution',
  GOVERNANCE_REGULATORY: 'Governance & Regulatory',
  TECHNOLOGY_PLATFORMS: 'Tech & Platforms',
  CAPITAL_ALLOCATION: 'Capital Allocation & M&A',
};

export const NetworkOverviewCards: React.FC<NetworkOverviewCardsProps> = ({
  metrics,
  selectedCategory = 'ALL',
  onSelectCategory,
}) => {
  return (
    <div className="space-y-3">
      {/* 1. Synthetic Data Provenance Warning Banner */}
      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-200 uppercase tracking-wider text-[10px]">
                Synthetic Network Prototype
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                100% Client-Side
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              All 16 people and the relationship graph are synthetic prototype data. Synthetic network profiles and relationships; company references use the prototype&apos;s verified ticker registry.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Contacts */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Synthetic Contacts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.totalContacts}
            </span>
            <span className="text-[10px] font-mono text-indigo-400">100% Indexed</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across 20 listed & private enterprises
          </div>
        </div>

        {/* Card 2: 1st-Degree Direct */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>1st-Degree Ties</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {metrics.firstDegreeCount}
            </span>
            <span className="text-[10px] font-mono text-emerald-500">Direct Relations</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Direct access with known tie strengths
          </div>
        </div>

        {/* Card 3: 2nd-Degree Reachable */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>2nd-Degree Reachable</span>
            <Share2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {metrics.secondDegreeCount}
            </span>
            <span className="text-[10px] font-mono text-amber-500">Via 2 Hops</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Reachable via mutual peer introductions
          </div>
        </div>

        {/* Card 4: Total Mapped Relationships */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mapped Edges</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-sky-400">
              {metrics.totalEdges}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ({metrics.peerToPeerEdges} P2P ties)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {metrics.totalExpertiseTags} profile domain expertise tags mapped
          </div>
        </div>
      </div>

      {/* 3. Expertise Category Distribution Chips */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Network Domain Expertise Coverage ({metrics.totalExpertiseTags} tags)</span>
          </div>
          {onSelectCategory && selectedCategory !== 'ALL' && (
            <button
              onClick={() => onSelectCategory('ALL')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono transition"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_NAMES) as ExpertiseCategory[]).map((catKey) => {
            const count = metrics.expertiseCategoryCounts[catKey] || 0;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'ALL' : catKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
                title={`Filter by ${CATEGORY_NAMES[catKey]}`}
              >
                <span>{CATEGORY_NAMES[catKey]}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
