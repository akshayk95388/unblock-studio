import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

let activeRenderJob = {
  rendering: false,
  renderedFrames: 0,
  encodedFrames: 0,
  totalFrames: 1,
  progressPct: 0,
  filename: '',
  error: null as string | null,
};

function remotionRendererPlugin() {
  return {
    name: 'remotion-renderer-plugin',
    configureServer(server: any) {
      // Serve real binary MP4 video files from output directory
      server.middlewares.use('/output', (req: any, res: any, next: any) => {
        const cleanUrl = req.url.split('?')[0].replace(/^\//, '');
        const filePath = path.join(process.cwd(), 'output', cleanUrl);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const stat = fs.statSync(filePath);
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
          res.setHeader('Cache-Control', 'no-cache');
          return fs.createReadStream(filePath).pipe(res);
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Video file not found on server' }));
      });

      // API Endpoint GET /api/render-progress
      server.middlewares.use('/api/render-progress', (req: any, res: any, next: any) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(activeRenderJob));
          return;
        }
        next();
      });

      // API Endpoint POST /api/render-mp4
      server.middlewares.use('/api/render-mp4', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const inputProps = JSON.parse(body || '{}');

              // 1. Check for 15s Quick Test Mode
              const isTestMode = inputProps.styleConfig?.testMode15s === true;
              const durationInSeconds = isTestMode ? 15 : (inputProps.durationInSeconds || 15);
              const durationInFrames = Math.max(150, Math.ceil(durationInSeconds * 30));
              const aspectRatio = inputProps.styleConfig?.aspectRatio || '9:16';

              let compositionId = 'VerticalReel';
              if (aspectRatio === '16:9') compositionId = 'HorizontalYouTube';
              if (aspectRatio === '16:9_4k') compositionId = 'HorizontalYouTube4K';
              if (aspectRatio === '1:1') compositionId = 'SquarePost';

              const filename = `unblock_reel_${isTestMode ? '15s_test_' : ''}${Date.now()}.mp4`;
              const outputDir = path.join(process.cwd(), 'output');
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }
              const outputPath = path.join(outputDir, filename);

              activeRenderJob = {
                rendering: true,
                renderedFrames: 0,
                encodedFrames: 0,
                totalFrames: durationInFrames,
                progressPct: 0,
                filename,
                error: null,
              };

              console.log(`[Unblock Studio Server] Starting Remotion H.264 render (${compositionId}, ${durationInSeconds}s / ${durationInFrames} frames, audioUrl: ${inputProps.audioUrl})...`);

              const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts');
              const bundled = await bundle({
                entryPoint,
                webpackOverride: (config) => config,
              });

              const chromiumOptions = {
                args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-gpu',
                ],
              };

              const composition = await selectComposition({
                serveUrl: bundled,
                id: compositionId,
                inputProps,
                chromiumOptions,
              });

              const cpuCount = Math.max(1, os.cpus().length - 1);

              await renderMedia({
                composition,
                serveUrl: bundled,
                codec: 'h264',
                outputLocation: outputPath,
                inputProps,
                durationInFrames,
                concurrency: cpuCount,
                chromiumOptions,
                onProgress: ({ renderedFrames, encodedFrames, totalFrames }) => {
                  const pct = Math.min(100, Math.round((renderedFrames / totalFrames) * 100));
                  activeRenderJob.renderedFrames = renderedFrames;
                  activeRenderJob.encodedFrames = encodedFrames;
                  activeRenderJob.totalFrames = totalFrames;
                  activeRenderJob.progressPct = pct;
                },
              });

              activeRenderJob.rendering = false;
              activeRenderJob.progressPct = 100;

              const fileStat = fs.statSync(outputPath);
              console.log(`[Unblock Studio Server] H.264 MP4 Render Completed (${(fileStat.size / (1024 * 1024)).toFixed(2)} MB): ${outputPath}`);

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  downloadUrl: `/output/${filename}`,
                  filename,
                  fileSizeBytes: fileStat.size,
                  durationInSeconds,
                  durationInFrames,
                  compositionId,
                })
              );
            } catch (error: any) {
              console.error('[Unblock Studio Server] Render Error:', error);
              activeRenderJob.rendering = false;
              activeRenderJob.error = error.message;
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), remotionRendererPlugin()],
  server: {
    port: 3001,
  },
});
