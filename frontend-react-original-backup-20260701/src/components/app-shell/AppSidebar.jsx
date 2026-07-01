function AppSidebar({ navItems, currentHash, user }) {
  return (
    <aside className="app-sidebar">
      <a className="app-sidebar__brand" href="#dashboard">
        <span>✦</span>
        <span>
          <strong>ExamFlow</strong>
          <small>Điều hành kỳ thi</small>
        </span>
      </a>

      <nav className="app-sidebar__nav" aria-label="App navigation">
        {navItems.map((item) => {
          const isActive = currentHash === item.hash

          return (
            <a className={isActive ? 'is-active' : ''} href={item.hash} key={item.hash}>
              <span>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="app-sidebar__note">
        <p>{user?.TenVaiTro || 'Workspace'}</p>
        <p>{user?.HoTen || 'Người dùng'} · {user?.Email || 'Chưa xác định email'}</p>
      </div>
    </aside>
  )
}

export default AppSidebar
