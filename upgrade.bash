#!/usr/bin/env bash

# Check if NVM's Node.js binary directory is in the PATH
export NVM_DIR="$HOME/.nvm"
if [[ ":$PATH:" != *":$NVM_DIR/versions/node/"* ]]; then
	# Load nvm
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

	# Load nvm bash_completion
	[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

	# Add NVM's Node.js binary directory to PATH
	export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"
fi

echo "Updating dependencies"
deno install

echo "Building static assets"
deno task build

echo ""
echo "Migrate Database"
npx prisma migrate deploy

echo ""
echo "Building DB Connector"
deno task prisma generate --sql

git rev-parse HEAD > "COMMIT"

echo ""
echo "Restarting Server"
sudo systemctl restart recommend-moe.service

echo ""
echo "Done!"
