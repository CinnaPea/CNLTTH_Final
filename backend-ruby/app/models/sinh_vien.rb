class SinhVien < ApplicationRecord
  self.table_name = 'SinhVien'
  self.primary_key = 'SinhVienID'
  belongs_to :nguoi_dung, class_name: "NguoiDung", foreign_key: "NguoiDungID", optional: true
  has_many :dang_ky_thi_records, class_name: "DangKyThi", foreign_key: "SinhVienID"
end
