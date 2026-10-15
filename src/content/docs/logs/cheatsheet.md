---
title: "Cheatsheet - คำสั่งอ่าน Log"
description: รวมคำสั่งดู กรอง และสรุป log ทั้งบน Linux, journald, Docker และ Kubernetes
---

หน้ารวมคำสั่งไว้เปิดเร็วๆ เวลาต้องไล่ log — อ่านคอนเซปต์ก่อนได้ที่ [Concepts](/logs/concepts)

## ดูไฟล์ log

| คำสั่ง | ทำอะไร |
|---|---|
| `tail -n 100 app.log` | ดู 100 บรรทัดท้าย |
| `tail -f app.log` | ตามดูแบบ real-time (`Ctrl + C` ออก) |
| `tail -F app.log` | เหมือน `-f` แต่ตามต่อได้แม้ไฟล์ถูก rotate |
| `less +F app.log` | ตามดูแบบ real-time — กด `Ctrl + C` เพื่อหยุดเลื่อนดู, `F` เพื่อตามต่อ |
| `less app.log` | เลื่อนดู: `/คำ` ค้นหา, `n` ถัดไป, `G` ไปท้ายไฟล์, `g` ไปต้นไฟล์ |
| `zcat app.log.2.gz` / `zless` / `zgrep` | อ่านไฟล์ที่ถูกบีบอัดโดยไม่ต้องแตก |
| `sudo ls -lht /var/log \| head` | ดูว่า log ไหนเพิ่งถูกเขียน |

## กรองด้วย grep

```bash
grep -i "error" app.log                 # ไม่สนตัวพิมพ์เล็ก/ใหญ่
grep -E "ERROR|FATAL" app.log           # หลายคำ
grep -v "healthcheck" access.log        # ตัดบรรทัดที่ไม่สนใจออก
grep -c "ERROR" app.log                 # นับจำนวน
grep -n "ERROR" app.log                 # แสดงเลขบรรทัด
grep -B 5 -A 5 "FATAL" app.log          # ดูบริบท 5 บรรทัดก่อน/หลัง
grep -m 1 "ERROR" app.log               # เอาแค่ "ครั้งแรก"
grep -rn "timeout" /var/log/nginx/      # ค้นทั้งโฟลเดอร์
tail -f app.log | grep --line-buffered ERROR   # ตามดูเฉพาะ error แบบสด
```

## สรุปด้วย awk / sort / uniq

สูตรทองคำ: **`ดึง field | sort | uniq -c | sort -rn | head`**

```bash
# Top 10 IP ที่ยิงมาเยอะสุด
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head

# นับแต่ละ status code
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# แสดงเฉพาะ 5xx
awk '$9 >= 500' access.log

# path ที่ error บ่อยสุด
awk '$9 >= 500 {print $7}' access.log | sort | uniq -c | sort -rn

# จำนวน request ต่อนาที (ดูว่า spike ตอนไหน)
awk '{print substr($4, 2, 17)}' access.log | sort | uniq -c

# รวม bytes ที่ส่งออก
awk '{sum += $10} END {print sum}' access.log

# ตัดเฉพาะช่วงเวลา
awk '$4 >= "[15/Oct/2026:10:02" && $4 < "[15/Oct/2026:10:05"' access.log
```

:::caution
การเทียบช่วงเวลาด้วย string แบบบรรทัดสุดท้าย ใช้ได้เฉพาะ log **วันเดียวกัน** เท่านั้น เพราะ format `dd/Mon/yyyy` เรียงตามตัวอักษรไม่ถูกเมื่อข้ามวัน/เดือน
:::

## JSON log ด้วย jq

```bash
jq . app.log                                      # จัด format ให้อ่านง่าย
jq -c 'select(.level == "ERROR")' app.log         # กรองตาม field
jq -r '"\(.time) \(.level) \(.msg)"' app.log      # เลือกเฉพาะ field ที่ต้องการ
jq -r '.level' app.log | sort | uniq -c           # นับแต่ละ level
jq -c 'select(.request_id == "b7")' app.log       # ตาม request เดียว
tail -f app.log | jq -r '"\(.level) \(.msg)"'     # ตามดูแบบสด
```

## journalctl (systemd)

| คำสั่ง | ทำอะไร |
|---|---|
| `journalctl -u nginx` | log ของ service เดียว |
| `journalctl -u nginx -f` | ตามดูแบบสด |
| `journalctl -u nginx -n 50 --no-pager` | 50 บรรทัดล่าสุด ไม่เปิด pager |
| `journalctl -e` | เปิดแล้วกระโดดไปท้ายสุด |
| `journalctl -p err` | เฉพาะ error ขึ้นไป (emerg/alert/crit/err) |
| `journalctl --since "1 hour ago"` | ย้อนหลัง 1 ชั่วโมง |
| `journalctl --since "2026-10-15 10:00" --until "10:30"` | ช่วงเวลา |
| `journalctl -b` / `journalctl -b -1` | boot นี้ / boot ก่อนหน้า (ดูว่าเครื่องดับเพราะอะไร) |
| `journalctl -k` | kernel log (เหมือน `dmesg`) |
| `journalctl -u sshd -o json-pretty` | ดูแบบ JSON พร้อม metadata |
| `journalctl _PID=1234` | กรองตาม PID |
| `journalctl --user -u myapp` | service ระดับ user (เช่น Podman Quadlet) |
| `journalctl --disk-usage` | journal กิน disk เท่าไร |
| `sudo journalctl --vacuum-time=7d` | ลบ journal ที่เก่ากว่า 7 วัน |

## Kernel / ระบบ

```bash
sudo dmesg -T | tail -50                          # kernel log พร้อมเวลาที่อ่านออก
sudo dmesg -T | grep -i -E "oom|killed process"   # process โดน OOM killer ฆ่า
sudo journalctl -k | grep -i oom                  # แบบเดียวกันผ่าน journald
last -n 10                                        # ใคร login ล่าสุด
lastb -n 10                                       # login ที่ล้มเหลว (ต้อง sudo)
```

## Docker / Podman

| คำสั่ง | ทำอะไร |
|---|---|
| `docker logs web` | log ทั้งหมดของ container |
| `docker logs -f web` | ตามดูแบบสด |
| `docker logs --tail 100 web` | 100 บรรทัดล่าสุด |
| `docker logs --since 10m web` | 10 นาทีล่าสุด |
| `docker logs -t web` | แสดง timestamp |
| `docker logs web 2>&1 \| grep ERROR` | grep ต้องรวม stderr ด้วย `2>&1` |
| `docker compose logs -f api` | log ของ service ใน compose |
| `docker inspect web --format '{{.State.ExitCode}} {{.State.OOMKilled}}'` | ตายด้วย exit code อะไร / โดน OOM ไหม |

`podman logs` ใช้ option เดียวกันทั้งหมด

## Kubernetes

| คำสั่ง | ทำอะไร |
|---|---|
| `kubectl logs web-7d9f` | log ของ pod |
| `kubectl logs -f web-7d9f` | ตามดูแบบสด |
| `kubectl logs web-7d9f --previous` | log ของ container **รอบก่อนที่ crash** (สำคัญมากกับ CrashLoopBackOff) |
| `kubectl logs web-7d9f -c sidecar` | เลือก container ใน pod |
| `kubectl logs deploy/web` | ไม่ต้องรู้ชื่อ pod |
| `kubectl logs -l app=web --all-containers --prefix` | ทุก pod ที่ label ตรง |
| `kubectl logs web-7d9f --since=1h --timestamps` | 1 ชั่วโมงล่าสุดพร้อมเวลา |
| `kubectl describe pod web-7d9f` | ดู Events + `Last State` (เช่น `OOMKilled`, exit code) |
| `kubectl get events --sort-by=.lastTimestamp` | event ของ namespace เรียงตามเวลา |

:::tip[pod ไม่มี log เลย?]
ถ้า `kubectl logs` ว่างเปล่า แปลว่าแอปยังไม่ทันเริ่ม — ให้ดู `kubectl describe pod` แทน
มักเจอ `ImagePullBackOff`, `CreateContainerConfigError` (ConfigMap/Secret หาย) หรือ Pending เพราะ resource ไม่พอ
:::

## Exit code ที่เจอบ่อย

| Exit code | ความหมาย |
|---|---|
| `0` | จบปกติ |
| `1` | แอป error (ดู log ของแอป) |
| `125` / `126` / `127` | docker run ผิด / สั่งรันไม่ได้ / หาคำสั่งไม่เจอ |
| `137` | โดน `SIGKILL` — มักเป็น **OOMKilled** |
| `143` | โดน `SIGTERM` — ถูกสั่งหยุดตามปกติ |

:::tip[อยากฝึกจริง?]
ไปที่ [Lab 01 - สืบสวนเหตุการณ์จาก Log](/logs/lab-01)
:::
