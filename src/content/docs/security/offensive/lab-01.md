---
title: "Lab 01 — Recon + Web Exploitation"
description: "ฝึกขั้นตอน pentest จริงบน lab ของตัวเอง: nmap recon, exploit ช่องโหว่ web, หา privesc เบื้องต้น"
---

## เป้าหมาย

- ทำ recon + scanning ด้วย nmap
- Exploit ช่องโหว่ web แบบมีขั้นตอน (ตาม pentest lifecycle)
- รู้จักการหา privilege escalation เบื้องต้น

:::caution[กฎเหล็ก]
ทุก exercise ทำบน **Juice Shop / VM ของตัวเอง** หรือ **แพลตฟอร์มฝึกที่อนุญาต** เท่านั้น ห้ามยิงใส่ IP/domain ที่ไม่ใช่ของคุณเด็ดขาด
:::

---

## เตรียม Lab

```bash
docker run --rm -d -p 3000:3000 --name juice-shop bkimminich/juice-shop
# เครื่องมือ
sudo apt install -y nmap nikto   # หรือ brew install nmap nikto
```

---

## Exercise 1 — Recon & Scanning

```bash
# ขั้น scanning: หา port + service + version
nmap -sV -p 3000 localhost

# script พื้นฐาน (default scripts)
nmap -sC -sV -p 3000 localhost
```

จดไว้: service อะไร เวอร์ชันไหน — ข้อมูลนี้ใช้หาว่ามี CVE ที่รู้จักไหม

---

## Exercise 2 — สแกนช่องโหว่ web อัตโนมัติ

```bash
# Nikto สแกน misconfig / ไฟล์อันตราย
nikto -h http://localhost:3000
```

อ่านผล: มี security header ครบไหม? มี path ที่ไม่ควรเปิดไหม? (โยงกับ OWASP A05)

---

## Exercise 3 — Exploitation แบบมีขั้นตอน

ใช้ทักษะ Level 1 มาทำเป็นกระบวนการ pentest:

1. **ระบุช่องโหว่** — หน้า login น่าจะมี SQLi (จาก recon เห็นว่าเป็น web app)
2. **ยืนยัน** — ลอง `admin@juice-sh.op'--` ในช่อง email
3. **Exploit** — login สำเร็จเป็น admin
4. **บันทึกหลักฐาน (PoC)** — screenshot + payload ที่ใช้ + ผลลัพธ์

:::tip[คิดแบบมืออาชีพ]
ทุกครั้งที่ exploit สำเร็จ ให้จด: (1) payload อะไร (2) ทำไมได้ผล (3) แก้ยังไง — นี่คือวัตถุดิบของ "รายงาน" ที่เป็นหัวใจงาน pentest
:::

---

## Exercise 4 — Privilege Escalation (บน VM ของคุณ)

ลองบน Linux VM ที่คุณควบคุมได้:
```bash
# มองหาทางยกระดับสิทธิ์
sudo -l                              # รันอะไรเป็น root ได้บ้าง
find / -perm -4000 2>/dev/null       # SUID binaries
cat /etc/crontab                     # cron ที่รันเป็น root
```

นำผลไปเทียบกับ **GTFOBins** (gtfobins.github.io) ว่า binary ที่เจอ abuse ยกระดับสิทธิ์ได้ไหม

**ฝั่ง defense:** ผลลัพธ์นี้บอกเราว่าต้องปิด SUID/สิทธิ์ sudo ตัวไหนบ้าง

---

## Exercise 5 (ท้าทาย) — ทำ PortSwigger Lab

ไปที่ **portswigger.net/web-security** (ฟรี, ถูกกฎหมาย 100%):

1. ทำ lab "SQL injection" ระดับ Apprentice ให้ผ่าน 2 ข้อ
2. ทำ lab "Access control" 1 ข้อ
3. จดว่าแต่ละ lab สอนเทคนิคอะไร

นี่คือแหล่งฝึก AppSec/Offensive ที่ดีที่สุดในโลก และฟรีทั้งหมด

---

## เขียนรายงานสั้นๆ (สำคัญ!)

ลองเขียน mini-report จาก Exercise 3:
```
ช่องโหว่: SQL Injection ที่หน้า Login
ความรุนแรง: Critical
หลักฐาน: email = admin@juice-sh.op'-- → login เป็น admin ได้โดยไม่รู้รหัส
ผลกระทบ: ผู้โจมตี login เป็นใครก็ได้ / ดึงข้อมูลทั้ง DB
วิธีแก้: ใช้ parameterized query, validate input
```

---

## เก็บกวาด

```bash
docker stop juice-shop
```

---

## สรุปสิ่งที่ได้

| Exercise | ขั้น pentest |
|---|---|
| 1-2 | Recon & Scanning (nmap, nikto) |
| 3 | Exploitation แบบมีขั้นตอน |
| 4 | Privilege Escalation เบื้องต้น |
| report | Reporting — หัวใจของงานจริง |

**ต่อไป:** Level 5 — [Blue Team / Defense](/security/blueteam/concepts) ฝั่งตั้งรับและตรวจจับ
กลับไป [Roadmap](/security/roadmap) 🚀
