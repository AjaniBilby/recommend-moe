#!/usr/bin/env bash

# Started by /etc/systemd/system/skyzer-erp.service
# See docs/setup/deployment.md

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

deno serve -A --env-file server.production.ts