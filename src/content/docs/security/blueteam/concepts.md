---
title: "Level 5 — Blue Team / Defense"
description: "ฝั่งตั้งรับ: logging, SIEM, threat detection ด้วย MITRE ATT&CK และ incident response"
---

Blue Team คือฝั่ง **ตั้งรับ** — ตรวจจับ ตอบสนอง และกู้คืนจากการโจมตี ถ้า Red Team คือคนบุก Blue Team คือคนเฝ้าและป้องกันปราสาท

:::note[ต่อยอดจาก track เดิม]
Level นี้ต่อยอดแนวคิดจาก [Monitoring](/monitoring/concepts) — แต่โฟกัสที่ "จับสัญญาณการโจมตี" ไม่ใช่แค่ performance
:::

---

## 1. Logging — รากฐานของการตั้งรับ

**ถ้าไม่มี log = มองไม่เห็น = ตรวจจับไม่ได้** (OWASP A09)

สิ่งที่ควร log:
- **Authentication** — login สำเร็จ/ล้มเหลว, ใครล็อกอินจากไหน
- **Access** — เข้าถึง resource สำคัญ, สิทธิ์ที่ถูกใช้
- **การเปลี่ยนแปลง** — สร้าง/ลบ user, แก้ config, เปลี่ยนสิทธิ์
- **Error / anomaly** — request แปลกๆ, rate สูงผิดปกติ

หลักการ log ที่ดี:
```
✓ มี timestamp + source IP + user + action
✓ เก็บรวมศูนย์ (centralized) — attacker ลบ log เครื่องเดียวไม่พอ
✓ ป้องกันการแก้ไข (append-only / ส่งออกทันที)
✗ อย่า log ข้อมูลอ่อนไหว (password, token) ลงไปเอง
```

---

## 2. SIEM — รวมศูนย์และวิเคราะห์ log

**SIEM** (Security Information and Event Management) = ระบบที่รวบ log จากทุกที่มาวิเคราะห์หาสัญญาณการโจมตี

| SIEM | หมายเหตุ |
|---|---|
| **Wazuh** | open-source, เริ่มต้นดี (host-based + SIEM) |
| **Elastic Security** | ELK stack + security |
| **Splunk** | ทรงพลัง (เชิงพาณิชย์) |

SIEM ทำ: รวม log → normalize → ตั้ง rule แจ้งเตือน → dashboard → correlation (ต่อจุดหลายเหตุการณ์เป็นภาพเดียว)

---

## 3. Threat Detection — MITRE ATT&CK

**MITRE ATT&CK** คือ "แผนที่" ของเทคนิคที่ผู้โจมตีใช้จริง แบ่งเป็น tactic (เป้าหมาย) → technique (วิธี)

```
Tactic:   Initial Access → Execution → Persistence → Privilege Esc
          → Defense Evasion → Credential Access → ... → Exfiltration
```

ใช้ทำอะไร:
- ตรวจว่าเราตรวจจับ (detect) แต่ละ technique ได้หรือยัง (coverage)
- เขียน **detection rule** ให้ตรงกับพฤติกรรมจริงของผู้โจมตี

**Sigma** — ภาษากลางสำหรับเขียน detection rule (แปลงไปใช้กับ SIEM ไหนก็ได้)

---

## 4. Incident Response (IR) — เมื่อโดนโจมตีแล้วทำยังไง

6 ขั้นตอนมาตรฐาน (NIST/SANS):

```
1. Preparation   เตรียมพร้อม (playbook, log, ทีม, backup)
2. Identification ยืนยันว่าเป็น incident จริง + ขอบเขต
3. Containment   จำกัดความเสียหาย (ตัด network, isolate host)
4. Eradication   กำจัดต้นเหตุ (ลบ malware, ปิดช่องโหว่)
5. Recovery      กู้ระบบกลับมา + เฝ้าดูว่าไม่กลับมาอีก
6. Lessons Learned ทบทวน ปรับปรุง ไม่ให้เกิดซ้ำ
```

:::tip[กฎทองของ IR]
**Containment มาก่อน** — หยุดเลือดก่อนสืบสวน อย่ารีบ "รีบูต/ลบ" เพราะอาจทำลายหลักฐาน (forensics) ที่ต้องใช้
:::

---

## 5. Hardening & Prevention (กันไว้ก่อน)

- อัปเดต patch สม่ำเสมอ (ปิด CVE ที่รู้จัก)
- least privilege ทุกที่ (user, service, network)
- backup + ทดสอบ restore จริง (กัน ransomware)
- network segmentation (แบ่งโซน จำกัดการเคลื่อนที่ของผู้โจมตี)
- MFA ทุก account สำคัญ

---

## สรุป

| ด้าน | ทำอะไร |
|---|---|
| Logging | เก็บ log ให้ครบ + รวมศูนย์ + กันการแก้ไข |
| SIEM | รวม log วิเคราะห์ (Wazuh/Elastic/Splunk) |
| Detection | MITRE ATT&CK + Sigma rule |
| Incident Response | 6 ขั้น: Prep→Identify→Contain→Eradicate→Recover→Lessons |

ลงมือ → [Lab 01 — ตั้ง log monitoring + จับ brute-force](/security/blueteam/lab-01) 🧪
