---
title: "อ่าน Log ฝั่ง Security - สืบว่าโดนเจาะไหม"
description: อ่าน auth log, sudo, auditd, web attack ใน access log, fail2ban และ cloud audit log เพื่อตอบว่าใครเข้ามา ทำอะไร และสำเร็จไหม
---

log ฝั่ง security ตอบคำถามคนละแบบกับ log ฝั่ง ops:
- ops ถามว่า **"ทำไมมันพัง?"**
- security ถามว่า **"ใครเข้ามา? ทำอะไรไปบ้าง? สำเร็จไหม?"**

การโจมตีเกือบทุกแบบ **ทิ้งร่องรอยไว้ใน log** ถ้าคุณรู้ว่าต้องดูตรงไหน

ฝึกจับ brute-force แบบลงมือจริงได้ที่ [Blue Team Lab](/security/blueteam/lab-01)

---

## แหล่ง log ด้าน security

| แหล่ง | ที่อยู่ / คำสั่ง | บอกอะไร |
|---|---|---|
| Auth log | `/var/log/auth.log` (Debian/Ubuntu), `/var/log/secure` (RHEL/Fedora), `journalctl -u sshd` | login, ssh, sudo, สร้าง user |
| Login history | `last`, `sudo lastb`, `lastlog` | ใคร login สำเร็จ / ล้มเหลว เมื่อไร จากไหน |
| auditd | `/var/log/audit/audit.log`, `ausearch`, `aureport` | การแก้ไฟล์สำคัญ, คำสั่งที่ถูกรัน (ตาม rule ที่ตั้ง) |
| Web access log | `/var/log/nginx/access.log` | SQLi, path traversal, scanner |
| fail2ban | `/var/log/fail2ban.log` | IP ที่ถูก ban อัตโนมัติ |
| Kubernetes audit | ตามที่ตั้งใน API server | ใครสร้าง/ลบ/อ่าน resource อะไร (เช่น อ่าน Secret) |
| Cloud | AWS CloudTrail, GCP Audit Logs, Azure Activity Log | API call ทุกครั้งบน cloud |

---

## อ่าน SSH / Auth log

| บรรทัด | ความหมาย |
|---|---|
| `Invalid user admin from 203.0.113.50 port 40112` | ลอง login ด้วย user ที่ **ไม่มีในระบบ** — สัญญาณของ bot เดา user |
| `Failed password for invalid user admin from ...` | รหัสผิด + user ไม่มีจริง |
| `Failed password for root from ...` | user มีจริง แต่รหัสผิด |
| `Accepted password for deploy from 203.0.113.50 ...` | **login สำเร็จด้วยรหัสผ่าน** |
| `Accepted publickey for alice from ... ssh2: ED25519 SHA256:k3J9...` | login สำเร็จด้วย SSH key — fingerprint บอกว่า **key ไหน** |
| `Connection closed by authenticating user root ... [preauth]` | ตัดก่อน login เสร็จ — มักเป็น bot |
| `pam_unix(sshd:session): session opened for user deploy(uid=1002)` | เริ่ม session — คู่กับ `session closed` บอกระยะเวลาที่อยู่ในเครื่อง |
| `sudo: deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow` | **deploy รันคำสั่งอะไรในฐานะ root** |
| `sudo: bob : user NOT in sudoers ; ... COMMAND=/bin/bash` | พยายามใช้ sudo โดยไม่มีสิทธิ์ |
| `useradd[2101]: new user: name=sysupdate, UID=1003, ...` | **มีการสร้าง user ใหม่** |

:::caution[สัญญาณอันตรายที่สุด]
**ล้มเหลวหลายครั้ง → แล้วสำเร็จ จาก IP เดียวกัน** = มีคนเดารหัสถูกแล้ว
จากนั้นให้ไล่ต่อทันทีว่า user นั้นทำอะไรต่อ (sudo, สร้าง user, เพิ่ม SSH key)
:::

**คำสั่งที่ใช้บ่อย:**

```bash
# failed login แยกตาม IP
sudo grep "Failed password" /var/log/auth.log | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn

# user ที่ถูกเดา
sudo grep "Failed password" /var/log/auth.log | sed -E 's/.*for (invalid user )?([^ ]+) from.*/\2/' | sort | uniq -c | sort -rn

# login สำเร็จทั้งหมด (ใคร จากไหน ด้วยวิธีอะไร)
sudo grep "Accepted" /var/log/auth.log

# sudo ที่ถูกใช้
sudo grep "COMMAND=" /var/log/auth.log

# บน Fedora/RHEL หรือเครื่องที่ไม่มีไฟล์ auth.log
sudo journalctl -u sshd --since today | grep -E "Failed|Accepted"
sudo journalctl _COMM=sudo --since today
```

---

## Persistence — ผู้บุกรุกทิ้งทางกลับไว้ที่ไหน

หลังเข้าได้ ผู้บุกรุกมักทำ **ทางเข้าถาวร** เพื่อกลับมาอีก ให้เช็ค:

| ร่องรอย | ดูยังไง |
|---|---|
| user ใหม่ / user ถูกเพิ่มเข้า group admin | `grep -E "useradd\|usermod\|groupadd" auth.log`, `getent group sudo wheel` |
| SSH key แปลกปลอม | `cat ~/.ssh/authorized_keys` ของทุก user + root, `ls -la --time-style=full-iso ~/.ssh/` |
| cron job ใหม่ | `crontab -l`, `sudo ls -la /etc/cron.*`, `journalctl -u cron` / `crond` |
| systemd service ใหม่ | `systemctl list-unit-files --state=enabled`, ไฟล์ใหม่ใน `/etc/systemd/system/` |
| log หาย / มีช่วงเวลาว่าง | ไฟล์ log ขนาด 0, เวลาใน log กระโดดข้าม, `~/.bash_history` ถูกลบหรือชี้ไป `/dev/null` |

:::danger[ถ้าสงสัยว่าโดนเจาะจริง]
อย่าเพิ่ง reboot หรือลบอะไร — **copy log เก็บไว้ที่อื่นก่อน** (หลักฐานอาจหาย) แล้วแจ้งทีม security
log ในเครื่องที่โดนเจาะ **เชื่อไม่ได้ 100%** เพราะผู้บุกรุกที่ได้ root แก้ไขได้ — นี่คือเหตุผลที่ต้องส่ง log ไปเก็บที่ส่วนกลาง
:::

---

## Web attack ใน access log

| การโจมตี | หน้าตาใน log (มักถูก URL-encode) |
|---|---|
| SQL Injection | `' OR 1=1--`, `UNION SELECT`, `%27`, `%20OR%20` |
| Path Traversal | `../../etc/passwd`, `%2e%2e%2f`, `..%2f` |
| XSS | `<script>`, `%3Cscript%3E`, `onerror=`, `javascript:` |
| Command Injection | `;cat /etc/passwd`, `\|id`, `$(whoami)`, `%3B` |
| Scanner / Recon | user-agent `sqlmap`, `Nikto`, `Nmap Scripting Engine`, `gobuster`, `wpscan`, ขอ `/.env` `/.git/config` `/wp-admin` |

**ถอดรหัส URL ให้อ่านออก:**

```bash
python3 -c "import sys, urllib.parse as u; print(u.unquote(sys.argv[1]))" '%27%20OR%201%3D1--'
# ' OR 1=1--
```

:::tip[status code + ขนาด response = โจมตีสำเร็จไหม]
- `403` / `404` / `400` = ส่วนใหญ่ถูกบล็อกหรือไม่ได้ผล
- `500` = payload ทำให้แอปพัง — **มีช่องโหว่ให้เจาะต่อ**
- `200` + **ขนาดใหญ่ผิดปกติ** เทียบกับ request ปกติไป path เดียวกัน = อาจ **ได้ข้อมูลออกไปแล้ว**
:::

ทำความรู้จักการโจมตีเหล่านี้ให้ลึกขึ้นที่ [AppSec - OWASP Top 10](/security/appsec/concepts)

---

## auditd — บันทึกสิ่งที่ log ปกติไม่เห็น

auditd (มีมาให้แล้วบน Fedora/RHEL) บันทึกตาม **rule ที่เราตั้ง** เช่น ใครแตะไฟล์สำคัญ:

```bash
# ตั้ง rule: เฝ้าดูการเขียน/เปลี่ยนสิทธิ์ไฟล์ /etc/passwd และ sudoers
sudo auditctl -w /etc/passwd -p wa -k identity
sudo auditctl -w /etc/sudoers -p wa -k identity

# ค้นด้วย key ที่ตั้งไว้ (-i = แปลง uid/syscall เป็นชื่อที่อ่านออก)
sudo ausearch -k identity -i

# รายงานสรุป
sudo aureport --auth --failed        # authentication ที่ล้มเหลว
sudo aureport -x --summary           # โปรแกรมที่ถูกรันบ่อย
```

บรรทัดดิบหน้าตาแบบนี้ — ดูที่ `auid` (user ที่ **login เข้ามาจริง** ไม่เปลี่ยนแม้จะ sudo), `comm`/`exe` (โปรแกรม) และ `key`:

```
type=SYSCALL msg=audit(1760468520.123:456): arch=c000003e syscall=257 success=yes ... auid=1002 uid=0 ... comm="vim" exe="/usr/bin/vim" key="identity"
```

`auid=1002 uid=0` = user 1002 (deploy) ใช้ sudo เป็น root แล้วแก้ไฟล์ — `auid` ทำให้รู้ว่า **ใครอยู่เบื้องหลัง root**

---

## fail2ban

```bash
sudo fail2ban-client status sshd       # จำนวน IP ที่ถูก ban ตอนนี้
sudo grep -E "Ban|Unban" /var/log/fail2ban.log | tail
```
```
2026-10-15 02:10:09,123 fail2ban.actions [812]: NOTICE  [sshd] Ban 203.0.113.50
```

---

## Cloud audit log (AWS CloudTrail)

ทุก API call บน AWS เป็น JSON — ใช้ `jq` แบบเดียวกับที่ฝึกมา:

```bash
# API ที่ถูกปฏิเสธ (มีคนพยายามทำสิ่งที่ไม่มีสิทธิ์)
jq -r '.Records[] | select(.errorCode == "AccessDenied")
  | [.eventTime, .userIdentity.arn, .eventName, .sourceIPAddress] | @tsv' cloudtrail.json

# การกระทำที่อันตราย
jq -r '.Records[] | select(.eventName | test("CreateUser|CreateAccessKey|AttachUserPolicy|DeleteTrail|StopLogging|PutBucketPolicy"))
  | [.eventTime, .userIdentity.arn, .eventName] | @tsv' cloudtrail.json
```

`DeleteTrail` / `StopLogging` = มีคนพยายาม **ปิด log** — สัญญาณแดงทันที

---

## แบบฝึกหัด: เกิดอะไรขึ้นตอนตี 2?

> เช้าวันที่ 15 ต.ค. ระบบ monitor แจ้งว่ามี user ใหม่ชื่อ `sysupdate` บน `web01` ซึ่งไม่มีใครในทีมสร้าง
> คุณได้ auth log และ access log ของเว็บช่วงกลางคืนมา — สืบให้ได้ว่าเกิดอะไรขึ้น

```bash
mkdir -p ~/devops-lab/logs-lab/sec && cd ~/devops-lab/logs-lab/sec

cat > auth.log <<'EOF'
Oct 15 02:10:01 web01 sshd[2001]: Invalid user admin from 203.0.113.50 port 40112
Oct 15 02:10:01 web01 sshd[2001]: Failed password for invalid user admin from 203.0.113.50 port 40112 ssh2
Oct 15 02:10:03 web01 sshd[2003]: Failed password for root from 203.0.113.50 port 40118 ssh2
Oct 15 02:10:05 web01 sshd[2005]: Failed password for root from 203.0.113.50 port 40124 ssh2
Oct 15 02:10:06 web01 sshd[2007]: Invalid user test from 203.0.113.50 port 40130
Oct 15 02:10:06 web01 sshd[2007]: Failed password for invalid user test from 203.0.113.50 port 40130 ssh2
Oct 15 02:10:08 web01 sshd[2009]: Failed password for deploy from 203.0.113.50 port 40136 ssh2
Oct 15 02:10:10 web01 sshd[2011]: Failed password for deploy from 203.0.113.50 port 40142 ssh2
Oct 15 02:10:12 web01 sshd[2013]: Accepted password for deploy from 203.0.113.50 port 40148 ssh2
Oct 15 02:10:12 web01 sshd[2013]: pam_unix(sshd:session): session opened for user deploy(uid=1002) by (uid=0)
Oct 15 02:11:30 web01 sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
Oct 15 02:12:05 web01 useradd[2101]: new user: name=sysupdate, UID=1003, GID=1003, home=/home/sysupdate, shell=/bin/bash
Oct 15 02:12:20 web01 sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/sbin/usermod -aG wheel sysupdate
Oct 15 02:13:02 web01 sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/tee -a /root/.ssh/authorized_keys
Oct 15 02:14:40 web01 sshd[2013]: pam_unix(sshd:session): session closed for user deploy
Oct 15 08:30:15 web01 sshd[3050]: Accepted publickey for alice from 192.168.1.10 port 52010 ssh2: ED25519 SHA256:k3J9xQ2mT7vYb1sP0aR4nW8cL6dF5gH2jK9zX1yV3uE
Oct 15 08:30:15 web01 sshd[3050]: pam_unix(sshd:session): session opened for user alice(uid=1000) by (uid=0)
Oct 15 08:45:02 web01 sudo:      bob : user NOT in sudoers ; TTY=pts/2 ; PWD=/home/bob ; USER=root ; COMMAND=/bin/bash
EOF

cat > web-attack.log <<'EOF'
198.51.100.7 - - [15/Oct/2026:03:00:01 +0700] "GET /products?id=42 HTTP/1.1" 200 2210 "-" "sqlmap/1.8#stable (https://sqlmap.org)"
198.51.100.7 - - [15/Oct/2026:03:00:02 +0700] "GET /products?id=42%27%20OR%201%3D1--%20- HTTP/1.1" 500 45 "-" "sqlmap/1.8#stable (https://sqlmap.org)"
198.51.100.7 - - [15/Oct/2026:03:00:03 +0700] "GET /products?id=42%20UNION%20SELECT%20username,password%20FROM%20users--%20- HTTP/1.1" 200 8812 "-" "sqlmap/1.8#stable (https://sqlmap.org)"
203.0.113.80 - - [15/Oct/2026:03:05:10 +0700] "GET /download?file=../../../../etc/passwd HTTP/1.1" 403 153 "-" "Mozilla/5.0"
203.0.113.80 - - [15/Oct/2026:03:05:11 +0700] "GET /download?file=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd HTTP/1.1" 200 1843 "-" "Mozilla/5.0"
203.0.113.81 - - [15/Oct/2026:03:07:00 +0700] "GET /search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E HTTP/1.1" 200 1500 "-" "Mozilla/5.0"
203.0.113.82 - - [15/Oct/2026:03:08:00 +0700] "GET /ping?host=8.8.8.8;cat%20/etc/passwd HTTP/1.1" 400 60 "-" "curl/8.5.0"
192.0.2.99 - - [15/Oct/2026:03:10:00 +0700] "GET /admin HTTP/1.1" 404 153 "-" "Mozilla/5.0 (compatible; Nmap Scripting Engine; https://nmap.org/book/nse.html)"
192.168.1.10 - - [15/Oct/2026:09:00:00 +0700] "GET /products?id=7 HTTP/1.1" 200 2190 "-" "Mozilla/5.0"
EOF
```

### ข้อ 1 — ใครเข้ามา?

```bash
grep "Failed password" auth.log | grep -oE "from [0-9.]+" | sort | uniq -c
grep "Failed password" auth.log | sed -E 's/.*for (invalid user )?([^ ]+) from.*/\2/' | sort | uniq -c | sort -rn
grep "Accepted" auth.log
```

**คำถาม:** IP ไหนโจมตี? ลองเดา user อะไรบ้าง? สำเร็จไหม — user ไหน วิธีไหน เวลาเท่าไร?

<details>
<summary>เฉลย</summary>

- `203.0.113.50` ล้มเหลว **6 ครั้งใน 9 วินาที** ลอง user `admin`, `test` (ไม่มีจริง), `root`, `deploy`
- **สำเร็จ** ที่ `02:10:12` เป็น user **`deploy`** ด้วย **password** — รหัสของ deploy อ่อนและเปิดให้ login ด้วย password ได้
- `alice` ตอน 08:30 จาก IP ภายใน ด้วย publickey = ปกติ
</details>

### ข้อ 2 — เข้ามาแล้วทำอะไร?

```bash
grep -E "COMMAND=|useradd|usermod|session (opened|closed)" auth.log
grep "COMMAND=" auth.log | sed -E 's/.*sudo: +([^ ]+) :.*COMMAND=(.*)/\1 -> \2/'
```

**คำถาม:** เรียงลำดับสิ่งที่ผู้บุกรุกทำ แต่ละอย่างมีเป้าหมายอะไร? อยู่ในเครื่องนานแค่ไหน? แล้ว `bob` ตอน 08:45 เกี่ยวไหม?

<details>
<summary>เฉลย</summary>

| เวลา | การกระทำ | เป้าหมาย |
|---|---|---|
| 02:10:12 | login เป็น `deploy` | เข้าเครื่อง |
| 02:11:30 | `sudo cat /etc/shadow` | ขโมย password hash ของทุก user ไปแครก |
| 02:12:05 | `useradd sysupdate` | สร้าง user ใหม่ ตั้งชื่อให้ดูเหมือนของระบบ |
| 02:12:20 | `usermod -aG wheel sysupdate` | ให้ user ใหม่ใช้ sudo ได้ |
| 02:13:02 | `tee -a /root/.ssh/authorized_keys` | ฝัง SSH key ให้ **root** — ทางกลับแม้จะเปลี่ยนรหัส deploy แล้ว |
| 02:14:40 | logout | อยู่ในเครื่อง ~4.5 นาที |

ผู้บุกรุกรู้รหัสของ `deploy` อยู่แล้ว และ `deploy` อยู่ใน sudoers → sudo ผ่าน = ได้ **root** เต็มตัว

`bob` = user ภายในที่ลองใช้ sudo โดยไม่มีสิทธิ์ — ถูกปฏิเสธ น่าจะไม่เกี่ยวกับเหตุการณ์ แต่ควรถามเจ้าตัว

**สิ่งที่ต้องทำ:**
1. block `203.0.113.50`, ลบ user `sysupdate`, ลบ key แปลกปลอมใน `/root/.ssh/authorized_keys`
2. เปลี่ยนรหัสผ่าน **ทุก user** (เพราะ `/etc/shadow` หลุดไปแล้ว)
3. ปิด `PasswordAuthentication` + `PermitRootLogin no` ใน `sshd_config`, ใช้ key อย่างเดียว, ติดตั้ง fail2ban
4. เช็ค persistence อื่น (cron, systemd, ไฟล์ที่ถูกแก้ช่วง 02:10–02:15) — หรือดีที่สุดคือ **rebuild เครื่องใหม่**
</details>

### ข้อ 3 — web attack

```bash
# ใครใช้เครื่องมืออะไร (user-agent คือ field ที่ 6 เมื่อแบ่งด้วย ")
awk -F'"' '{print $6}' web-attack.log | sort | uniq -c | sort -rn

# ถอดรหัส URL ทุกบรรทัด
awk '{print $1, $9, $10, $7}' web-attack.log | python3 -c "import sys, urllib.parse as u; [print(u.unquote(l.rstrip())) for l in sys.stdin]"

# payload ที่ได้ 200 กลับไป
grep -iE "union|%27|\.\./|%2e%2e|%3cscript|;cat" web-attack.log | awk '$9 == 200 {print $1, $9, $10, $7}'
```

**คำถาม:** แต่ละ IP พยายามโจมตีแบบไหน? อันไหน **น่าจะสำเร็จ** และดูจากอะไร?

<details>
<summary>เฉลย</summary>

| IP | การโจมตี | ผล |
|---|---|---|
| `198.51.100.7` | **SQL Injection** ด้วย sqlmap | `' OR 1=1` ได้ **500** (แอปพัง = มีช่องโหว่) แล้ว `UNION SELECT username,password FROM users` ได้ **200 ขนาด 8812 bytes** — ใหญ่กว่าหน้าปกติ (~2200) 4 เท่า → **น่าจะดึงข้อมูล user ออกไปแล้ว** 🚨 |
| `203.0.113.80` | **Path Traversal** | `../` ตรงๆ โดน **403** แต่พอ encode เป็น `%2e%2e%2f` ได้ **200 ขนาด 1843** = ขนาดพอๆ กับไฟล์ `/etc/passwd` → **WAF/filter ถูก bypass** 🚨 |
| `203.0.113.81` | **XSS** | 200 — ยังสรุปไม่ได้ เพราะหน้า search ตอบ 200 ปกติ ต้องไปเช็คว่าหน้าแสดง `<script>` ออกมาโดยไม่ escape ไหม |
| `203.0.113.82` | **Command Injection** | 400 — แอปปฏิเสธ input ✅ |
| `192.0.2.99` | **Nmap scan** หาหน้า admin | 404 ✅ |

บทเรียน: **status + ขนาด response** บอกได้ว่าการโจมตีสำเร็จไหม และ filter ที่บล็อกแค่ `../` แบบตรงๆ **ไม่พอ** — ต้อง decode ก่อนตรวจ
</details>

---

:::tip[สรุปหมวด Log]
ตอนนี้คุณอ่าน log ได้ครบทุกมุม: [พื้นฐาน](/logs/concepts) → [Dev](/logs/dev) → [Deploy](/logs/deploy) → [Network](/logs/network) → Security
ขั้นต่อไปคือ **รวม log ไว้ที่เดียว** และตั้ง alert อัตโนมัติ — ดู [Monitoring](/monitoring/concepts) และ [Blue Team](/security/blueteam/concepts)
:::
