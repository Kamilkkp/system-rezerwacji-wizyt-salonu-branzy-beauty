# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

# Database variables
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "backend_db"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Application Configuration
variable "app_port" {
  description = "Port for the application"
  type        = number
  default     = 3000
}

variable "app_instance_type" {
  description = "EC2 instance type for the application"
  type        = string
  default     = "t3.micro"
}

# Environment Variables
variable "bms_frontend_url" {
  description = "BMS Frontend URL"
  type        = string
  sensitive   = true
}

variable "app_service_email" {
  description = "Application service email"
  type        = string
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT Refresh Secret"
  type        = string
  sensitive   = true
}

variable "jwt_expiration_time" {
  description = "JWT expiration time in seconds"
  type        = number
  default     = 60
}

variable "jwt_refresh_expiration_time" {
  description = "JWT refresh expiration time in seconds"
  type        = number
  default     = 3600
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
  default     = "411335220534.dkr.ecr.us-east-1.amazonaws.com/production-backend"
} 