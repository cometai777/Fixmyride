import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X } from 'lucide-react';
import KeyValueTable from './KeyValueTable';

/** Parse "key: value" lines from a block string */
function parseBlockLines(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) {
      out[`Line ${Object.keys(out).length + 1}`] = line.trim();
      continue;
    }
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function normalizeValue(raw: unknown): unknown {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t);
      } catch {
        return raw;
      }
    }
    return raw;
  }
  return raw;
}

type ItemBlock = { label: string; fields: Record<string, string> };

function buildItemBlocks(raw: unknown): ItemBlock[] {
  const data = normalizeValue(raw);
  if (data == null) return [];

  const out: ItemBlock[] = [];
  const seen = new Set<string>();

  /** Section title above a table — empty = no title (no "Output", "Line items", "Item last"). */
  const pushBlock = (label: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    const fields = parseBlockLines(trimmed);
    if (Object.keys(fields).length === 0) return;
    out.push({ label, fields });
  };

  /** Flatten Fieldd-style `{ output: { text, item_1, item_last } }` — only the line-item tables, no "Output" row. */
  function pushFromOutputObject(output: Record<string, unknown>) {
    const order = ['text', 'item_1', 'item_2', 'item_3', 'item_4', 'item_5', 'item_last'];
    const keys = Object.keys(output);
    const sorted = [
      ...order.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !order.includes(k)).sort(),
    ];
    for (const key of sorted) {
      const val = output[key];
      if (typeof val !== 'string') continue;
      pushBlock('', val);
    }
  }

  if (typeof data === 'object' && data !== null && 'output' in data) {
    const output = (data as { output: unknown }).output;
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      pushFromOutputObject(output as Record<string, unknown>);
      return out;
    }
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, val] of Object.entries(data)) {
      if (key === 'output' && val && typeof val === 'object' && !Array.isArray(val)) {
        pushFromOutputObject(val as Record<string, unknown>);
        continue;
      }
      if (typeof val === 'string') pushBlock('', val);
      else if (val && typeof val === 'object' && 'text' in val && typeof (val as { text: unknown }).text === 'string') {
        pushBlock('', (val as { text: string }).text);
      }
    }
    if (out.length > 0) return out;
  }

  if (Array.isArray(data)) {
    data.forEach((entry) => {
      if (typeof entry === 'string') {
        pushBlock('', entry);
      } else if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'output' in entry) {
        const inner = (entry as { output: unknown }).output;
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          pushFromOutputObject(inner as Record<string, unknown>);
        } else {
          pushBlock('', JSON.stringify(entry, null, 2));
        }
      } else if (entry && typeof entry === 'object') {
        pushBlock('', JSON.stringify(entry, null, 2));
      }
    });
    return out;
  }

  const fallback = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const fields = parseBlockLines(fallback);
  if (Object.keys(fields).length) out.push({ label: '', fields });
  return out;
}

const InvoiceLineItemsCell = ({ value }: { value: unknown }) => {
  const [open, setOpen] = useState(false);
  const blocks = buildItemBlocks(value);

  if (value == null || value === '') {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }

  if (blocks.length === 0) {
    return (
      <button
        type="button"
        className="btn-remove"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--input-border)',
          background: '#f8fafc',
          color: 'var(--text-muted)',
          fontWeight: 600,
          fontSize: '12px',
          cursor: 'default',
        }}
        disabled
      >
        <Eye size={16} />
        No items
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn-remove"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--input-border)',
          background: 'var(--primary-glow)',
          color: 'var(--primary)',
          fontWeight: 700,
          fontSize: '12px',
          cursor: 'pointer',
        }}
        title="View line items"
      >
        <Eye size={16} strokeWidth={2} />
        View
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="modal-content invoice-line-items-modal"
              style={{
                width: '100%',
                maxWidth: 'min(640px, 100%)',
                minWidth: 0,
                maxHeight: '85vh',
                overflow: 'auto',
              }}
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
                <X />
              </button>
              <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Invoice line items</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {blocks.map((block, idx) => (
                  <div
                    key={`block-${idx}`}
                    style={{
                      border: '1px solid var(--input-border)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      background: '#f8fafc',
                    }}
                  >
                    {block.label?.trim() ? (
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-muted)',
                          marginBottom: '12px',
                        }}
                      >
                        {block.label}
                      </div>
                    ) : null}
                    <KeyValueTable
                      rows={Object.entries(block.fields).map(([k, v]) => ({
                        rowKey: `${idx}-${k}`,
                        field: k,
                        value: v,
                      }))}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InvoiceLineItemsCell;
