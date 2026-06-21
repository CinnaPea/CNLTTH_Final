class Api::V1::PhongThiController < ApplicationController
  before_action :set_phong_thi, only: [:show, :update, :destroy]

  def index
    records = PhongThi.order(PhongThiID: :asc)
    render json: records, status: :ok
  end

  def show
    render json: @phong_thi, status: :ok
  end

  def create
    record = PhongThi.new(phong_thi_params)
    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @phong_thi.update(phong_thi_params)
      render json: @phong_thi, status: :ok
    else
      render json: { errors: @phong_thi.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @phong_thi.destroy
    render json: { message: "Deleted exam room with ID #{@phong_thi.PhongThiID}." }, status: :ok
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete exam room with ID #{@phong_thi.PhongThiID} because it is used by an exam." }, status: :conflict
  end

  private

  def set_phong_thi
    @phong_thi = PhongThi.find_by(PhongThiID: params[:id])
    unless @phong_thi
      render json: { error: "Exam room with ID #{params[:id]} was not found." }, status: :not_found
    end
  end

  def phong_thi_params
    params.require(:phong_thi).permit(:MaPhong, :TenPhong, :ToaNha, :Tang, :SucChua, :TrangThai, :SoHang, :SoCot)
  end
end
