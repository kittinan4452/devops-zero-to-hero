---
title: "อ่าน Log ฝั่ง Network - Firewall, Proxy, tcpdump, DNS"
description: แปล error เครือข่าย (refused / timeout / reset), อ่าน nginx error log, firewall log, tcpdump, dig, curl -v และ VPC flow logs
---

ปัญหา network มักถูกรายงานด้วยคำเดียว: **"มันต่อไม่ติด"**
หน้าที่ของเราคือแยกให้ได้ว่า **ไม่ติดที่ชั้นไหน** — DNS? route? firewall? แอปไม่ได้รัน? TLS?
log ของแต่ละชั้นจะบอกคำตอบ

ทบทวนพื้นฐานได้ที่ [Network Roadmap](/network/roadmap)

---

## ข้อความ error บอกชั้นที่พัง

นี่คือตารางที่สำคัญที่สุดในหน้านี้ — **จำให้ได้**

| Error | เกิดอะไรขึ้นจริงๆ | สาเหตุที่พบบ่อย |
|---|---|---|
| `Could not resolve host` / `Name or service not known` / `NXDOMAIN` / `Temporary failure in name resolution` | **DNS** หาชื่อไม่เจอ | พิมพ์ชื่อผิด, DNS server ล่ม, ชื่อ service ใน k8s/compose ผิด |
| `Connection refused` | ไปถึงเครื่องแล้ว แต่ **ไม่มีใครฟัง port นั้น** (ได้ RST กลับมา) | แอปไม่ได้รัน, ฟังผิด port, ฟังแค่ `127.0.0.1` |
| `Connection timed out` / `i/o timeout` | ส่ง SYN ไปแล้ว **เงียบ ไม่มีอะไรตอบ** | firewall / Security Group **DROP**, route ผิด, เครื่องดับ |
| `No route to host` | ไปไม่ถึง (หรือ firewall ตอบ reject แบบ ICMP) | IP ผิด subnet, เครื่องดับ, firewalld ที่ตั้ง reject ไว้ |
| `Network is unreachable` | เครื่องเราไม่มี route ไปปลายทางเลย | ไม่มี default gateway, interface down |
| `Connection reset by peer` | ต่อได้แล้ว แต่ **อีกฝั่งตัดทิ้งกลางทาง** | แอป crash ระหว่างตอบ, LB idle timeout, ขนาด request เกิน |
| `SSL certificate problem: certificate has expired` / `unable to get local issuer certificate` / `hostname mismatch` | **TLS** ไม่ผ่าน | cert หมดอายุ, ไม่มี CA chain, เรียกด้วยชื่อไม่ตรงกับ cert |

:::tip[refused vs timeout — จำให้ขึ้นใจ]
- **refused (เร็ว)** = เครื่องปลายทาง **ตอบกลับมา** ว่าไม่มีใครฟัง → network ปกติ ไปดูที่ **แอป**
- **timeout (ช้า รอนาน)** = **ไม่มีอะไรตอบเลย** → ไปดูที่ **firewall / route / security group**
:::

:::note[แอปฟังแค่ localhost]
ถ้า `ss -ltnp` เห็น `127.0.0.1:8080` แปลว่ารับเฉพาะในเครื่อง — เครื่องอื่นหรือ container อื่นจะได้ `Connection refused`
ต้องให้แอปฟัง `0.0.0.0:8080` แทน (ปัญหาคลาสสิกของแอปใน Docker)
:::

---

## curl -v — ดูทุกขั้นของการเชื่อมต่อ

```
$ curl -v https://shop.example.com/api/health
* Host shop.example.com:443 was resolved.                ← ① DNS ผ่าน
* IPv4: 203.0.113.10
*   Trying 203.0.113.10:443...                           ← ② กำลังต่อ TCP (ค้างตรงนี้ = timeout)
* Connected to shop.example.com (203.0.113.10) port 443  ← ③ TCP ผ่าน
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384  ← ④ TLS ผ่าน
* Server certificate:
*  subject: CN=shop.example.com
*  expire date: Jan 10 23:59:59 2027 GMT
> GET /api/health HTTP/2                                 ← ⑤ request ที่เราส่ง (>)
> Host: shop.example.com
>
< HTTP/2 503                                             ← ⑥ response ที่ได้ (<)
< content-type: application/json
```

- `*` = ข้อมูลจาก curl เอง, `>` = ที่เราส่ง, `<` = ที่ server ตอบ
- **ค้างที่ขั้นไหน = พังที่ชั้นนั้น** — ที่นี่ network ผ่านหมด แต่แอปตอบ `503` → ไปดูแอป

**วัดเวลาแต่ละขั้น** (ช้าที่ DNS? connect? หรือรอแอป?):

```bash
curl -o /dev/null -s -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n' https://example.com
```

ถ้า `ttfb` (time to first byte) สูง แต่ค่าอื่นต่ำ = network เร็ว แต่ **แอปคิดนาน**

---

## Nginx error log — reverse proxy บอกว่า backend เป็นอะไร

access log บอกแค่ว่า user ได้ `502` / `504` แต่ **error log บอกว่าทำไม** (ปกติอยู่ที่ `/var/log/nginx/error.log`)

```
2026/10/15 11:06:02 [error] 29#29: *115 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.22, server: shop.local, request: "GET /api/products HTTP/1.1", upstream: "http://10.0.0.21:8080/api/products", host: "shop.local"
```

อ่านทีละส่วน: **เวลา** → `[error]` level → `*115` เลข connection (ใช้ grep หาบรรทัดอื่นของ request เดียวกัน) → **สาเหตุ** → `client:` ใครเรียก → `request:` เรียกอะไร → `upstream:` **backend ตัวไหน**

| ข้อความ | HTTP ที่ user เห็น | แปลว่า |
|---|---|---|
| `connect() failed (111: Connection refused)` | 502 | backend **ไม่ได้รัน** / ผิด port |
| `upstream timed out (110: Connection timed out) while connecting` | 504 | ต่อ backend ไม่ได้ (firewall / เครื่องดับ) |
| `upstream timed out (110: ...) while reading response header` | 504 | ต่อได้ แต่ **แอปตอบช้าเกิน** `proxy_read_timeout` (ค่าปกติ 60s) |
| `upstream prematurely closed connection` | 502 | แอป **crash / ปิด connection** ระหว่างตอบ |
| `no live upstreams` | 502 | backend **ทุกตัว** ถูก mark ว่าล่ม |
| `connect() to ... failed (13: Permission denied)` | 502 | บน Fedora/RHEL มักเป็น **SELinux** บล็อก nginx ไม่ให้ต่อ network → `sudo setsebool -P httpd_can_network_connect 1` |
| `client intended to send too large body` | 413 | upload ใหญ่เกิน `client_max_body_size` |

---

## Firewall log

firewall ปกติ **ไม่ log** สิ่งที่บล็อก ต้องเปิดก่อน:

```bash
sudo ufw logging on                          # Ubuntu (ufw) → ดูใน /var/log/ufw.log หรือ journalctl -k
sudo firewall-cmd --set-log-denied=all       # Fedora/RHEL (firewalld) → journalctl -k | grep -iE "REJECT|DROP"
```

ตัวอย่างบรรทัด (format เดียวกันทั้ง ufw / iptables / nftables ที่ใช้ LOG):

```
kernel: [UFW BLOCK] IN=eth0 OUT= MAC=... SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TTL=49 ID=31337 PROTO=TCP SPT=61000 DPT=3306 WINDOW=1024 SYN URGP=0
```

| Field | ความหมาย |
|---|---|
| `[UFW BLOCK]` | prefix ที่ rule ตั้งไว้ — บอกว่าโดน rule อะไร |
| `IN=eth0 OUT=` | เข้ามาทาง eth0 (ขาเข้า) |
| `SRC=` / `DST=` | IP ต้นทาง / ปลายทาง |
| `PROTO=TCP SPT= DPT=` | protocol, port ต้นทาง, **port ปลายทาง** (บริการที่ถูกเรียก) |
| `SYN` | เป็นการ **เปิด connection ใหม่** |
| `TTL=` | ค่าที่เหลือ — 64 มักเป็น Linux ใน network เดียวกัน, ค่าต่ำกว่านั้นมาไกลกว่า |

**รูปแบบที่ต้องอ่านออก:**
- IP เดียว + **หลาย DPT** ในเวลาสั้นๆ = **port scan**
- IP ภายในของเรา + **DPT เดิมซ้ำ** ห่าง 1s, 2s, 4s = แอปของเราพยายามต่อแต่โดนบล็อก (TCP retransmit) → **rule ผิด** ไม่ใช่การโจมตี

---

## tcpdump — ดู packet จริง

เมื่อ log ไม่พอ ให้ดูจากสายจริง:

```bash
sudo tcpdump -i any -nn port 5432                      # ทุก packet ของ port 5432
sudo tcpdump -i any -nn host 10.0.0.20 and port 8080
sudo tcpdump -i any -nn 'tcp[tcpflags] & tcp-rst != 0' # เฉพาะ RST (ถูกปฏิเสธ)
sudo tcpdump -i any -nn -w cap.pcap port 443           # บันทึกไฟล์ไปเปิดใน Wireshark
```

`-nn` = ไม่แปลง IP/port เป็นชื่อ (เร็วกว่าและอ่านง่ายกว่า)

**อ่าน Flags:** `[S]` SYN, `[S.]` SYN-ACK, `[.]` ACK, `[P.]` ส่งข้อมูล, `[F.]` ปิดปกติ, `[R]` / `[R.]` RST (ตัดทิ้ง)

```
# ✅ ปกติ — 3-way handshake ครบ
11:10:00.000100 IP 10.0.0.20.48810 > 10.0.0.10.5432: Flags [S], seq 1001, win 64240, length 0
11:10:00.000350 IP 10.0.0.10.5432 > 10.0.0.20.48810: Flags [S.], seq 5001, ack 1002, win 65160, length 0
11:10:00.000400 IP 10.0.0.20.48810 > 10.0.0.10.5432: Flags [.], ack 5002, win 502, length 0

# ❌ Connection refused — ส่ง SYN ไป ได้ RST กลับมาทันที
11:12:00.000100 IP 10.0.0.20.48900 > 10.0.0.21.8080: Flags [S], seq 2001, win 64240, length 0
11:12:00.000300 IP 10.0.0.21.8080 > 10.0.0.20.48900: Flags [R.], seq 0, ack 2002, win 0, length 0

# ❌ Timeout — SYN ซ้ำๆ ห่างขึ้นเรื่อยๆ ไม่มีใครตอบ (โดน DROP)
11:05:30.000100 IP 10.0.0.20.48810 > 10.0.0.10.5432: Flags [S], seq 3001, win 64240, length 0
11:05:31.010200 IP 10.0.0.20.48810 > 10.0.0.10.5432: Flags [S], seq 3001, win 64240, length 0
11:05:33.050300 IP 10.0.0.20.48810 > 10.0.0.10.5432: Flags [S], seq 3001, win 64240, length 0
```

:::tip[จับที่ฝั่งไหนดี?]
จับ **ทั้งสองฝั่ง** — ถ้าฝั่งส่งเห็น SYN ออกไป แต่ฝั่งรับไม่เห็นอะไรเลย แปลว่าโดนบล็อก **ระหว่างทาง** (security group, firewall กลาง, route)
:::

---

## DNS

```
$ dig api.shop.local

;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 40211      ← ① status
;; QUESTION SECTION:
;api.shop.local.                IN      A

;; Query time: 3 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)                       ← ② ใครตอบ
```

| status | แปลว่า |
|---|---|
| `NOERROR` + มี `ANSWER SECTION` | หาเจอ — ดู IP ว่าถูกไหม |
| `NOERROR` แต่ไม่มี answer | ชื่อมี แต่ไม่มี record ประเภทนั้น (เช่นมีแค่ AAAA) |
| `NXDOMAIN` | **ไม่มีชื่อนี้** — พิมพ์ผิด หรือยังไม่ได้สร้าง record |
| `SERVFAIL` | DNS server มีปัญหา (DNSSEC, upstream ล่ม) |
| `connection timed out; no servers could be reached` | ติดต่อ DNS server ไม่ได้เลย |

```bash
dig +short api.example.com             # เอาแค่ IP
dig @8.8.8.8 api.example.com           # ถาม DNS server อื่น เทียบผล
resolvectl query api.example.com       # ผ่าน systemd-resolved (ตัวที่ระบบใช้จริง)
journalctl -u systemd-resolved --since "10 min ago"
```

`SERVER: 127.0.0.53` = systemd-resolved ในเครื่อง ถ้า `dig` ได้แต่แอปไม่ได้ ให้เช็ค `/etc/hosts` และ `/etc/resolv.conf` ใน **container** ด้วย

---

## Cloud: VPC Flow Logs (AWS)

```
2 123456789012 eni-0a1b2c3d 10.0.1.20 10.0.2.10 48810 5432 6 3 180 1760500000 1760500060 REJECT OK
```

| ลำดับ | field | ค่า |
|---|---|---|
| 1–3 | version, account, interface | `2`, `123456789012`, `eni-0a1b2c3d` |
| 4–5 | srcaddr, dstaddr | `10.0.1.20` → `10.0.2.10` |
| 6–7 | srcport, dstport | `48810` → `5432` (PostgreSQL) |
| 8 | protocol | `6` = TCP (`17` = UDP, `1` = ICMP) |
| 9–10 | packets, bytes | `3`, `180` |
| 11–12 | start, end | unix timestamp |
| 13 | **action** | `ACCEPT` / **`REJECT`** — โดน Security Group หรือ NACL บล็อก |

```bash
awk '$13 == "REJECT" {print $4, "->", $5 ":" $7}' flow.log | sort | uniq -c | sort -rn
```

---

## แบบฝึกหัด: "API ช้าและบางทีก็พัง"

> หลัง deploy เมื่อเช้า ทีมแจ้งว่า `/api/orders` ค้างจน timeout และ `/api/products` พังเป็นพักๆ
> คุณได้ log จาก nginx (เครื่อง LB) และ firewall log จาก `db01` (10.0.0.10)
> app server มี 2 ตัว: `10.0.0.20` และ `10.0.0.21`

```bash
mkdir -p ~/devops-lab/logs-lab/net && cd ~/devops-lab/logs-lab/net

cat > nginx-error.log <<'EOF'
2026/10/15 11:05:40 [error] 29#29: *101 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.168.1.10, server: shop.local, request: "GET /api/orders HTTP/1.1", upstream: "http://10.0.0.20:8080/api/orders", host: "shop.local"
2026/10/15 11:06:02 [error] 29#29: *115 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.22, server: shop.local, request: "GET /api/products HTTP/1.1", upstream: "http://10.0.0.21:8080/api/products", host: "shop.local"
2026/10/15 11:06:03 [error] 29#29: *116 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.45, server: shop.local, request: "GET /api/products HTTP/1.1", upstream: "http://10.0.0.21:8080/api/products", host: "shop.local"
2026/10/15 11:06:10 [error] 29#29: *120 no live upstreams while connecting to upstream, client: 192.168.1.45, server: shop.local, request: "GET /api/products HTTP/1.1", upstream: "http://backend/api/products", host: "shop.local"
2026/10/15 11:07:00 [crit] 29#29: *130 connect() to 127.0.0.1:9000 failed (13: Permission denied) while connecting to upstream, client: 192.168.1.10, server: shop.local, request: "GET /admin HTTP/1.1", upstream: "fastcgi://127.0.0.1:9000", host: "shop.local"
2026/10/15 11:08:15 [error] 29#29: *140 upstream prematurely closed connection while reading response header from upstream, client: 192.168.1.22, server: shop.local, request: "POST /api/upload HTTP/1.1", upstream: "http://10.0.0.20:8080/api/upload", host: "shop.local"
EOF

cat > firewall.log <<'EOF'
Oct 15 11:00:01 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31337 PROTO=TCP SPT=61000 DPT=21 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:00:01 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31338 PROTO=TCP SPT=61000 DPT=23 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:00:01 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31339 PROTO=TCP SPT=61000 DPT=3306 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:00:02 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31340 PROTO=TCP SPT=61000 DPT=5432 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:00:02 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31341 PROTO=TCP SPT=61000 DPT=6379 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:00:02 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=198.51.100.23 DST=10.0.0.10 LEN=44 TOS=0x00 PREC=0x00 TTL=49 ID=31342 PROTO=TCP SPT=61000 DPT=8080 WINDOW=1024 RES=0x00 SYN URGP=0
Oct 15 11:05:30 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=10.0.0.20 DST=10.0.0.10 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=4242 DF PROTO=TCP SPT=48810 DPT=5432 WINDOW=64240 RES=0x00 SYN URGP=0
Oct 15 11:05:31 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=10.0.0.20 DST=10.0.0.10 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=4243 DF PROTO=TCP SPT=48810 DPT=5432 WINDOW=64240 RES=0x00 SYN URGP=0
Oct 15 11:05:33 db01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=52:54:00:12:34:56:52:54:00:ab:cd:ef:08:00 SRC=10.0.0.20 DST=10.0.0.10 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=4244 DF PROTO=TCP SPT=48810 DPT=5432 WINDOW=64240 RES=0x00 SYN URGP=0
EOF
```

### ข้อ 1 — nginx error log

```bash
# จัดกลุ่มตามชนิด error
sed -E 's/.*\*[0-9]+ ([^,]+),.*/\1/' nginx-error.log | sort | uniq -c | sort -rn

# backend ตัวไหนมีปัญหา
grep -oE 'upstream: "[^"]+"' nginx-error.log | sort | uniq -c | sort -rn
```

**คำถาม:** `10.0.0.20` กับ `10.0.0.21` มีปัญหาต่างกันยังไง? แล้ว `/admin` เป็นอะไร?

<details>
<summary>เฉลย</summary>

- **`10.0.0.21` → `Connection refused`** = เครื่องตอบกลับ แต่ไม่มีแอปฟัง port 8080 → **แอปบนเครื่องนี้ไม่ได้รัน** (deploy ไม่ขึ้น / crash) — พอทั้ง pool ถูก mark ว่าล่ม จึงตามมาด้วย `no live upstreams`
- **`10.0.0.20` → `upstream timed out ... while reading response header`** = ต่อแอปได้ แต่ **แอปไม่ตอบภายในเวลา** → แอปค้างรออะไรบางอย่าง (ดูข้อ 2) และ `prematurely closed` ตอน 11:08 คือแอปตัดทิ้งกลางทาง
- **`/admin` → `(13: Permission denied)` ที่ `127.0.0.1:9000`** = ไม่ใช่ปัญหา network แต่เป็น **SELinux** บล็อก nginx ไม่ให้ต่อ php-fpm (เจอบ่อยบน Fedora/RHEL)
</details>

### ข้อ 2 — firewall log ของ db01

```bash
# ใครโดนบล็อกบ้าง
grep -oE "SRC=[0-9.]+" firewall.log | sort | uniq -c | sort -rn

# แต่ละ IP ยิงมาที่ port อะไร
grep -oE "SRC=[0-9.]+|DPT=[0-9]+" firewall.log | paste - - | sort | uniq -c

# IP ไหนยิงหลาย port (port scan)
grep -oE "SRC=[0-9.]+|DPT=[0-9]+" firewall.log | paste - - | sort -u | awk '{print $1}' | uniq -c | sort -rn
```

**คำถาม:**
1. `198.51.100.23` ทำอะไร? ต้องกังวลไหม?
2. `10.0.0.20` โดนบล็อกที่ port อะไร? เวลาของมันบอกอะไร? เชื่อมกับข้อ 1 ยังไง?

<details>
<summary>เฉลย</summary>

1. ยิง **6 port ต่างกัน** (21, 23, 3306, 5432, 6379, 8080) ภายใน 1 วินาที, `WINDOW=1024` แบบเครื่องมือสแกน = **port scan จาก internet** — firewall บล็อกไว้แล้ว ถือเป็น noise ปกติ (แต่ควรเช็คว่าทำไม db01 ถึงรับ traffic จาก internet ได้)
2. `10.0.0.20` → `DPT=5432` (PostgreSQL) **ซ้ำ 3 ครั้ง** ที่ 11:05:30, :31, :33 — ห่าง 1s, 2s = **TCP retransmit** ของ connection เดียวกัน (`SPT=48810` เดิม) แปลว่าแอปพยายามต่อ DB แต่ **ถูก DROP**
   → แอปบน `10.0.0.20` ค้างรอ DB → nginx ได้ `upstream timed out` ตอน 11:05:40

**สรุป:** มี 2 ปัญหาแยกกัน
- `10.0.0.20` — firewall บน db01 ไม่อนุญาต app server ตัวนี้ (น่าจะเป็น server ใหม่จากการ deploy ที่ยังไม่ได้เพิ่ม rule) → `sudo ufw allow from 10.0.0.20 to any port 5432 proto tcp`
- `10.0.0.21` — แอปไม่ได้รัน → ไปดู `journalctl -u <app>` / `docker logs` บนเครื่องนั้น
</details>

### ข้อ 3 — ลองบนเครื่องจริง

```bash
# refused: port ที่ไม่มีใครฟัง (ตอบทันที)
curl -v http://localhost:9 2>&1 | grep -iE "refused|failed"

# timeout: IP ที่ไม่มีอยู่จริง (ค้างจนครบ 5 วินาที)
time curl -sS --connect-timeout 5 http://10.255.255.1

# DNS: ชื่อที่ไม่มี
curl -sS http://no-such-host.invalid
dig no-such-host.invalid | grep status
```

สังเกต **เวลา** ที่แต่ละคำสั่งใช้ และข้อความ error ของแต่ละแบบ — เทียบกับตารางด้านบน

<details>
<summary>ผลที่ควรได้ (curl 8.x)</summary>

```
* connect to 127.0.0.1 port 9 from 127.0.0.1 port 58820 failed: Connection refused
curl: (7) Failed to connect to localhost port 9 after 0 ms: Could not connect to server

curl: (28) Connection timed out after 5002 milliseconds
real    0m5.008s

curl: (6) Could not resolve host: no-such-host.invalid
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 50252
```

- refused ใช้ **0 ms** — ปลายทางตอบ RST กลับมาทันที
- timeout ใช้ **ครบ 5 วินาที** — ไม่มีใครตอบเลย (บาง network อาจได้ `No route to host` แทน)
- curl ใช้เลข exit code บอกชนิดได้ด้วย: `6` = DNS, `7` = ต่อไม่ได้, `28` = timeout, `60` = cert ไม่ผ่าน
</details>

---

:::tip[ต่อไป]
traffic แปลกๆ ใน log อาจไม่ใช่แค่ปัญหา แต่เป็นการโจมตี → [อ่าน Log ฝั่ง Security](/logs/security)
:::
