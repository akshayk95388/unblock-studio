import React, { useState } from 'react';
import { Share2, Instagram, Youtube, Copy, Check, Send, Hash, Sparkles } from 'lucide-react';
import { VerticalReelProps } from '../../remotion/types';

interface Props {
  reelProps: VerticalReelProps;
}

export const SocialPublisher: React.FC<Props> = ({ reelProps }) => {
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'tiktok'>('instagram');
  const [copied, setCopied] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  const title = reelProps.stressorText || 'Mindfulness Break for Focus';

  const captionText = `⚡ Feeling overwhelmed by: "${title}"?\n\nTake 15 seconds to pause, reset your nervous system, and reclaim your mental focus.\n\n👇 Download Unblock Focus app (link in bio) to build custom audio sessions.\n\n#unblockfocus #mindfulness #mentalhealth #productivity #focus #meditation #reels #shorts`;

  const handleCopy = () => {
    navigator.clipboard.writeText(captionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostMock = () => {
    setPostedSuccess(true);
    setTimeout(() => setPostedSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Mock Social Media Preview Phone Container */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[320px] rounded-3xl overflow-hidden glass-panel border-4 border-slate-800 bg-slate-950 p-4 space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              {platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
              {platform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
              {platform === 'tiktok' && <Share2 className="w-5 h-5 text-cyan-400" />}
              <span className="text-xs font-bold text-white capitalize">{platform} Preview</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Ready to Upload
            </span>
          </div>

          {/* Video Thumbnail Screen */}
          <div className="w-full aspect-[9/16] rounded-2xl bg-gradient-to-b from-indigo-950 via-slate-900 to-black relative flex flex-col justify-between p-4 border border-slate-800/60 shadow-inner">
            <div className="self-end px-2.5 py-1 rounded-full bg-black/60 text-[10px] font-mono text-slate-300 backdrop-blur-md">
              00:15 / 9:16 MP4
            </div>

            <div className="space-y-1 text-center my-auto">
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider bg-black/50 px-3 py-1 rounded-lg backdrop-blur-md inline-block">
                {title}
              </span>
              <p className="text-[11px] text-slate-300 font-medium">Kinetic Animated Subtitles Synced</p>
            </div>

            {/* Bottom Platform Mock Metadata Overlay */}
            <div className="space-y-1 bg-black/60 p-2.5 rounded-xl backdrop-blur-md border border-white/5">
              <p className="text-[11px] font-bold text-white flex items-center gap-1">
                @unblockfocus <span className="text-[9px] font-normal text-slate-400">· 1m</span>
              </p>
              <p className="text-[10px] text-slate-300 line-clamp-2">{captionText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Metadata & Auto-Posting Controls */}
      <div className="lg:col-span-7 space-y-5">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Social Media Upload Hub</h3>
            </div>

            {/* Platform Selector Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                onClick={() => setPlatform('instagram')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  platform === 'instagram' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
              <button
                onClick={() => setPlatform('youtube')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  platform === 'youtube' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" /> Shorts
              </button>
              <button
                onClick={() => setPlatform('tiktok')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                  platform === 'tiktok' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> TikTok
              </button>
            </div>
          </div>

          {/* Generated Caption Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Optimized Social Caption & Hashtags
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Caption'}
              </button>
            </div>
            <textarea
              readOnly
              value={captionText}
              rows={6}
              className="w-full glass-input rounded-xl px-4 py-3 text-xs font-sans resize-none text-slate-200"
            />
          </div>

          {/* Hashtags Tags Pill Cloud */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-amber-400" /> High-Reach Hashtag Cloud
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['#unblockfocus', '#mindfulness', '#mentalhealth', '#productivity', '#anxietyrelief', '#reels', '#shorts', '#tiktokmeditation', '#focus'].map(
                (tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Automated Posting Trigger */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">API Key Configured: Instagram Graph API / YouTube Data API v3</span>

            <button
              onClick={handlePostMock}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              {postedSuccess ? 'Published to Social Queue!' : `Auto-Post to ${platform.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
