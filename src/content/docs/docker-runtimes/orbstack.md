---
title: "ติดตั้ง OrbStack"
description: วิธีติดตั้ง OrbStack — รัน Docker บน macOS แบบเร็วและเบา
---

**OrbStack** เป็นตัวรัน Docker + Linux machines บน macOS ที่ขึ้นชื่อเรื่อง **เร็ว, เบา, ประหยัดแบต** และ start ไวมาก เป็น drop-in แทน Docker Desktop ได้เลย

:::note[macOS เท่านั้น]
OrbStack รองรับเฉพาะ macOS (Apple Silicon และ Intel) — ฟรีสำหรับใช้ส่วนตัว ส่วนใช้เชิงพาณิชย์ต้องซื้อ license
:::

## ติดตั้ง

```bash
# Homebrew (แนะนำ)
brew install orbstack
```

หรือโหลดจาก https://orbstack.dev/ แล้วลากเข้า Applications

เปิดแอป OrbStack ครั้งแรก มันจะตั้งค่า Docker context ให้อัตโนมัติ

## ตรวจสอบว่าใช้งานได้

```bash
docker --version
docker run --rm hello-world
docker compose version
```

ถ้าเคยใช้ Docker Desktop อยู่ OrbStack จะ**ย้าย container/image เดิมมาให้** ตอนตั้งค่าครั้งแรกได้

## จุดเด่นของ OrbStack

| ด้าน | รายละเอียด |
|---|---|
| ความเร็ว | start VM ในไม่กี่วินาที, ใช้ CPU/RAM น้อยกว่า Docker Desktop มาก |
| แบตเตอรี่ | กินพลังงานต่ำ เหมาะกับ MacBook |
| Networking | เข้าถึง container ผ่าน domain `<name>.orb.local` ได้เลย |
| Linux machines | รัน Linux distro เต็มๆ ได้ (นอกจาก container) |
| Kubernetes | เปิดใช้ได้จาก Settings |

## Linux Machines (โบนัส)

นอกจาก container OrbStack ยังสร้าง Linux VM เต็มรูปแบบได้:

```bash
# สร้าง Ubuntu VM
orb create ubuntu

# เข้าไปใช้งาน
orb -m ubuntu
```

## เปิด Kubernetes

เปิดแอป → **Settings → Kubernetes → Enable** — ได้ cluster ใช้กับ `kubectl` ทันที

:::tip[อยากได้ตัวที่ข้ามแพลตฟอร์ม (มี Windows/Linux ด้วย)?]
OrbStack เป็น macOS เท่านั้น — ถ้าต้องใช้หลาย OS ดู [Docker Desktop](/docker-runtimes/docker-desktop) หรือ [Colima](/docker-runtimes/colima)
:::
