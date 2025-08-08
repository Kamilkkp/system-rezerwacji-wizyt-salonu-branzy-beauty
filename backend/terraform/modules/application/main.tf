# ECR Repository for Application
resource "aws_ecr_repository" "app" {
  name                 = "${var.environment}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-backend-repo"
    Environment = var.environment
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Build and push Docker image to ECR
resource "null_resource" "build_and_push_image" {
  triggers = {
    image_tag = sha1(join("", [
      filesha1("${path.module}/../../../Dockerfile"),
      filesha1("${path.module}/../../../package.json"),
      join("", [for f in fileset("${path.module}/../../../src", "**") : filesha1("${path.module}/../../../src/${f}")]),
      filesha1("${path.module}/../../../prisma/schema.prisma")
    ]))
  }
  provisioner "local-exec" {
    command = <<-EOT
      set -e
      mkdir -p ~/.docker
      echo '{"credsStore":""}' > ~/.docker/config.json

      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}

      cd ${path.root}/..
      TAG=${self.triggers.image_tag}

      docker build \
        --cache-from ${aws_ecr_repository.app.repository_url}:latest \
        --tag ${aws_ecr_repository.app.repository_url}:latest \
        --tag ${aws_ecr_repository.app.repository_url}:$TAG \
        .

      docker push ${aws_ecr_repository.app.repository_url}:latest
      docker push ${aws_ecr_repository.app.repository_url}:$TAG
    EOT
  }

  depends_on = [aws_ecr_repository.app]
}

# Security Group for Application
resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-app-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow connection to database
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/16"] # Allow to VPC
  }

  tags = {
    Name        = "${var.environment}-app-sg"
    Environment = var.environment
  }
}

# SSH Key Pair
resource "aws_key_pair" "app" {
  key_name   = "${var.environment}-app-key"
  public_key = file("${path.module}/ssh_key.pub")
}

# IAM Role for EC2
resource "aws_iam_role" "app" {
  name = "${var.environment}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for ECR
resource "aws_iam_policy" "ecr" {
  name = "${var.environment}-ecr-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for SES
resource "aws_iam_policy" "ses" {
  name = "${var.environment}-ses-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_policy" "cloudwatch" {
  name = "${var.environment}-cloudwatch-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "ecr" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.ecr.arn
}

resource "aws_iam_role_policy_attachment" "ses" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.ses.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.cloudwatch.arn
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "app" {
  name = "${var.environment}-app-profile"
  role = aws_iam_role.app.name
}

# Elastic IP for Application
resource "aws_eip" "app" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.environment}-app-eip"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.app_instance_type
  subnet_id              = var.public_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = aws_key_pair.app.key_name
  iam_instance_profile   = aws_iam_instance_profile.app.name

  depends_on = [null_resource.build_and_push_image]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_image   = var.app_image,
    app_image_tag = var.app_image_tag,
    app_port    = var.app_port,
    aws_region  = var.aws_region,
    database_url = var.database_url,
    redis_host   = var.redis_host,
    redis_port   = var.redis_port,
    bms_frontend_url = var.bms_frontend_url,
    port         = var.port,
    app_service_email = var.app_service_email,
    postgres_host = var.postgres_host,
    postgres_port = var.postgres_port,
    postgres_user = var.postgres_user,
    postgres_password = var.postgres_password,
    postgres_db = var.postgres_db,
    jwt_secret   = var.jwt_secret,
    jwt_expiration_time = var.jwt_expiration_time,
    jwt_refresh_secret = var.jwt_refresh_secret,
    jwt_refresh_expiration_time = var.jwt_refresh_expiration_time,
    aws_access_key_id = var.aws_access_key_id,
    aws_secret_access_key = var.aws_secret_access_key,
    image_hash = null_resource.build_and_push_image.id
  }))

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-app"
    Environment = var.environment
  }
}

# Associate Elastic IP with Instance
resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

# Data source for Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
} 