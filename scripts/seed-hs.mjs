import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const keywords = {
  agricultural: /\b(cocoa|cacao|coffee|tea|spice|spices|grain|grains|rice|wheat|maize|corn|bean|beans|nuts|seed|seeds|fruit|fruits|vegetable|vegetables|cashew|sesame|shea|palm|oil|cotton|cocoa beans)\b/i,
  textiles: /\b(textile|fabric|cotton|garment|apparel|cloth|yarn|linen)\b/i,
  electronics: /\b(electronic|electronics|phone|mobile|laptop|computer|battery|solar|inverter|charger)\b/i,
  machinery: /\b(machine|machinery|tractor|equipment|generator|motor|engine)\b/i,
  chemicals: /\b(chemical|fertilizer|pesticide|herbicide|solvent|detergent)\b/i
};

function inferHSCode(title, desc) {
  const text = `${title || ''} ${desc || ''}`.toLowerCase();
  if (keywords.agricultural.test(text)) return '0101';
  if (keywords.textiles.test(text)) return '5201';
  if (keywords.electronics.test(text)) return '8501';
  if (keywords.machinery.test(text)) return '8401';
  if (keywords.chemicals.test(text)) return '2801';
  return '9999';
}

let from = 0;
const size = 500;
let updated = 0;
let scanned = 0;

while (true) {
  const { data, error } = await supabase
    .from('trades')
    .select('id,title,description,metadata')
    .range(from, from + size - 1);

  if (error) {
    console.error('Fetch error', error);
    process.exit(1);
  }
  if (!data || data.length === 0) break;

  for (const trade of data) {
    scanned++;
    const meta = trade.metadata || {};
    if (meta.hs_code || meta.hsCode) continue;
    const hs = inferHSCode(trade.title, trade.description);
    const { error: updErr } = await supabase
      .from('trades')
      .update({ metadata: { ...meta, hs_code: hs } })
      .eq('id', trade.id);
    if (updErr) {
      console.error('Update error', trade.id, updErr);
    } else {
      updated++;
    }
  }

  from += size;
}

console.log(`Seeded hs_code on ${updated} trades (scanned ${scanned})`);
