# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

Rails.application.config.assets.paths << Rails.root.join('vendor', 'assets')
Rails.application.config.assets.paths << Rails.root.join('dist', 'javascripts')
Rails.application.config.assets.paths << Rails.root.join('dist', 'stylesheets')
Rails.application.config.assets.paths << Rails.root.join('dist', 'assets')

Rails.application.config.assets.precompile << /\.(?:svg|eot|woff|ttf)\z/

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w( app.css compiled.min.js compiled.js )

# zip library
Rails.application.config.assets.precompile += %w( zip/zip.js zip/z-worker.js zip/inflate.js zip/deflate.js )
