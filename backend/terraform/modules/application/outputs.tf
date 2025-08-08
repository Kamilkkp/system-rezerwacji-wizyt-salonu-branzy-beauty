output "app_url" {
  description = "Application URL"
  value       = "https://${aws_eip.app.public_ip}.nip.io"
}

output "app_public_ip" {
  description = "Application public IP (Elastic IP)"
  value       = aws_eip.app.public_ip
}

output "app_elastic_ip" {
  description = "Elastic IP address"
  value       = aws_eip.app.public_ip
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = aws_security_group.app.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       ="ssh -i ssh_key ubuntu@${aws_eip.app.public_ip}"
}

output "api_url" {
  description = "Automatically generated API URL with HTTPS"
  value       = "https://${aws_eip.app.public_ip}.nip.io"
}

output "ecr_repository_url" {
  description = "ECR repository URL for the application"
  value       = aws_ecr_repository.app.repository_url
} 

output "image_tag" {
  description = "docker image tag"
  value       = null_resource.build_and_push_image.triggers.image_tag
}