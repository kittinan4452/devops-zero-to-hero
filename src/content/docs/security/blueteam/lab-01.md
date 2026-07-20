---
title: "Lab 01 — Log Monitoring + จับ Brute-Force"
description: "ฝึกฝั่งตั้งรับ: อ่าน log หาการโจมตี จำลอง brute-force แล้วเขียน detection เบื้องต้น"
---

## เป้าหมาย

- อ่าน auth log หาสัญญาณการโจมตี
- จำลอง brute-force attack แล้วดูว่ามันทิ้งร่องรอยยังไง
- เขียน detection เบื้องต้นด้วย command line
- (ท้าทาย) ลอง Wazuh SIEM

:::caution
ทำบนเครื่อง/VM ของตัวเองเท่านั้น
:::

---

## Exercise 1 — รู้จัก auth log

บน Linux การ login ทุกครั้งถูกบันทึกไว้:
```bash
# Debian/Ubuntu
sudo tail -f /var/log/auth.log

# RHEL/Fedora
sudo journalctl -u sshd -f
```

ลอง `sudo` ผิดรหัสดู แล้วดูว่ามันขึ้น log ว่าอะไร — นี่คือร่องรอยที่ blue team ใช้

---

## Exercise 2 — จำลองเป้าหมาย + brute-force (ในกล่องปิด)

รัน SSH server ใน container เพื่อจำลองการโจมตี **แบบปลอดภัย**:
```bash
# เป้าหมายจำลอง (SSH ที่ตั้งรหัสอ่อนไว้ตั้งใจ)
docker run --rm -d --name victim -p 2222:22 \
  -e ROOT_PASSWORD=weakpass rastasheep/ubuntu-sshd:18.04 2>/dev/null || \
  echo "ใช้ image ssh อะไรก็ได้ที่คุณมี"

# จำลอง brute-force ด้วยการลอง login ผิดหลายครั้ง (hydra — เครื่องมือฝึก)
# sudo apt install hydra
# hydra -l root -P /usr/share/wordlists/rockyou.txt -t 4 ssh://localhost:2222
```

:::note
ที่นี่เราสนใจ "**ร่องรอยที่การโจมตีทิ้งไว้**" มากกว่าตัวการโจมตี — เพื่อฝึกตรวจจับ
:::

---

## Exercise 3 — เขียน detection เบื้องต้น

สัญญาณคลาสสิกของ brute-force = **login ล้มเหลวจำนวนมากจาก IP เดียวในเวลาสั้น**

```bash
# นับ failed login แยกตาม IP (บน auth.log)
sudo grep "Failed password" /var/log/auth.log \
  | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn

# IP ไหนที่ fail เกิน 10 ครั้ง = น่าสงสัย
```

**นี่คือหลักการเดียวกับที่ SIEM ทำ** เพียงแต่ SIEM ทำอัตโนมัติ + แจ้งเตือน real-time

---

## Exercise 4 — ป้องกันจริงด้วย fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban

# ดูว่ามันแบน IP ไหนไปแล้ว
sudo fail2ban-client status sshd
```

fail2ban อ่าน log อัตโนมัติ แล้วแบน IP ที่ fail เยอะ — Detection + Response ในตัวเดียว

---

## Exercise 5 (ท้าทาย) — ลอง Wazuh SIEM

```bash
# รัน Wazuh all-in-one ด้วย docker-compose (ดูคู่มือ Wazuh)
# git clone https://github.com/wazuh/wazuh-docker
# cd wazuh-docker/single-node && docker compose up -d
```

เปิด dashboard แล้วลอง:
1. ดู alert ที่เกิดจาก failed login
2. หา alert ที่ map กับ MITRE ATT&CK technique
3. ลองสร้าง custom rule ง่ายๆ

---

## เชื่อมโยง Red ↔ Blue

การโจมตีจาก [Level 4 Offensive](/security/offensive/concepts) ทิ้งร่องรอยเสมอ:

| การโจมตี (Red) | ร่องรอยที่ Blue จับได้ |
|---|---|
| brute-force login | failed login เยอะจาก IP เดียว |
| port scan | connection แปลกๆ หลาย port |
| privilege escalation | sudo/SUID ผิดปกติใน log |
| web exploit | request แปลกใน access log (`' OR 1=1`) |

**นี่คือเหตุผลที่ต้องเรียนทั้งสองฝั่ง** — รู้ว่าโจมตียังไง ถึงจะรู้ว่าต้องเฝ้าดูอะไร

---

## เก็บกวาด

```bash
docker stop victim 2>/dev/null
```

---

## สรุปสิ่งที่ได้

| Exercise | บทเรียน |
|---|---|
| 1 | auth log = แหล่งข้อมูลตั้งรับ |
| 2-3 | การโจมตีทิ้งร่องรอย → detect ได้ด้วยการนับ pattern |
| 4 | fail2ban = detection + auto response |
| 5 | SIEM ทำทั้งหมดนี้อัตโนมัติ + MITRE mapping |

**ต่อไป:** Level 6 — [เลือกสาย + Certifications](/security/career) วางแผนอาชีพ security
กลับไป [Roadmap](/security/roadmap) 🚀
