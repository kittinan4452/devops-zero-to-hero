---
title: "Lab 01 - คำสั่ง Linux พื้นฐาน"
---

## เป้าหมาย

- ฝึกใช้คำสั่ง navigation, file management, และ process
- เขียน shell script อย่างง่าย

## สิ่งที่ต้องมี


:::note[Requirements]
- Linux หรือ macOS terminal
- หรือ [Play with Docker](https://labs.play-with-docker.com/) (ฟรี, ใช้ browser)
:::

---

## Exercise 1 — Navigation & Files

```bash
# 1. สร้างโครงสร้างโฟลเดอร์สำหรับ project
mkdir -p ~/devops-lab/{scripts,logs,configs}

# 2. สร้างไฟล์ทดสอบ
echo "Hello DevOps" > ~/devops-lab/configs/app.conf
echo "error: something failed" >> ~/devops-lab/logs/app.log
echo "info: server started" >> ~/devops-lab/logs/app.log

# 3. ดูโครงสร้าง
ls -la ~/devops-lab/
```

**ผลลัพธ์ที่ควรได้:**
```
total 0
drwxr-xr-x  5 user user  ...
drwxr-xr-x  2 user user  ... configs/
drwxr-xr-x  2 user user  ... logs/
drwxr-xr-x  2 user user  ... scripts/
```

---

## Exercise 2 — ค้นหาและกรองข้อมูล

```bash
# ค้นหาเฉพาะบรรทัดที่มี "error"
grep "error" ~/devops-lab/logs/app.log

# ค้นหาไฟล์ทุก .log ใน devops-lab
find ~/devops-lab -name "*.log"

# นับจำนวน process ที่รันอยู่
ps aux | wc -l
```

---

## Exercise 3 — Shell Script

สร้างไฟล์ `~/devops-lab/scripts/health-check.sh`:

```bash
#!/bin/bash

# Health check script

LOGFILE=~/devops-lab/logs/health.log
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

check_disk() {
    USAGE=$(df -h / | awk 'NR==2 {print $5}')
    echo "[$TIMESTAMP] Disk usage: $USAGE"
}

check_memory() {
    FREE=$(free -h | awk 'NR==2 {print $4}')
    echo "[$TIMESTAMP] Free memory: $FREE"
}

check_disk | tee -a $LOGFILE
check_memory | tee -a $LOGFILE

echo "[$TIMESTAMP] Health check done." | tee -a $LOGFILE
```

รัน script:
```bash
chmod +x ~/devops-lab/scripts/health-check.sh
~/devops-lab/scripts/health-check.sh
cat ~/devops-lab/logs/health.log
```

---

## Exercise 4 — Process & Port

```bash
# ดู process ที่กิน CPU เยอะสุด
ps aux --sort=-%cpu | head -5

# ดู port ที่เปิดอยู่
ss -tulpn

# ดู disk usage แต่ละโฟลเดอร์
du -sh ~/devops-lab/*
```

---


:::tip[สำเร็จแล้ว!]
ถ้าทำ exercise ครบทั้งหมดแล้ว แสดงว่าพร้อมไปต่อที่ **Docker** ได้เลย
:::


:::note[Challenge เพิ่มเติม]
แก้ไข `health-check.sh` ให้ส่ง alert เมื่อ disk usage เกิน 80%
**Hint:** ใช้ `if` statement เพื่อเปรียบเทียบค่า
:::
