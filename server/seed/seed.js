import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

const constellations = JSON.parse(readFileSync('./data/constellations.json', 'utf-8'));

async function seed() {
  for (const c of constellations) {
    const { error } = await db.from('constellations').upsert(c, { onConflict: 'iau_code' });
    if (error) console.error(`Failed: ${c.name} — ${error.message}`);
    else console.log(`Seeded ${c.name}`);
  }
  console.log('Seed complete');
}
seed().catch(console.error);
