import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface Props {
  stressorText: string;
  watermarkText?: string;
  showWatermark?: boolean;
}

export const BrandingOverlay: React.FC<Props> = ({
  stressorText,
  watermarkText = 'UNBLOCK FOCUS APP',
  showWatermark = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const topTranslate = interpolate(entrance, [0, 1], [-50, 0]);
  const bottomTranslate = interpolate(entrance, [0, 1], [50, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px 48px',
        zIndex: 30,
      }}
    >
      {/* Top Stressor Topic Badge (Obsidian Ember theme) */}
      <div
        style={{
          transform: `translateY(${topTranslate}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 24px',
            borderRadius: '999px',
            background: 'rgba(28, 27, 28, 0.85)',
            border: '1px solid rgba(255, 182, 146, 0.35)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(255, 182, 146, 0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ffb692',
              boxShadow: '0 0 10px #ffb692',
            }}
          />
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#e5e2e3',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {stressorText || 'Mindfulness Break'}
          </span>
        </div>
      </div>

      {/* Bottom Watermark & CTA Footer (Obsidian Ember theme) */}
      {showWatermark && (
        <div
          style={{
            transform: `translateY(${bottomTranslate}px)`,
            opacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 28px',
              borderRadius: '16px',
              background: 'rgba(32, 31, 32, 0.85)',
              border: '1px solid rgba(255, 182, 146, 0.3)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                background: 'linear-gradient(135deg, #ffb692, #ff823c, #ffe171)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ⚡ {watermarkText}
            </span>
          </div>

          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              color: '#dec0b3',
              letterSpacing: '0.04em',
              opacity: 0.85,
            }}
          >
            🔗 Download full session app in bio
          </span>
        </div>
      )}
    </div>
  );
};
