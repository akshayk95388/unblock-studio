export interface SubtitleWord {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface SubtitleLine {
  text: string;
  start_ms: number;
  end_ms: number;
  words?: SubtitleWord[];
}

export type BgModeType =
  | 'dark_orb'
  | 'mesh_gradient'
  | 'minimal_dark'
  | 'neon_waves'
  | 'img_forest'
  | 'img_ocean'
  | 'img_zen'
  | 'img_cosmic'
  | 'custom_media';

export type AspectRatioType = '9:16' | '16:9' | '16:9_4k' | '1:1';

export type OverlayEffectType =
  | 'none'
  | 'ambient_particles'
  | 'glowing_orbs'
  | 'cosmic_dust'
  | 'light_leaks';

export interface OverlayConfig {
  effect: OverlayEffectType;
  startInSeconds: number;
  durationInSeconds: number;
  opacity: number;
}

export interface VideoStyleConfig {
  bgMode: BgModeType;
  aspectRatio: AspectRatioType;
  fontFamily: string;
  highlightColor: string;
  textColor: string;
  fontSizePx: number;
  captionPosition: 'center' | 'bottom';
  showWaveform: boolean;
  showWatermark: boolean;
  watermarkText: string;
  testMode15s?: boolean;
  overlayConfig?: OverlayConfig;
  customBgUrl?: string;
  customBgType?: 'image' | 'video';
}

export interface VerticalReelProps {
  title: string;
  stressorText: string;
  audioUrl: string;
  subtitles: SubtitleLine[];
  durationInSeconds: number;
  styleConfig: VideoStyleConfig;
}

export function getDimensions(aspectRatio: AspectRatioType = '9:16') {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '16:9_4k':
      return { width: 3840, height: 2160 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '9:16':
    default:
      return { width: 1080, height: 1920 };
  }
}
