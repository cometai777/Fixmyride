
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log('Checking parts table...');
  const { data, error } = await supabase.from('parts').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  } else {
    console.log('Columns found:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows found to inspect columns');
  }
}

run();
