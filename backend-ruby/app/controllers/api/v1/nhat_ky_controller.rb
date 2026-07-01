class Api::V1::NhatKyController < ApplicationController
  before_action :set_current_user

  def index
    return render_unauthorized unless @current_user

    records = NhatKy.includes(nguoi_dung: :vai_tro).order(ThoiGian: :desc)

    if admin?
      records = records.where(NguoiDungID: params[:user_id]) if params[:user_id].present?
    else
      records = records.where(NguoiDungID: @current_user.NguoiDungID)
    end

    render json: records.map { |record| serialize_record(record, include_user: true) }, status: :ok
  end

  def show
    return render_unauthorized unless @current_user

    record = NhatKy.includes(nguoi_dung: :vai_tro).find_by(NhatKyID: params[:id])
    return render json: { error: "Log with ID #{params[:id]} was not found." }, status: :not_found unless record

    unless admin? || record.NguoiDungID == @current_user.NguoiDungID
      return render json: { error: "You are not allowed to view this log." }, status: :forbidden
    end

    render json: serialize_record(record), status: :ok
  end

  private

  def set_current_user
    user_id = request.headers["X-User-Id"].presence
    @current_user = NguoiDung.includes(:vai_tro).find_by(NguoiDungID: user_id, TrangThai: true) if user_id
  end

  def admin?
    @current_user&.vai_tro&.TenVaiTro == "Admin"
  end

  def render_unauthorized
    render json: { error: "Khong xac dinh duoc nguoi dung dang dang nhap." }, status: :unauthorized
  end

  def serialize_record(record, include_user: false)
    user = record.nguoi_dung
    payload = {
      NhatKyID: record.NhatKyID,
      NguoiDungID: record.NguoiDungID,
      HoTen: user&.HoTen,
      VaiTro: user&.vai_tro&.TenVaiTro,
      HanhDong: record.HanhDong,
      LoaiDoiTuong: record.LoaiDoiTuong,
      DoiTuongID: record.DoiTuongID,
      MoTa: record.MoTa,
      ThoiGian: record.ThoiGian
    }

    if include_user
      payload[:NguoiDung] = user && {
        NguoiDungID: user.NguoiDungID,
        HoTen: user.HoTen,
        Email: user.Email,
        TenVaiTro: user.vai_tro&.TenVaiTro
      }
    end

    payload
  end
end
