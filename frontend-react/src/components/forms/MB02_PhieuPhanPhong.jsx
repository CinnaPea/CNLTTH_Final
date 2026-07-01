/* MB.02 – Phiếu phân phòng thi */
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

export default function MB02Print({ kyThi, danhSach = [] }) {
  const today = new Date()
  const ngay = today.getDate(), thang = today.getMonth() + 1, nam = today.getFullYear()

  // Group by room
  const byPhong = {}
  danhSach.forEach(pp => {
    const pid = pp.PhongThiID
    if (!byPhong[pid]) byPhong[pid] = { phong: pp.PhongThi, rows: [] }
    byPhong[pid].rows.push(pp)
  })

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
          PHIẾU PHÂN PHÒNG THI
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 14 }}>(Mẫu biểu MB.02)</p>

        {/* Exam Info */}
        <table style={{ width: '100%', marginBottom: 14, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%' }}><strong>Kỳ thi:</strong> {kyThi?.TenKyThi || '..............................'}</td>
              <td><strong>Mã kỳ thi:</strong> {kyThi?.MaKyThi || '...............'}</td>
            </tr>
            <tr>
              <td><strong>Môn thi:</strong> {kyThi?.MonThi?.TenMon || '..............................'}</td>
              <td><strong>Ngày thi:</strong> {kyThi?.NgayThi || '...............'}</td>
            </tr>
            <tr>
              <td><strong>Giờ:</strong> {kyThi?.GioBatDau?.substring(0,5) || '......'} – {kyThi?.GioKetThuc?.substring(0,5) || '......'}</td>
              <td><strong>Tổng SV được phân:</strong> {danhSach.length}</td>
            </tr>
          </tbody>
        </table>

        {/* Per-room tables */}
        {Object.values(byPhong).map((group, gi) => (
          <div key={gi} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <div style={{ background: '#e8e8e8', border: '1px solid #000', padding: '5px 10px', fontWeight: 'bold', fontSize: 13 }}>
              Phòng thi: {group.phong?.TenPhong || `P${Object.keys(byPhong)[gi]}`}
              {group.phong && (
                <span style={{ marginLeft: 16, fontWeight: 'normal', fontSize: 12 }}>
                  | Tòa: {group.phong.ToaNha || '–'} | Tầng: {group.phong.Tang || '–'} | Sức chứa: {group.phong.SucChua}
                </span>
              )}
              <span style={{ marginLeft: 16, fontWeight: 'normal', fontSize: 12 }}>| SV: {group.rows.length}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>STT</th>
                  <th style={th}>Mã SV</th>
                  <th style={th}>Họ và Tên</th>
                  <th style={th}>Lớp</th>
                  <th style={th}>Số Báo Danh</th>
                  <th style={th}>Mã Phòng</th>
                  <th style={th}>Tòa Nhà</th>
                  <th style={th}>Tầng</th>
                  <th style={th}>Ký Xác Nhận</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((pp, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'center' }}>{i + 1}</td>
                    <td style={td}>{pp.DangKyThi?.SinhVien?.MaSinhVien || '-'}</td>
                    <td style={td}>{pp.DangKyThi?.SinhVien?.HoTen || '-'}</td>
                    <td style={td}>{pp.DangKyThi?.SinhVien?.Lop || '-'}</td>
                    <td style={{ ...td, fontWeight: 'bold', textAlign: 'center' }}>{pp.DangKyThi?.SoBaoDanh || '-'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{pp.PhongThi?.MaPhong || '-'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{pp.PhongThi?.ToaNha || '-'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{pp.PhongThi?.Tang || '-'}</td>
                    <td style={td}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 60 }}>Cán bộ Khảo thí</p>
            <p><strong>Ký, ghi rõ họ tên</strong></p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 4 }}>Ngày {ngay} tháng {thang} năm {nam}</p>
            <p style={{ marginBottom: 60 }}><strong>Trưởng Phòng Khảo Thí</strong></p>
            <p><strong>Ký, đóng dấu</strong></p>
          </div>
        </div>
      </div>
    </>
  )
}

const th = { border: '1px solid #000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }
const td = { border: '1px solid #000', padding: '4px 8px' }
