class Api::V1::NguoiDungController < ApplicationController
  before_action :set_nguoi_dung, only: [:show, :update, :destroy]

  def index
    records = NguoiDung.includes(:vai_tro, :sinh_vien).order(NguoiDungID: :asc)
    render json: records.map { |record| serialize_user(record) }, status: :ok
  end

  def show
    render json: serialize_user(@nguoi_dung), status: :ok
  end

  def create
    record = NguoiDung.new(nguoi_dung_params.except(:MatKhau, :MaSinhVien, :MaDinhDanh))
    record.MatKhauHash = normalize_password(params.dig(:nguoi_dung, :MatKhau) || record.MatKhauHash)
    record.TrangThai = truthy_status(params.dig(:nguoi_dung, :TrangThai))

    if record.save
      sync_student_code(record, params.dig(:nguoi_dung, :MaSinhVien) || params.dig(:nguoi_dung, :MaDinhDanh))
      render json: serialize_user(record.reload), status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Email already exists." }, status: :conflict
  end

  def update
    payload = nguoi_dung_params
    attrs = payload.except(:MatKhau, :MaSinhVien, :MaDinhDanh)
    attrs[:MatKhauHash] = normalize_password(payload[:MatKhau]) if payload[:MatKhau].present?
    attrs[:TrangThai] = truthy_status(payload[:TrangThai]) if payload.key?(:TrangThai)
    attrs[:CapNhatLuc] = Time.current

    if @nguoi_dung.update(attrs)
      sync_student_code(@nguoi_dung, payload[:MaSinhVien] || payload[:MaDinhDanh])
      render json: serialize_user(@nguoi_dung.reload), status: :ok
    else
      render json: { errors: @nguoi_dung.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Email already exists." }, status: :conflict
  end

  def destroy
    @nguoi_dung.destroy
    render json: { message: "Deleted user with ID #{@nguoi_dung.NguoiDungID}." }, status: :ok
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete user with ID #{@nguoi_dung.NguoiDungID} because the user is referenced by exam data." }, status: :conflict
  end

  private

  def set_nguoi_dung
    @nguoi_dung = NguoiDung.includes(:vai_tro, :sinh_vien).find_by(NguoiDungID: params[:id])
    unless @nguoi_dung
      render json: { error: "User with ID #{params[:id]} was not found." }, status: :not_found
    end
  end

  def nguoi_dung_params
    params.require(:nguoi_dung).permit(:Email, :HoTen, :MatKhau, :MatKhauHash, :VaiTroID, :TrangThai, :MaSinhVien, :MaDinhDanh)
  end

  def normalize_password(value)
    text = value.to_s.strip
    return "" if text.blank?
    text.start_with?("hashed_") ? text : "hashed_#{text}"
  end

  def truthy_status(value)
    return true if value.nil?
    value == true || value.to_s == "1" || value.to_s.downcase == "true"
  end

  def sync_student_code(user, code)
    text = code.to_s.strip
    return unless user.VaiTroID.to_i == 4 && text.present?

    student = user.sinh_vien || SinhVien.find_or_initialize_by(MaSinhVien: text)
    student.NguoiDungID = user.NguoiDungID
    student.MaSinhVien = text
    student.HoTen = user.HoTen
    student.Email = user.Email
    student.TrangThai = user.TrangThai
    student.save!
  end

  def serialize_user(user)
    {
      NguoiDungID: user.NguoiDungID,
      Email: user.Email,
      MatKhauHash: user.MatKhauHash,
      HoTen: user.HoTen,
      VaiTroID: user.VaiTroID,
      TenVaiTro: user.vai_tro&.TenVaiTro,
      TrangThai: user.TrangThai ? 1 : 0,
      MaSinhVien: user.sinh_vien&.MaSinhVien,
      TaoLuc: user.TaoLuc,
      CapNhatLuc: user.CapNhatLuc
    }
  end
end
