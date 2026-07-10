---
title: "Docker Concepts"
---

Docker คือ platform สำหรับ containerization ที่ช่วยให้ application รันได้เหมือนกันทุก environment

---

## Container vs Virtual Machine

| | Container | Virtual Machine |
|---|---|---|
| Boot time | วินาที | นาที |
| ขนาด | MB | GB |
| Isolation | Process-level | OS-level |
| Overhead | ต่ำ | สูง |
| ใช้ OS | share กับ host | OS แยกต่างหาก |

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Docker CLI                 │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────┐
│            Docker Daemon                │
│  ┌──────────┐  ┌──────────┐            │
│  │Container │  │Container │  ...        │
│  │  nginx   │  │  app     │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
         Host OS (Linux Kernel)
```

---

## คำศัพท์สำคัญ

**Image** — template สำหรับสร้าง container (read-only layer)

**Container** — instance ที่รันจาก image (read-write layer)

**Dockerfile** — ไฟล์ instructions สำหรับ build image

**Registry** — ที่เก็บ image เช่น Docker Hub, ECR, GCR

**Volume** — persistent storage สำหรับ container

**Network** — virtual network สำหรับให้ container คุยกัน

---

## คำสั่งพื้นฐาน

### Images

```bash
docker pull nginx:latest          # ดึง image จาก registry
docker images                     # list images ในเครื่อง
docker build -t myapp:1.0 .       # build image จาก Dockerfile
docker rmi myapp:1.0              # ลบ image
docker tag myapp:1.0 myrepo/myapp:1.0  # tag image
docker push myrepo/myapp:1.0      # push ไป registry
```

### Containers

```bash
docker run nginx                                # รัน container
docker run -d -p 8080:80 --name web nginx       # รันแบบ detached
docker ps                                       # list container ที่รันอยู่
docker ps -a                                    # list ทุก container
docker stop web                                 # หยุด container
docker start web                                # เริ่ม container
docker rm web                                   # ลบ container
docker logs -f web                              # ดู logs แบบ real-time
docker exec -it web bash                        # เข้าไปใน container
```

### Volumes & Networks

```bash
docker volume create mydata
docker run -v mydata:/data nginx

docker network create mynet
docker run --network mynet nginx
```

---

## Dockerfile

```dockerfile
# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements ก่อน (เพื่อ cache layer)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "app.py"]
```

### Best Practices


:::tip[Dockerfile Tips]
- ใช้ image เล็กๆ เช่น `-slim`, `-alpine`
- Copy `requirements.txt` ก่อน source code เพื่อ cache
- ใช้ `.dockerignore` เพื่อ exclude ไฟล์ที่ไม่จำเป็น
- อย่ารัน process ด้วย root user ใน production
:::

---

## Docker Compose

สำหรับ run หลาย container พร้อมกัน:

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "8080:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_PASSWORD=secret

volumes:
  pgdata:
```

```bash
docker compose up -d        # start ทุก service
docker compose down         # stop และลบ container
docker compose logs -f web  # ดู log ของ service
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - รัน Container แรก](/docker/lab-01)
:::
