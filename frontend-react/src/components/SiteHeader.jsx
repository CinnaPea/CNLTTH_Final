import { useState } from 'react'
import { clearAuthSession, getAuthSession } from '../api/authClient'
import reactLogo from '../assets/react.svg'

const navTargets = {
  'Kỳ thi': '#landing-ky-thi',
  'Phân phòng': '#landing-phan-phong',
  'Xếp chỗ': '#landing-xep-cho',
  'Điểm danh': '#landing-diem-danh',
}

function SiteHeader({ navItems }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const session = getAuthSession()
  const user = session?.user
  const initials = (user?.HoTen || user?.Email || 'TK')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const closeMenu = () => setIsMenuOpen(false)
  const closeAccount = () => setIsAccountOpen(false)

  function logout() {
    clearAuthSession()
    setIsAccountOpen(false)
    window.location.hash = '#top'
  }

  return (
    <header className="site-header">
      <div className="page-container">
        <div className="site-header__bar">
          <button
            aria-controls="landing-drawer"
            aria-expanded={isMenuOpen}
            className="brand-lockup landing-menu-button"
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span className="brand-lockup__mark">
              <img src={reactLogo} alt="ExamFlow logo" />
            </span>
            <span className="brand-lockup__text">Hệ thống Web tổ chức kỳ thi</span>
          </button>

          {user ? (
            <div className="landing-account">
              <button
                aria-controls="landing-account-menu"
                aria-expanded={isAccountOpen}
                className="landing-account__button"
                onClick={() => setIsAccountOpen((current) => !current)}
                type="button"
              >
                <span>{initials}</span>
                <strong>{user.HoTen || user.Email}</strong>
              </button>

              <div
                className={`landing-account__menu ${isAccountOpen ? 'is-open' : ''}`}
                id="landing-account-menu"
              >
                <p>{user.TenVaiTro}</p>
                <a href="#dashboard" onClick={closeAccount}>Dashboard</a>
                <a href="#account" onClick={closeAccount}>Thông tin tài khoản</a>
                <button onClick={logout} type="button">Log out</button>
              </div>
            </div>
          ) : (
            <div className="header-actions">
              <a className="header-actions__link" href="#signup">
                Đăng ký
              </a>
              <a className="button button--soft" href="#login">
                Đăng nhập
              </a>
            </div>
          )}
        </div>
      </div>

      <div className={`landing-drawer-backdrop ${isMenuOpen ? 'is-visible' : ''}`} onClick={closeMenu} />
      <aside className={`landing-drawer ${isMenuOpen ? 'is-open' : ''}`} id="landing-drawer">
        <div className="landing-drawer__header">
          <span>Chức năng</span>
          <button aria-label="Đóng menu" onClick={closeMenu} type="button">
            ×
          </button>
        </div>
        <nav aria-label="Landing navigation">
          {navItems.map((item) => (
            <a href={navTargets[item] || '#top'} key={item} onClick={closeMenu}>
              <span>{item}</span>
              <small>→</small>
            </a>
          ))}
        </nav>
      </aside>
    </header>
  )
}

export default SiteHeader
