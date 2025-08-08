# Security Group for Cache
resource "aws_security_group" "cache" {
  name_prefix = "${var.environment}-cache-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/16"] # Allow from VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-cache-sg"
    Environment = var.environment
  }
}

# SSH Key Pair for Cache
resource "aws_key_pair" "cache" {
  key_name   = "${var.environment}-cache-key"
  public_key = file("${path.module}/ssh_key.pub")
}

# EC2 Instance for Cache
resource "aws_instance" "cache" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.cache.id]
  key_name               = aws_key_pair.cache.key_name

  user_data = file("${path.module}/user_data.sh")

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-cache"
    Environment = var.environment
  }
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