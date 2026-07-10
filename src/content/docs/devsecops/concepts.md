---
title: "DevSecOps Concepts"
---

DevSecOps คือการรวม Security เข้าไปใน DevOps pipeline ตั้งแต่ต้น แทนที่จะ test security แค่ตอนท้าย

---

## Shift Left Security

```
แบบเดิม:
Dev → Dev → Dev → QA → Security → Prod
                              ↑
                         เจอปัญหาตรงนี้ แก้ยากและแพง

DevSecOps:
Dev+Sec → Dev+Sec → QA+Sec → Prod
  ↑
เจอปัญหาตั้งแต่ต้น แก้ง่ายและถูก
```

---

## Security Testing ใน Pipeline

```
Code → SAST → Build → SCA → Container Scan → Deploy → DAST
```

| ขั้นตอน | ย่อ | หมายถึง | เครื่องมือ |
|---|---|---|---|
| Static Analysis | SAST | scan source code | Semgrep, Bandit, SonarQube |
| Dependency Check | SCA | scan third-party libs | OWASP Dependency-Check, Snyk |
| Container Scan | - | scan Docker image | Trivy, Grype, Clair |
| Secret Detection | - | หา secrets ใน code | Gitleaks, TruffleHog |
| Dynamic Analysis | DAST | test app ที่รันอยู่ | OWASP ZAP, Burp Suite |
| IaC Scan | - | scan Terraform/K8s | Checkov, tfsec |

---

## Trivy — All-in-one Scanner

Trivy เป็นเครื่องมือ scan ที่ง่ายและ powerful มาก

```bash
# ติดตั้ง
brew install trivy           # macOS
apt install trivy            # Ubuntu

# Scan Docker image
trivy image nginx:latest

# Scan filesystem
trivy fs .

# Scan Git repo
trivy repo https://github.com/user/repo

# Scan Kubernetes cluster
trivy k8s --report summary cluster

# Scan IaC (Terraform, K8s YAML)
trivy config ./terraform/
trivy config ./k8s/
```

---

## Gitleaks — Secret Detection

```bash
# ติดตั้ง
brew install gitleaks

# Scan current repo
gitleaks detect

# Scan specific path
gitleaks detect --source /path/to/repo

# ใน pre-commit hook
gitleaks protect --staged
```

---

## OWASP Top 10 (ที่ควรรู้)

| # | Vulnerability | ตัวอย่าง |
|---|---|---|
| A01 | Broken Access Control | เข้าถึง resource ของคนอื่น |
| A02 | Cryptographic Failures | เก็บ password แบบ plaintext |
| A03 | Injection | SQL Injection, Command Injection |
| A04 | Insecure Design | ไม่มี rate limiting |
| A05 | Security Misconfiguration | ใช้ default password |
| A06 | Vulnerable Components | ใช้ library ที่มี CVE |
| A07 | Auth Failures | session ไม่หมดอายุ |
| A08 | Software Integrity | ไม่ verify package signature |
| A09 | Logging Failures | ไม่ log security events |
| A10 | SSRF | request ไป internal service |

---

## Security ใน Dockerfile

```dockerfile
# ไม่ดี
FROM ubuntu:latest
RUN apt update && apt install -y python3
COPY . /app
CMD ["python3", "/app/app.py"]  # รันเป็น root!

# ดี
FROM python:3.11-slim

# สร้าง non-root user
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appuser . .

# switch ไป non-root user
USER appuser

EXPOSE 8000
CMD ["python", "app.py"]
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - SAST ด้วย Trivy](/devsecops/lab-01)
:::
