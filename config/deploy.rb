CAP_CONFIG = YAML.load_file("config/cap.yml")
# config valid only for current version of Capistrano
lock '3.6.1'

set :application, 'neeto'
set :repo_url, CAP_CONFIG["default"]["repo_url"]

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default deploy_to directory is /var/www/my_app_name
# set :deploy_to, '/var/www/my_app_name'

# Default value for :scm is :git
set :scm, :git

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: 'log/capistrano.log', color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, fetch(:linked_files, []).push('config/database.yml', 'config/secrets.yml')
set :linked_files, fetch(:linked_files, []).push('.env')

# Default value for linked_dirs is []
# set :linked_dirs, fetch(:linked_dirs, []).push('log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'public/system')
set :linked_dirs, fetch(:linked_dirs, []).push('log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'public/system', 'public/uploads')

# Default value for keep_releases is 5
# set :keep_releases, 5

set :rvm_ruby_version, '2.3.0'

namespace :deploy do

  task :npm_install do
    on roles(:app) do
      within release_path do
        # string commands dont work, have to use special *%w syntax
        execute *%w[ npm install ]
        execute *%w[ grunt ]
      end
    end
  end

  after :restart, :clear_cache do
    on roles(:web), in: :groups, limit: 3, wait: 5 do
      # Here we can do anything such as:
      within release_path do

      end
    end
  end
end

before 'deploy:compile_assets', 'bower:install'
after 'bower:install', 'deploy:npm_install'

set :ssh_options, {
  keys: %W( #{CAP_CONFIG['default']['key_path']} ),
  forward_agent: false,
  auth_methods: %w(publickey)
}
