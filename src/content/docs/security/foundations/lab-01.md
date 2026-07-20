---
title: "Lab 01 — จัด Lab Environment ให้พร้อมฝึก Security"
description: "ตั้งสนามซ้อมปลอดภัยบนเครื่อง local ด้วย Docker: OWASP Juice Shop + เครื่องมือพื้นฐาน"
---

## เป้าหมาย

- เข้าใจว่าทำไมต้องมี **lab แยก** ก่อนฝึก security
- รันเว็บแอปที่ "จงใจให้มีช่องโหว่" (OWASP Juice Shop) บนเครื่องตัวเองด้วย Docker
- ลองใช้เครื่องมือพื้นฐานสำรวจระบบ (nmap, curl)

:::caution[กฎเหล็กก่อนเริ่ม]
ทุกอย่างในบทนี้ทำบน **เครื่อง local ของคุณเอง** เท่านั้น ห้ามยิงเครื่องมือ scan/attack ใส่ระบบหรือ IP ของคนอื่นโดยไม่ได้รับอนุญาตเด็ดขาด — ผิดกฎหมาย
:::

---

## สิ่งที่ต้องมี

:::note[Requirements]
```bash
# ต้องมี Docker (ดู track Docker ถ้ายังไม่ได้ติดตั้ง)
docker --version

# เครื่องมือสำรวจพื้นฐาน
# Linux (Debian/Ubuntu)
sudo apt install -y nmap curl

# macOS
brew install nmap curl
```
:::

---

## Exercise 1 — รันเป้าหมายฝึก (OWASP Juice Shop)

**Juice Shop** คือเว็บร้านขายน้ำผลไม้ที่ OWASP สร้างขึ้นมาให้ "มีช่องโหว่ครบทุกแบบ" สำหรับฝึกโดยเฉพาะ

```bash
# ดึง image และรัน (เปิดที่ port 3000)
docker run --rm -d -p 3000:3000 --name juice-shop bkimminich/juice-shop

# เช็คว่ารันอยู่
docker ps
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000** — จะเห็นหน้าร้านน้ำผลไม้ เล่นได้ตามปกติ แต่เบื้องหลังมีช่องโหว่ให้เราหา

:::tip
Juice Shop มีระบบ "challenge" ในตัว เข้าหน้า Score Board (ลองหาเองว่าซ่อนอยู่ตรงไหน 😉 — นี่คือ challenge แรกเลย!) จะเห็นรายการช่องโหว่ที่ต้องหาให้เจอ
:::

---

## Exercise 2 — สำรวจว่ามี port อะไรเปิดอยู่ (Recon เบื้องต้น)

การโจมตี/ป้องกันเริ่มจาก "รู้ว่าเป้าหมายเปิดอะไรไว้บ้าง"

```bash
# scan port ของ localhost
nmap -sV localhost

# หรือระบุช่วง port
nmap -p 1-10000 localhost
```

สังเกตว่าจะเห็น port **3000** เปิดอยู่ พร้อมข้อมูล service — นี่คือสิ่งที่ attacker เห็นเป็นอย่างแรก

**คำถามให้คิด:** ในระบบจริง ถ้าเห็น port แปลกๆ เปิดอยู่ที่เราไม่ได้ตั้งใจเปิด ควรทำยังไง? (คำตอบ: ปิดมัน — ลด attack surface ตาม concept ที่เรียนมา)

---

## Exercise 3 — ส่อง HTTP response ด้วย curl

เครื่องมือง่ายๆ แต่ทรงพลังในการดูว่า server ตอบอะไรกลับมา

```bash
# ดู header ที่ server ส่งกลับ
curl -I http://localhost:3000

# ดู header เต็ม + body
curl -v http://localhost:3000
```

ลองมองหา header ด้าน security เช่น `X-Frame-Options`, `Content-Security-Policy`
Juice Shop จงใจไม่ตั้งบางตัว — นั่นคือช่องโหว่ประเภท **Security Misconfiguration**

---

## Exercise 4 (ท้าทาย) — หาช่องโหว่แรกด้วยตัวเอง

ลองใช้ concept "attacker mindset" ที่เรียนมา:

1. ไปที่หน้า login ของ Juice Shop
2. ลองใส่ในช่อง email: `' OR 1=1--`  และรหัสผ่านอะไรก็ได้
3. สังเกตผลลัพธ์

> ถ้า login ผ่านโดยไม่รู้รหัสจริง = คุณเพิ่งเจอ **SQL Injection** ช่องโหว่อันดับต้นๆ ของ OWASP Top 10!
> (เราจะเรียนละเอียดใน Level 1 — AppSec)

:::note[ทำไมได้ผล]
แอปเอา input ของเราไปต่อกับ SQL query ตรงๆ `... WHERE email='' OR 1=1--'` ทำให้เงื่อนไขเป็นจริงเสมอ นี่คือเหตุผลว่าทำไมต้องใช้ **parameterized query** (จะสอนใน AppSec)
:::

---

## เก็บกวาด

```bash
# หยุดและลบ container เมื่อเล่นเสร็จ
docker stop juice-shop
```

---

## สรุปสิ่งที่ได้

- ✅ มี lab ปลอดภัยบนเครื่องตัวเองไว้ฝึกแล้ว
- ✅ รู้จัก recon เบื้องต้นด้วย `nmap` และ `curl`
- ✅ เจอช่องโหว่จริงตัวแรก (SQL Injection) ด้วยตัวเอง

**ต่อไป:** Level 1 — Application Security เจาะลึก OWASP Top 10 (กำลังทยอยเพิ่ม)
กลับไปดู [Roadmap](/security/roadmap) เพื่อเลือกก้าวต่อไป 🚀
