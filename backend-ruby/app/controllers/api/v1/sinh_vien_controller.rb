class Api::V1::SinhVienController < ApplicationController
  before_action :set_sinh_vien, only: [:show, :update, :destroy]

  def index
    records = SinhVien.order(SinhVienID: :asc)
    render json: records, status: :ok
  end

  def show
    render json: @sinh_vien, status: :ok
  end

  def create
    record = SinhVien.new(sinh_vien_params)
    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @sinh_vien.update(sinh_vien_params)
      render json: @sinh_vien, status: :ok
    else
      render json: { errors: @sinh_vien.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @sinh_vien.destroy
    render json: { message: "Deleted student with ID #{@sinh_vien.SinhVienID}." }, status: :ok
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete student with ID #{@sinh_vien.SinhVienID} because the student has exam registrations." }, status: :conflict
  end

  private
  def set_sinh_vien
    @sinh_vien = SinhVien.find_by(SinhVienID: params[:id])
    unless @sinh_vien
      render json: { error: "Student with ID #{params[:id]} was not found." }, status: :not_found
    end
  end

  def sinh_vien_params
    params.require(:sinh_vien).permit(:MaSinhVien, :HoTen, :Lop, :Email, :DienThoai, :TrangThai, :NguoiDungID)
  end
end
