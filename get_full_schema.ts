
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

async function getFullSchema() {
  console.log('--- Fetching Schema from Database ---');
  
  // Try to fetch columns via RPC or direct select if enabled, 
  // but since we only have anon key, we'll try to select 1 row from each suspected table
  const knownTables = [
    'booking_records', 
    'payment_records', 
    'invoice_recordings', 
    'customer_messages', 
    'parts', 
    'admin_users', 
    'service_categories', 
    'service_subcategories', 
    'service_rules', 
    'rule_conditions', 
    'rule_actions'
  ];

  for (const table of knownTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table: ${table} | Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`Table: ${table} | Columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
       // If no data, try to get column names by selecting an empty set
       const { data: colsData, error: colsError } = await (supabase as any).from(table).select('*').limit(0);
       if (colsError) {
         console.log(`Table: ${table} | Could not fetch columns (Empty table)`);
       } else {
         // Some clients show keys even for empty data if initialized from metadata
         console.log(`Table: ${table} | Empty (Data required for key detection via JS SDK)`);
       }
    }
  }
}

getFullSchema();
