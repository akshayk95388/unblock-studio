import { fetchAudioAndSubtitles } from './fetch-audio';

const DAILY_TOPICS = [
  'Overcoming imposter syndrome before executive presentations',
  'Late night anxiety and sleep overthinking reset',
  'Coding fatigue break and posture alignment',
  'Social anxiety reset before networking events',
  'Procrastination breakdown into 5-minute micro actions',
];

async function runDailyBatch() {
  console.log('====================================================');
  console.log('🚀 Unblock Studio - Automated Daily Marketing Batch');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📦 Processing ${DAILY_TOPICS.length} social media reels...`);
  console.log('====================================================');

  for (let i = 0; i < DAILY_TOPICS.length; i++) {
    const topic = DAILY_TOPICS[i];
    console.log(`\n[${i + 1}/${DAILY_TOPICS.length}] Processing Topic: "${topic}"`);
    const payload = await fetchAudioAndSubtitles({
      stressor: topic,
      durationCategory: 'quick',
      voice: 'gentle_female',
    });

    if (payload) {
      console.log(`✅ [${i + 1}/${DAILY_TOPICS.length}] Generated Audio & Timestamps. Ready for Remotion Render.`);
    } else {
      console.log(`ℹ️ [${i + 1}/${DAILY_TOPICS.length}] Standalone payload queued.`);
    }
  }

  console.log('\n====================================================');
  console.log('✨ Batch Queue Execution Completed Successfully!');
  console.log('====================================================');
}

runDailyBatch().catch(console.error);
