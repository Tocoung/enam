import React from 'react';
import { IntroductionPath } from '../../types/network';
import { ArrowRight, Link2, ShieldCheck, UserCheck } from '../icons';

interface NetworkPathVisualizerProps {
  path: IntroductionPath;
  compact?: boolean;
}

export const NetworkPathVisualizer: React.FC<NetworkPathVisualizerProps> = ({
  path,
  compact = false,
}) => {
  const isDirect = path.degree === 1;

  if (compact) {
    return (
      <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-mono">
        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
          Investor
        </span>
        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
        {path.intermediary && (
          <>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
              {path.intermediary.name}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          </>
        )}
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
          Target
        </span>
        <span className="ml-1 text-[10px] text-slate-400">
          ({isDirect ? 'Direct 1-hop' : `2-hop via ${path.intermediary?.name}`})
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">
            {isDirect ? 'Direct Relationship Path' : 'Second-Degree Introduction Path'}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
              isDirect
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isDirect ? '1st Degree' : '2nd Degree'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <span>Accessibility:</span>
          <span className="text-indigo-300 font-bold">{path.accessibilityScore}/100</span>
        </div>
      </div>

      {/* Path visual step chain */}
      <div className="flex items-center flex-wrap gap-2 text-xs pt-1">
        {/* Node 1: Investor Root */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 font-medium">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Investor (You)</span>
        </div>

        {/* Edge 1 info */}
        <div className="flex flex-col items-center px-1 text-[10px] font-mono text-slate-400">
          <span className="text-indigo-400 font-bold">
            {'★'.repeat(path.edges[0]?.connectionStrength || 1)}
            {'☆'.repeat(5 - (path.edges[0]?.connectionStrength || 1))}
          </span>
          <span className="text-[9px] text-slate-500 truncate max-w-[110px]">
            {path.edges[0]?.relationshipType?.replace('_', ' ') || 'Connection'}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
        </div>

        {/* Node 2: Intermediary (if 2nd degree) */}
        {path.intermediary && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span>{path.intermediary.name}</span>
                <span className="text-[9px] text-slate-400 font-mono truncate max-w-[130px]">
                  {path.intermediary.currentRoleTitle || 'Peer Colleague'}
                </span>
              </div>
            </div>

            {/* Edge 2 info */}
            <div className="flex flex-col items-center px-1 text-[10px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">
                {'★'.repeat(path.edges[1]?.connectionStrength || 1)}
                {'☆'.repeat(5 - (path.edges[1]?.connectionStrength || 1))}
              </span>
              <span className="text-[9px] text-slate-500 truncate max-w-[110px]">
                {path.edges[1]?.relationshipType?.replace('_', ' ') || 'Peer Tie'}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
            </div>
          </>
        )}

        {/* Node Target */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 font-medium">
          <span className="font-semibold text-emerald-300">Target Contact</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 italic pt-1">{path.explanation}</p>
    </div>
  );
};
