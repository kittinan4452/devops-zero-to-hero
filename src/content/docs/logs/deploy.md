---
title: "อ่าน Log ฝั่ง Deploy - CI/CD, Docker Build, Terraform, Kubernetes"
description: หาสาเหตุ pipeline แดงให้เจอเร็ว — อ่าน log ของ GitHub Actions, docker build, terraform และ kubectl rollout
---

pipeline แดง = งานด่วนของ DevOps
log ของ CI/CD ยาวเป็นพันบรรทัด แต่ **คำตอบมักอยู่ใน 5–10 บรรทัดเท่านั้น** — หน้านี้สอนวิธีหาให้เจอ

---

## กฎข้อแรก: `exit code 1` ไม่ใช่สาเหตุ

```
...
npm error code EUSAGE                              ← ③ สาเหตุจริงอยู่ตรงนี้
npm error The `npm ci` command can only install with an existing package-lock.json
...
ERROR: failed to solve: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1   ← ② step ที่พัง
##[error]Process completed with exit code 1.     ← ① เห็นอันนี้ก่อน แต่มันแค่บอกว่า "พัง"
```

**วิธีอ่าน:** เริ่มที่บรรทัดสุดท้าย → ไล่ **ขึ้น** จนเจอ error **ตัวแรก** ของ step นั้น

คำที่ควรค้น (Ctrl+F หรือช่อง search ของ log viewer): `error`, `Error:`, `ERR!`, `FAILED`, `fatal`, `denied`, `not found`, `exit code`

---

## GitHub Actions / GitLab CI / Jenkins

| ระบบ | บรรทัดที่บอกว่าพัง |
|---|---|
| GitHub Actions | `##[error]Process completed with exit code 1.` |
| GitLab CI | `ERROR: Job failed: exit code 1` |
| Jenkins | `ERROR: script returned exit code 1` แล้วท้ายสุด `Finished: FAILURE` |

**ทริค GitHub Actions:**

```bash
gh run list --limit 5                 # ดู run ล่าสุด
gh run view <run-id> --log-failed     # ดึงเฉพาะ log ของ step ที่ fail มาที่ terminal
gh run view <run-id> --log | grep -n -i error
gh run rerun <run-id> --failed        # รันใหม่เฉพาะ job ที่ fail
```

- กด **Re-run jobs → Enable debug logging** บนหน้าเว็บ เพื่อให้ log ละเอียดขึ้น (เท่ากับตั้ง secret `ACTIONS_STEP_DEBUG=true`)
- secret ใน log จะถูกแทนด้วย `***` — ถ้าเห็น `***` ในตำแหน่งที่ไม่ควรเป็น secret แปลว่าค่า secret อาจซ้ำกับข้อความทั่วไป

**pipeline ผ่านบนเครื่องเรา แต่พังบน CI** — สาเหตุที่เจอบ่อย:
- ไฟล์ไม่ได้ commit (`package-lock.json`, `.env.example`) หรือถูก `.gitignore`
- version ของ Node/Python บน runner ไม่ตรงกับเครื่องเรา
- ขาด secret / env var (`undefined`, `KeyError`, `401 Unauthorized`)
- ตัวพิมพ์เล็ก/ใหญ่ของชื่อไฟล์ (macOS ไม่สน แต่ Linux สน: `Logo.png` ≠ `logo.png`)

---

## Docker Build (BuildKit)

```
#7 [4/6] RUN npm ci
#7 1.532 npm error code EUSAGE
#7 1.533 npm error The `npm ci` command can only install with an existing package-lock.json or
#7 1.533 npm error npm-shrinkwrap.json with lockfileVersion >= 1. ...
#7 ERROR: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
------
Dockerfile:4
--------------------
   2 |     WORKDIR /app
   3 |     COPY package*.json ./
   4 | >>> RUN npm ci
   5 |     COPY . .
--------------------
ERROR: failed to solve: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
```

| ส่วน | ความหมาย |
|---|---|
| `#7` | หมายเลข step ของ BuildKit — ใช้ตามหาบรรทัดของ step เดียวกัน |
| `[4/6]` | คำสั่งที่ 4 จาก 6 ใน Dockerfile |
| `1.532` | วินาทีที่ผ่านไปใน step นั้น |
| `>>>` | บรรทัดใน Dockerfile ที่พัง |
| `CACHED` | step นี้ใช้ cache ไม่ได้รันใหม่ |

**ดู log เต็ม:** `docker build --progress=plain --no-cache .` (ค่าปกติจะย่อ output ของ step ที่ผ่านแล้ว)

| Error | แปลว่า |
|---|---|
| `failed to calculate checksum of ref ... "/package.json": not found` | ไฟล์ไม่อยู่ใน **build context** — build ผิดโฟลเดอร์ หรือโดน `.dockerignore` |
| `pull access denied for myapp, repository does not exist or may require 'docker login'` | ชื่อ image ผิด หรือยังไม่ login registry |
| `toomanyrequests: You have reached your pull rate limit` | Docker Hub จำกัดการ pull — login หรือใช้ mirror |
| `exec /usr/local/bin/node: exec format error` (ตอนรัน) | image คนละ CPU architecture (build บน Mac M1 = arm64 แต่ server เป็น amd64) → `--platform linux/amd64` |
| `no space left on device` | disk เต็ม → `docker system df`, `docker system prune` |

---

## Terraform

```
Error: creating S3 Bucket (shop-logs): BucketAlreadyExists: The requested bucket name is not available.

  with aws_s3_bucket.logs,
  on main.tf line 12, in resource "aws_s3_bucket" "logs":
  12: resource "aws_s3_bucket" "logs" {
```

อ่านได้ 3 อย่าง: **ทำอะไรอยู่** (creating S3 Bucket) → **cloud ตอบว่าอะไร** (BucketAlreadyExists) → **resource ไหนในโค้ด** (`main.tf` บรรทัด 12)

| Error | แปลว่า |
|---|---|
| `Error acquiring the state lock` | มีคนอื่น (หรือ pipeline อื่น) กำลัง apply อยู่ — **รอ** อย่ารีบ `force-unlock` จนกว่าจะแน่ใจว่าไม่มีใครรันอยู่จริง |
| `AccessDenied` / `UnauthorizedOperation` | credential ที่ใช้ไม่มีสิทธิ์ทำ action นั้น — ดูชื่อ action ในข้อความ |
| `Error: Unsupported argument` / `Missing required argument` | เขียน HCL ผิด หรือ provider version ไม่ตรง |
| `Provider produced inconsistent result after apply` | มักเป็น bug ของ provider — ลอง `plan` ใหม่ |

**อ่าน `plan` ก่อน apply ทุกครั้ง** — นี่คือ log ที่สำคัญที่สุดของ Terraform:

```
  # aws_db_instance.main must be replaced
-/+ resource "aws_db_instance" "main" {
      ~ engine_version = "15.4" -> "16.1" # forces replacement
    }

Plan: 1 to add, 0 to change, 1 to destroy.
```

`+` สร้าง, `~` แก้, `-` ลบ, `-/+` **ลบแล้วสร้างใหม่** — ถ้าเห็น `forces replacement` กับ database แปลว่า **ข้อมูลอาจหาย** ต้องหยุดคิดก่อน

log ละเอียด: `TF_LOG=DEBUG terraform apply 2> tf-debug.log`

---

## Kubernetes Rollout

```bash
kubectl rollout status deploy/web
```
```
Waiting for deployment "web" rollout to finish: 1 out of 3 new replicas have been updated...
error: deployment "web" exceeded its progress deadline
```

rollout ไม่บอกสาเหตุ — ต้องไล่ต่อ 3 ขั้น:

```bash
kubectl get pods -l app=web                          # 1. pod อยู่ในสถานะอะไร
kubectl describe pod <pod>                           # 2. ดู Events ท้ายสุด
kubectl logs <pod> --previous                        # 3. ถ้าแอปรันแล้วตาย ดู log รอบก่อน
kubectl get events --sort-by=.lastTimestamp | tail -20
```

| STATUS ของ pod | ดูที่ไหน | มักแปลว่า |
|---|---|---|
| `ErrImagePull` / `ImagePullBackOff` | `describe` → Events | ชื่อ/tag image ผิด, registry ต้อง login (`imagePullSecrets`) |
| `Pending` | `describe` → `FailedScheduling` | resource ไม่พอ (`Insufficient memory`), nodeSelector/taint ไม่ตรง, PVC ยังไม่ bound |
| `CreateContainerConfigError` | `describe` → Events | ConfigMap / Secret ที่อ้างถึงไม่มี (`secret "db-secret" not found`) |
| `CrashLoopBackOff` | `logs --previous` | แอปเริ่มแล้วตาย — ดู error ของแอป |
| `OOMKilled` | `describe` → `Last State` | ใช้ memory เกิน `limits.memory` |
| `Running` แต่ `READY 0/1` | `describe` → `Readiness probe failed` | แอปยังไม่พร้อม หรือ probe ชี้ path/port ผิด |

ถ้า deploy ใหม่พังและต้องรีบแก้: `kubectl rollout undo deploy/web` แล้วค่อยหาสาเหตุ

ใช้ ArgoCD? ดู `argocd app get <app>` — ช่อง **Sync Status** (OutOfSync/Synced) บอกว่า Git ตรงกับ cluster ไหม ส่วน **Health** (Degraded/Progressing) บอกว่า pod ใช้งานได้ไหม แล้วไล่ต่อด้วย `kubectl` เหมือนเดิม

---

## แบบฝึกหัด

### ข้อ 1 — pipeline แดง

log ด้านล่างมาจาก GitHub Actions ของ PR ที่ผ่านบนเครื่อง dev แต่พังบน CI

```
2026-10-15T04:00:05Z ##[group]Run actions/checkout@v4
2026-10-15T04:00:07Z ##[endgroup]
2026-10-15T04:00:08Z ##[group]Run docker build -t shop:4f2a9c1 .
2026-10-15T04:00:09Z #1 [internal] load build definition from Dockerfile
2026-10-15T04:00:09Z #1 DONE 0.0s
2026-10-15T04:00:10Z #5 [1/6] FROM docker.io/library/node:22-alpine
2026-10-15T04:00:15Z #5 DONE 5.2s
2026-10-15T04:00:15Z #6 [2/6] WORKDIR /app
2026-10-15T04:00:15Z #6 DONE 0.1s
2026-10-15T04:00:15Z #7 [3/6] COPY package*.json ./
2026-10-15T04:00:15Z #7 DONE 0.0s
2026-10-15T04:00:15Z #8 [4/6] RUN npm ci
2026-10-15T04:00:17Z #8 1.532 npm error code EUSAGE
2026-10-15T04:00:17Z #8 1.533 npm error The `npm ci` command can only install with an existing package-lock.json or
2026-10-15T04:00:17Z #8 1.533 npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
2026-10-15T04:00:17Z #8 1.533 npm error later to generate a package-lock.json file, then try again.
2026-10-15T04:00:17Z #8 ERROR: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
2026-10-15T04:00:17Z ERROR: failed to solve: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
2026-10-15T04:00:17Z ##[error]Process completed with exit code 1.
```

**คำถาม:** step ไหนพัง? สาเหตุคืออะไร? ทำไมบนเครื่อง dev ถึงผ่าน? แก้ยังไง?

<details>
<summary>เฉลย</summary>

- พังที่ `#8 [4/6] RUN npm ci`
- สาเหตุ: **ไม่มี `package-lock.json`** ใน build context — `npm ci` ต้องใช้ lockfile เสมอ
- บนเครื่อง dev ผ่านเพราะมี `package-lock.json` อยู่ในเครื่อง แต่ **ไม่ได้ commit** (หรือโดน `.gitignore`) → `actions/checkout` จึงไม่มีไฟล์นี้
- ตรวจ: `git ls-files package-lock.json` (ว่าง = ไม่ได้ track), `git check-ignore -v package-lock.json`
- แก้: เอาออกจาก `.gitignore` แล้ว commit lockfile — **อย่า** แก้ด้วยการเปลี่ยนเป็น `npm install` เพราะ build จะไม่ reproducible
</details>

### ข้อ 2 — rollout ค้าง

```
$ kubectl get pods -l app=web
NAME                   READY   STATUS                       RESTARTS   AGE
web-6d8f7c9b4-2xkqp    1/1     Running                      0          2d
web-6d8f7c9b4-9mzrt    1/1     Running                      0          2d
web-7f5b8d6c1-hj4ws    0/1     CreateContainerConfigError   0          3m

$ kubectl describe pod web-7f5b8d6c1-hj4ws | tail -6
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  3m                 default-scheduler  Successfully assigned default/web-7f5b8d6c1-hj4ws to node-2
  Normal   Pulled     2m (x12 over 3m)   kubelet            Container image "shop:4f2a9c2" already present on machine
  Warning  Failed     2m (x12 over 3m)   kubelet            Error: secret "payment-api-key" not found
```

**คำถาม:**
1. ทำไม pod เก่า 2 ตัวยังรันอยู่? user ได้รับผลกระทบไหม?
2. สาเหตุที่ pod ใหม่ไม่ขึ้นคืออะไร? ทำไม `kubectl logs` ถึงไม่ช่วย?

<details>
<summary>เฉลย</summary>

1. Rolling update จะ **ไม่ลบ pod เก่าจนกว่า pod ใหม่จะ Ready** — ระบบเดิมยังให้บริการอยู่ (นี่คือข้อดีของ rolling update) แต่ถ้าปล่อยไว้ rollout จะ `exceeded its progress deadline`
2. Deployment ใหม่อ้างถึง Secret `payment-api-key` ที่ **ยังไม่ได้สร้าง** ใน namespace นี้ — container ยัง **ไม่เคยเริ่ม** จึงไม่มี log ให้ดู ต้องดูจาก `describe` → Events
   แก้: สร้าง secret (`kubectl create secret generic payment-api-key --from-literal=...`) แล้ว pod จะ retry เอง
</details>

---

:::tip[ต่อไป]
deploy ผ่านแล้วแต่เรียกกันไม่ติด? ไปที่ [อ่าน Log ฝั่ง Network](/logs/network)
:::
