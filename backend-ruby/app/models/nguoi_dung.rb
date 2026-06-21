class NguoiDung < ApplicationRecord
  self.table_name = 'NguoiDung'
  self.primary_key = 'NguoiDungID'
  belongs_to :vai_tro, class_name: "VaiTro", foreign_key: "VaiTroID"
  has_one :sinh_vien, class_name: "SinhVien", foreign_key: "NguoiDungID"
  has_many :phan_phong_records, class_name: "PhanPhong", foreign_key: "NguoiPhanID"
  has_many :diem_danh_records, class_name: "DiemDanh", foreign_key: "NguoiGhiNhanID"
  has_many :nhat_ky_records, class_name: "NhatKy", foreign_key: "NguoiDungID"
end
