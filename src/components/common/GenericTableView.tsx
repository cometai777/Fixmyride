import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Trash2, Loader2, X } from 'lucide-react';
import Header from './Header';
import SearchBar from './SearchBar';
import ModalForm from './ModalForm';
import ConfirmDialog from './ConfirmDialog';
import { supabase, supabaseUrl } from '../../lib/supabase';
import type { GenericTableViewProps } from '../../types/index';

const GenericTableView = ({ title, tableName, columns, fields, primaryKey = 'id', onToast, hideDelete, stickyFirstColumn, renderRowDetail, tableLayout = 'auto', tableMinWidth, rowClickEdits = true, detailOverlayCloses = true }: GenericTableViewProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [detailRow, setDetailRow] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setData([]);
    setErrorMsg(null);

    async function fetchData() {
      if (supabaseUrl.includes('placeholder')) {
        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
        return;
      }
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const { data: rows, error }: any = await Promise.race([
          (supabase as any).from(tableName).select('*').limit(200).order(primaryKey, { ascending: false }),
          timeoutPromise
        ]);

        if (cancelled) return;
        if (error) throw error;
        setData(rows || []);
      } catch (err: any) {
        if (cancelled) return;
        console.warn(`Using empty state for ${tableName} due to error/timeout:`, err?.message);
        setData([]);

        if (err?.message?.includes('JWT') || err?.message?.includes('key')) {
          onToast('Authentication Session Disconnected. Entering Demo Mode.', 'error');
          supabase.auth.signOut();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tableName, onToast, primaryKey]);

  const handleSave = async (formData: any) => {
    const isEdit = !!formData[primaryKey];
    const { [primaryKey]: id, ...payload } = formData;

    // Safety check for checkboxes/booleans
    const cleanedPayload = { ...payload };
    Object.keys(cleanedPayload).forEach(key => {
      if (typeof cleanedPayload[key] === 'undefined') delete cleanedPayload[key];
    });

    const { data: result, error } = isEdit
      ? await (supabase as any).from(tableName).update(cleanedPayload).eq(primaryKey, id).select()
      : await (supabase as any).from(tableName).insert([cleanedPayload]).select();

    if (error) {
      console.error('Database Error:', error);
      onToast('Error: ' + error.message, 'error');
    } else {
      if (result && result.length > 0) {
        const savedRecord = result[0];
        if (isEdit) {
          setData(prevData => prevData.map(d => d[primaryKey] === id ? savedRecord : d));
        } else {
          setData(prevData => [savedRecord, ...prevData]);
        }
        onToast('Changes saved to database!', 'success');
        setEditingRow(null);
        setIsAdding(false);
      } else {
        onToast('Database rejected change. Check your RLS policies!', 'error');
      }
    }
  };

  const doDelete = async (idValue: any) => {
    const { data: deleted, error } = await (supabase as any).from(tableName).delete().eq(primaryKey, idValue).select();
    if (error) {
      onToast('Error deleting: ' + error.message, 'error');
    } else if (!deleted || deleted.length === 0) {
      onToast('Deletion blocked by database! Check RLS policies.', 'error');
    } else {
      setData(data.filter((d: any) => d[primaryKey] !== idValue));
      onToast('Record removed successfully', 'success');
    }
  };

  const filtered = data.filter((d: any) =>
    Object.values(d).some(val => String(val || '').toLowerCase().includes(search.toLowerCase()))
  );

  const hideTooltip = () => setTooltip(null);

  const showTooltipFor = (e: any, text: string) => {
    if (!text) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // place tooltip near cell, but not under cursor
    const x = Math.min(rect.left, window.innerWidth - 24);
    const y = Math.min(rect.bottom + 10, window.innerHeight - 24);
    setTooltip({ text, x, y });
  };

  const getTooltipText = (val: any, rendered: any) => {
    // Prefer rendered if it's primitive, otherwise fall back to raw
    if (typeof rendered === 'string' || typeof rendered === 'number') return String(rendered);
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    return '';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Header title={title} onAdd={fields ? () => setIsAdding(true) : undefined} />

      {errorMsg && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>{errorMsg}</div>}

      <SearchBar onSearch={setSearch} />

      {(isAdding || editingRow) && (
        <ModalForm
          title={title}
          fields={fields}
          initialData={editingRow}
          onSave={handleSave}
          onCancel={() => { setIsAdding(false); setEditingRow(null); }}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="var(--primary)" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className={stickyFirstColumn ? 'table-wrapper table-wrapper--sticky-first' : 'table-wrapper'}>
            <table
              className={stickyFirstColumn ? 'table--sticky-first' : undefined}
              style={{
                tableLayout,
                minWidth: typeof tableMinWidth === 'number' ? `${tableMinWidth}px` : undefined,
              }}
            >
              <thead>
                <tr>
                  {columns.map((c: any) => (
                    <th
                      key={c.key}
                      className={c.className}
                      style={{
                        width: typeof c.width === 'number' ? `${c.width}px` : undefined,
                        minWidth: typeof c.minWidth === 'number' ? `${c.minWidth}px` : undefined,
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                  {(fields || !hideDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: any, idx) => (
                  <tr
                    key={row[primaryKey] || `row-${idx}`}
                    onClick={
                      renderRowDetail
                        ? () => setDetailRow(row)
                        : (fields && rowClickEdits ? () => setEditingRow(row) : undefined)
                    }
                    style={
                      renderRowDetail || (fields && rowClickEdits)
                        ? { cursor: 'pointer' }
                        : undefined
                    }
                  >
                    {columns.map((c: any) => (
                      <td
                        key={c.key}
                        className={c.className}
                        style={{
                          width: typeof c.width === 'number' ? `${c.width}px` : undefined,
                          minWidth: typeof c.minWidth === 'number' ? `${c.minWidth}px` : undefined,
                        }}
                      >
                        {(() => {
                          const raw = row[c.key];
                          const rendered = c.formatter ? c.formatter(raw, row, (newData: any) => handleSave({ ...row, ...newData })) : raw;
                          const tip = getTooltipText(raw, rendered);
                          return (
                            <span
                              style={{ display: 'block' }}
                              onMouseEnter={(e) => showTooltipFor(e, tip)}
                              onMouseLeave={hideTooltip}
                            >
                              {rendered}
                            </span>
                          );
                        })()}
                      </td>
                    ))}
                    {(fields || !hideDelete) && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {fields && (
                            <button className="btn-remove" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }} onClick={() => setEditingRow(row)}>
                              <Edit2 size={16} />
                            </button>
                          )}
                          {!hideDelete && (
                            <button className="btn-remove" onClick={() => setDeleteTarget(row[primaryKey])}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + ((fields || !hideDelete) ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="floating-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.text}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null && typeof deleteTarget !== 'undefined'}
        title="Delete record"
        message="Are you sure you want to remove this record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const idValue = deleteTarget;
          setDeleteTarget(null);
          await doDelete(idValue);
        }}
      />

      <AnimatePresence mode="wait">
        {detailRow && renderRowDetail && (
          <motion.div
            key={String(detailRow[primaryKey] ?? 'detail')}
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={detailOverlayCloses ? () => setDetailRow(null) : undefined}
          >
            <motion.div
              className="modal-content"
              style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 0 }}
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 30,
                  background: 'white',
                  padding: '24px 40px 16px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  {title} Details
                </div>
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setDetailRow(null)}
                  style={{ top: 18, right: 18 }}
                >
                  <X />
                </button>
              </div>
              <div style={{ padding: '24px 40px 40px' }}>
                {renderRowDetail(detailRow, () => setDetailRow(null))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GenericTableView;
