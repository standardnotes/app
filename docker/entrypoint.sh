#!/bin/sh
set -e

COMMAND=$1 && shift 1

case "$COMMAND" in
  'start' )
    echo "Prestart Step 1/1 - Removing server lock"
    rm -f /app/tmp/pids/server.pid
    echo "Starting Server..."
    bundle exec rails s -b 0.0.0.0
    ;;

  'start-local' )
    echo "Prestart Step 1/5 - Removing server lock"
    rm -f /app/tmp/pids/server.pid
    echo "Prestart Step 2/5 - Cleaning assets"
    bundle exec rails assets:clobber
    echo "Prestart Step 3/5 - Installing dependencies"
    yarn install --pure-lockfile
    echo "Prestart Step 4/5 - Creating Webpack bundle"
    yarn run bundle
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
