import { useEffect, useState } from 'react'
import { clearAuthSession } from '../../api/authClient'
import {
  BACKEND_PROVIDERS,
  checkAllBackendHealth,
  getActiveBackend,
  getLastFailover,
  setActiveBackend,
  subscribeBackend,
} from '../../api/backendProvider'

function AppTopbar({ navItems, currentHash, user }) {
  const activeItem = navItems.find((item) => item.hash === currentHash)
  const isAdmin = user?.TenVaiTro === 'Admin'
  const [activeBackend, setActiveBackendState] = useState(getActiveBackend())
  const [health, setHealth] = useState({})
  const [lastFailover, setLastFailover] = useState(getLastFailover())
  const activeHealth = health[activeBackend]
  const initials = (user?.HoTen || user?.Email || 'AD')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => subscribeBackend((event) => {
    setActiveBackendState(event.activeBackend)
    setLastFailover(event.lastFailover)
  }), [])

  useEffect(() => {
    let isMounted = true

    async function refreshHealth() {
      const results = await checkAllBackendHealth()
      if (!isMounted) return

      setHealth(results)

      const currentBackend = getActiveBackend()
      const fallbackBackend = currentBackend === 'ruby' ? 'csharp' : 'ruby'

      if (!results[currentBackend]?.ok && results[fallbackBackend]?.ok) {
        setActiveBackend(fallbackBackend, {
          reason: 'auto',
          from: currentBackend,
          message: `${BACKEND_PROVIDERS[currentBackend].label} did not answer health checks.`,
        })
      }
    }

    refreshHealth()
    const intervalId = window.setInterval(refreshHealth, 10000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  function logout() {
    clearAuthSession()
    window.location.hash = '#login'
  }

  function handleBackendChange(event) {
    setActiveBackend(event.target.value, { reason: 'manual' })
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar__row">
        <div>
          <p>Workspace</p>
          <h2>{activeItem?.label || 'Dashboard'}</h2>
        </div>

        <div className="app-topbar__actions">
          <div className="backend-switcher" title={lastFailover?.message || 'Backend provider'}>
            <span className={`backend-switcher__dot ${activeHealth?.ok ? 'is-online' : 'is-offline'}`} />
            <span>{BACKEND_PROVIDERS[activeBackend].shortLabel}</span>
            {isAdmin ? (
              <select aria-label="Chon backend API" onChange={handleBackendChange} value={activeBackend}>
                {Object.values(BACKEND_PROVIDERS).map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <a href="#top">Landing</a>
          <button onClick={logout} type="button">Dang xuat</button>
          <div title={user?.TenVaiTro || 'User'}>{initials}</div>
        </div>
      </div>

      <nav className="app-topbar__mobile-nav" aria-label="Mobile app navigation">
        {navItems.map((item) => (
          <a className={currentHash === item.hash ? 'is-active' : ''} href={item.hash} key={item.hash}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

export default AppTopbar
