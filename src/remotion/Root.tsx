import React from 'react';
import { Composition } from 'remotion';
import { VerticalReel } from './compositions/VerticalReel';
import { VerticalReelProps } from './types';

export const defaultReelProps: VerticalReelProps = {
  title: 'Imposter Syndrome Session',
  stressorText: 'Imposter Syndrome',
  audioUrl: '',
  durationInSeconds: 15,
  subtitles: [
    {
      text: 'Before presenting to executive leadership...',
      start_ms: 0,
      end_ms: 2500,
      words: [
        { word: 'Before', start_ms: 0, end_ms: 500 },
        { word: 'presenting', start_ms: 500, end_ms: 1200 },
        { word: 'to', start_ms: 1200, end_ms: 1500 },
        { word: 'executive', start_ms: 1500, end_ms: 2000 },
        { word: 'leadership...', start_ms: 2000, end_ms: 2500 },
      ],
    },
    {
      text: 'Pause, take a deep breath, and reset your mind.',
      start_ms: 2600,
      end_ms: 6000,
      words: [
        { word: 'Pause,', start_ms: 2600, end_ms: 3200 },
        { word: 'take', start_ms: 3200, end_ms: 3700 },
        { word: 'a', start_ms: 3700, end_ms: 3900 },
        { word: 'deep', start_ms: 3900, end_ms: 4500 },
        { word: 'breath,', start_ms: 4500, end_ms: 5100 },
        { word: 'and', start_ms: 5100, end_ms: 5400 },
        { word: 'reset.', start_ms: 5400, end_ms: 6000 },
      ],
    },
    {
      text: 'Your voice matters. You belong in this room.',
      start_ms: 6200,
      end_ms: 10000,
      words: [
        { word: 'Your', start_ms: 6200, end_ms: 6700 },
        { word: 'voice', start_ms: 6700, end_ms: 7300 },
        { word: 'matters.', start_ms: 7300, end_ms: 8000 },
        { word: 'You', start_ms: 8000, end_ms: 8500 },
        { word: 'belong', start_ms: 8500, end_ms: 9200 },
        { word: 'in', start_ms: 9200, end_ms: 9500 },
        { word: 'this', start_ms: 9500, end_ms: 9700 },
        { word: 'room.', start_ms: 9700, end_ms: 10000 },
      ],
    },
    {
      text: 'Unblock your focus now.',
      start_ms: 10200,
      end_ms: 14500,
      words: [
        { word: 'Unblock', start_ms: 10200, end_ms: 11200 },
        { word: 'your', start_ms: 11200, end_ms: 12000 },
        { word: 'focus', start_ms: 12000, end_ms: 13000 },
        { word: 'now.', start_ms: 13000, end_ms: 14500 },
      ],
    },
  ],
  styleConfig: {
    bgMode: 'img_forest',
    aspectRatio: '9:16',
    fontFamily: 'Outfit, sans-serif',
    highlightColor: '#ffb692',
    textColor: '#ffffff',
    fontSizePx: 56,
    captionPosition: 'center',
    showWaveform: true,
    showWatermark: true,
    watermarkText: 'UNBLOCK FOCUS APP',
  },
};

const calculateDuration = async ({ props }: { props: Record<string, unknown> }) => {
  const reel = props as unknown as VerticalReelProps;
  const durationInSeconds = reel?.durationInSeconds || 15;
  const durationInFrames = Math.max(150, Math.ceil(durationInSeconds * 30));
  return {
    durationInFrames,
    props,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 9:16 Vertical Reel (Shorts / Reels / TikTok) */}
      <Composition
        id="VerticalReel"
        component={VerticalReel as React.FC<any>}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultReelProps as any}
        calculateMetadata={calculateDuration}
      />

      {/* 16:9 Widescreen HD (Standard YouTube 1080p) */}
      <Composition
        id="HorizontalYouTube"
        component={VerticalReel as React.FC<any>}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          ...defaultReelProps,
          styleConfig: { ...defaultReelProps.styleConfig, aspectRatio: '16:9' },
        } as any}
        calculateMetadata={calculateDuration}
      />

      {/* 16:9 Widescreen 4K (YouTube Ultra HD 4K) */}
      <Composition
        id="HorizontalYouTube4K"
        component={VerticalReel as React.FC<any>}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{
          ...defaultReelProps,
          styleConfig: { ...defaultReelProps.styleConfig, aspectRatio: '16:9_4k', fontSizePx: 108 },
        } as any}
        calculateMetadata={calculateDuration}
      />

      {/* 1:1 Square Post (Instagram Feed / LinkedIn) */}
      <Composition
        id="SquarePost"
        component={VerticalReel as React.FC<any>}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          ...defaultReelProps,
          styleConfig: { ...defaultReelProps.styleConfig, aspectRatio: '1:1' },
        } as any}
        calculateMetadata={calculateDuration}
      />
    </>
  );
};

export default RemotionRoot;
