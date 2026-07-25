import React from 'react';
import { Video, Sparkles, Layers, Radio, Share2, History } from 'lucide-react';

interface Props {
  activeTab: 'single' | 'batch' | 'publisher' | 'history';
  setActiveTab: (tab: 'single' | 'batch' | 'publisher' | 'history') => void;
  apiConnected: boolean;
}

export const Header: React.FC<Props> = ({ activeTab, setActiveTab, apiConnected }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[rgba(87,66,56,0.2)] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#ff823c] to-[#ffb692] text-[#341100] shadow-lg shadow-orange-500/20 font-bold">
            <Video className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-[#e5e2e3]">
                Unblock<span className="text-gradient-ember">Studio</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#ffb692]/15 text-[#ffb692] border border-[#ffb692]/30">
                Ember Engine v1.0
              </span>
            </div>
            <p className="text-xs text-[#dec0b3]/80">Automated Marketing & 9:16 Video Generation Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#1c1b1c] rounded-xl border border-[rgba(87,66,56,0.25)]">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'glow-button shadow-md'
                : 'text-[#dec0b3] hover:text-white hover:bg-[#2a2a2b]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Studio Generator
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'glow-button shadow-md'
                : 'text-[#dec0b3] hover:text-white hover:bg-[#2a2a2b]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Batch Queue
          </button>
          <button
            onClick={() => setActiveTab('publisher')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'publisher'
                ? 'glow-button shadow-md'
                : 'text-[#dec0b3] hover:text-white hover:bg-[#2a2a2b]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Social Publisher
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'glow-button shadow-md'
                : 'text-[#dec0b3] hover:text-white hover:bg-[#2a2a2b]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History & Downloads
          </button>
        </div>

        {/* API Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1c1b1c] border border-[rgba(87,66,56,0.25)] text-xs">
          <Radio className={`w-3.5 h-3.5 ${apiConnected ? 'text-emerald-400 animate-pulse' : 'text-[#ffb692]'}`} />
          <span className="text-[#dec0b3]">unblock-focus API:</span>
          <span className={`font-semibold ${apiConnected ? 'text-emerald-400' : 'text-[#ffb692]'}`}>
            {apiConnected ? 'Online (8000)' : 'Mock Engine (Active)'}
          </span>
        </div>
      </div>
    </header>
  );
};
