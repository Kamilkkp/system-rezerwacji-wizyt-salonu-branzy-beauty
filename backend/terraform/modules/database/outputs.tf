output "db_endpoint" {
  description = "Database endpoint"
  value       = aws_instance.database.private_ip
}

output "db_public_ip" {
  description = "Database public IP"
  value       = aws_instance.database.public_ip
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "db_private_ip" {
  description = "Database private IP"
  value       = aws_instance.database.private_ip
} 