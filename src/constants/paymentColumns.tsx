import type { TableColumn } from '../types';

const fmtDate = (val: unknown) => (val ? new Date(val as string).toLocaleDateString() : '—');
const fmtMoney = (val: unknown) => `AED ${val ?? 0}`;

/** Compact columns for payments; full row opens in a modal. */
export const PAYMENT_SUMMARY_COLUMNS: TableColumn[] = [
  { key: 'created_at', label: 'Date', formatter: fmtDate },
  {
    key: 'customer_firstname',
    label: 'Customer',
    formatter: (_: unknown, row: any) =>
      `${row?.customer_firstname || ''} ${row?.customer_lastname || ''}`.trim() || '—',
  },
  { key: 'amount', label: 'Amount', formatter: fmtMoney },
  { key: 'payment_method', label: 'Method', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'status', label: 'Status', formatter: (val: any) => <span className="badge badge-success">{val || '—'}</span> },
];

