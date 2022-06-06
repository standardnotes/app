Rails.application.configure do
  config.lograge.enabled = true

  # Generate log in JSON
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.ignore_actions = ['HealthCheckController#index']
end
