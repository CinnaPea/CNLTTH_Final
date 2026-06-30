class Api::V1::HealthController < ApplicationController
  def index
    db_name = ActiveRecord::Base.connection.current_database
    render json: { status: 'ok', backend: 'ruby', database: db_name, message: 'API is healthy' }
  end
end
