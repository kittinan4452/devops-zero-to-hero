---
title: "Level 5 — Network Security"
description: "firewall & segmentation, VPN, TLS/SSL และการวิเคราะห์ traffic ด้วย Wireshark"
---

Network Security คือสะพานเชื่อม Network กับ [Security track](/security/roadmap) — ป้องกันข้อมูลตอนเดินทางบนเครือข่าย

:::note
Level นี้ต่อยอดจาก Linux Networking (Level 4) และทับซ้อนกับ [Security Level 5 Blue Team](/security/blueteam/concepts)
:::

---

## 1. Firewall & Network Segmentation

**Firewall** = ด่านกรอง traffic ตาม rule (IP, port, protocol)

ประเภท:
| ประเภท | ทำงานที่ชั้น | ตัวอย่าง |
|---|---|---|
| Packet filter | L3/L4 (IP/port) | iptables |
| Stateful | จำ connection state | nftables, firewalld |
| Application (WAF) | L7 (เนื้อหา HTTP) | ModSecurity, Cloudflare |

**Network Segmentation** — แบ่งเครือข่ายเป็นโซน จำกัดการเคลื่อนที่ของผู้โจมตี
```
[ Internet ] → [ DMZ: web server ] → [ Internal: DB ]
              firewall            firewall
```
DB ไม่ควรเข้าถึงจาก internet ตรงๆ — ต้องผ่านหลายด่าน (defense in depth)

---

## 2. VPN & Tunneling

**VPN** (Virtual Private Network) = สร้าง "อุโมงค์เข้ารหัส" ผ่าน internet เหมือนอยู่ใน network เดียวกัน

ใช้เมื่อ:
- ทำงาน remote เข้าถึงระบบภายในองค์กรอย่างปลอดภัย
- เชื่อม 2 สาขา (site-to-site)
- ปกป้องความเป็นส่วนตัวบน public Wi-Fi

เทคโนโลยี: **WireGuard** (ใหม่ เร็ว เรียบง่าย), OpenVPN, IPsec

```
เครื่องคุณ ──[ เข้ารหัสในอุโมงค์ ]──▶ VPN Server ──▶ ปลายทาง
   คนดักกลางทางเห็นแต่ข้อมูลที่เข้ารหัส
```

---

## 3. TLS/SSL — เข้ารหัสการสื่อสาร

TLS ทำให้ HTTP → HTTPS (และ protocol อื่นๆ ปลอดภัยขึ้น)

**TLS handshake (ย่อ):**
```
1. Client Hello  (เสนอ cipher ที่รองรับ)
2. Server ส่ง certificate (พิสูจน์ตัวตน)
3. ตกลง key ร่วมกัน (key exchange)
4. เริ่มสื่อสารแบบเข้ารหัส
```

TLS ให้ 3 อย่าง:
- **Confidentiality** — เข้ารหัส คนดักไม่เห็นเนื้อหา
- **Integrity** — ข้อมูลไม่ถูกแก้ระหว่างทาง
- **Authentication** — ยืนยันว่าคุยกับ server จริง (ผ่าน certificate/CA)

:::tip[ตรวจ certificate เอง]
```bash
openssl s_client -connect example.com:443 -servername example.com
# ดู cert, CA, วันหมดอายุ
```
:::

---

## 4. Traffic Analysis — Wireshark

**Wireshark** = tcpdump แบบมี GUI + วิเคราะห์ลึก แยกแต่ละชั้น protocol ให้ดู

ใช้ทำ:
- debug ปัญหาเน็ต (ทำไม connection ล้มเหลว?)
- วิเคราะห์การโจมตี (traffic ผิดปกติ, scan, exfiltration)
- เรียนรู้ว่า protocol ทำงานยังไงจริงๆ

**เทคนิค:** capture ด้วย tcpdump บน server แล้วเปิดใน Wireshark บนเครื่องตัวเอง
```bash
sudo tcpdump -i any -w capture.pcap
# แล้วเปิด capture.pcap ใน Wireshark
```

Wireshark filter ที่ใช้บ่อย: `http`, `tcp.port == 443`, `ip.addr == 1.2.3.4`, `dns`

---

## 5. ภัยคุกคามระดับ network + การป้องกัน

| ภัย | คืออะไร | ป้องกัน |
|---|---|---|
| MITM (man-in-the-middle) | ดักกลางทาง | TLS, VPN, HSTS |
| Port scanning | สำรวจ port เปิด | firewall, IDS/IPS |
| DDoS | ถล่มจนล่ม | rate limit, CDN, cloud protection |
| ARP spoofing | ปลอม MAC ใน LAN | dynamic ARP inspection |
| DNS spoofing | ปลอม DNS response | DNSSEC, DoH/DoT |

---

## สรุป

| หัวข้อ | จำ |
|---|---|
| Firewall | กรอง traffic + แบ่งโซน (segmentation) |
| VPN | อุโมงค์เข้ารหัสผ่าน internet |
| TLS | เข้ารหัส + integrity + auth (HTTPS) |
| Wireshark | วิเคราะห์ packet ลึก |

ลงมือ → [Lab 01 — วิเคราะห์ traffic + TLS](/network/security/lab-01) 🧪
