// SBB (Streamer Billboard) integration via postMessage

export function initSBB(callbacks) {
  let sbbEnabled = false;

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.source !== 'sbb') return;

    if (msg.type === 'init') {
      sbbEnabled = true;
      if (callbacks.onInit) callbacks.onInit();
      return;
    }

    if (msg.type === 'tr') {
      const color = (msg.color || '').toLowerCase();
      const word = (msg.word || '').trim();
      if (!color || !word) return;
      if (!['r', 'g', 'b', 'y'].includes(color)) return;
      if (callbacks.onCommand) callbacks.onCommand(color, word, msg.username || '');
    }
  });

  return {
    get enabled() { return sbbEnabled; },
  };
}
