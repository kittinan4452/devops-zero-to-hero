---
title: "Level 6 — Cloud & Advanced Networking + Certs"
description: "cloud VPC, Kubernetes networking, load balancing และ certifications สาย network"
---

ถึงระดับโปรแล้ว — Level นี้ต่อยอดสู่ networking ยุค cloud-native ที่ DevOps/SRE ใช้จริง + แนวทางสอบ cert

---

## 1. Cloud Networking (VPC)

**VPC** (Virtual Private Cloud) = network ส่วนตัวของคุณบน cloud — เอา concept ทั้งหมดที่เรียนมาไปใช้บน AWS/GCP/Azure

| องค์ประกอบ | เทียบกับที่เรียนมา |
|---|---|
| VPC | network ใหญ่ (เช่น 10.0.0.0/16) |
| Subnet | subnet (public/private) |
| Route Table | routing table (Level 3) |
| Internet Gateway | ทางออก internet |
| NAT Gateway | NAT (Level 3) |
| Security Group | firewall ระดับ instance (stateful) |
| NACL | firewall ระดับ subnet (stateless) |

:::tip
ทุกอย่างใน cloud networking คือ concept เดิมที่คุณเรียนมา — แค่เป็น software-defined (ตั้งค่าผ่าน API/console แทนสาย)
:::

---

## 2. Kubernetes Networking

K8s มี networking model เฉพาะตัว (ต่อยอดจาก [K8s track](/kubernetes/concepts)):

- **Pod network** — ทุก pod มี IP ของตัวเอง คุยกันได้ตรงๆ (ผ่าน CNI: Calico, Cilium, Flannel)
- **Service** — IP/DNS คงที่หน้า pod ที่เปลี่ยนไปมา (load balance ให้ด้วย)
- **Ingress** — reverse proxy L7 เข้าสู่ service (routing ตาม path/host)
- **NetworkPolicy** — firewall ระหว่าง pod (default allow → ควรตั้ง deny) โยงกับ [Security L3](/security/cloud-container/concepts)

```
Internet → Ingress (L7) → Service (L4) → Pods
```

---

## 3. Load Balancing & Reverse Proxy

| ประเภท | ชั้น | ทำงานยังไง |
|---|---|---|
| **L4 LB** | Transport | กระจายตาม IP/port (เร็ว) |
| **L7 LB** | Application | กระจายตาม path/host/header (ฉลาด) |
| **Reverse Proxy** | L7 | รับ request แล้ว forward (Nginx, HAProxy) |
| **CDN** | - | cache เนื้อหาใกล้ผู้ใช้ (Cloudflare, CloudFront) |

**อัลกอริทึมกระจายโหลด:** round-robin, least connections, IP hash

---

## 4. Modern Network Concepts

- **SDN** (Software-Defined Networking) — แยก control plane จาก data plane จัดการเน็ตด้วย software
- **Service Mesh** — จัดการ traffic ระหว่าง service (Istio, Linkerd) + mTLS อัตโนมัติ
- **Zero Trust Network** — ไม่เชื่อ network ภายในโดยอัตโนมัติ ตรวจสอบทุก connection
- **IPv6** — ในที่สุดก็ต้องเรียน เพราะ IPv4 หมดแล้ว

---

## 5. Certifications สาย Network

| Cert | ระดับ | หมายเหตุ |
|---|---|---|
| **CompTIA Network+** | เริ่มต้น | พื้นฐานกว้าง เป็นกลาง (ใบแรกที่ดี) |
| **Cisco CCNA** | เริ่มต้น-กลาง | มาตรฐานอุตสาหกรรม เน้น routing/switching |
| **Cisco CCNP** | สูง | เจาะลึกระดับ enterprise |
| **AWS Advanced Networking** | สูง | cloud networking |
| **Juniper JNCIA** | เริ่มต้น | ทางเลือกนอก Cisco |

---

## 6. แผนเรียนต่อ (หลังจบ roadmap)

```
1. เลือกทิศ: Cloud (AWS/GCP) หรือ Enterprise (Cisco/CCNA)
2. ทำ lab เยอะๆ:
   - Cloud → สร้าง VPC + subnet จริงบน free tier
   - Enterprise → Cisco Packet Tracer / GNS3 (จำลอง router/switch)
   - K8s → Minikube + ลอง NetworkPolicy, Ingress
3. เชื่อมกับสายอื่น: Network + Security = Network Security Engineer
                    Network + DevOps   = SRE / Platform Engineer
4. เก็บ cert ตามทิศที่เลือก
```

---

## แหล่งเรียนรู้ต่อ (ฟรี)

- **Cisco Networking Academy** — คอร์สฟรี (CCNA-level)
- **Julia Evans (wizardzines)** — zine อธิบาย network สนุกๆ
- **Practical Networking (YouTube)** — อธิบาย concept ชัดมาก
- **Cloudflare Learning Center** — บทความ network/security ฟรี
- **GNS3 / Cisco Packet Tracer** — จำลอง network ฝึกได้ไม่ต้องมีอุปกรณ์

---

## สรุป

เส้นทาง Network Zero to Hero จบที่นี่ 🎓

- Foundation → Protocols → Subnetting → Routing → Linux → Security → Cloud
- ทุก concept ระดับสูง (VPC, K8s, LB) คือ **concept เดิมในรูปแบบใหม่**
- ต่อยอดได้ทั้งสาย Cloud/SRE และ Network Security

กลับไปทบทวน [Network Roadmap](/network/roadmap) หรือข้ามไป [Security Roadmap](/security/roadmap) ได้เลย 🚀
