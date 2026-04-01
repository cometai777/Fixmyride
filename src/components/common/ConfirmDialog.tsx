import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = 'Confirm action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        style={{ maxWidth: '520px', padding: 0 }}
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'white',
            padding: '20px 24px 14px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: danger ? 'rgba(239, 68, 68, 0.10)' : 'rgba(0, 163, 255, 0.10)',
                color: danger ? '#ef4444' : 'var(--primary)',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{title}</div>
          </div>
          <button className="modal-close" type="button" onClick={onClose} style={{ position: 'static' }}>
            <X />
          </button>
        </div>

        <div style={{ padding: '18px 24px 22px' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {message}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                fontWeight: 800,
                background: '#fff',
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                background: danger ? '#ef4444' : 'var(--primary)',
                color: 'white',
                fontWeight: 900,
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

