---
title: "CI/CD Concepts"
---

CI/CD คือ practice ในการ automate การ build, test, และ deploy code เพื่อส่ง software ได้เร็วและมีคุณภาพสูงขึ้น

---

## CI vs CD

| | Continuous Integration | Continuous Delivery | Continuous Deployment |
|---|---|---|---|
| ย่อ | CI | CD | CD |
| หมายถึง | merge code บ่อย + auto test | พร้อม deploy ตลอดเวลา | deploy อัตโนมัติทุก commit |
| Manual step | - | approve ก่อน deploy | ไม่มี |

---

## CI/CD Pipeline

```
Code Push
    ↓
Source Control (Git)
    ↓
┌─── CI Pipeline ────────────────────────┐
│  Build → Unit Test → Lint → Scan       │
└────────────────────────────────────────┘
    ↓ (pass)
┌─── CD Pipeline ────────────────────────┐
│  Build Image → Push → Deploy → E2E Test│
└────────────────────────────────────────┘
    ↓
Production
```

---

## GitHub Actions

GitHub Actions เป็น CI/CD platform ที่ built-in อยู่ใน GitHub ฟรีสำหรับ public repo

### โครงสร้าง

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:                          # trigger
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:                      # job name
    runs-on: ubuntu-latest   # runner
    steps:
    - uses: actions/checkout@v4          # checkout code
    - uses: actions/setup-python@v5      # setup python
      with:
        python-version: '3.11'
    - run: pip install -r requirements.txt
    - run: pytest                        # run tests
```

### Concepts สำคัญ

**Workflow** — ไฟล์ YAML ที่ define automation pipeline

**Job** — กลุ่มของ steps ที่รันบน runner เดียวกัน

**Step** — คำสั่งเดียวหรือ action ที่รัน

**Action** — reusable unit เช่น `actions/checkout`

**Runner** — VM ที่รัน workflow (GitHub-hosted หรือ self-hosted)

**Secret** — ค่าที่เป็นความลับ เก็บใน GitHub Settings

---

## Artifacts & Caching

```yaml
steps:
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
```

---

## Environment & Deployment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production    # require manual approval
    steps:
    - name: Deploy to server
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      run: |
        echo "Deploying..."
        # deploy commands here
```

---


:::tip[Tools ที่มี Lab ให้ลอง]
- **GitHub Actions** — built-in ใน GitHub, YAML, ฟรีสำหรับ public repo → [Lab 01](/cicd/lab-01)
- **GitLab CI** — `.gitlab-ci.yml` ไฟล์เดียว, มี registry ในตัว → [Lab 02](/cicd/lab-02)
- **Jenkins** — classic, self-hosted, plugin เยอะ (Jenkinsfile) → [Lab 03](/cicd/lab-03)
- **ArgoCD** — GitOps สำหรับ Kubernetes (deploy = git push) → [Lab 04](/cicd/lab-04)
- **Tekton** — K8s-native CI/CD (ยังไม่มี lab)
:::


:::tip[พร้อมแล้ว?]
ไล่ทำตามลำดับได้เลย:

1. [Lab 01 - GitHub Actions](/cicd/lab-01) — เริ่มที่ CI พื้นฐาน
2. [Lab 02 - GitLab CI/CD](/cicd/lab-02) — pipeline แบบ stage + registry ในตัว
3. [Lab 03 - Jenkins Pipeline](/cicd/lab-03) — self-hosted + Jenkinsfile
4. [Lab 04 - ArgoCD (GitOps)](/cicd/lab-04) — CD บน Kubernetes ด้วย GitOps
:::
