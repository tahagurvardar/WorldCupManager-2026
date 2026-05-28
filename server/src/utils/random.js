export function seededRandom(seedText = 'worldcup') {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  return function nextRandom() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function pickWeighted(items, rand = Math.random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rand() * total;

  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

export function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
