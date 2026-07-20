---
title: "Level 0 — Network Foundations"
description: "OSI/TCP-IP model, IP address, port, TCP vs UDP — รากฐานของเน็ตเวิร์กทั้งหมด"
---

ก่อนจะเข้าใจ routing, firewall หรือ cloud network ต้องเข้าใจ "โมเดล" ที่อธิบายว่าข้อมูลเดินทางยังไงก่อน

---

## 1. OSI Model — 7 ชั้น

โมเดลมาตรฐานที่อธิบายการสื่อสารเป็น 7 ชั้น (จำจากล่างขึ้นบน):

| ชั้น | ชื่อ | ทำอะไร | ตัวอย่าง |
|---|---|---|---|
| 7 | Application | แอปที่ผู้ใช้เห็น | HTTP, DNS, SSH |
| 6 | Presentation | เข้ารหัส/แปลงรูปแบบ | TLS, JPEG |
| 5 | Session | จัดการ session | - |
| 4 | Transport | ส่งข้อมูลต้นทาง-ปลายทาง | TCP, UDP |
| 3 | Network | หาเส้นทาง (routing) | IP, ICMP |
| 2 | Data Link | ส่งใน network เดียวกัน | Ethernet, MAC, ARP |
| 1 | Physical | สาย/สัญญาณ | สาย LAN, Wi-Fi |

:::tip[วิธีจำ]
"**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing" (7→1)
:::

---

## 2. TCP/IP Model — 4 ชั้น (ที่ใช้จริง)

โลกจริงใช้โมเดลนี้ ยุบ OSI ให้เหลือ 4 ชั้น:

```
Application   (7,6,5)  → HTTP, DNS, SSH
Transport     (4)      → TCP, UDP
Internet      (3)      → IP
Network Access(2,1)    → Ethernet, Wi-Fi
```

---

## 3. Encapsulation — data เดินทางยังไง

ทุกชั้นห่อข้อมูลเพิ่ม header ของตัวเอง (เหมือนใส่ซองซ้อนกัน):

```
[Ethernet [ IP [ TCP [ HTTP data ] ] ] ]
   L2       L3    L4      L7
```

ปลายทางแกะทีละชั้นย้อนกลับ (decapsulation)

---

## 4. IP Address

**IPv4** — เลข 32 บิต เขียนเป็น 4 ชุด เช่น `192.168.1.10`

**Private vs Public:**
| ประเภท | ช่วง | ใช้ที่ไหน |
|---|---|---|
| Private | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | ในบ้าน/องค์กร (ออกเน็ตผ่าน NAT) |
| Public | นอกเหนือจากนั้น | บน internet โดยตรง |
| Loopback | `127.0.0.1` | เครื่องตัวเอง |

**IPv6** — 128 บิต (เพราะ IPv4 ใกล้หมด) เช่น `2001:db8::1`

---

## 5. Port & Protocol

**Port** = "ประตู" ระบุ service บนเครื่องเดียวกัน (0–65535)

Port สำคัญที่ต้องจำ:
| Port | Service |
|---|---|
| 22 | SSH |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |
| 3306 | MySQL |
| 5432 | PostgreSQL |

---

## 6. TCP vs UDP — ต่างกันยังไง

| | TCP | UDP |
|---|---|---|
| การเชื่อมต่อ | มี (3-way handshake) | ไม่มี |
| ความน่าเชื่อถือ | รับประกันครบ+เรียงถูก | ไม่รับประกัน |
| ความเร็ว | ช้ากว่า | เร็วกว่า |
| ใช้กับ | web, email, file | streaming, game, DNS |

**TCP 3-way handshake:**
```
Client → SYN →     Server
Client ← SYN-ACK ← Server
Client → ACK →     Server
(เชื่อมต่อสำเร็จ)
```

---

## สรุป

| แนวคิด | จำสั้นๆ |
|---|---|
| OSI | 7 ชั้น (Physical → Application) |
| TCP/IP | 4 ชั้นที่ใช้จริง |
| IP | ที่อยู่ของเครื่อง (private/public) |
| Port | ประตูของ service |
| TCP/UDP | น่าเชื่อถือ vs เร็ว |

ลงมือ → [Lab 01 — สำรวจเน็ตเวิร์กด้วยตัวเอง](/network/foundations/lab-01) 🧪
