require_relative 'boot'
# require 'rails/all'

require "active_model/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "active_job/railtie" # Only for Rails >= 4.2
require "action_cable/engine" # Only for Rails >= 5.0
require "sprockets/railtie"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Web
  class Application < Rails::Application
    # Cross-Origin Resource Sharing (CORS) for Rack compatible web applications.
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*', :headers => :any, :methods => [:get, :post, :put, :patch, :delete, :options], :expose => ['Access-Token', 'Client', 'UID']
      end
    end

    # config.action_dispatch.default_headers = {
    #   'X-Frame-Options' => 'ALLOWALL'
    # }

    SecureHeaders::Configuration.default do |config|
      # Handled by server
      config.x_frame_options = SecureHeaders::OPT_OUT
      config.x_content_type_options = SecureHeaders::OPT_OUT
      config.x_xss_protection = SecureHeaders::OPT_OUT
      config.hsts = SecureHeaders::OPT_OUT

      config.csp = {
        # "meta" values. these will shape the header, but the values are not included in the header.
         preserve_schemes: true, # default: false. Schemes are removed from host sources to save bytes and discourage mixed content.
         # directive values: these values will directly translate into source directives
         default_src: %w(https: 'self'),
         base_uri: %w('self'),
         block_all_mixed_content: false, # see http://www.w3.org/TR/mixed-content/
         child_src: ["*", "blob:"],
         frame_src: ["*", "blob:"],
         connect_src: ["*", 'data:'],
         font_src: %w(* 'self'),
         form_action: %w('self'),
         frame_ancestors: ["*", "*.standardnotes.com", "*.standardnotes.org"],
         img_src: %w('self' * data:),
         manifest_src: %w('self'),
         media_src: %w('self'),
         object_src: %w('self'),
         plugin_types: %w(),
         script_src: %w('self' 'unsafe-inline' 'unsafe-eval'),
         style_src: %w(* 'unsafe-inline'),
         upgrade_insecure_requests: false, # see https://www.w3.org/TR/upgrade-insecure-requests/
      }
    end

    # config.middleware.use Rack::Deflater

    config.middleware.insert_before(Rack::Sendfile, Rack::Deflater)

    # Disable auto creation of additional resources with "rails generate"
    config.generators do |g|
      g.test_framework false
      g.view_specs false
      g.helper_specs false
      g.stylesheets = false
      g.javascripts = false
      g.helper = false
    end

    config.action_mailer.default_url_options = { host: ENV['APP_HOST'] }

    # SMTP settings
    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      :address => ENV['SMTP_HOST'],
      :port => ENV['SMTP_PORT'],
      :domain => ENV['SMTP_DOMAIN'],
      :user_name => ENV['SMTP_USERNAME'],
      :password => ENV['SMTP_PASSWORD'],
      :authentication => 'login',
      :enable_starttls_auto => true # detects and uses STARTTLS
    }

  end
end
