---
title: "Level 1 — Protocols & Diagnostic Tools"
description: "DNS, HTTP/HTTPS, DHCP, ARP, ICMP และเครื่องมือ diagnose เน็ตเวิร์กที่ต้องใช้เป็น"
---

รู้จักโปรโตคอลหลักที่ทำงานเบื้องหลังทุกครั้งที่คุณเปิดเว็บ + เครื่องมือหาสาเหตุเมื่อเน็ตมีปัญหา

---

## 1. DNS — สมุดโทรศัพท์ของ internet

แปลง **ชื่อ** (google.com) → **IP** (142.250.x.x) เพราะคนจำชื่อได้ แต่เครื่องคุยกันด้วย IP

**ขั้นตอน (แบบย่อ):**
```
เครื่องคุณ → Resolver → Root → TLD (.com) → Authoritative → ได้ IP กลับมา
```

ชนิด record ที่ต้องรู้:
| Record | หมายถึง |
|---|---|
| A | ชื่อ → IPv4 |
| AAAA | ชื่อ → IPv6 |
| CNAME | ชื่อ → ชื่ออื่น (alias) |
| MX | mail server |
| TXT | ข้อความ (เช่น SPF, verification) |

---

## 2. HTTP / HTTPS

โปรโตคอลของเว็บ — request/response

**Request:**
```
GET /index.html HTTP/1.1
Host: example.com
```

**Status code ที่ต้องจำ:**
| Code | ความหมาย |
|---|---|
| 2xx | สำเร็จ (200 OK) |
| 3xx | redirect (301, 302) |
| 4xx | ผิดฝั่ง client (404 ไม่เจอ, 403 ห้าม) |
| 5xx | ผิดฝั่ง server (500, 502, 503) |

**HTTPS** = HTTP + TLS (เข้ารหัส) — ทำงานที่ port 443

---

## 3. DHCP — แจก IP อัตโนมัติ

เวลาต่อ Wi-Fi แล้วได้ IP เองโดยไม่ต้องตั้ง = DHCP ทำงาน

**ขั้นตอน DORA:**
```
Discover → Offer → Request → Acknowledge
(client หา)  (server เสนอ IP)  (client ขอ)  (server ยืนยัน)
```

---

## 4. ARP — จับคู่ IP กับ MAC

ใน network เดียวกัน เครื่องคุยกันด้วย **MAC address** (Layer 2) ไม่ใช่ IP
ARP ถาม "ใครถือ IP นี้? บอก MAC มาหน่อย" → ได้ MAC เพื่อส่ง frame

---

## 5. ICMP — โปรโตคอลวินิจฉัย

ใช้แจ้งสถานะ/ทดสอบ ไม่ได้ส่งข้อมูลผู้ใช้ — `ping` และ `traceroute` ใช้ ICMP

---

## 6. เครื่องมือ Diagnose (ต้องใช้เป็น!)

| เครื่องมือ | ใช้ทำ |
|---|---|
| `ping` | เช็คว่าถึงปลายทางไหม (ICMP) |
| `traceroute` / `tracert` | ดูเส้นทางผ่าน router กี่ hop |
| `dig` / `nslookup` | query DNS |
| `curl` / `wget` | ทดสอบ HTTP |
| `ss` / `netstat` | ดู port/connection |
| `nc` (netcat) | ทดสอบ TCP/UDP port |

**ตัวอย่าง dig:**
```bash
dig google.com          # หา A record
dig google.com MX       # หา mail server
dig +short google.com   # เอาแค่ IP
```

---

## กระบวนการ Troubleshoot เน็ต (ไล่จากล่างขึ้นบน)

```
1. มี IP ไหม?        → ip a
2. ออก gateway ได้?  → ping gateway
3. ออก internet ได้? → ping 8.8.8.8
4. DNS ทำงานไหม?     → dig google.com / ping google.com
5. service ตอบไหม?   → curl https://...
```

:::tip
จำลำดับนี้ไว้ เวลา "เน็ตเสีย" จะหาสาเหตุได้เป็นระบบ ไม่ใช่เดามั่ว
:::

---

## สรุป

| โปรโตคอล | หน้าที่ |
|---|---|
| DNS | ชื่อ → IP |
| HTTP/S | เว็บ (request/response) |
| DHCP | แจก IP อัตโนมัติ |
| ARP | IP → MAC |
| ICMP | ทดสอบ/แจ้งสถานะ |

ลงมือ → [Lab 01 — ใช้เครื่องมือ diagnose จริง](/network/protocols/lab-01) 🧪
