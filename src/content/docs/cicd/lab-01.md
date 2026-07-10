---
title: "Lab 01 - GitHub Actions"
---

## เป้าหมาย

- สร้าง CI pipeline ด้วย GitHub Actions
- Auto build, test, และ build Docker image เมื่อ push code

## สิ่งที่ต้องมี


:::note[Requirements]
- GitHub account
- Docker Hub account (สำหรับ push image)
- Git ติดตั้งบนเครื่อง
:::

---

## Exercise 1 — สร้าง Repo และ Python App

```bash
mkdir ~/cicd-lab && cd ~/cicd-lab
git init
git branch -M main
```

สร้าง `app.py`:
```python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

if __name__ == "__main__":
    print(add(1, 2))
```

สร้าง `test_app.py`:
```python
from app import add, subtract

def test_add():
    assert add(1, 2) == 3
    assert add(-1, 1) == 0

def test_subtract():
    assert subtract(5, 3) == 2
```

สร้าง `requirements.txt`:
```
pytest==7.4.0
```

ทดสอบ local ก่อน:
```bash
pip install pytest
pytest -v
```

---

## Exercise 2 — สร้าง CI Workflow

```bash
mkdir -p .github/workflows
```

สร้าง `.github/workflows/ci.yml`:
```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Cache pip
      uses: actions/cache@v4
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

    - name: Install dependencies
      run: pip install -r requirements.txt

    - name: Run tests
      run: pytest -v

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results
        path: .pytest_cache/
```

Push ขึ้น GitHub:
```bash
git add .
git commit -m "feat: add CI pipeline"
git remote add origin https://github.com/<your-username>/cicd-lab.git
git push -u origin main
```

ไปดูที่ **Actions** tab ใน GitHub repo

---

## Exercise 3 — Build & Push Docker Image

เพิ่ม `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

เพิ่ม secrets ใน GitHub repo:
- Settings → Secrets and variables → Actions
- เพิ่ม `DOCKERHUB_USERNAME` และ `DOCKERHUB_TOKEN`

สร้าง `.github/workflows/docker.yml`:
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: []

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ secrets.DOCKERHUB_USERNAME }}/cicd-lab

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

```bash
git add .
git commit -m "feat: add Docker build pipeline"
git push
```

---

## Exercise 4 — Pipeline ที่มี Multiple Jobs

อัพเดต `ci.yml` ให้มี lint ด้วย:
```yaml
name: CI Pipeline

on:
  push:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    - run: pip install flake8
    - run: flake8 app.py --max-line-length=100

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint        # รอให้ lint ผ่านก่อน
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    - run: pip install -r requirements.txt
    - run: pytest -v

  build:
    name: Build Image
    runs-on: ubuntu-latest
    needs: test        # รอให้ test ผ่านก่อน
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - run: docker build -t cicd-lab .
```

---


:::tip[สำเร็จแล้ว!]
ตอนนี้มี CI/CD pipeline ที่ auto test และ build Docker image เมื่อ push code แล้ว
:::


:::note[Challenge]
เพิ่ม job สำหรับรัน **security scan** ด้วย `trivy` บน Docker image ที่ build แล้ว
**Hint:** ใช้ `aquasecurity/trivy-action`
:::
