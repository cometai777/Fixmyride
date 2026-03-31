/** Normalize Fieldd / API keys for display in the first column. */
export function displayFieldLabel(rawKey: string): string {
  const k = rawKey.trim().toLowerCase().replace(/\s+/g, '_');
  // Hide awkward wrapper keys/labels
  if (k === 'text') return '';
  if (k === 'item_last' || /^item_\d+$/.test(k) || /^item\d+$/.test(k)) return 'Item';
  return rawKey.replace(/_/g, ' ');
}

