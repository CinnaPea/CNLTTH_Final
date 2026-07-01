/* Reusable form field wrapper */
export function Field({ label, required, children, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#C62828' }}> *</span>}
      </label>
      {children}
      {error && <p style={{ color: '#C62828', fontSize: 12, marginTop: 3 }}>{error}</p>}
    </div>
  )
}

const inputBase = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

export function Input({ style, ...props }) {
  return <input style={{ ...inputBase, ...style }} {...props} />
}

export function Textarea({ rows = 3, style, ...props }) {
  return <textarea rows={rows} style={{ ...inputBase, resize: 'vertical', ...style }} {...props} />
}

export function Select({ children, style, ...props }) {
  return (
    <select style={{ ...inputBase, ...style }} {...props}>
      {children}
    </select>
  )
}

export function FormGrid({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0 16px',
    }}>{children}</div>
  )
}
