---
title: "Lab 01 — สำรวจเน็ตเวิร์กเครื่องตัวเอง"
description: "ดู IP, port, การเชื่อมต่อจริงบนเครื่องด้วยคำสั่งพื้นฐาน แล้วเข้าใจ OSI/TCP-IP"
---

## เป้าหมาย

- ดู IP address และ interface ของเครื่องตัวเอง
- เข้าใจ port ที่เปิดอยู่และ connection ที่ active
- เห็น TCP handshake จริง

:::note[Requirements]
```bash
# ส่วนใหญ่มีมากับ Linux/macOS อยู่แล้ว
ip a       # หรือ ifconfig
ss --version 2>/dev/null || netstat --version
```
:::

---

## Exercise 1 — ดู IP ของเครื่องตัวเอง

```bash
# ดู interface + IP ทั้งหมด (Linux)
ip a

# macOS
ifconfig
```

มองหา:
- `lo` / `127.0.0.1` = loopback (เครื่องตัวเอง)
- interface จริง (เช่น `eth0`, `wlan0`, `en0`) → IP ตัวนี้คือของคุณใน network

**คำถาม:** IP คุณขึ้นต้นด้วย `192.168.` หรือ `10.` ไหม? ถ้าใช่ = private IP (อยู่หลัง NAT)

---

## Exercise 2 — ดู default gateway (ทางออกสู่ internet)

```bash
ip route          # Linux
netstat -rn       # macOS/ทั่วไป
```

บรรทัด `default via X.X.X.X` = router ที่พาคุณออก internet (จะเรียนละเอียดใน Level 3)

---

## Exercise 3 — ดู port/connection ที่ active

```bash
# ดู port ที่เปิด listen อยู่ + connection
ss -tunlp          # Linux (t=tcp u=udp n=numeric l=listen p=process)

# ถ้าไม่มี ss
netstat -tunlp
```

สังเกตคอลัมน์ State (`LISTEN`, `ESTABLISHED`) และ port — นี่คือ Layer 4 (Transport) ที่เรียนมา

---

## Exercise 4 — ทดสอบการเชื่อมต่อ (ICMP / Layer 3)

```bash
# ping = ส่ง ICMP echo (Layer 3)
ping -c 4 8.8.8.8        # ping ด้วย IP ตรงๆ
ping -c 4 google.com     # ping ด้วยชื่อ (ต้องผ่าน DNS ก่อน)
```

ถ้า ping IP ได้แต่ ping ชื่อไม่ได้ = เน็ตต่อได้แต่ **DNS มีปัญหา** (จะเรียน DNS ใน Level 1)

---

## Exercise 5 — เห็น TCP handshake จริง

```bash
# เปิด connection TCP ไป port 443 แล้วดูว่าต่อได้ไหม
curl -v https://example.com 2>&1 | head -20
```

สังเกตบรรทัด `Connected to ...` = 3-way handshake สำเร็จ + ตามด้วย TLS (Layer 6) แล้วค่อยส่ง HTTP (Layer 7)

**นี่คือ encapsulation ที่เรียนมา:** Ethernet → IP → TCP → TLS → HTTP ทำงานจริงในคำสั่งเดียว

---

## Exercise 6 (ท้าทาย) — map คำสั่งเข้ากับ OSI

จับคู่แต่ละคำสั่งกับชั้น OSI ที่มันทำงาน:

| คำสั่ง | ชั้น OSI |
|---|---|
| `ip a` | Layer ? |
| `ping` | Layer ? |
| `ss -t` | Layer ? |
| `curl http://...` | Layer ? |

<details>
<summary>เฉลย</summary>

- `ip a` → L3 (Network/IP) + L2 (MAC)
- `ping` → L3 (ICMP)
- `ss -t` → L4 (TCP)
- `curl http` → L7 (Application)
</details>

---

## สรุปสิ่งที่ได้

- ✅ รู้ IP, gateway, port ของเครื่องตัวเอง
- ✅ เห็นความต่างของ ping IP vs ชื่อ (DNS)
- ✅ เห็น TCP handshake + encapsulation จริง

**ต่อไป:** Level 1 — [Protocols & Tools](/network/protocols/concepts) เจาะ DNS, HTTP และเครื่องมือ diagnose
กลับไป [Roadmap](/network/roadmap) 🚀
