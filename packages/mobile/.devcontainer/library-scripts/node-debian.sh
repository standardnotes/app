#!/bin/bash
#-------------------------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See https://go.microsoft.com/fwlink/?linkid=2090316 for license information.
#-------------------------------------------------------------------------------------------------------------

# Syntax: ./node-debian.sh <directory to install nvm> <node version to install (use "none" to skip)> <non-root user>

export NVM_DIR=${1:-"/usr/local/share/nvm"}
export NODE_VERSION=${2:-"lts/*"}
USERNAME=${3:-"vscode"}

set -e

if [ "$(id -u)" -ne 0 ]; then
    echo -e 'Script must be run a root. Use sudo, su, or add "USER root" to\nyour Dockerfile before running this script.'
    exit 1
fi

# Ensure apt is in non-interactive to avoid prompts
export DEBIAN_FRONTEND=noninteractive

# Install curl, apt-get dependencies if missing
if ! type curl > /dev/null 2>&1; then
    if [ ! -d "/var/lib/apt/lists" ] || [ "$(ls /var/lib/apt/lists/ | wc -l)" = "0" ]; then
        apt-get update
    fi
    apt-get -y install --no-install-recommends apt-transport-https ca-certificates curl gnupg2
fi

# Treat a user name of "none" as root
if [ "${USERNAME}" = "none" ]; then
    USERNAME=root
fi

if [ "${NODE_VERSION}" = "none" ]; then
    export NODE_VERSION=
fi

# Install yarn
if type yarn > /dev/null 2>&1; then
    echo "Yarn already installed."
else
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - 2>/dev/null
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
    apt-get update
    apt-get -y install --no-install-recommends yarn
fi

# Install the specified node version if NVM directory already exists, then exit
if [ -d "${NVM_DIR}" ]; then
    echo "NVM already installed."
    if [ "${NODE_VERSION}" != "" ]; then
       suIf "nvm install ${NODE_VERSION}"
    fi
    exit 0
fi

mkdir -p ${NVM_DIR}

# Set up non-root user if applicable
if [ "${USERNAME}" != "root" ] && id -u $USERNAME > /dev/null 2>&1; then
    tee -a /home/${USERNAME}/.bashrc /home/${USERNAME}/.zshrc >> /root/.zshrc \
<< EOF
EOF
    
    # Add NVM init and add code to update NVM ownership if UID/GID changes
    tee -a /root/.bashrc /root/.zshrc /home/${USERNAME}/.bashrc >> /home/${USERNAME}/.zshrc \
<<EOF
            export NVM_DIR="${NVM_DIR}"
            [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"
            [ -s "\$NVM_DIR/bash_completion" ] && . "\$NVM_DIR/bash_completion"
            if [ "\$(stat -c '%U' \$NVM_DIR)" != "${USERNAME}" ]; then
                sudo chown -R ${USERNAME}:root \$NVM_DIR
            fi
EOF
    
    # Update ownership
    chown ${USERNAME} ${NVM_DIR} /home/${USERNAME}/.bashrc /home/${USERNAME}/.zshrc
fi

# Function to su if user exists and is not root
suIf() {
    if [ "${USERNAME}" != "root" ] && id -u ${USERNAME} > /dev/null 2>&1; then
        su ${USERNAME} -c "$@"
    else
        "$@"
    fi

}

# Run NVM installer as non-root if needed
suIf "$(cat \
<< EOF
        curl -so- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash 
        if [ "${NODE_VERSION}" != "" ]; then
            source $NVM_DIR/nvm.sh
            nvm alias default ${NODE_VERSION}
        fi
EOF
)" 2>&1

