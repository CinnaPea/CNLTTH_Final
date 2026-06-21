class DangKyThi < ApplicationRecord
  self.table_name = 'DangKyThi'
  self.primary_key = 'DangKyThiID'
  belongs_to :ky_thi, class_name: "KyThi", foreign_key: "KyThiID"
  belongs_to :sinh_vien, class_name: "SinhVien", foreign_key: "SinhVienID"
  has_one :phan_phong, class_name: "PhanPhong", foreign_key: "DangKyThiID"
  has_one :xep_cho, class_name: "XepCho", foreign_key: "DangKyThiID"
  has_one :diem_danh, class_name: "DiemDanh", foreign_key: "DangKyThiID"
end
