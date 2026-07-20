---
title: "Level 4 — Offensive Security / Pentest"
description: "แนวคิดการทดสอบเจาะระบบอย่างมีจริยธรรม: recon, exploitation, privilege escalation และขั้นตอน pentest"
---

เรียนวิธี "โจมตี" เพื่อ **ป้องกัน** ได้เก่งขึ้น — เข้าใจว่าผู้โจมตีทำงานยังไง จะออกแบบการป้องกันได้ตรงจุด

:::caution[กฎหมายและจริยธรรม — อ่านก่อน]
ทดสอบเจาะระบบได้ **เฉพาะ**:
1. ระบบที่คุณเป็นเจ้าของ (lab, VM ของตัวเอง)
2. แพลตฟอร์มฝึกที่อนุญาต (TryHackMe, Hack The Box, PortSwigger)
3. งานที่มี **สัญญา/หนังสืออนุญาตเป็นลายลักษณ์อักษร** (authorized pentest)

การเจาะระบบคนอื่นโดยไม่ได้รับอนุญาต **ผิดกฎหมาย** (พ.ร.บ. คอมพิวเตอร์) แม้ "แค่ลอง"
:::

---

## ขั้นตอนการทำ Pentest (Penetration Testing Lifecycle)

```
1. Reconnaissance   เก็บข้อมูลเป้าหมาย
2. Scanning         หา port/service/ช่องโหว่
3. Exploitation     ยิงผ่านช่องโหว่เข้าไป
4. Post-Exploitation ยกระดับสิทธิ์ / เคลื่อนที่ในระบบ
5. Reporting        เขียนรายงาน + วิธีแก้ (สำคัญที่สุด!)
```

:::note
งาน pentest จริง **มูลค่าอยู่ที่รายงาน** ไม่ใช่การเจาะ — ลูกค้าจ่ายเงินเพื่อรู้ว่ามีช่องโหว่อะไรและแก้ยังไง
:::

---

## 1. Reconnaissance (เก็บข้อมูล)

- **Passive** — เก็บข้อมูลโดยไม่แตะเป้าหมายตรงๆ (Google, WHOIS, certificate, LinkedIn)
- **Active** — ยิง request ไปที่เป้าหมาย (แต่ต้องได้รับอนุญาตแล้ว)

เครื่องมือ: `whois`, `dig`, subdomain enumeration, Google dorking

---

## 2. Scanning

**Nmap** — เครื่องมือ scan port มาตรฐาน
```bash
nmap -sV -sC target        # ดู service + version + script พื้นฐาน
nmap -p- target            # scan ทุก port
```

**หาช่องโหว่:** Nikto (web), Nuclei (template-based), OWASP ZAP

---

## 3. Exploitation

ยิงผ่านช่องโหว่ที่เจอ ประเภทที่เจอบ่อย:
- **Web** — SQLi, XSS, command injection, file upload (ต่อจาก Level 1 AppSec)
- **Service** — service เวอร์ชันเก่าที่มี CVE รู้จัก
- เครื่องมือ: **Metasploit**, **Burp Suite**, sqlmap, manual exploitation

:::tip
ฝึก manual ก่อน เข้าใจว่า payload ทำงานยังไง — อย่าพึ่งเครื่องมืออัตโนมัติอย่างเดียว ไม่งั้นจะได้แค่ "กดปุ่ม" ไม่เข้าใจจริง
:::

---

## 4. Post-Exploitation — Privilege Escalation

เข้าได้แล้วมักได้สิทธิ์ต่ำ ต้อง "ยกระดับ" เป็น root/admin

**Linux privesc — จุดที่มองหา:**
```bash
sudo -l                    # คำสั่งที่รันเป็น root ได้
find / -perm -4000 2>/dev/null   # หา SUID binary
cat /etc/crontab           # cron job ที่รันเป็น root
```
เครื่องมือช่วย: LinPEAS, GTFOBins (เว็บรวมวิธี abuse binary)

**ป้องกันฝั่ง defense:** ปิด SUID ที่ไม่จำเป็น, จำกัด sudo, least privilege

---

## 5. Reporting

รายงานที่ดีมี:
- **Executive summary** — สรุปให้ผู้บริหารเข้าใจความเสี่ยง
- **Findings** — แต่ละช่องโหว่ + ระดับความรุนแรง (CVSS) + หลักฐาน (PoC)
- **Remediation** — วิธีแก้ที่ทำได้จริง

---

## แพลตฟอร์มฝึกที่ถูกกฎหมาย 🎯

| แพลตฟอร์ม | เหมาะกับ |
|---|---|
| **PortSwigger Web Security Academy** | Web (ฟรี, ดีที่สุดสำหรับ AppSec) |
| **TryHackMe** | เริ่มต้น มี guided path |
| **Hack The Box** | ระดับกลาง-สูง, machine จริง |
| **OWASP Juice Shop** | web app มีช่องโหว่ (local) |
| **VulnHub** | VM ให้โหลดมาเจาะ offline |

---

## สรุป

| ขั้น | ทำอะไร |
|---|---|
| Recon | เก็บข้อมูล (passive ก่อน) |
| Scanning | nmap หา port/service |
| Exploitation | ยิงผ่านช่องโหว่ |
| Privesc | ยกระดับสิทธิ์ |
| Reporting | เขียนรายงาน + วิธีแก้ |

ลงมือ → [Lab 01 — Recon + Web Exploitation](/security/offensive/lab-01) 🧪
