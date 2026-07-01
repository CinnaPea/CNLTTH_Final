import { useState } from 'react'
import { getRoleDefinition } from '../../data/roleAccess'

function AppSidebar({ navItems, currentHash, user }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const role = getRoleDefinition(user?.TenVaiTro)
  const userName = user?.HoTen || 'Nguoi dung'
  const userEmail = user?.Email || 'Chua xac dinh email'

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <a className="app-sidebar__brand" href="#dashboard">
        <span>EF</span>
        <span>
          <strong>ExamFlow</strong>
          <small>Dieu hanh ky thi</small>
        </span>
      </a>

      <button
        aria-label={isCollapsed ? 'Mo rong sidebar' : 'Thu gon sidebar'}
        aria-pressed={isCollapsed}
        className="app-sidebar__toggle"
        onClick={() => setIsCollapsed((current) => !current)}
        type="button"
      >
        {isCollapsed ? '>' : '<'}
      </button>

      <nav className="app-sidebar__nav" aria-label="App navigation">
        {navItems.map((item) => {
          const isActive = currentHash === item.hash

          return (
            <a className={isActive ? 'is-active' : ''} href={item.hash} key={item.hash} title={item.label}>
              <span>{item.icon}</span>
              <em>{item.label}</em>
            </a>
          )
        })}
      </nav>

      <div className="app-sidebar__note">
        <p>{role.label}</p>
        <p>{userName}</p>
        <small>{userEmail}</small>
      </div>
    </aside>
  )
}

export default AppSidebar
