output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "db_endpoint" {
  description = "Database endpoint"
  value       = module.database.db_endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.cache.redis_endpoint
}

output "app_public_ip" {
  description = "Application public IP"
  value       = module.application.app_public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = module.application.ssh_command
}

output "api_url" {
  description = "Automatically generated API URL"
  value       = module.application.api_url
}

output "ecr_repository_url" {
  description = "ECR repository URL for the application"
  value       = module.application.ecr_repository_url
} 