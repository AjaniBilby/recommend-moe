# Production: Web Server

## Initializing

SSH into the new server, or use the `DigitalOcean Console`

Install updates and required software
```bash
sudo apt update
sudo apt upgrade
sudo apt install nginx
sudo apt install openssl
```

## Set Region Settings
```bash
sudo locale-gen en_AU.UTF-8
```
`/etc/default/locale`
```
LANG="en_AU.UTF-8"
LANGUAGE="en_AU:en"
```
```bash
sudo dpkg-reconfigure locales
sudo update-locale LANG=en_AU.UTF-8
source /etc/default/locale
```

```bash
sudo timedatectl set-timezone Australia/Sydney
timedatectl
```

## Make new user

```bash
sudo adduser --disabled-password github
sudo mkdir -p /home/github/.ssh
sudo chown github:github /home/github/.ssh
sudo chmod 700 /home/github/.ssh
sudo touch /home/github/.ssh/authorized_keys
sudo chown github:github /home/github/.ssh/authorized_keys
sudo chmod 600 /home/github/.ssh/authorized_keys
```

`sudo visudo`
```
github ALL=(ALL) NOPASSWD: /bin/systemctl restart recommend-moe.service
```

## NodeJS Install

```bash
sudo -u github -i
```

Install node version manager
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
```

Install NodeJS
```bash
nvm install v22.18.0
```

## Github Repo Reading

```bash
sudo -u github -i
```

First you will need to generate the SSH keys that Github will use to authenticate the server, but also login to trigger updates.
```bash
cd /home/github/.ssh/
ssh-keygen -t ed25519 -C ssh@github.com
cat id_ed25519.pub >> authorized_keys
sudo chown github:github id_ed25519
sudo chown github:github id_ed25519.pub
```

Then on the repository go the `Settings > Deploy Keys` and add the public key as a [new deploy key](https://github.com/ajanibilby/recommend-moe/settings/keys) to give the droplet access to the private Github repository without having to tie it's access to any developers login.
```bash
cat id_ed25519.pub
```

Verify the SSH key saved correctly:
```bash
ssh -T git@github.com
```

Copy the value of `id_ed25519` to the github repo's [action secret](https://github.com/ajanibilby/recommend-moe/settings/secrets/actions) `SSH_KEY`  
Add the deployment key of `id_ed25519.pub`, make sure to also add `SSH_HOST` and `SSH_USERNAME` (`github`) secrets if they're not already present

## Cloning the Repo

```bash
cd /srv
git clone git@github.com:ajanibilby/recommend-moe.git recommend-moe
cd /srv/recommend-moe
git checkout production
sudo chown -R github:github /srv/recommend-moe
```

## Nginx Configuration

Nginx is used for routing (allowing multiple websites on one server based on domain name), rate-limiting and encryption

Installation and port-forwarding
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
sudo ufw allow 'Nginx HTTP'
sudo ufw allow 'Nginx HTTPS'
```

Hide the server information from headers and errors
`/etc/nginx/nginx.conf`
```conf
http {
  # ... other configurations ...
  
  server_tokens off;

  # ... other configurations ...
}
```

### SSL Certificate

Or create self-signed certificates
```bash
openssl req -x509 -newkey rsa:4096 -keyout self-signed.key -out self-signed.crt -days 365 -nodes
sudo mkdir -p /etc/nginx/ssl
sudo mv self-signed.crt /etc/nginx/ssl/
sudo mv self-signed.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/self-signed.key
sudo chown root:root /etc/nginx/ssl/self-signed.key
```

### Create Nginx Site
Create the config for recommend-moe server
`/etc/nginx/sites-available/recommend-moe`
```conf
server {
  listen 80;
  server_name recommend.moe;
  client_max_body_size 0; # No limit on upload size through Nginx

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://0.0.0.0:8000;
    proxy_redirect off;

    proxy_request_buffering off;
    proxy_buffering off;
  }
}

server {
  listen 443 ssl;
  server_name skybase.link;
  client_max_body_size 0; # No limit on upload size through Nginx
  include snippets/error_pages.conf;

  ssl_certificate /etc/nginx/ssl/self-signed.crt;
  ssl_certificate_key  /etc/nginx/ssl/self-signed.key;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:3000;
    proxy_redirect off;

    proxy_request_buffering off;
    proxy_buffering off;
  }
}
```

Enable the new site
```bash
sudo ln -s /etc/nginx/sites-available/recommend-moe /etc/nginx/sites-enabled/
```

Disable the default site
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Verify the configuration
```bash
sudo nginx -t
```

Restart nginx
```bash
sudo systemctl reload nginx
```

## Environment Variables

The `ENV_SECRET` and `SESSION_SECRET` must be the same value across **production** instances of the server, because these values are used to encrypted values which may be read by the other instances.

If other instances are already operating, copy the values from those servers, other wise generate a new value by running the node command to start a REPL instance, then enter the following line to generate a cryptographically random value for them
```js
console.log( require('crypto').randomBytes(64).toString('hex') );
```

The `DATABASE_URL` can be determined by going to the Digital Ocean page for it, and selecting `VPC network` `User: recommend-service` `Database: recommend-moe`, make sure to add the query string `connection_limit=15` to make sure it doesn't try to open more connections that available for the database. If multiple instances of the server are running, make sure to lower this number so that all running instances don't add up to more than the connection limit.

Once you have all of these values you should have something that looks like this
`/srv/recommend-moe/.env`
```conf
DATABASE_URL="postgresql://recommend-service:PASSWORD@private-db-#######.db.ondigitalocean.com:25060/recommend-moe?sslmode=require&connection_limit=20"

SESSION_SECRET="xxxxx"
ENV_SECRET="xxxxx"
MODE="production"

MAL_CLIENT_SECRET="xxxxx"
MAL_CLIENT_ID="xxxxx"
```

## First Start Up

Create a new service
`/etc/systemd/system/recommend-moe.service`
```toml
[Unit]
Description=Recommend-Moe Server
After=network.target

[Service]
User=github
Group=github
WorkingDirectory=/srv/recommend-moe
ExecStart=bash /srv/recommend-moe/startup.bash
Restart=always
StandardOutput=append:/srv/recommend-moe/stdout.log
StandardError=append:/srv/recommend-moe/stderr.log

[Install]
WantedBy=multi-user.target
```

Bind the new service
```
sudo systemctl daemon-reload
sudo systemctl enable recommend-moe.service
```

Install dependencies
```bash
bash upgrade.bash
```

```bash
sudo systemctl restart recommend-moe.service
```

```bash
sudo systemctl status recommend-moe.service
```


# Production: Database

!!! warning

    This is only done when a database is being setup for the first time

1. Create the `recommend-moe` database
2. Create user `recommend-service`
3. Allow database connections
```sql
GRANT CONNECT ON DATABASE "recommend-moe" TO "recommend-service";
```

1. Revoke all previous permissions:
```sql
REVOKE ALL PRIVILEGES ON DATABASE "defaultdb" FROM "recommend-service";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM "recommend-service";
```

1. Grant Permissions for `recommend-service` in `recommend-moe`
```sql
GRANT ALL PRIVILEGES ON DATABASE "recommend-moe" TO "recommend-service";
GRANT ALL PRIVILEGES ON SCHEMA public TO "recommend-service";

-- Grant all privileges on all tables, sequences, and functions in the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "recommend-service";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "recommend-service";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "recommend-service";
```