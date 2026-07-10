---
title: "Lab 03 - Jenkins Pipeline"
---

## เป้าหมาย

- รัน Jenkins บนเครื่อง local ด้วย Docker
- สร้าง **Declarative Pipeline** ด้วย `Jenkinsfile`
- ใช้ stages, credentials, และ post actions
- เข้าใจความต่างของ Jenkins (self-hosted, plugin-based) กับ CI บน cloud

## สิ่งที่ต้องมี

:::note[Requirements]
- Docker ติดตั้งบนเครื่อง
- Git + Python app จาก [Lab 01](/cicd/lab-01)
- RAM อย่างน้อย 2GB ว่างให้ Jenkins
:::

---

## Exercise 1 — รัน Jenkins ด้วย Docker

```bash
# สร้าง network + volume เก็บข้อมูล Jenkins
docker network create jenkins
docker volume create jenkins-data

# รัน Jenkins LTS
docker run -d --name jenkins \
  --network jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  jenkins/jenkins:lts

# ดู log เพื่อรอ Jenkins พร้อม
docker logs -f jenkins
```

เอา **initial admin password**:
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

เปิด `http://localhost:8080` → วาง password → **Install suggested plugins** → สร้าง admin user

---

## Exercise 2 — Pipeline แรก (Hello Jenkins)

1. หน้าแรก → **New Item** → ตั้งชื่อ `hello` → เลือก **Pipeline** → OK
2. เลื่อนลงไปที่ช่อง **Pipeline script** วางโค้ดนี้:

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'กำลัง build...'
                sh 'echo build เสร็จ'
            }
        }
        stage('Test') {
            steps {
                echo 'กำลัง test...'
            }
        }
    }

    post {
        success { echo '✅ Pipeline สำเร็จ' }
        failure { echo '❌ Pipeline ล้มเหลว' }
    }
}
```

3. **Save** → **Build Now** → ดู **Stage View** และ **Console Output**

:::note[Declarative vs Scripted]
`pipeline { ... }` คือ **Declarative Pipeline** (แนะนำ อ่านง่าย มีโครงสร้างชัด)
ส่วนแบบเก่า `node { ... }` คือ **Scripted Pipeline** (เป็น Groovy เต็มรูปแบบ ยืดหยุ่นกว่าแต่ซับซ้อน)
:::

---

## Exercise 3 — Jenkinsfile ใน Repo (Pipeline from SCM)

วิธีที่ใช้จริง: เก็บ pipeline เป็นไฟล์ `Jenkinsfile` ใน repo

สร้าง `Jenkinsfile` ที่ root ของ Python app:

```groovy
pipeline {
    agent {
        docker { image 'python:3.11-slim' }   // รัน stage ใน container
    }

    stages {
        stage('Install') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }
        stage('Lint') {
            steps {
                sh 'pip install flake8 && flake8 app.py --max-line-length=100'
            }
        }
        stage('Test') {
            steps {
                sh 'pytest -v --junitxml=report.xml'
            }
        }
    }

    post {
        always {
            junit 'report.xml'      // เก็บผล test ให้ Jenkins แสดง
        }
    }
}
```

ผูก Jenkins เข้ากับ repo:
1. **New Item** → `cicd-lab` → **Pipeline** → OK
2. ส่วน **Pipeline** เลือก **Pipeline script from SCM**
3. SCM = **Git**, ใส่ URL repo, branch `*/main`
4. Script Path = `Jenkinsfile`
5. **Save** → **Build Now**

---

## Exercise 4 — Credentials + Build Docker Image

เก็บ secret ให้ปลอดภัย: **Manage Jenkins → Credentials → System → Global → Add Credentials**
(เช่น Docker Hub: Kind = *Username with password*, ID = `dockerhub`)

ใช้ใน Jenkinsfile:

```groovy
stage('Build & Push Image') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub',
            usernameVariable: 'DH_USER',
            passwordVariable: 'DH_PASS'
        )]) {
            sh '''
                echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                docker build -t "$DH_USER/cicd-lab:${BUILD_NUMBER}" .
                docker push "$DH_USER/cicd-lab:${BUILD_NUMBER}"
            '''
        }
    }
}
```

:::caution[ให้ Jenkin build image ได้]
stage ที่สั่ง `docker build` ต้องเข้าถึง Docker daemon — วิธีง่ายสุดในแล็บคือ mount socket ตอนรัน Jenkins:
`-v /var/run/docker.sock:/var/run/docker.sock` (ระวังเรื่องความปลอดภัยบน production)
:::

---

## Cleanup

```bash
docker stop jenkins && docker rm jenkins
docker volume rm jenkins-data
docker network rm jenkins
```

---

## เทียบกับ GitHub Actions / GitLab CI

| | Jenkins | GitHub Actions / GitLab CI |
|---|---|---|
| ที่รัน | self-hosted (คุณดูแลเอง) | cloud-managed (หรือ self-hosted runner) |
| Config | `Jenkinsfile` (Groovy) | YAML |
| Ecosystem | plugin เยอะมาก (1800+) | marketplace / templates |
| เหมาะกับ | องค์กรที่ต้องคุม infra เอง, legacy | โปรเจกต์บน Git platform อยู่แล้ว |

---

:::tip[สำเร็จแล้ว!]
ตอนนี้รัน Jenkins เอง + มี Jenkinsfile ที่ lint → test → build image ครบแล้ว
:::

:::note[Challenge]
เพิ่ม stage ที่ใช้ **`when { branch 'main' }`** ให้ build image เฉพาะตอน merge เข้า main
แล้วลองเพิ่ม **parallel stages** ให้ lint กับ test รันพร้อมกัน (`parallel { ... }`)
:::
