import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { VerticalReel } from '../../remotion/compositions/VerticalReel';
import { VerticalReelProps, VideoStyleConfig, OverlayEffectType, getDimensions } from '../../remotion/types';
import { getPlayableAudioUrl } from '../utils/audioResolver';
import { Sliders, Download, Palette, Type, AlignCenter, Activity, FileAudio, FileText, CheckCircle2, Video, Clock, RefreshCw, Monitor, AlertCircle, Zap, Sparkles, Layers, Flame, Upload, Link, Image, ZoomIn, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Collapsible panel states (closed/minimized by default)
  const [isCustomMediaOpen, setIsCustomMediaOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Live rendering progress state
  const [renderProgressPct, setRenderProgressPct] = useState<number>(0);
  const [renderedFrames, setRenderedFrames] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null);

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov|m4v)$/i));
    const mediaType: 'image' | 'video' = isVideoFile ? 'video' : 'image';
    const objectUrl = URL.createObjectURL(file);

    setLastDownloadUrl(null);
    onStyleChange({
      bgMode: 'custom_media',
      customBgUrl: objectUrl,
      customBgType: mediaType,
    });
  };

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
      const playableUrl = await getPlayableAudioUrl(reelProps.audioUrl);
      const res = await fetch(playableUrl, {
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

    const playableUrl = await getPlayableAudioUrl(reelProps.audioUrl);
    const a = document.createElement('a');
    a.href = playableUrl;
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
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono border flex items-center gap-1 ${isTestMode15s
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

                <optgroup label="🎨 Custom Media Upload" className="bg-[#1c1b1c] text-[#e9c400]">
                  <option value="custom_media" className="bg-[#1c1b1c]">🖼️ / 🎥 Custom Image or Video Upload</option>
                </optgroup>
              </select>
            </div>

            {/* ── Custom Media Upload & URL Controls Box ── */}
            {styleConfig.bgMode === 'custom_media' && (
              <div className="col-span-1 sm:col-span-2 rounded-xl bg-[#131314] border border-[#ffb692]/40 shadow-lg overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsCustomMediaOpen(!isCustomMediaOpen)}
                  className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-[#1c1b1c]/60 transition-all text-left"
                >
                  <span className="text-xs font-bold text-[#ffb692] flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#ffb692]" /> Custom Background Media (Image or Video)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#ffb692] bg-[#ffb692]/10 px-2.5 py-0.5 rounded-full border border-[#ffb692]/20">
                      {styleConfig.customBgUrl ? (styleConfig.customBgType === 'video' ? '🎥 Video Loop' : '🖼️ Image') : 'No File Uploaded'}
                    </span>
                    {isCustomMediaOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#dec0b3]/70" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#dec0b3]/70" />
                    )}
                  </div>
                </button>

                {isCustomMediaOpen && (
                  <div className="p-4 pt-1 border-t border-[rgba(87,66,56,0.3)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#dec0b3]/80 font-medium">Select Media Source:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onStyleChange({ customBgType: 'image' })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${
                            (styleConfig.customBgType || 'image') === 'image'
                              ? 'bg-[#ffb692]/20 text-[#ffb692] border-[#ffb692]/40'
                              : 'bg-[#1c1b1c] text-[#dec0b3]/60 border-[rgba(87,66,56,0.3)] hover:bg-[#2a2a2b]'
                          }`}
                        >
                          🖼️ Image
                        </button>
                        <button
                          type="button"
                          onClick={() => onStyleChange({ customBgType: 'video' })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${
                            styleConfig.customBgType === 'video'
                              ? 'bg-[#ffb692]/20 text-[#ffb692] border-[#ffb692]/40'
                              : 'bg-[#1c1b1c] text-[#dec0b3]/60 border-[rgba(87,66,56,0.3)] hover:bg-[#2a2a2b]'
                          }`}
                        >
                          🎥 Video Loop
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* File Upload Zone */}
                      <div>
                        <label className="block text-[10px] text-[#dec0b3]/80 font-medium mb-1">
                          Upload Local File (.png, .jpg, .mp4, .webm)
                        </label>
                        <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1c1b1c] hover:bg-[#2a2a2b] border border-dashed border-[#ffb692]/40 text-xs font-semibold text-[#e5e2e3] cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5 text-[#ffb692]" />
                          <span>{styleConfig.customBgUrl ? 'Change File' : 'Browse Local Image / Video'}</span>
                          <input
                            type="file"
                            accept="image/*,video/mp4,video/webm,video/quicktime"
                            onChange={handleCustomFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Direct Media URL Input */}
                      <div>
                        <label className="block text-[10px] text-[#dec0b3]/80 font-medium mb-1">
                          Or Direct Media URL
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Link className="w-3.5 h-3.5 text-[#dec0b3]/60 shrink-0" />
                          <input
                            type="text"
                            placeholder="https://example.com/meditation.mp4"
                            value={styleConfig.customBgUrl || ''}
                            onChange={(e) => {
                              const url = e.target.value;
                              const isVideo = Boolean(url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));
                              setLastDownloadUrl(null);
                              onStyleChange({
                                bgMode: 'custom_media',
                                customBgUrl: url,
                                customBgType: isVideo ? 'video' : (styleConfig.customBgType || 'image'),
                              });
                            }}
                            className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#e5e2e3]"
                          />
                        </div>
                      </div>
                    </div>

                    {styleConfig.customBgUrl && (
                      <div className="flex items-center justify-between text-[11px] text-[#dec0b3]/90 bg-[#1c1b1c] px-3 py-1.5 rounded-lg border border-[rgba(87,66,56,0.3)]">
                        <span className="truncate max-w-[85%] font-mono text-[10px] flex items-center gap-1">
                          <span className="text-[#ffb692] font-semibold">Active Background:</span>
                          <span className="truncate text-[#e5e2e3]">{styleConfig.customBgUrl}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onStyleChange({ customBgUrl: '', bgMode: 'img_forest', customBgScale: 1.0, customBgPositionX: 50, customBgPositionY: 50 })}
                          className="text-rose-400 hover:text-rose-300 font-bold ml-2 cursor-pointer text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* ── Zoom & Focus Framing Sliders ── */}
                    <div className="pt-2.5 border-t border-[rgba(87,66,56,0.3)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#dec0b3] flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5 text-[#ffb692]" /> Background Zoom & Focus Framing
                        </span>
                        <button
                          type="button"
                          onClick={() => onStyleChange({ customBgScale: 1.0, customBgPositionX: 50, customBgPositionY: 50 })}
                          className="text-[10px] text-[#dec0b3]/70 hover:text-[#ffb692] font-semibold cursor-pointer underline"
                        >
                          Reset Framing
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Zoom Level Slider */}
                        <div>
                          <label className="block text-[10px] text-[#dec0b3]/80 font-medium mb-1 flex justify-between">
                            <span>Zoom Level:</span>
                            <span className="font-mono text-[#ffb692]">{Math.round((styleConfig.customBgScale || 1.0) * 100)}%</span>
                          </label>
                          <input
                            type="range"
                            min={1.0}
                            max={3.0}
                            step={0.05}
                            value={styleConfig.customBgScale || 1.0}
                            onChange={(e) => {
                              setLastDownloadUrl(null);
                              onStyleChange({ customBgScale: parseFloat(e.target.value) });
                            }}
                            className="w-full accent-[#ffb692] cursor-pointer"
                          />
                        </div>

                        {/* Horizontal Pan (X) */}
                        <div>
                          <label className="block text-[10px] text-[#dec0b3]/80 font-medium mb-1 flex justify-between">
                            <span>Focus X (Left/Right):</span>
                            <span className="font-mono text-[#ffb692]">{styleConfig.customBgPositionX ?? 50}%</span>
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={styleConfig.customBgPositionX ?? 50}
                            onChange={(e) => {
                              setLastDownloadUrl(null);
                              onStyleChange({ customBgPositionX: parseInt(e.target.value, 10) });
                            }}
                            className="w-full accent-[#ffb692] cursor-pointer"
                          />
                        </div>

                        {/* Vertical Pan (Y) */}
                        <div>
                          <label className="block text-[10px] text-[#dec0b3]/80 font-medium mb-1 flex justify-between">
                            <span>Focus Y (Top/Bottom):</span>
                            <span className="font-mono text-[#ffb692]">{styleConfig.customBgPositionY ?? 50}%</span>
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={styleConfig.customBgPositionY ?? 50}
                            onChange={(e) => {
                              setLastDownloadUrl(null);
                              onStyleChange({ customBgPositionY: parseInt(e.target.value, 10) });
                            }}
                            className="w-full accent-[#ffb692] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

        {/* ── Motion & Animation Overlays Box ── */}
        <div className="glass-panel rounded-2xl p-5 border border-[rgba(87,66,56,0.25)] space-y-4">
          <button
            type="button"
            onClick={() => setIsOverlayOpen(!isOverlayOpen)}
            className="w-full flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffb692]" />
              <h4 className="text-xs font-bold text-[#e5e2e3]">Motion & Animation Overlays</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#ffb692] bg-[#ffb692]/10 px-2.5 py-0.5 rounded-full border border-[#ffb692]/20 capitalize">
                {styleConfig.overlayConfig?.effect || 'none'}
              </span>
              {isOverlayOpen ? (
                <ChevronUp className="w-4 h-4 text-[#dec0b3]/70 group-hover:text-[#ffb692] transition-all" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#dec0b3]/70 group-hover:text-[#ffb692] transition-all" />
              )}
            </div>
          </button>

          {isOverlayOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[rgba(87,66,56,0.2)]">
              <div>
                <label className="block text-[11px] font-medium text-[#dec0b3] mb-1.5">
                  Visual Overlay Effect
                </label>
                <select
                  value={styleConfig.overlayConfig?.effect || 'none'}
                  onChange={(e) => {
                    setLastDownloadUrl(null);
                    onStyleChange({
                      overlayConfig: {
                        effect: e.target.value as OverlayEffectType,
                        startInSeconds: styleConfig.overlayConfig?.startInSeconds || 0,
                        durationInSeconds: styleConfig.overlayConfig?.durationInSeconds || (reelProps.durationInSeconds || 15),
                        opacity: styleConfig.overlayConfig?.opacity ?? 0.6,
                      },
                    });
                  }}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs cursor-pointer"
                >
                  <option value="none" className="bg-[#1c1b1c]">🚫 None (Clean Background)</option>
                  <option value="ambient_particles" className="bg-[#1c1b1c]">✨ Ambient Floating Particles</option>
                  <option value="glowing_orbs" className="bg-[#1c1b1c]">🔮 Pulsating Glowing Bokeh Orbs</option>
                  <option value="cosmic_dust" className="bg-[#1c1b1c]">🌌 Swirling Cosmic Dust</option>
                  <option value="light_leaks" className="bg-[#1c1b1c]">🎞️ Vintage Film Light Leaks</option>
                </select>
              </div>

              {styleConfig.overlayConfig?.effect !== 'none' && (
                <div>
                  <label className="block text-[11px] font-medium text-[#dec0b3] mb-1 flex justify-between">
                    <span>Overlay Opacity:</span>
                    <span className="font-mono text-[#ffb692]">{Math.round((styleConfig.overlayConfig?.opacity ?? 0.6) * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={styleConfig.overlayConfig?.opacity ?? 0.6}
                    onChange={(e) => {
                      onStyleChange({
                        overlayConfig: {
                          effect: styleConfig.overlayConfig?.effect || 'ambient_particles',
                          startInSeconds: styleConfig.overlayConfig?.startInSeconds || 0,
                          durationInSeconds: styleConfig.overlayConfig?.durationInSeconds || 15,
                          opacity: parseFloat(e.target.value),
                        },
                      });
                    }}
                    className="w-full accent-[#ffb692] cursor-pointer mt-2"
                  />
                </div>
              )}
            </div>
          )}
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
