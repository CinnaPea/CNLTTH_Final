class DiemDanh < ApplicationRecord
  self.table_name = 'DiemDanh'
  self.primary_key = 'DiemDanhID'
  belongs_to :ky_thi, class_name: "KyThi", foreign_key: "KyThiID"
  belongs_to :phong_thi, class_name: "PhongThi", foreign_key: "PhongThiID"
  belongs_to :nguoi_ghi_nhan, class_name: "NguoiDung", foreign_key: "NguoiGhiNhanID", optional: true
  belongs_to :dang_ky_thi, class_name: "DangKyThi", foreign_key: "DangKyThiID"
end
