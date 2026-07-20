---
title: "Level 3 — Routing & Switching"
description: "routing table, default gateway, NAT, VLAN และ switching — packet ข้ามเครือข่ายยังไง"
---

Level 2 เราแบ่ง subnet แล้ว — คำถามคือ packet ข้าม subnet/ออก internet ได้ยังไง? คำตอบคือ **routing** และ **switching**

---

## 1. Switching (Layer 2) vs Routing (Layer 3)

| | Switch | Router |
|---|---|---|
| ชั้น | Layer 2 (MAC) | Layer 3 (IP) |
| ทำงานใน | subnet เดียวกัน (LAN) | ข้าม subnet / network |
| ใช้ address | MAC | IP |

**เปรียบเทียบ:** switch = ส่งจดหมายในหมู่บ้านเดียวกัน, router = ส่งข้ามเมือง

---

## 2. Default Gateway

เมื่อเครื่องจะส่ง packet ไป IP ที่ **อยู่คนละ subnet** มันส่งให้ "default gateway" (router) จัดการต่อ

```
เครื่องคุณ (192.168.1.10/24)
   │  จะส่งไป 8.8.8.8 (คนละ subnet)
   ↓
Default Gateway (192.168.1.1) = router
   ↓
ออก internet
```

ถ้าไม่มี gateway = คุยได้แค่ใน subnet ตัวเอง ออกเน็ตไม่ได้

---

## 3. Routing Table

router (และทุกเครื่อง) มีตารางบอกว่า "จะไป network นี้ ส่งทางไหน"

```bash
ip route
# ตัวอย่าง:
# default via 192.168.1.1 dev eth0        ← ไม่รู้จัก ส่งให้ gateway
# 192.168.1.0/24 dev eth0                 ← subnet ตัวเอง ส่งตรง
```

**หลักการเลือกเส้นทาง:** match prefix ที่ **ยาว/เจาะจงที่สุด** (longest prefix match) ก่อน แล้วค่อย default

---

## 4. NAT — private IP ออก internet ยังไง

Private IP (192.168.x.x) ออก internet ตรงๆ ไม่ได้ (ไม่ unique ทั้งโลก)
**NAT** (Network Address Translation) ที่ router แปลง private IP → public IP ของ router

```
192.168.1.10  ─┐
192.168.1.11  ─┼─ Router (NAT) ── Public IP 203.0.113.5 ── Internet
192.168.1.12  ─┘
```

- **SNAT/PAT** — หลายเครื่องแชร์ 1 public IP (แยกด้วย port) — ที่บ้านใช้แบบนี้
- **DNAT / Port Forwarding** — ให้ข้างนอกเข้าถึง server ข้างในได้

---

## 5. VLAN — แบ่ง LAN เป็นส่วนๆ (Layer 2)

VLAN แบ่ง switch กายภาพตัวเดียวเป็นหลายเครือข่ายลอจิคัล — แยก broadcast domain

ประโยชน์:
- **แยกแผนก** (Sales / IT / Guest) แม้เสียบ switch ตัวเดียวกัน
- **ความปลอดภัย** — VLAN ต่างกันคุยกันไม่ได้ ถ้าไม่ผ่าน router/firewall
- ลด broadcast traffic

```
Switch เดียว:
  Port 1-8  → VLAN 10 (Sales)
  Port 9-16 → VLAN 20 (IT)
  ต่างVLANคุยกันต้องผ่าน router (inter-VLAN routing)
```

---

## 6. เส้นทางชีวิตของ packet (สรุปภาพรวม)

```
1. เครื่องต้นทางเช็ค: ปลายทางอยู่ subnet เดียวกันไหม?
   - ใช่  → ARP หา MAC → ส่งตรงผ่าน switch (L2)
   - ไม่  → ส่งให้ default gateway
2. Router ดู routing table → forward ไป hop ถัดไป
3. ผ่าน NAT ถ้าออก internet
4. ทำซ้ำจน router สุดท้ายส่งถึงปลายทาง
```

---

## สรุป

| แนวคิด | จำ |
|---|---|
| Switch | L2, ในsubnet, ใช้ MAC |
| Router | L3, ข้ามsubnet, ใช้ IP |
| Default gateway | ทางออกไป network อื่น |
| NAT | private → public IP |
| VLAN | แบ่ง LAN ลอจิคัล (L2) |

ลงมือ → [Lab 01 — ดู routing table + NAT จริง](/network/routing-switching/lab-01) 🧪
