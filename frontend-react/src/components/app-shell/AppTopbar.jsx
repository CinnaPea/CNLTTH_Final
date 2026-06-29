import { clearAuthSession } from '../../api/authClient'

function AppTopbar({ navItems, currentHash, user }) {
  const activeItem = navItems.find((item) => item.hash === currentHash)
  const initials = (user?.HoTen || user?.Email || 'AD')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function logout() {
    clearAuthSession()
    window.location.hash = '#login'
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar__row">
        <div>
          <p>Workspace</p>
          <h2>{activeItem?.label || 'Dashboard'}</h2>
        </div>

        <div className="app-topbar__actions">
          <a href="#top">Landing</a>
          <button onClick={logout} type="button">Đăng xuất</button>
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
