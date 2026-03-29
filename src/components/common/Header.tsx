import { Plus } from 'lucide-react';

export const Header = ({ title, onAdd }: { title: string, onAdd?: () => void }) => (
  <header className="header" style={{ marginBottom: '24px' }}>
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage and monitor everything in one place</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {onAdd && (
        <button className="card" onClick={onAdd} style={{ padding: '10px 16px', borderRadius: '100px', fontWeight: '600', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add New
        </button>
      )}
    </div>
  </header>
);

export default Header;
