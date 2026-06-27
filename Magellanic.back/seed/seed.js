import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const db = createClient(supabaseUrl, supabaseKey);

const constellations = JSON.parse(readFileSync(new URL('../../data/constellations.json', import.meta.url), 'utf-8'));

async function seed() {
  const { error } = await db.from('constellations').insert(constellations);
  if (error) {
    console.error('Seed error:', error.message);
    // Try individual inserts as fallback
    for (const c of constellations) {
      const { error: ie } = await db.from('constellations').insert(c);
      if (ie) console.error(`Failed: ${c.name} — ${ie.message}`);
      else console.log(`Seeded ${c.name}`);
    }
  } else {
    console.log(`Seeded ${constellations.length} constellations`);
  }
  console.log('Seed complete');
}
seed().catch(console.error);
