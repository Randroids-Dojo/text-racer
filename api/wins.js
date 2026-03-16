/**
 * /api/wins
 * GET  — returns win counts for all four colors
 * POST — increments the win count for a color
 */

let kv = null;
try {
  kv = require('@vercel/kv').kv;
} catch {
  // KV not available (local dev)
}

const WINS_KEY = 'tr:wins';

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: return current win counts
  if (req.method === 'GET') {
    if (!kv) {
      return res.status(200).json({ r: 0, g: 0, b: 0, y: 0 });
    }

    try {
      const wins = await kv.hgetall(WINS_KEY);
      return res.status(200).json({
        r: parseInt(wins?.r || '0', 10),
        g: parseInt(wins?.g || '0', 10),
        b: parseInt(wins?.b || '0', 10),
        y: parseInt(wins?.y || '0', 10),
      });
    } catch (err) {
      console.error('Wins fetch error:', err);
      return res.status(200).json({ r: 0, g: 0, b: 0, y: 0 });
    }
  }

  // POST: increment a color's win count
  if (req.method === 'POST') {
    if (!kv) {
      return res.status(503).json({ error: 'KV not available' });
    }

    const { color } = req.body || {};
    if (!color || !['r', 'g', 'b', 'y'].includes(color)) {
      return res.status(400).json({ error: 'Invalid color' });
    }

    try {
      await kv.hincrby(WINS_KEY, color, 1);
      const wins = await kv.hgetall(WINS_KEY);
      return res.status(200).json({
        r: parseInt(wins?.r || '0', 10),
        g: parseInt(wins?.g || '0', 10),
        b: parseInt(wins?.b || '0', 10),
        y: parseInt(wins?.y || '0', 10),
      });
    } catch (err) {
      console.error('Win increment error:', err);
      return res.status(500).json({ error: 'Failed to save win' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
