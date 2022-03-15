# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

Rails.application.config.assets.paths << Rails.root.join('vendor', 'assets')

# Recursively add all files and folders in 'dist'.
Rails.application.config.assets.paths << Rails.root.join('dist')
files = Dir.glob('dist/**/*').map! { |file| file.sub('dist/', '') }
Rails.application.config.assets.precompile += files