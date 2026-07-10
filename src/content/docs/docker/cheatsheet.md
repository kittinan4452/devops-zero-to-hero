---
title: "Cheatsheet - คำสั่ง Docker ที่ใช้บ่อย"
description: รวมคำสั่ง Docker ที่ใช้บ่อย ไว้เปิดดูเวลาลืม
---

รวมคำสั่ง Docker ที่ใช้ประจำ — กดปุ่ม copy ที่มุมขวาบนของ block ได้เลย

## Container — รัน & จัดการ

| คำสั่ง | ทำอะไร |
|---|---|
| `docker run nginx` | รัน container จาก image |
| `docker run -d --name web -p 8080:80 nginx` | รัน background + ตั้งชื่อ + map port |
| `docker run -it ubuntu bash` | รันแบบ interactive เข้า shell |
| `docker run --rm alpine echo hi` | ลบ container อัตโนมัติเมื่อจบ |
| `docker ps` | ดู container ที่รันอยู่ |
| `docker ps -a` | ดูทั้งหมด (รวมที่หยุดแล้ว) |
| `docker stop web` / `docker start web` | หยุด / เริ่ม |
| `docker restart web` | รีสตาร์ท |
| `docker rm web` | ลบ container |
| `docker rm -f web` | บังคับลบ (แม้กำลังรัน) |

## เข้าไปดูข้างใน container

```bash
docker exec -it web bash        # เข้า shell ของ container ที่รันอยู่
docker logs -f web              # ดู log แบบ real-time
docker logs --tail 100 web      # ดู log 100 บรรทัดล่าสุด
docker inspect web              # ดูข้อมูลละเอียด (JSON)
docker stats                    # ดู CPU/RAM ของทุก container แบบสด
docker cp web:/app/log.txt .    # copy ไฟล์ออกจาก container
docker top web                  # ดู process ใน container
```

## Images

| คำสั่ง | ทำอะไร |
|---|---|
| `docker images` | list image ทั้งหมด |
| `docker pull nginx:1.25` | ดึง image (ระบุ tag) |
| `docker build -t myapp:1.0 .` | build image จาก Dockerfile |
| `docker tag myapp:1.0 user/myapp:1.0` | ตั้ง tag ใหม่ |
| `docker push user/myapp:1.0` | push ขึ้น registry |
| `docker rmi myapp:1.0` | ลบ image |
| `docker history myapp` | ดู layer ของ image |
| `docker save -o img.tar myapp` / `docker load -i img.tar` | export / import image เป็นไฟล์ |

## Volumes & Networks

```bash
# volume (เก็บข้อมูลถาวร)
docker volume create data
docker run -v data:/var/lib/mysql mysql       # named volume
docker run -v $(pwd):/app node                # bind mount โฟลเดอร์ปัจจุบัน
docker volume ls
docker volume rm data

# network
docker network create mynet
docker run --network mynet --name db postgres  # container ใน net เดียวกันคุยกันด้วยชื่อ
docker network ls
docker network inspect mynet
```

## Docker Compose

| คำสั่ง | ทำอะไร |
|---|---|
| `docker compose up -d` | start ทุก service (background) |
| `docker compose down` | หยุด + ลบทุกอย่าง |
| `docker compose down -v` | ลบ volume ด้วย |
| `docker compose ps` | ดู service |
| `docker compose logs -f web` | ดู log ของ service `web` |
| `docker compose build` | build image ของ service |
| `docker compose exec web bash` | เข้า shell ของ service |
| `docker compose restart web` | รีสตาร์ทเฉพาะ service เดียว |

## ทำความสะอาด (ประหยัดพื้นที่)

```bash
docker system df                 # ดูว่า Docker กินพื้นที่เท่าไหร่
docker container prune           # ลบ container ที่หยุดแล้วทั้งหมด
docker image prune               # ลบ image ที่ไม่มี tag (dangling)
docker image prune -a            # ลบ image ที่ไม่ได้ใช้ทั้งหมด
docker volume prune              # ลบ volume ที่ไม่มีใครใช้
docker system prune -a --volumes # ล้างทุกอย่างที่ไม่ได้ใช้ (ระวัง!)
```

:::caution[ระวังคำสั่ง prune]
`docker system prune -a --volumes` ลบ image/volume ที่ไม่ได้ใช้ **ทั้งหมด** — ข้อมูลใน volume ที่ยังต้องใช้อาจหายได้ ตรวจให้ดีก่อนรันบนเครื่องจริง
:::

## Flags ของ `docker run` ที่เจอบ่อย

| Flag | ความหมาย |
|---|---|
| `-d` | รัน background (detached) |
| `-it` | interactive + terminal |
| `--rm` | ลบ container เมื่อจบ |
| `-p 8080:80` | map port host:container |
| `-v host:container` | mount volume/โฟลเดอร์ |
| `-e KEY=value` | ตั้ง environment variable |
| `--name` | ตั้งชื่อ container |
| `--network` | ระบุ network |
| `--restart unless-stopped` | ให้ restart อัตโนมัติ |

:::tip[อยากฝึกจริง?]
ไปที่ [Lab 01 - รัน Container แรก](/docker/lab-01) และ [Lab 02 - สร้าง Dockerfile](/docker/lab-02)
:::
