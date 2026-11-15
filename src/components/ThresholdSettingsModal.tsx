import React from 'react';
import { X, RotateCcw, Sliders, AlertTriangle } from './icons';
import { ThresholdConfig } from '../types/portfolio';
import { DEFAULT_THRESHOLDS } from '../data/portfolioData';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onUpdateThresholds: (newThresholds: ThresholdConfig) => void;
  activeAlertCount: number;
  highPriorityCount: number;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onUpdateThresholds,
  activeAlertCount,
  highPriorityCount,
}) => {
  if (!isOpen) return null;

  const handlePriceChange = (value: number) => {
    onUpdateThresholds({
      ...thresholds,
      priceChangePercentThreshold: Number(value.toFixed(2)),
    });
  };

  const handleVolumeChange = (value: number) => {
    onUpdateThresholds({
      ...thresholds,
      volumeRatioThreshold: Number(value.toFixed(2)),
    });
  };

  const handleReset = () => {
    onUpdateThresholds(DEFAULT_THRESHOLDS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Alert Threshold Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-6">
          <p className="text-xs text-slate-400 leading-relaxed">
            Adjust statistical thresholds below. Priority alerts and watchlist outlier tags update instantly in real-time.
          </p>

          {/* Setting 1: Price Movement */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-semibold text-slate-200">
                1D Price Movement Threshold
              </label>
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                ±{thresholds.priceChangePercentThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.25"
              value={thresholds.priceChangePercentThreshold}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>±0.5% (Sensitive)</span>
              <span>±2.0% (Standard)</span>
              <span>±5.0% (Severe)</span>
            </div>
          </div>

          {/* Setting 2: Volume Anomaly */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-semibold text-slate-200">
                Unusual Volume Ratio (vs 20D Avg)
              </label>
              <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                ≥ {thresholds.volumeRatioThreshold}x
              </span>
            </div>
            <input
              type="range"
              min="1.1"
              max="3.0"
              step="0.1"
              value={thresholds.volumeRatioThreshold}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1.1x (Light)</span>
              <span>1.5x (Standard)</span>
              <span>3.0x (Extreme)</span>
            </div>
          </div>

          {/* Live Impact Preview */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300">Active Signals at Current Thresholds:</span>
            </div>
            <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
              <span>{activeAlertCount} Total</span>
              <span className="text-rose-400 text-[11px]">({highPriorityCount} High)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
