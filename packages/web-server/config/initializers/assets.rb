# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.1'

Rails.application.config.assets.paths << Rails.root.join('..', 'web', 'dist')

Rails.application.config.assets.precompile += ['app.js', 'app.css', 'ionicons.eot', 'ionicons.ttf', 'ionicons.woff']