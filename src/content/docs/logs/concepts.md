---
title: "การอ่าน Log - พื้นฐานที่ DevOps ต้องมี"
description: log คืออะไร อยู่ที่ไหน อ่านแต่ละบรรทัดยังไง และวิธีไล่หาสาเหตุปัญหาจาก log อย่างเป็นระบบ
---

เวลาระบบมีปัญหา **log คือพยานปากแรก** — มันบอกว่าเกิดอะไรขึ้น ตอนไหน และที่ไหน
คนที่อ่าน log เป็นจะหาสาเหตุเจอในไม่กี่นาที ส่วนคนที่อ่านไม่เป็นได้แต่ restart แล้วภาวนาให้หาย

---

## Log vs Metrics vs Traces

| | ตอบคำถาม | ตัวอย่าง |
|---|---|---|
| **Metrics** | "มีปัญหาไหม? เยอะแค่ไหน?" | error rate พุ่งเป็น 30% ตอน 10:02 |
| **Logs** | "เกิดอะไรขึ้น? ทำไม?" | `ERROR db connection pool exhausted` |
| **Traces** | "request นี้ช้าที่ service ไหน?" | checkout → payment ใช้เวลา 2.3s |

ปกติเราเห็นปัญหาจาก **metrics/alert** ก่อน (ดู [Monitoring](/monitoring/concepts)) แล้วค่อย **ลงไปอ่าน log** เพื่อหาสาเหตุ

---

## Log อยู่ที่ไหนบ้าง?

```
┌──────────────────────────────────────────────────────────────┐
│ Kubernetes   kubectl logs <pod>                              │
│   └─ Container   docker logs <container>                     │
│        └─ Application   stdout/stderr หรือไฟล์ /var/log/app/  │
│ Host (Linux)   journalctl, /var/log/*                        │
│ Kernel         dmesg, journalctl -k                          │
└──────────────────────────────────────────────────────────────┘
```

### Linux (ไฟล์ใน `/var/log`)

| ไฟล์ (Debian/Ubuntu) | ไฟล์ (RHEL/Fedora) | มีอะไร |
|---|---|---|
| `/var/log/syslog` | `/var/log/messages` | log รวมของระบบ |
| `/var/log/auth.log` | `/var/log/secure` | login, sudo, ssh |
| `/var/log/kern.log` | (อยู่ใน journal) | kernel, driver, OOM killer |
| `/var/log/dpkg.log`, `/var/log/apt/` | `/var/log/dnf.log` | ติดตั้ง/อัปเดต package |
| `/var/log/nginx/access.log` | เหมือนกัน | ทุก request ที่เข้ามา |
| `/var/log/nginx/error.log` | เหมือนกัน | error ของ nginx (upstream ล่ม, config ผิด) |

:::note[distro ใหม่ๆ ใช้ journald]
Fedora/RHEL และ Ubuntu รุ่นใหม่เก็บ log ส่วนใหญ่ไว้ใน **systemd journal** (binary) — อ่านด้วย `journalctl`
บางเครื่องไม่มีไฟล์ `/var/log/syslog` เลยด้วยซ้ำ
:::

### ไฟล์ที่ลงท้าย `.1` `.gz` คืออะไร?

นั่นคือ log เก่าที่ถูก **logrotate** หมุนเก็บไว้ ไม่ให้ disk เต็ม:

```
access.log        ← ปัจจุบัน
access.log.1      ← เมื่อวาน
access.log.2.gz   ← เก่ากว่า (บีบอัดแล้ว)
```

อ่านไฟล์ `.gz` ได้ตรงๆ ด้วย `zcat`, `zless`, `zgrep` ไม่ต้องแตกไฟล์

### Container & Kubernetes

แอปใน container ควร **เขียน log ออก stdout/stderr** (ไม่ใช่ลงไฟล์ใน container) แล้ว runtime จะเก็บให้:

- **Docker** — `docker logs <name>` (ตัวไฟล์จริงอยู่ที่ `/var/lib/docker/containers/<id>/<id>-json.log`)
- **Kubernetes** — `kubectl logs <pod>` (kubelet เก็บไว้ที่ `/var/log/pods/` บน node)

:::caution[log หายเมื่อ container ถูกลบ]
`docker rm` หรือ pod ถูกลบ = log หายไปด้วย ระบบจริงจึงต้องส่ง log ไปเก็บส่วนกลาง (Loki, Elasticsearch, CloudWatch ฯลฯ)
:::

---

## Log Levels — อ่านจากความรุนแรง

| Level | ความหมาย | ต้องทำอะไร |
|---|---|---|
| `TRACE` / `DEBUG` | รายละเอียดสำหรับ dev | ปกติปิดใน production |
| `INFO` | เหตุการณ์ปกติ (start, request เสร็จ) | ไม่ต้องทำอะไร |
| `WARN` | ผิดปกติแต่ยังทำงานได้ (ช้า, retry) | **สัญญาณเตือนล่วงหน้า** — มักโผล่ก่อน ERROR |
| `ERROR` | งานนั้นล้มเหลว | ต้องดู |
| `FATAL` / `CRITICAL` | process ตาย / ทำงานต่อไม่ได้ | ต้องดูทันที |

syslog/journald ใช้ตัวเลข priority: `0 emerg` `1 alert` `2 crit` `3 err` `4 warning` `5 notice` `6 info` `7 debug`
→ `journalctl -p err` = แสดงระดับ 0–3

:::tip
อย่าดูแค่ ERROR — ให้ดู **WARN ที่อยู่ก่อนหน้า** ด้วย เพราะมักบอกต้นเหตุ เช่น `db connection slow` ก่อนจะเป็น `pool exhausted`
:::

---

## แกะ Log ทีละบรรทัด

### 1. Syslog / journald

```
Oct 15 10:02:32 web01 sshd[1234]: Failed password for root from 10.0.0.5 port 52144 ssh2
└───── เวลา ────┘ └host┘ └─โปรแกรม[PID]┘ └──────────────── ข้อความ ─────────────────┘
```

### 2. Nginx / Apache access log (combined format)

```
192.168.1.10 - - [15/Oct/2026:10:02:30 +0700] "POST /checkout HTTP/1.1" 500 45 "-" "Mozilla/5.0"
```

| awk field | ค่า | ความหมาย |
|---|---|---|
| `$1` | `192.168.1.10` | client IP |
| `$4` `$5` | `[15/Oct/2026:10:02:30` `+0700]` | เวลา + timezone |
| `$6` | `"POST` | HTTP method |
| `$7` | `/checkout` | path |
| `$9` | `500` | status code |
| `$10` | `45` | ขนาด response (bytes) |
| `$11` เป็นต้นไป | `"-" "Mozilla/5.0"` | referer, user-agent |

`awk` แบ่ง field ด้วยช่องว่าง — จำไว้ 3 ตัว: **`$1` = IP, `$7` = path, `$9` = status**

**HTTP status code ที่ต้องจำได้:**

| Code | ความหมาย | มักแปลว่า |
|---|---|---|
| `2xx` | สำเร็จ | ปกติ |
| `3xx` | redirect | ปกติ (ถ้าวนลูป = config ผิด) |
| `401` / `403` | ไม่ได้ login / ไม่มีสิทธิ์ | ถ้าเยอะจาก IP เดียว = อาจโดน brute-force |
| `404` | ไม่เจอ | ถ้าเป็น `/wp-admin`, `/.env` = มีคนสแกนหาช่องโหว่ |
| `429` | ยิงถี่เกิน | โดน rate limit |
| `500` | แอป error | **ไปดู log ของแอป** |
| `502` / `504` | proxy ติดต่อ backend ไม่ได้ / timeout | **แอปล่ม หรือช้าเกิน** |

### 3. Structured log (JSON)

```json
{"time":"2026-10-15T10:02:30+07:00","level":"ERROR","service":"checkout","msg":"db connection pool exhausted","request_id":"b7"}
```

แอปสมัยใหม่นิยม log เป็น JSON เพราะ **เครื่องอ่านง่าย** ค้นตาม field ได้ (`level`, `request_id`) — ใช้ `jq` อ่าน

:::tip[request_id / trace_id]
ถ้า log มี `request_id` ให้ใช้มัน grep ข้าม service ได้เลย จะเห็นเส้นทางของ request นั้นทั้งเส้น
:::

### 4. Stack trace — อ่านจากตรงไหน?

```
Traceback (most recent call last):
  File "app.py", line 42, in checkout
    order = create_order(cart)
  File "orders.py", line 17, in create_order
    conn = pool.get()
  File "db.py", line 88, in get
    raise PoolExhausted("no free connection")
db.PoolExhausted: no free connection          ← ① อ่านบรรทัดนี้ก่อน (error คืออะไร)
```

- **Python** — อ่าน **บรรทัดล่างสุด** ก่อน (ชนิด error + ข้อความ) แล้วไล่ขึ้นหาไฟล์ที่เป็น **โค้ดของเราเอง** (ไม่ใช่ library)
- **Java / Node.js** — บรรทัด **บนสุด** คือ error แล้วดู `Caused by:` ตัว **ล่างสุด** = ต้นเหตุจริง

---

## วิธีไล่ปัญหาจาก Log (Workflow)

```
1. กำหนดช่วงเวลา      → ปัญหาเริ่มกี่โมง? (จาก alert / user แจ้ง / graph)
2. เลือกแหล่ง log       → ชั้นไหน? proxy → app → db → host
3. กรองให้แคบ         → --since, grep ERROR, filter ตาม service
4. หา "ครั้งแรก"        → error แรกสุด สำคัญกว่าอันที่ซ้ำ 1000 รอบ
5. ดูบริบทรอบๆ        → grep -B 5 -A 5 ดูก่อน/หลัง error
6. เชื่อมโยงข้ามแหล่ง    → เวลา / request_id เดียวกันใน log อื่น
7. นับและสรุป          → sort | uniq -c ดูว่าอะไรเกิดบ่อยสุด
```

**ตัวอย่างการไล่จริง:**

```
nginx access.log   10:02:30  POST /checkout 500   ← user เจอ error
nginx access.log   10:02:33  POST /checkout 502   ← แอปล่มไปแล้ว
app.log            10:02:25  WARN  db connection slow
app.log            10:02:30  ERROR db connection pool exhausted
app.log            10:02:32  FATAL out of memory, process exiting   ← ต้นเหตุ
app.log            10:04:50  INFO  server started                    ← ถูก restart
```

:::caution[กับดักที่เจอบ่อย]
- **Timezone ไม่ตรงกัน** — nginx ใช้ `+0700` แต่ container ใช้ UTC → เวลาจะห่างกัน 7 ชั่วโมง
- **ดูแต่ error ล่าสุด** — error ที่ซ้ำๆ มักเป็นผลกระทบ ไม่ใช่ต้นเหตุ
- **ไม่ดู log ของรอบก่อน** — pod ที่ restart แล้ว ต้องใช้ `kubectl logs --previous` ถึงจะเห็นว่าตายเพราะอะไร
:::

---

## Log ฝั่ง Security

Log คือแหล่งข้อมูลหลักของ Blue Team สัญญาณที่ควรสังเกต:

- `Failed password` จาก IP เดียวจำนวนมาก → brute-force (ดู [Blue Team Lab](/security/blueteam/lab-01))
- 401 หลายครั้งแล้วตามด้วย **200** → **รหัสถูกเดาได้แล้ว!**
- 404 ไปยัง `/wp-admin`, `/.env`, `/phpmyadmin` → bot สแกนหาช่องโหว่
- user-agent แปลกๆ เช่น `sqlmap`, `nikto`, `python-requests` ไปยังหน้า login

:::danger[อย่า log ข้อมูลลับ]
ห้าม log password, token, เลขบัตร, API key — log มักถูกเก็บนานและหลายคนเข้าถึงได้
:::

---

:::tip[ต่อไป]
- เปิด [Cheatsheet](/logs/cheatsheet) ไว้ข้างๆ
- ลงมือที่ [Lab 01 - สืบสวนเหตุการณ์จาก Log](/logs/lab-01)
- เจาะลึกตามงาน: [Dev](/logs/dev) → [Deploy](/logs/deploy) → [Network](/logs/network) → [Security](/logs/security)
:::
