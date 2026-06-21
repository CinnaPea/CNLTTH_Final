class Api::V1::XepChoController < ApplicationController
  before_action :set_xep_cho, only: [:show, :destroy]

  def index
    records = XepCho
              .includes(:dang_ky_thi, :ky_thi, :phong_thi)
              .order(XepChoID: :asc)

    render json: records.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong, :ToaNha, :Tang]
        },
        dang_ky_thi: {
          only: [:DangKyThiID, :SoBaoDanh],
          include: {
            sinh_vien: {
              only: [:SinhVienID, :MaSinhVien, :HoTen, :Lop]
            }
          }
        }
      }
    )
  end

  def show
    render json: @xep_cho.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong, :ToaNha, :Tang]
        },
        dang_ky_thi: {
          only: [:DangKyThiID, :SoBaoDanh],
          include: {
            sinh_vien: {
              only: [:SinhVienID, :MaSinhVien, :HoTen, :Lop]
            }
          }
        }
      }
    )
  end

  def create
    phan_phong = PhanPhong.find_by!(DangKyThiID: xep_cho_params[:DangKyThiID])

    record = XepCho.new(xep_cho_params)
    record.KyThiID = phan_phong.KyThiID
    record.PhongThiID = phan_phong.PhongThiID

    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Room assignment not found for this registration." }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Duplicate seat or this registration already has a seat." }, status: :conflict
  rescue ActiveRecord::InvalidForeignKey => e
    render json: { error: e.message }, status: :conflict
  end

  def destroy
    @xep_cho.destroy
    render json: { message: "Deleted successfully." }
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete this seat assignment because it is being used." }, status: :conflict
  end

  private

  def set_xep_cho
    @xep_cho = XepCho.find(params[:id])
  end

  def xep_cho_params
    params.require(:xep_cho).permit(
      :DangKyThiID,
      :SoCho,
      :Hang,
      :Cot
    )
  end
end