output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_instance.cache.private_ip
}

output "redis_public_ip" {
  description = "Redis public IP"
  value       = aws_instance.cache.public_ip
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = aws_security_group.cache.id
}

output "cache_private_ip" {
  description = "Cache private IP"
  value       = aws_instance.cache.private_ip
} 