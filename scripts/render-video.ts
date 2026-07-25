import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { defaultReelProps } from '../src/remotion/Root';

async function renderVideoReel() {
  const durationInSeconds = defaultReelProps.durationInSeconds || 15;
  const durationInFrames = Math.max(150, Math.ceil(durationInSeconds * 30));

  console.log(`[Unblock Studio] Starting server-side Remotion video render pipeline (${durationInSeconds}s / ${durationInFrames} frames)...`);

  const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts');
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'vertical_reel_1080x1920.mp4');

  console.log('[Unblock Studio] Bundling Remotion composition...');
  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log('[Unblock Studio] Selecting composition "VerticalReel"...');
  const inputProps = defaultReelProps as unknown as Record<string, unknown>;
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'VerticalReel',
    inputProps,
  });

  console.log('[Unblock Studio] Rendering 1080x1920 MP4 file to:', outputPath);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  });

  console.log('[Unblock Studio] Render completed successfully! Full Video saved to:', outputPath);
}

renderVideoReel().catch((err) => {
  console.error('[Unblock Studio] Render Error:', err);
});
