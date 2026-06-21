class PhanPhong < ApplicationRecord
  self.table_name = 'PhanPhong'
  self.primary_key = 'PhanPhongID'
  belongs_to :ky_thi, class_name: "KyThi", foreign_key: "KyThiID"
  belongs_to :phong_thi, class_name: "PhongThi", foreign_key: "PhongThiID"
  belongs_to :nguoi_phan, class_name: "NguoiDung", foreign_key: "NguoiPhanID", optional: true
  belongs_to :dang_ky_thi, class_name: "DangKyThi", foreign_key: "DangKyThiID"
end
