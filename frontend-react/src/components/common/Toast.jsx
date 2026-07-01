/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const COLORS = {
  success: { bg: '#2E7D32', icon: '✓' },
  error:   { bg: '#C62828', icon: '✕' },
  info:    { bg: '#1565C0', icon: 'ℹ' },
  warning: { bg: '#E65100', icon: '⚠' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id} style={{
              background: c.bg,
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              minWidth: 280,
              maxWidth: 420,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              animation: 'slideIn 0.25s ease',
            }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{c.icon}</span>
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(120px); opacity:0 } to { transform: none; opacity:1 } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
