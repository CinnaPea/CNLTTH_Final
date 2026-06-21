class Api::V1::KyThiController < ApplicationController
  before_action :set_ky_thi, only: [:show, :update, :destroy, :publish, :close]

  def index
    records = KyThi.includes(:mon_thi).order(KyThiID: :desc)
    render json: records.as_json(include: {
      mon_thi: { only: [:MonThiID, :MaMon, :TenMon] }
    }), status: :ok
  end

  def show
    render json: @ky_thi.as_json(include: {
      mon_thi: { only: [:MonThiID, :MaMon, :TenMon] }
    }), status: :ok
  end

  def create
    record = KyThi.new(ky_thi_params)
    record.TrangThai ||= 'draft'  
    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @ky_thi.update(ky_thi_params)
      render json: @ky_thi, status: :ok
    else
      render json: { errors: @ky_thi.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @ky_thi.destroy
    render json: { message: "Deleted exam with ID #{@ky_thi.KyThiID}." }, status: :ok
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete exam with ID #{@ky_thi.KyThiID} because it is used by exam operations." }, status: :conflict
  end

  def publish
    if @ky_thi.TrangThai != "draft"
      return render json: {
        error: "Only draft exams can be published.",
        current_status: @ky_thi.TrangThai
      }, status: :unprocessable_entity
    end

    @ky_thi.update!(TrangThai: "published")
    render json: @ky_thi
  end

  def close
    unless @ky_thi.TrangThai == "attendance_open"
      return render json: {
        error: "Only attendance-open exams can be closed.",
        current_status: @ky_thi.TrangThai
      }, status: :unprocessable_entity
    end

    @ky_thi.update!(TrangThai: "closed")
    render json: @ky_thi
  end

  private
  def set_ky_thi
    @ky_thi = KyThi.find_by(KyThiID: params[:id])
    unless @ky_thi
      render json: { error: "Exam with ID #{params[:id]} was not found." }, status: :not_found
    end
  end

  def ky_thi_params
    params.require(:ky_thi).permit(:MaKyThi, :TenKyThi, :MonThiID, :NgayThi, :GioBatDau, :GioKetThuc, :TrangThai, :MoTa, :ThoiHanDangKyDen)
  end
end
