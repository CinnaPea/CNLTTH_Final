/* Generic data table */
export default function Table({ columns, data, emptyText = 'Không có dữ liệu.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 14,
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <thead>
          <tr style={{ background: '#1565C0', color: '#fff' }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '10px 14px',
                textAlign: col.align || 'left',
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: 'nowrap',
                width: col.width,
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8', fontStyle: 'italic' }}>
                {emptyText}
              </td>
            </tr>
          ) : data.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
              onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? '#fff' : '#f8fafc'}
            >
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: '9px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  textAlign: col.align || 'left',
                  verticalAlign: 'middle',
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Status badge */
export function StatusBadge({ status }) {
  const map = {
    draft:            { label: 'Nháp',             bg: '#94a3b8', color: '#fff' },
    published:        { label: 'Đã công bố',       bg: '#2E7D32', color: '#fff' },
    room_assigned:    { label: 'Đã phân phòng',    bg: '#1565C0', color: '#fff' },
    seat_assigned:    { label: 'Đã xếp chỗ',       bg: '#6A1B9A', color: '#fff' },
    attendance_open:  { label: 'Điểm danh',        bg: '#E65100', color: '#fff' },
    closed:           { label: 'Đã đóng',          bg: '#455A64', color: '#fff' },
    registered:       { label: 'Đã đăng ký',       bg: '#1565C0', color: '#fff' },
    cancelled:        { label: 'Đã hủy',           bg: '#C62828', color: '#fff' },
    present:          { label: 'Có mặt',           bg: '#2E7D32', color: '#fff' },
    late:             { label: 'Đến muộn',         bg: '#E65100', color: '#fff' },
    absent:           { label: 'Vắng mặt',         bg: '#C62828', color: '#fff' },
    excused:          { label: 'Vắng có phép',     bg: '#6A1B9A', color: '#fff' },
    true:             { label: 'Hoạt động',        bg: '#2E7D32', color: '#fff' },
    false:            { label: 'Không hoạt động',  bg: '#94a3b8', color: '#fff' },
  }
  const s = map[String(status)] || { label: status, bg: '#94a3b8', color: '#fff' }
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}
