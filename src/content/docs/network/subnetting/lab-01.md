---
title: "Lab 01 — ฝึกคำนวณ Subnet"
description: "ฝึกแบ่ง subnet ด้วยมือ แล้วตรวจคำตอบด้วยเครื่องมือ ipcalc/sipcalc"
---

## เป้าหมาย

- คำนวณ network, broadcast, host range ด้วยมือ
- ตรวจคำตอบด้วยเครื่องมือ
- ฝึก VLSM

:::note[Requirements]
```bash
# เครื่องมือช่วยตรวจ (ไม่บังคับ แต่ช่วยเช็คคำตอบ)
sudo apt install -y ipcalc sipcalc      # Linux
brew install ipcalc                     # macOS
```
:::

---

## Exercise 1 — วอร์มอัพ: อ่าน CIDR

หา "จำนวน host ที่ใช้ได้" ของแต่ละอันด้วยมือ (สูตร `2^(32−CIDR) − 2`):

| CIDR | คำตอบ (คิดเอง) |
|---|---|
| /24 | ? |
| /26 | ? |
| /28 | ? |
| /30 | ? |

<details>
<summary>เฉลย</summary>
254, 62, 14, 2
</details>

---

## Exercise 2 — คำนวณด้วยมือ แล้วตรวจ

โจทย์: `192.168.10.0/26`

หาให้ครบ 4 subnet: network, host range, broadcast (คิดด้วยมือก่อน!)

**แล้วตรวจด้วย ipcalc:**
```bash
ipcalc 192.168.10.0/26
```

เทียบกับที่คิดเอง ตรงไหม? (block size = 64 → 0, 64, 128, 192)

---

## Exercise 3 — เครื่องอยู่ subnet เดียวกันไหม?

โจทย์: `192.168.1.50/26` กับ `192.168.1.100/26` อยู่ subnet เดียวกันไหม?

**คิด:** /26 block = 64 →
- .50 อยู่ใน subnet .0–.63
- .100 อยู่ใน subnet .64–.127
- **คนละ subnet!** → ต้องผ่าน router ถึงจะคุยกันได้

ตรวจ:
```bash
ipcalc 192.168.1.50/26
ipcalc 192.168.1.100/26
# ดู Network address ว่าตรงกันไหม
```

---

## Exercise 4 — VLSM จริง

โจทย์: มี `10.0.0.0/24` ต้องแบ่งให้ 3 แผนก
- A: 100 hosts
- B: 50 hosts
- C: 25 hosts

คิดว่าแต่ละแผนกได้ CIDR อะไร + range ไหน (เริ่มจากใหญ่สุด)

<details>
<summary>เฉลย</summary>

| แผนก | CIDR | Range | host ได้ |
|---|---|---|---|
| A (100) | /25 | 10.0.0.0 – .127 | 126 |
| B (50) | /26 | 10.0.0.128 – .191 | 62 |
| C (25) | /27 | 10.0.0.192 – .223 | 30 |

เหลือ 10.0.0.224/27 ไว้ใช้อนาคต
</details>

---

## Exercise 5 — เช็ค subnet บนเครื่องจริง

```bash
# ดู IP + CIDR ของเครื่องคุณ
ip -o addr show | grep inet

# เช่นเห็น 192.168.1.10/24 → เครื่องอยู่ subnet ไหน?
ipcalc 192.168.1.10/24
```

คุณอยู่ subnet อะไร? gateway อยู่ในช่วงเดียวกันไหม? (ควรอยู่ ไม่งั้นออกเน็ตไม่ได้)

---

## สรุปสิ่งที่ได้

- ✅ คำนวณ network/broadcast/host range ด้วยมือได้
- ✅ บอกได้ว่า 2 IP อยู่ subnet เดียวกันไหม
- ✅ แบ่ง VLSM ตามความต้องการจริง

**ต่อไป:** Level 3 — [Routing & Switching](/network/routing-switching/concepts) packet ข้าม subnet ยังไง
กลับไป [Roadmap](/network/roadmap) 🚀
