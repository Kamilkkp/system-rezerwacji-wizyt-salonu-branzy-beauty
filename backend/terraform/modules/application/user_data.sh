#!/bin/bash


apt-get update && apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common unzip netcat-openbsd nginx openssl
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl start docker && systemctl enable docker


curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/


INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
DOMAIN_NAME="$${INSTANCE_IP}.nip.io"
DYNAMIC_API_URL="https://$${DOMAIN_NAME}"


mkdir -p /opt/backend
cd /opt/backend


aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${app_image}

echo "Pulling application image from ECR with tag: ${app_image_tag}..."
docker pull ${app_image}:${app_image_tag}
echo "Image pulled successfully from ECR"
if docker ps -a --format '{{.Names}}' | grep -q "^backend$"; then
  echo "Removing existing backend container..."
  docker stop backend 2>/dev/null || true
  docker rm backend 2>/dev/null || true
fi


docker run -d \
  --name backend \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost:${app_port}/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  -p 127.0.0.1:${app_port}:${app_port} \
  -e NODE_ENV=production \
  -e API_URL="$${DYNAMIC_API_URL}" \
  -e BMS_FRONTEND_URL="${bms_frontend_url}" \
  -e PORT="${port}" \
  -e APP_SERVICE_EMAIL="${app_service_email}" \
  -e POSTGRES_HOST="${postgres_host}" \
  -e POSTGRES_PORT="${postgres_port}" \
  -e POSTGRES_USER="${postgres_user}" \
  -e POSTGRES_PASSWORD="${postgres_password}" \
  -e POSTGRES_DB="${postgres_db}" \
  -e DATABASE_URL="${database_url}" \
  -e REDIS_HOST="${redis_host}" \
  -e REDIS_PORT="${redis_port}" \
  -e JWT_SECRET="${jwt_secret}" \
  -e JWT_EXPIRATION_TIME="${jwt_expiration_time}" \
  -e JWT_REFRESH_SECRET="${jwt_refresh_secret}" \
  -e JWT_REFRESH_EXPIRATION_TIME="${jwt_refresh_expiration_time}" \
  -e AWS_REGION="${aws_region}" \
  -e AWS_ACCESS_KEY_ID="${aws_access_key_id}" \
  -e AWS_SECRET_ACCESS_KEY="${aws_secret_access_key}" \
  ${app_image}:${app_image_tag}



echo "Setting up SSL with self-signed certificate..."

# Create SSL directory and generate certificate
mkdir -p /etc/ssl/private
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$${DOMAIN_NAME}" \
  -addext "subjectAltName=DNS:$${DOMAIN_NAME},IP:$${INSTANCE_IP}"

# Set proper permissions
chmod 600 /etc/ssl/private/nginx-selfsigned.key
chmod 644 /etc/ssl/certs/nginx-selfsigned.crt

echo "Configuring Nginx with SSL..."
cat > /etc/nginx/sites-available/backend << EOF
server {
    listen 80;
    server_name $${DOMAIN_NAME};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $${DOMAIN_NAME};
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://127.0.0.1:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF


ln -sf /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default


if nginx -t; then
    systemctl start nginx && systemctl enable nginx
    echo "Nginx started successfully with SSL"
else
    echo "Nginx configuration test failed"
    exit 1
fi

echo "Reloading Nginx to apply new configuration..."
systemctl restart nginx
echo "Application setup completed!"
echo "API URL: $${DYNAMIC_API_URL}" 