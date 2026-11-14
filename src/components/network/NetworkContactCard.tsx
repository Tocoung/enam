import React, { useState } from 'react';
import { Person, ContactRecommendation, NetworkSearchResult, IntroductionPath } from '../../types/network';
import { NetworkPathVisualizer } from './NetworkPathVisualizer';
import { Building2, ChevronRight, Info, Sparkles } from '../icons';

export interface NetworkContactCardProps {
  person: Person;
  recommendation?: ContactRecommendation;
  searchResult?: NetworkSearchResult;
  path?: IntroductionPath;
  onSelectPerson: (person: Person) => void;
}

export const NetworkContactCard: React.FC<NetworkContactCardProps> = ({
  person,
  recommendation,
  searchResult,
  path,
  onSelectPerson,
}) => {
  const [showFormula, setShowFormula] = useState(false);

  // Active path to use
  const activePath = recommendation?.path || searchResult?.path || path;
  const isDirect = activePath?.degree === 1;

  // Determine current organization display
  const currentOrg = person.currentOrganisation;
  const currentRole = person.currentRoleTitle;

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm hover:shadow-md">
      {/* Header: Avatar, Name, Degree Badge, Scores */}
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Initials Avatar */}
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600/80 to-slate-800 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {person.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm hover:text-indigo-300 transition truncate cursor-pointer" onClick={() => onSelectPerson(person)}>
                  {person.name}
                </h3>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                    isDirect
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isDirect ? '1st Degree' : '2nd Degree'}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  SYNTHETIC
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={person.currentHeadline}>
                {person.currentHeadline}
              </p>
            </div>
          </div>

          {/* Prominent Score Widget */}
          {recommendation ? (
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-indigo-300">
                  {recommendation.overallScore}
                </span>
                <span className="text-[10px] font-mono text-slate-500">/100</span>
              </div>
              <span className="text-[9px] font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                Overall Match
              </span>
            </div>
          ) : searchResult ? (
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-sky-300">
                  {searchResult.searchRankingScore}
                </span>
                <span className="text-[10px] font-mono text-slate-500">/100</span>
              </div>
              <span className="text-[9px] font-mono font-semibold text-sky-400 uppercase tracking-wider">
                Search Rank
              </span>
            </div>
          ) : activePath ? (
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {activePath.accessibilityScore}
                </span>
                <span className="text-[10px] font-mono text-slate-500">/100</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">Accessibility</span>
            </div>
          ) : null}
        </div>

        {/* Current Organization Info */}
        {currentOrg && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-medium truncate">{currentRole || 'Executive'}</span>
            <span className="text-slate-500">at</span>
            <span className="font-semibold text-white truncate">{currentOrg.name}</span>
            {currentOrg.type === 'LISTED_NSE_BSE' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                {currentOrg.ticker}
              </span>
            )}
          </div>
        )}

        {/* Detailed Score Breakdown (For Recommendations) */}
        {recommendation && (
          <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Domain Relevance:</span>
              <span className="text-indigo-300 font-bold">{recommendation.relevanceScore}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Relationship Accessibility:</span>
              <span className="text-emerald-300 font-bold">{recommendation.accessibilityScore}%</span>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="hover:text-slate-200 transition underline underline-offset-2 flex items-center gap-1"
              >
                <Info className="w-3 h-3 text-slate-400" />
                <span>{showFormula ? 'Hide Math' : 'Show Score Math (65/35)'}</span>
              </button>
              <span className="text-slate-400">
                Weight: 65% Rel + 35% Acc
              </span>
            </div>
            {showFormula && (
              <p className="text-[10px] text-indigo-300 pt-1 border-t border-slate-800/60 leading-tight">
                {recommendation.scoreBreakdown.reconciliationSummary}
              </p>
            )}
          </div>
        )}

        {/* Detailed Search Match Breakdown (For Free-Text Search) */}
        {searchResult && (
          <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Search Match Quality:</span>
              <span className="text-sky-300 font-bold">{searchResult.searchMatchScore}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Accessibility Score:</span>
              <span className="text-emerald-300 font-bold">{searchResult.accessibilityScore}%</span>
            </div>
            {searchResult.matchReasons.length > 0 && (
              <div className="pt-1 border-t border-slate-800 flex flex-wrap gap-1">
                {searchResult.matchReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-500/30 text-sky-200"
                  >
                    Matched {reason.field.replace('_', ' ')}: "{reason.matchedText}"
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Relevance Reasons / Supporting Evidence */}
        {recommendation && recommendation.reasons.length > 0 && (
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Investment Relevance Rationale</span>
            </div>
            {recommendation.reasons.slice(0, 2).map((reason, idx) => (
              <div
                key={idx}
                className="text-[11px] p-2 rounded bg-slate-950/50 border border-slate-800/80 text-slate-300"
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-semibold">
                  <span className="text-indigo-300">{reason.category.replace('_', ' ')}</span>
                  <span className="text-emerald-400">+{reason.scoreContribution} pts</span>
                </div>
                <p className="mt-0.5 text-slate-300">{reason.description}</p>
                {reason.supportingEvidence && (
                  <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                    {reason.supportingEvidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Path Visualizer Preview */}
        {activePath && (
          <div className="mt-3">
            <NetworkPathVisualizer path={activePath} compact={true} />
          </div>
        )}

        {/* Expertise Tags Preview */}
        <div className="mt-3 flex flex-wrap gap-1">
          {person.expertise.slice(0, 3).map((exp, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {exp.name}
            </span>
          ))}
          {person.expertise.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/60 text-slate-400">
              +{person.expertise.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">
          Tie Strength: {activePath?.pathStrength || 1}/5
        </span>
        <button
          onClick={() => onSelectPerson(person)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <span>Inspect Profile</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
