#!/bin/sh
set -e

COMMAND=$1 && shift 1

case "$COMMAND" in
  'start' )
    echo "Prestart Step 1/1 - Removing server lock"
    rm -f /app/packages/web-server/tmp/pids/server.pid
    echo "Starting Server..."
    yarn start:web
    ;;

  'start-local' )
    echo "Prestart Step 1/4 - Removing server lock"
    rm -f /app/packages/web-server/tmp/pids/server.pid
    echo "Prestart Step 2/4 - Cleaning assets"
    yarn clean
    echo "Prestart Step 3/4 - Installing dependencies"
    yarn install --pure-lockfile
    echo "Prestart Step 4/4 - Building"
    yarn build
    echo "Starting Server..."
    yarn start:web
    ;;

   * )
    echo "Unknown command"
    ;;
esac

exec "$@"
