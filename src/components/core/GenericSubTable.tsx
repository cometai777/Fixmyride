import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Settings, Package } from 'lucide-react';
import ModalForm from '../common/ModalForm';
import { supabase } from '../../lib/supabase';

const GenericSubTable = ({ ruleId, tableName, columns, fields, showToast }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: rows } = await (supabase as any).from(tableName).select('*').eq('rule_id', ruleId);
      setData(rows || []);
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
              {columns.map((c: any) => <th key={c.key}>{c.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || `sub-row-${idx}`}>
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
            {data.length === 0 && <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No logic defined yet. Click "Add" to start.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericSubTable;
