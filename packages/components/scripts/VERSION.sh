#!/bin/bash

echo 'Building components from' $(pwd)

# Exit immediately after an error in any command
set -e

yarn clean && yarn build:components

echo "Packaging component assets and zips..."

node scripts/package.mjs
git add dist
(git commit -m 'chore(release): components') || true