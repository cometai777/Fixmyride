import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const tables = ['booking_records', 'payment_records', 'service_categories', 'service_subcategories', 'parts'];
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*').limit(1);
    if (data && data[0]) {
      console.log(`Table ${table} columns:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${table}: No data or error`);
    }
  }
}
run();
