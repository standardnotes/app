#!/bin/sh
set -e

COMMAND=$1 && shift 1

case "$COMMAND" in
  'start-web' )
    echo "Starting Test Server..."
    yarn start:test-server
    ;;

  * )
    echo "Unknown command"
    ;;
esac

exec "$@"
