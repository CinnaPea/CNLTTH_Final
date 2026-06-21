class PhongThi < ApplicationRecord
  self.table_name = 'PhongThi'
  self.primary_key = 'PhongThiID'
  has_many :phan_phong_records, class_name: "PhanPhong", foreign_key: "PhongThiID"
  has_many :xep_cho_records, class_name: "XepCho", foreign_key: "PhongThiID"
  has_many :diem_danh_records, class_name: "DiemDanh", foreign_key: "PhongThiID"
end
