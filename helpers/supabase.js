require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const createMeditationTask = async (taskData) => {
  if (!taskData.user_id) {
    throw new Error('user_id is required');
  }

  const { status, progress, error, ...dataToInsert } = taskData;

  const { data, error: supabaseError } = await supabase
    .from('meditations')
    .insert([{
      ...dataToInsert
    }])
    .select()
    .single();

  if (supabaseError) throw supabaseError;
  return data;
};

const updateMeditationTask = async (taskId, updates) => {
  const { status, progress, error, ...dataToUpdate } = updates;

  const { data, error: supabaseError } = await supabase
    .from('meditations')
    .update({
      ...dataToUpdate
    })
    .eq('id', taskId)
    .select()
    .single();

  if (supabaseError) throw supabaseError;
  return data;
};

const getMeditationTask = async (taskId) => {
  const { data, error } = await supabase
    .from('meditations')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
};

const uploadAudioFile = async (taskId, audioBuffer) => {
  const fileName = `meditation_${taskId}.mp3`;
  const { data, error } = await supabase.storage
    .from('meditation-audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600'
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('meditation-audio')
    .getPublicUrl(fileName);

  return publicUrl;
};

module.exports = {
  createMeditationTask,
  updateMeditationTask,
  getMeditationTask,
  uploadAudioFile
}; 