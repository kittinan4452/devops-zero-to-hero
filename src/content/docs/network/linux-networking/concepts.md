---
title: "Level 4 — Linux Networking"
description: "จัดการ network บน Linux ด้วย ip/ss, firewall (iptables/nftables/ufw) และ packet capture ด้วย tcpdump"
---

DevOps/Security ทำงานบน Linux เป็นหลัก — ต้องจัดการเน็ตด้วย command line ได้คล่อง Level นี้คือทักษะที่ใช้จริงทุกวัน

---

## 1. คำสั่งยุคใหม่ (`ip` แทนของเก่า)

คำสั่งเก่า (`ifconfig`, `route`, `netstat`) ถูกแทนด้วยชุด `ip` และ `ss`:

| ของเก่า | ของใหม่ | ใช้ทำ |
|---|---|---|
| `ifconfig` | `ip addr` | ดู/ตั้ง IP |
| `route` | `ip route` | routing table |
| `netstat` | `ss` | port/connection |
| `arp` | `ip neigh` | ARP table |

```bash
ip addr show           # ดู IP ทุก interface
ip -br addr            # แบบย่อ อ่านง่าย
ip route               # routing table
ip neigh               # ARP table (IP ↔ MAC)
ss -tunlp              # port ที่ listen + process
```

---

## 2. ตั้งค่า interface ชั่วคราว

```bash
# เพิ่ม IP ให้ interface (หายเมื่อ reboot)
sudo ip addr add 192.168.50.10/24 dev eth0

# เปิด/ปิด interface
sudo ip link set eth0 up
sudo ip link set eth0 down

# เพิ่ม route
sudo ip route add 10.0.0.0/24 via 192.168.1.1
```

:::note
การตั้งแบบนี้ **ชั่วคราว** — ตั้งถาวรต้องแก้ไฟล์ config (netplan / NetworkManager / systemd-networkd แล้วแต่ distro)
:::

---

## 3. Firewall บน Linux

มี 3 ระดับที่เจอบ่อย:

### ufw — ง่ายสุด (Ubuntu)
```bash
sudo ufw enable
sudo ufw allow 22/tcp          # เปิด SSH
sudo ufw allow 80,443/tcp      # เปิด web
sudo ufw deny 3306             # ปิด MySQL จากข้างนอก
sudo ufw status verbose
```

### iptables — คลาสสิก (ควบคุมละเอียด)
```bash
# ดู rule ปัจจุบัน
sudo iptables -L -n -v

# อนุญาต SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# บล็อก IP
sudo iptables -A INPUT -s 1.2.3.4 -j DROP
```

### nftables — รุ่นใหม่แทน iptables
```bash
sudo nft list ruleset
```

**หลักการ firewall:** default `DROP` แล้วเปิดเฉพาะที่จำเป็น (least exposure — โยงกับ Security)

---

## 4. Packet Capture ด้วย tcpdump

ดู packet จริงที่วิ่งผ่าน interface — เครื่องมือ debug ที่ทรงพลังสุด

```bash
# จับ packet บน interface
sudo tcpdump -i eth0

# เฉพาะ port 80 (HTTP)
sudo tcpdump -i eth0 port 80

# เฉพาะ host หนึ่ง + แสดงเนื้อหา
sudo tcpdump -i any host 8.8.8.8 -nn

# บันทึกเป็นไฟล์ไปเปิดใน Wireshark
sudo tcpdump -i eth0 -w capture.pcap
```

flag: `-nn` (ไม่ resolve ชื่อ/port), `-i any` (ทุก interface)

---

## 5. เครื่องมือทดสอบเน็ตอื่นๆ

| เครื่องมือ | ใช้ |
|---|---|
| `mtr` | traceroute + ping รวมกัน (real-time) |
| `iperf3` | วัด bandwidth ระหว่าง 2 เครื่อง |
| `nmap` | scan port/service |
| `dig` | query DNS |

---

## 6. ไฟล์ config สำคัญ

| ไฟล์ | ทำอะไร |
|---|---|
| `/etc/hosts` | map ชื่อ → IP แบบ manual (ก่อน DNS) |
| `/etc/resolv.conf` | ตั้ง DNS server ที่ใช้ |
| `/etc/nsswitch.conf` | ลำดับการ resolve ชื่อ |

---

## สรุป

| งาน | คำสั่ง |
|---|---|
| ดู IP | `ip -br addr` |
| ดู route | `ip route` |
| ดู port | `ss -tunlp` |
| firewall | `ufw` / `iptables` / `nft` |
| จับ packet | `tcpdump` |

ลงมือ → [Lab 01 — จัดการเน็ต + firewall + tcpdump](/network/linux-networking/lab-01) 🧪
