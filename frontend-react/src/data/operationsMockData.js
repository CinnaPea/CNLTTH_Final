export const legacyAppNavItems = [
  { label: 'Dashboard', hash: '#dashboard', icon: 'D' },
  { label: 'Tài khoản', hash: '#account', icon: 'U' },
  { label: 'Kỳ thi', hash: '#exams', icon: 'K' },
  { label: 'Phòng thi', hash: '#rooms', icon: 'P' },
  { label: 'Thí sinh', hash: '#candidates', icon: 'T' },
  { label: 'Phân phòng', hash: '#room-assignment', icon: 'R' },
  { label: 'Xếp chỗ', hash: '#seat-assignment', icon: 'S' },
  { label: 'Điểm danh', hash: '#attendance', icon: 'A' },
]

export const encodedAppNavItems = [
  { label: 'Dashboard', hash: '#dashboard', icon: '▦' },
  { label: 'Tai khoan', hash: '#account', icon: '◉' },
  { label: 'Ky thi', hash: '#exams', icon: '◇' },
  { label: 'Phong thi', hash: '#rooms', icon: '▥' },
  { label: 'Thi sinh', hash: '#candidates', icon: '♙' },
  { label: 'Phan phong', hash: '#room-assignment', icon: '⇄' },
  { label: 'Xep cho', hash: '#seat-assignment', icon: '⌑' },
  { label: 'Diem danh', hash: '#attendance', icon: '✓' },
]

export const appNavItems = [
  { label: 'Dashboard', hash: '#dashboard', icon: '[]' },
  { label: 'Tai khoan', hash: '#account', icon: '@' },
  { label: 'Mon thi', hash: '#subjects', icon: '#' },
  { label: 'Ky thi', hash: '#exams', icon: '<>' },
  { label: 'Dang ky thi', hash: '#registrations', icon: '+' },
  { label: 'Phong thi', hash: '#rooms', icon: '::' },
  { label: 'Thi sinh', hash: '#candidates', icon: 'id' },
  { label: 'Phan phong', hash: '#room-assignment', icon: '->' },
  { label: 'Xep cho', hash: '#seat-assignment', icon: '##' },
  { label: 'Diem danh', hash: '#attendance', icon: 'ok' },
]

export const roleNavAccess = {
  Admin: appNavItems.map((item) => item.hash),
  CanBoDaoTao: ['#dashboard', '#account', '#subjects', '#exams', '#candidates', '#registrations'],
  CanBoKhaoThi: ['#dashboard', '#account', '#rooms', '#room-assignment', '#seat-assignment', '#attendance'],
  SinhVien: ['#dashboard', '#account'],
}

export function getRoleNavItems(roleName) {
  const allowedHashes = roleNavAccess[roleName] || roleNavAccess.SinhVien
  return appNavItems.filter((item) => allowedHashes.includes(item.hash))
}

export const dashboardMetrics = [
  { label: 'Kỳ thi đang chuẩn bị', value: '03', tone: 'blue' },
  { label: 'Phòng sẵn sàng', value: '24', tone: 'green' },
  { label: 'Thí sinh dự kiến', value: '1.248', tone: 'yellow' },
  { label: 'Tiến độ điểm danh', value: '68%', tone: 'blue' },
]

export const activeExams = [
  {
    id: 'KT2026-01',
    name: 'Kỳ thi cuối kỳ Spring 2026',
    date: '2026-05-18',
    subjects: 6,
    candidates: 1248,
    status: 'Đang chuẩn bị',
  },
  {
    id: 'KT2026-02',
    name: 'Đánh giá năng lực đầu vào',
    date: '2026-06-02',
    subjects: 3,
    candidates: 420,
    status: 'Nháp',
  },
  {
    id: 'KT2026-03',
    name: 'Thi chứng chỉ nội bộ',
    date: '2026-06-14',
    subjects: 4,
    candidates: 310,
    status: 'Chờ duyệt',
  },
]

export const rooms = [
  { id: 'P-101', name: 'Phòng 101', capacity: 48, assigned: 46, status: 'Sẵn sàng' },
  { id: 'P-102', name: 'Phòng 102', capacity: 48, assigned: 48, status: 'Đủ chỗ' },
  { id: 'P-203', name: 'Phòng 203', capacity: 36, assigned: 32, status: 'Còn chỗ' },
  { id: 'LAB-01', name: 'Lab 01', capacity: 30, assigned: 24, status: 'Cần kiểm tra' },
]

export const candidates = [
  { id: 'SV0001', name: 'Nguyễn Minh An', subject: 'Toán ứng dụng', room: 'P-101', status: 'Đã phân phòng' },
  { id: 'SV0002', name: 'Trần Gia Bảo', subject: 'Cơ sở dữ liệu', room: 'P-101', status: 'Đã phân phòng' },
  { id: 'SV0003', name: 'Lê Hoài Nam', subject: 'Lập trình Web', room: 'P-203', status: 'Đã phân phòng' },
  { id: 'SV0004', name: 'Phạm Thu Hà', subject: 'Mạng máy tính', room: '-', status: 'Chưa phân phòng' },
]

export const roomAssignments = [
  { room: 'Phòng 101', capacity: 48, assigned: 46, subject: 'Toán ứng dụng', invigilator: 'GV Nguyễn Hạnh' },
  { room: 'Phòng 102', capacity: 48, assigned: 48, subject: 'Cơ sở dữ liệu', invigilator: 'GV Trần Minh' },
  { room: 'Phòng 203', capacity: 36, assigned: 32, subject: 'Lập trình Web', invigilator: 'GV Lê Thanh' },
]

export const seatRows = [
  ['SV0001', 'SV0005', 'SV0009', 'SV0013', 'SV0017'],
  ['SV0002', 'SV0006', 'SV0010', 'SV0014', 'SV0018'],
  ['SV0003', 'SV0007', 'SV0011', 'SV0015', 'SV0019'],
  ['SV0004', 'SV0008', 'SV0012', 'SV0016', 'SV0020'],
]

export const attendanceRows = [
  { id: 'SV0001', name: 'Nguyễn Minh An', room: 'P-101', seat: 'A01', status: 'Có mặt' },
  { id: 'SV0002', name: 'Trần Gia Bảo', room: 'P-101', seat: 'A02', status: 'Có mặt' },
  { id: 'SV0003', name: 'Lê Hoài Nam', room: 'P-203', seat: 'B04', status: 'Vắng' },
  { id: 'SV0004', name: 'Phạm Thu Hà', room: 'P-203', seat: 'B05', status: 'Đi trễ' },
]
