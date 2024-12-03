require('dotenv').config();
const axios = require('axios');

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('Missing ELEVENLABS_API_KEY environment variable');
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_IDS = {
  brittney: 'pjcYQlDFKMbcOUp6F5GD',
  ryan: 'pjcYQlDFKMbcOUp6F5GD'
};

const generateAudio = async (text, voiceId) => {
  const response = await axios({
    method: 'post',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    data: {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    },
    responseType: 'arraybuffer'
  });

  return response.data;
};

module.exports = {
  generateAudio,
  VOICE_IDS
}; 