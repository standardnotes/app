#!/bin/sh
set -e

case "$1" in
  'start' )
    echo "Prestart Step 1/1 - Removing server lock"
    rm -f /app/tmp/pids/server.pid
    echo "Starting Server..."
    bundle exec rails s -b 0.0.0.0
    ;;

   * )
    echo "Unknown command"
    ;;
esac

exec "$@"
