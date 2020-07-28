class ApplicationController < ActionController::Base

  protect_from_forgery with: :null_session
  after_action :set_csrf_cookie

  after_action :allow_iframe

  layout :false

  def app

  end

  rescue_from ActionView::MissingTemplate do |exception|
  end

  def route_not_found
    render :json => {:error => {:message => "Not found."}}, :status => 404
  end

  protected

  def allow_iframe
    response.headers.except! 'X-Frame-Options'
  end

  def set_csrf_cookie
    cookies['XSRF-TOKEN'] = form_authenticity_token if protect_against_forgery?
  end

  def append_info_to_payload(payload)
    super

    unless payload[:status]
      return
    end

    payload[:level] = 'INFO'
    if payload[:status] >= 500
      payload[:level] = 'ERROR'
    elsif payload[:status] >= 400
      payload[:level] = 'WARN'
    end
  end

end
