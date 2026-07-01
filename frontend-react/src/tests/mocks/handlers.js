import { http, HttpResponse } from 'msw'
import { API_BASE_URLS } from '../../api/client'
import {
  mockDangKyThi,
  mockDiemDanh,
  mockKyThi,
  mockMonThi,
  mockPhanPhong,
  mockPhongThi,
  mockSinhVien,
  mockXepCho,
} from './data'

function providerHandlers(baseUrl, backend) {
  return [
    http.get(`${baseUrl}/health`, () => HttpResponse.json({ status: 'ok', backend, database: 'mock-sql' })),
    http.post(`${baseUrl}/auth/login`, async ({ request }) => {
      const body = await request.json()
      const identifier = String(body.identifier || body.email || '').toLowerCase()

      if (identifier !== 'admin@exam.local' || body.password !== 'admin_password') {
        return HttpResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 })
      }

      return HttpResponse.json({
        token: 'mock-admin-token',
        authSource: `${backend}-auth`,
        user: {
          NguoiDungID: 1,
          Email: 'admin@exam.local',
          HoTen: 'Quan tri he thong',
          VaiTroID: 1,
          TenVaiTro: 'Admin',
          TrangThai: 1,
        },
      })
    }),
    http.get(`${baseUrl}/mon_thi`, () => HttpResponse.json(mockMonThi)),
    http.post(`${baseUrl}/mon_thi`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ MonThiID: 99, ...body.mon_thi }, { status: 201 })
    }),
    http.patch(`${baseUrl}/mon_thi/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ MonThiID: Number(params.id), ...body.mon_thi })
    }),
    http.delete(`${baseUrl}/mon_thi/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/ky_thi`, () => HttpResponse.json(mockKyThi)),
    http.post(`${baseUrl}/ky_thi`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ KyThiID: 99, TrangThai: 'draft', ...body.ky_thi }, { status: 201 })
    }),
    http.patch(`${baseUrl}/ky_thi/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ KyThiID: Number(params.id), ...body.ky_thi })
    }),
    http.patch(`${baseUrl}/ky_thi/:id/publish`, ({ params }) => HttpResponse.json({ ...mockKyThi[0], KyThiID: Number(params.id), TrangThai: 'published' })),
    http.patch(`${baseUrl}/ky_thi/:id/close`, ({ params }) => HttpResponse.json({ ...mockKyThi[0], KyThiID: Number(params.id), TrangThai: 'closed' })),
    http.delete(`${baseUrl}/ky_thi/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/phong_thi`, () => HttpResponse.json(mockPhongThi)),
    http.post(`${baseUrl}/phong_thi`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ PhongThiID: 99, ...body.phong_thi }, { status: 201 })
    }),
    http.patch(`${baseUrl}/phong_thi/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ ...mockPhongThi[0], PhongThiID: Number(params.id), ...body.phong_thi })
    }),
    http.delete(`${baseUrl}/phong_thi/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/sinh_vien`, () => HttpResponse.json(mockSinhVien)),
    http.post(`${baseUrl}/sinh_vien`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ SinhVienID: 99, ...body.sinh_vien }, { status: 201 })
    }),
    http.patch(`${baseUrl}/sinh_vien/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ ...mockSinhVien[0], SinhVienID: Number(params.id), ...body.sinh_vien })
    }),
    http.delete(`${baseUrl}/sinh_vien/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/nguoi_dung`, () => HttpResponse.json([
      { NguoiDungID: 1, Email: 'admin@exam.local', HoTen: 'Quan tri he thong', VaiTroID: 1, TenVaiTro: 'Admin', TrangThai: 1 },
    ])),
    http.get(`${baseUrl}/vai_tro`, () => HttpResponse.json([
      { VaiTroID: 1, TenVaiTro: 'Admin' },
      { VaiTroID: 2, TenVaiTro: 'CanBoDaoTao' },
      { VaiTroID: 3, TenVaiTro: 'CanBoKhaoThi' },
      { VaiTroID: 4, TenVaiTro: 'SinhVien' },
    ])),
    http.get(`${baseUrl}/dang_ky_thi`, () => HttpResponse.json(mockDangKyThi)),
    http.post(`${baseUrl}/dang_ky_thi`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ DangKyThiID: 99, SoBaoDanh: 'SBD099', ...body.dang_ky_thi }, { status: 201 })
    }),
    http.patch(`${baseUrl}/dang_ky_thi/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ ...mockDangKyThi[0], DangKyThiID: Number(params.id), ...body.dang_ky_thi })
    }),
    http.patch(`${baseUrl}/dang_ky_thi/:id/cancel`, ({ params }) => HttpResponse.json({ ...mockDangKyThi[0], DangKyThiID: Number(params.id), TrangThaiDangKy: 'cancelled' })),
    http.delete(`${baseUrl}/dang_ky_thi/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/phan_phong`, () => HttpResponse.json(mockPhanPhong)),
    http.post(`${baseUrl}/phan_phong`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ PhanPhongID: 99, ...body.phan_phong }, { status: 201 })
    }),
    http.delete(`${baseUrl}/phan_phong/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.get(`${baseUrl}/xep_cho`, () => HttpResponse.json(mockXepCho)),
    http.post(`${baseUrl}/xep_cho`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ XepChoID: 99, ...body.xep_cho }, { status: 201 })
    }),
    http.delete(`${baseUrl}/xep_cho/:id`, () => HttpResponse.json({ message: 'Deleted successfully.' })),
    http.post(`${baseUrl}/ky_thi/:id/auto_xep_cho`, () => HttpResponse.json({ message: 'Auto seating completed.', created: 1 })),
    http.post(`${baseUrl}/ky_thi/:id/open_diem_danh`, () => HttpResponse.json({ message: 'Attendance opened.', created: 1 })),
    http.get(`${baseUrl}/diem_danh`, () => HttpResponse.json(mockDiemDanh)),
    http.patch(`${baseUrl}/diem_danh/:id`, async ({ request, params }) => {
      const body = await request.json()
      return HttpResponse.json({ ...mockDiemDanh[0], DiemDanhID: Number(params.id), ...body.diem_danh })
    }),
    http.get(`${baseUrl}/nhat_ky`, () => HttpResponse.json([
      { NhatKyID: 1, NguoiDungID: 1, HanhDong: 'READ', LoaiDoiTuong: 'KyThi', DoiTuongID: 1, MoTa: 'Loaded dashboard data.', ThoiGian: '2026-07-01T07:00:00Z', HoTen: 'Quan tri he thong', VaiTro: 'Admin' },
    ])),
    http.get(`${baseUrl}/nhat_ky/:id`, ({ params }) => HttpResponse.json({
      NhatKyID: Number(params.id),
      NguoiDungID: 1,
      HanhDong: 'READ',
      LoaiDoiTuong: 'KyThi',
      DoiTuongID: 1,
      MoTa: 'Loaded dashboard data.',
      ThoiGian: '2026-07-01T07:00:00Z',
      HoTen: 'Quan tri he thong',
      VaiTro: 'Admin',
    })),
  ]
}

export const handlers = [
  ...providerHandlers(API_BASE_URLS.ruby, 'ruby'),
  ...providerHandlers(API_BASE_URLS.csharp, 'csharp'),
]
