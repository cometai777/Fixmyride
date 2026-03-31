import type { ReactNode } from 'react';

export type DetailColumn = {
  key: string;
  /** Column header (replaces generic "Field"). */
  header: string;
  cell: ReactNode;
};

type Props = {
  columns: DetailColumn[];
  /** Right-align cells (e.g. currency). */
  numeric?: boolean;
};

/**
 * One data row: headers are the actual field names (Job address, Latitude, …),
 * not "Field" / "Value".
 */
const DetailColumnsTable = ({ columns, numeric }: Props) => {
  if (columns.length === 0) return null;
  return (
    <div className="detail-columns-table-wrap">
      <table className={`detail-columns-table${numeric ? ' detail-columns-table--numeric' : ''}`}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map((c) => (
              <td key={c.key}>{c.cell}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DetailColumnsTable;
