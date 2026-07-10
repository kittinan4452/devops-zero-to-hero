---
title: "Cheatsheet - คำสั่ง Linux ที่ใช้บ่อย"
description: รวมคำสั่ง Linux ที่ใช้บ่อย ไว้เปิดดูเวลาลืม
---

หน้ารวมคำสั่งไว้เปิดเร็วๆ เวลาลืม — กดปุ่ม copy ที่มุมขวาบนของแต่ละ block ได้เลย

## ไฟล์ & ไดเรกทอรี

| คำสั่ง | ทำอะไร |
|---|---|
| `pwd` | แสดง path ปัจจุบัน |
| `ls -lah` | list แบบละเอียด + ไฟล์ซ่อน + ขนาดอ่านง่าย |
| `cd -` | กลับไป directory ก่อนหน้า |
| `mkdir -p a/b/c` | สร้างโฟลเดอร์ซ้อนกันทีเดียว |
| `cp -r src/ dst/` | copy ทั้งโฟลเดอร์ |
| `mv a b` | ย้าย / เปลี่ยนชื่อ |
| `rm -rf dir/` | ลบทั้งโฟลเดอร์ (ระวัง!) |
| `ln -s target link` | สร้าง symbolic link |
| `tree -L 2` | ดูโครงสร้างโฟลเดอร์ 2 ชั้น |

## ดู & แก้ไฟล์

| คำสั่ง | ทำอะไร |
|---|---|
| `cat file` | แสดงทั้งไฟล์ |
| `less file` | เลื่อนดูทีละหน้า (กด `q` ออก) |
| `head -n 20 file` / `tail -n 20 file` | ดู 20 บรรทัดแรก / ท้าย |
| `tail -f log` | ตามดู log แบบ real-time |
| `nano file` / `vim file` | แก้ไฟล์ |
| `wc -l file` | นับจำนวนบรรทัด |

## ค้นหา (find / grep)

```bash
# หาไฟล์ตามชื่อ
find . -name "*.log"

# หาไฟล์ที่แก้ล่าสุด 1 วัน
find . -type f -mtime -1

# ค้นข้อความในไฟล์ (recursive + เลขบรรทัด)
grep -rn "TODO" .

# กรอง output จาก pipe
ps aux | grep nginx

# นับจำนวนที่เจอ
grep -c "error" app.log
```

## สิทธิ์ (permissions)

| คำสั่ง | ทำอะไร |
|---|---|
| `chmod +x script.sh` | ทำให้ไฟล์รันได้ |
| `chmod 644 file` | rw-r--r-- (ไฟล์ทั่วไป) |
| `chmod 755 dir` | rwxr-xr-x (โฟลเดอร์/สคริปต์) |
| `chown user:group file` | เปลี่ยนเจ้าของ |
| `sudo !!` | รันคำสั่งก่อนหน้าซ้ำด้วย sudo |

## Process & ทรัพยากร

| คำสั่ง | ทำอะไร |
|---|---|
| `top` / `htop` | ดู process + CPU/RAM แบบสด |
| `ps aux` | list process ทั้งหมด |
| `kill -9 <PID>` | บังคับปิด process |
| `pkill -f "python app"` | ปิด process ตามชื่อ |
| `jobs` / `fg` / `bg` | จัดการ background job |
| `nohup cmd &` | รันต่อแม้ปิด terminal |
| `free -h` | ดู RAM ที่ใช้ |
| `df -h` | ดูพื้นที่ disk |
| `du -sh *` | ขนาดของแต่ละไฟล์/โฟลเดอร์ |

## Networking

| คำสั่ง | ทำอะไร |
|---|---|
| `curl -I https://site.com` | ดู HTTP header |
| `curl -fsSL url \| bash` | ดาวน์โหลดสคริปต์แล้วรัน |
| `wget url` | โหลดไฟล์ |
| `ss -ltnp` | ดู port ที่เปิดฟังอยู่ (แทน netstat) |
| `ping -c 4 host` | ping 4 ครั้ง |
| `ip a` | ดู IP ของเครื่อง |
| `ssh user@host` | เชื่อมต่อ SSH |
| `scp file user@host:/path` | copy ไฟล์ผ่าน SSH |

## บีบอัด / แตกไฟล์

```bash
tar -czf out.tar.gz dir/     # บีบเป็น .tar.gz
tar -xzf out.tar.gz          # แตก .tar.gz
zip -r out.zip dir/          # zip
unzip out.zip                # unzip
```

## Package manager

| Distro | ติดตั้ง | อัปเดต |
|---|---|---|
| Ubuntu/Debian | `sudo apt install <pkg>` | `sudo apt update && sudo apt upgrade` |
| Fedora/RHEL | `sudo dnf install <pkg>` | `sudo dnf upgrade` |
| Alpine | `apk add <pkg>` | `apk update && apk upgrade` |

## ทางลัดที่ช่วยประหยัดเวลา

| คำสั่ง / ปุ่ม | ทำอะไร |
|---|---|
| `Ctrl + R` | ค้นประวัติคำสั่ง (reverse search) |
| `Ctrl + C` / `Ctrl + D` | หยุด process / ออกจาก shell |
| `Ctrl + L` | เคลียร์หน้าจอ (เหมือน `clear`) |
| `history \| grep docker` | หาคำสั่งเก่าที่เคยพิมพ์ |
| `!123` | รันคำสั่งลำดับที่ 123 ใน history |
| `cmd1 && cmd2` | รัน cmd2 ต่อเมื่อ cmd1 สำเร็จ |
| `cmd \| tee file` | แสดง output + เขียนลงไฟล์ |

:::tip[อยากฝึกจริง?]
ไปที่ [Lab 01 - คำสั่งพื้นฐาน](/linux/lab-01) เพื่อลองใช้คำสั่งเหล่านี้แบบมีโจทย์
:::
