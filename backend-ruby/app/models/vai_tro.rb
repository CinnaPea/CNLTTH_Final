class VaiTro < ApplicationRecord
  self.table_name = 'VaiTro'
  self.primary_key = 'VaiTroID'
  has_many :nguoi_dungs, class_name: "NguoiDung", foreign_key: "VaiTroID"
end
