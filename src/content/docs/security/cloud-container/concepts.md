---
title: "Level 3 — Cloud & Container Security"
description: "hardening Docker/Kubernetes, IAM least privilege, CIS Benchmark และการหา misconfig บน cloud"
---

ยุคนี้ระบบรันบน container + cloud การโจมตีอันดับต้นๆ ไม่ใช่การ "แฮก" ซับซ้อน แต่คือ **misconfiguration** — ตั้งค่าผิดแล้วเปิดช่องไว้เอง

:::note[ต่อยอดจาก track เดิม]
Level นี้ต่อยอดจาก [Docker](/docker/concepts) และ [Kubernetes](/kubernetes/concepts) ถ้ายังไม่แน่นแนะนำทบทวนก่อน
:::

---

## 1. Container Security — ทำไม container ไม่ใช่ VM

Container ใช้ **kernel ร่วมกับ host** ถ้า container หลุด (escape) อาจกระทบทั้งเครื่อง หลักการกันคือ **จำกัดสิทธิ์ให้แคบที่สุด**

### Hardening Docker — เช็คลิสต์สำคัญ

| ทำ | ทำไม |
|---|---|
| **อย่ารันเป็น root** ใน container | ถ้าหลุดออกมา จะไม่ได้สิทธิ์ root บน host |
| ใช้ **read-only filesystem** | ผู้โจมตีเขียนไฟล์/ฝัง backdoor ไม่ได้ |
| **Drop capabilities** ที่ไม่ใช้ | ลดสิ่งที่ทำได้ใน container |
| ใช้ base image เล็ก (**distroless/alpine**) | attack surface เล็กลง ช่องโหว่น้อยลง |
| อย่าใส่ **secret ใน image** | image ถูกดึงไปดู layer ได้ |

**ตัวอย่าง Dockerfile ที่ปลอดภัยขึ้น:**
```dockerfile
FROM node:20-alpine
# สร้าง user ธรรมดา อย่ารันเป็น root
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --chown=app:app . .
RUN npm ci --omit=dev
USER app                     # ← รันด้วย user ธรรมดา
CMD ["node", "server.js"]
```

**รันแบบจำกัดสิทธิ์:**
```bash
docker run --rm \
  --read-only \                      # fs อ่านอย่างเดียว
  --cap-drop=ALL \                   # ตัด capability ทั้งหมด
  --security-opt=no-new-privileges \ # ห้ามยกระดับสิทธิ์
  -u 1000:1000 \                     # ไม่ใช่ root
  myapp:latest
```

---

## 2. Kubernetes Security

K8s มีพื้นที่ให้ตั้งค่าผิดเยอะ จุดสำคัญที่ต้องคุม:

### RBAC (Role-Based Access Control)
ให้สิทธิ์แบบ **least privilege** — service account ควรทำได้เฉพาะที่จำเป็น
```yaml
# Role ที่อ่าน pod ได้อย่างเดียว ไม่ให้ลบ/แก้
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]     # ไม่มี delete, create
```

### Pod Security — ห้าม privileged
```yaml
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

### NetworkPolicy
Default K8s ให้ทุก pod คุยกันได้หมด → ควรตั้ง policy **default deny** แล้วเปิดเฉพาะที่ต้องการ

### Secrets
- อย่า commit secret ลง Git / manifest
- เปิด **encryption at rest** สำหรับ etcd
- ใช้ external secret manager (Vault, cloud KMS)

---

## 3. Cloud IAM — หัวใจของ cloud security

ช่องโหว่ cloud ส่วนใหญ่ = **สิทธิ์กว้างเกินไป** หรือ **key รั่ว**

- **Least privilege** — อย่าใช้ `*:*` / AdministratorAccess พร่ำเพรื่อ
- อย่า **hardcode access key** ในโค้ด → ใช้ IAM role / workload identity
- เปิด **MFA** สำหรับ account สำคัญ
- **หมุน (rotate)** credential สม่ำเสมอ, ปิด key ที่ไม่ใช้
- อย่าเปิด S3 bucket / storage เป็น public โดยไม่ตั้งใจ (สาเหตุข้อมูลรั่วอันดับต้นๆ)

---

## 4. เครื่องมือหา Misconfig (สแกนอัตโนมัติ)

| เครื่องมือ | สแกนอะไร |
|---|---|
| **Trivy** | image, filesystem, IaC, K8s (all-in-one) |
| **kube-bench** | K8s ตาม CIS Benchmark |
| **kube-hunter** | หาช่องโหว่ใน K8s cluster |
| **Checkov / tfsec** | Terraform / IaC misconfig |
| **Prowler / ScoutSuite** | AWS/GCP/Azure misconfig |
| **Docker Bench** | Docker host ตาม CIS |

:::tip[CIS Benchmark คืออะไร]
ชุดมาตรฐานการตั้งค่าที่ปลอดภัย (hardening guide) มีสำหรับ Linux, Docker, K8s, cloud ฯลฯ — ใช้เป็น checklist ว่าตั้งค่าครบหรือยัง
:::

---

## สรุป

| ระดับ | กันยังไง |
|---|---|
| Container | non-root, read-only, drop caps, image เล็ก |
| Kubernetes | RBAC least privilege, Pod Security, NetworkPolicy |
| Cloud | IAM least privilege, ไม่ hardcode key, MFA |
| ตรวจสอบ | Trivy, kube-bench, Checkov, Prowler |

ลงมือ → [Lab 01 — Hardening Container + สแกน K8s](/security/cloud-container/lab-01) 🧪
