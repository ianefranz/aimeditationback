const express = require('express');
const router = express.Router();
const { generateMeditationScript } = require('../helpers/openai');
const { generateAudio, VOICE_IDS } = require('../helpers/elevenlabs');
const { 
  createMeditationTask, 
  updateMeditationTask, 
  getMeditationTask,
  uploadAudioFile 
} = require('../helpers/supabase');

// Start a new meditation generation task
router.post('/start-task', async (req, res, next) => {
  try {
    const { duration, feeling, voice, style, prompt, sounds, user_id } = req.body;

    // Validate required inputs
    if (!duration || !feeling || !voice || !style || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['duration', 'feeling', 'voice', 'style', 'user_id']
      });
    }

    // Create initial task record
    const completePrompt = `${duration}-minute ${style} meditation focused on ${feeling}. ${prompt || ''} ${sounds ? `With ambient sounds: ${sounds}` : ''}`;
    
    const task = await createMeditationTask({
      user_id,
      duration,
      feeling,
      voice,
      style,
      prompt: prompt || '',
      sounds: sounds || '',
      complete_prompt: completePrompt,
      status: 'pending'
    });

    // Start async processing
    processMeditationTask(task.id, task).catch(async (error) => {
      console.error('Task processing failed:', error);
      await updateMeditationTask(task.id, {
        status: 'failed',
        error: error.message
      });
    });

    res.json({ 
      taskId: task.id,
      status: 'pending' 
    });
  } catch (error) {
    next(error);
  }
});

// Get task status with more details
router.get('/task-status/:taskId', async (req, res, next) => {
  try {
    const task = await getMeditationTask(req.params.taskId);
    
    // Infer status from available fields
    let status = 'pending';
    if (task.audio_file_url) status = 'completed';
    else if (task.ai_generated_text) status = 'generating-audio';
    else if (task.complete_prompt) status = 'in-progress';

    res.json({ 
      status,
      audio_file_url: task.audio_file_url || null,
      ai_generated_text: task.ai_generated_text || null
    });
  } catch (error) {
    next(error);
  }
});

// Get task result
router.get('/task-result/:taskId', async (req, res, next) => {
  try {
    const task = await getMeditationTask(req.params.taskId);
    
    if (!task.audio_file_url) {
      return res.status(404).json({ 
        error: 'Task not completed yet' 
      });
    }

    res.json({
      title: task.title,
      description: task.description,
      duration: task.duration,
      feeling: task.feeling,
      style: task.style,
      audio_file_url: task.audio_file_url
    });
  } catch (error) {
    next(error);
  }
});

// Async task processing function
async function processMeditationTask(taskId, taskData) {
  try {
    // Generate meditation script
    const meditationScript = await generateMeditationScript(
      taskData.duration,
      taskData.feeling,
      taskData.style,
      taskData.prompt,
      taskData.sounds
    );

    // Save the generated text
    await updateMeditationTask(taskId, {
      ai_generated_text: meditationScript
    });

    // Generate audio
    const audioBuffer = await generateAudio(meditationScript, VOICE_IDS[taskData.voice]);

    // Upload audio file
    const audio_file_url = await uploadAudioFile(taskId, audioBuffer);

    // Update task with completion data
    await updateMeditationTask(taskId, {
      audio_file_url,
      title: `${taskData.duration}-Minute ${taskData.feeling} ${taskData.style} Meditation`,
      description: meditationScript.substring(0, 200) + '...',
      script: meditationScript
    });
  } catch (error) {
    console.error('Task processing failed:', error);
    throw error;
  }
}

module.exports = router; 