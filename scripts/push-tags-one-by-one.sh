#!/bin/bash
# source: https://github.com/lerna/lerna/issues/2218#issuecomment-771876933
# https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows
# > "Note: An event will not be created when you create more than three tags at once."
# GitHub workflows will not run if a commit includes more than 3 tags at once. This
# fix pushes tags up one by one.

# get all tags on this commit
TAGS=$(git tag --points-at HEAD | cat)

# only push tags one by one if there are more than 3
if (($(echo "$TAGS"| wc -l) > 3))
then
  echo "Pushing tags one by one to avoid GitHub webhook limit of 3"
  echo "$TAGS" | while read line ; do git push origin --no-follow-tags $line; done
fi