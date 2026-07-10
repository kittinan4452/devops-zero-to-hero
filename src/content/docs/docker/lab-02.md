---
title: "Lab 02 - สร้าง Dockerfile"
---

## เป้าหมาย

- สร้าง Dockerfile สำหรับ Python web app
- Build และรัน image ของตัวเอง
- ใช้ Docker Compose รัน multi-container

## สิ่งที่ต้องมี


:::note[Requirements]
- Docker และ Docker Compose ติดตั้งแล้ว
- ความรู้ Python เบื้องต้น (หรือแค่ copy โค้ดก็ได้)
:::

---

## Exercise 1 — Dockerfile สำหรับ Python App

สร้างโฟลเดอร์และไฟล์:

```bash
mkdir -p ~/docker-lab/myapp && cd ~/docker-lab/myapp
```

สร้าง `app.py`:
```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, os

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        response = {
            "message": "Hello from Docker!",
            "env": os.environ.get("APP_ENV", "development"),
            "version": "1.0"
        }
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
```

สร้าง `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

สร้าง `.dockerignore`:
```
__pycache__/
*.pyc
.env
```

Build และรัน:
```bash
docker build -t myapp:1.0 .
docker run -d \
  --name myapp \
  -p 8080:8000 \
  -e APP_ENV=production \
  myapp:1.0

curl http://localhost:8080
# {"message": "Hello from Docker!", "env": "production", "version": "1.0"}

docker stop myapp && docker rm myapp
```

---

## Exercise 2 — Multi-stage Build

Multi-stage build ช่วยลดขนาด image โดยแยก build environment ออกจาก runtime:

สร้าง `Dockerfile.multistage`:
```dockerfile
# Stage 1: Builder
FROM python:3.11 AS builder
WORKDIR /build
COPY requirements.txt* ./
RUN pip install --user -r requirements.txt 2>/dev/null || true

# Stage 2: Runtime (image เล็กลง)
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY app.py .
EXPOSE 8000
CMD ["python", "app.py"]
```

```bash
docker build -f Dockerfile.multistage -t myapp:slim .
docker images myapp  # เปรียบเทียบขนาด
```

---

## Exercise 3 — Docker Compose (App + Database)

สร้าง `docker-compose.yml`:
```yaml
services:
  app:
    build: .
    ports:
      - "8080:8000"
    environment:
      - APP_ENV=production
      - DATABASE_URL=postgresql://admin:secret@db:5432/appdb
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d appdb"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
# Start ทุก service
docker compose up -d

# ดูสถานะ
docker compose ps

# ดู logs
docker compose logs -f

# ทดสอบ
curl http://localhost:8080

# Cleanup
docker compose down -v  # -v จะลบ volume ด้วย
```

---


:::tip[สำเร็จแล้ว!]
คุณ build image เองและใช้ Docker Compose ได้แล้ว พร้อมไป **Kubernetes** ต่อ!
:::


:::note[Challenge]
เพิ่ม service **Redis** ใน `docker-compose.yml` และแก้ `app.py` ให้นับจำนวนครั้งที่ request เข้ามา โดยเก็บค่าใน Redis
:::
