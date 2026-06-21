class XepCho < ApplicationRecord
  self.table_name = 'XepCho'
  self.primary_key = 'XepChoID'
  belongs_to :ky_thi, class_name: "KyThi", foreign_key: "KyThiID"
  belongs_to :phong_thi, class_name: "PhongThi", foreign_key: "PhongThiID"
  belongs_to :dang_ky_thi, class_name: "DangKyThi", foreign_key: "DangKyThiID"
end
