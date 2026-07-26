import fs from 'fs';
import path from 'path';

interface FetchOptions {
  stressor: string;
  durationCategory?: string;
  durationMins?: number;
  voice?: string;
  music?: string;
  apiUrl?: string;
}

export async function fetchAudioAndSubtitles(options: FetchOptions) {
  const apiUrl = options.apiUrl || process.env.UNBLOCK_FOCUS_API_URL || 'http://localhost:8000';
  const apiKey = process.env.INTERNAL_API_KEY || 'test-key';

  console.log(`[Unblock Studio] Sending generate request for stressor: "${options.stressor}"...`);

  try {
    const res = await fetch(`${apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        stressor: options.stressor,
        duration_category: options.durationCategory || 'quick',
        voice: options.voice || 'gentle_female',
        music: options.music || 'none',
        include_words_ts: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const jobId = data.job_id;
    console.log(`[Unblock Studio] Job initialized with ID: ${jobId}. Polling status...`);

    let completed = false;
    let jobResult: any = null;

    while (!completed) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch(`${apiUrl}/api/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (statusRes.ok) {
        jobResult = await statusRes.json();
        console.log(`[Unblock Studio] Status: ${jobResult.status} (${jobResult.progress_pct}%)...`);
        if (jobResult.status === 'complete' || jobResult.status === 'failed') {
          completed = true;
        }
      }
    }

    if (jobResult.status === 'failed') {
      throw new Error(`Generation failed: ${jobResult.error}`);
    }

    // Write metadata payload
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const payloadPath = path.join(outputDir, 'latest_payload.json');
    fs.writeFileSync(payloadPath, JSON.stringify(jobResult, null, 2));
    console.log(`[Unblock Studio] Saved audio payload to: ${payloadPath}`);

    return jobResult;
  } catch (error) {
    console.warn(`[Unblock Studio] Backend connection warning: ${error}. Using cached/fallback schema.`);
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const stressorArg = process.argv[2] || 'Imposter syndrome before presenting to leadership';
  fetchAudioAndSubtitles({ stressor: stressorArg });
}
