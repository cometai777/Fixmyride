import { useMemo, useState, useEffect } from 'react';
import { Loader2, ChevronRight, XCircle, GripVertical, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function normalizeActions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
  if (typeof raw === 'string') {
    // allow JSON string or newline-separated
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
    } catch { /* ignore */ }
    return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const RuleManager = ({ subcategory, onBack, showToast }: any) => {
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionsDraft, setActionsDraft] = useState<string[]>([]);
  const [actionRowIds, setActionRowIds] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | null>(null);

  const newRowId = useMemo(() => () => {
    // good-enough stable id for React keys
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  useEffect(() => {
    async function fetchRule() {
      // service_rules is keyed by (category_code, subcategory_code) to allow
      // subcategory codes to repeat across categories.
      const subCode = subcategory?.code || subcategory?.subcategory_code;
      const categoryId = subcategory?.category_id;
      if (!subCode) {
        showToast('Missing subcategory code.', 'error');
        setLoading(false);
        return;
      }

      let categoryCode: string | null = null;
      if (categoryId) {
        const { data: cat, error: catErr } = await (supabase as any)
          .from('service_categories')
          .select('code')
          .eq('id', categoryId)
          .maybeSingle();
        if (catErr) {
          showToast('Error fetching category: ' + catErr.message, 'error');
          setLoading(false);
          return;
        }
        categoryCode = (cat as any)?.code ?? null;
      }

      let query = (supabase as any).from('service_rules').select('*').eq('subcategory_code', subCode);
      if (categoryCode) query = query.eq('category_code', categoryCode);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Fetch Rule Error:", error);
        showToast('Error fetching rule: ' + error.message, 'error');
      } else if (!data) {
        // Default rule is created by DB trigger on subcategory insert.
        showToast('No rule found for this service. Create the subcategory again or run the DB trigger migration.', 'error');
      } else {
        setRule(data);
        const normalized = normalizeActions((data as any)?.actions);
        setActionsDraft(normalized);
        setActionRowIds(normalized.map(() => newRowId()));
      }
      setLoading(false);
    }
    fetchRule();
  }, [subcategory?.code, subcategory?.category_id, showToast, subcategory?.name]);

  const handleUpdate = async (field: string, value: any) => {
    const updated = { ...rule, [field]: value };
    setRule(updated);
    const { error } = await (supabase as any).from('service_rules').update({ [field]: value }).eq('id', rule.id);
    if (error) {
      showToast('Error updating rule: ' + error.message, 'error');
    }
  };

  const saveActions = async (next: string[]) => {
    if (!rule?.id) return;
    const cleaned = next.map((s) => String(s || '').trim()).filter(Boolean);
    setActionsDraft(cleaned);
    // Keep row ids aligned with rows (preserve existing ids where possible)
    setActionRowIds((prev) => {
      const nextIds = cleaned.map((_, idx) => prev[idx] ?? newRowId());
      return nextIds;
    });
    const { error } = await (supabase as any).from('service_rules').update({ actions: cleaned }).eq('id', rule.id);
    if (error) showToast('Error updating actions: ' + error.message, 'error');
    else showToast('Actions saved', 'success');
  };

  const moveAction = (from: number, to: number) => {
    if (from === to) return actionsDraft;
    const next = actionsDraft.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const moveRowId = (from: number, to: number) => {
    if (from === to) return actionRowIds;
    const next = actionRowIds.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="var(--primary)" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ 
        position: 'sticky', 
        top: '-40px', 
        zIndex: 100, 
        background: 'white', 
        margin: '-40px -40px 10px', 
        padding: '24px 40px 10px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-remove" style={{ background: 'var(--border)', color: 'var(--text)' }} onClick={onBack}>
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize', margin: 0 }}>{subcategory.name} Rules</h2>
          </div>

          {/* Close modal (top-right) */}
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            title="Close"
            onClick={onBack}
            style={{ position: 'static' }}
          >
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        <div className="card" style={{ flex: 1, minHeight: '400px', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
          {!rule && (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '16px' }}><XCircle size={48} /></div>
              <h3 style={{ marginBottom: '8px' }}>Rule Data Missing</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We couldn't find or create a configuration for this service logic.</p>
              <button
                className="btn-remove"
                style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px' }}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          )}
          {rule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Category Code</label>
                  <input
                    type="text"
                    value={rule.category_code || ''}
                    onChange={(e) => handleUpdate('category_code', e.target.value)}
                    className="search-bar"
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Subcategory Code</label>
                  <input
                    type="text"
                    value={rule.subcategory_code || ''}
                    onChange={(e) => handleUpdate('subcategory_code', e.target.value)}
                    className="search-bar"
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Title</label>
                  <input
                    type="text"
                    value={rule.title || ''}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className="search-bar"
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Description</label>
                  <textarea
                    value={rule.description || ''}
                    onChange={(e) => handleUpdate('description', e.target.value)}
                    className="search-bar"
                    style={{ width: '100%', height: '110px', borderRadius: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>Actions</div>
                  </div>
                </div>

                <div
                  className="table-wrapper"
                  style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    margin: 0,
                    overflowX: 'hidden',
                  }}
                >
                  <table className="rules-actions-table" style={{ borderCollapse: 'separate', width: '100%', minWidth: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }} />
                        <th>Action</th>
                        <th style={{ width: '110px' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionsDraft.map((a, i) => (
                        <tr
                          key={actionRowIds[i] ?? String(i)}
                          className={
                            dragIdx !== null && dragOverIdx === i && dragIdx !== i
                              ? (dragOverPos === 'after' ? 'drag-over-row drag-over-after' : 'drag-over-row drag-over-before')
                              : undefined
                          }
                          draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragEnd={() => {
                            setDragIdx(null);
                            setDragOverIdx(null);
                            setDragOverPos(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragIdx === null) return;
                            setDragOverIdx(i);
                            const tr = e.currentTarget as HTMLTableRowElement;
                            const rect = tr.getBoundingClientRect();
                            const midpoint = rect.top + rect.height / 2;
                            setDragOverPos(e.clientY > midpoint ? 'after' : 'before');
                          }}
                          onDragLeave={() => {
                            if (dragOverIdx === i) {
                              setDragOverIdx(null);
                              setDragOverPos(null);
                            }
                          }}
                          onDrop={() => {
                            if (dragIdx === null) return;
                            // If dropping "after" hovered row, adjust target index after removal when moving downwards.
                            let targetIdx = i;
                            if (dragOverPos === 'after') targetIdx = i + 1;
                            if (targetIdx > actionsDraft.length) targetIdx = actionsDraft.length;

                            // Remove from current position then insert at target position.
                            const from = dragIdx;
                            let to = targetIdx;
                            if (from < to) to = to - 1;

                            const next = moveAction(from, to);
                            const nextIds = moveRowId(from, to);
                            setDragIdx(null);
                            setDragOverIdx(null);
                            setDragOverPos(null);
                            setActionRowIds(nextIds);
                            void saveActions(next);
                          }}
                        >
                          <td style={{ padding: '12px 6px', width: '40px', color: 'var(--text-muted)' }}>
                            <span className={dragIdx === i ? 'drag-handle dragging' : 'drag-handle'}>
                              <GripVertical size={16} />
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <input
                              className="search-bar"
                              style={{ width: '100%', marginBottom: 0 }}
                              value={a}
                              onChange={(e) => {
                                const next = actionsDraft.slice();
                                next[i] = e.target.value;
                                setActionsDraft(next);
                              }}
                              onBlur={() => void saveActions(actionsDraft)}
                            />
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <button
                              className="btn-remove"
                              style={{ color: '#ef4444' }}
                              onClick={() => {
                                const next = actionsDraft.filter((_, idx) => idx !== i);
                              const nextIds = actionRowIds.filter((_, idx) => idx !== i);
                              setActionRowIds(nextIds);
                                void saveActions(next);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {actionsDraft.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                            No actions yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => {
                    const next = [...actionsDraft, ''];
                    setActionsDraft(next);
                    setActionRowIds((prev) => [...prev, newRowId()]);
                  }}
                  style={{ width: 'fit-content', padding: '10px 18px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Add action
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleManager;
