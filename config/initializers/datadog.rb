if ENV['DATADOG_ENABLED'] == 'true'
  Datadog.configure do |c|
    # This will activate auto-instrumentation for Rails
    c.use :rails
  end
end
