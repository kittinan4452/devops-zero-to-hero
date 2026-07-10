---
title: "Lab 02 - GitLab CI/CD"
---

## เป้าหมาย

- สร้าง pipeline ด้วย `.gitlab-ci.yml` (stages: build → test → deploy)
- ใช้ cache, artifacts และ pipeline แบบหลาย stage
- Build & push Docker image ด้วย Docker-in-Docker (dind)
- ใช้ environment + manual job สำหรับ deploy

## สิ่งที่ต้องมี

:::note[Requirements]
- GitLab account (gitlab.com ฟรี หรือ self-hosted)
- Git ติดตั้งบนเครื่อง
- เข้าใจ Python app จาก [Lab 01](/cicd/lab-01) (ใช้ app เดิมได้)
:::

---

## Exercise 1 — สร้าง Project + Pipeline แรก

ใช้ Python app เดิมจาก Lab 01 (`app.py`, `test_app.py`, `requirements.txt`)

สร้าง `.gitlab-ci.yml` ที่ root ของ repo:

```yaml
stages:          # ลำดับการรัน
  - test
  - build
  - deploy

# ค่า default ใช้ร่วมทุก job
default:
  image: python:3.11-slim

# cache dependencies ระหว่าง job
cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - .cache/pip

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

run-tests:
  stage: test
  script:
    - pip install -r requirements.txt
    - pytest -v
  artifacts:
    when: always
    reports:
      junit: report.xml
    paths:
      - report.xml
```

Push ขึ้น GitLab:
```bash
git remote add origin https://gitlab.com/<your-username>/cicd-lab.git
git add .gitlab-ci.yml
git commit -m "ci: add gitlab pipeline"
git push -u origin main
```

ดูผลที่ **Build → Pipelines** ใน GitLab

---

## Exercise 2 — เพิ่ม Lint และ Stage ที่ต่อกัน

GitLab รัน job ใน stage เดียวกัน **ขนานกัน** และรอ stage ก่อนหน้าให้ผ่านก่อน:

```yaml
lint:
  stage: test          # อยู่ stage เดียวกับ run-tests → รันขนานกัน
  script:
    - pip install flake8
    - flake8 app.py --max-line-length=100
```

`test` stage มี 2 job (`run-tests` + `lint`) รันพร้อมกัน — ทั้งคู่ต้องผ่านก่อนถึงจะไป stage `build`

---

## Exercise 3 — Build & Push Docker Image ด้วย dind

GitLab build image ด้วย **Docker-in-Docker**:

```yaml
build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind          # เปิด docker daemon ให้ job นี้
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'   # build เฉพาะ main
```

:::tip[ตัวแปร built-in ของ GitLab]
GitLab มี **Container Registry** ในตัว ตัวแปรพวกนี้ถูกเซ็ตให้อัตโนมัติ:
- `$CI_REGISTRY`, `$CI_REGISTRY_IMAGE` — address ของ registry
- `$CI_REGISTRY_USER`, `$CI_REGISTRY_PASSWORD` — credential ชั่วคราวของ job
- `$CI_COMMIT_SHORT_SHA` — commit hash สั้น (ใช้ทำ image tag)
:::

---

## Exercise 4 — Deploy แบบ Manual (Environment)

```yaml
deploy-prod:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA ..."
    # ใส่คำสั่ง deploy จริงตรงนี้ เช่น ssh / kubectl / helm
  environment:
    name: production
    url: https://myapp.example.com
  when: manual              # ต้องกดปุ่มใน UI ก่อน deploy
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

job นี้จะขึ้นปุ่ม **▶ (play)** ใน pipeline — กดเองเมื่อพร้อม deploy จริง

---

## เทียบกับ GitHub Actions

| | GitHub Actions | GitLab CI |
|---|---|---|
| ไฟล์ config | `.github/workflows/*.yml` | `.gitlab-ci.yml` (ไฟล์เดียว) |
| หน่วยหลัก | workflow → job → step | stage → job → script |
| Runner | GitHub-hosted / self-hosted | GitLab Runner (self-hosted ง่าย) |
| Registry ในตัว | GHCR | Container Registry (built-in) |
| Reusable | composite / reusable workflow | `include:` + `extends:` |

---

:::tip[สำเร็จแล้ว!]
ตอนนี้มี GitLab pipeline ที่ test → build image → push → deploy (manual) ครบวงจรแล้ว
:::

:::note[Challenge]
เพิ่ม stage `security` ที่รัน **Trivy** scan image ก่อน push
**Hint:** ใช้ image `aquasec/trivy` แล้วสั่ง `trivy image --exit-code 1 --severity HIGH,CRITICAL <image>`
เพื่อให้ pipeline **fail** ถ้าเจอช่องโหว่ระดับสูง
:::
