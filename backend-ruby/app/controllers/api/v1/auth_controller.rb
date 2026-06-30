class Api::V1::AuthController < ApplicationController
  def login
    identifier = params[:identifier].presence || params[:email]
    password = params[:password].to_s
    user = NguoiDung.includes(:vai_tro, :sinh_vien).find_by("LOWER(Email) = ?", identifier.to_s.downcase)

    unless user && user.TrangThai && password_matches?(user, password)
      render json: { error: "Email or password is incorrect." }, status: :unauthorized
      return
    end

    render json: session_payload(user, "ruby-auth"), status: :ok
  end

  def signup
    role_id = (params[:VaiTroID] || 4).to_i
    code = params[:MaDinhDanh].presence || params[:MaSinhVien].presence || next_code(role_id)
    user = NguoiDung.new(
      Email: params[:Email].to_s.strip.downcase,
      HoTen: params[:HoTen].presence || params[:Email],
      MatKhauHash: normalize_password(params[:MatKhau]),
      VaiTroID: role_id,
      TrangThai: true
    )

    if user.save
      sync_student_code(user, code)
      render json: session_payload(user.reload, "ruby-auth-signup").merge(generatedCode: code), status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique
    render json: { error: "Email or generated code already exists." }, status: :conflict
  end

  private

  def password_matches?(user, password)
    [ user.MatKhauHash, user.MatKhauHash.to_s.sub(/^hashed_/, "") ].include?(password)
  end

  def normalize_password(value)
    text = value.to_s.strip
    text.start_with?("hashed_") ? text : "hashed_#{text}"
  end

  def next_code(role_id)
    prefix = role_id == 2 ? "CBDT" : role_id == 3 ? "CBKT" : "SV"
    existing = SinhVien.where("MaSinhVien LIKE ?", "#{prefix}%").pluck(:MaSinhVien)
    number = existing.map { |code| code.to_s.delete("^0-9").to_i }.max.to_i + 1
    "#{prefix}#{number.to_s.rjust(3, "0")}"
  end

  def sync_student_code(user, code)
    return unless user.VaiTroID.to_i == 4 && code.present?

    student = user.sinh_vien || SinhVien.find_or_initialize_by(MaSinhVien: code)
    student.NguoiDungID = user.NguoiDungID
    student.MaSinhVien = code
    student.HoTen = user.HoTen
    student.Email = user.Email
    student.TrangThai = true
    student.save!
  end

  def session_payload(user, source)
    {
      token: "ruby-#{user.NguoiDungID}-#{user.vai_tro&.TenVaiTro}",
      authSource: source,
      user: {
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
    }
  end
end
