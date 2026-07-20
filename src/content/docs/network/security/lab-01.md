---
title: "Lab 01 — Traffic Analysis + TLS"
description: "จับและวิเคราะห์ traffic, ตรวจ TLS certificate, เห็นความต่างของ HTTP vs HTTPS"
---

## เป้าหมาย

- เห็นความต่าง HTTP (อ่านออก) vs HTTPS (เข้ารหัส) ด้วยตาตัวเอง
- ตรวจสอบ TLS certificate
- วิเคราะห์ capture ด้วย tcpdump/Wireshark

:::caution
จับ traffic เฉพาะบนเครื่อง/network ของตัวเองเท่านั้น การดัก traffic ผู้อื่นโดยไม่ได้รับอนุญาตผิดกฎหมาย
:::

---

## Exercise 1 — HTTP อ่านออก vs HTTPS เข้ารหัส

```bash
# หน้าต่างที่ 1: จับ HTTP (port 80) พร้อมเนื้อหา
sudo tcpdump -i any port 80 -A -nn

# หน้าต่างที่ 2:
curl http://example.com
```
→ เห็น `GET / HTTP/1.1`, header, เนื้อหา **อ่านออกหมด** 😱

```bash
# ทีนี้จับ HTTPS (port 443)
sudo tcpdump -i any port 443 -A -nn

# อีกหน้าต่าง:
curl https://example.com
```
→ เห็นแต่ข้อมูล **เข้ารหัส อ่านไม่ออก** ✅ นี่คือคุณค่าของ TLS

---

## Exercise 2 — ตรวจ TLS certificate

```bash
# ดู certificate ของเว็บ
openssl s_client -connect example.com:443 -servername example.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

อ่านผล:
- `subject` = ออกให้ใคร
- `issuer` = ใครออกให้ (CA)
- `notAfter` = หมดอายุเมื่อไหร่ (cert หมดอายุ = เว็บขึ้น warning)

---

## Exercise 3 — ดู TLS handshake

```bash
# -v แสดงขั้นตอน TLS
curl -v https://example.com 2>&1 | grep -iE "TLS|SSL|certificate|subject|issuer"
```

สังเกตลำดับ: TCP connect → TLS handshake → เลือก cipher → verify cert → ค่อยส่ง HTTP

---

## Exercise 4 — จับ DNS แล้ววิเคราะห์

```bash
# หน้าต่าง 1
sudo tcpdump -i any port 53 -nn

# หน้าต่าง 2
dig +short github.com
```

เห็น query (A record) ออกไป แล้ว response กลับ — DNS query ปกติ **ไม่เข้ารหัส** (นี่คือเหตุผลที่มี DoH/DoT)

---

## Exercise 5 — บันทึกไปเปิดใน Wireshark

```bash
# จับ 100 packet แล้วเซฟ
sudo tcpdump -i any -c 100 -w /tmp/capture.pcap

# ระหว่างนั้นเปิดเว็บ/ping ให้มี traffic
```

เปิด `/tmp/capture.pcap` ใน **Wireshark** แล้วลอง filter:
- `dns` — ดู DNS query
- `tcp.flags.syn == 1` — ดู TCP handshake (SYN)
- `http` — ดู HTTP request

Wireshark จะแยกให้เห็นทุกชั้น OSI ในแต่ละ packet — ทบทวน Level 0 ได้เห็นภาพ

---

## Exercise 6 (ท้าทาย) — ตั้ง firewall แล้วพิสูจน์

```bash
docker run --rm -d -p 8080:80 --name web nginx
curl -I http://localhost:8080         # เข้าได้

# บล็อกด้วย iptables (ในกล่องทดลอง / ระวังบนเครื่องจริง)
# sudo iptables -A INPUT -p tcp --dport 8080 -j DROP
# curl -I http://localhost:8080 --max-time 3   # ควรเข้าไม่ได้แล้ว
# sudo iptables -D INPUT -p tcp --dport 8080 -j DROP   # ลบ rule คืน

docker stop web
```

---

## สรุปสิ่งที่ได้

| Exercise | บทเรียน |
|---|---|
| 1 | HTTP อ่านออก, HTTPS เข้ารหัส (ทำไมต้อง TLS) |
| 2-3 | ตรวจ + เข้าใจ TLS certificate/handshake |
| 4-5 | วิเคราะห์ traffic ด้วย tcpdump + Wireshark |

**ต่อไป:** Level 6 — [Cloud & Advanced Networking + Certs](/network/advanced)
กลับไป [Roadmap](/network/roadmap) 🚀
