#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker service
systemctl start docker
systemctl enable docker

# Create application directory
mkdir -p /opt/database
cd /opt/database

# Start PostgreSQL container
docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_DB="${db_name}" \
  -e POSTGRES_USER="${db_username}" \
  -e POSTGRES_PASSWORD="${db_password}" \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:17.4

# Create a simple health check script
cat > /opt/health-check.sh << EOF
#!/bin/bash
docker exec postgres pg_isready -U ${db_username} || exit 1
EOF

chmod +x /opt/health-check.sh

# Set up log rotation
cat > /etc/logrotate.d/docker << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

echo "Database setup completed!"
echo "PostgreSQL running on port 5432" 