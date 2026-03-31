import type { TableColumn } from '../types';

const fmtDate = (val: unknown) => (val ? new Date(val as string).toLocaleDateString() : '—');
const fmtMoney = (val: unknown) => `AED ${val ?? 0}`;

/** Compact columns for the bookings grid; full row opens in a modal. */
export const BOOKING_SUMMARY_COLUMNS: TableColumn[] = [
  { key: 'order_number', label: 'Order #' },
  { key: 'created_at', label: 'Date', formatter: fmtDate },
  {
    key: 'customer_firstname',
    label: 'Customer',
    formatter: (_: unknown, row: any) =>
      `${row?.customer_firstname || ''} ${row?.customer_lastname || ''}`.trim() || '—',
  },
  { key: 'customer_email', label: 'Email', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'customer_phone', label: 'Phone', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'address_city', label: 'City', formatter: (val: unknown) => (val ? String(val) : '—') },
  { key: 'amount', label: 'Amount', formatter: fmtMoney },
  { key: 'staff_name', label: 'Staff', formatter: (val: unknown) => (val ? String(val) : '—') },
];
