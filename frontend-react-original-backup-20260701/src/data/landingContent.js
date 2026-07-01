export const navItems = ['Kỳ thi', 'Phân phòng', 'Xếp chỗ', 'Điểm danh']

export const orbitNodes = [
  {
    label: 'Thí sinh',
    value: '1.248',
    className: 'orbit-node--top-right',
  },
  {
    label: 'Phòng thi',
    value: '24',
    className: 'orbit-node--left',
  },
  {
    label: 'Cán bộ',
    value: '96',
    className: 'orbit-node--bottom-right',
  },
  {
    label: 'Môn thi',
    value: '18',
    className: 'orbit-node--bottom-left',
  },
]

export const featurePanels = [
  {
    kicker: '01',
    title: 'Quản lý kỳ thi',
    href: '#landing-ky-thi',
    visual: 'landing-tile__visual--exams',
    text: 'Thiết lập kỳ thi, môn thi, lịch tổ chức và trạng thái vận hành từ một nơi thống nhất.',
    points: ['Theo dõi lịch thi', 'Quản lý môn thi', 'Chuẩn bị dữ liệu đầu vào'],
  },
  {
    kicker: '02',
    title: 'Phân phòng thông minh',
    href: '#landing-phan-phong',
    visual: 'landing-tile__visual--rooms',
    text: 'Tự động chia thí sinh vào từng phòng theo sức chứa, ca thi, môn thi và các quy tắc tổ chức mà đơn vị thiết lập.',
    points: ['Cân bằng sĩ số', 'Tránh trùng lịch', 'Xuất danh sách theo phòng'],
  },
  {
    kicker: '03',
    title: 'Sơ đồ chỗ ngồi rõ ràng',
    href: '#landing-xep-cho',
    visual: 'landing-tile__visual--seating',
    text: 'Sinh sơ đồ hàng cột, gắn số báo danh vào vị trí cụ thể và sẵn sàng cho việc niêm yết trước giờ thi.',
    points: ['Đánh số ghế logic', 'In sơ đồ nhanh', 'Hỗ trợ xếp xen kẽ'],
  },
  {
    kicker: '04',
    title: 'Điểm danh trực tiếp',
    href: '#landing-diem-danh',
    visual: 'landing-tile__visual--attendance',
    text: 'Cập nhật có mặt, vắng thi, ghi chú và tổng hợp trạng thái tham dự ngay trên màn hình vận hành.',
    points: ['Tìm kiếm nhanh', 'Trạng thái thời gian thực', 'Báo cáo cuối buổi'],
  },
]

export const summaryBlocks = [
  {
    title: 'Tổ chức kỳ thi từ một trung tâm điều hành',
    text: 'Tất cả thông tin về kỳ thi, môn thi, phòng thi và thí sinh được gom vào một dashboard để cán bộ quản lý không phải xử lý bằng nhiều file rời rạc.',
  },
  {
    title: 'Rút ngắn thao tác trước giờ thi',
    text: 'Từ khai báo dữ liệu, chạy phân phòng đến in sơ đồ và điểm danh, mỗi bước đều được thiết kế để giảm lặp lại và hạn chế sai sót vận hành.',
  },
]

export const detailSections = [
  {
    id: 'landing-ky-thi',
    label: 'Tổng quan',
    title: 'Nền tảng được thiết kế cho những ngày thi cần độ chính xác cao',
    text: 'Landing page này giới thiệu một hệ thống web dành cho nhà trường, trung tâm và đơn vị đào tạo cần phân phòng, xếp chỗ và điểm danh nhanh.',
  },
  {
    id: 'landing-phan-phong',
    label: 'Giá trị',
    title: 'Phân phòng thông minh giúp đội vận hành giảm áp lực trước giờ thi',
    text: 'Hệ thống giúp cân bằng thí sinh giữa các phòng, tận dụng sức chứa và giữ được cấu trúc môn thi rõ ràng để dễ kiểm tra và bàn giao.',
  },
  {
    id: 'landing-xep-cho',
    label: 'Trực quan',
    title: 'Sơ đồ chỗ ngồi giúp niêm yết và hướng dẫn thí sinh gọn gàng',
    text: 'Người dùng có thể sinh sơ đồ phòng, xem nhanh vị trí ngồi và trích xuất thông tin cần thiết bên ngoài phòng để giảm ùn tắc.',
  },
  {
    id: 'landing-diem-danh',
    label: 'Vận hành',
    title: 'Điểm danh trực tiếp để có tổng hợp nhanh ngay trong buổi thi',
    text: 'Cán bộ coi thi cập nhật có mặt, vắng thi và ghi chú tại chỗ. Ban tổ chức có thể xem số liệu tổng hợp ngay mà không cần nhập lại.',
  },
]
