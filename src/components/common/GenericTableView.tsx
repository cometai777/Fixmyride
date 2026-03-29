import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import Header from './Header';
import SearchBar from './SearchBar';
import ModalForm from './ModalForm';
import { supabase, supabaseUrl, mockData } from '../../lib/supabase';
import type { GenericTableViewProps } from '../../types/index';

const GenericTableView = ({ title, tableName, columns, fields, primaryKey = 'id', onToast, hideDelete }: GenericTableViewProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setErrorMsg(null);
      if (supabaseUrl.includes('placeholder')) {
        const mockMap: any = {
          'parts': mockData.parts,
          'booking_records': mockData.bookings,
          'payment_records': mockData.payments,
          'service_categories': mockData.categories,
          'service_subcategories': (mockData.subcategories as any)[1] || []
        };
        setData(mockMap[tableName] || []);
        setLoading(false);
        return;
      }
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const { data: rows, error }: any = await Promise.race([
          (supabase as any).from(tableName).select('*').limit(200).order(primaryKey, { ascending: false }),
          timeoutPromise
        ]);

        if (error) throw error;
        setData(rows || []);
      } catch (err: any) {
        console.warn(`Falling back to mock data for ${tableName} due to error/timeout:`, err?.message);
        const mockMap: any = {
          'parts': mockData.parts,
          'booking_records': mockData.bookings,
          'payment_records': mockData.payments,
          'service_categories': mockData.categories,
          'service_subcategories': (mockData.subcategories as any)[1] || []
        };
        setData(mockMap[tableName] || []);
        
        if (err?.message?.includes('JWT') || err?.message?.includes('key')) {
          onToast('Authentication Session Disconnected. Entering Demo Mode.', 'error');
          supabase.auth.signOut();
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  const handleDelete = async (idValue: any) => {
    if (confirm('Are you sure you want to remove this record?')) {
      const { data: deleted, error } = await (supabase as any).from(tableName).delete().eq(primaryKey, idValue).select();

      if (error) {
        onToast('Error deleting: ' + error.message, 'error');
      } else if (!deleted || deleted.length === 0) {
        onToast('Deletion blocked by database! Check RLS policies.', 'error');
      } else {
        setData(data.filter((d: any) => d[primaryKey] !== idValue));
        onToast('Record removed successfully', 'success');
      }
    }
  };

  const filtered = data.filter((d: any) =>
    Object.values(d).some(val => String(val || '').toLowerCase().includes(search.toLowerCase()))
  );

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
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {columns.map((c: any) => <th key={c.key}>{c.label}</th>)}
                  {(fields || !hideDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: any, idx) => (
                  <tr key={row[primaryKey] || `row-${idx}`}>
                    {columns.map((c: any) => (
                      <td key={c.key}>{c.formatter ? c.formatter(row[c.key], row, (newData: any) => handleSave({ ...row, ...newData })) : row[c.key]}</td>
                    ))}
                    {(fields || !hideDelete) && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {fields && (
                            <button className="btn-remove" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }} onClick={() => setEditingRow(row)}>
                              <Edit2 size={16} />
                            </button>
                          )}
                          {!hideDelete && (
                            <button className="btn-remove" onClick={() => handleDelete(row[primaryKey])}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GenericTableView;
