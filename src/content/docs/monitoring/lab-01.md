---
title: "Lab 01 - ตั้ง Monitoring Stack ด้วย Docker Compose"
---

## เป้าหมาย

- รัน Prometheus + Grafana + Node Exporter ด้วย Docker Compose
- เขียน PromQL query พื้นฐาน
- สร้าง Grafana dashboard
- ตั้ง alert rules

## สิ่งที่ต้องมี


:::note[Requirements]
```bash
docker --version
docker compose version
```
:::

---

## Setup — Monitoring Stack

```bash
mkdir ~/monitoring-lab && cd ~/monitoring-lab
mkdir -p prometheus grafana/provisioning/{datasources,dashboards} grafana/dashboards
```

### Prometheus Config

สร้าง `prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "app"
    static_configs:
      - targets: ["sample-app:8000"]
```

สร้าง `prometheus/alerts.yml`:
```yaml
groups:
  - name: infrastructure
    rules:
      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
          / node_memory_MemTotal_bytes * 100 > 85
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | printf \"%.1f\" }}%"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is DOWN"

      - alert: HighCPU
        expr: |
          100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU on {{ $labels.instance }}: {{ $value | printf \"%.1f\" }}%"
```

### Grafana Provisioning

สร้าง `grafana/provisioning/datasources/prometheus.yml`:
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

สร้าง `grafana/provisioning/dashboards/default.yml`:
```yaml
apiVersion: 1
providers:
  - name: Default
    folder: DevOps Lab
    type: file
    options:
      path: /var/lib/grafana/dashboards
```

### Sample App (Python metrics)

สร้าง `app/app.py`:
```python
import time
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from prometheus_client import (
    Counter, Histogram, Gauge,
    generate_latest, CONTENT_TYPE_LATEST
)

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]
)
ACTIVE_USERS = Gauge('active_users', 'Number of active users')

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        start = time.time()

        if self.path == '/metrics':
            output = generate_latest()
            self.send_response(200)
            self.send_header('Content-Type', CONTENT_TYPE_LATEST)
            self.end_headers()
            self.wfile.write(output)
            return

        # Simulate work
        time.sleep(random.uniform(0.01, 0.3))
        ACTIVE_USERS.set(random.randint(10, 100))

        status = 200
        if random.random() < 0.05:   # 5% error rate
            status = 500

        self.send_response(status)
        self.end_headers()
        self.wfile.write(b'OK' if status == 200 else b'Error')

        duration = time.time() - start
        REQUEST_COUNT.labels('GET', self.path, str(status)).inc()
        REQUEST_LATENCY.labels(self.path).observe(duration)

    def log_message(self, format, *args):
        pass  # suppress default logs

if __name__ == '__main__':
    print("App running on :8000, metrics at /metrics")
    HTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
```

สร้าง `app/requirements.txt`:
```
prometheus-client==0.20.0
```

สร้าง `app/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
EXPOSE 8000
CMD ["python", "app.py"]
```

### Docker Compose

สร้าง `docker-compose.yml`:
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=7d
      - --web.enable-lifecycle
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - --path.procfs=/host/proc
      - --path.sysfs=/host/sys
      - --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)
    restart: unless-stopped

  sample-app:
    build: ./app
    container_name: sample-app
    ports:
      - "8000:8000"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

```bash
docker compose up -d --build
docker compose ps   # ทุก service ควร Up
```

---

## Exercise 1 — ดู Targets ใน Prometheus

เปิด [http://localhost:9090](http://localhost:9090)

- ไปที่ **Status → Targets**
- ตรวจสอบว่าทุก target เป็น `UP`

```bash
# ดู raw metrics จาก node-exporter
curl -s http://localhost:9100/metrics | grep node_cpu | head -5

# ดู app metrics
curl -s http://localhost:8000/metrics
```

---

## Exercise 2 — PromQL Queries

เปิด **Graph** tab ใน Prometheus แล้วลอง query เหล่านี้:

```promql
# CPU Usage (%)
100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage (%)
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
/ node_memory_MemTotal_bytes * 100

# Request rate จาก app
rate(http_requests_total[1m])

# Error rate (%)
rate(http_requests_total{status="500"}[1m])
/ rate(http_requests_total[1m]) * 100

# P99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Active users
active_users
```

สร้าง traffic จำลอง:
```bash
# generate traffic ไปที่ app
for i in $(seq 1 200); do
  curl -s http://localhost:8000/ > /dev/null
  curl -s http://localhost:8000/api > /dev/null
done

# ดูใน Prometheus ว่า metric เปลี่ยนแปลง
```

---

## Exercise 3 — Grafana Dashboard

เปิด [http://localhost:3000](http://localhost:3000)
Login: `admin` / `admin123`

### สร้าง Dashboard ใหม่

1. คลิก **+** → **New Dashboard** → **Add visualization**
2. เลือก Data source: **Prometheus**
3. เพิ่ม panels ต่อไปนี้:

**Panel 1: Request Rate**
```promql
rate(http_requests_total[1m])
```
- Visualization: **Time series**
- Legend: `{{method}} {{endpoint}} {{status}}`

**Panel 2: Error Rate (%)**
```promql
rate(http_requests_total{status="500"}[1m])
/ rate(http_requests_total[1m]) * 100
```
- Visualization: **Gauge**
- Unit: **Percent (0-100)**
- Thresholds: 0=green, 5=yellow, 10=red

**Panel 3: P99 Latency**
```promql
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```
- Visualization: **Time series**
- Unit: **seconds (s)**

**Panel 4: CPU Usage**
```promql
100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```
- Visualization: **Gauge**
- Unit: **Percent (0-100)**

**Panel 5: Memory Usage**
```promql
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
/ node_memory_MemTotal_bytes * 100
```
- Visualization: **Stat**
- Unit: **Percent (0-100)**

4. Save dashboard ชื่อ **"DevOps Lab - Overview"**

---

## Exercise 4 — Import Community Dashboard

Grafana มี dashboard สำเร็จรูปที่ community แชร์ไว้ที่ [grafana.com/dashboards](https://grafana.com/grafana/dashboards/)

1. คลิก **+** → **Import**
2. พิมพ์ ID `1860` (Node Exporter Full dashboard)
3. เลือก Data source: **Prometheus**
4. คลิก **Import**

ลอง Dashboard อื่นๆ:
- `3662` — Prometheus 2.0 Overview
- `893` — Docker and system monitoring

---

## Exercise 5 — ตรวจสอบ Alert Rules

เปิด Prometheus → **Alerts** tab

```bash
# ดู alert rules
curl -s http://localhost:9090/api/v1/rules | python3 -m json.tool | grep -E "name|state"

# ทดสอบ ServiceDown alert — หยุด app
docker compose stop sample-app

# รอ 1-2 นาที แล้วดูใน Prometheus → Alerts
# จะเห็น ServiceDown อยู่ใน FIRING state

# เปิด app กลับ
docker compose start sample-app
```

---

## Cleanup

```bash
docker compose down -v
```

---


:::tip[สำเร็จแล้ว!]
คุณตั้ง Prometheus + Grafana ได้แล้ว สร้าง dashboard, เขียน PromQL, และตั้ง alert rules
:::


:::note[Challenge]
เพิ่ม **Loki + Promtail** เข้า stack เพื่อเก็บ logs จาก sample-app
แล้วสร้าง Grafana panel ที่แสดง logs และ metrics ในหน้าเดียวกัน
**Hint:** ใช้ image `grafana/loki` และ `grafana/promtail`
:::
