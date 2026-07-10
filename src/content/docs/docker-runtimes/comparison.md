---
title: "รัน Docker บน Mac / Windows — เลือกเครื่องมือไหนดี"
description: เปรียบเทียบ Docker Desktop, Colima, OrbStack, Rancher Desktop, Podman Desktop
---

Docker engine จริงๆ ทำงานบน **Linux** — เวลาใช้บน macOS หรือ Windows เครื่องมือพวกนี้จะปั้น **Linux VM** ให้เบื้องหลัง แล้วให้เราใช้ `docker` ได้เหมือนอยู่บน Linux

หน้านี้ช่วยเลือกว่าควรใช้ตัวไหน แล้วไปดูวิธีติดตั้งในหน้าย่อยของแต่ละตัว

## ตารางเปรียบเทียบ

| เครื่องมือ | OS | ราคา | GUI | K8s ในตัว | จุดเด่น |
|---|---|---|---|---|---|
| **Docker Desktop** | Mac / Win / Linux | ฟรีส่วนตัว* | ✅ | ✅ | ทางการ, ecosystem ครบ, มือใหม่เริ่มง่าย |
| **Colima** | Mac / Linux | ฟรี (OSS) | ❌ (CLI) | ✅ | เบา, ยืดหยุ่น, ไม่มีเงื่อนไข license |
| **OrbStack** | Mac เท่านั้น | ฟรีส่วนตัว / จ่ายเชิงพาณิชย์ | ✅ | ✅ | **เร็วมาก + ประหยัดแบต**, มี Linux machines |
| **Rancher Desktop** | Mac / Win / Linux | ฟรี (OSS) | ✅ | ✅ | GUI + k8s (k3s) ในตัว, ฟรีเต็มตัว |
| **Podman Desktop** | Mac / Win / Linux | ฟรี (OSS) | ✅ | ✅ | สาย Podman / rootless / daemonless |

\* **Docker Desktop** ฟรีสำหรับใช้ส่วนตัว/การศึกษา/บริษัทเล็ก แต่บริษัทใหญ่ (มากกว่า 250 คน หรือรายได้เกิน $10M/ปี) ต้องซื้อ license

## เลือกยังไงดี

:::tip[แนะนำตามสถานการณ์]
- **เพิ่งเริ่ม / อยากได้ GUI ครบๆ** → Docker Desktop
- **Mac (Apple Silicon) อยากได้เร็ว+เบาที่สุด** → OrbStack
- **ไม่อยากติดเงื่อนไข license, ชอบ CLI, อยาก config เอง** → Colima
- **อยากได้ GUI ฟรีเต็มตัว + Kubernetes ในตัว** → Rancher Desktop
- **สายความปลอดภัย / rootless / daemonless** → Podman Desktop (ดู [Podman](/container-tools/cheatsheet))
:::

## เรื่องที่ควรรู้ก่อนเลือก

**License** — ตัวที่มีค่าใช้จ่ายในองค์กรคือ Docker Desktop (บริษัทใหญ่) ที่เหลือเป็น open source / ฟรี (OrbStack ฟรีเฉพาะส่วนตัว)

**ทรัพยากร** — ทุกตัวรัน Linux VM เบื้องหลัง กิน RAM/CPU ตามที่ตั้งไว้ OrbStack ขึ้นชื่อเรื่องกินน้อยและ start ไว ส่วน Docker Desktop มักหนักสุด

**Compatibility** — ทุกตัวให้คำสั่ง `docker` / `docker compose` ใช้ได้เหมือนกัน สลับไปมาได้ไม่ต้องแก้ command (ยกเว้น Podman ที่ใช้ `podman` แต่ก็ทำ alias ได้)

:::note[Windows ต้องมี WSL2]
บน Windows เครื่องมือส่วนใหญ่ (Docker Desktop, Rancher Desktop, Podman Desktop) ใช้ **WSL2** เป็น backend
เปิดใช้ก่อนด้วย: `wsl --install` แล้ว restart เครื่อง
:::

---

ไปดูวิธีติดตั้งแต่ละตัว:
- [Docker Desktop](/docker-runtimes/docker-desktop)
- [Colima](/docker-runtimes/colima)
- [OrbStack](/docker-runtimes/orbstack)
