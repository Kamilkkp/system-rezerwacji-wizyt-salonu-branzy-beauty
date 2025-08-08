terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "networking" {
  source = "./modules/networking"
  
  vpc_cidr             = var.vpc_cidr
  environment          = var.environment
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
}

# Database
module "database" {
  source = "./modules/database"
  
  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
}

# Cache
module "cache" {
  source = "./modules/cache"

  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
}

# Application (needs to be created last to get database and cache IPs)
module "application" {
  source = "./modules/application"

  environment        = var.environment
  vpc_id            = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids

  app_port          = var.app_port
  app_instance_type = var.app_instance_type
  aws_region        = var.aws_region
  app_image_tag = module.application.image_tag

  # Environment variables for the application
  database_url                = "postgresql://${var.db_username}:${var.db_password}@${module.database.db_private_ip}:5432/${var.db_name}"
  redis_host                  = module.cache.cache_private_ip
  redis_port                  = 6379
  bms_frontend_url           = var.bms_frontend_url
  port                       = var.app_port
  app_service_email          = var.app_service_email
  postgres_host              = module.database.db_private_ip
  postgres_port              = 5432
  postgres_user              = var.db_username
  postgres_password          = var.db_password
  postgres_db                = var.db_name
  jwt_secret                 = var.jwt_secret
  jwt_expiration_time        = var.jwt_expiration_time
  jwt_refresh_secret         = var.jwt_refresh_secret
  jwt_refresh_expiration_time = var.jwt_refresh_expiration_time
  aws_access_key_id          = var.aws_access_key_id
  aws_secret_access_key      = var.aws_secret_access_key
  app_image                  = var.ecr_repository_url
} 