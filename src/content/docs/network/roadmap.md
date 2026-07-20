---
title: "🌐 Network Roadmap — จากศูนย์สู่ระดับโปร"
description: "เส้นทางเรียน Networking ภาษาไทย ตั้งแต่ OSI model, subnetting, routing จนถึง network security และ cloud networking"
---

ยินดีต้อนรับสู่ **Network Zero to Hero** 🌐

Networking คือรากฐานของทุกอย่าง — DevOps, Security, Cloud ล้วนตั้งอยู่บนความเข้าใจเน็ตเวิร์ก
แนะนำเรียนตามลำดับ **Level 0 → 6** แต่ละหัวข้อมี **Concepts** + **Labs** ลงมือทำจริง

:::tip[เรียนยังไงให้ได้ผล]
Network เข้าใจยากถ้าอ่านอย่างเดียว — **ต้องลองยิงคำสั่ง + ดู packet จริง** ทุก lab ทำบนเครื่อง local ได้ ไม่ต้องมีอุปกรณ์ราคาแพง
:::

---

## ภาพรวมเส้นทาง

```
Level 0  Foundations       OSI/TCP-IP model, IP, port, protocol
   │
Level 1  Protocols & Tools DNS, HTTP, DHCP, ARP + เครื่องมือ diagnose
   │
Level 2  Subnetting        IP addressing, CIDR, subnet mask, VLSM
   │
Level 3  Routing & Switch  routing, NAT, VLAN, gateway
   │
Level 4  Linux Networking  interface, firewall, ss/ip, packet capture
   │
Level 5  Network Security  firewall, VPN, TLS, Wireshark analysis
   │
Level 6  Cloud & Advanced  VPC, K8s networking, load balancer + certs
```

---

## Level 0 — Foundations (พื้นฐาน) 🟢 Beginner

- **OSI Model & TCP/IP Model** — 7 ชั้น / 4 ชั้น ต่างกันยังไง
- **IP Address** — IPv4/IPv6, public vs private
- **Port & Protocol** — TCP vs UDP, port ที่ต้องรู้
- **Encapsulation** — data เดินทางผ่านแต่ละชั้นยังไง

👉 [Foundations Concepts](/network/foundations/concepts) + [Lab 01](/network/foundations/lab-01)

---

## Level 1 — Protocols & Diagnostic Tools 🟢 Beginner

- **DNS** — แปลงชื่อเป็น IP
- **HTTP/HTTPS** — request/response, status code
- **DHCP, ARP, ICMP** — โปรโตคอลเบื้องหลัง
- **เครื่องมือ** — ping, traceroute, dig, curl, ss, netstat

👉 [Protocols Concepts](/network/protocols/concepts) + [Lab 01](/network/protocols/lab-01)

---

## Level 2 — Subnetting & IP Addressing 🟡 Intermediate

- **Subnet mask & CIDR** — /24 คืออะไร คิดยังไง
- **แบ่ง subnet** — คำนวณ network, broadcast, host range
- **VLSM** — แบ่ง subnet ขนาดไม่เท่ากัน

👉 [Subnetting Concepts](/network/subnetting/concepts) + [Lab 01](/network/subnetting/lab-01)

---

## Level 3 — Routing & Switching 🟡 Intermediate

- **Routing** — packet หาทางไปปลายทางยังไง, routing table
- **NAT** — private IP ออก internet ได้ยังไง
- **VLAN & Switching** — แบ่งเครือข่าย layer 2
- **Default gateway** — บทบาทของ router

👉 [Routing & Switching Concepts](/network/routing-switching/concepts) + [Lab 01](/network/routing-switching/lab-01)

---

## Level 4 — Linux Networking 🟡→🔴

- **จัดการ interface** — `ip`, `ss` แทนคำสั่งเก่า
- **Firewall** — iptables / nftables / ufw
- **DNS/DHCP บน Linux** — ตั้ง service เอง
- **Packet capture** — tcpdump

👉 [Linux Networking Concepts](/network/linux-networking/concepts) + [Lab 01](/network/linux-networking/lab-01)

---

## Level 5 — Network Security 🔴 Advanced

- **Firewall & Segmentation** — แบ่งโซน จำกัดการเข้าถึง
- **VPN & Tunneling** — เชื่อมเครือข่ายอย่างปลอดภัย
- **TLS/SSL** — เข้ารหัสการสื่อสาร
- **Traffic Analysis** — Wireshark, จับสัญญาณผิดปกติ

👉 [Network Security Concepts](/network/security/concepts) + [Lab 01](/network/security/lab-01)

:::note[เชื่อมกับ Security track]
Level นี้ทับซ้อนกับ [Security Roadmap](/security/roadmap) — network security คือสะพานเชื่อมสองสายเข้าด้วยกัน
:::

---

## Level 6 — Cloud & Advanced Networking + Certs 🎓

- **Cloud Networking** — VPC, subnet, security group, route table
- **Kubernetes Networking** — CNI, Service, Ingress, NetworkPolicy
- **Load Balancing & CDN** — L4/L7, reverse proxy
- **Certs** — CompTIA Network+, Cisco CCNA

👉 [Advanced & Career](/network/advanced)

---

## เริ่มยังไงดี?

1. อ่านหน้านี้ → ไป [Level 0: Foundations](/network/foundations/concepts)
2. ทำ [Lab 01](/network/foundations/lab-01) ให้เห็นภาพจริง
3. เรียนไล่ทีละ level — Network สะสมความเข้าใจ ยิ่งเรียนยิ่งต่อจุดได้

ไปกันเลย 🚀
