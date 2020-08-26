Rails.application.configure do
  config.lograge.enabled = true

  # Generate log in JSON
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.ignore_actions = ['HealthCheckController#index']
  config.lograge.custom_options = lambda do |event|
    {
      :ddsource => ["ruby"],
      :time => event.time,
      :params => event.payload[:params],
      :level => event.payload[:level]
    }
  end
end
