---
title: "Monitoring ด้วย Prometheus + Grafana"
---

Monitoring คือการเก็บ metrics, visualize, และ alert เมื่อระบบมีปัญหา Prometheus + Grafana เป็น stack ที่นิยมที่สุดใน DevOps

---

## ทำไมต้อง Monitor?

```
ไม่มี Monitoring:               มี Monitoring:
user โทรมาบอกว่าเว็บล่ม  →    alert แจ้งก่อน user เจอปัญหา
ไม่รู้ว่า error เริ่มตอนไหน →  ดู graph ย้อนหลังได้
ไม่รู้ว่า CPU สูงเพราะอะไร →  drill down ลงไปดูได้
```

---

## The Four Golden Signals

Google SRE แนะนำให้ monitor 4 สิ่งนี้เป็นอย่างน้อย:

| Signal | คืออะไร | ตัวอย่าง metric |
|---|---|---|
| **Latency** | เวลาที่ใช้ response | p99 request duration |
| **Traffic** | ปริมาณ request | requests per second |
| **Errors** | อัตรา error | HTTP 5xx rate |
| **Saturation** | ทรัพยากรเต็มแค่ไหน | CPU, Memory, Disk % |

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Application │     │    Node      │     │   Database   │
│  + Exporter  │     │   Exporter   │     │  + Exporter  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │  /metrics           │  /metrics           │  /metrics
       └─────────────────────┼─────────────────────┘
                             │ scrape (pull)
                    ┌────────▼────────┐
                    │   Prometheus    │  ← เก็บ time-series data
                    │  (TSDB)         │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌───────▼──────┐  ┌───▼────────┐
     │  Grafana   │  │ Alertmanager │  │  API Query │
     │ (Dashboard)│  │  (Alerts)    │  │            │
     └────────────┘  └──────────────┘  └────────────┘
```

**Pull model** — Prometheus ไป scrape metrics จาก target ทุก N วินาที (ต่างจาก push model)

---

## Prometheus

### Data Model

Prometheus เก็บข้อมูลเป็น **time-series** รูปแบบ:

```
metric_name{label1="value1", label2="value2"} value timestamp

ตัวอย่าง:
http_requests_total{method="GET", status="200", path="/api"} 1234 1700000000
http_requests_total{method="POST", status="500", path="/api"} 5 1700000000
node_cpu_seconds_total{cpu="0", mode="idle"} 98765.43
```

### Metric Types

**Counter** — นับขึ้นเรื่อยๆ ไม่ลด (เช่น จำนวน request ทั้งหมด)
```
http_requests_total
errors_total
bytes_sent_total
```

**Gauge** — ขึ้นหรือลงได้ (เช่น CPU usage, memory)
```
node_memory_available_bytes
go_goroutines
temperature_celsius
```

**Histogram** — วัด distribution (เช่น latency, request size)
```
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 150
http_request_duration_seconds_bucket{le="+Inf"} 200
http_request_duration_seconds_sum 45.2
http_request_duration_seconds_count 200
```

**Summary** — คล้าย Histogram แต่คำนวณ quantile ที่ client
```
rpc_duration_seconds{quantile="0.5"} 0.012
rpc_duration_seconds{quantile="0.99"} 0.045
```

### PromQL (Prometheus Query Language)

```promql
# จำนวน request ทั้งหมด
http_requests_total

# Rate ของ request ใน 5 นาทีที่ผ่านมา
rate(http_requests_total[5m])

# Error rate (%)
rate(http_requests_total{status=~"5.."}[5m])
/ rate(http_requests_total[5m]) * 100

# P99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage เป็น %
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
/ node_memory_MemTotal_bytes * 100

# CPU usage เป็น %
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### prometheus.yml

```yaml
global:
  scrape_interval: 15s       # scrape ทุก 15 วินาที
  evaluation_interval: 15s   # evaluate rules ทุก 15 วินาที

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "app"
    static_configs:
      - targets: ["app:8000"]
    metrics_path: /metrics

  # Auto-discover containers (Docker SD)
  - job_name: "docker"
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
    relabel_configs:
      - source_labels: [__meta_docker_container_name]
        target_label: container
```

---

## Exporters

Exporter คือ bridge ที่แปลง metrics ของ software ต่างๆ ให้อยู่ในรูปแบบ Prometheus

| Exporter | ใช้กับ | Port |
|---|---|---|
| **node_exporter** | Linux OS metrics | 9100 |
| **blackbox_exporter** | HTTP/TCP/ICMP probing | 9115 |
| **mysqld_exporter** | MySQL | 9104 |
| **postgres_exporter** | PostgreSQL | 9187 |
| **redis_exporter** | Redis | 9121 |
| **nginx_exporter** | Nginx | 9113 |
| **cadvisor** | Docker container metrics | 8080 |

---

## Alertmanager

```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts'
        text: '{{ .CommonAnnotations.description }}'
```

```yaml
# alert rules (prometheus.yml)
groups:
  - name: server
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

---

## Grafana

### Concepts

**Dashboard** — หน้ารวม panels สำหรับ visualize metrics

**Panel** — graph, gauge, table, หรือ stat เดี่ยวๆ

**Data Source** — แหล่งข้อมูล (Prometheus, Loki, CloudWatch ฯลฯ)

**Variable** — filter ที่ปรับได้ใน dashboard เช่น เลือก server, environment

### Dashboard as Code (JSON)

```json
{
  "panels": [{
    "type": "graph",
    "title": "Request Rate",
    "targets": [{
      "expr": "rate(http_requests_total[5m])",
      "legendFormat": "{{method}} {{status}}"
    }]
  }]
}
```

### Provisioning (Auto-configure)

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

---

## Loki — Log Aggregation (Bonus)

Grafana Loki เก็บ logs เหมือน Prometheus เก็บ metrics ใช้ร่วมกับ Grafana ได้เลย

```
Application Logs → Promtail (agent) → Loki → Grafana
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - ตั้ง Monitoring Stack ด้วย Docker Compose](/monitoring/lab-01)
:::
