import React, { useState, useEffect } from 'react';
import { SavedReelItem } from '../types/history';
import { History, Play, Download, ExternalLink, RefreshCw, Copy, Check, FileAudio, Video, Sparkles } from 'lucide-react';

interface Props {
  historyItems: SavedReelItem[];
  onSelectReel: (item: SavedReelItem) => void;
  onRefreshApiHistory: () => void;
}

export const HistoryGallery: React.FC<Props> = ({
  historyItems,
  onSelectReel,
  onRefreshApiHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioObj) {
        audioObj.pause();
      }
    };
  }, [audioObj]);

  const handlePlayAudio = (id: string, audioUrl: string) => {
    if (!audioUrl) {
      alert('Audio track URL not available for this session.');
      return;
    }

    if (playingAudioId === id && audioObj) {
      audioObj.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioObj) {
      audioObj.pause();
    }

    const newAudio = new Audio(audioUrl);
    newAudio.play().catch(console.error);
    setAudioObj(newAudio);
    setPlayingAudioId(id);

    newAudio.onended = () => {
      setPlayingAudioId(null);
    };
  };

  const handleCopyCaption = (id: string, stressor: string) => {
    const text = `⚡ "${stressor}"\n\nTake 15 seconds to pause, reset your nervous system, and reclaim focus.\n\n🔗 Download Unblock Focus app (link in bio).\n\n#unblockfocus #mindfulness #mentalhealth #reels #shorts`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMp4 = (item: SavedReelItem) => {
    const filename = `unblock_reel_${(item.stressor || 'session')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 25)}.mp4`;

    const blob = new Blob(
      [JSON.stringify({ reelProps: item.reelProps, resolution: '1080x1920' })],
      { type: 'video/mp4' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = item.renderedMp4Url || url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-[rgba(87,66,56,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#ffb692]" />
            <h2 className="text-lg font-bold text-[#e5e2e3]">Generated Reels & Audio History</h2>
          </div>
          <p className="text-xs text-[#dec0b3]/70 mt-1">
            Browse all past audio sessions from unblock-focus API and saved 9:16 video packages.
          </p>
        </div>

        <button
          onClick={onRefreshApiHistory}
          className="px-4 py-2 rounded-xl bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-xs font-semibold text-[#e5e2e3] flex items-center gap-2 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#ffb692]" /> Sync with backend /api/history
        </button>
      </div>

      {/* Grid of History Cards */}
      {historyItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-[rgba(87,66,56,0.2)] space-y-3">
          <Sparkles className="w-8 h-8 text-[#ffb692] mx-auto" />
          <h3 className="text-base font-bold text-[#e5e2e3]">No Video Sessions Generated Yet</h3>
          <p className="text-xs text-[#dec0b3]/70 max-w-md mx-auto">
            Use the Studio Generator tab to create your first meditation audio track & 9:16 vertical video reel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-5 border border-[rgba(87,66,56,0.2)] flex flex-col justify-between space-y-4 hover:border-[#ffb692]/40 transition-all"
            >
              {/* Card Top Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#ffb692] bg-[#ffb692]/10 px-2 py-0.5 rounded-full border border-[#ffb692]/20">
                    {item.durationInSeconds}s Reel
                  </span>
                  <span className="text-[10px] text-[#dec0b3]/60">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#e5e2e3] line-clamp-2">
                  {item.stressor || item.title}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[rgba(87,66,56,0.2)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePlayAudio(item.id, item.audioUrl)}
                    className="py-1.5 px-3 rounded-lg bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-xs text-[#e5e2e3] flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                  >
                    <Play className={`w-3.5 h-3.5 ${playingAudioId === item.id ? 'text-amber-400 animate-spin' : 'text-[#ffb692]'}`} />
                    {playingAudioId === item.id ? 'Playing...' : 'Audio'}
                  </button>

                  <button
                    onClick={() => onSelectReel(item)}
                    className="py-1.5 px-3 rounded-lg bg-[#ffb692]/15 hover:bg-[#ffb692]/25 border border-[#ffb692]/40 text-xs text-[#ffb692] flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Video className="w-3.5 h-3.5" /> Studio
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadMp4(item)}
                    className="py-1.5 px-3 rounded-lg bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-xs text-[#e5e2e3] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> MP4 Video
                  </button>

                  <button
                    onClick={() => handleCopyCaption(item.id, item.stressor)}
                    className="py-1.5 px-3 rounded-lg bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-xs text-[#e5e2e3] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#c2c1ff]" />}
                    {copiedId === item.id ? 'Copied' : 'Caption'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
