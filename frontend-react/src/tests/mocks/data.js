export const mockMonThi = [
  { MonThiID: 1, MaMon: 'CSDL', TenMon: 'Co so du lieu' },
]

export const mockKyThi = [
  {
    KyThiID: 1,
    MaKyThi: 'KT001',
    TenKyThi: 'Ky thi mau',
    MonThiID: 1,
    NgayThi: '2026-07-10',
    GioBatDau: '08:00',
    GioKetThuc: '09:30',
    TrangThai: 'published',
    MonThi: mockMonThi[0],
  },
]

export const mockPhongThi = [
  { PhongThiID: 1, MaPhong: 'B201', TenPhong: 'Phong B201', SucChua: 40, SoHang: 8, SoCot: 5, TrangThai: true },
]

export const mockSinhVien = [
  { SinhVienID: 1, MaSinhVien: 'SV001', HoTen: 'Nguyen Van A', Lop: 'CTK44', TrangThai: true },
  { SinhVienID: 2, MaSinhVien: 'SV002', HoTen: 'Tran Thi B', Lop: 'CTK44', TrangThai: true },
]

export const mockDangKyThi = [
  {
    DangKyThiID: 1,
    KyThiID: 1,
    SinhVienID: 1,
    SoBaoDanh: 'SBD001',
    TrangThaiDangKy: 'registered',
    KyThi: mockKyThi[0],
    SinhVien: mockSinhVien[0],
  },
  {
    DangKyThiID: 2,
    KyThiID: 1,
    SinhVienID: 2,
    SoBaoDanh: 'SBD002',
    TrangThaiDangKy: 'registered',
    KyThi: mockKyThi[0],
    SinhVien: mockSinhVien[1],
  },
]

export const mockPhanPhong = [
  {
    PhanPhongID: 1,
    KyThiID: 1,
    PhongThiID: 1,
    DangKyThiID: 1,
    PhongThi: mockPhongThi[0],
    DangKyThi: mockDangKyThi[0],
  },
]

export const mockXepCho = [
  {
    XepChoID: 1,
    KyThiID: 1,
    PhongThiID: 1,
    DangKyThiID: 1,
    SoCho: 'H1-C1',
    Hang: 1,
    Cot: 1,
    PhongThi: mockPhongThi[0],
    DangKyThi: mockDangKyThi[0],
  },
]

export const mockDiemDanh = [
  {
    DiemDanhID: 1,
    KyThiID: 1,
    PhongThiID: 1,
    DangKyThiID: 1,
    TrangThai: 'absent',
    PhongThi: mockPhongThi[0],
    DangKyThi: mockDangKyThi[0],
  },
]
