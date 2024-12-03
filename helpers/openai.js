require('dotenv').config();
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateMeditationScript = async (duration, feeling, style, prompt, sounds) => {
  // Construct the complete prompt
  const completePrompt = `Create a ${duration}-minute ${style} meditation focused on ${feeling}.
    Additional context: ${prompt}
    Ambient sounds to incorporate: ${sounds}
    
    The meditation should:
    - Be calming and guided
    - Include breathing exercises
    - Naturally incorporate the specified ambient sounds
    - Follow the specific style (${style})
    - Address the emotional focus (${feeling})
    
    Format the response as a natural, flowing meditation script.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { 
        role: "system", 
        content: "You are an experienced meditation guide creating calming, therapeutic meditation scripts. You excel at incorporating natural sounds and specific emotional themes into your guided meditations." 
      },
      { 
        role: "user", 
        content: completePrompt 
      }
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
};

module.exports = {
  generateMeditationScript
}; 