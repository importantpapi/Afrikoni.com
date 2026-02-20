/**
 * Vercel Cron Route — Supply Proof Expiry
 * ========================================
 * Called daily at 03:00 UTC by Vercel cron (see vercel.json).
 * Forwards the request to the Supabase edge function
 * `supply-proof-expiry` with the shared CRON_SECRET.
 *
 * Required env vars (set in Vercel dashboard):
 *   CRON_SECRET                — shared secret between Vercel and Supabase
 *   NEXT_PUBLIC_SUPABASE_URL   — or VITE_SUPABASE_URL
 */
export default async function handler(req, res) {
  // Vercel passes Authorization: Bearer <CRON_SECRET> automatically
  const authHeader = req.headers['authorization'];

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://wmjxiazhvjaadzdsroqa.supabase.co';

  const edgeFnUrl = `${supabaseUrl}/functions/v1/supply-proof-expiry`;

  try {
    const resp = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
        // Forward Vercel's Authorization header as fallback
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ source: 'vercel-cron' }),
    });

    const data = await resp.json();
    console.log('[cron/supply-proof-expiry]', data);

    return res.status(resp.ok ? 200 : 500).json(data);
  } catch (err) {
    console.error('[cron/supply-proof-expiry] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
