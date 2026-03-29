import { useState, useEffect } from 'react';
import { Loader2, ChevronRight, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import GenericSubTable from './GenericSubTable';

const RuleManager = ({ subcategory, onBack, showToast }: any) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRule() {
      // Try fetching by subcategory_code FIRST (as suggested by database hint)
      let { data, error } = await (supabase as any).from('service_rules').select('*').eq('subcategory_code', subcategory.id).maybeSingle();

      // If none found, try fetching by PK assuming id === subcategory.id (per user requirement)
      if (!data && !error) {
        const fall = await (supabase as any).from('service_rules').select('*').eq('id', subcategory.id).maybeSingle();
        if (fall.data) { data = fall.data; error = fall.error; }
      }

      // FINAL FALLBACK: Check if table is just named 'rules'
      if (!data && !error) {
        const legacy = await (supabase as any).from('rules').select('*').eq('subcategory_code', subcategory.id).maybeSingle();
        if (legacy.data) { data = legacy.data; error = legacy.error; }
      }

      if (error) {
        console.error("Fetch Rule Error:", error);
        showToast('Error fetching rule: ' + error.message, 'error');
      } else if (!data) {
        // Create default rule if it doesn't exist
        const { data: created, error: createError } = await (supabase as any).from('service_rules').insert([
          { subcategory_code: subcategory.id, title: `Default Rule for ${subcategory.name}`, is_active: true, priority: 1, allowed_city: 'Dubai' }
        ]).select().single();
        if (createError) {
          console.error("Create Rule Error:", createError);
          showToast('Failed to create default rule', 'error');
        } else {
          setRule(created);
        }
      } else {
        setRule(data);
      }
      setLoading(false);
    }
    fetchRule();
  }, [subcategory.id, showToast, subcategory.name]);

  const handleUpdate = async (field: string, value: any) => {
    const updated = { ...rule, [field]: value };
    setRule(updated);
    const { error } = await (supabase as any).from('service_rules').update({ [field]: value }).eq('id', rule.id);
    if (error) {
      showToast('Error updating rule: ' + error.message, 'error');
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-remove" style={{ background: 'var(--border)', color: 'var(--text)' }} onClick={onBack}>
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', textTransform: 'capitalize', margin: 0 }}>{subcategory.name} Rules</h2>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['Overview', 'Conditions', 'Actions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                fontWeight: '700',
                fontSize: '13px',
                background: activeTab === tab ? 'var(--primary-glow)' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-dim)',
                borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
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
          {activeTab === 'Overview' && rule && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Basic Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Rule Title</label>
                  <input type="text" value={rule.title || ''} onChange={(e) => handleUpdate('title', e.target.value)} className="search-bar" style={{ width: '100%', marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Description</label>
                  <textarea value={rule.description || ''} onChange={(e) => handleUpdate('description', e.target.value)} className="search-bar" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Category Code</label>
                    <input type="text" value={rule.category_code || ''} onChange={(e) => handleUpdate('category_code', e.target.value)} className="search-bar" style={{ width: '100%' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Subcategory Code</label>
                    <input type="text" value={rule.subcategory_code || ''} onChange={(e) => handleUpdate('subcategory_code', e.target.value)} className="search-bar" style={{ width: '100%' }} />
                  </div>
                </div>
                
                <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '8px', marginTop: '16px' }}>Execution Flow</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={rule.is_active} onChange={(e) => handleUpdate('is_active', e.target.checked)} />
                    <label style={{ fontWeight: '600' }}>Active Rule Status</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={rule.allowed} onChange={(e) => handleUpdate('allowed', e.target.checked)} />
                    <label style={{ fontWeight: '600' }}>Service Allowed by Default</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={rule.service_area_required} onChange={(e) => handleUpdate('service_area_required', e.target.checked)} />
                    <label style={{ fontWeight: '600' }}>Geo-Fencing Required</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={rule.ask_followup_question} onChange={(e) => handleUpdate('ask_followup_question', e.target.checked)} />
                    <label style={{ fontWeight: '600' }}>Show Follow-up Question</label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Messaging & Logic</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Target City</label>
                  <input type="text" value={rule.allowed_city || ''} onChange={(e) => handleUpdate('allowed_city', e.target.value)} className="search-bar" style={{ width: '100%', marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Acceptance Message</label>
                  <input type="text" value={rule.acceptance_message || ''} onChange={(e) => handleUpdate('acceptance_message', e.target.value)} className="search-bar" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Rejection Message</label>
                  <input type="text" value={rule.rejection_message || ''} onChange={(e) => handleUpdate('rejection_message', e.target.value)} className="search-bar" style={{ width: '100%' }} />
                </div>
                
                <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '8px', marginTop: '16px' }}>Dynamic Requirements</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={rule.require_vehicle_make} onChange={(e) => handleUpdate('require_vehicle_make', e.target.checked)} />
                    <label style={{ fontSize: '12px' }}>Req. Make</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={rule.require_vehicle_model} onChange={(e) => handleUpdate('require_vehicle_model', e.target.checked)} />
                    <label style={{ fontSize: '12px' }}>Req. Model</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={rule.require_vehicle_year} onChange={(e) => handleUpdate('require_vehicle_year', e.target.checked)} />
                    <label style={{ fontSize: '12px' }}>Req. Year</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={rule.require_part_check} onChange={(e) => handleUpdate('require_part_check', e.target.checked)} />
                    <label style={{ fontSize: '12px' }}>Check Parts</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={rule.require_pricing_check} onChange={(e) => handleUpdate('require_pricing_check', e.target.checked)} />
                    <label style={{ fontSize: '12px' }}>Check Price</label>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Logic Priority (Lower is first)</label>
                  <input type="number" value={rule.priority || 1} onChange={(e) => handleUpdate('priority', Number(e.target.value))} className="search-bar" style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Custom Form URL (offer_fieldd_url)</label>
                  <input type="text" value={rule.offer_fieldd_url || ''} onChange={(e) => handleUpdate('offer_fieldd_url', e.target.value)} className="search-bar" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'Conditions' && rule && (
            <GenericSubTable
              ruleId={rule.id}
              tableName="rule_conditions"
              showToast={showToast}
              columns={[
                {
                  key: 'field_name', label: 'Type', formatter: (val: any, row: any) => {
                    const type = val || row?.condition_payload?.type || row?.type;
                    return type ? type.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase()) : 'N/A';
                  }
                },
                { key: 'operator', label: 'Operator', formatter: (val: any) => val ? val.replace(/_/g, ' ').toUpperCase() : 'EQ' },
                {
                  key: 'value', label: 'Parameters', formatter: (val: any, row: any) => {
                    let realVal = val || row?.condition_payload || row?.payload;
                    if (!realVal) return 'No Parameters';

                    // Aggressively attempt to parse string if it looks like JSON
                    if (typeof realVal === 'string' && (realVal.startsWith('{') || realVal.startsWith('['))) {
                      try { realVal = JSON.parse(realVal); } catch (e) { /* fallback to raw string */ }
                    }

                    if (typeof realVal === 'object' && realVal !== null) {
                      return Object.entries(realVal).map(([k, v]) => {
                        const cleanK = k?.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase());
                        const displayV = typeof v === 'object' ? JSON.stringify(v)?.replace(/["{}]/g, '')?.replace(/[:]/g, ': ') : v;
                        return `${cleanK}: ${displayV}`;
                      }).join(', ');
                    }
                    return String(realVal);
                  }
                }
              ]}
              fields={[
                { name: 'field_name', label: 'Condition Type', type: 'select', options: ['distance_range', 'vehicle_age', 'brand_match', 'city_match', 'always_true'] },
                { name: 'operator', label: 'Operator (Logic)', type: 'select', options: ['between', 'in', 'eq', 'gt', 'lt', 'always'] },
                { name: 'value', label: 'Configure Parameters', type: 'dynamic_payload' }
              ]}
            />
          )}
          {activeTab === 'Actions' && rule && (
            <GenericSubTable
              ruleId={rule.id}
              tableName="rule_actions"
              showToast={showToast}
              columns={[
                {
                  key: 'action_type', label: 'Action', formatter: (val: any, row: any) => {
                    const type = val || row?.action_payload?.type || row?.type || row?.name;
                    return type ? type.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase()) : 'N/A';
                  }
                },
                {
                  key: 'action_payload', label: 'Details', formatter: (val: any, row: any) => {
                    let data = val || row?.payload || row?.data;
                    if (!data) return 'N/A';

                    if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                      try { data = JSON.parse(data); } catch (e) { /* ignore */ }
                    }

                    if (typeof data === 'object' && data !== null) {
                      return Object.entries(data).map(([k, v]) => {
                        const cleanK = k?.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase());
                        const displayVal = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v)?.replace(/["{}]/g, '')?.replace(/[:]/g, ': ') : v);
                        return `${cleanK}: ${displayVal}`;
                      }).join(' | ');
                    }
                    return String(data);
                  }
                }
              ]}
              fields={[
                { name: 'action_type', label: 'Action Type', type: 'select', options: ['allow_service', 'require_vehicle_fields', 'check_parts', 'check_pricing', 'reject_service', 'offer_field_url'] },
                { name: 'action_payload', label: 'Configure Parameters', type: 'dynamic_payload' }
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleManager;
