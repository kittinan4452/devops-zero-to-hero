---
title: "🛡️ Security Roadmap — เส้นทางจากศูนย์สู่มือโปร"
description: "เส้นทางการเรียน Security ภาษาไทย ตั้งแต่พื้นฐานจนถึงระดับมืออาชีพ ครอบคลุม AppSec, Cloud/Container, Offensive และ Blue Team"
---

ยินดีต้อนรับสู่ **Security Zero to Hero** 🎯

หน้านี้คือ **แผนที่การเรียน (roadmap)** ทั้งหมด แนะนำให้เรียนตามลำดับ **Level 0 → 6** เพราะแต่ละ level ต่อยอดกัน
แต่ละหัวข้อมี **Concepts** (ทฤษฎี) + **Labs** (ลงมือทำจริง) เหมือน track อื่นในเว็บนี้

:::tip[เรียนยังไงให้ได้ผล]
Security เรียนจากการอ่านอย่างเดียวไม่พอ — **ต้องลงมือแตะเครื่องมือจริง** ทุก level มี lab ให้ทำบนเครื่อง local (Docker/VM) แบบปลอดภัย ไม่ไปยุ่งกับระบบคนอื่น
:::

---

## ภาพรวมเส้นทาง

```
Level 0  Foundations        พื้นฐานความมั่นคงปลอดภัย + mindset
   │
Level 1  Application Sec     OWASP Top 10, secure coding, ช่องโหว่เว็บ
   │
Level 2  DevSecOps           แทรก security ใน CI/CD (SAST/DAST/SCA)
   │
Level 3  Cloud & Container   hardening Docker/K8s/Cloud, IAM, CIS
   │
Level 4  Offensive (Red)     recon, exploitation, privesc, CTF
   │
Level 5  Blue Team (Defense) logging, SIEM, detection, incident response
   │
Level 6  Specialize          เลือกสายลึก + certs (OSCP/CKS/…)
```

---

## Level 0 — Foundations (พื้นฐาน) 🟢 Beginner

รากฐานที่ต้องแน่นก่อน ไม่งั้นเรียน level อื่นจะงง

- **CIA Triad** — Confidentiality, Integrity, Availability
- **คำศัพท์หลัก** — Threat, Vulnerability, Risk, Exploit, Attack surface ต่างกันยังไง
- **Attacker mindset** — คิดแบบคนโจมตีเพื่อป้องกันได้
- **พื้นฐานที่ต้องมี** — Linux command line + Networking (TCP/IP, port, DNS, HTTP)

👉 เริ่มที่ [Foundations Concepts](/security/foundations/concepts) แล้วทำ [Lab 01 — จัด Lab Environment](/security/foundations/lab-01)

---

## Level 1 — Application Security (AppSec) 🟢→🟡

ช่องโหว่ที่เจอบ่อยที่สุดในโลกจริง อยู่ในระดับแอปพลิเคชัน

- **OWASP Top 10** — 10 ช่องโหว่ที่เจอบ่อยที่สุด (Injection, Broken Access Control, XSS, …)
- **Secure Coding** — input validation, output encoding, parameterized query
- **Authentication & Session** — password hashing, JWT, OAuth, MFA
- **แหล่งฝึก** — OWASP Juice Shop, DVWA, PortSwigger Web Security Academy (ฟรี)

👉 เรียนได้เลยที่ [AppSec Concepts (OWASP Top 10)](/security/appsec/concepts) แล้วทำ [Lab 01 — เจาะ OWASP บน Juice Shop](/security/appsec/lab-01)

---

## Level 2 — DevSecOps 🟡 Intermediate

เอา security ไปแทรกใน pipeline แบบอัตโนมัติ — **เว็บนี้มีอยู่แล้ว!**

- **SAST** — สแกน source code (Semgrep, Bandit)
- **SCA** — สแกน dependency (Snyk, OWASP Dependency-Check)
- **Container Scan** — Trivy, Grype
- **Secret Detection** — Gitleaks, TruffleHog
- **IaC Scan** — Checkov, tfsec

👉 ไปเรียนต่อได้เลยที่ [DevSecOps Concepts](/devsecops/concepts) + [Lab — Trivy](/devsecops/lab-01)

---

## Level 3 — Cloud & Container Security 🟡→🔴

ยุคนี้ระบบอยู่บน cloud + container การตั้งค่าผิดพลาด (misconfig) คือช่องโหว่อันดับต้นๆ

- **Container Hardening** — rootless, read-only fs, drop capabilities, distroless image
- **Kubernetes Security** — RBAC, NetworkPolicy, Pod Security Standards, secrets
- **Cloud IAM** — least privilege, ไม่ hardcode key, ใช้ role
- **Benchmark** — CIS Benchmark, kube-bench, cloud misconfig (Prowler, ScoutSuite)

👉 เรียนที่ [Cloud & Container Security](/security/cloud-container/concepts) แล้วทำ [Lab 01 — Hardening + สแกน](/security/cloud-container/lab-01)

---

## Level 4 — Offensive Security / Pentest (Red Team) 🔴 Advanced

เรียนวิธีโจมตี **เพื่อป้องกัน** — ทำบน lab ของตัวเอง / เครื่องที่ได้รับอนุญาตเท่านั้น

:::caution[กฎเหล็ก]
ทดสอบเจาะระบบ **เฉพาะระบบที่คุณเป็นเจ้าของหรือได้รับอนุญาตเป็นลายลักษณ์อักษร** เท่านั้น การเจาะระบบคนอื่นโดยไม่ได้รับอนุญาตผิดกฎหมาย
:::

- **Recon** — เก็บข้อมูลเป้าหมาย (nmap, subdomain enum)
- **Web Exploitation** — ลงมือ exploit ช่องโหว่ OWASP บน lab
- **Privilege Escalation** — Linux/Windows privesc
- **ฝึกจริง** — TryHackMe, Hack The Box, PortSwigger, CTF

👉 เรียนที่ [Offensive Security](/security/offensive/concepts) แล้วทำ [Lab 01 — Recon + Web Exploitation](/security/offensive/lab-01)

---

## Level 5 — Blue Team / Defense 🔴 Advanced

ฝั่งตั้งรับ — ตรวจจับและตอบสนองภัยคุกคาม

- **Logging & Monitoring** — เก็บ log ให้ครบ, จับสัญญาณผิดปกติ
- **SIEM** — Wazuh, Elastic Security, Splunk
- **Threat Detection** — MITRE ATT&CK, detection rules (Sigma)
- **Incident Response** — 6 ขั้นตอน (Prep → Identify → Contain → Eradicate → Recover → Lessons)

👉 เรียนที่ [Blue Team / Defense](/security/blueteam/concepts) แล้วทำ [Lab 01 — Log Monitoring + Brute-Force](/security/blueteam/lab-01)

---

## Level 6 — Specialization + Certifications 🎓

เลือกสายที่ชอบแล้วลงลึก + สอบ cert เพื่อการันตีความสามารถ

| สาย | Certs แนะนำ |
|---|---|
| AppSec | Burp Suite Certified, OSWE |
| Pentest | eJPT (เริ่มต้น) → OSCP |
| Cloud Sec | AWS Security Specialty, CKS (Kubernetes) |
| Blue Team | BTL1, GCIH |
| ทั่วไป | CompTIA Security+ (พื้นฐานที่ดี) |

---

## เริ่มยังไงดี?

1. อ่านหน้านี้จบแล้ว → ไปที่ **[Level 0: Foundations](/security/foundations/concepts)**
2. ทำ **[Lab 01](/security/foundations/lab-01)** จัด environment ให้พร้อม
3. เรียนไล่ทีละ level อย่ารีบ — เข้าใจ concept ก่อนเสมอ แล้วค่อยลงมือ lab

พร้อมแล้วไปกันเลย 🚀
