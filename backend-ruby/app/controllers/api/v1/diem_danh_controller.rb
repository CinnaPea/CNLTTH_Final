class Api::V1::DiemDanhController < ApplicationController
  before_action :set_diem_danh, only: [:show, :update]

  VALID_STATUSES = %w[present absent late excused].freeze

  def index
    records = DiemDanh
              .includes(:dang_ky_thi, :ky_thi, :phong_thi)
              .order(DiemDanhID: :asc)

    render json: records.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong]
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
    render json: @diem_danh.as_json(
      include: {
        ky_thi: {
          only: [:KyThiID, :MaKyThi, :TenKyThi, :TrangThai]
        },
        phong_thi: {
          only: [:PhongThiID, :MaPhong, :TenPhong]
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
    phan_phong = PhanPhong.find_by!(DangKyThiID: diem_danh_params[:DangKyThiID])

    status = diem_danh_params[:TrangThai] || "absent"

    unless VALID_STATUSES.include?(status)
      return render json: { error: "Invalid attendance status." }, status: :unprocessable_entity
    end

    record = DiemDanh.new(diem_danh_params)
    record.KyThiID = phan_phong.KyThiID
    record.PhongThiID = phan_phong.PhongThiID
    record.TrangThai = status
    record.ThoiGianCheckIn ||= Time.current if %w[present late].include?(status)

    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Room assignment not found for this registration." }, status: :not_found
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Attendance already exists for this registration." }, status: :conflict
  rescue ActiveRecord::InvalidForeignKey => e
    render json: { error: e.message }, status: :conflict
  end

  def update
    status = diem_danh_params[:TrangThai]

    if status.present? && !VALID_STATUSES.include?(status)
      return render json: { error: "Invalid attendance status." }, status: :unprocessable_entity
    end

    attrs = diem_danh_params.to_h

    if %w[present late].include?(status) && @diem_danh.ThoiGianCheckIn.blank?
      attrs[:ThoiGianCheckIn] = Time.current
    end

    if %w[absent excused].include?(status)
      attrs[:ThoiGianCheckIn] = nil
    end

    if @diem_danh.update(attrs)
      render json: @diem_danh
    else
      render json: { errors: @diem_danh.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_diem_danh
    @diem_danh = DiemDanh.find(params[:id])
  end

  def diem_danh_params
    params.require(:diem_danh).permit(
      :DangKyThiID,
      :TrangThai,
      :ThoiGianCheckIn,
      :NguoiGhiNhanID,
      :GhiChu
    )
  end
end