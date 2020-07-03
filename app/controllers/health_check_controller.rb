class HealthCheckController < ApplicationController
  def index
    render :plain => "OK"
  end
end
