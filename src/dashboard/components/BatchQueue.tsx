import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface BatchItem {
  id: string;
  stressor: string;
  voice: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  renderTimeSec?: number;
  outputFile?: string;
}

const DEFAULT_BATCH_ITEMS: BatchItem[] = [
  { id: '1', stressor: 'Imposter syndrome before presenting to leadership', voice: 'calm_female', status: 'completed', renderTimeSec: 4.2, outputFile: 'reels/imposter_syndrome.mp4' },
  { id: '2', stressor: 'Late-night anxiety checking Slack messages', voice: 'warm_male', status: 'completed', renderTimeSec: 3.8, outputFile: 'reels/late_night_slack.mp4' },
  { id: '3', stressor: 'Desk fatigue and posture slump after 4 hours', voice: 'calm_female', status: 'queued' },
  { id: '4', stressor: 'Procrastination paralysis before launching product', voice: 'warm_male', status: 'queued' },
];

export const BatchQueue: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>(DEFAULT_BATCH_ITEMS);
  const [newStressor, setNewStressor] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleAddItem = () => {
    if (!newStressor.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        stressor: newStressor,
        voice: 'calm_female',
        status: 'queued',
      },
    ]);
    setNewStressor('');
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRunBatch = () => {
    setIsProcessingBatch(true);
    let index = 0;

    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item, i) => {
          if (i === index) {
            return {
              ...item,
              status: 'completed',
              renderTimeSec: Number((Math.random() * 2 + 3).toFixed(1)),
              outputFile: `reels/${item.stressor.toLowerCase().replace(/[^a-z0-0]/g, '_').slice(0, 20)}.mp4`,
            };
          }
          if (i === index + 1) {
            return { ...item, status: 'processing' };
          }
          return item;
        })
      );

      index++;
      if (index >= items.length) {
        clearInterval(interval);
        setIsProcessingBatch(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Automated Daily Batch Video Pipeline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate 10–50 unique vertical Reels / Shorts daily using unblock-focus API + Remotion headless render.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Items Queued: </span>
            <span className="font-bold text-indigo-400">{items.length}</span>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={isProcessingBatch || items.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            {isProcessingBatch ? 'Rendering Batch Video Jobs...' : 'Execute Batch Render'}
          </button>
        </div>
      </div>

      {/* Add New Stressor to Queue Form */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
        <input
          type="text"
          value={newStressor}
          onChange={(e) => setNewStressor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Enter new stressor topic to add to queue (e.g. 'Fear of public speaking')..."
          className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
        >
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      {/* Batch Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Topic / Stressor Prompt</th>
                <th className="px-4 py-3.5">Voice Profile</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Render Speed</th>
                <th className="px-4 py-3.5">Output MP4</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white max-w-xs truncate">
                    {item.stressor}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-400 text-[11px]">
                    {item.voice}
                  </td>
                  <td className="px-4 py-4">
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                        <Clock className="w-3 h-3 text-indigo-400 animate-spin" /> Rendering...
                      </span>
                    )}
                    {item.status === 'queued' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        <Clock className="w-3 h-3" /> Queued
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-400">
                    {item.renderTimeSec ? `${item.renderTimeSec}s` : '—'}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-indigo-300">
                    {item.outputFile || 'Pending'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
