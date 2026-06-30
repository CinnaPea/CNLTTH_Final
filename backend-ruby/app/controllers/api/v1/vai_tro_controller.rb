class Api::V1::VaiTroController < ApplicationController
  def index
    render json: VaiTro.order(VaiTroID: :asc), status: :ok
  end
end
