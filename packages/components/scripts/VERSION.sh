#!/bin/bash

echo 'Compiling components from' $(pwd)

yarn components:clean && yarn components:compile

echo "Packaging component assets and zips..."

node scripts/package.mjs
git add dist
(git commit -m 'chore(release): components') || true