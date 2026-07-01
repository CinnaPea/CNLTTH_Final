function BackToTop({ isVisible }) {
  return (
    <a
      className={`back-to-top ${isVisible ? 'is-visible' : ''}`}
      href="#top"
      aria-label="Quay lại đầu trang"
    >
      ↑
    </a>
  )
}

export default BackToTop
