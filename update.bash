#!/usr/bin/env bash

echo "Fetching changes"
git fetch origin production --no-tags

if [ -z "$(git diff origin/production)" ]; then
	echo "No changes to pull"
	exit 0
fi

echo "Pulling changes"
git pull origin production

bash ./upgrade.bash