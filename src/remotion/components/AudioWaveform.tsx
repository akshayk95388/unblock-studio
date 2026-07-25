import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  barCount?: number;
  color?: string;
}

export const AudioWaveform: React.FC<Props> = ({
  barCount = 28,
  color = '#ffb692',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: '70px',
        padding: '0 20px',
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Multi-frequency wave calculation simulating live audio spectrum
        const freq1 = Math.sin((frame / fps) * 6 + i * 0.4);
        const freq2 = Math.cos((frame / fps) * 12 + i * 0.7);
        const combined = Math.abs(freq1 * 0.6 + freq2 * 0.4);

        const height = interpolate(combined, [0, 1], [8, 64]);
        const opacity = interpolate(combined, [0, 1], [0.4, 0.95]);

        return (
          <div
            key={i}
            style={{
              width: '5px',
              height: `${height}px`,
              borderRadius: '999px',
              backgroundColor: color,
              opacity,
              boxShadow: `0 0 10px ${color}aa`,
              transition: 'height 0.1s ease',
            }}
          />
        );
      })}
    </div>
  );
};
