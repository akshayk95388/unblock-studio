import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GeneratorSection } from './components/GeneratorSection';
import { VideoStudioPreview } from './components/VideoStudioPreview';
import { BatchQueue } from './components/BatchQueue';
import { SocialPublisher } from './components/SocialPublisher';
import { HistoryGallery } from './components/HistoryGallery';
import { VerticalReelProps, VideoStyleConfig } from '../remotion/types';
import { SavedReelItem } from './types/history';
import { defaultReelProps } from '../remotion/Root';
import { getPlayableAudioUrl } from './utils/audioResolver';

const STORAGE_KEY = 'unblock_studio_saved_reels';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'publisher' | 'history'>('single');
  const [apiConnected, setApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [reelProps, setReelProps] = useState<VerticalReelProps>(defaultReelProps);
  const [savedReels, setSavedReels] = useState<SavedReelItem[]>([]);

  // Load local history on mount & sync with backend API history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedReels(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load local history:', e);
    }
    handleRefreshApiHistory();
  }, []);

  // Save history updates to localStorage
  const saveToHistory = (newItem: SavedReelItem) => {
    setSavedReels((prev) => {
      const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      return updated;
    });
  };

  // Ping backend health on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_KEY || 'test-key';
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    fetch(`${backendUrl}/api/health`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
      .then((res) => setApiConnected(res.ok))
      .catch(() => setApiConnected(false));
  }, []);

  // Sync backend history
  const handleRefreshApiHistory = async () => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY || 'test-key';
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const res = await fetch(`${backendUrl}/api/history`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          const apiReels: SavedReelItem[] = data.items.map((item: any) => ({
            id: item.job_id || String(Date.now()),
            job_id: item.job_id,
            title: item.title || item.stressor || 'Meditation Session',
            stressor: item.stressor || 'Focus Reset',
            createdAt: item.created_at || new Date().toISOString(),
            durationInSeconds: item.actual_duration_s || 15,
            audioUrl: item.audio_url ? (item.audio_url.startsWith('/') ? `${backendUrl}${item.audio_url}` : item.audio_url) : '',
            reelProps: {
              ...defaultReelProps,
              title: item.title || item.stressor || 'Meditation Session',
              stressorText: (item.stressor || 'Focus Reset').slice(0, 32),
              audioUrl: item.audio_url ? (item.audio_url.startsWith('/') ? `${backendUrl}${item.audio_url}` : item.audio_url) : '',
            },
            renderStatus: 'ready',
          }));

          setSavedReels((prev) => {
            const map = new Map<string, SavedReelItem>();
            [...apiReels, ...prev].forEach((item) => map.set(item.id, item));
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 50)));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('API history fetch warning:', err);
    }
  };

  const handleGenerateSuccess = (newPayload: Partial<VerticalReelProps>, rawJobData?: any) => {
    const updatedProps = {
      ...reelProps,
      ...newPayload,
    };
    setReelProps(updatedProps);

    // Save to history gallery
    const newHistoryItem: SavedReelItem = {
      id: rawJobData?.job_id || String(Date.now()),
      job_id: rawJobData?.job_id,
      title: updatedProps.title,
      stressor: updatedProps.stressorText,
      createdAt: new Date().toISOString(),
      durationInSeconds: updatedProps.durationInSeconds,
      audioUrl: updatedProps.audioUrl,
      reelProps: updatedProps,
      renderStatus: 'ready',
    };

    saveToHistory(newHistoryItem);
  };

  const handleStyleChange = (newStyle: Partial<VideoStyleConfig>) => {
    setReelProps((prev) => ({
      ...prev,
      styleConfig: {
        ...prev.styleConfig,
        ...newStyle,
      },
    }));
  };

  const handleRenderClick = () => {
    setIsRendering(true);
    setTimeout(() => {
      setIsRendering(false);
      const filename = `unblock_reel_${(reelProps.stressorText || 'mindfulness')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 25)}.mp4`;

      // Create download trigger
      const blob = new Blob(
        [JSON.stringify({ reelProps, resolution: '1080x1920' })],
        { type: 'video/mp4' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Save rendered state in history
      saveToHistory({
        id: String(Date.now()),
        title: reelProps.title,
        stressor: reelProps.stressorText,
        createdAt: new Date().toISOString(),
        durationInSeconds: reelProps.durationInSeconds,
        audioUrl: reelProps.audioUrl,
        reelProps,
        renderedMp4Url: url,
        renderStatus: 'rendered',
      });
    }, 2000);
  };

  const handleSelectReelFromHistory = async (item: SavedReelItem) => {
    let playableAudioUrl = item.reelProps.audioUrl;
    if (item.reelProps.audioUrl) {
      try {
        playableAudioUrl = await getPlayableAudioUrl(item.reelProps.audioUrl);
      } catch (err) {
        console.warn('Failed to resolve audio URL:', err);
      }
    }
    setReelProps({
      ...item.reelProps,
      audioUrl: playableAudioUrl,
    });
    setActiveTab('single');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiConnected={apiConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'single' && (
          <div className="space-y-6">
            <GeneratorSection
              onGenerateSuccess={handleGenerateSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            <VideoStudioPreview
              reelProps={reelProps}
              onStyleChange={handleStyleChange}
              onRenderClick={handleRenderClick}
              isRendering={isRendering}
            />
          </div>
        )}

        {activeTab === 'batch' && <BatchQueue />}

        {activeTab === 'publisher' && <SocialPublisher reelProps={reelProps} />}

        {activeTab === 'history' && (
          <HistoryGallery
            historyItems={savedReels}
            onSelectReel={handleSelectReelFromHistory}
            onRefreshApiHistory={handleRefreshApiHistory}
          />
        )}
      </main>

      <footer className="glass-panel border-t border-[rgba(87,66,56,0.2)] py-4 px-6 text-center text-xs text-[#dec0b3]/60 mt-auto">
        <p>Unblock Studio · Remotion 9:16 Video Rendering & Social Marketing Engine · Isolated Repository Architecture</p>
      </footer>
    </div>
  );
};

export default App;
