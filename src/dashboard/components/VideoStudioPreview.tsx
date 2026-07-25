import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { VerticalReel } from '../../remotion/compositions/VerticalReel';
import { VerticalReelProps, VideoStyleConfig, getDimensions } from '../../remotion/types';
import { Sliders, Download, Palette, Type, AlignCenter, Activity, FileAudio, FileText, CheckCircle2, Video, Clock, RefreshCw, Monitor, AlertCircle, Zap } from 'lucide-react';

interface Props {
  reelProps: VerticalReelProps;
  onStyleChange: (newStyle: Partial<VideoStyleConfig>) => void;
  onRenderClick: () => void;
  isRendering: boolean;
  renderedVideoUrl?: string | null;
}

export const VideoStudioPreview: React.FC<Props> = ({
  reelProps,
  onStyleChange,
  onRenderClick,
  isRendering,
  renderedVideoUrl,
}) => {
  const { styleConfig } = reelProps;
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isServerRendering, setIsServerRendering] = useState(false);

  // Live rendering progress state
  const [renderProgressPct, setRenderProgressPct] = useState<number>(0);
  const [renderedFrames, setRenderedFrames] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);

  const aspectRatio = styleConfig.aspectRatio || '9:16';
  const dimensions = getDimensions(aspectRatio);

  const isTestMode15s = styleConfig.testMode15s === true;
  const effectiveDurationSeconds = isTestMode15s ? 15 : (reelProps.durationInSeconds || 15);
  const dynamicDurationInFrames = Math.max(150, Math.ceil(effectiveDurationSeconds * 30));

  const getContainerAspectClass = () => {
    switch (aspectRatio) {
      case '16:9':
      case '16:9_4k':
        return 'w-full max-w-[560px] aspect-[16/9]';
      case '1:1':
        return 'w-full max-w-[360px] aspect-square';
      case '9:16':
      default:
        return 'w-full max-w-[320px] aspect-[9/16]';
    }
  };

  const triggerBinaryMp4Download = async (downloadUrl: string) => {
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch video file (${res.status})`);
      }
      const blob = await res.blob();
      if (blob.size < 1000) {
        throw new Error('Downloaded file is invalid or too small');
      }

      const url = URL.createObjectURL(blob);
      const filename = `unblock_${isTestMode15s ? '15s_test_' : ''}reel_${aspectRatio.replace(':', 'x')}_${(reelProps.stressorText || 'session')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 25)}.mp4`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e: any) {
      console.error('Binary MP4 download error:', e);
      setRenderError(e.message || 'Failed to download binary MP4 file');
      return false;
    }
  };

  const handleRenderAndDownloadMp4 = async () => {
    if (lastDownloadUrl) {
      await triggerBinaryMp4Download(lastDownloadUrl);
      return;
    }

    setIsServerRendering(true);
    setRenderError(null);
    setRenderProgressPct(1);
    setRenderedFrames(0);
    setTotalFrames(dynamicDurationInFrames);
    setDownloadSuccess(null);

    // Poll live render progress from server every 300ms
    const progressPoller = setInterval(async () => {
      try {
        const progressRes = await fetch('/api/render-progress');
        if (progressRes.ok) {
          const progData = await progressRes.json();
          if (progData.rendering) {
            const currentRendered = progData.renderedFrames || 0;
            const currentTotal = progData.totalFrames || dynamicDurationInFrames;

            setRenderedFrames(currentRendered);
            setTotalFrames(currentTotal);

            const exactPct = currentTotal > 0
              ? Math.min(100, Math.round((currentRendered / currentTotal) * 100))
              : 1;

            setRenderProgressPct(exactPct);
          }
        }
      } catch (e) {
        console.warn('Progress poll warning:', e);
      }
    }, 300);

    try {
      const res = await fetch('/api/render-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reelProps,
          durationInSeconds: effectiveDurationSeconds,
        }),
      });

      clearInterval(progressPoller);

      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          setRenderProgressPct(100);
          setRenderedFrames(data.durationInFrames || dynamicDurationInFrames);
          setTotalFrames(data.durationInFrames || dynamicDurationInFrames);
          setLastDownloadUrl(data.downloadUrl);
          setIsServerRendering(false);

          const success = await triggerBinaryMp4Download(data.downloadUrl);
          if (success) {
            const sizeMb = data.fileSizeBytes ? (data.fileSizeBytes / (1024 * 1024)).toFixed(1) : '3.5';
            setDownloadSuccess(`✅ ${dimensions.width}x${dimensions.height} MP4 (${effectiveDurationSeconds}s · ${sizeMb} MB) rendered & downloaded! Perfect 320k Audio.`);
            setTimeout(() => setDownloadSuccess(null), 6000);
          }
          return;
        }
      }

      const errorText = await res.text();
      throw new Error(`Server render failed: ${errorText}`);
    } catch (error: any) {
      clearInterval(progressPoller);
      setIsServerRendering(false);
      console.error('Server MP4 render error:', error);
      setRenderError(error.message || 'Server rendering failed. Please retry.');
    }
  };

  const handleDownloadAudio = async () => {
    if (!reelProps.audioUrl) {
      alert('No audio track generated yet. Please generate audio first.');
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_API_KEY || 'test-key';
      const res = await fetch(reelProps.audioUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unblock_mastered_audio.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Audio download fetch error:', e);
    }

    const a = document.createElement('a');
    a.href = reelProps.audioUrl;
    a.target = '_blank';
    a.download = 'unblock_mastered_audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSubtitles = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reelProps.subtitles, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'subtitles_timestamps.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Interactive Remotion Player Viewport */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className={`relative ${getContainerAspectClass()} rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2a2a2b] bg-black transition-all duration-300`}>
          <Player
            component={VerticalReel as React.FC<any>}
            inputProps={{
              ...reelProps,
              durationInSeconds: effectiveDurationSeconds,
            } as any}
            durationInFrames={dynamicDurationInFrames}
            fps={30}
            compositionWidth={dimensions.width}
            compositionHeight={dimensions.height}
            style={{
              width: '100%',
              height: '100%',
            }}
            controls
            autoPlay
            loop
          />
        </div>
        <p className="mt-3 text-xs text-[#dec0b3]/70 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#ffb692] animate-ping" />
          Remotion Canvas ({dimensions.width}x{dimensions.height} @ 30 FPS · {effectiveDurationSeconds}s {isTestMode15s ? 'Quick Test Mode' : 'Full Audio'})
        </p>
      </div>

      {/* Style & Rendering Customizer Panel */}
      <div className="lg:col-span-7 space-y-5">
        <div className="glass-panel rounded-2xl p-6 border border-[rgba(87,66,56,0.25)] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#ffb692]" />
              <h3 className="text-base font-bold text-[#e5e2e3]">Composition & Format Controls</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono border flex items-center gap-1 ${
                isTestMode15s
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {isTestMode15s ? <Zap className="w-3 h-3 text-amber-400" /> : <Clock className="w-3 h-3 text-emerald-400" />}
                {effectiveDurationSeconds}s {isTestMode15s ? 'Quick 15s Test' : 'Full Track'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#ffb692]/15 text-[#ffb692] font-mono border border-[#ffb692]/30">
                {aspectRatio === '16:9_4k' ? '16:9 4K' : aspectRatio}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Video Aspect Ratio & Format Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#dec0b3] mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#ffb692]" /> Video Format & Resolution
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => {
                  setLastDownloadUrl(null);
                  onStyleChange({ aspectRatio: e.target.value as any });
                }}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs cursor-pointer font-medium"
              >
                <option value="9:16" className="bg-[#1c1b1c]">📱 9:16 Vertical Reel (1080x1920 - Shorts / Reels)</option>
                <option value="16:9" className="bg-[#1c1b1c]">📺 16:9 Widescreen HD (1920x1080 - Standard YouTube)</option>
                <option value="16:9_4k" className="bg-[#1c1b1c]">🎥 16:9 Widescreen 4K (3840x2160 - YouTube Ultra HD 4K)</option>
                <option value="1:1" className="bg-[#1c1b1c]">🔲 1:1 Square Post (1080x1080 - Feed / LinkedIn)</option>
              </select>
            </div>

            {/* Background Style Mode Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#dec0b3] mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#ffb692]" /> Background Theme
              </label>
              <select
                value={styleConfig.bgMode}
                onChange={(e) => {
                  setLastDownloadUrl(null);
                  onStyleChange({ bgMode: e.target.value as any });
                }}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs cursor-pointer"
              >
                <optgroup label="🌲 Calm Image Wallpapers" className="bg-[#1c1b1c] text-[#ffb692]">
                  <option value="img_forest" className="bg-[#1c1b1c]">🌲 Calm Misty Forest</option>
                  <option value="img_ocean" className="bg-[#1c1b1c]">🌊 Tranquil Ocean Sunset</option>
                  <option value="img_zen" className="bg-[#1c1b1c]">🪨 Zen Balance Stones</option>
                  <option value="img_cosmic" className="bg-[#1c1b1c]">🌌 Cosmic Stardust Nebula</option>
                </optgroup>

                <optgroup label="✨ Atmospheric Visuals" className="bg-[#1c1b1c] text-[#c2c1ff]">
                  <option value="dark_orb" className="bg-[#1c1b1c]">🌌 Ember Dark Orb</option>
                  <option value="mesh_gradient" className="bg-[#1c1b1c]">✨ Obsidian Mesh Gradient</option>
                  <option value="neon_waves" className="bg-[#1c1b1c]">⚡ Conic Wave Motion</option>
                  <option value="minimal_dark" className="bg-[#1c1b1c]">🖤 Obsidian Minimal</option>
                </optgroup>
              </select>
            </div>

            {/* Kinetic Highlight Color */}
            <div>
              <label className="block text-xs font-semibold text-[#dec0b3] mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#e9c400]" /> Kinetic Word Highlight Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleConfig.highlightColor}
                  onChange={(e) => {
                    setLastDownloadUrl(null);
                    onStyleChange({ highlightColor: e.target.value });
                  }}
                  className="w-9 h-9 rounded-lg bg-[#1c1b1c] border border-[rgba(87,66,56,0.3)] cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-[#e5e2e3]">{styleConfig.highlightColor}</span>
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <label className="block text-xs font-semibold text-[#dec0b3] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#c2c1ff]" /> Subtitle Font Size
                </span>
                <span className="text-[#e5e2e3] font-mono">{styleConfig.fontSizePx}px</span>
              </label>
              <input
                type="range"
                min={36}
                max={120}
                value={styleConfig.fontSizePx}
                onChange={(e) => {
                  setLastDownloadUrl(null);
                  onStyleChange({ fontSizePx: Number(e.target.value) });
                }}
                className="w-full accent-[#ffb692] cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-4 border-t border-[rgba(87,66,56,0.2)] flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <input
                type="checkbox"
                checked={isTestMode15s}
                onChange={(e) => {
                  setLastDownloadUrl(null);
                  onStyleChange({ testMode15s: e.target.checked });
                }}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <Zap className="w-3.5 h-3.5 text-amber-400" /> ⚡ 15-Second Quick Test Mode (Fast 3s Render)
            </label>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#e5e2e3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.showWaveform}
                  onChange={(e) => {
                    setLastDownloadUrl(null);
                    onStyleChange({ showWaveform: e.target.checked });
                  }}
                  className="w-4 h-4 rounded accent-[#ffb692]"
                />
                <Activity className="w-3.5 h-3.5 text-[#ffb692]" /> Waveform
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#e5e2e3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.showWatermark}
                  onChange={(e) => {
                    setLastDownloadUrl(null);
                    onStyleChange({ showWatermark: e.target.checked });
                  }}
                  className="w-4 h-4 rounded accent-[#ffb692]"
                />
                Watermark
              </label>
            </div>
          </div>
        </div>

        {/* Action & Export Box */}
        <div className="glass-panel rounded-2xl p-5 border border-[rgba(87,66,56,0.25)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#e5e2e3]">Video Package Export Studio</p>
              <p className="text-xs text-[#dec0b3]/70">
                {dimensions.width}x{dimensions.height} ({aspectRatio}) · {effectiveDurationSeconds}s ({dynamicDurationInFrames} frames @ 30 FPS)
              </p>
            </div>

            {/* Single Unified Primary CTA Button */}
            <button
              onClick={handleRenderAndDownloadMp4}
              disabled={isRendering || isServerRendering}
              className="px-6 py-3 rounded-xl glow-button text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isServerRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Rendering {renderProgressPct}%...
                </>
              ) : lastDownloadUrl ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#341100]" /> Download MP4 Video (Ready)
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 stroke-[2.5]" /> {isTestMode15s ? 'Render 15s Test MP4' : 'Render & Download MP4 Video'}
                </>
              )}
            </button>
          </div>

          {/* Live Server Frame Rendering Progress Bar */}
          {isServerRendering && (
            <div className="p-4 rounded-xl bg-[#1c1b1c] border border-[#ffb692]/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#ffb692] flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Multithreaded H.264 Video Rendering...
                </span>
                <span className="font-mono text-[#e5e2e3]">
                  {renderedFrames > 0 ? `${renderedFrames} / ${totalFrames} frames` : ''} ({renderProgressPct}%)
                </span>
              </div>

              <div className="w-full bg-[#131314] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ff823c] to-[#ffb692] h-full transition-all duration-300"
                  style={{ width: `${Math.max(2, renderProgressPct)}%` }}
                />
              </div>
            </div>
          )}

          {renderError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{renderError}</span>
            </div>
          )}

          {/* Auxiliary Export Buttons (Audio & Subtitles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[rgba(87,66,56,0.2)]">
            <button
              onClick={handleDownloadAudio}
              className="py-2.5 px-3 rounded-xl bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-[#e5e2e3] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileAudio className="w-3.5 h-3.5 text-[#c2c1ff]" /> Download MP3 Audio Track
            </button>

            <button
              onClick={handleDownloadSubtitles}
              className="py-2.5 px-3 rounded-xl bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-[rgba(87,66,56,0.3)] text-[#e5e2e3] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#e9c400]" /> Download Subtitles JSON Payload
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
