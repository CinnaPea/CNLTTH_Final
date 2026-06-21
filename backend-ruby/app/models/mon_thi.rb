class MonThi < ApplicationRecord
  self.table_name = 'MonThi'
  self.primary_key = 'MonThiID'
  has_many :ky_thi_records, class_name: "KyThi", foreign_key: "MonThiID"
end
