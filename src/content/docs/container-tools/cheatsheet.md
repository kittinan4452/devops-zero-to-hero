---
title: "Cheatsheet - คำสั่ง Podman ที่ใช้บ่อย"
description: รวมคำสั่ง Podman ที่ใช้บ่อย + จุดต่างจาก Docker
---

Podman ใช้คำสั่งเหมือน Docker เกือบ 100% — แค่เปลี่ยน `docker` เป็น `podman` ได้เลย
หน้านี้เลยเน้นที่ **คำสั่งที่ Podman มีแต่ Docker ไม่มี**

:::tip[ตั้ง alias ให้ชิน]
```bash
alias docker=podman     # พิมพ์ docker เดิมได้เลย เรียก podman ให้
```
:::

## เหมือน Docker ทุกอย่าง

| คำสั่ง | ทำอะไร |
|---|---|
| `podman run -d --name web -p 8080:80 nginx` | รัน container |
| `podman ps -a` | ดู container ทั้งหมด |
| `podman exec -it web bash` | เข้า shell |
| `podman logs -f web` | ดู log สด |
| `podman images` | list image |
| `podman build -t myapp .` | build image |
| `podman pull` / `push` | ดึง / push image |
| `podman stop` / `rm` / `rmi` | หยุด / ลบ container / ลบ image |
| `podman system prune -a` | ล้างของที่ไม่ได้ใช้ |

> คำสั่งพื้นฐานอื่นๆ ดูได้จาก [Docker Cheatsheet](/docker/cheatsheet) — ใช้ได้เหมือนกันหมด

## Pod (จุดเด่น — เหมือน Kubernetes Pod)

```bash
# สร้าง pod (หลาย container share network กัน)
podman pod create --name myapp -p 8080:80
podman run -d --pod myapp --name web nginx
podman run -d --pod myapp --name cache redis

podman pod ps          # list pods
podman ps --pod        # ดู container พร้อม pod ที่สังกัด
podman pod stop myapp && podman pod rm myapp
```

## Kubernetes YAML (มีในตัว)

```bash
# export pod เป็น Kubernetes YAML
podman kube generate myapp > pod.yaml

# รัน Kubernetes YAML ตรงๆ โดยไม่ต้องมี cluster
podman kube play pod.yaml
podman kube play --down pod.yaml     # ลบตาม YAML
```

## Rootless & systemd (Quadlet)

```bash
# ดูว่ารันแบบ rootless (ไม่ใช้ root)
podman info | grep rootless

# Quadlet: ให้ systemd จัดการ container (ไฟล์ .container)
#   วางไว้ที่ ~/.config/containers/systemd/<name>.container
systemctl --user daemon-reload
systemctl --user start <name>.service
systemctl --user status <name>.service

# ให้ service รันต่อแม้ logout + boot ขึ้นเอง
sudo loginctl enable-linger $USER
systemctl --user enable <name>.service

# อัปเดต image อัตโนมัติ (สำหรับ container ที่ตั้ง AutoUpdate=registry)
podman auto-update --dry-run
podman auto-update
```

## บน macOS (ผ่าน VM)

```bash
podman machine init          # สร้าง VM ครั้งแรก
podman machine start         # เปิด VM
podman machine list
podman machine stop
```

## จุดต่างสำคัญจาก Docker

| ประเด็น | Docker | Podman |
|---|---|---|
| Daemon | มี `dockerd` รันตลอด | ไม่มี daemon (daemonless) |
| Root | daemon เป็น root | rootless ได้ตั้งแต่ต้น |
| Pod | ไม่มี (ใช้ compose) | มี built-in |
| K8s YAML | ไม่มี | `podman kube generate/play` |
| เป็น service | พึ่ง dockerd | Quadlet + systemd |
| SELinux volume | มักปิดให้ | ต้องเติม `:Z` ท้าย volume |

:::caution[SELinux + volume]
บน Fedora/RHEL ที่เปิด SELinux ต้องเติม `:Z` ท้าย bind mount:
`podman run -v ./data:/app/data:Z ...` ไม่งั้นจะเจอ **Permission denied**
:::

:::tip[อยากฝึกจริง?]
ไปที่ [Lab - Podman จริงจัง (Compose + Quadlet)](/container-tools/lab-02)
:::
