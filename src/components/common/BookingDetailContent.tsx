import { isValidElement, type ReactNode } from 'react';
import { X } from 'lucide-react';
import KeyValueTable from './KeyValueTable';
import { ServicesItemsTable, TaxListItemsTable, QuestionsItemsTable } from './BookingFieldItemTables';

function parseMaybeJson(raw: unknown): unknown {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        return JSON.parse(t);
      } catch {
        return raw;
      }
    }
  }
  return raw;
}

function ObjectFields({ data }: { data: Record<string, unknown | ReactNode> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return <p style={{ color: 'var(--text-muted)', margin: 0 }}>—</p>;
  return (
    <KeyValueTable
      rows={entries.map(([k, v]) => ({
        rowKey: k,
        field: k,
        value: isValidElement(v) ? v : <ValueNode value={v} depth={1} />,
      }))}
    />
  );
}

function ValueNode({ value, depth }: { value: unknown; depth: number }) {
  if (value == null) return <>—</>;
  if (typeof value === 'boolean') return <>{value ? 'Yes' : 'No'}</>;
  if (typeof value === 'number') return <>{value}</>;
  if (typeof value === 'string') {
    const parsed = parseMaybeJson(value);
    if (parsed !== value && typeof parsed === 'object' && parsed !== null) {
      return <ValueNode value={parsed} depth={depth} />;
    }
    if (value.includes('\n')) {
      const lines = value.split(/\r?\n/).filter(Boolean);
      const looksLikeKv = lines.every((l) => l.includes(':'));
      if (looksLikeKv) {
        const obj: Record<string, string> = {};
        for (const line of lines) {
          const i = line.indexOf(':');
          if (i > -1) obj[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
        return <ObjectFields data={obj as Record<string, unknown>} />;
      }
      return (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {lines.map((l, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {l}
            </li>
          ))}
        </ul>
      );
    }
    return <>{value}</>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <>—</>;
    return (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {value.map((item, i) => (
          <li key={i} style={{ marginBottom: 10 }}>
            {typeof item === 'object' && item !== null ? (
              <div
                style={{
                  border: '1px solid var(--input-border)',
                  borderRadius: 8,
                  padding: 10,
                  background: '#f8fafc',
                }}
              >
                <ObjectFields data={item as Record<string, unknown>} />
              </div>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o);
    /* Hide wrapper key "output" — show inner content only (no "Output" row). */
    if (keys.length === 1 && keys[0] === 'output') {
      return <ValueNode value={o.output} depth={depth} />;
    }
    return <ObjectFields data={o} />;
  }
  return <>{String(value)}</>;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
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
        {title}
      </h3>
      {children}
    </section>
  );
}

function fmtMoney(v: unknown) {
  if (v == null || v === '') return '—';
  return `AED ${v}`;
}

function fmtDate(v: unknown) {
  if (!v) return '—';
  return new Date(v as string).toLocaleString();
}

function fmtCoord(v: unknown) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : '—';
}

export interface BookingDetailContentProps {
  row: Record<string, unknown>;
  onClose: () => void;
}

/** Full booking row: sections + structured JSON fields (services, tax_list, booking_questions). */
const BookingDetailContent = ({ row, onClose }: BookingDetailContentProps) => {
  const customerName = `${row.customer_firstname || ''} ${row.customer_lastname || ''}`.trim() || '—';

  const addressParts = [row.address_line, row.address_city, row.address_state, row.address_postal_code, row.address_country].filter(Boolean);
  const addressLine = addressParts.length ? addressParts.join(', ') : '—';

  const shortUrl = row.short_url ? String(row.short_url) : '';
  const href = shortUrl && !shortUrl.startsWith('http') ? `https://${shortUrl}` : shortUrl;

  return (
    <>
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
        <X />
      </button>
      <h2 style={{ marginBottom: 20, fontSize: '20px', paddingRight: 40 }}>Booking details</h2>

      <Block title="Order">
        <ObjectFields
          data={{
            'Order #': row.order_number,
            Invoice: row.invoice_number,
            Created: fmtDate(row.created_at),
            'Short URL':
              href ? (
                <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Open link
                </a>
              ) : (
                '—'
              ),
          }}
        />
      </Block>

      <Block title="Customer">
        <ObjectFields
          data={{
            Name: customerName,
            Phone: row.customer_phone,
            Email: row.customer_email,
            Company: row.customer_company_name,
          }}
        />
      </Block>

      <Block title="Address">
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{addressLine}</p>
      </Block>

      <Block title="Job site & schedule">
        <ObjectFields
          data={{
            'Job address': row.job_address,
            Latitude: fmtCoord(row.latitude),
            Longitude: fmtCoord(row.longitude),
            Start: fmtDate(row.start_at),
            End: fmtDate(row.end_at),
            Staff: row.staff_name,
          }}
        />
      </Block>

      <Block title="Amounts">
        <ObjectFields
          data={{
            Amount: fmtMoney(row.amount),
            Tax: fmtMoney(row.tax),
            'Discounted amount': fmtMoney(row.discounted_amount),
            'Transaction fee': fmtMoney(row.transaction_fee),
          }}
        />
      </Block>

      <Block title="Services">
        <div style={{ border: '1px solid var(--input-border)', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
          <ServicesItemsTable raw={parseMaybeJson(row.services) ?? row.services} />
        </div>
      </Block>

      <Block title="Tax list">
        <div style={{ border: '1px solid var(--input-border)', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
          <TaxListItemsTable raw={parseMaybeJson(row.tax_list) ?? row.tax_list} />
        </div>
      </Block>

      <Block title="Booking questions">
        <div style={{ border: '1px solid var(--input-border)', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
          <QuestionsItemsTable raw={parseMaybeJson(row.booking_questions) ?? row.booking_questions} />
        </div>
      </Block>
    </>
  );
};

export default BookingDetailContent;
