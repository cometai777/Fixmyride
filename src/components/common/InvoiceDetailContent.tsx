import { X } from 'lucide-react';
import KeyValueTable from './KeyValueTable';
import { ServicesItemsTable } from './BookingFieldItemTables';

function fmtDateTime(v: unknown) {
  if (!v) return '—';
  return new Date(v as string).toLocaleString();
}

function fmtDate(v: unknown) {
  if (!v) return '—';
  return new Date(v as string).toLocaleDateString();
}

function fmtMoney(v: unknown) {
  if (v == null || v === '') return '—';
  return `AED ${v}`;
}

export interface InvoiceDetailContentProps {
  row: Record<string, unknown>;
  onClose: () => void;
}

/** Full invoice row shown in the row-click modal. */
const InvoiceDetailContent = ({ row, onClose }: InvoiceDetailContentProps) => {
  const pdf = row.invoice_link ? String(row.invoice_link) : '';

  return (
    <>
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
        <X />
      </button>
      <h2 style={{ marginBottom: 20, fontSize: '20px', paddingRight: 40 }}>Invoice details</h2>

      <div style={{ marginBottom: 18 }}>
        <KeyValueTable
          rows={[
            { rowKey: 'invoice_number', field: 'invoice_number', value: String(row.invoice_number ?? '—') },
            { rowKey: 'customer_email', field: 'customer_email', value: String(row.customer_email ?? '—') },
            { rowKey: 'billing_address', field: 'billing_address', value: String(row.billing_address ?? '—') },
            { rowKey: 'invoice_date', field: 'invoice_date', value: fmtDate(row.invoice_date) },
            { rowKey: 'due_date', field: 'due_date', value: fmtDate(row.due_date) },
            { rowKey: 'total_tax', field: 'total_tax', value: fmtMoney(row.total_tax) },
            { rowKey: 'discount_value', field: 'discount_value', value: fmtMoney(row.discount_value) },
            { rowKey: 'created_at', field: 'created_at', value: fmtDateTime(row.created_at) },
            { rowKey: 'booking_id', field: 'booking_id', value: String(row.booking_id ?? '—') },
            {
              rowKey: 'invoice_link',
              field: 'invoice_link',
              value: pdf ? (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'var(--primary)', fontWeight: 600 }}
                >
                  View PDF
                </a>
              ) : (
                '—'
              ),
            },
          ]}
        />
      </div>

      <h3
        style={{
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 12,
          borderBottom: '1px solid var(--input-border)',
          paddingBottom: 8,
        }}
      >
        Line items
      </h3>
      <div style={{ border: '1px solid var(--input-border)', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
        {/* Same item_1/item_2 parser + table columns: description/quantity/unit_amount */}
        <ServicesItemsTable raw={row.list_items} />
      </div>
    </>
  );
};

export default InvoiceDetailContent;

