---
title: "อ่าน Log ฝั่ง Dev - Stack Trace & Error ตอนเขียนโค้ด"
description: อ่าน stack trace ของ Python, Node.js, Java, Go แปล error ที่เจอบ่อยตอน dev ใช้ DevTools และเขียน log ในโค้ดตัวเองให้ดี
---

log ฝั่ง dev คือสิ่งที่เห็น **ทุกวัน** — terminal ที่รัน dev server, error ตอน `npm install`, stack trace ตอนรัน test, console ใน browser
ทักษะนี้คือพื้นฐานของการอ่าน log ทุกแบบ เพราะ log ฝั่ง deploy และ production ส่วนใหญ่ก็คือ error เดียวกันนี้ แค่ไปโผล่ที่อื่น

---

## Log ฝั่ง Dev อยู่ที่ไหน?

| ที่ | เห็นอะไร |
|---|---|
| Terminal ที่รัน dev server | request ที่เข้ามา, error ฝั่ง server, stack trace |
| Terminal ที่รัน build / test | compile error, type error, test ที่ fail |
| Browser DevTools → **Console** | JavaScript error ฝั่งหน้าเว็บ, CORS, warning ของ framework |
| Browser DevTools → **Network** | request ทุกตัว: status, header, response จริง, เวลา |
| IDE (Problems panel) | lint / type error ก่อนรันด้วยซ้ำ |

---

## อ่าน Stack Trace ทีละภาษา

**หลักการเดียวที่ใช้ได้ทุกภาษา:**
1. หา **ชนิดของ error + ข้อความ** ก่อน (บอกว่า "อะไร" พัง)
2. หา **frame แรกที่เป็นโค้ดของเรา** (บอกว่า "ตรงไหน" พัง) — ข้าม frame ที่อยู่ใน `node_modules/`, `site-packages/`, `java.base/`, `node:internal`
3. ไปดูบรรทัดนั้นในโค้ด แล้วถามว่า **"ค่าอะไรที่ไม่เป็นอย่างที่คิด"**

### Python — อ่านจากล่างขึ้นบน

```
Traceback (most recent call last):
  File "orders.py", line 21, in <module>             ← ③ จุดเริ่ม (เรียกจากไหน)
    print(checkout(cart, user))
          ~~~~~~~~^^^^^^^^^^^^
  File "orders.py", line 15, in checkout
    return total * (1 - get_discount(user))
                        ~~~~~~~~~~~~^^^^^^
  File "orders.py", line 10, in get_discount         ← ② พังที่บรรทัดนี้
    return user["tier"]["discount"]
           ~~~~~~~~~~~~^^^^^^^^^^^^
TypeError: 'NoneType' object is not subscriptable    ← ① อ่านอันนี้ก่อน
```

- `most recent call last` = frame **ล่างสุดคือที่ล่าสุด** (ที่พังจริง)
- เครื่องหมาย `~~~^^^` (Python 3.11+) ชี้ว่า **expression ส่วนไหน** ที่พัง — ที่นี่คือ `user["tier"]` เป็น `None` จึงเอา `["discount"]` ต่อไม่ได้

**Exception ซ้อนกัน** — ถ้าเห็นข้อความนี้ ให้อ่าน **อันบนสุด** เพราะนั่นคือต้นเหตุ:

```
FileNotFoundError: [Errno 2] No such file or directory: '/etc/shop/config.json'   ← ต้นเหตุจริง

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  ...
RuntimeError: cannot start: config missing (/etc/shop/config.json)               ← error ที่ถูกห่อไว้
```

(ถ้าเป็น `During handling of the above exception, another exception occurred` แปลว่า error ตัวที่สองเกิดขึ้น **ระหว่างจัดการ** ตัวแรก — ต้นเหตุก็ยังอยู่อันบน)

### Node.js / JavaScript — อ่านจากบนลงล่าง

```
TypeError: Cannot read properties of undefined (reading 'name')   ← ① error
    at show (/app/src/user.js:12:20)                               ← ② frame แรก = ที่พัง (ไฟล์:บรรทัด:คอลัมน์)
    at handler (/app/src/routes.js:30:10)                          ← ③ ใครเรียก show
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)   ← library ข้ามได้
    at node:internal/process/task_queues:95:5                              ← ภายใน Node ข้ามได้
```

`Cannot read properties of undefined (reading 'name')` = เขียน `x.name` แต่ `x` เป็น `undefined` → ไปดูว่า `x` มาจากไหน

### Java — บรรทัดบนคือ error, `Caused by` ล่างสุดคือต้นเหตุ

```
Exception in thread "main" java.lang.IllegalStateException: Failed to start app
    at com.shop.App.start(App.java:42)
    at com.shop.App.main(App.java:10)
Caused by: org.postgresql.util.PSQLException: Connection to localhost:5432 refused
    at org.postgresql.core.v3.ConnectionFactoryImpl.openConnectionImpl(...)
    ... 12 more
Caused by: java.net.ConnectException: Connection refused        ← ต้นเหตุลึกสุด
    ... 15 more
```

`... 12 more` = frame ที่ซ้ำกับข้างบน ถูกย่อไว้ ไม่ต้องสนใจ

### Go — `panic` + goroutine

```
panic: runtime error: index out of range [5] with length 3     ← ① error

goroutine 1 [running]:
main.getItem(...)
        /app/main.go:14                                         ← ② ที่พัง
main.main()
        /app/main.go:20 +0x1d
exit status 2
```

---

## Error ที่เจอบ่อยตอน Dev (แปลไทย)

| Error | แปลว่า | แก้ยังไง |
|---|---|---|
| `EADDRINUSE: address already in use :::3000` / `OSError: [Errno 98] Address already in use` | มีโปรแกรมใช้ port นั้นอยู่แล้ว (มักเป็น dev server ตัวเก่าที่ยังไม่ปิด) | `ss -ltnp \| grep 3000` หรือ `lsof -i :3000` แล้ว kill |
| `ECONNREFUSED 127.0.0.1:5432` | ต่อ DB ไม่ได้ — DB ไม่ได้รัน หรือ **อยู่คนละ container** | ใน Docker Compose ใช้ **ชื่อ service** (`db:5432`) ไม่ใช่ `localhost` |
| `ENOENT: no such file or directory` | หาไฟล์ไม่เจอ | เช็ค path, รันจากโฟลเดอร์ถูกไหม (`pwd`) |
| `EACCES: permission denied` | ไม่มีสิทธิ์ | เช็ค `ls -l` อย่าแก้ด้วย `sudo npm install` |
| `Cannot find module 'express'` / `ModuleNotFoundError: No module named 'requests'` | ยังไม่ได้ติดตั้ง package | `npm install` / เปิด venv ก่อน (`source .venv/bin/activate`) |
| `npm error ERESOLVE unable to resolve dependency tree` | version ของ package ชนกัน | อ่านบรรทัด `Found:` กับ `Could not resolve dependency:` ว่าตัวไหนต้องการ version อะไร |
| `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` | คาดว่าจะได้ JSON แต่ได้ **หน้า HTML** (มักเป็นหน้า 404 / error) | เปิด Network tab ดู URL กับ response จริง |
| `...has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header` | browser ไม่ยอมให้หน้าเว็บเรียก API คนละ origin | ต้องแก้ที่ **ฝั่ง server** (เปิด CORS ให้ origin นั้น) หรือใช้ proxy ของ dev server |
| `src/app.ts(12,5): error TS2339: Property 'nmae' does not exist on type 'User'` | TypeScript error ที่ `ไฟล์(บรรทัด,คอลัมน์)` | มักพิมพ์ผิด หรือ type ไม่ตรง |
| `Killed` (เฉยๆ ไม่มีอะไรต่อ) | โดน OOM killer | `sudo dmesg -T \| grep -i killed` |

:::tip[npm / pip error ยาวเป็นหน้า]
มองหาบรรทัด **`npm error code ...`** (npm รุ่นเก่าเขียน `npm ERR!`) — บรรทัดนั้นบอกชนิด error
และท้ายสุด npm จะบอก path ของ log เต็ม เช่น `~/.npm/_logs/...-debug-0.log`
:::

---

## Browser DevTools (F12)

### Console
- สีแดง = error, เหลือง = warning — **คลิกชื่อไฟล์ทางขวา** เพื่อกระโดดไปที่บรรทัด
- กรองตาม level ได้ (Errors / Warnings / Info)
- error ที่ขึ้นว่า `Uncaught (in promise)` = ลืม `catch` ของ `async` / `fetch`

### Network
- เปิด **Preserve log** ไว้ ไม่งั้น log หายตอนเปลี่ยนหน้า / redirect
- คลิก request → แท็บ **Headers** (URL, status, CORS header), **Response** (เนื้อหาจริงที่ server ส่งกลับ), **Timing** (ช้าที่ DNS, connect หรือรอ server)
- คลิกขวา → **Copy as cURL** แล้วเอาไปรันใน terminal เพื่อทดสอบซ้ำได้

:::note[Console vs Network]
Console บอกว่า "JavaScript พัง" แต่หลายครั้งต้นเหตุคือ API ตอบผิด — ให้เปิด Network ดู **response จริง** เสมอ
:::

---

## เปิดโหมด verbose เมื่อ log ไม่พอ

| เครื่องมือ | เปิด log ละเอียด |
|---|---|
| curl | `curl -v` |
| ssh | `ssh -vvv user@host` |
| npm | `npm install --loglevel verbose` |
| pip | `pip install -v <pkg>` |
| git | `GIT_TRACE=1 git pull` |
| Express (Node) | `DEBUG=express:* node app.js` |
| Docker build | `docker build --progress=plain --no-cache .` |
| kubectl | `kubectl get pods -v=6` (เห็น HTTP request ที่ยิงไป API server) |
| Terraform | `TF_LOG=DEBUG terraform plan` |
| Ansible | `ansible-playbook site.yml -vvv` |

---

## เขียน Log ในโค้ดตัวเองให้ดี

log ที่ดีคือ log ที่ **คนอื่นอ่านตอนตี 3 แล้วเข้าใจ** (รวมถึงตัวคุณเองในอีก 6 เดือน)

```
❌ แย่                        ✅ ดี
print("error")               ERROR payment failed order_id=1042 user_id=17 provider=stripe reason="card_declined"
print("here 2")              DEBUG cart loaded items=3 total=250.00
print(e)                     ERROR db query failed query=get_orders duration_ms=5003 error="timeout"
```

**กฎง่ายๆ:**
- ใช้ **level ให้ถูก** — ไม่ใช่ทุกอย่างเป็น ERROR
- ใส่ **บริบท**: id ของสิ่งที่เกี่ยวข้อง (`order_id`, `request_id`, `user_id`)
- log **ครั้งเดียวต่อ error** — อย่า catch แล้ว log ซ้ำทุกชั้น
- ใน production ใช้ **JSON** เพื่อให้ค้นได้ (ดู [Concepts](/logs/concepts))
- **ห้าม log** password, token, เลขบัตร, ข้อมูลส่วนตัว

ตัวอย่าง Python:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("checkout")

def charge(order_id, amount):
    log.info("charging order_id=%s amount=%.2f", order_id, amount)
    try:
        ...
    except TimeoutError:
        log.exception("charge failed order_id=%s", order_id)   # .exception() แนบ stack trace ให้อัตโนมัติ
        raise
```

---

## แบบฝึกหัด

```bash
mkdir -p ~/devops-lab/logs-lab/dev && cd ~/devops-lab/logs-lab/dev
```

### ข้อ 1 — อ่าน Python traceback

```bash
cat > orders.py <<'EOF'
import json


def load_config(path):
    with open(path) as f:
        return json.load(f)


def get_discount(user):
    return user["tier"]["discount"]


def checkout(cart, user):
    total = sum(item["price"] * item["qty"] for item in cart)
    return total * (1 - get_discount(user))


if __name__ == "__main__":
    cart = [{"price": 100, "qty": 2}, {"price": 50, "qty": 1}]
    user = {"name": "alice", "tier": None}
    print(checkout(cart, user))
EOF

python3 orders.py
```

**คำถาม:** error คืออะไร? พังที่บรรทัดไหน ฟังก์ชันอะไร? ค่าไหนที่ผิด? แก้ยังไงให้ user ที่ไม่มี tier ได้ส่วนลด 0?

<details>
<summary>เฉลย</summary>

- error: `TypeError: 'NoneType' object is not subscriptable`
- พังที่ `get_discount` บรรทัด 10 — `user["tier"]` เป็น `None` จึงทำ `["discount"]` ต่อไม่ได้
- ต้นเหตุจริงคือข้อมูล: `"tier": None` ในบรรทัด 20
- แก้:

```python
def get_discount(user):
    tier = user.get("tier") or {}
    return tier.get("discount", 0)
```

รันใหม่จะได้ `250`
</details>

### ข้อ 2 — Exception ซ้อนกัน

```bash
cat > config_loader.py <<'EOF'
import json


def load_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError as e:
        raise RuntimeError(f"cannot start: config missing ({path})") from e


load_config("/etc/shop/config.json")
EOF

python3 config_loader.py
```

**คำถาม:** มี traceback กี่ก้อน? ก้อนไหนบอกต้นเหตุ?

<details>
<summary>เฉลย</summary>

มี **2 ก้อน** คั่นด้วย `The above exception was the direct cause of the following exception:`
- ก้อนบน: `FileNotFoundError` — **ต้นเหตุจริง** (ไม่มีไฟล์ `/etc/shop/config.json`)
- ก้อนล่าง: `RuntimeError` — โค้ดเราห่อ error ไว้ให้ข้อความอ่านง่ายขึ้น
</details>

### ข้อ 3 — Port ชนกัน

```bash
python3 -m http.server 8000 &          # ตัวแรก รันอยู่เบื้องหลัง
python3 -m http.server 8000            # ตัวที่สอง จะพัง
```

**คำถาม:** error คืออะไร? หาว่าใครใช้ port 8000 อยู่ แล้วปิดมัน

<details>
<summary>เฉลย</summary>

```
OSError: [Errno 98] Address already in use
```

```bash
ss -ltnp | grep :8000      # จะเห็น pid ของ python3
kill %1                    # ปิด job แรก (หรือ kill <PID>)
```

บน macOS: `lsof -i :8000`
</details>

### ข้อ 4 — Node.js (ถ้ามี node)

```bash
node -e 'function show(user) { return user.name.toUpperCase() }; show(undefined)'
node -e 'JSON.parse("<!DOCTYPE html><html>")'
```

**คำถาม:** error แต่ละอันแปลว่าอะไร? ถ้าเจออันที่สองในแอปจริง ควรไปดูที่ไหนต่อ?

<details>
<summary>เฉลย</summary>

1. `TypeError: Cannot read properties of undefined (reading 'name')` — เรียก `.name` บนค่าที่เป็น `undefined` (frame แรก `at show ([eval]:1:...)` บอกว่าอยู่ในฟังก์ชัน `show`)
2. `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` — โค้ดคาดว่าจะได้ JSON แต่ได้ HTML → ไปเปิด **DevTools → Network** ดู request นั้น มักเป็น URL ผิด (ได้หน้า 404) หรือ server error (ได้หน้า 500 เป็น HTML)
</details>

---

:::tip[ต่อไป]
error เดียวกันนี้แหละที่จะไปโผล่ใน pipeline — ไปต่อที่ [อ่าน Log ฝั่ง Deploy](/logs/deploy)
:::
