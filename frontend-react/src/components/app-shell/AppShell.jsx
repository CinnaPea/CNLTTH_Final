import { getAuthSession } from '../../api/authClient'
import { getRoleNavItems } from '../../data/roleAccess'
import AppSidebar from './AppSidebar'
import AppTopbar from './AppTopbar'

function AppShell({ currentHash, children }) {
  const session = getAuthSession()
  const user = session?.user || {}
  const navItems = getRoleNavItems(user.TenVaiTro)

  return (
    <main className="app-shell">
      <div className="app-shell__layout">
        <AppSidebar currentHash={currentHash} navItems={navItems} user={user} />
        <section className="app-shell__main">
          <AppTopbar currentHash={currentHash} navItems={navItems} user={user} />
          <div className="app-shell__content">{children}</div>
        </section>
      </div>
    </main>
  )
}

export default AppShell
