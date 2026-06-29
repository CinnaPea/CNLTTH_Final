function SiteFooter() {
  const systemLinks = [
    ['Kỳ thi', '#landing-ky-thi'],
    ['Phân phòng', '#landing-phan-phong'],
    ['Xếp chỗ', '#landing-xep-cho'],
    ['Điểm danh', '#landing-diem-danh'],
  ]

  return (
    <footer className="landing-footer">
      <div className="page-container landing-footer__container">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <h3>ExamFlow</h3>
            <p>
              Hệ thống web hỗ trợ tổ chức kỳ thi nội bộ: quản lý kỳ thi, phân
              phòng, xếp chỗ và điểm danh trong một luồng rõ ràng.
            </p>
          </div>

          <nav className="landing-footer__group" aria-label="Hệ thống">
            <h4>Hệ thống</h4>
            {systemLinks.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </nav>

          <nav className="landing-footer__group" aria-label="Tài khoản">
            <h4>Tài khoản</h4>
            <a href="#signup">Đăng ký</a>
            <a href="#login">Đăng nhập</a>
          </nav>

          <div className="landing-footer__group">
            <h4>Dự án</h4>
            <span>Ruby API</span>
            <span>C# Reports</span>
            <span>SQL Server</span>
          </div>
        </div>

        <p className="landing-footer__bottom">
          Copyright 2026 ExamFlow. Dự án quản lý tổ chức kỳ thi.
        </p>
      </div>
    </footer>
  )
}

export default SiteFooter
