# AWS Infrastructure for Backend

## Architecture
- **3x EC2 instances** (backend, database, cache) - configurable instance types
- **ECR** for Docker image storage
- **SES** for email sending
- **VPC** with public/private subnets

## Quick Start

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

## Outputs
```bash
terraform output api_url          # Application URL
terraform output ssh_command      # SSH to backend
```

## Cleanup
```bash
terraform destroy
```

## Cost: ~$30/month