
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('parts').select('*').limit(1);
  if (error) {
    console.error('Error fetching parts:', error);
  } else {
    console.log('Parts columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found in parts table');
  }

  const tables = ['service_categories', 'service_subcategories', 'booking_records', 'payment_records', 'admin_users'];
  for (const table of tables) {
      const { data: tData, error: tErr } = await supabase.from(table).select('*').limit(1);
      if (tErr) console.error(`Error fetching ${table}:`, tErr.message);
      else console.log(`${table} columns:`, tData && tData.length > 0 ? Object.keys(tData[0]) : 'No data');
  }
}

checkSchema();
