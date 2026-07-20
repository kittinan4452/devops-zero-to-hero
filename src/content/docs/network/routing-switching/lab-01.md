---
title: "Lab 01 — Routing Table + NAT จริง"
description: "อ่าน routing table, ดู NAT ของ Docker, จำลอง network 2 subnet ด้วย container"
---

## เป้าหมาย

- อ่านและเข้าใจ routing table ของเครื่องตัวเอง
- เห็น NAT ทำงานจริง (ผ่าน Docker)
- จำลอง 2 subnet คุยกันผ่าน gateway

:::note[Requirements]
```bash
docker --version      # ใช้ Docker จำลอง network
ip route              # หรือ netstat -rn บน macOS
```
:::

---

## Exercise 1 — อ่าน routing table ตัวเอง

```bash
ip route          # Linux
netstat -rn       # macOS
```

หาให้เจอ:
- บรรทัด `default via ...` = gateway ของคุณ
- บรรทัด subnet ตัวเอง (เช่น `192.168.1.0/24 dev ...`)

**ทดสอบความเข้าใจ:** ถ้า ping `8.8.8.8` packet ออกทางไหน? (ตอบ: default gateway เพราะ 8.8.8.8 ไม่ match subnet ไหน)

---

## Exercise 2 — ดู NAT ของ Docker

Docker สร้าง network private + NAT ให้ container ออกเน็ต — เหมือน router ที่บ้าน

```bash
# ดู network ของ docker
docker network inspect bridge | grep -i subnet

# รัน container แล้วดู IP ข้างใน (private)
docker run --rm alpine ip a | grep inet

# container ออกเน็ตได้ (ผ่าน NAT)
docker run --rm alpine ping -c2 8.8.8.8
```

container ได้ private IP (เช่น 172.17.x.x) แต่ ping ออกเน็ตได้ → **NAT ทำงาน** เหมือน concept ที่เรียน

---

## Exercise 3 — Port Forwarding (DNAT) จริง

```bash
# -p 8080:80 = forward port 8080 ของ host → port 80 ใน container
docker run --rm -d -p 8080:80 --name web nginx

# เข้าถึง server ข้างในผ่าน port ของ host
curl -I http://localhost:8080
```

นี่คือ **DNAT / port forwarding** — ให้ข้างนอกเข้าถึง service ข้างในได้

```bash
docker stop web
```

---

## Exercise 4 — จำลอง 2 subnet คุยกัน

```bash
# สร้าง 2 network แยกกัน
docker network create netA
docker network create netB

# ดู subnet ที่ docker แจกให้
docker network inspect netA | grep -i subnet
docker network inspect netB | grep -i subnet

# รัน container ในแต่ละ network
docker run --rm -d --name hostA --network netA alpine sleep 600
docker run --rm -d --name hostB --network netB alpine sleep 600

# hostA ping hostB ได้ไหม? (คนละ network → ไม่ได้)
docker exec hostA ping -c2 hostB || echo "คุยกันไม่ได้ — คนละ network เหมือนคนละ subnet ไม่มี router"
```

**บทเรียน:** คนละ network/subnet ต้องมี router/gateway เชื่อม ถึงจะคุยกันได้

```bash
# เก็บกวาด
docker stop hostA hostB
docker network rm netA netB
```

---

## Exercise 5 — traceroute ดู hop จริง

```bash
traceroute 8.8.8.8
```

hop แรกคือ gateway (router) ของคุณเสมอ — ตรงกับ concept "ส่งให้ default gateway ก่อน"

---

## สรุปสิ่งที่ได้

| Exercise | เห็นอะไร |
|---|---|
| 1 | routing table + default gateway |
| 2 | NAT (private → เน็ต) |
| 3 | port forwarding (DNAT) |
| 4 | คนละ subnet ต้องมี router เชื่อม |

**ต่อไป:** Level 4 — [Linux Networking](/network/linux-networking/concepts) จัดการเน็ตด้วยมือ
กลับไป [Roadmap](/network/roadmap) 🚀
