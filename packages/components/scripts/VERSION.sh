#!/bin/bash

echo 'Building components from' $(pwd)

yarn clean && yarn build

echo "Packaging component assets and zips..."

node scripts/package.mjs
git add dist
(git commit -m 'chore(release): components') || true