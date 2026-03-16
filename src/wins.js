// Win tracking — fetches and submits wins via /api/wins

const API_URL = '/api/wins';

// Fallback wins for local dev (no API)
let localWins = { r: 0, g: 0, b: 0, y: 0 };

export async function fetchWins() {
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      localWins = data;
      return data;
    }
  } catch {
    // Local dev — API not available
  }
  return { ...localWins };
}

export async function submitWin(color) {
  // Optimistic update
  localWins[color] = (localWins[color] || 0) + 1;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    });
    if (res.ok) {
      const data = await res.json();
      localWins = data;
      return data;
    }
  } catch {
    // Local dev — keep optimistic update
  }
  return { ...localWins };
}
