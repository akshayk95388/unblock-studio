import { VerticalReelProps } from '../../remotion/types';

export interface SavedReelItem {
  id: string;
  job_id?: string;
  title: string;
  stressor: string;
  createdAt: string;
  durationInSeconds: number;
  audioUrl: string;
  reelProps: VerticalReelProps;
  renderedMp4Url?: string;
  renderStatus: 'ready' | 'rendered' | 'failed';
}
