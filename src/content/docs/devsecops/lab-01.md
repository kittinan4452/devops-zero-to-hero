---
title: "Lab 01 - Security Scanning ด้วย Trivy"
---

## เป้าหมาย

- Scan Docker image หา vulnerabilities
- Scan source code หา secrets
- รวม security scan เข้า CI pipeline

## สิ่งที่ต้องมี


:::note[Requirements]
```bash
# ติดตั้ง Trivy
# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# macOS
brew install trivy

trivy --version
```
:::

---

## Exercise 1 — Scan Docker Image

```bash
# Scan image ยอดนิยม
trivy image nginx:latest

# ดูเฉพาะ HIGH และ CRITICAL
trivy image --severity HIGH,CRITICAL nginx:latest

# Scan และ output เป็น JSON
trivy image --format json --output results.json nginx:latest

# เปรียบเทียบ image เก่า vs ใหม่
trivy image nginx:1.24
trivy image nginx:1.25
```

สังเกตว่า:
- image ใหม่กว่ามักมี vulnerability น้อยกว่า
- ควร update image อยู่เสมอ

---

## Exercise 2 — Scan Filesystem

สร้าง project ที่มี vulnerability ตั้งใจ:

```bash
mkdir ~/devsecops-lab && cd ~/devsecops-lab
```

สร้าง `requirements.txt` ที่ใช้ version เก่า:
```
flask==2.0.0
requests==2.20.0
pyyaml==5.1
```

```bash
# Scan dependencies
trivy fs --scanners vuln .

# Scan และ fail ถ้ามี CRITICAL
trivy fs --severity CRITICAL --exit-code 1 .
echo "Exit code: $?"  # 1 = มี vulnerability, 0 = clean
```

---

## Exercise 3 — Secret Detection

สร้างไฟล์ที่มี secrets (ตัวอย่างเพื่อการเรียนรู้):

```bash
cat > config.py << 'EOF'
# ตัวอย่าง - อย่าเก็บ secrets แบบนี้จริงๆ!
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
DATABASE_URL = "postgresql://admin:password123@localhost/db"
GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EOF
```

```bash
# Scan หา secrets
trivy fs --scanners secret .

# ดูรายละเอียด
trivy fs --scanners secret --format table .
```


:::caution[ข้อควรระวัง]
ถ้าเจอ secrets ใน repo ที่ push ไปแล้ว ต้องทำ 2 อย่าง:
1. Revoke token/key นั้นทันที
2. ลบออกจาก git history ด้วย `git filter-branch` หรือ `BFG Repo Cleaner`
:::

ทำความสะอาดหลัง lab:
```bash
rm config.py
```

---

## Exercise 4 — Scan IaC (Terraform / K8s)

สร้าง `insecure.tf` ที่มี misconfiguration:
```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-public-bucket"
}

resource "aws_s3_bucket_acl" "data" {
  bucket = aws_s3_bucket.data.id
  acl    = "public-read"  # INSECURE: S3 เปิด public!
}

resource "aws_security_group" "web" {
  name = "allow-all"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # INSECURE: เปิดทุก port!
  }
}
```

```bash
# Scan IaC
trivy config .

# จะเห็น misconfiguration เช่น:
# - S3 bucket เปิด public
# - Security group เปิดทุก port
```

ทำความสะอาด:
```bash
rm insecure.tf
```

---

## Exercise 5 — รวมเข้า GitHub Actions

เพิ่มใน `.github/workflows/security.yml`:
```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 8 * * 1'  # ทุกวันจันทร์ 8 โมง

jobs:
  trivy-scan:
    name: Trivy Security Scan
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
    - uses: actions/checkout@v4

    - name: Scan filesystem
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: fs
        scan-ref: .
        format: sarif
        output: trivy-results.sarif
        severity: HIGH,CRITICAL

    - name: Upload to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: trivy-results.sarif

  secret-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # ดึง full history เพื่อ scan commits

    - name: Scan for secrets
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: fs
        scanners: secret
        scan-ref: .
```

---


:::tip[สำเร็จแล้ว!]
คุณ scan vulnerabilities, secrets, และ IaC misconfigurations ได้แล้ว และรวมเข้า CI pipeline แล้ว
:::


:::note[Challenge]
Build Docker image จาก Dockerfile ที่ใช้ root user แล้ว scan ด้วย Trivy
จากนั้นแก้ Dockerfile ให้ใช้ non-root user แล้ว scan ใหม่ เปรียบเทียบผลลัพธ์
:::
