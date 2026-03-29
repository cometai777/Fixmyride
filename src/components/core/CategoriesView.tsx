import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, X, Plus, Settings } from 'lucide-react';
import { supabase, supabaseUrl, mockData } from '../../lib/supabase';
import Header from '../common/Header';
import SearchBar from '../common/SearchBar';
import ModalForm from '../common/ModalForm';
import RuleManager from './RuleManager';

const CategoriesView = ({ showToast }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [isSubAdding, setIsSubAdding] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      if (supabaseUrl.includes('placeholder')) {
        setData(mockData.categories || []);
        setLoading(false);
        return;
      }
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        const { data: categories, error }: any = await Promise.race([
          (supabase as any).from('service_categories').select('*'),
          timeoutPromise
        ]);
        if (error) throw error;
        setData(categories || []);
      } catch (err: any) {
        console.warn("Using fallback categories due to error/timeout:", err?.message);
        setData(mockData.categories || []);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [showToast]);

  const fetchSubcategories = async (category_id: any) => {
    setSubLoading(true);
    if (supabaseUrl.includes('placeholder')) {
      const subs = (mockData.subcategories as any)[category_id] || [];
      setSubcategories(subs);
      setSubLoading(false);
      return;
    }
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
      const { data: subs, error }: any = await Promise.race([
        (supabase as any).from('service_subcategories').select('*').eq('category_id', category_id),
        timeoutPromise
      ]);
      if (error) throw error;
      setSubcategories(subs || []);
    } catch (err: any) {
      console.warn("Using fallback subcategories due to error/timeout:", err?.message);
      setSubcategories((mockData.subcategories as any)[category_id] || []);
    } finally {
      setSubLoading(false);
    }
  };

  const handleRowClick = (cat: any) => {
    setSelectedCategory(cat);
    fetchSubcategories(cat.id);
  };

  const filtered = data.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Header title="Service Categories" />
      <SearchBar onSearch={setSearch} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="var(--primary)" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat, idx) => (
                  <tr key={cat.id || `cat-${idx}`} onClick={() => handleRowClick(cat)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: '600' }}>{cat.name}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '500' }}>{cat.code}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{cat.description}</td>
                    <td onClick={(e) => {
                      e.stopPropagation();
                      const newStatus = !cat.is_active;
                      (supabase as any).from('service_categories').update({ is_active: newStatus }).eq('id', cat.id).then(({ error }: any) => {
                        if (!error) {
                          setData(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newStatus } : c));
                          showToast(`Category ${newStatus ? 'Activated' : 'Deactivated'}`);
                        } else {
                          showToast('Error: ' + error.message, 'error');
                        }
                      });
                    }}>
                      <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-warning'}`} style={{ cursor: 'pointer' }}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-remove" style={{ color: 'var(--primary)', background: 'var(--primary-glow)', padding: '6px 14px', width: 'fit-content' }}>
                        Manage <ChevronRight size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedCategory(null)}><X /></button>

              {selectedSubcategory ? (
                <RuleManager
                  subcategory={selectedSubcategory}
                  onBack={() => setSelectedSubcategory(null)}
                  showToast={showToast}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', position: 'sticky', top: 0, zIndex: 10, background: 'white', padding: '10px 0' }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>{selectedCategory.name} Subcategories</h2>
                    <button className="btn-primary" onClick={() => setIsSubAdding(true)} style={{ padding: '8px 20px', fontSize: '13px' }}>
                      <Plus size={16} /> Add Subcategory
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>List of all services under {selectedCategory.name}</p>

                  {isSubAdding && (
                    <ModalForm
                      title="Subcategory"
                      fields={[
                        { name: 'name', label: 'Service Name' },
                        { name: 'code', label: 'Service Code' },
                        { name: 'is_active', label: 'Active', type: 'checkbox' }
                      ]}
                      onSave={async (formData: any) => {
                        const { data: sub, error: subError } = await (supabase as any).from('service_subcategories').insert([{
                          ...formData,
                          category_id: selectedCategory.id
                        }]).select().single();

                        if (subError) {
                          showToast('Error: ' + subError.message, 'error');
                        } else if (sub) {
                          // Auto-create rule
                          await (supabase as any).from('service_rules').insert([{
                            subcategory_code: sub.id,
                            title: `Rule for ${sub.name}`,
                            is_active: true,
                            priority: 1,
                            allowed_city: 'Dubai'
                          }]);
                          setSubcategories(prev => [...prev, sub]);
                          setIsSubAdding(false);
                          showToast('Subcategory & Default Rule created!');
                        }
                      }}
                      onCancel={() => setIsSubAdding(false)}
                    />
                  )}

                  {subLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={30} /></div>
                  ) : (
                    <div className="card" style={{ padding: 0, border: 'none', background: '#f8fafc' }}>
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Service Name</th>
                              <th>Code</th>
                              <th>Status</th>
                              <th>Configuration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subcategories.map((sub, idx) => (
                              <tr key={sub.id || `sub-${idx}`}>
                                <td style={{ fontWeight: '500' }}>{sub.name}</td>
                                <td>{sub.code}</td>
                                <td onClick={(e) => {
                                  e.stopPropagation();
                                  const newStatus = !sub.is_active;
                                  (supabase as any).from('service_subcategories').update({ is_active: newStatus }).eq('id', sub.id).then(({ error }: any) => {
                                    if (!error) {
                                      setSubcategories(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: newStatus } : s));
                                      showToast(`Service ${newStatus ? 'Activated' : 'Deactivated'}`);
                                    } else {
                                      showToast('Error: ' + error.message, 'error');
                                    }
                                  });
                                }}>
                                  <span className={`badge ${sub.is_active ? 'badge-success' : 'badge-warning'}`} style={{ cursor: 'pointer' }}>
                                    {sub.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn-remove"
                                    style={{ color: 'var(--primary)', background: 'var(--primary-glow)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', gap: '6px', display: 'flex', alignItems: 'center' }}
                                    onClick={() => setSelectedSubcategory(sub)}
                                  >
                                    <Settings size={14} /> Manage Rule
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {subcategories.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No subcategories found</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoriesView;
