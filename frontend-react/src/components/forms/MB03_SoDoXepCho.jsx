/* MB.03 – Sơ đồ xếp chỗ ngồi */
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
    @page { margin: 14mm; size: A4 landscape; }
  }
`

function RoomGrid({ phong, seats }) {
  const roomColumnCount = Number(phong?.SoCot || 0)
  const roomCapacity = Number(phong?.SucChua || 0)
  const maxCol = Math.max(roomColumnCount, ...seats.map(s => s.Cot || 1), 1)
  const roomRowCount = Number(phong?.SoHang || 0) || Math.ceil(roomCapacity / maxCol)
  const maxRow = Math.max(roomRowCount, ...seats.map(s => s.Hang || 1), 1)
  const seatMap = {}
  seats.forEach(s => { seatMap[`${s.Hang}-${s.Cot}`] = s })

  return (
    <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
      <div style={{ background: '#e8e8e8', border: '1px solid #000', padding: '5px 10px', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>
        Phòng thi: {phong?.TenPhong || '–'} &nbsp;|&nbsp; Tòa: {phong?.ToaNha || '–'} &nbsp;|&nbsp; Tầng: {phong?.Tang || '–'} &nbsp;|&nbsp; Số SV: {seats.length}
      </div>

      {/* Bục giảng */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ background: '#ccc', border: '1px solid #000', padding: '3px 40px', fontWeight: 'bold', fontSize: 12 }}>
          ▲ BỤC GIẢNG / GIÁM THỊ
        </span>
      </div>

      {/* Grid */}
      <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 30, background: '#e8e8e8' }}>H\C</th>
            {Array.from({ length: maxCol }, (_, c) => (
              <th key={c} style={{ ...th, width: 80, background: '#e8e8e8', textAlign: 'center' }}>Cột {c+1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRow }, (_, r) => (
            <tr key={r}>
              <td style={{ ...th, background: '#e8e8e8', textAlign: 'center', fontSize: 11 }}>H{r+1}</td>
              {Array.from({ length: maxCol }, (_, c) => {
                const seat = seatMap[`${r+1}-${c+1}`]
                return (
                  <td key={c} style={{
                    ...td,
                    background: seat ? '#fff' : '#f5f5f5',
                    textAlign: 'center',
                    height: 50,
                    verticalAlign: 'middle',
                    minWidth: 80,
                  }}>
                    {seat ? (
                      <>
                        <div style={{ fontWeight: 'bold', fontSize: 11 }}>{seat.SoCho}</div>
                        <div style={{ fontSize: 10, lineHeight: 1.2 }}>{seat.DangKyThi?.SinhVien?.HoTen?.split(' ').slice(-2).join(' ') || '–'}</div>
                        <div style={{ fontSize: 9, color: '#555' }}>{seat.DangKyThi?.SoBaoDanh}</div>
                        <div style={{ fontSize: 9, color: '#666' }}>{seat.DangKyThi?.SinhVien?.Lop || ''}</div>
                      </>
                    ) : (
                      <span style={{ color: '#bbb', fontSize: 9 }}>Trống</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MB03Print({ kyThi, danhSach = [] }) {
  const today = new Date()
  const ngay = today.getDate(), thang = today.getMonth() + 1, nam = today.getFullYear()

  // Group by room
  const byPhong = {}
  danhSach.forEach(xc => {
    const pid = xc.PhongThiID
    if (!byPhong[pid]) byPhong[pid] = { phong: xc.PhongThi, seats: [] }
    byPhong[pid].seats.push(xc)
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
                <strong>PHÒNG KHẢO THÍ</strong>
              </td>
              <td style={{ width: '50%', textAlign: 'center', fontSize: 12 }}>
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                <strong>Độc lập – Tự do – Hạnh phúc</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', margin: '12px 0 4px', textTransform: 'uppercase' }}>
          SƠ ĐỒ XẾP CHỖ NGỒI
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 12 }}>(Mẫu biểu MB.03)</p>

        <table style={{ width: '100%', marginBottom: 12, fontSize: 13 }}>
          <tbody>
            <tr>
              <td><strong>Kỳ thi:</strong> {kyThi?.TenKyThi || '..............................'}</td>
              <td><strong>Ngày thi:</strong> {kyThi?.NgayThi || '...............'}</td>
              <td><strong>Giờ:</strong> {kyThi?.GioBatDau?.substring(0,5) || '.....'} – {kyThi?.GioKetThuc?.substring(0,5) || '.....'}</td>
            </tr>
          </tbody>
        </table>

        {Object.values(byPhong).map((group, i) => (
          <RoomGrid key={i} phong={group.phong} seats={group.seats} />
        ))}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ fontStyle: 'italic', marginBottom: 50 }}>Cán bộ lập sơ đồ</p>
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

const th = { border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold' }
const td = { border: '1px solid #000', padding: '3px 4px' }
