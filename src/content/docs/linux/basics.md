---
title: "Linux Fundamentals"
---

Linux คือระบบปฏิบัติการที่ใช้กันอย่างแพร่หลายใน server และ infrastructure ทั้งหมดใน DevOps จำเป็นต้องใช้ Linux เป็น

---

## Filesystem Structure

```
/
├── bin/     # คำสั่งพื้นฐาน (ls, cp, mv)
├── etc/     # config files
├── home/    # home directory ของ user
├── var/     # log files, variable data
├── tmp/     # temporary files
├── usr/     # user programs
└── proc/    # virtual filesystem สำหรับ kernel/process info
```

---

## คำสั่งที่ใช้บ่อย

### จัดการไฟล์และโฟลเดอร์

```bash
ls -la              # list ไฟล์แบบ detailed
pwd                 # แสดง current directory
cd /path/to/dir     # เปลี่ยน directory
mkdir -p dir/sub    # สร้างโฟลเดอร์ (และ parent)
cp -r src/ dst/     # copy แบบ recursive
mv old new          # ย้าย/เปลี่ยนชื่อ
rm -rf dir/         # ลบโฟลเดอร์ (ระวัง!)
find . -name "*.log" # ค้นหาไฟล์
```

### ดูและแก้ไขไฟล์

```bash
cat file.txt        # แสดงเนื้อหาไฟล์
less file.txt       # แสดงแบบเลื่อนได้ (q เพื่อออก)
head -20 file.txt   # แสดง 20 บรรทัดแรก
tail -f app.log     # ติดตาม log แบบ real-time
grep "error" file   # ค้นหาข้อความในไฟล์
vim file.txt        # แก้ไขไฟล์ด้วย vim
```

### Process Management

```bash
ps aux              # แสดง process ทั้งหมด
top                 # monitor process แบบ real-time
htop                # top แบบ interactive (ต้องติดตั้งเพิ่ม)
kill -9 <PID>       # kill process ด้วย PID
pkill nginx         # kill process ด้วยชื่อ
```

### Networking

```bash
ip addr             # แสดง network interface
curl -I https://example.com  # HTTP request
wget https://example.com/file.tar.gz  # download ไฟล์
netstat -tulpn      # แสดง port ที่เปิดอยู่
ss -tulpn           # เหมือน netstat (modern)
ping google.com     # ทดสอบ connectivity
```

### Permissions

```bash
chmod 755 script.sh     # rwxr-xr-x
chmod +x script.sh      # เพิ่ม execute permission
chown user:group file   # เปลี่ยน owner
sudo command            # รันด้วย root privilege
```

---

## Shell Scripting เบื้องต้น

```bash
#!/bin/bash

# Variables
NAME="DevOps"
echo "Hello, $NAME"

# Conditions
if [ -f "/etc/hosts" ]; then
    echo "file exists"
fi

# Loops
for i in 1 2 3; do
    echo "Iteration $i"
done

# Functions
greet() {
    echo "Hello, $1"
}
greet "World"
```

---

## Environment Variables

```bash
export MY_VAR="value"       # set variable
echo $MY_VAR                # อ่านค่า
env                         # แสดงทุก env var
unset MY_VAR                # ลบ variable
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - คำสั่งพื้นฐาน](/linux/lab-01) เพื่อฝึกใช้งานจริง
:::
