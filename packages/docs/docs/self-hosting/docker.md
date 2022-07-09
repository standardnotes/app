---
slug: docker
id: docker
title: Self-hosting with Docker
sidebar_label: Docker
description: How to self-host the Standard Notes infrastructure with Docker.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - sync server
  - docker
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

This guide walks you through the process of installing the self-hosted backend of Standard Notes. In this example, we used a server running Ubuntu 20.04, with 2GB RAM and 1 CPU.

Due to mounted volumes, we recommend running the setup as a root user. If you wish to run it as a non-root user, please see Docker's [post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall#manage-docker-as-a-non-root-user).

## Prerequisities

1. Update your `apt` repositories and upgrade any out-of-date packages:

    ```shell
    sudo apt update -y && sudo apt upgrade -y
    ```

2. Install Docker Engine:

    ```shell
    # Remove any old Docker installations.
    sudo apt-get remove docker docker-engine docker.io containerd runc

    # Install dependencies.
    sudo apt install git ca-certificates curl gnupg lsb-release -y

    # Add Docker's GPG key.
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set the Docker repo.
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine.
    sudo apt update -y
    sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
    ```

3. Verify that Docker is installed:

    ```shell
    sudo docker run hello-world
    ```

    This should output something like:

    ```plaintext
    ...

    Unable to find image 'hello-world:latest' locally
    latest: Pulling from library/hello-world
    2db29710123e: Pull complete
    Digest: sha256:13e367d31ae85359f42d637adf6da428f76d75dc9afeb3c21faea0d976f5c651
    Status: Downloaded newer image for hello-world:latest

    Hello from Docker!
    This message shows that your installation appears to be working correctly.

    ...
    ```

4. Verify that Docker Compose is correctly installed:

    ```shell
    docker compose version
    ```

    This should output something like:

    ```plaintext
    Docker Compose version v2.6.0
    ```

5. Enable the `ufw` firewall:

    ```shell
    sudo ufw enable
    ```

    Enter `y` when prompted.

6. Enable SSH connections:

    ```shell
    sudo ufw allow ssh
    ```

    This should output something like:

    ```plaintext
    Skipping adding existing rule
    Skipping adding existing rule (v6)
    ```

7. Allow incoming TPC connections on ports `80` and `443`:

    ```shell
    sudo ufw allow http
    sudo ufw allow https
    ```

8. Check the status of your `ufw` settings:

    ```shell
    ufw status verbose
    ```

    This should output something like:

    ```plaintext
    Status: active
    Logging: on (low)
    Default: deny (incoming), allow (outgoing), deny (routed)
    New profiles: skip

    To                         Action      From
    --                         ------      ----
    22/tcp                     ALLOW IN    Anywhere
    80/tcp                     ALLOW IN    Anywhere
    443/tcp                    ALLOW IN    Anywhere
    22/tcp (v6)                ALLOW IN    Anywhere (v6)
    80/tcp (v6)                ALLOW IN    Anywhere (v6)
    443/tcp (v6)               ALLOW IN    Anywhere (v6)
    ```

9. Configure a domain name (or subdomain) to point to your server's IP address. Consult your domain registration provider for how to configure your domain name.

## Install Standard Notes

1. Clone the `standalone` repo:

    ```shell
    cd ~
    git clone --single-branch --branch main https://github.com/standardnotes/standalone.git
    cd standalone
    ```

1. Initialize default configuration files:

    ```shell
    ./server.sh setup
    ```

    This will output something like:

    ```plaintext
    Initializing default configuration
    Default configuration files created as .env and docker/*.env files. Feel free to modify values if needed.
    ```

1. Generate random values for the necessary environment variables:

    ```shell
    sed -i "s/auth_jwt_secret/$(openssl rand -hex 32)/g" .env
    sed -i "s/secret/$(openssl rand -hex 32)/g" docker/auth.env
    sed -i "s/legacy_jwt_secret/$(openssl rand -hex 32)/g" docker/auth.env
    sed -i "s/secret_key/$(openssl rand -hex 32)/g" docker/auth.env
    sed -i "s/server_key/$(openssl rand -hex 32)/g" docker/auth.env
    ```

    **Note:** If you are running `sed` on macOS or BSD, change instances of `sed -i` to `sed -i ''`.

1. (Optional) Restart the server:

    ```shell
    reboot
    ```

1. (Optional) By default, the syncing server will run on port `3000`. If you have a different service running on that port, you can customize the port on which you want to run the infrastructure by editing the `EXPOSED_PORT` variable in the `.env` file.
1. Once the server has finished rebooting, log back into the server and start the Standard Notes server process:

    ```shell
    cd standalone
    ./server.sh start
    ```

    Docker will start outputting lots of information about the containers it is pulling in and installing. This process took about 8 minutes on a Ubuntu 20.04 server with 2GB RAM and 1 CPU.

1. Once Docker has finished installing, the Standard Notes install script will output:

    ```plaintext
    Infrastructure started. Give it a moment to warm up. If you wish, please run the './server.sh logs' command to see details.
    ```

1. Check the status of your server:

    ```shell
    ./server.sh status
    ```

    This will output something like:

    ```plaintext
    Services State:
    NAME                                  COMMAND                  SERVICE                    STATUS              PORTS
    api-gateway-standalone                "./wait-for.sh auth …"   api-gateway                running             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp
    auth-standalone                       "./wait-for.sh db 33…"   auth                       running
    auth-worker-standalone                "./wait-for.sh db 33…"   auth-worker                running
    cache-standalone                      "docker-entrypoint.s…"   cache                      running             6379/tcp
    db-standalone                         "docker-entrypoint.s…"   db                         running             3306/tcp
    files-standalone                      "./wait-for.sh db 33…"   files                      running             0.0.0.0:3125->3000/tcp, :::3125->3000/tcp
    syncing-server-js-standalone          "./wait-for.sh db 33…"   syncing-server-js          running
    syncing-server-js-worker-standalone   "./wait-for.sh db 33…"   syncing-server-js-worker   running
    ```

    Your Standard Notes server is ready once all the services have a `STATUS` of `Up`. This process took about 11 minutes on a Ubuntu 20.04 server with 2GB RAM and 1 CPU.

1. You should be able now to check that the syncing server is running by checking `http://localhost:3000/healthcheck`. You must do this on the server:

    ```bash
    curl http://localhost:3000/healthcheck
    OK
    ```

    If you changed the `EXPOSED_PORT` variable, check `http://localhost:{EXPOSED_PORT}/healthcheck`.

1. You're done!

## Securing your server

To start using your new server with the Standard Notes app at `app.standardnotes.com,` you have to configure an HTTPS reverse proxy. Head over to [Securing HTTP traffic of your Sync server](./https-support.md) for more information on how to set up a reverse proxy.

## Using your new server

In the account menu, choose `Advanced options` and enter the address of your new server in `Custom sync server`. Then, register for a new account or log in to an existing account and begin using your private new secure Standard Notes server!
