class Api::V1::PhanPhongController < ApplicationController
  before_action :set_phan_phong, only: [:show, :destroy]

  def index
    records = PhanPhong
              .includes(:dang_ky_thi, :ky_thi, :phong_thi)
              .order(PhanPhongID: :asc)

    render json: records.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong, :ToaNha, :Tang, :SucChua]
        },
        dang_ky_thi: {
          only: [:DangKyThiID, :SoBaoDanh, :TrangThaiDangKy],
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
    render json: @phan_phong.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong, :ToaNha, :Tang, :SucChua]
        },
        dang_ky_thi: {
          only: [:DangKyThiID, :SoBaoDanh, :TrangThaiDangKy],
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
    dang_ky_thi = DangKyThi.find(phan_phong_params[:DangKyThiID])

    record = PhanPhong.new(phan_phong_params)
    record.KyThiID = dang_ky_thi.KyThiID

    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Registration or room not found." }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "This registration has already been assigned to a room." }, status: :conflict
  rescue ActiveRecord::InvalidForeignKey => e
    render json: { error: e.message }, status: :conflict
  end

  def destroy
    @phan_phong.destroy
    render json: { message: "Deleted successfully." }
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete because this room assignment is already used in seating or attendance." }, status: :conflict
  end

  private

  def set_phan_phong
    @phan_phong = PhanPhong.find(params[:id])
  end

  def phan_phong_params
    params.require(:phan_phong).permit(
      :DangKyThiID,
      :PhongThiID,
      :NguoiPhanID
    )
  end
end