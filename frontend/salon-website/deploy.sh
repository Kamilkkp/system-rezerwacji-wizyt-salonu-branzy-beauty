#!/bin/bash



set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color


print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}


if [ ! -f "package.json" ] || [ ! -d "terraform" ]; then
    print_error "Please run this script from the salon-website directory"
    exit 1
fi


if [ ! -f "terraform/terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found. Please configure it first:"
    echo "  cd terraform"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo "  # Edit terraform.tfvars with your values"
    echo "  cd .."
    exit 1
fi


if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi


if ! command -v terraform &> /dev/null; then
    print_error "Terraform not found. Please install Terraform first."
    exit 1
fi

print_status "Starting deployment process..."


print_status "Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Please fix the build errors and try again."
    exit 1
fi

print_success "Application built successfully"


print_status "Getting Terraform outputs..."
cd terraform


if [ ! -f ".terraform/terraform.tfstate" ]; then
    print_warning "Terraform state not found. Deploying infrastructure first..."
    terraform init
    terraform plan
    terraform apply -auto-approve
fi


S3_BUCKET=$(terraform output -raw website_bucket_name 2>/dev/null || {
    print_error "Failed to get S3 bucket name. Make sure infrastructure is deployed."
    exit 1
})


CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || {
    print_error "Failed to get CloudFront distribution ID. Make sure infrastructure is deployed."
    exit 1
})

cd ..

print_success "Got infrastructure details"


print_status "Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync out/ s3://$S3_BUCKET/ --delete

if [ $? -ne 0 ]; then
    print_error "Failed to sync files to S3. Check your AWS permissions."
    exit 1
fi

print_success "Files synced to S3"


print_status "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

if [ $? -ne 0 ]; then
    print_warning "Failed to invalidate CloudFront cache. This is not critical but may cause delays in seeing updates."
else
    print_success "CloudFront cache invalidated"
fi


cd terraform
WEBSITE_URL=$(terraform output -raw website_url)
cd ..

print_success "Deployment complete!"
echo ""
echo "    Your website is available at:"
echo "   $WEBSITE_URL"
echo ""
echo "   Infrastructure details:"
echo "   S3 Bucket: $S3_BUCKET"
echo "   CloudFront Distribution: $CLOUDFRONT_ID"