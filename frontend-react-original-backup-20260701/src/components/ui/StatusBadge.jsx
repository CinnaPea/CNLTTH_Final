function getTone(label = '') {
  const normalizedLabel = String(label)

  if (
    normalizedLabel.includes('San')
    || normalizedLabel.includes('Sẵn')
    || normalizedLabel.includes('Co mat')
    || normalizedLabel.includes('Có mặt')
    || normalizedLabel.includes('Da')
    || normalizedLabel.includes('Đã')
    || normalizedLabel.includes('Hoat dong')
    || normalizedLabel.includes('Hoạt động')
  ) return 'green'

  if (
    normalizedLabel.includes('Nhap')
    || normalizedLabel.includes('Nháp')
    || normalizedLabel.includes('Con')
    || normalizedLabel.includes('Còn')
    || normalizedLabel.includes('tre')
    || normalizedLabel.includes('trễ')
  ) return 'yellow'

  if (
    normalizedLabel.includes('Vang')
    || normalizedLabel.includes('Vắng')
    || normalizedLabel.includes('Chua')
    || normalizedLabel.includes('Chưa')
    || normalizedLabel.includes('Can')
    || normalizedLabel.includes('Cần')
    || normalizedLabel.includes('Tam khoa')
    || normalizedLabel.includes('Tạm khóa')
  ) return 'red'

  if (
    normalizedLabel.includes('Dang')
    || normalizedLabel.includes('Đang')
    || normalizedLabel.includes('Cho')
    || normalizedLabel.includes('Chờ')
  ) return 'blue'

  return 'slate'
}

function StatusBadge({ children }) {
  const tone = getTone(String(children))

  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export default StatusBadge
