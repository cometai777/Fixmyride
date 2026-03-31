import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, X, Plus, Settings, Edit2, Trash2 } from 'lucide-react';
import { supabase, supabaseUrl } from '../../lib/supabase';
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
  const [isCatAdding, setIsCatAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);

  const closeCategoryModal = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setIsSubAdding(false);
    setEditingSubcategory(null);
  };

  useEffect(() => {
    async function fetchCategories() {
      if (supabaseUrl.includes('placeholder')) {
        setData([]);
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
        console.warn("Using empty categories due to error/timeout:", err?.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [showToast]);

  const fetchSubcategories = async (categoryId: any) => {
    setSubLoading(true);
    if (supabaseUrl.includes('placeholder')) {
      setSubcategories([]);
      setSubLoading(false);
      return;
    }
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
      const { data: subs, error }: any = await Promise.race([
        (supabase as any).from('service_subcategories').select('*').eq('category_id', categoryId),
        timeoutPromise
      ]);
      if (error) throw error;
      setSubcategories(subs || []);
    } catch (err: any) {
      console.warn("Using empty subcategories due to error/timeout:", err?.message);
      setSubcategories([]);
    } finally {
      setSubLoading(false);
    }
  };

  const handleRowClick = (cat: any) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setIsSubAdding(false);
    setEditingSubcategory(null);
    fetchSubcategories(cat.id);
  };

  const filtered = data.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Header title="Service Categories" onAdd={() => setIsCatAdding(true)} />
      <SearchBar onSearch={setSearch} />

      {isCatAdding && (
        <ModalForm
          title="Category"
          fields={[
            { name: 'name', label: 'Name' },
            { name: 'code', label: 'Code' },
            { name: 'description', label: 'Description' },
            { name: 'is_active', label: 'Active', type: 'checkbox' },
          ]}
          onSave={async (formData: any) => {
            const { data: created, error } = await (supabase as any)
              .from('service_categories')
              .insert([formData])
              .select()
              .single();
            if (error) return showToast('Error: ' + error.message, 'error');
            setData((prev) => [created, ...prev]);
            setIsCatAdding(false);
            showToast('Category created!', 'success');
          }}
          onCancel={() => setIsCatAdding(false)}
        />
      )}

      {editingCategory && (
        <ModalForm
          title="Edit Category"
          initialData={editingCategory}
          fields={[
            { name: 'name', label: 'Name' },
            { name: 'code', label: 'Code' },
            { name: 'description', label: 'Description' },
            { name: 'is_active', label: 'Active', type: 'checkbox' },
          ]}
          onSave={async (formData: any) => {
            const { id, ...payload } = formData || {};
            const { data: updated, error } = await (supabase as any)
              .from('service_categories')
              .update(payload)
              .eq('id', id)
              .select()
              .single();
            if (error) return showToast('Error: ' + error.message, 'error');
            setData((prev) => prev.map((c) => (c.id === id ? updated : c)));
            if (selectedCategory?.id === id) setSelectedCategory(updated);
            setEditingCategory(null);
            showToast('Category updated!', 'success');
          }}
          onCancel={() => setEditingCategory(null)}
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
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th style={{ width: '120px' }}>Edit</th>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-remove"
                          style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
                          onClick={() => setEditingCategory(cat)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-remove"
                          onClick={async () => {
                            if (!confirm('Delete this category? This may also affect its subcategories.')) return;
                            const { error } = await (supabase as any).from('service_categories').delete().eq('id', cat.id);
                            if (error) return showToast('Error: ' + error.message, 'error');
                            setData((prev) => prev.filter((c) => c.id !== cat.id));
                            if (selectedCategory?.id === cat.id) {
                              setSelectedCategory(null);
                              setSelectedSubcategory(null);
                              setSubcategories([]);
                            }
                            showToast('Category deleted!', 'success');
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            key={String(selectedCategory?.id ?? 'category-modal')}
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCategoryModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeCategoryModal}><X /></button>

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
                        const { data: sub, error: subError } = await (supabase as any)
                          .from('service_subcategories')
                          .insert([{
                            ...formData,
                            category_id: selectedCategory.id
                          }])
                          .select()
                          .single();

                        if (subError) {
                          showToast('Error: ' + subError.message, 'error');
                        } else if (sub) {
                          setSubcategories(prev => [...prev, sub]);
                          setIsSubAdding(false);
                          showToast('Subcategory created! Default rule will be created automatically.', 'success');
                        }
                      }}
                      onCancel={() => setIsSubAdding(false)}
                    />
                  )}

                  {editingSubcategory && (
                    <ModalForm
                      title="Edit Subcategory"
                      initialData={editingSubcategory}
                      fields={[
                        { name: 'name', label: 'Service Name' },
                        { name: 'code', label: 'Service Code' },
                        { name: 'is_active', label: 'Active', type: 'checkbox' },
                      ]}
                      onSave={async (formData: any) => {
                        const { id, ...payload } = formData || {};
                        const { data: updated, error } = await (supabase as any)
                          .from('service_subcategories')
                          .update(payload)
                          .eq('id', id)
                          .select()
                          .single();
                        if (error) return showToast('Error: ' + error.message, 'error');
                        setSubcategories((prev) => prev.map((s) => (s.id === id ? updated : s)));
                        if (selectedSubcategory?.id === id) setSelectedSubcategory(updated);
                        setEditingSubcategory(null);
                        showToast('Subcategory updated!', 'success');
                      }}
                      onCancel={() => setEditingSubcategory(null)}
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
                              <th style={{ width: '120px' }}>Edit</th>
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
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      className="btn-remove"
                                      style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
                                      onClick={() => setEditingSubcategory(sub)}
                                      title="Edit"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      className="btn-remove"
                                      onClick={async () => {
                                        if (!confirm('Delete this subcategory? Its rule will also be removed.')) return;
                                        const { error } = await (supabase as any).from('service_subcategories').delete().eq('id', sub.id);
                                        if (error) return showToast('Error: ' + error.message, 'error');
                                        setSubcategories((prev) => prev.filter((s) => s.id !== sub.id));
                                        if (selectedSubcategory?.id === sub.id) setSelectedSubcategory(null);
                                        showToast('Subcategory deleted!', 'success');
                                      }}
                                      title="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {subcategories.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No subcategories found</td></tr>}
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
