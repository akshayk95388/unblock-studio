import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SubtitleLine, VideoStyleConfig } from '../types';

interface Props {
  subtitles: SubtitleLine[];
  styleConfig: VideoStyleConfig;
}

export const KineticSubtitles: React.FC<Props> = ({ subtitles, styleConfig }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  // Find active line
  const activeLineIndex = subtitles.findIndex(
    (line) => currentMs >= line.start_ms && currentMs <= line.end_ms
  );

  // If no exact match, find nearest upcoming line within 1s or show fallback empty frame
  const currentLine = subtitles[activeLineIndex] || null;

  if (!currentLine) {
    return null;
  }

  // Calculate line entrance spring
  const lineFrame = frame - Math.floor((currentLine.start_ms / 1000) * fps);
  const lineEntrance = spring({
    frame: Math.max(0, lineFrame),
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  const lineScale = interpolate(lineEntrance, [0, 1], [0.92, 1]);
  const lineOpacity = interpolate(lineEntrance, [0, 1], [0, 1]);

  // Words breakdown
  const words = currentLine.words && currentLine.words.length > 0
    ? currentLine.words
    : currentLine.text.split(' ').map((w, idx, arr) => {
        const lineDuration = currentLine.end_ms - currentLine.start_ms;
        const wordDuration = lineDuration / arr.length;
        return {
          word: w,
          start_ms: currentLine.start_ms + idx * wordDuration,
          end_ms: currentLine.start_ms + (idx + 1) * wordDuration,
        };
      });

  return (
    <div
      style={{
        position: 'absolute',
        left: '60px',
        right: '60px',
        top: styleConfig.captionPosition === 'center' ? '45%' : '65%',
        transform: `translateY(-50%) scale(${lineScale})`,
        opacity: lineOpacity,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        gap: '12px 16px',
        textAlign: 'center',
        zIndex: 20,
      }}
    >
      {words.map((w, i) => {
        const isWordActive = currentMs >= w.start_ms && currentMs <= w.end_ms;
        const isWordPassed = currentMs > w.end_ms;

        // Word pop animation
        const wordFrame = frame - Math.floor((w.start_ms / 1000) * fps);
        const wordPop = isWordActive
          ? spring({
              frame: Math.max(0, wordFrame),
              fps,
              config: { damping: 10, mass: 0.4 },
            })
          : 0;

        const wordScale = isWordActive ? interpolate(wordPop, [0, 1], [1, 1.15]) : 1;

        return (
          <span
            key={i}
            style={{
              fontFamily: styleConfig.fontFamily || 'Outfit, sans-serif',
              fontSize: `${styleConfig.fontSizePx || 54}px`,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: isWordActive
                ? styleConfig.highlightColor || '#ffb692'
                : isWordPassed
                ? '#e5e2e3'
                : 'rgba(229, 226, 227, 0.45)',
              transform: `scale(${wordScale})`,
              transition: 'color 0.15s ease, transform 0.15s ease',
              textShadow: isWordActive
                ? `0 0 28px ${styleConfig.highlightColor || '#ffb692'}aa, 0 4px 12px rgba(0,0,0,0.9)`
                : '0 4px 12px rgba(0,0,0,0.8)',
              display: 'inline-block',
              padding: '2px 4px',
              borderRadius: '6px',
              backgroundColor: isWordActive ? 'rgba(0, 0, 0, 0.35)' : 'transparent',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
