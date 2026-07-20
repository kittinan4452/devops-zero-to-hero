---
title: "Level 6 — เลือกสาย + Certifications"
description: "วางแผนอาชีพ security: สายงานหลัก, certifications แนะนำ และวิธีสร้าง portfolio"
---

เรียนครบทุก level แล้ว ถึงเวลาเลือก "สายที่ใช่" แล้วลงลึก — security มีหลายสายมาก ไม่ต้องเก่งทุกอย่าง

---

## สายงาน Security หลักๆ

| สาย | ทำอะไร | เหมาะกับคนที่ |
|---|---|---|
| **AppSec** | ดูแลความปลอดภัยของแอป, review code, secure SDLC | ชอบเขียนโค้ด + หาช่องโหว่ |
| **DevSecOps** | ฝัง security ใน CI/CD, automation | ชอบ DevOps + automation |
| **Penetration Tester** | เจาะระบบตามสัญญา + เขียนรายงาน | ชอบ offensive, แก้ปริศนา |
| **Cloud Security** | ดูแล security บน AWS/GCP/Azure/K8s | ชอบ cloud + infra |
| **SOC Analyst / Blue Team** | เฝ้าระวัง ตรวจจับ ตอบสนอง incident | ชอบ analyze + ตั้งรับ |
| **Security Engineer** | สร้าง/ดูแลระบบป้องกันขององค์กร | ชอบสร้างระบบ |
| **GRC** | Governance, Risk, Compliance (นโยบาย, audit) | ชอบงานเชิงนโยบาย/มาตรฐาน |

---

## Certifications แนะนำ (ตามลำดับ)

### เริ่มต้น 🟢
- **CompTIA Security+** — พื้นฐานกว้าง เข้าใจภาพรวม (เหมาะเป็นใบแรก)
- **eJPT** — pentest เริ่มต้น hands-on

### ระดับกลาง 🟡
- **Burp Suite Certified Practitioner** — AppSec/web
- **CKS (Certified Kubernetes Security)** — cloud-native security
- **AWS Security Specialty** — cloud
- **BTL1 (Blue Team Level 1)** — สาย defense

### ระดับสูง 🔴
- **OSCP** — pentest ที่วงการยอมรับสูงสุด (hands-on หนัก)
- **OSWE** — web exploitation ขั้นสูง
- **CISSP** — สาย management/architecture (ต้องมีประสบการณ์)

:::tip[อย่าเพิ่งรีบสอบ cert]
Cert ช่วย "เปิดประตู" แต่สิ่งที่ทำให้ได้งานจริงคือ **ทักษะที่พิสูจน์ได้** — เก็บ cert หลังจากทำ lab/โปรเจคจนคล่องแล้ว จะคุ้มกว่า
:::

---

## สร้าง Portfolio ให้คนเห็นฝีมือ

Cert อย่างเดียวไม่พอ — แสดงให้เห็นว่าทำได้จริง:

- **เขียน write-up** — ทำ CTF / TryHackMe / HTB แล้วเขียนอธิบายวิธีทำ (blog, GitHub)
- **GitHub** — เก็บ tool/script ที่เขียนเอง, homelab config
- **Bug Bounty** — ลองบน HackerOne / Bugcrowd (โปรแกรมที่อนุญาต) ได้ทั้งเงินและ proof
- **มีส่วนร่วม community** — เขียน blog, พูด meetup, ตอบคำถาม

---

## แผนฝึกต่อ (หลังจบ roadmap นี้)

```
1. เลือก 1 สายที่ชอบที่สุดจากตารางข้างบน
2. ทำ lab บนแพลตฟอร์มของสายนั้นให้คล่อง
   - AppSec/Pentest → PortSwigger + HTB
   - Blue Team     → Wazuh homelab + Blue Team Labs
   - Cloud         → cloud free tier + CKS lab
3. เขียน write-up ทุกอันที่ทำ (สร้าง portfolio ไปด้วย)
4. เก็บ cert ของสายนั้น
5. สมัครงาน junior / internship ในสายนั้น
```

---

## แหล่งเรียนรู้ต่อ (ฟรี)

- **PortSwigger Web Security Academy** — AppSec ที่ดีที่สุด ฟรี
- **TryHackMe** — learning path แบบ guided
- **Hack The Box** — machine + academy
- **OWASP** — เอกสารมาตรฐาน (Top 10, Cheat Sheets, ASVS)
- **MITRE ATT&CK** — ฐานความรู้ threat
- **YouTube** — LiveOverflow, John Hammond, IppSec

---

## สรุป

เส้นทาง Security Zero to Hero จบที่นี่ 🎓 แต่ security คือการเรียนรู้ **ตลอดชีวิต** เพราะภัยคุกคามเปลี่ยนตลอด

- เลือกสายที่ชอบ → ลงลึก → สร้าง portfolio → เก็บ cert
- ทำ lab เยอะๆ อย่าอ่านอย่างเดียว
- อยู่ในกรอบกฎหมายและจริยธรรมเสมอ (White Hat)

ขอให้สนุกกับการเรียน! กลับไปทบทวน [Roadmap](/security/roadmap) ได้ทุกเมื่อ 🚀
