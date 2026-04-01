import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Settings, Package, GripVertical } from 'lucide-react';
import ModalForm from '../common/ModalForm';
import { supabase } from '../../lib/supabase';

const GenericSubTable = ({ ruleId, tableName, columns, fields, showToast }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [dragId, setDragId] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const base = (supabase as any).from(tableName).select('*').eq('rule_id', ruleId);
      const { data: rows } =
        tableName === 'rule_actions'
          ? await base.order('priority', { ascending: true })
          : await base;
      setData((rows || []).slice());
      setLoading(false);
    }
    fetchData();
  }, [ruleId, tableName]);

  const handleSave = async (formData: any) => {
    setLoading(true);
    const { id, ...payload } = formData;

    // Auto-parse payload/JSON if it looks like JSON
    const processedPayload: any = { ...payload, rule_id: ruleId };
    for (const key in processedPayload) {
      if (typeof processedPayload[key] === 'string' && (processedPayload[key].startsWith('{') || processedPayload[key].startsWith('['))) {
        try {
          processedPayload[key] = JSON.parse(processedPayload[key]);
        } catch (e) { /* ignore if not valid JSON */ }
      }
    }

    // For rule_actions, default priority to the end of the list.
    if (!id && tableName === 'rule_actions' && typeof processedPayload.priority === 'undefined') {
      const max = data.reduce((acc, r) => Math.max(acc, Number(r?.priority ?? 0) || 0), 0);
      processedPayload.priority = max + 1;
    }

    const { data: result, error } = id
      ? await (supabase as any).from(tableName).update(processedPayload).eq('id', id).select()
      : await (supabase as any).from(tableName).insert([processedPayload]).select();

    if (error) {
      showToast('Database Error: ' + error.message, 'error');
    } else if (result && result.length > 0) {
      const saved = result[0];
      if (id) setData(prev => prev.map(r => r.id === id ? saved : r));
      else setData(prev => [...prev, saved]);
      showToast('Successfully updated ' + tableName, 'success');
    }
    setIsAdding(false);
    setLoading(false);
  };

  const persistActionPriorities = async (rows: any[]) => {
    // priority should be unique & sequential starting at 1 (or 0). We'll use 1-based.
    const updates = rows.map((r, idx) => ({ id: r.id, priority: idx + 1 }));
    // Apply optimistically first
    setData(rows.map((r, idx) => ({ ...r, priority: idx + 1 })));
    const results = await Promise.all(
      updates.map((u) => (supabase as any).from(tableName).update({ priority: u.priority }).eq('id', u.id))
    );
    const err = results.find((r: any) => r?.error)?.error;
    if (err) showToast('Error updating priority: ' + (err.message || String(err)), 'error');
  };

  const onDragStartRow = (row: any) => setDragId(row?.id);
  const onDropRow = async (targetRow: any) => {
    if (tableName !== 'rule_actions') return;
    if (!dragId || !targetRow?.id || dragId === targetRow.id) return;
    const fromIdx = data.findIndex((r) => r.id === dragId);
    const toIdx = data.findIndex((r) => r.id === targetRow.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = data.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDragId(null);
    await persistActionPriorities(next);
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to remove this record?')) {
      const { error } = await (supabase as any).from(tableName).delete().eq('id', id);
      if (!error) {
        setData(data.filter(r => r.id !== id));
        showToast('Record removed', 'success');
      } else {
        showToast('Error removing: ' + error.message, 'error');
      }
    }
  };

  if (loading && !isAdding) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div className="sticky-sub-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 2px', 
        borderBottom: '1px solid #f1f5f9',
        margin: '0 0 16px 0'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tableName === 'rule_conditions' ? <Settings size={18} color="var(--primary)" /> : <Package size={18} color="var(--primary)" />}
          {tableName === 'rule_conditions' ? 'Conditions Logic' : 'Action Logic'}
        </h3>
        <button 
          className="btn-primary" 
          onClick={() => setIsAdding(true)} 
          style={{ 
            padding: '10px 24px', 
            fontSize: '14px', 
            borderRadius: '100px',
            boxShadow: '0 4px 15px rgba(0, 163, 255, 0.2)' 
          }}
        >
          <Plus size={18} /> Add {tableName === 'rule_conditions' ? 'Condition' : 'Action'}
        </button>
      </div>

      {(isAdding || editingRow) && (
        <ModalForm
          title={tableName === 'rule_conditions' ? 'Condition' : 'Action'}
          fields={fields}
          initialData={editingRow}
          onSave={handleSave}
          onCancel={() => { setIsAdding(false); setEditingRow(null); }}
        />
      )}

      <div className="table-wrapper" style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', margin: '0' }}>
        <table style={{ borderCollapse: 'separate' }}>
          <thead>
            <tr>
              {tableName === 'rule_actions' && <th style={{ width: '40px' }} />}
              {columns.map((c: any) => <th key={c.key}>{c.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id || `sub-row-${idx}`}
                draggable={tableName === 'rule_actions'}
                onDragStart={() => onDragStartRow(row)}
                onDragOver={(e) => {
                  if (tableName !== 'rule_actions') return;
                  e.preventDefault();
                }}
                onDrop={() => void onDropRow(row)}
                style={tableName === 'rule_actions' ? { cursor: 'grab' } : undefined}
              >
                {tableName === 'rule_actions' && (
                  <td style={{ padding: '12px 6px', width: '40px', color: 'var(--text-muted)' }}>
                    <GripVertical size={16} />
                  </td>
                )}
                {columns.map((c: any) => (
                  <td key={c.key} style={{ fontWeight: '500', fontSize: '12px', lineHeight: '1.4', padding: '12px 10px', color: 'var(--text)' }}>
                    <div style={{ wordBreak: 'break-all', opacity: 0.9 }}>
                      {c.formatter ? c.formatter(row[c.key], row) : row[c.key]}
                    </div>
                  </td>
                ))}
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-remove" onClick={() => setEditingRow(row)} style={{ padding: '6px', color: 'var(--primary)', background: 'var(--primary-light)' }}><Edit2 size={14} /></button>
                  <button className="btn-remove" onClick={() => handleDelete(row.id)} style={{ padding: '6px', color: '#ef4444' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1 + (tableName === 'rule_actions' ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No logic defined yet. Click "Add" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericSubTable;
