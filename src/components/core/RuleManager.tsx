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
      // Best practice: service_rules.subcategory_code matches service_subcategories.code
      const subCode = subcategory?.code || subcategory?.subcategory_code || subcategory?.id;
      let { data, error } = await (supabase as any)
        .from('service_rules')
        .select('*')
        .eq('subcategory_code', subCode)
        .maybeSingle();

      if (error) {
        console.error("Fetch Rule Error:", error);
        showToast('Error fetching rule: ' + error.message, 'error');
      } else if (!data) {
        // Default rule is created by DB trigger on subcategory insert.
        showToast('No rule found for this service. Create the subcategory again or run the DB trigger migration.', 'error');
      } else {
        setRule(data);
      }
      setLoading(false);
    }
    fetchRule();
  }, [subcategory?.code, subcategory?.id, showToast, subcategory?.name]);

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
          {['Overview', 'Actions'].map(tab => (
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
