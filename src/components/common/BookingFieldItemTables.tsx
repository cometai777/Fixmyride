import type { ReactNode } from 'react';
import { extractItemNBlocks, parseKvBlock } from '../../lib/fielddOutputItems';

const empty = <span style={{ color: 'var(--text-muted)' }}>—</span>;

function tableWrap(children: ReactNode) {
  return <div className="kv-table-wrap booking-field-item-table">{children}</div>;
}

/** Services: one row per item_n — columns description, quantity, unit_amount */
export function ServicesItemsTable({ raw }: { raw: unknown }) {
  const rows = extractItemNBlocks(raw).map(parseKvBlock);
  if (rows.length === 0) return empty;

  return tableWrap(
    <table className="kv-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style={{ width: 100 }}>Quantity</th>
          <th style={{ width: 120 }}>Unit amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.description ?? '—'}</td>
            <td>{r.quantity ?? '—'}</td>
            <td>{r.unit_amount ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Tax list: one row per item_n — columns name, tax */
export function TaxListItemsTable({ raw }: { raw: unknown }) {
  const rows = extractItemNBlocks(raw).map(parseKvBlock);
  if (rows.length === 0) return empty;

  return tableWrap(
    <table className="kv-table">
      <thead>
        <tr>
          <th>Name</th>
          <th style={{ width: 140 }}>Tax</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.name ?? '—'}</td>
            <td>{r.tax ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function humanizeKey(k: string) {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Questions: one row per item_n; columns = union of parsed keys */
export function QuestionsItemsTable({ raw }: { raw: unknown }) {
  const rows = extractItemNBlocks(raw).map(parseKvBlock);
  if (rows.length === 0) return empty;

  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).sort();
  if (allKeys.length === 0) return empty;

  return tableWrap(
    <table className="kv-table">
      <thead>
        <tr>
          {allKeys.map((k) => (
            <th key={k}>{humanizeKey(k)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {allKeys.map((k) => (
              <td key={k}>{r[k] ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
