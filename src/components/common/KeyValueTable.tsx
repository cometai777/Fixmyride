import type { ReactNode } from 'react';
import { displayFieldLabel } from '../../lib/fieldLabels';

export type KeyValueRow = { rowKey: string; field: string; value: ReactNode };

/** Two-column field/value table — fixed layout so columns don’t collapse. */
const KeyValueTable = ({ rows }: { rows: KeyValueRow[] }) => {
  if (rows.length === 0) return null;
  return (
    <div className="kv-table-wrap">
      <table className="kv-table">
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rowKey}>
              <td className="kv-table-field">
                {displayFieldLabel(r.field) || '\u00A0'}
              </td>
              <td className="kv-table-value">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KeyValueTable;
