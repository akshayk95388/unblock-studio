import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { VerticalReelProps } from '../types';
import { BackgroundCanvas } from '../components/BackgroundCanvas';
import { KineticSubtitles } from '../components/KineticSubtitles';
import { AudioWaveform } from '../components/AudioWaveform';
import { BrandingOverlay } from '../components/BrandingOverlay';
import { AnimationOverlay } from '../components/AnimationOverlay';

export const VerticalReel: React.FC<VerticalReelProps> = ({
  stressorText,
  audioUrl,
  subtitles,
  styleConfig,
}) => {
  const processedAudioSrc = audioUrl.startsWith('http') || audioUrl.startsWith('blob:')
    ? audioUrl
    : staticFile(audioUrl || 'demo.mp3');

  const isWidescreen = styleConfig.aspectRatio === '16:9' || styleConfig.aspectRatio === '16:9_4k';

  // ── Overlay Config Setup ──
  const overlayConfig = styleConfig.overlayConfig;
  const overlayEffect = overlayConfig?.effect || 'none';
  const overlayStartFrame = Math.round((overlayConfig?.startInSeconds || 0) * 30);
  const overlayDurationFrames = Math.round((overlayConfig?.durationInSeconds || 30) * 30);

  return (
    <AbsoluteFill style={{ backgroundColor: '#080b12', overflow: 'hidden' }}>
      {/* 1. Dynamic Visual Background Layer */}
      <BackgroundCanvas
        mode={styleConfig.bgMode}
        customBgUrl={styleConfig.customBgUrl}
        customBgType={styleConfig.customBgType}
        customBgScale={styleConfig.customBgScale}
        customBgPositionX={styleConfig.customBgPositionX}
        customBgPositionY={styleConfig.customBgPositionY}
      />

      {/* 2. Visual Animation & Motion Overlays */}
      {overlayEffect !== 'none' && (
        <Sequence from={overlayStartFrame} durationInFrames={overlayDurationFrames}>
          <AnimationOverlay
            effect={overlayEffect}
            opacity={overlayConfig?.opacity ?? 0.6}
            highlightColor={styleConfig.highlightColor || '#ffb692'}
          />
        </Sequence>
      )}

      {/* 3. Audio Layer */}
      {audioUrl && <Audio src={processedAudioSrc} />}

      {/* 4. Central Kinetic Subtitle Highlight Layer */}
      <KineticSubtitles subtitles={subtitles} styleConfig={styleConfig} />

      {/* 5. Audio Spectrum Waveform Layer */}
      {styleConfig.showWaveform && (
        <div
          style={{
            position: 'absolute',
            bottom: isWidescreen ? '120px' : '180px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 15,
          }}
        >
          <AudioWaveform
            barCount={isWidescreen ? 48 : 24}
            color={styleConfig.highlightColor || '#ffb692'}
          />
        </div>
      )}

      {/* 6. Header & Footer Branding Overlay */}
      <BrandingOverlay
        stressorText={stressorText}
        showWatermark={styleConfig.showWatermark}
        watermarkText={styleConfig.watermarkText}
      />
    </AbsoluteFill>
  );
};
