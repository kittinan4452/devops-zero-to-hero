---
title: "Lab 01 - สืบสวนเหตุการณ์จาก Log"
description: ฝึกอ่าน log แบบนักสืบ — วิเคราะห์ access log, JSON log, journalctl, docker logs และ kubectl logs จนหาต้นเหตุเจอ
---

## เป้าหมาย

- อ่านและกรอง log ด้วย `grep`, `awk`, `sort`, `uniq`, `jq`
- สรุปตัวเลขจาก access log (status, IP, path)
- ตรวจจับสัญญาณโจมตีจาก log
- เชื่อม log หลายแหล่งด้วยเวลา เพื่อหา **ต้นเหตุ** ของ incident
- อ่าน log จริงจาก `journalctl`, `docker logs`, `kubectl logs`

:::note[Requirements]
- Linux หรือ macOS terminal
- `jq` (`sudo apt install jq` / `sudo dnf install jq` / `brew install jq`)
- Docker หรือ Podman (Exercise 6)
- Kubernetes cluster เช่น kind/minikube (Exercise 7 — ไม่บังคับ)
:::

แนะนำให้อ่าน [Concepts](/logs/concepts) และเปิด [Cheatsheet](/logs/cheatsheet) ไว้ข้างๆ

---

## โจทย์: เกิดอะไรขึ้นกับร้านค้าออนไลน์?

> เช้าวันที่ 15 ต.ค. ลูกค้าโทรมาบอกว่า **"กดสั่งซื้อไม่ได้"** ช่วงประมาณ 10 โมง
> คุณได้ log มา 2 ไฟล์: `access.log` จาก nginx และ `app.log` จาก service checkout
> หน้าที่ของคุณคือ **หาว่าเกิดอะไรขึ้น ตอนไหน เพราะอะไร** — และระหว่างนั้นมีอะไรน่าสงสัยอีกไหม

---

## Exercise 0 — เตรียมไฟล์ log

```bash
mkdir -p ~/devops-lab/logs-lab && cd ~/devops-lab/logs-lab

cat > access.log <<'EOF'
192.168.1.10 - - [15/Oct/2026:10:00:01 +0700] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"
192.168.1.10 - - [15/Oct/2026:10:00:02 +0700] "GET /style.css HTTP/1.1" 200 1024 "http://shop.local/" "Mozilla/5.0"
192.168.1.22 - - [15/Oct/2026:10:00:05 +0700] "GET /products HTTP/1.1" 200 4521 "-" "Mozilla/5.0"
10.0.0.5 - - [15/Oct/2026:10:00:07 +0700] "POST /login HTTP/1.1" 401 52 "-" "python-requests/2.31"
10.0.0.5 - - [15/Oct/2026:10:00:07 +0700] "POST /login HTTP/1.1" 401 52 "-" "python-requests/2.31"
10.0.0.5 - - [15/Oct/2026:10:00:08 +0700] "POST /login HTTP/1.1" 401 52 "-" "python-requests/2.31"
10.0.0.5 - - [15/Oct/2026:10:00:08 +0700] "POST /login HTTP/1.1" 401 52 "-" "python-requests/2.31"
10.0.0.5 - - [15/Oct/2026:10:00:09 +0700] "POST /login HTTP/1.1" 401 52 "-" "python-requests/2.31"
10.0.0.5 - - [15/Oct/2026:10:00:09 +0700] "POST /login HTTP/1.1" 200 210 "-" "python-requests/2.31"
192.168.1.22 - - [15/Oct/2026:10:01:15 +0700] "GET /products/42 HTTP/1.1" 200 2210 "-" "Mozilla/5.0"
192.168.1.30 - - [15/Oct/2026:10:01:20 +0700] "GET /wp-admin HTTP/1.1" 404 153 "-" "curl/8.5.0"
192.168.1.30 - - [15/Oct/2026:10:01:21 +0700] "GET /.env HTTP/1.1" 404 153 "-" "curl/8.5.0"
192.168.1.10 - - [15/Oct/2026:10:02:00 +0700] "POST /cart HTTP/1.1" 201 98 "-" "Mozilla/5.0"
192.168.1.10 - - [15/Oct/2026:10:02:30 +0700] "POST /checkout HTTP/1.1" 500 45 "-" "Mozilla/5.0"
192.168.1.22 - - [15/Oct/2026:10:02:31 +0700] "POST /checkout HTTP/1.1" 500 45 "-" "Mozilla/5.0"
192.168.1.45 - - [15/Oct/2026:10:02:33 +0700] "POST /checkout HTTP/1.1" 502 157 "-" "Mozilla/5.0"
192.168.1.45 - - [15/Oct/2026:10:02:40 +0700] "GET /checkout HTTP/1.1" 502 157 "-" "Mozilla/5.0"
192.168.1.22 - - [15/Oct/2026:10:03:10 +0700] "GET /products HTTP/1.1" 200 4521 "-" "Mozilla/5.0"
192.168.1.10 - - [15/Oct/2026:10:05:00 +0700] "POST /checkout HTTP/1.1" 200 340 "-" "Mozilla/5.0"
192.168.1.45 - - [15/Oct/2026:10:05:12 +0700] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"
EOF

cat > app.log <<'EOF'
{"time":"2026-10-15T10:00:00+07:00","level":"INFO","service":"checkout","msg":"server started","port":8080}
{"time":"2026-10-15T10:02:00+07:00","level":"INFO","service":"checkout","msg":"cart created","user_id":17,"request_id":"a1"}
{"time":"2026-10-15T10:02:25+07:00","level":"WARN","service":"checkout","msg":"db connection slow","latency_ms":2300}
{"time":"2026-10-15T10:02:30+07:00","level":"ERROR","service":"checkout","msg":"db connection pool exhausted","pool_size":10,"request_id":"b7"}
{"time":"2026-10-15T10:02:31+07:00","level":"ERROR","service":"checkout","msg":"db connection pool exhausted","pool_size":10,"request_id":"c3"}
{"time":"2026-10-15T10:02:32+07:00","level":"FATAL","service":"checkout","msg":"out of memory, process exiting"}
{"time":"2026-10-15T10:04:50+07:00","level":"INFO","service":"checkout","msg":"server started","port":8080}
{"time":"2026-10-15T10:05:00+07:00","level":"INFO","service":"checkout","msg":"order placed","user_id":17,"request_id":"d9"}
EOF

wc -l access.log app.log
```

**ผลลัพธ์ที่ควรได้:**
```
 20 access.log
  8 app.log
 28 total
```

:::tip
log จริงมีเป็นหมื่นเป็นล้านบรรทัด — ฝึกด้วยไฟล์เล็กให้คล่องก่อน แล้วคำสั่งเดียวกันจะใช้กับไฟล์ใหญ่ได้ทันที
:::

---

## Exercise 1 — ดู log แบบดิบ

```bash
head -n 3 access.log          # 3 บรรทัดแรก
tail -n 3 access.log          # 3 บรรทัดท้าย
less access.log               # ลองกด /checkout แล้ว n เพื่อค้นต่อ, q ออก
grep -n "checkout" access.log # บรรทัดที่เกี่ยวกับ checkout พร้อมเลขบรรทัด
```

**คำถาม:** มี request ไป `/checkout` กี่ครั้ง? (ลอง `grep -c`)

<details>
<summary>เฉลย</summary>

```bash
grep -c "/checkout" access.log
# 5
```
</details>

---

## Exercise 2 — สรุปตัวเลขจาก access log

ใช้สูตร **`ดึง field | sort | uniq -c | sort -rn`**

```bash
# 2.1 แต่ละ status code เกิดกี่ครั้ง
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# 2.2 IP ไหนยิงมาเยอะสุด
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -3

# 2.3 แสดงเฉพาะ request ที่ error ฝั่ง server (5xx)
awk '$9 >= 500' access.log

# 2.4 จำนวน request ต่อนาที
awk '{print substr($4, 2, 17)}' access.log | sort | uniq -c
```

**คำถาม:**
1. มี 5xx ทั้งหมดกี่ครั้ง? เกิดกับ path ไหน?
2. ช่วงเวลาไหนที่มี 5xx (ตั้งแต่กี่โมงถึงกี่โมง)?
3. ทำไมบางอันเป็น `500` บางอันเป็น `502` — ต่างกันยังไง?

<details>
<summary>เฉลย</summary>

```
      8 200
      5 401
      2 502
      2 500
      2 404
      1 201
```

1. **4 ครั้ง** ทั้งหมดอยู่ที่ `/checkout`
2. ตั้งแต่ **10:02:30 ถึง 10:02:40** และ checkout กลับมาใช้ได้ตอน 10:05:00
3. `500` = แอป **ยังรันอยู่** แต่ตอบ error กลับมา / `502` = nginx **ติดต่อแอปไม่ได้เลย** (แอปตายไปแล้ว) — แปลว่าแอปพังหนักขึ้นเรื่อยๆ จาก "error" กลายเป็น "ล่ม"
</details>

---

## Exercise 3 — มองหาสิ่งน่าสงสัย (Security)

ระหว่างไล่ปัญหา อย่าลืมดูว่ามีอะไรผิดปกติฝั่ง security ด้วย

```bash
# 3.1 ใคร login ไม่ผ่าน (401)
awk '$9 == 401 {print $1}' access.log | sort | uniq -c

# 3.2 ดูทุก request ของ IP นั้นเรียงตามเวลา
awk '$1 == "10.0.0.5" {print $4, $6, $7, $9}' access.log

# 3.3 ใครเข้า path ที่ไม่มีอยู่ (404)
awk '$9 == 404 {print $1, $7, $12}' access.log
```

**คำถาม:**
1. IP `10.0.0.5` ทำอะไร? จบลงยังไง? ทำไมเรื่องนี้ **ร้ายแรง**?
2. IP `192.168.1.30` พยายามทำอะไร?

<details>
<summary>เฉลย</summary>

1. ยิง `POST /login` ผิด **5 ครั้งใน 2 วินาที** ด้วย `python-requests` (ไม่ใช่ browser) = **brute-force** และครั้งที่ 6 ได้ **`200`** → **เดารหัสผ่านได้สำเร็จแล้ว!** ต้องรีบหาว่าเป็นบัญชีไหน, reset password, ดูว่า IP นี้ทำอะไรต่อ และพิจารณา rate limit / MFA
2. ยิงหา `/wp-admin` และ `/.env` ด้วย `curl` = **สแกนหาช่องโหว่** (หาหน้า admin WordPress และไฟล์ที่มักมี secret) — ครั้งนี้ได้ 404 ซึ่งดี แต่ควร block / ตั้ง alert

ฝึกเรื่องนี้ต่อได้ที่ [Blue Team Lab](/security/blueteam/lab-01)
</details>

---

## Exercise 4 — อ่าน JSON log ด้วย jq

```bash
# 4.1 จัด format ให้อ่านง่าย
jq . app.log | head -20

# 4.2 นับแต่ละ level
jq -r '.level' app.log | sort | uniq -c

# 4.3 ดูเฉพาะ WARN ขึ้นไป แบบบรรทัดเดียวอ่านง่าย
jq -r 'select(.level != "INFO") | "\(.time) \(.level) \(.msg)"' app.log

# 4.4 error แรกสุดคืออะไร (ครั้งแรกสำคัญที่สุด)
grep -m 1 '"level":"ERROR"' app.log | jq .

# 4.5 ดูบริบทก่อน/หลัง FATAL
grep -B 3 -A 1 FATAL app.log | jq -c '{time, level, msg}'
```

**คำถาม:**
1. มีสัญญาณเตือน **ก่อน** เกิด ERROR ไหม? คืออะไร?
2. แอปตายตอนกี่โมง และกลับมาตอนกี่โมง? ล่มไปนานเท่าไร?

<details>
<summary>เฉลย</summary>

```
10:02:25  WARN   db connection slow (latency 2300ms)
10:02:30  ERROR  db connection pool exhausted
10:02:31  ERROR  db connection pool exhausted
10:02:32  FATAL  out of memory, process exiting
```

1. มี — `WARN db connection slow` ตอน **10:02:25** (ก่อน ERROR 5 วินาที) นี่คือเหตุผลที่ไม่ควรดูแค่ ERROR
2. ตายตอน **10:02:32** กลับมาตอน **10:04:50** (`server started`) = ล่มประมาณ **2 นาที 18 วินาที**
</details>

---

## Exercise 5 — ต่อจิ๊กซอว์: สร้าง Timeline

รวม 2 ไฟล์ให้เรียงตามเวลาเดียวกัน (แปลงให้อยู่ format เดียวกันก่อน):

```bash
{
  # access.log: [15/Oct/2026:10:02:30 → 10:02:30
  awk '{print substr($4, 14, 8), "nginx", $6, $7, $9}' access.log | tr -d '"'
  # app.log: 2026-10-15T10:02:30+07:00 → 10:02:30
  jq -r '"\(.time[11:19]) app   \(.level) \(.msg)"' app.log
} | sort | awk '$1 >= "10:02:00" && $1 <= "10:05:00"'
```

ดู timeline แล้วเขียนสรุป incident สั้นๆ (แบบที่จะส่งให้หัวหน้า) ตอบให้ได้ว่า:

1. **อะไร** เกิดขึ้น (ผลกระทบต่อ user)
2. **เมื่อไหร่** (เริ่ม–จบ)
3. **ทำไม** (ต้นเหตุ)
4. **ควรทำอะไรต่อ**

<details>
<summary>ตัวอย่างสรุป</summary>

```
10:02:00 app   INFO cart created
10:02:00 nginx POST /cart 201
10:02:25 app   WARN db connection slow
10:02:30 app   ERROR db connection pool exhausted
10:02:30 nginx POST /checkout 500
10:02:31 app   ERROR db connection pool exhausted
10:02:31 nginx POST /checkout 500
10:02:32 app   FATAL out of memory, process exiting
10:02:33 nginx POST /checkout 502
10:02:40 nginx GET /checkout 502
10:03:10 nginx GET /products 200
10:04:50 app   INFO server started
10:05:00 app   INFO order placed
10:05:00 nginx POST /checkout 200
```

> **Incident: ระบบสั่งซื้อใช้งานไม่ได้ 15 ต.ค. 10:02–10:05**
>
> - **ผลกระทบ:** user สั่งซื้อไม่ได้ (4 request ล้มเหลว: 500 ×2, 502 ×2) ส่วนหน้าดูสินค้ายังใช้ได้ปกติ
> - **ลำดับเหตุการณ์:** database เริ่มช้า (10:02:25) → connection pool เต็ม → request ค้างจนหน่วยความจำหมด → service checkout ตาย (10:02:32) → ถูก restart กลับมา (10:04:50)
> - **ต้นเหตุเบื้องต้น:** database ตอบช้า ทำให้ connection pool (10) ไม่พอ — ต้องไปดู log/metrics ของ database ต่อว่าช้าเพราะอะไร
> - **สิ่งที่ควรทำ:** ตั้ง timeout ให้ db connection, ตั้ง alert จาก `WARN db connection slow`, ทบทวนขนาด pool และ memory limit
> - **เพิ่มเติม (security):** พบ brute-force จาก `10.0.0.5` ที่ login สำเร็จตอน 10:00:09 — ต้องสอบสวนแยก
</details>

---

## Exercise 6 — log จริงบนเครื่องคุณ (journalctl + Docker)

### 6.1 journalctl

```bash
# error ทั้งหมดตั้งแต่เปิดเครื่อง
journalctl -b -p err --no-pager | tail -20

# log ของ service ที่สนใจ (เปลี่ยนชื่อได้ เช่น sshd, docker, NetworkManager)
journalctl -u docker --since "1 hour ago" --no-pager | tail -20

# service ไหนบ้างที่ fail
systemctl --failed
```

:::note
ถ้าขึ้นว่าไม่มีสิทธิ์อ่าน ให้เติม `sudo` หรือเพิ่ม user เข้ากลุ่ม `systemd-journal` / `adm`
บน macOS ไม่มี journalctl — ข้ามไปข้อ 6.2 ได้เลย
:::

### 6.2 docker logs — container ที่รันอยู่

```bash
docker run -d --name web -p 8080:80 nginx:alpine

# ยิง request ทั้งแบบปกติและแบบ 404
curl -s localhost:8080 > /dev/null
curl -s localhost:8080/not-found > /dev/null
curl -s localhost:8080/.env > /dev/null

docker logs web                           # จะเห็นทั้ง startup log และ access log
docker logs --tail 3 -t web               # 3 บรรทัดล่าสุดพร้อม timestamp
docker logs web 2>&1 | awk '$9 == 404'    # ใช้ awk ตัวเดิมจาก Exercise 2 ได้เลย!
```

สังเกตว่า access log ของ nginx ใน container **format เดียวกับ** `access.log` ที่เราฝึกมา

### 6.3 docker logs — container ที่ตายไปแล้ว

```bash
# container ที่ crash ทันทีที่เริ่ม
docker run --name crashy alpine sh -c 'echo "starting app..."; echo "ERROR: config file /etc/app.yaml not found" >&2; exit 1'

docker ps -a --filter name=crashy        # STATUS: Exited (1)
docker logs crashy                       # log ยังอยู่ แม้ container หยุดแล้ว
docker inspect crashy --format 'exit={{.State.ExitCode}} oom={{.State.OOMKilled}}'
```

**(ไม่บังคับ) จำลอง OOMKilled:**

```bash
docker run --name oom -m 50m --memory-swap 50m python:3.12-alpine \
  python -c "print('allocating...'); a = ' ' * 200_000_000"

docker inspect oom --format 'exit={{.State.ExitCode}} oom={{.State.OOMKilled}}'
# exit=137 oom=true
```

:::caution[บทเรียนสำคัญ]
container ที่โดน OOM kill **มักไม่ทิ้ง error ไว้ใน log** เพราะมันถูกฆ่าทันที — ต้องดูจาก exit code `137` และ `OOMKilled` แทน
:::

ลบทิ้งเมื่อเสร็จ:
```bash
docker rm -f web crashy oom
```

---

## Exercise 7 — Kubernetes: CrashLoopBackOff (ไม่บังคับ)

```bash
# pod ที่จะ crash ซ้ำๆ
kubectl run crashy --image=busybox -- sh -c 'echo "connecting to db..."; sleep 5; echo "FATAL: cannot connect to db:5432"; exit 1'

kubectl get pod crashy -w        # รอจนเห็น CrashLoopBackOff แล้วกด Ctrl + C
```

ลองอ่าน log ทั้ง 3 แบบ แล้วเทียบกัน:

```bash
kubectl logs crashy              # รอบปัจจุบัน (อาจว่างถ้าเพิ่ง restart)
kubectl logs crashy --previous   # รอบก่อนหน้าที่ตายไป ← เห็นสาเหตุชัดเจน
kubectl describe pod crashy      # ดู Last State, Exit Code, Restart Count และ Events ท้ายสุด
```

**คำถาม:** ใน `kubectl describe` ช่อง `Last State` บอกอะไร? `Restart Count` เท่าไร?

<details>
<summary>เฉลย</summary>

`Last State: Terminated`, `Reason: Error`, `Exit Code: 1` และ `Restart Count` จะเพิ่มขึ้นเรื่อยๆ — Kubernetes จะรอนานขึ้นเรื่อยๆ ก่อน restart รอบถัดไป (back-off) จึงเรียกว่า CrashLoop**BackOff**
สาเหตุจริงอยู่ใน `kubectl logs --previous`: `FATAL: cannot connect to db:5432`
</details>

```bash
kubectl delete pod crashy
```

---

:::tip[สำเร็จแล้ว!]
ถ้าทำครบ คุณอ่าน log ได้ทั้ง 4 ชั้น (host → container → kubernetes → application) และไล่หาต้นเหตุจากหลายแหล่งได้แล้ว
ต่อยอดด้วย [Monitoring - Prometheus + Grafana](/monitoring/lab-01) เพื่อให้รู้ปัญหา **ก่อน** user โทรมา
:::

:::note[Challenge เพิ่มเติม]
เขียน script `log-report.sh` ที่รับไฟล์ access log แล้วพิมพ์รายงาน:
- จำนวน request ทั้งหมด และ % ของ 5xx
- Top 3 IP
- IP ที่มี 401 เกิน 3 ครั้ง (ขึ้นคำว่า `⚠️ possible brute-force`)
- path ที่โดน 404 บ่อยที่สุด

**Hint:** ใช้ `awk` กับ `END { ... }` สำหรับคำนวณ % และ `[ "$count" -gt 3 ]` สำหรับเงื่อนไข
:::
