class KyThi < ApplicationRecord
  self.table_name = 'KyThi'
  self.primary_key = 'KyThiID'
  belongs_to :mon_thi, class_name: "MonThi", foreign_key: "MonThiID"
  has_many :dang_ky_thi_records, class_name: "DangKyThi", foreign_key: "KyThiID"
  has_many :xep_cho_records, class_name: "XepCho", foreign_key: "KyThiID"
  has_many :phan_phong_records, class_name: "PhanPhong", foreign_key: "KyThiID"
  has_many :diem_danh_records, class_name: "DiemDanh", foreign_key: "KyThiID"
end
