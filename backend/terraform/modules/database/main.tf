# Security Group for Database
resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-db-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
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
    Name        = "${var.environment}-db-sg"
    Environment = var.environment
  }
}

# SSH Key Pair for Database
resource "aws_key_pair" "database" {
  key_name   = "${var.environment}-db-key"
  public_key = file("${path.module}/ssh_key.pub")
}

# EC2 Instance for Database
resource "aws_instance" "database" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.database.id]
  key_name               = aws_key_pair.database.key_name

  user_data = templatefile("${path.module}/user_data.sh", {
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
  })

  user_data_replace_on_change = true

  tags = {
    Name        = "${var.environment}-database"
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