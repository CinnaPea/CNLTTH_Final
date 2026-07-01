/* MB.01 – Danh sách sinh viên đăng ký thi */
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

export default function MB01Print({ kyThi, danhSach = [] }) {
  const today = new Date()
  const ngay = today.getDate(), thang = today.getMonth() + 1, nam = today.getFullYear()

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
                <strong>PHÒNG ĐÀO TẠO</strong><br />
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
          DANH SÁCH SINH VIÊN ĐĂNG KÝ THI
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 14 }}>
          (Mẫu biểu MB.01)
        </p>

        {/* Info */}
        <table style={{ width: '100%', marginBottom: 12, fontSize: 13 }}>
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
              <td><strong>Giờ bắt đầu:</strong> {kyThi?.GioBatDau?.substring(0,5) || '......'}</td>
              <td><strong>Giờ kết thúc:</strong> {kyThi?.GioKetThuc?.substring(0,5) || '......'}</td>
            </tr>
            <tr>
              <td><strong>Tổng số sinh viên đăng ký:</strong> {danhSach.length}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={th}>STT</th>
              <th style={th}>Mã Sinh Viên</th>
              <th style={th}>Họ và Tên</th>
              <th style={th}>Lớp</th>
              <th style={th}>Số Báo Danh</th>
              <th style={th}>Trạng Thái ĐK</th>
              <th style={th}>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {danhSach.map((dk, i) => (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{dk.SinhVien?.MaSinhVien || dk.SinhVienID}</td>
                <td style={td}>{dk.SinhVien?.HoTen || '-'}</td>
                <td style={td}>{dk.SinhVien?.Lop || '-'}</td>
                <td style={{ ...td, fontWeight: 'bold' }}>{dk.SoBaoDanh}</td>
                <td style={td}>{dk.TrangThaiDangKy === 'registered' ? 'Đã đăng ký' : 'Đã hủy'}</td>
                <td style={td}></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 60 }}>Cán bộ lập danh sách</p>
            <p><strong>Ký, ghi rõ họ tên</strong></p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 4 }}>
              Ngày {ngay} tháng {thang} năm {nam}
            </p>
            <p style={{ marginBottom: 60 }}><strong>Trưởng Phòng Đào Tạo</strong></p>
            <p><strong>Ký, đóng dấu</strong></p>
          </div>
        </div>
      </div>
    </>
  )
}

const th = { border: '1px solid #000', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }
const td = { border: '1px solid #000', padding: '4px 8px' }
