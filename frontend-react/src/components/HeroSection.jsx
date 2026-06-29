import { useState } from 'react'

function HeroSection({ orbitNodes }) {
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)

  return (
    <section className="hero-section">
      <div className="hero-section__glow" />

      <div className="page-container hero-section__inner">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>
              Tổ chức kỳ thi gọn gàng,
              <br />
              phân phòng chính xác,
              <br />
              <span>điểm danh trong một click!</span>
            </h1>
            <p>
              Một landing page giới thiệu hệ thống đăng nhập và đăng ký cho nhu
              cầu tổ chức kỳ thi, giúp nhà trường và trung tâm bắt đầu truy cập
              nhanh vào khu vực điều hành.
            </p>

            <div className="hero-actions">
              <a className="button button--primary" href="#landing-workflows">
                Khám phá tính năng
              </a>
              <button
                className="button button--green"
                onClick={() => setIsOverviewOpen(true)}
                type="button"
              >
                Tổng quan hệ thống
              </button>
            </div>
          </div>

          <div className="hero-orbit" aria-label="Tổng quan số liệu hệ thống">
            <div className="orbit-ring orbit-ring--sm" />
            <div className="orbit-ring orbit-ring--md" />
            <div className="orbit-ring orbit-ring--lg" />

            <div className="orbit-core">
              <strong>20k+</strong>
              <span>Lượt dự thi xử lý</span>
            </div>

            {orbitNodes.map((node) => (
              <div className={`orbit-node ${node.className}`} key={node.label}>
                <strong>{node.value}</strong>
                <span>{node.label}</span>
              </div>
            ))}

            <div className="orbit-tag orbit-tag--room">Phân phòng</div>
            <div className="orbit-tag orbit-tag--seat">Xếp chỗ</div>
            <div className="orbit-tag orbit-tag--attendance">Điểm danh</div>
          </div>
        </div>

        <section className="hero-stats" id="summary">
          {[
            ['03', 'Phân hệ nghiệp vụ chính'],
            ['24', 'Phòng thi sẵn sàng khai báo'],
            ['1.248', 'Thí sinh mẫu cho dashboard đầu tiên'],
            ['Rails API', 'Sẵn cho kết nối backend và SQL Server'],
          ].map(([value, label], index) => (
            <div className="hero-stat" id={index === 3 ? 'login-anchor' : undefined} key={value}>
              <span>{value}</span>
              <p>{label}</p>
            </div>
          ))}
        </section>
      </div>

      {isOverviewOpen && (
        <div className="overview-overlay" onClick={() => setIsOverviewOpen(false)}>
          <article
            aria-modal="true"
            className="overview-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Đóng tổng quan hệ thống"
              className="overview-card__close"
              onClick={() => setIsOverviewOpen(false)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">Tổng quan hệ thống</p>
            <h2>ExamFlow tổ chức kỳ thi từ lúc chuẩn bị đến lúc điểm danh</h2>
            <p>
              Dự án mô phỏng một hệ thống web hỗ trợ nhà trường và trung tâm
              quản lý kỳ thi, phòng thi, thí sinh, sơ đồ chỗ ngồi và điểm danh
              trong cùng một quy trình.
            </p>
            <div className="overview-card__meta">
              <span>MVP React</span>
              <span>Rails API vận hành</span>
              <span>SQL Server dữ liệu</span>
              <span>C# Reports sau khi sẵn sàng</span>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default HeroSection
