class Api::V1::DangKyThiController < ApplicationController
  before_action :set_dang_ky_thi, only: [:show, :update, :destroy, :cancel]

  def index
    records = DangKyThi
              .includes(:ky_thi, :sinh_vien)
              .order(DangKyThiID: :asc)

    render json: records.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        sinh_vien: {
          only: [:SinhVienID, :MaSinhVien, :HoTen, :Lop]
        }
      }
    )
  end

  def show
    render json: @dang_ky_thi.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        sinh_vien: {
          only: [:SinhVienID, :MaSinhVien, :HoTen, :Lop]
        }
      }
    )
  end

  def create
    ky_thi = KyThi.find(dang_ky_thi_params[:KyThiID])

    unless ky_thi.TrangThai == "published"
      return render json: {
        error: "Only published exams can accept registrations."
      }, status: :unprocessable_entity
    end

    record = DangKyThi.new(dang_ky_thi_params)
    record.TrangThaiDangKy ||= "registered"
    record.SoBaoDanh ||= generate_so_bao_danh(record.KyThiID)

    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exam or student not found." }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "This student is already registered for this exam or the exam number already exists." }, status: :conflict
  end

  def update
    if @dang_ky_thi.update(dang_ky_thi_params)
      render json: @dang_ky_thi
    else
      render json: { errors: @dang_ky_thi.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Duplicate registration or exam number." }, status: :conflict
  end

  def destroy
    @dang_ky_thi.destroy
    render json: { message: "Deleted successfully." }
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete because this registration is already used in room assignment, seating, or attendance." }, status: :conflict
  end

  def cancel
    if @dang_ky_thi.ky_thi.TrangThai != "published"
      return render json: {
        error: "Registration can only be cancelled before room assignment."
      }, status: :unprocessable_entity
    end

    @dang_ky_thi.update!(TrangThaiDangKy: "cancelled")
    render json: @dang_ky_thi
  end

  private

  def set_dang_ky_thi
    @dang_ky_thi = DangKyThi.find(params[:id])
  end

  def dang_ky_thi_params
    params.require(:dang_ky_thi).permit(
      :KyThiID,
      :SinhVienID,
      :SoBaoDanh,
      :TrangThaiDangKy
    )
  end

  def generate_so_bao_danh(ky_thi_id)
    next_number = DangKyThi.where(KyThiID: ky_thi_id).count + 1
    "SBD#{ky_thi_id.to_s.rjust(3, '0')}#{next_number.to_s.rjust(3, '0')}"
  end
end