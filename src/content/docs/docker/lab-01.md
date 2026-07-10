---
title: "Lab 01 - รัน Container แรก"
---

## เป้าหมาย

- รัน container จาก public image
- เข้าใจ port mapping และ volume
- ใช้คำสั่ง docker พื้นฐาน

## สิ่งที่ต้องมี


:::note[Requirements]
ติดตั้ง Docker: [docs.docker.com/get-docker](https://docs.docker.com/get-docker/)
```bash
docker --version  # ต้องเห็น version
```
:::

---

## Exercise 1 — รัน Nginx

```bash
# รัน nginx container
docker run -d \
  --name my-nginx \
  -p 8080:80 \
  nginx:latest

# ตรวจสอบว่ารันอยู่
docker ps

# ทดสอบ
curl http://localhost:8080
```

**ผลลัพธ์ที่ควรได้:**
```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
```

```bash
# ดู logs
docker logs my-nginx

# หยุดและลบ
docker stop my-nginx
docker rm my-nginx
```

---

## Exercise 2 — Interactive Container

```bash
# รัน Ubuntu แบบ interactive
docker run -it --rm ubuntu:22.04 bash

# ใน container ให้รัน:
apt update && apt install -y curl
curl --version
exit  # ออกจาก container (จะถูกลบอัตโนมัติเพราะ --rm)
```


:::note[Flag --rm]
`--rm` จะลบ container อัตโนมัติเมื่อ exit เหมาะสำหรับทดสอบ
:::

---

## Exercise 3 — Volume Mount

```bash
# สร้างไฟล์ html บน host
mkdir -p ~/docker-lab/html
echo "<h1>Hello from Docker Lab!</h1>" > ~/docker-lab/html/index.html

# mount โฟลเดอร์เข้า container
docker run -d \
  --name web \
  -p 8080:80 \
  -v ~/docker-lab/html:/usr/share/nginx/html \
  nginx:latest

curl http://localhost:8080
# ควรเห็น: Hello from Docker Lab!

# แก้ไขไฟล์บน host แล้ว refresh
echo "<h1>Updated!</h1>" > ~/docker-lab/html/index.html
curl http://localhost:8080
# ควรเห็น: Updated! (ไม่ต้อง restart container)

docker stop web && docker rm web
```

---

## Exercise 4 — Environment Variables

```bash
# รัน postgres ด้วย env vars
docker run -d \
  --name mydb \
  -e POSTGRES_DB=testdb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret123 \
  -p 5432:5432 \
  postgres:15

# รอสักครู่แล้วทดสอบ
docker exec -it mydb psql -U admin -d testdb -c "\l"

# ทำความสะอาด
docker stop mydb && docker rm mydb
```

---

## Exercise 5 — เช็คสถานะและ Debug

```bash
# ดู resource usage
docker stats --no-stream

# inspect container (ได้ข้อมูลละเอียด)
docker run -d --name test nginx
docker inspect test

# ดู processes ใน container
docker top test

# ทำความสะอาดทั้งหมด
docker stop test && docker rm test
docker system prune -f  # ลบ unused resources
```

---


:::tip[สำเร็จแล้ว!]
ตอนนี้รู้จัก container, port mapping, volume, และ env vars แล้ว
:::


:::note[Challenge]
รัน **Redis** container บน port `6379` แล้วทดสอบด้วย:
```bash
docker exec -it redis-test redis-cli ping
# ควรได้: PONG
```
:::
