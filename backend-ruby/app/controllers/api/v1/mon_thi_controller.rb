class Api::V1::MonThiController < ApplicationController
  before_action :set_mon_thi, only: [:show, :update, :destroy]
  
  def index
    records = MonThi.order(MonThiID: :asc)
    render json: records, status: :ok
  end

  def show 
    render json: @mon_thi, status: :ok
  end 

  def create
    record = MonThi.new(mon_thi_params)
    if record.save
      render json: record, status: :created
    else
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @mon_thi.update(mon_thi_params)
      render json: @mon_thi, status: :ok
    else
      render json: { errors: @mon_thi.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @mon_thi.destroy
    render json: { message: "Deleted subject with ID #{@mon_thi.MonThiID}." }, status: :ok
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: "Cannot delete subject with ID #{@mon_thi.MonThiID} because it is used by other operations." }, status: :conflict
  end

  private
  def set_mon_thi
    @mon_thi = MonThi.find_by(MonThiID: params[:id])
    unless @mon_thi
      render json: { error: "Subject with ID #{params[:id]} was not found." }, status: :not_found
    end
  end

  def mon_thi_params
    params.require(:mon_thi).permit(:MaMon, :TenMon)
  end
end
