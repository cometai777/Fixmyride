import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ModalForm = ({ title, fields, initialData, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    const updatedForm = { ...formData, [name]: newVal };

    // Auto-select operator for non-coders
    if (name === 'field_name') {
      if (value === 'distance_range' || value === 'vehicle_age') updatedForm.operator = 'between';
      if (value === 'brand_match' || value === 'city_match') updatedForm.operator = 'in';
      if (value === 'always_true') updatedForm.operator = 'always';
    }

    setFormData(updatedForm);
  };

  const handlePayloadPartChange = (parentField: string, partKey: string, val: any) => {
    const currentPayload = typeof formData[parentField] === 'object' ? { ...formData[parentField] } : {};
    currentPayload[partKey] = val;
    setFormData({ ...formData, [parentField]: currentPayload });
  };

  const renderDynamicPayload = (f: any) => {
    const typeField = (f.name === 'condition_payload' || f.name === 'value') ? (formData.condition_type ? 'condition_type' : 'field_name') : 'action_type';
    const currentType = formData[typeField];

    if (!currentType) return (
      <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Please select a {typeField.replace('_', ' ')} first to configure parameters.</p>
      </div>
    );

    const payload = formData[f.name] || {};

    const inputStyle = { width: '100%', marginBottom: 0, borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '500' };
    const labelStyle = { fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px', display: 'block', textTransform: 'uppercase' as const };

    // Condition Field Maps
    if (currentType === 'distance_range') {
      const minField = f.name === 'value' ? 'min' : 'min_km';
      const maxField = f.name === 'value' ? 'max' : 'max_km';
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f0f9ff', padding: '16px', borderRadius: '16px' }}>
          <div>
            <label style={labelStyle}>Min Distance (KM)</label>
            <input type="number" placeholder="0" className="search-bar" style={inputStyle} value={payload[minField] || ''} onChange={e => handlePayloadPartChange(f.name, minField, e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Max Distance (KM)</label>
            <input type="number" placeholder="50" className="search-bar" style={inputStyle} value={payload[maxField] || ''} onChange={e => handlePayloadPartChange(f.name, maxField, e.target.value)} />
          </div>
        </div>
      );
    }
    if (currentType === 'vehicle_age') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
          <div>
            <label style={labelStyle}>Start Year</label>
            <input type="number" placeholder="2010" className="search-bar" style={inputStyle} value={payload.min_year || ''} onChange={e => handlePayloadPartChange(f.name, 'min_year', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>End Year</label>
            <input type="number" placeholder="2024" className="search-bar" style={inputStyle} value={payload.max_year || ''} onChange={e => handlePayloadPartChange(f.name, 'max_year', e.target.value)} />
          </div>
        </div>
      );
    }
    if (currentType === 'brand_match' || currentType === 'city_match') {
      const key = currentType === 'brand_match' ? 'brands' : 'cities';
      const placeholder = currentType === 'brand_match' ? 'Toyota, Honda, BMW...' : 'Dubai, Sharjah, Abu Dhabi...';
      return (
        <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '16px' }}>
          <label style={labelStyle}>Matched {key}</label>
          <input type="text" placeholder={placeholder} className="search-bar" style={inputStyle} value={payload[key] || ''} onChange={e => handlePayloadPartChange(f.name, key, e.target.value)} />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Enter multiple values separated by commas.</p>
        </div>
      );
    }
    if (currentType === 'always_true') {
      return <div style={{ padding: '12px', background: '#f0fdf4', color: '#166534', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>This condition will always pass. No configuration needed.</div>;
    }

    // Action Field Maps
    if (currentType === 'require_vehicle_fields') {
      return (
        <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '16px' }}>
          <label style={labelStyle}>Fields to Ask Customer</label>
          <input type="text" placeholder="e.g. vehicle_make, vehicle_model, color" className="search-bar" style={inputStyle} value={payload.fields || ''} onChange={e => handlePayloadPartChange(f.name, 'fields', e.target.value)} />
          <p style={{ fontSize: '11px', color: '#92400e', marginTop: '8px' }}>User will be prompted to enter these specific details.</p>
        </div>
      );
    }
    if (currentType === 'check_pricing') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#ecfdf5', padding: '16px', borderRadius: '16px' }}>
          <div>
            <label style={labelStyle}>Base Fee (AED)</label>
            <input type="number" placeholder="100" className="search-bar" style={inputStyle} value={payload.base_price || ''} onChange={e => handlePayloadPartChange(f.name, 'base_price', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Extra per KM</label>
            <input type="number" placeholder="5" className="search-bar" style={inputStyle} value={payload.per_km || ''} onChange={e => handlePayloadPartChange(f.name, 'per_km', e.target.value)} />
          </div>
        </div>
      );
    }
    if (currentType === 'reject_service') {
      return (
        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '16px' }}>
          <label style={{ ...labelStyle, color: '#ef4444' }}>Error Message for Client</label>
          <textarea placeholder="Tell the customer why we can't do this service..." className="search-bar" style={{ ...inputStyle, minHeight: '80px' }} value={payload.reason || ''} onChange={e => handlePayloadPartChange(f.name, 'reason', e.target.value)} />
        </div>
      );
    }
    if (currentType === 'offer_field_url') {
      return (
        <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '16px' }}>
          <label style={labelStyle}>Redirect / Action URL</label>
          <input type="text" placeholder="https://example.com/checkout..." className="search-bar" style={inputStyle} value={payload.url || ''} onChange={e => handlePayloadPartChange(f.name, 'url', e.target.value)} />
          <p style={{ fontSize: '11px', color: '#5b21b6', marginTop: '8px' }}>The customer will be directed to this link.</p>
        </div>
      );
    }
    if (currentType === 'check_parts') {
      return (
        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px' }}>
          <label style={labelStyle}>Inventory Check Logic</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={!!payload.auto_verify} onChange={e => handlePayloadPartChange(f.name, 'auto_verify', e.target.checked)} />
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Automatically check and reserve stock for this service</span>
          </div>
        </div>
      );
    }
    if (currentType === 'allow_service') {
      return <div style={{ padding: '12px', background: '#f0fdf4', color: '#166534', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>Standard permission granted. No extra info needed.</div>;
    }

    return (
      <div style={{ border: '2px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
        <label style={labelStyle}>Advanced Configuration (JSON)</label>
        <textarea
          name={f.name}
          value={typeof formData[f.name] === 'object' ? JSON.stringify(formData[f.name], null, 2) : (formData[f.name] || '')}
          onChange={handleChange}
          placeholder="Technical details..."
          className="search-bar"
          style={{ width: '100%', marginBottom: 0, borderRadius: '8px', minHeight: '100px', fontFamily: 'monospace', fontSize: '13px', background: '#f8fafc' }}
        />
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <motion.div
        className="modal-content"
        style={{ maxWidth: '500px' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onCancel}><X /></button>
        <h2 style={{ marginBottom: '20px' }}>{initialData ? 'Edit' : 'Add'} {title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map((f: any) => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>{f.label}</label>
              {f.type === 'checkbox' ? (
                <input type="checkbox" name={f.name} checked={!!formData[f.name]} onChange={handleChange} />
              ) : f.type === 'select' ? (
                <div style={{ position: 'relative' }}>
                  <input
                    list={`${f.name}-options`}
                    name={f.name}
                    value={formData[f.name] || ''}
                    onChange={handleChange}
                    className="search-bar"
                    placeholder="Type or select an option..."
                    style={{ width: '100%', marginBottom: 0, borderRadius: '8px' }}
                  />
                  <datalist id={`${f.name}-options`}>
                    {(typeof f.options === 'function' ? f.options(formData) : f.options).map((opt: any) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </datalist>
                </div>
              ) : f.type === 'dynamic_payload' ? (
                renderDynamicPayload(f)
              ) : f.type === 'textarea' ? (
                <textarea
                  name={f.name}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  placeholder={f.label}
                  className="search-bar"
                  style={{ width: '100%', marginBottom: 0, borderRadius: '8px', minHeight: '120px', padding: '12px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  name={f.name}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  placeholder={f.label}
                  className="search-bar"
                  style={{ width: '100%', marginBottom: 0, borderRadius: '8px' }}
                />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: '600' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: '700' }}>Save Changes</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ModalForm;
