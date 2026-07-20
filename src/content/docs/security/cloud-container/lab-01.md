---
title: "Lab 01 — Hardening Container + สแกนช่องโหว่"
description: "ลงมือทำ container ให้ปลอดภัยขึ้น เปรียบเทียบ root vs non-root และสแกนด้วย Trivy"
---

## เป้าหมาย

- เห็นความต่างระหว่าง container ที่รันแบบ **root** กับ **non-root**
- ลอง flag จำกัดสิทธิ์ (`--read-only`, `--cap-drop`)
- สแกนช่องโหว่ image ด้วย Trivy และอ่านผล

:::caution
ทำบนเครื่อง local เท่านั้น
:::

---

## สิ่งที่ต้องมี

```bash
docker --version
# Trivy (ถ้ายังไม่มี)
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
trivy --version
```

---

## Exercise 1 — ดูว่า container รันเป็น root อยู่ไหม

```bash
# รัน image ทั่วไป แล้วเช็ค user
docker run --rm alpine id
```
ผลลัพธ์ `uid=0(root)` — **ค่า default คือ root!** ถ้า container นี้โดนเจาะ ผู้โจมตีได้สิทธิ์ root ใน container ทันที

```bash
# รันแบบ non-root
docker run --rm -u 1000:1000 alpine id
```
คราวนี้ `uid=1000` — ปลอดภัยขึ้น

---

## Exercise 2 — พิสูจน์ว่า read-only ช่วยได้จริง

```bash
# ปกติ เขียนไฟล์ได้ (ผู้โจมตีฝัง backdoor ได้)
docker run --rm alpine sh -c "touch /evil && echo 'เขียนไฟล์สำเร็จ'"

# read-only → เขียนไม่ได้
docker run --rm --read-only alpine sh -c "touch /evil || echo 'ถูกบล็อก! เขียนไม่ได้'"
```

สังเกตว่าอันหลังเขียนไฟล์ไม่ได้ — ลด attack surface ได้จริง

---

## Exercise 3 — Drop capabilities

```bash
# ดู capability ที่ container มี (ping ต้องใช้ NET_RAW)
docker run --rm alpine sh -c "ping -c1 127.0.0.1"

# ตัด capability ทั้งหมด → ping ทำไม่ได้ (แต่แอปปกติไม่ต้องใช้)
docker run --rm --cap-drop=ALL alpine sh -c "ping -c1 127.0.0.1 || echo 'ไม่มีสิทธิ์ ping = ดีถ้าแอปเราไม่ต้อง ping'"
```

**บทเรียน:** ให้ capability เท่าที่แอปต้องใช้จริงเท่านั้น

---

## Exercise 4 — สแกนช่องโหว่ image ด้วย Trivy

```bash
# สแกน image เก่าๆ จะเจอช่องโหว่เพียบ
trivy image --severity HIGH,CRITICAL node:18-alpine

# เทียบกับ image ที่ใหม่กว่า
trivy image --severity HIGH,CRITICAL node:22-alpine
```

**สังเกต:** image เก่ามักมีช่องโหว่มากกว่า → บทเรียนคือ **อัปเดต base image สม่ำเสมอ** (โยงกับ OWASP A06 Vulnerable Components)

---

## Exercise 5 — เขียน Dockerfile ที่ปลอดภัยแล้วเทียบ

สร้างไฟล์ `Dockerfile.secure`:
```dockerfile
FROM alpine:3.20
RUN addgroup -S app && adduser -S app -G app
USER app
CMD ["id"]
```

```bash
docker build -f Dockerfile.secure -t myapp-secure .
docker run --rm --read-only --cap-drop=ALL myapp-secure
# ควรเห็น uid=... (ไม่ใช่ 0)

# สแกน Dockerfile หา misconfig
trivy config Dockerfile.secure
```

---

## Exercise 6 (ท้าทาย) — สแกน Kubernetes config

ถ้ามี Minikube/cluster (จาก [K8s track](/kubernetes/lab-01)):
```bash
# สแกน manifest หา misconfig
trivy config ./k8s-manifests/

# หรือถ้ามี kube-bench เช็คตาม CIS
# docker run --rm --pid=host aquasec/kube-bench:latest
```

ลองหา finding แล้วแก้ตาม concept ที่เรียน (runAsNonRoot, drop capabilities ฯลฯ)

---

## เก็บกวาด

```bash
rm -f Dockerfile.secure
docker rmi myapp-secure 2>/dev/null
```

---

## สรุปสิ่งที่ได้

| Exercise | บทเรียน |
|---|---|
| 1-3 | non-root + read-only + drop caps ลด attack surface จริง |
| 4 | image เก่ามีช่องโหว่ → อัปเดตสม่ำเสมอ |
| 5-6 | สแกน config/manifest หา misconfig อัตโนมัติ |

**ต่อไป:** Level 4 — [Offensive Security](/security/offensive/concepts) เรียนมุมผู้โจมตีเพื่อป้องกันให้เก่งขึ้น
กลับไป [Roadmap](/security/roadmap) 🚀
