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
mkdir -p /opt/cache
cd /opt/cache

# Start Redis container
docker run -d \
  --name redis \
  --restart unless-stopped \
  -v redis_data:/data \
  -p 6379:6379 \
  redis:7-alpine redis-server --appendonly yes

# Create a simple health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
docker exec redis redis-cli ping | grep PONG || exit 1
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

echo "Cache setup completed!"
echo "Redis running on port 6379" 