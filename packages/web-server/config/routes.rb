Rails.application.routes.draw do
  get "/healthcheck" => "health_check#index"

  get '*unmatched_route', to: 'application#route_not_found'

  root 'application#app'
end
