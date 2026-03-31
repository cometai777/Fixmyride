import { X } from 'lucide-react';
import KeyValueTable from './KeyValueTable';

function fmtDateTime(v: unknown) {
  if (!v) return '—';
  return new Date(v as string).toLocaleString();
}

function fmtMoney(v: unknown) {
  if (v == null || v === '') return '—';
  return `AED ${v}`;
}

function toDisplay(val: unknown) {
  if (val == null || val === '') return '—';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export interface PaymentDetailContentProps {
  row: Record<string, unknown>;
  onClose: () => void;
}

/** Full payment row shown in the row-click modal. */
const PaymentDetailContent = ({ row, onClose }: PaymentDetailContentProps) => {
  const customerName = `${row.customer_firstname || ''} ${row.customer_lastname || ''}`.trim() || '—';

  const preferredOrder: Array<[string, unknown]> = [
    ['created_at', fmtDateTime(row.created_at)],
    ['status', row.status],
    ['payment_method', row.payment_method],
    ['amount', fmtMoney(row.amount)],
    ['customer', customerName],
    ['customer_email', row.customer_email],
    ['customer_phone', row.customer_phone],
    ['invoice_number', row.invoice_number],
    ['order_number', row.order_number],
  ];

  const preferredKeys = new Set(preferredOrder.map(([k]) => k));
  const extras = Object.entries(row)
    .filter(([k]) => !preferredKeys.has(k))
    .filter(([, v]) => v !== undefined && v !== null && v !== '');

  const rows = [
    ...preferredOrder.filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ...extras,
  ].map(([k, v]) => ({
    rowKey: k,
    field: k,
    value: typeof v === 'string' ? v : toDisplay(v),
  }));

  return (
    <>
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
        <X />
      </button>
      <h2 style={{ marginBottom: 20, fontSize: '20px', paddingRight: 40 }}>Payment details</h2>
      <KeyValueTable rows={rows} />
    </>
  );
};

export default PaymentDetailContent;
