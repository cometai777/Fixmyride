/**
 * Fieldd-style payloads: `{ output: { text, item_1, item_2, item_last } }`.
 * We only use `item_1`, `item_2`, … (also `item 1`, `item1`). Ignore `text` and `item_last`.
 */

function parseJsonIfNeeded(raw: unknown): unknown {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        return JSON.parse(t);
      } catch {
        return raw;
      }
    }
  }
  return raw;
}

/** `item_1`, `item 1`, `item1`, `Item 2` → sort order; null if not an item_N key. */
export function itemKeyOrder(key: string): number | null {
  const m = key.trim().match(/^item[\s_]*(\d+)$/i);
  return m ? Number(m[1]) : null;
}

export function parseKvBlock(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const l = line.trim();
    if (!l) continue;
    const i = l.indexOf(':');
    if (i === -1) continue;
    const key = l
      .slice(0, i)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    const v = l.slice(i + 1).trim();
    if (key) out[key] = v;
  }
  return out;
}

/**
 * Returns non-empty string blocks for `item_1`…`item_n` only (ignores `text`, `item_last`, etc.).
 */
export function extractItemNBlocks(raw: unknown): string[] {
  const data = parseJsonIfNeeded(raw);
  if (!data || typeof data !== 'object') return [];

  // Accept both shapes:
  // 1) { output: { text, item_1, item_2, item_last } }
  // 2) { text, item_1, item_2, item_last }  (no wrapper)
  const maybeWrapped = data as Record<string, unknown>;
  const output =
    maybeWrapped.output && typeof maybeWrapped.output === 'object'
      ? (maybeWrapped.output as Record<string, unknown>)
      : maybeWrapped;
  if (!output || typeof output !== 'object') return [];

  const keys = Object.keys(output as object)
    .filter((k) => itemKeyOrder(k) !== null)
    .sort((a, b) => (itemKeyOrder(a) ?? 0) - (itemKeyOrder(b) ?? 0));

  return keys
    .map((k) => (output as Record<string, unknown>)[k])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}
