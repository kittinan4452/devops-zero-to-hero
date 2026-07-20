---
title: "Lab 01 — เครื่องมือ Diagnose เน็ตเวิร์ก"
description: "ฝึกใช้ dig, traceroute, curl, nc วิเคราะห์ DNS/HTTP และไล่หาสาเหตุปัญหาเน็ต"
---

## เป้าหมาย

- Query DNS ด้วย dig และอ่านผล
- ดูเส้นทาง packet ด้วย traceroute
- ทดสอบ HTTP และ TCP port
- ฝึกกระบวนการ troubleshoot

:::note[Requirements]
```bash
# Linux
sudo apt install -y dnsutils traceroute curl netcat-openbsd
# macOS
brew install netcat   # dig/traceroute/curl มีมาให้แล้ว
```
:::

---

## Exercise 1 — เจาะ DNS ด้วย dig

```bash
dig google.com                # A record เต็มๆ
dig +short google.com         # เอาแค่ IP
dig google.com MX +short      # mail server
dig google.com AAAA +short    # IPv6
```

**ลองเปลี่ยน DNS server:**
```bash
dig @1.1.1.1 example.com      # ถามผ่าน Cloudflare DNS
dig @8.8.8.8 example.com      # ถามผ่าน Google DNS
```

**คำถาม:** ผลต่างกันไหม? (ปกติควรได้ IP เดียวกัน — พิสูจน์ว่า DNS เป็นระบบกระจาย)

---

## Exercise 2 — ดูเส้นทางด้วย traceroute

```bash
traceroute google.com     # Linux/macOS
# tracert google.com      # Windows
```

แต่ละบรรทัด = 1 router (hop) ที่ packet ผ่าน สังเกตว่ากว่าจะถึงปลายทางผ่านกี่ hop และ hop ไหนช้า

---

## Exercise 3 — วิเคราะห์ HTTP ด้วย curl

```bash
# ดูเฉพาะ status + header
curl -I https://example.com

# ดู request/response เต็ม (verbose)
curl -v https://example.com 2>&1 | head -30

# ตาม redirect
curl -IL http://google.com     # ดูว่ามัน 301 ไป https ไหม
```

จับ status code: 200? 301? 403? — โยงกับตารางที่เรียนมา

---

## Exercise 4 — ทดสอบ port ด้วย netcat

```bash
# เช็คว่า port เปิดไหม (เช่น web server)
nc -zv example.com 443       # z=scan, v=verbose
nc -zv example.com 80

# ลอง port ที่น่าจะปิด
nc -zv example.com 12345
```

`succeeded` = port เปิด, `refused/timeout` = ปิด/ถูกบล็อก — เครื่องมือนี้ช่วยเช็คว่า service ปลายทางฟังอยู่ไหม

---

## Exercise 5 — จำลอง server ง่ายๆ ด้วย netcat

```bash
# หน้าต่างที่ 1: เปิด server ฟัง port 8000
nc -l 8000

# หน้าต่างที่ 2: ต่อเข้าไปแล้วพิมพ์ข้อความ
nc localhost 8000
# พิมพ์อะไรก็ได้ → จะไปโผล่ที่หน้าต่างแรก
```

คุณเพิ่งสร้าง TCP connection ด้วยมือ — เห็นภาพ client-server ชัดๆ

---

## Exercise 6 (ท้าทาย) — Troubleshoot แบบมีระบบ

จำลองไล่ปัญหาตามลำดับที่เรียนมา แล้วจดผลแต่ละขั้น:
```bash
ip a | grep inet          # 1. มี IP ไหม
ip route | grep default   # 2. มี gateway ไหม
ping -c2 8.8.8.8          # 3. ออกเน็ตได้ไหม (IP)
dig +short google.com     # 4. DNS ทำงานไหม
curl -I https://google.com # 5. service ตอบไหม
```

ถ้าขั้นไหน fail = คุณเจอจุดที่ปัญหาอยู่ทันที

---

## สรุปสิ่งที่ได้

| เครื่องมือ | ใช้ตรวจ |
|---|---|
| dig | DNS |
| traceroute | เส้นทาง/hop |
| curl | HTTP/service |
| nc | TCP port + client-server |

**ต่อไป:** Level 2 — [Subnetting](/network/subnetting/concepts) เรื่องที่คนกลัวแต่จริงๆ ไม่ยาก
กลับไป [Roadmap](/network/roadmap) 🚀
