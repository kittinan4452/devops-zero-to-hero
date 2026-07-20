---
title: "Lab 01 — เจาะ OWASP Top 10 บน Juice Shop"
description: "ลงมือหาและ exploit ช่องโหว่จริง: SQL Injection, XSS, Broken Access Control พร้อมวิธีแก้"
---

## เป้าหมาย

- Exploit ช่องโหว่ OWASP Top 10 จริงบน lab ของตัวเอง
- เข้าใจ "ทำไมมันพัง" ไม่ใช่แค่ copy payload
- เขียนวิธีแก้ (secure coding) สำหรับแต่ละช่องโหว่

:::caution[กฎเหล็ก]
ทำบน **OWASP Juice Shop บนเครื่องตัวเองเท่านั้น** เทคนิคเหล่านี้ถ้าใช้กับระบบคนอื่นโดยไม่ได้รับอนุญาต = ผิดกฎหมาย เราเรียนเพื่อ **ป้องกัน**
:::

---

## เตรียม Lab

ถ้ายังไม่ได้รัน Juice Shop (จาก [Foundations Lab 01](/security/foundations/lab-01)):

```bash
docker run --rm -d -p 3000:3000 --name juice-shop bkimminich/juice-shop
```

เปิด **http://localhost:3000** และเปิด **Developer Tools** ของเบราว์เซอร์ (F12) ไว้ตลอด — เราจะดู request/response กัน

---

## Exercise 1 — SQL Injection (A03) 🔴 Login Bypass

**เป้าหมาย:** login เป็น admin โดยไม่รู้รหัสผ่าน

1. ไปหน้า **Login**
2. Email: `admin@juice-sh.op'--`  (หรือ `' OR 1=1--`)
3. Password: อะไรก็ได้ เช่น `x`
4. กด Login

**เกิดอะไรขึ้น:** query ฝั่ง server ประมาณ
```sql
SELECT * FROM Users WHERE email = 'admin@juice-sh.op'--' AND password = '...'
```
เครื่องหมาย `--` ทำให้ส่วนเช็ค password ถูก comment ทิ้ง → login ผ่าน

**✅ วิธีแก้:** ใช้ parameterized query
```js
// ❌ เดิม
db.query(`SELECT * FROM Users WHERE email = '${email}'`)
// ✅ แก้
db.query('SELECT * FROM Users WHERE email = ?', [email])
```

---

## Exercise 2 — Cross-Site Scripting / XSS (A03) 🟡

**เป้าหมาย:** ทำให้เบราว์เซอร์รัน JavaScript ของเรา

1. ใช้ช่อง **Search** (บนสุดของเว็บ)
2. พิมพ์:
   ```html
   <iframe src="javascript:alert('XSS')">
   ```
3. กด Enter

**เกิดอะไรขึ้น:** แอปเอาคำค้นไปแสดงผลตรงๆ โดยไม่ encode → tag เราถูกรันเป็น HTML/JS จริง

**คิดต่อ:** ถ้าแทน `alert` ด้วยโค้ดขโมย cookie ล่ะ? นี่คือเหตุผลว่า XSS อันตราย

**✅ วิธีแก้:**
- Encode output ก่อนแสดง (`<` → `&lt;`)
- ตั้ง **Content-Security-Policy** header
- ใน framework เช่น React/Angular ให้ผูกข้อมูลผ่าน binding ปกติ อย่าใช้ raw HTML

---

## Exercise 3 — Broken Access Control / IDOR (A01) 🔴

**เป้าหมาย:** ดูตะกร้า (basket) ของ user คนอื่น

1. Login (จะด้วย SQLi จาก Ex.1 หรือสมัคร account ก็ได้)
2. เปิด Developer Tools → tab **Network**
3. กดดูตะกร้าตัวเอง สังเกต request เช่น `GET /rest/basket/1`
4. ลองแก้เลข → `GET /rest/basket/2`

**เกิดอะไรขึ้น:** server ไม่ได้เช็คว่า basket นั้นเป็นของ user ที่ login อยู่จริงไหม — แค่เปลี่ยน id ก็เห็นของคนอื่น = **IDOR**

**✅ วิธีแก้:** ตรวจ ownership ทุก request ฝั่ง server
```js
if (basket.userId !== currentUser.id) {
  return res.status(403).send('Forbidden')
}
```

---

## Exercise 4 — Security Misconfiguration (A05) 🟢

**เป้าหมาย:** หา endpoint/ข้อมูลที่ไม่ควรเปิด

1. ลองเข้า `http://localhost:3000/ftp` — มีไฟล์โผล่มาไหม?
2. ลองดู response header:
   ```bash
   curl -I http://localhost:3000
   ```
   header ด้าน security ครบไหม (`Content-Security-Policy`, `X-Frame-Options`)?

**✅ วิธีแก้:** ปิด directory listing, ตั้ง security header, ลบไฟล์/endpoint ที่ไม่ควร public

---

## Exercise 5 (ท้าทาย) — หา Score Board แล้วไล่เก็บ challenge

Juice Shop มีระบบให้คะแนนในตัว:

1. หาหน้า **Score Board** ให้เจอ (ซ่อนอยู่ — ใช้ทักษะ recon จาก Foundations)
2. เลือก challenge ระดับ ⭐ (1 ดาว) มาลองทำ 3 ข้อ
3. จดว่าแต่ละข้อตรงกับ OWASP ตัวไหน + วิธีแก้

:::tip
ทำ challenge เรียงจากดาวน้อยไปมาก จะไล่ระดับความยากได้พอดี — เก็บครบคือคุณเข้าใจ AppSec ระดับใช้งานจริงแล้ว
:::

---

## เก็บกวาด

```bash
docker stop juice-shop
```

---

## สรุปสิ่งที่ได้

| Exercise | ช่องโหว่ (OWASP) | บทเรียน |
|---|---|---|
| 1 | SQL Injection (A03) | อย่าต่อ string เป็น query → parameterize |
| 2 | XSS (A03) | encode output + CSP |
| 3 | IDOR (A01) | ตรวจสิทธิ์ทุก request ฝั่ง server |
| 4 | Misconfiguration (A05) | hardening + security header |

**ต่อไป:** Level 2 — [DevSecOps](/devsecops/concepts) เอาการสแกนช่องโหว่พวกนี้ไปทำ **อัตโนมัติใน CI/CD**
กลับไปดู [Roadmap](/security/roadmap) เพื่อเลือกก้าวต่อไป 🚀
