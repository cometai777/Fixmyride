import type { TableColumn } from '../types';

const fmtDate = (val: unknown) => (val ? new Date(val as string).toLocaleDateString() : '—');
const fmtMoney = (val: unknown) => `AED ${val ?? 0}`;

/** Compact columns for invoices; full row opens in a modal. */
export const INVOICE_SUMMARY_COLUMNS: TableColumn[] = [
  { key: 'invoice_number', label: 'Invoice #', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'invoice_date', label: 'Invoice date', formatter: fmtDate },
  { key: 'customer_email', label: 'Customer email', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'due_date', label: 'Due date', formatter: fmtDate },
  { key: 'total_tax', label: 'Total tax', formatter: fmtMoney },
];

