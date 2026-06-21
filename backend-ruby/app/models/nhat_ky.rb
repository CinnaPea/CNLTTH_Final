class NhatKy < ApplicationRecord
  self.table_name = 'NhatKy'
  self.primary_key = 'NhatKyID'
  belongs_to :nguoi_dung, class_name: "NguoiDung", foreign_key: "NguoiDungID", optional: true
end
