---
title: "Lab 01 — Linux Networking: ip, firewall, tcpdump"
description: "ฝึกจัดการ interface, ตั้ง firewall, และจับ packet จริงด้วย tcpdump"
---

## เป้าหมาย

- ใช้ชุดคำสั่ง `ip` / `ss` คล่อง
- ตั้ง firewall rule ง่ายๆ (ในกล่องปิด)
- จับ packet จริงด้วย tcpdump แล้วอ่านผล

:::caution
ระวังการตั้ง firewall บนเครื่องจริงที่ต่อ SSH อยู่ — อาจตัดตัวเองหลุด ในแล็บนี้เราใช้ container/VM ที่เข้าถึงทาง console ได้
:::

---

## Exercise 1 — สำรวจด้วยชุดคำสั่ง ip/ss

```bash
ip -br addr           # IP แบบย่อ
ip -br link           # สถานะ interface (UP/DOWN)
ip route              # routing table
ip neigh              # ARP table (IP ↔ MAC ที่รู้จัก)
ss -tunlp             # port ที่ listen อยู่
```

**คำถาม:** มี service อะไร listen อยู่บ้าง? port ไหนเปิดสู่ภายนอก (`0.0.0.0`) vs เฉพาะ localhost (`127.0.0.1`)?

---

## Exercise 2 — เล่น interface ใน container (ปลอดภัย)

```bash
# รัน container ที่มีสิทธิ์จัดการ network
docker run --rm -it --cap-add=NET_ADMIN alpine sh

# ข้างใน container:
apk add --no-cache iproute2 2>/dev/null
ip addr add 10.10.10.5/24 dev lo   # เพิ่ม IP ให้ loopback (ทดลอง)
ip -br addr                        # เห็น IP ที่เพิ่ม
exit
```

---

## Exercise 3 — Firewall ด้วย iptables (ใน container)

```bash
docker run --rm -it --cap-add=NET_ADMIN alpine sh
# ข้างใน:
apk add --no-cache iptables

iptables -L -n                       # ดู rule (ว่างเปล่า)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT   # อนุญาต SSH
iptables -A INPUT -s 1.2.3.4 -j DROP            # บล็อก IP
iptables -L -n -v                    # เห็น rule ที่เพิ่ม
exit
```

**บทเรียน:** rule ทำงานตามลำดับบนลงล่าง — อันแรกที่ match ชนะ

---

## Exercise 4 — จับ packet จริงด้วย tcpdump

```bash
# หน้าต่างที่ 1: จับ ICMP (ping) บนทุก interface
sudo tcpdump -i any icmp -nn

# หน้าต่างที่ 2: ยิง ping
ping -c 3 8.8.8.8
```

กลับไปดูหน้าต่างแรก — จะเห็น `echo request` และ `echo reply` เป็นคู่ๆ นี่คือ ICMP ที่เรียนใน Level 1

---

## Exercise 5 — ดู DNS query จริง

```bash
# หน้าต่างที่ 1: จับ DNS (port 53)
sudo tcpdump -i any port 53 -nn

# หน้าต่างที่ 2:
dig example.com
```

เห็น query ออกไปหา DNS server แล้ว response กลับมา — **DNS ที่เรียน ทำงานให้เห็นกับตา**

---

## Exercise 6 — ดู HTTP แบบ plaintext

```bash
# หน้าต่างที่ 1: จับ port 80 พร้อมเนื้อหา (-A = ASCII)
sudo tcpdump -i any port 80 -A -nn

# หน้าต่างที่ 2: ยิง HTTP (ไม่ใช่ HTTPS!)
curl http://example.com
```

เห็น `GET / HTTP/1.1` เป็นข้อความอ่านออก — **นี่คือเหตุผลว่าทำไมต้องใช้ HTTPS** (ถ้าเป็น 443 จะเห็นแต่ข้อมูลเข้ารหัส) → โยงกับ Network Security Level 5

---

## สรุปสิ่งที่ได้

| Exercise | ทักษะ |
|---|---|
| 1-2 | จัดการ interface/route ด้วย `ip`/`ss` |
| 3 | firewall rule ด้วย iptables |
| 4-6 | จับ packet จริง (ICMP, DNS, HTTP) |

**ต่อไป:** Level 5 — [Network Security](/network/security/concepts) firewall, VPN, TLS, Wireshark
กลับไป [Roadmap](/network/roadmap) 🚀
