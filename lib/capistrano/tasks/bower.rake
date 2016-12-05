namespace :bower do
  desc "Install bower packages"
  task :install do
    on roles(:web) do
      within "#{release_path}" do
        with rails_env: fetch(:rails_env) do
          execute :rake, "bower:install CI=true"
        end
      end
    end
  end
end
