class ApplicationController < ActionController::Base

  protect_from_forgery with: :null_session
  after_action :set_csrf_cookie

  after_action :allow_iframe

  layout :false

  def frontend
    set_app_domain
  end

  rescue_from ActionView::MissingTemplate do |exception|
  end

  protected

  def allow_iframe
    response.headers.except! 'X-Frame-Options'
  end

  def set_app_domain
    @appDomain = request.domain
    @appDomain << ':' + request.port.to_s unless request.port.blank?
  end
  def set_csrf_cookie
    cookies['XSRF-TOKEN'] = form_authenticity_token if protect_against_forgery?
  end

end
