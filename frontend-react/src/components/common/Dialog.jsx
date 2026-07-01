/* Reusable modal dialog */
export default function Dialog({ open, title, children, onClose, footer, width = 520 }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: '#fff',
        borderRadius: 10,
        width: '90%',
        maxWidth: width,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: '#1565C0',
          color: '#fff',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}>×</button>
          )}
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* Confirm dialog */
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Xác nhận', danger = false }) {
  if (!open) return null
  return (
    <Dialog open={open} title={title || 'Xác nhận'} onClose={onCancel} width={420}
      footer={
        <>
          <Btn onClick={onCancel} variant="secondary">Hủy</Btn>
          <Btn onClick={onConfirm} variant={danger ? 'danger' : 'primary'}>{confirmLabel}</Btn>
        </>
      }>
      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6 }}>{message}</p>
    </Dialog>
  )
}

/* Button helper used inside dialogs */
export function Btn({ children, onClick, variant = 'primary', type = 'button', disabled = false, style: extra }) {
  const styles = {
    primary: { background: '#1565C0', color: '#fff' },
    secondary: { background: '#e2e8f0', color: '#374151' },
    success: { background: '#2E7D32', color: '#fff' },
    danger: { background: '#C62828', color: '#fff' },
    warning: { background: '#E65100', color: '#fff' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: '8px 18px',
      borderRadius: 6,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      fontSize: 14,
      opacity: disabled ? 0.6 : 1,
      ...styles[variant],
      ...extra,
    }}>{children}</button>
  )
}
