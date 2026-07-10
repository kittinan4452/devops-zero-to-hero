---
title: "Lab 01 - Infrastructure as Code ด้วย Terraform"
---

## เป้าหมาย

- ติดตั้ง Terraform
- สร้าง infrastructure จริงบน Local Docker (ไม่ต้องมี cloud account)
- เข้าใจ plan, apply, destroy

## สิ่งที่ต้องมี


:::note[Requirements]
ติดตั้ง Terraform: [developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install)
```bash
terraform version
docker --version  # ใช้ Docker provider แทน cloud
```
:::

---

## Exercise 1 — สร้าง Nginx ด้วย Terraform + Docker Provider

```bash
mkdir ~/terraform-lab && cd ~/terraform-lab
```

สร้าง `main.tf`:
```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

# Pull nginx image
resource "docker_image" "nginx" {
  name         = "nginx:1.25"
  keep_locally = false
}

# สร้าง nginx container
resource "docker_container" "nginx" {
  image = docker_image.nginx.image_id
  name  = "terraform-nginx"

  ports {
    internal = 80
    external = 8080
  }

  env = [
    "NGINX_HOST=localhost",
    "NGINX_PORT=80"
  ]
}

# Output
output "container_name" {
  value = docker_container.nginx.name
}

output "container_ip" {
  value = docker_container.nginx.network_data[0].ip_address
}
```

```bash
terraform init      # ดึง docker provider
terraform fmt       # format
terraform validate  # ตรวจ syntax

terraform plan      # ดูว่าจะสร้างอะไร
terraform apply     # สร้างจริง (กด yes)

curl http://localhost:8080   # ทดสอบ

terraform output    # ดู outputs
```

---

## Exercise 2 — Variables และ Multiple Containers

สร้าง `variables.tf`:
```hcl
variable "nginx_port" {
  description = "External port for nginx"
  type        = number
  default     = 8080
}

variable "container_count" {
  description = "Number of nginx containers"
  type        = number
  default     = 2
}

variable "nginx_version" {
  description = "Nginx image version"
  type        = string
  default     = "1.25"
}
```

อัพเดต `main.tf`:
```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name         = "nginx:${var.nginx_version}"
  keep_locally = false
}

resource "docker_container" "nginx" {
  count = var.container_count
  image = docker_image.nginx.image_id
  name  = "terraform-nginx-${count.index}"

  ports {
    internal = 80
    external = var.nginx_port + count.index
  }
}

output "container_urls" {
  value = [for c in docker_container.nginx : "http://localhost:${c.ports[0].external}"]
}
```

```bash
terraform plan -var="container_count=3"
terraform apply -var="container_count=3"

terraform output   # ดู URLs ทั้งหมด
```

---

## Exercise 3 — Terraform State

```bash
# ดู resources ใน state
terraform state list

# ดูรายละเอียด resource
terraform state show docker_container.nginx[0]

# ลบ resource ออกจาก state โดยไม่ destroy จริง
# terraform state rm docker_container.nginx[0]
```

---

## Exercise 4 — tfvars file

สร้าง `terraform.tfvars`:
```hcl
nginx_port       = 9000
container_count  = 2
nginx_version    = "1.26"
```

```bash
# จะใช้ค่าจาก tfvars อัตโนมัติ
terraform plan
terraform apply
```

---

## Cleanup

```bash
terraform destroy    # ลบ resources ทั้งหมด (กด yes)
docker ps            # ควรไม่มี terraform containers แล้ว
```

---


:::tip[สำเร็จแล้ว!]
คุณใช้ Terraform manage infrastructure ได้แล้ว
:::


:::note[Challenge]
สร้าง Terraform config สำหรับ Docker Compose setup ที่มี:
- Nginx container
- PostgreSQL container
- Custom Docker network เชื่อม 2 containers
:::
