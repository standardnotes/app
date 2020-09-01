#!/bin/sh
set -e

case "$1" in
  'start' )
    echo "Prestart Step 1/1 - Removing server lock"
    rm -f /app/tmp/pids/server.pid
    echo "Starting Server..."
    exec bundle exec rails s -b 0.0.0.0
    ;;

  'start-local' )
    echo "Prestart Step 1/5 - Removing server lock"
    rm -f /app/tmp/pids/server.pid
    echo "Prestart Step 2/5 - Cleaning assets"
    bundle exec rails assets:clobber
    echo "Prestart Step 3/5 - Installing dependencies"
    npm install
    echo "Prestart Step 4/5 - Creating Webpack bundle"
    npm run bundle
    echo "Prestart Step 5/5 - Compiling assets"
    bundle exec rails assets:precompile
    echo "Starting Server..."
    bundle exec rails s -b 0.0.0.0
    ;;

   * )
    echo "Unknown command"
    ;;
esac

exec "$@"
