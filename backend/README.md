## Local Development Setup

### Prerequisites
- Docker and Docker Compose installed on your machine
- Node.js and npm installed on your machine

### Option 1: Full Docker Setup (Recommended)
1. **Copy environment configuration:**
   ```bash
   cp .env.docker .env
   ```

2. **Start all services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

This will start the complete backend stack including:
- **Backend API** - NestJS application with Prisma migrations
- **PostgreSQL** - Database
- **Redis** - Cache and queue storage
- **MailHog** - Email testing service
- **Adminer** - Database management interface

### Option 2: Hybrid Setup (Backend locally, services in Docker)
1. **Copy environment configuration:**
   ```bash
   cp .env.local .env
   ```

2. **Start only infrastructure services:**
   ```bash
   docker-compose up -d postgres redis mailhog adminer
   ```

3. **Install dependencies and run backend locally:**
   ```bash
   npm install
   npm run start
   ```

### Accessing Services
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Database Admin**: http://localhost:8080 (or port specified in `ADMINER_PORT`)
- **Email Testing**: http://localhost:8025 (or port specified in `MAILHOG_CLIENT_PORT`)

### Stopping Services
```bash
docker-compose down
```

## Production Deployment (AWS)

### Architecture
- **3x EC2 instances** (backend: t3.small, database: t3.micro, cache: t3.micro)
- **ECR** for Docker image storage
- **SES** for email sending
- **VPC** with public/private subnets


### Email Configuration (Required)
Before deployment, configure SES for email sending - Go to SES → Verified identities → Create identity for domain or email.

1. **Generate SSH key:**
   ```bash
   cd ./terraform
   ssh-keygen -t rsa -b 4096 -f ssh_key -N ""
   cp ssh_key.pub ./modules/application/
   cp ssh_key.pub ./modules/database/
   cp ssh_key.pub ./modules/cache/
   ```

2. **Deploy:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your configuration
   # - Set secure passwords and secrets
   terraform init
   terraform plan
   terraform apply
   ```


### Useful Commands
```bash
# Get API URL
terraform output api_url

# SSH to backend
terraform output ssh_command

# View logs
ssh -i ssh_key ubuntu@$(terraform output app_public_ip)
docker logs -f backend
```

### Creating User Account
After deployment, you need to create an admin account:


#### **Production (AWS):**
```bash
# 1. SSH to backend instance
ssh -i ssh_key ubuntu@$(terraform output app_public_ip)

# 2. Run Prisma migrations in the container
sudo docker exec backend npx prisma migrate deploy

# 3. Create account in production
sudo docker exec backend npm run create-user -- --email=your-email@example.com --password=YourPassword123! --firstName name --lastName lastName

### Estimated Cost: ~$30/month