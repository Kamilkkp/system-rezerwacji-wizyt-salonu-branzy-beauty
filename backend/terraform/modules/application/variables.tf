variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "app_port" {
  description = "Port for the application"
  type        = number
}

variable "app_instance_type" {
  description = "EC2 instance type for the application"
  type        = string
}



variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Environment variables for the application
variable "database_url" {
  description = "Database connection URL"
  type        = string
}

variable "redis_host" {
  description = "Redis host"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
}

variable "bms_frontend_url" {
  description = "BMS frontend URL"
  type        = string
}

variable "port" {
  description = "Application port"
  type        = number
}

variable "app_service_email" {
  description = "Application service email"
  type        = string
}

variable "postgres_host" {
  description = "PostgreSQL host"
  type        = string
}

variable "postgres_port" {
  description = "PostgreSQL port"
  type        = number
}

variable "postgres_user" {
  description = "PostgreSQL user"
  type        = string
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
}

variable "jwt_expiration_time" {
  description = "JWT expiration time in seconds"
  type        = number
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret key"
  type        = string
}

variable "jwt_refresh_expiration_time" {
  description = "JWT refresh expiration time in seconds"
  type        = number
}

variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
}

variable "app_image" {
  description = "Docker image for the application"
  type        = string
} 

variable "app_image_tag" {
  description = "docker image tag"
  type        = string
}