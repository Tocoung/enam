import React, { useEffect } from 'react';
import { Person, NetworkGraph } from '../../types/network';
import { findIntroductionPaths, getOrganisationSector } from '../../services/networkService';
import { NetworkPathVisualizer } from './NetworkPathVisualizer';
import {
  X,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Link2,
  ShieldCheck,
  Calendar,
} from '../icons';

interface NetworkContactProfileModalProps {
  person: Person | null;
  graph: NetworkGraph;
  onClose: () => void;
}

const PROFICIENCY_LABELS: Record<string, { label: string; color: string }> = {
  DEEP_OPERATIONAL_EXPERT: {
    label: 'Deep Operational Expert',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  EXECUTIVE_OVERSIGHT: {
    label: 'Executive Oversight',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  PRACTITIONER: {
    label: 'Practitioner',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
};

export const NetworkContactProfileModal: React.FC<NetworkContactProfileModalProps> = ({
  person,
  graph,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!person) return null;

  // Retrieve all valid introduction paths from INVESTOR_ROOT to this person
  const paths = findIntroductionPaths(person.id, graph);
  const bestPath = paths[0];
  const isDirect = bestPath?.degree === 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-start p-2 sm:p-4 md:p-6 animate-fadeIn">
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Top Provenance Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Synthetic Network Profile
            </span>
            <span>•</span>
            <span className="text-amber-200/90 text-[10px]">
              Not an actual executive contact. Created for algorithmic demonstration.
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
            aria-label="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
                {person.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {person.name}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                      isDirect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isDirect ? '1st-Degree Direct Contact' : '2nd-Degree Referral Contact'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 font-medium">
                  {person.currentHeadline}
                </p>
                {person.currentOrganisation && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 flex-wrap">
                    <span className="font-semibold text-slate-200">
                      {person.currentRoleTitle}
                    </span>
                    <span>at</span>
                    <span className="text-indigo-300 font-medium">
                      {person.currentOrganisation.name}
                    </span>
                    {person.currentOrganisation.type === 'LISTED_NSE_BSE' && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                        {person.currentOrganisation.ticker}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Path Accessibility Badge */}
            {bestPath && (
              <div className="hidden sm:flex flex-col items-end shrink-0 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400">Accessibility</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {bestPath.accessibilityScore}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Tie Strength: {bestPath.pathStrength}/5
                </span>
              </div>
            )}
          </div>

          {/* Professional Bio / Summary */}
          <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            <p>{person.summary}</p>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Relationship & Introduction Paths */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <span>Relationship Paths from Investor ({paths.length})</span>
            </div>
            <div className="space-y-2">
              {paths.map((p, idx) => (
                <NetworkPathVisualizer key={idx} path={p} compact={false} />
              ))}
            </div>
          </div>

          {/* Section 2: Employment History Timeline */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Career & Employment History ({person.employmentHistory.length})</span>
            </div>

            <div className="space-y-3">
              {person.employmentHistory.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-3.5 rounded-xl border ${
                    emp.isCurrent
                      ? 'bg-indigo-950/30 border-indigo-500/30'
                      : 'bg-slate-950/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{emp.roleTitle}</span>
                        {emp.isCurrent ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Current Role
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800">
                            Past Role
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-200">{emp.organisation.name}</span>
                        {emp.organisation.type === 'LISTED_NSE_BSE' && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                            NSE: {emp.organisation.ticker}
                          </span>
                        )}
                        {getOrganisationSector(emp.organisation) && (
                          <span className="text-[11px] text-slate-400">
                            • {getOrganisationSector(emp.organisation)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>
                        {emp.startDate} — {emp.endDate || 'Present'}
                      </span>
                    </div>
                  </div>

                  {emp.responsibilities.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Key Responsibilities & Scope:
                      </span>
                      <ul className="mt-1 space-y-1 text-xs text-slate-300 list-disc list-inside">
                        {emp.responsibilities.map((resp, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Domain Expertise & Proficiencies */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Verified Domain Expertise ({person.expertise.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {person.expertise.map((exp) => {
                const badge = PROFICIENCY_LABELS[exp.proficiency] || {
                  label: exp.proficiency,
                  color: 'bg-slate-800 text-slate-300 border-slate-700',
                };

                return (
                  <div
                    key={exp.id}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-white">{exp.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Category: {exp.category.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Education & Academic Credentials */}
          {person.educationHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Education & Credentials ({person.educationHistory.length})</span>
              </div>

              <div className="space-y-2">
                {person.educationHistory.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                      <div className="text-xs text-indigo-300 mt-0.5 font-medium">
                        {edu.institution.name}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {edu.startYear} — {edu.endYear}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Contact ID: {person.id} • Provenance: SYNTHETIC
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
