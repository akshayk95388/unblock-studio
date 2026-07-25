# 🎬 Unblock Studio

> Standalone automated video generation engine & marketing suite for **Unblock Focus**. Built with [Remotion](https://www.remotion.dev/), React, Vite, and Node.js.

---

## 🌟 Overview & Architecture

`unblock-studio` is isolated in a separate repository to keep heavy video-processing dependencies (Remotion, Chromium canvas rendering, FFmpeg pipelines) completely separate from the core `unblock-focus` production web app.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Unblock Studio (New Repository)                       │
│                                                                             │
│  1. Interactive Web Dashboard (Vite + React)                                │
│  2. Remotion 9:16 Vertical Video Compositions (1080x1920 @ 30 FPS)          │
│  3. Kinetic Subtitle Highlight & Audio Spectrum Engine                      │
│  4. Server-Side Programmatic MP4 Renderer & Batch Automation                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ HTTP API Calls (POST /api/generate)
                                       ▼
                       ┌──────────────────────────────────────────────┐
                       │  unblock-focus Backend (Current Repo)         │
                       │                                              │
                       │  - Audio Mastered MP3 (Voice + Music Ducked) │
                       │  - Word-level Subtitle Timestamps JSON        │
                       └──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Studio Control Dashboard
Launch the web interface for custom rendering and live previews:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Launch Remotion Visual Canvas Studio
Preview, adjust, and inspect Remotion video compositions frame-by-frame:
```bash
npm run studio
```
Open [http://localhost:3333](http://localhost:3333).

---

## 📁 Repository Structure

```
unblock-studio/
├── .github/workflows/
│   └── daily-reels.yml       # Scheduled GitHub Actions ($0 automated render & post)
├── scripts/
│   ├── fetch-audio.ts        # Client script calling unblock-focus REST API
│   ├── render-video.ts       # Server-side Remotion programmatic MP4 renderer
│   └── scheduled-batch.ts    # CLI batch orchestrator
├── src/
│   ├── dashboard/            # Studio Web App UI (Vite + React + Glassmorphism)
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── GeneratorSection.tsx
│   │   │   ├── VideoStudioPreview.tsx
│   │   │   ├── BatchQueue.tsx
│   │   │   └── SocialPublisher.tsx
│   │   └── App.tsx
│   └── remotion/             # Remotion React-to-Video Engine
│       ├── components/
│       │   ├── BackgroundCanvas.tsx  # Dark Orb, Mesh Gradient, Neon Waves
│       │   ├── KineticSubtitles.tsx  # Synced Word/Line Pop Animations
│       │   ├── AudioWaveform.tsx     # Dynamic Audio Spectrum Visualizer
│       │   └── BrandingOverlay.tsx   # Watermark & CTA Footer
│       ├── compositions/
│       │   └── VerticalReel.tsx      # Main 9:16 Vertical Video Component
│       ├── Root.tsx                  # Remotion Composition Registry
│       └── types.ts                  # Payload Schemas & Style Tokens
├── remotion.config.ts        # Remotion CLI configuration
├── vite.config.ts            # Vite bundler configuration
└── package.json
```

---

## 🎨 Key Features

1. **Kinetic Subtitle Synchronization**: Automatically syncs word-by-word active highlighting and spring pop animations using `start_ms` and `end_ms` payload data from `unblock-focus`.
2. **9:16 Vertical Layouts (1080x1920)**: Formatted natively for Instagram Reels, YouTube Shorts, and TikTok.
3. **Dynamic Background Modes**:
   - 🌌 **Glowing Dark Orb**: Atmospheric glowing particle orb.
   - ✨ **Cosmic Mesh Gradient**: Ethereal animated color gradients.
   - ⚡ **Neon Conic Motion**: High-contrast vibrant wave motions.
   - 🖤 **Minimal Slate Dark**: Modern clean dark background.
4. **Batch Queue Pipeline**: Render 10–50 social videos daily with custom stressor prompts in parallel.
5. **Social Publishing Hub**: Platform previewers with auto-generated caption copy & hashtag clouds.

---

## 🔧 Automated CLI Commands

- **Fetch Audio & Subtitles**:
  ```bash
  npx tsx scripts/fetch-audio.ts "Imposter syndrome before presenting"
  ```
- **Render Video to MP4**:
  ```bash
  npx tsx scripts/render-video.ts
  ```
- **Run Full Daily Batch**:
  ```bash
  npx tsx scripts/scheduled-batch.ts
  ```

---

## 🔐 Environment Variables (.env)

Create a `.env` file for remote backend API integration:

```env
UNBLOCK_FOCUS_API_URL=http://localhost:8000
YOUTUBE_API_KEY=your_youtube_key
INSTAGRAM_ACCESS_TOKEN=your_meta_token
```
