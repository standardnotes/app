Rails.application.configure do
  config.lograge.enabled = true

  # Generate log in JSON
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.ignore_actions = ['HealthCheckController#index']
  config.lograge.custom_options = lambda do |event|
    correlation = Datadog.tracer.active_correlation
    {
      dd: {
        trace_id: correlation.trace_id.to_s,
        span_id: correlation.span_id.to_s,
        env: correlation.env.to_s,
        service: correlation.service.to_s,
        version: correlation.version.to_s
      },
      ddsource: ['ruby'],
      time: event.time,
      params: event.payload[:params],
      level: event.payload[:level]
    }
  end
end
