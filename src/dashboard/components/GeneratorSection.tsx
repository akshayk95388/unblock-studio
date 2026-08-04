import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, Volume2, Mic, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { VerticalReelProps } from '../../remotion/types';

interface Props {
  onGenerateSuccess: (data: Partial<VerticalReelProps>, rawJobData?: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PRESET_STRESSORS = [
  'Stuck on pricing strategy and overthinking competitors',
  'Imposter syndrome before presenting to executive leadership',
  'Late-night overthinking preventing restful sleep',
  'Coding fatigue & writer\'s block during deadline crunch',
  'Social anxiety before networking with industry peers',
  'Procrastination paralysis when tackling huge projects',
];

export const GeneratorSection: React.FC<Props> = ({
  onGenerateSuccess,
  isLoading,
  setIsLoading,
}) => {
  const [stressor, setStressor] = useState(PRESET_STRESSORS[0]);
  const [presetMode, setPresetMode] = useState<'unblock_reel' | 'guided'>('unblock_reel');
  const [durationCategory, setDurationCategory] = useState<'quick' | 'deep'>('quick');
  const [voice, setVoice] = useState('calm_female');
  const [music, setMusic] = useState('ambient_meditation');

  // Live polling state
  const [stageMessage, setStageMessage] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setApiError(null);
    setStageMessage('Initializing audio generation request...');
    setProgressPct(5);
    setElapsedSec(0);

    const timerInterval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    try {
      const apiKey = import.meta.env.VITE_API_KEY || 'test-key';
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const payload: Record<string, any> = {
        stressor,
        voice,
        music,
        include_words_ts: true,
      };

      if (presetMode === 'guided') {
        payload.duration_category = durationCategory;
      } else {
        payload.preset = 'unblock_reel';
      }

      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`API Error ${res.status}: ${errorData || res.statusText}`);
      }

      const data = await res.json();
      const jobId = data.job_id;

      if (!jobId) {
        throw new Error('No job_id returned from API');
      }

      setStageMessage(`Job created (${jobId.slice(0, 8)}). Processing script & TTS...`);
      setProgressPct(15);

      // Long polling up to 120 attempts (120 seconds timeout)
      let attempts = 0;
      const maxAttempts = 120;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(`${backendUrl}/api/status/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();

            // Update live progress display
            if (statusData.current_stage) {
              setStageMessage(formatStageMessage(statusData.current_stage));
            }
            if (typeof statusData.progress_pct === 'number') {
              setProgressPct(Math.max(15, Math.min(100, Math.round(statusData.progress_pct))));
            }

            if (statusData.status === 'complete') {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              setIsLoading(false);
              setProgressPct(100);
              setStageMessage('Audio generation & subtitle sync completed!');

              // Format audio URL properly (prepend backend base URL if path starts with /)
              let finalAudioUrl = statusData.audio_url || '';
              if (finalAudioUrl.startsWith('/')) {
                finalAudioUrl = `${backendUrl}${finalAudioUrl}`;
              }

              // Extract subtitles payload
              const subtitlesPayload = parseSubtitles(statusData.subtitles, stressor);

              onGenerateSuccess(
                {
                  title: statusData.title || stressor.slice(0, 30),
                  stressorText: stressor.slice(0, 32),
                  audioUrl: finalAudioUrl,
                  durationInSeconds: statusData.duration_s || 15,
                  subtitles: subtitlesPayload,
                },
                statusData
              );
              return;
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              setIsLoading(false);
              setApiError(statusData.error || 'Generation failed on backend');
              return;
            }
          }
        } catch (err: any) {
          console.warn('Polling status warning:', err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setIsLoading(false);
          setApiError('Polling timed out after 120s. Please check backend server.');
        }
      }, 1000);
    } catch (err: any) {
      clearInterval(timerInterval);
      setIsLoading(false);
      setApiError(err.message || 'Failed to connect to unblock-focus backend');
    }
  };

  const formatStageMessage = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'script':
      case 'generating_script':
        return '✍️ Writing customized meditation script...';
      case 'tts':
      case 'generating_tts':
      case 'voice':
        return '🎙️ Synthesizing AI voice track...';
      case 'audio':
      case 'audio_mixing':
      case 'mixing':
        return '🎵 Mixing ambient background & sidechain ducking...';
      case 'complete':
        return '✅ Audio generation completed!';
      default:
        return `⚡ ${stage}...`;
    }
  };

  const parseSubtitles = (rawSubtitles: any, defaultStressor: string) => {
    if (Array.isArray(rawSubtitles) && rawSubtitles.length > 0) {
      return rawSubtitles.map((item) => {
        if (typeof item === 'string') {
          return { text: item, start_ms: 0, end_ms: 3000 };
        }

        // Extract raw word array from any possible key name
        const rawWords = item.words || item.word_timestamps || item.word_level_timestamps || item.word_list || item.timestamps || null;

        let parsedWords = undefined;
        if (Array.isArray(rawWords) && rawWords.length > 0) {
          parsedWords = rawWords.map((w: any) => {
            if (typeof w === 'string') {
              return { word: w, start_ms: item.start_ms || 0, end_ms: item.end_ms || 3000 };
            }
            // Auto-detect seconds vs milliseconds
            let startMs = w.start_ms ?? w.startMs ?? (typeof w.start === 'number' ? (w.start < 1000 ? w.start * 1000 : w.start) : 0);
            let endMs = w.end_ms ?? w.endMs ?? (typeof w.end === 'number' ? (w.end < 1000 ? w.end * 1000 : w.end) : 0);

            return {
              word: w.word || w.text || '',
              start_ms: Math.round(startMs),
              end_ms: Math.round(endMs),
            };
          });
        }

        let lineStartMs = item.start_ms ?? (typeof item.start === 'number' ? (item.start < 1000 ? item.start * 1000 : item.start) : 0);
        let lineEndMs = item.end_ms ?? (typeof item.end === 'number' ? (item.end < 1000 ? item.end * 1000 : item.end) : 3000);

        return {
          text: item.text || item.sentence || defaultStressor,
          start_ms: Math.round(lineStartMs),
          end_ms: Math.round(lineEndMs),
          words: parsedWords,
        };
      });
    }
    return [
      {
        text: defaultStressor,
        start_ms: 0,
        end_ms: 3500,
        words: defaultStressor.split(' ').map((w, i, a) => ({
          word: w,
          start_ms: (3500 / a.length) * i,
          end_ms: (3500 / a.length) * (i + 1),
        })),
      },
      {
        text: 'Take a deep breath and center your posture.',
        start_ms: 3600,
        end_ms: 7500,
        words: [
          { word: 'Take', start_ms: 3600, end_ms: 4200 },
          { word: 'a', start_ms: 4200, end_ms: 4400 },
          { word: 'deep', start_ms: 4400, end_ms: 5100 },
          { word: 'breath', start_ms: 5100, end_ms: 5800 },
          { word: 'and', start_ms: 5800, end_ms: 6100 },
          { word: 'center.', start_ms: 6100, end_ms: 7500 },
        ],
      },
      {
        text: 'You have full clarity and focus right now.',
        start_ms: 7600,
        end_ms: 11500,
      },
    ];
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-[rgba(87,66,56,0.25)] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#ffb692]" />
          <h2 className="text-lg font-bold text-[#e5e2e3]">Audio & Script Engine Integration</h2>
        </div>
        <span className="text-xs text-[#dec0b3]/70">Endpoint: POST /api/generate</span>
      </div>

      {/* Content Format & Preset Mode Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#dec0b3] mb-2 flex items-center justify-between">
          <span>Generation Preset Mode</span>
          <span className="text-[10px] font-mono text-[#ffb692] bg-[#ffb692]/10 px-2 py-0.5 rounded-full border border-[#ffb692]/20">
            {presetMode === 'unblock_reel' ? 'preset: "unblock_reel"' : 'Default Guided Session'}
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setPresetMode('unblock_reel')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              presetMode === 'unblock_reel'
                ? 'bg-[#ff823c]/15 border-[#ff823c] text-[#ff823c] shadow-lg shadow-[#ff823c]/10'
                : 'bg-[#1c1b1c] border-[rgba(87,66,56,0.2)] text-[#dec0b3]/70 hover:border-[rgba(87,66,56,0.4)] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                🚀 Viral Social Reel (IG & YT Shorts)
              </span>
              {presetMode === 'unblock_reel' && <CheckCircle2 className="w-4 h-4 text-[#ff823c]" />}
            </div>
            <span className="text-[11px] text-[#dec0b3]/80 leading-relaxed">
              High-hook, high-virality social media reel format (<code className="text-[#ffb692]">preset: "unblock_reel"</code>)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPresetMode('guided')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              presetMode === 'guided'
                ? 'bg-[#ffb692]/15 border-[#ffb692] text-[#ffb692] shadow-lg shadow-[#ffb692]/10'
                : 'bg-[#1c1b1c] border-[rgba(87,66,56,0.2)] text-[#dec0b3]/70 hover:border-[rgba(87,66,56,0.4)] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                🧘 Guided Meditation Session
              </span>
              {presetMode === 'guided' && <CheckCircle2 className="w-4 h-4 text-[#ffb692]" />}
            </div>
            <span className="text-[11px] text-[#dec0b3]/80 leading-relaxed">
              Standard calm meditation session format (preset omitted)
            </span>
          </button>
        </div>
      </div>

      {/* Preset Stressors Picker */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#dec0b3] mb-2">
          Target Stressor / Topic Prompt
        </label>
        <div className="grid grid-cols-1 gap-2 mb-3">
          {PRESET_STRESSORS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStressor(preset)}
              className={`text-left px-3 py-2 text-xs rounded-lg border transition-all cursor-pointer ${
                stressor === preset
                  ? 'bg-[#ffb692]/15 border-[#ffb692]/50 text-[#ffb692] font-semibold'
                  : 'bg-[#1c1b1c] border-[rgba(87,66,56,0.2)] text-[#dec0b3]/70 hover:border-[rgba(87,66,56,0.4)] hover:text-white'
              }`}
            >
              🔥 {preset}
            </button>
          ))}
        </div>

        <textarea
          value={stressor}
          onChange={(e) => setStressor(e.target.value)}
          rows={2}
          className="w-full glass-input rounded-xl px-4 py-3 text-sm resize-none"
          placeholder="Type custom mental barrier or stressor topic..."
        />
      </div>

      {/* Configuration Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#dec0b3] mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-[#ffb692]" /> Session Type
            </span>
            {presetMode === 'unblock_reel' && (
              <span className="text-[9px] font-mono text-[#ff823c] bg-[#ff823c]/10 px-1.5 py-0.5 rounded border border-[#ff823c]/20">
                Auto
              </span>
            )}
          </label>
          {presetMode === 'unblock_reel' ? (
            <div className="w-full glass-input rounded-lg px-3 py-2 text-xs text-[#dec0b3]/60 bg-[#1c1b1c]/50 border border-[rgba(87,66,56,0.15)] flex items-center justify-between cursor-not-allowed">
              <span>⚡ Auto (picked by backend)</span>
            </div>
          ) : (
            <select
              value={durationCategory}
              onChange={(e) => setDurationCategory(e.target.value as any)}
              className="w-full glass-input rounded-lg px-3 py-2 text-xs cursor-pointer"
            >
              <option value="quick" className="bg-[#1c1b1c]">Quick</option>
              <option value="deep" className="bg-[#1c1b1c]">Deep</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#dec0b3] mb-1 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-[#c2c1ff]" /> AI Voice
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full glass-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="calm_female" className="bg-[#1c1b1c]">Calm Female</option>
            <option value="warm_male" className="bg-[#1c1b1c]">Warm Male</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#dec0b3] mb-1 flex items-center gap-1">
            <Music className="w-3.5 h-3.5 text-[#e9c400]" /> Ambient Track
          </label>
          <select
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            className="w-full glass-input rounded-lg px-3 py-2 text-xs"
          >
            <option value="ambient_meditation" className="bg-[#1c1b1c]">Ambient Drone</option>
            <option value="rain_lofi" className="bg-[#1c1b1c]">Cosmic Rain</option>
            <option value="none" className="bg-[#1c1b1c]">Voice Only</option>
          </select>
        </div>
      </div>

      {/* Progress & Error Displays */}
      {isLoading && (
        <div className="p-4 rounded-xl bg-[#1c1b1c] border border-[#ffb692]/30 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#ffb692] flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {stageMessage}
            </span>
            <span className="font-mono text-[#dec0b3]">{progressPct}% ({elapsedSec}s)</span>
          </div>

          <div className="w-full bg-[#131314] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#ff823c] to-[#ffb692] h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !stressor.trim()}
        className="w-full py-3.5 px-4 rounded-xl glow-button text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Waiting for Audio & Subtitles Engine ({elapsedSec}s)...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-[#341100]" />
            Generate Audio & Subtitle Payload via API
          </>
        )}
      </button>
    </div>
  );
};
