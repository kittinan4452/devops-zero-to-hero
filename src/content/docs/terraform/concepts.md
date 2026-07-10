---
title: "Terraform Concepts"
---

Terraform คือ Infrastructure as Code (IaC) tool ที่ให้เราเขียน code เพื่อ provision infrastructure แทนการคลิกใน console

---

## ทำไมต้อง IaC?

| Manual (Console) | IaC (Terraform) |
|---|---|
| ทำซ้ำยาก | reproduce ได้ 100% |
| ไม่มี version control | git track ได้ |
| Human error สูง | consistent ทุกครั้ง |
| ไม่มี audit trail | code review ได้ |
| Scale ยาก | automate ได้ |

---

## Terraform Workflow

```
Write          Plan           Apply
  │              │               │
  ▼              ▼               ▼
.tf files  →  terraform    →  terraform
           plan (preview)    apply (create)
```

1. **Write** — เขียน `.tf` files
2. **Init** — `terraform init` ดึง providers
3. **Plan** — `terraform plan` preview changes
4. **Apply** — `terraform apply` สร้าง infrastructure
5. **Destroy** — `terraform destroy` ลบทิ้ง

---

## โครงสร้าง HCL

```hcl
# Provider - บอกว่าใช้ cloud ไหน
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"
}

# Resource - สิ่งที่จะสร้าง
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "WebServer"
  }
}

# Variable - ค่าที่ปรับได้
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# Output - ค่าที่ต้องการรู้หลัง apply
output "instance_ip" {
  value = aws_instance.web.public_ip
}

# Data source - ดึงข้อมูลที่มีอยู่แล้ว
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-*"]
  }
}
```

---

## State

Terraform เก็บ state ใน `terraform.tfstate` เพื่อ track resources ที่สร้างไปแล้ว

```hcl
# Remote state บน S3 (แนะนำสำหรับ team)
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-southeast-1"
  }
}
```


:::caution[ระวัง]
ไม่ควร commit `terraform.tfstate` ขึ้น git เพราะอาจมีข้อมูล sensitive
:::

---

## Modules

Modules คือ reusable code blocks:

```hcl
# เรียกใช้ module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-southeast-1a", "ap-southeast-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}
```

---

## คำสั่ง

```bash
terraform init          # initialize, ดึง providers
terraform fmt           # format code
terraform validate      # validate syntax
terraform plan          # preview changes
terraform apply         # apply changes
terraform apply -auto-approve  # ไม่ถามยืนยัน
terraform destroy       # ลบทุกอย่าง
terraform output        # แสดง outputs
terraform state list    # list resources ใน state
terraform import        # import existing resource
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - Infrastructure as Code](/terraform/lab-01)
:::
