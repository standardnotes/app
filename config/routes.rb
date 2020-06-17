Rails.application.routes.draw do
  get "/healthcheck" => "health_check#index"

  root 'application#app'
end
