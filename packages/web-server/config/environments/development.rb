Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # config.assets.js_compressor = Uglifier.new(mangle: false)\

  # config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false
  config.reload_classes_only_on_change = true

  # Do not eager load code on boot.
  config.eager_load = false

  MAX_LOG_MEGABYTES = 50
  config.logger = ActiveSupport::Logger.new(config.paths['log'].first, 1, MAX_LOG_MEGABYTES * 1024 * 1024)

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    config.logger = ActiveSupport::Logger.new(STDOUT)
  end

  config.colorize_logging = false
  config.logger.formatter = StandardNotesFormatter.new

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  config.public_file_server.enabled = true

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  # config.active_record.migration_error = :page_load

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Asset digests allow you to set far-future HTTP expiration dates on all assets,
  # yet still be able to expire them through the digest params.
  config.assets.digest = true

  # Adds additional error checking when serving assets at runtime.
  # Checks for improperly declared sprockets dependencies.
  # Raises helpful error messages.
  config.assets.raise_runtime_errors = true

  config.assets.logger = false
  config.assets.quiet = true

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = { :address => "localhost", :port => 1025 }

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true
end
