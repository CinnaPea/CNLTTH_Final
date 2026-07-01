/* MB.04 – Bảng điểm danh */
const printStyle = `
  @media print {
    body * { visibility: hidden !important; }
    .print-mb, .print-mb * { visibility: visible !important; }
    .print-mb {
      display: block !important;
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
    }
    @page { margin: 18mm; }
  }
`

const STATUS_LABEL = {
  present: 'Có mặt',
  late: 'Đến muộn',
  absent: 'Vắng mặt',
  excused: 'Vắng có phép',
}

export default function MB04Print({ kyThi, danhSach = [], stats = {} }) {
  const today = new Date()
  const ngay = today.getDate(), thang = today.getMonth() + 1, nam = today.getFullYear()

  // Group by room
  const byPhong = {}
  danhSach.forEach(dd => {
    const pid = dd.PhongThiID
    if (!byPhong[pid]) byPhong[pid] = { phong: dd.PhongThi, rows: [] }
    byPhong[pid].rows.push(dd)
  })

  const totalPresent = stats.present || 0
  const totalLate = stats.late || 0
  const totalAbsent = stats.absent || 0
  const totalExcused = stats.excused || 0
  const total = danhSach.length

  return (
    <>
      <style>{printStyle}</style>
      <div className="print-mb" style={{ display: 'none', fontFamily: 'Times New Roman, serif', fontSize: 13, color: '#000' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', fontSize: 12 }}>
                <strong>TRƯỜNG ĐẠI HỌC ...</strong><br />
                <strong>PHÒNG KHẢO THÍ</strong><br />
                <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: 120 }}></span>
              </td>
              <td style={{ width: '50%', textAlign: 'center', fontSize: 12 }}>
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                <strong>Độc lập – Tự do – Hạnh phúc</strong><br />
                <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: 180 }}></span>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', margin: '14px 0 4px', textTransform: 'uppercase' }}>
          BẢNG ĐIỂM DANH
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 14 }}>(Mẫu biểu MB.04)</p>

        {/* Exam Info */}
        <table style={{ width: '100%', marginBottom: 12, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%' }}><strong>Kỳ thi:</strong> {kyThi?.TenKyThi || '..............................'}</td>
              <td><strong>Ngày thi:</strong> {kyThi?.NgayThi || '...............'}</td>
            </tr>
            <tr>
              <td><strong>Môn thi:</strong> {kyThi?.MonThi?.TenMon || '..............................'}</td>
              <td><strong>Giờ:</strong> {kyThi?.GioBatDau?.substring(0,5) || '.....'} – {kyThi?.GioKetThuc?.substring(0,5) || '.....'}</td>
            </tr>
          </tbody>
        </table>

        {/* Summary stats */}
        <table style={{ borderCollapse: 'collapse', marginBottom: 14, fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#e8e8e8' }}>
              <th style={th}>Tổng SV</th>
              <th style={th}>Có mặt</th>
              <th style={th}>Đến muộn</th>
              <th style={th}>Vắng mặt</th>
              <th style={th}>Vắng có phép</th>
              <th style={th}>Tỷ lệ dự thi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...td, textAlign: 'center', fontWeight: 'bold' }}>{total}</td>
              <td style={{ ...td, textAlign: 'center' }}>{totalPresent}</td>
              <td style={{ ...td, textAlign: 'center' }}>{totalLate}</td>
              <td style={{ ...td, textAlign: 'center' }}>{totalAbsent}</td>
              <td style={{ ...td, textAlign: 'center' }}>{totalExcused}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                {total > 0 ? (((totalPresent + totalLate) / total) * 100).toFixed(1) + '%' : '–'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Per-room attendance tables */}
        {Object.values(byPhong).map((group, gi) => (
          <div key={gi} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <div style={{ background: '#e8e8e8', border: '1px solid #000', padding: '5px 10px', fontWeight: 'bold', fontSize: 13, marginBottom: 0 }}>
              Phòng thi: {group.phong?.TenPhong || '–'} &nbsp;|&nbsp; {group.rows.length} sinh viên
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>STT</th>
                  <th style={th}>Số Báo Danh</th>
                  <th style={th}>Họ và Tên</th>
                  <th style={th}>Lớp</th>
                  <th style={th}>Chỗ Ngồi</th>
                  <th style={th}>Trạng Thái</th>
                  <th style={th}>Giờ Check-in</th>
                  <th style={th}>Ghi Chú</th>
                  <th style={th}>Ký Tên</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((dd, i) => (
                  <tr key={i} style={{ background: dd.TrangThai === 'absent' ? '#fff0f0' : dd.TrangThai === 'present' ? '#f0fff0' : '#fff' }}>
                    <td style={{ ...td, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 'bold', textAlign: 'center' }}>{dd.DangKyThi?.SoBaoDanh || '-'}</td>
                    <td style={td}>{dd.DangKyThi?.SinhVien?.HoTen || '-'}</td>
                    <td style={td}>{dd.DangKyThi?.SinhVien?.Lop || '-'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>–</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 'bold' }}>
                      {STATUS_LABEL[dd.TrangThai] || dd.TrangThai}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {dd.ThoiGianCheckIn ? new Date(dd.ThoiGianCheckIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '–'}
                    </td>
                    <td style={td}>{dd.GhiChu || ''}</td>
                    <td style={td}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Status legend */}
        <div style={{ marginTop: 8, fontSize: 11, border: '1px solid #ccc', padding: '6px 12px', display: 'inline-block' }}>
          <strong>Chú thích trạng thái: </strong>
          <span style={{ marginRight: 16 }}>✓ Có mặt</span>
          <span style={{ marginRight: 16 }}>M Đến muộn</span>
          <span style={{ marginRight: 16 }}>✗ Vắng mặt</span>
          <span>P Vắng có phép</span>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 50 }}>Cán bộ ghi nhận điểm danh</p>
            <p><strong>Ký, ghi rõ họ tên</strong></p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 4 }}>Ngày {ngay} tháng {thang} năm {nam}</p>
            <p style={{ marginBottom: 50 }}><strong>Trưởng Phòng Khảo Thí</strong></p>
            <p><strong>Ký, đóng dấu</strong></p>
          </div>
        </div>
      </div>
    </>
  )
}

const th = { border: '1px solid #000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }
const td = { border: '1px solid #000', padding: '4px 8px' }
