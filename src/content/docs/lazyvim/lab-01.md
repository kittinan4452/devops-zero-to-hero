---
title: "Lab 01 - ใช้ LazyVim แก้โปรเจกต์ DevOps"
description: ติดตั้ง LazyVim แล้วฝึกใช้กับไฟล์จริง — Dockerfile, compose, Kubernetes YAML, Terraform — ทั้งค้นหาไฟล์ LSP แก้หลายจุดพร้อมกัน git และปรับแต่ง config
---

## เป้าหมาย

- ติดตั้ง LazyVim และตรวจว่าเครื่องพร้อมด้วย `:LazyHealth`
- เดินทางในโปรเจกต์ด้วย picker, explorer, buffer และ split
- เปิด Extras สำหรับ Docker / YAML / Terraform แล้วให้ LSP ช่วยจับ error
- แก้หลายจุดพร้อมกันด้วย text object, `.`, visual block และ macro
- ใช้ git (gitsigns + lazygit) และ terminal โดยไม่ออกจาก editor
- ปรับแต่ง config ของตัวเอง

:::note[Requirements]
- ติดตั้ง LazyVim ตามหัวข้อ [ติดตั้ง](/lazyvim/concepts#ติดตั้ง) เรียบร้อยแล้ว
- `git`, `lazygit` (Exercise 6)
- `terraform` (Exercise 3 — ใช้สำหรับ `terraform fmt`, ไม่บังคับ)
- `docker` หรือ `podman` (Exercise 7 — ไม่บังคับ)
:::

เปิด [Cheatsheet](/lazyvim/cheatsheet) ไว้อีกหน้าต่างระหว่างทำ

---

## Exercise 0 — เตรียมโปรเจกต์ตัวอย่าง

```bash
mkdir -p ~/devops-lab/nvim-lab/{k8s,terraform} && cd ~/devops-lab/nvim-lab

cat > Dockerfile <<'EOF'
FROM python:latest
RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD python app.py
EOF

cat > compose.yaml <<'EOF'
services:
  web:
    build: .
    port:
      - "8080:8080"
    environment:
      - APP_ENV=dev
  redis:
    image: redis:7
EOF

cat > k8s/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: "registry.local/web:1.0.0"
          ports:
            - containerPort: 8080
        - name: worker
          image: "registry.local/worker:1.0.0"
        - name: metrics
          image: "registry.local/metrics:1.0.0"
EOF

cat > terraform/main.tf <<'EOF'
terraform {
required_providers {
docker = {
source = "kreuzwerker/docker"
version = "~> 3.0"
}
}
}

resource "docker_image" "nginx" {
name = "nginx:1.27"
}

resource "docker_container" "web" {
name = "web"
image = docker_image.nginx.image_id
ports {
internal = 80
external = 8080
}
}
EOF

cat > hosts.txt <<'EOF'
web01
web02
web03
db01
db02
EOF

git init -q && git add . && git commit -qm "initial" && echo "ready"
```

---

## Exercise 1 — เปิดครั้งแรก + ตรวจสุขภาพ

```bash
cd ~/devops-lab/nvim-lab
nvim .
```

จะเห็นหน้า **dashboard** — พิมพ์คำสั่งนี้ (กด `:` ก่อน แล้วพิมพ์ต่อ):

```text
:LazyHealth
```

อ่านผล ถ้ามี `ERROR` หรือ `WARNING` ให้ติดตั้งสิ่งที่ขาด (มักเป็น `rg`, `fd`, `lazygit`, `tree-sitter`)

จากนั้นลอง:

1. กด `Space` แล้ว **รอ** — ดูเมนู which-key
2. กด `Esc` ปิด แล้วกด `<leader>sk` พิมพ์ `explorer` — ดูว่าปุ่มเปิด explorer คืออะไร
3. กด `<leader>l` เปิดหน้า Lazy ดูว่ามี plugin กี่ตัว แล้วกด `q` ปิด

**คำถาม:** ถ้าอยู่ใน Insert mode แล้วกด `Space` จะเกิดอะไรขึ้น? ทำไม which-key ไม่ขึ้น?

<details>
<summary>เฉลย</summary>

ใน Insert mode `Space` คือการพิมพ์ช่องว่างตามปกติ — leader key ทำงานเฉพาะใน **Normal mode** (และ Visual บางปุ่ม)
นี่คือเหตุผลที่ต้องติดนิสัย **กด `Esc` ทันทีที่พิมพ์เสร็จ**
</details>

---

## Exercise 2 — เดินทางในโปรเจกต์

ทำทีละข้อ **ห้ามใช้เมาส์**:

1. `<leader><space>` พิมพ์ `depl` → `Enter` เปิด `k8s/deployment.yaml`
2. `<leader><space>` พิมพ์ `main` → เปิด `terraform/main.tf`
3. กด `S-h` และ `S-l` สลับไปมาระหว่าง 2 ไฟล์ — สังเกต bufferline ด้านบน
4. `<leader>,` เปิดรายการ buffer เลือก `deployment.yaml`
5. `<leader>|` แบ่งจอขวา แล้ว `<leader><space>` เปิด `compose.yaml` ในจอขวา
6. ย้ายระหว่างจอด้วย `C-h` / `C-l`, ขยายจอด้วย `<leader>wm` แล้วกดอีกครั้งเพื่อคืน
7. `<leader>wd` ปิดจอขวา
8. `<leader>/` พิมพ์ `8080` — เห็นทุกไฟล์ที่มี port 8080 ไหม? กด `Enter` กระโดดไปไฟล์ใดไฟล์หนึ่ง
9. `<leader>e` เปิด explorer → ไปที่โฟลเดอร์ `k8s` → กด `a` พิมพ์ `service.yaml` → `Enter` (สร้างไฟล์ใหม่)
10. ใน explorer เลื่อนไปที่ `hosts.txt` กด `r` เปลี่ยนชื่อเป็น `inventory.txt`

**คำถาม:** `<leader>/` กับ `/` ต่างกันยังไง?

<details>
<summary>เฉลย</summary>

- `/` ค้นหา **ในไฟล์ปัจจุบัน** (built-in ของ Vim) แล้วใช้ `n`/`N` ไปจุดถัดไป
- `<leader>/` **grep ทั้งโปรเจกต์** ด้วย ripgrep แล้วแสดงผลใน picker พร้อม preview
</details>

---

## Exercise 3 — เปิด Extras + ให้ LSP จับ error

### 3.1 เปิด Extras

```text
:LazyExtras
```

เลื่อนไปที่บรรทัดเหล่านี้แล้วกด `x` ทีละอัน (จะย้ายขึ้นไปอยู่ส่วน **Enabled**):

- `lang.docker`
- `lang.yaml`
- `lang.terraform`

กด `q` ออก แล้ว **ปิด nvim และเปิดใหม่** (`<leader>qq` → `nvim .`) — Mason จะติดตั้ง LSP / linter ให้อัตโนมัติ
ดูความคืบหน้าได้ที่ `:Mason`

### 3.2 จับ error ใน compose.yaml

เปิด `compose.yaml` — บรรทัด `port:` ควรขึ้นขีดเส้นใต้หรือ icon error ด้านซ้าย

1. วาง cursor ที่บรรทัดนั้น กด `<leader>cd` อ่านข้อความ error
2. แก้ให้ถูก: วาง cursor บนคำว่า `port` แล้วกด `ea` (ไปท้ายคำแล้วเข้า Insert) พิมพ์ `s` → `Esc`
3. error หายไหม?

### 3.3 Lint Dockerfile

เปิด `Dockerfile` — hadolint จะเตือนหลายบรรทัด กด `<leader>xx` ดูรายการทั้งหมด

แก้ตามคำเตือนให้เหลือน้อยที่สุด:

- `FROM python:latest` → ใช้ tag ที่ระบุเวอร์ชัน (ใช้ `ciw` บนคำว่า `latest` แล้วพิมพ์ `3.12-slim`)
- `apt-get install` → เพิ่ม `--no-install-recommends` และลบ cache ของ apt
- `CMD python app.py` → ใช้ JSON form: `CMD ["python", "app.py"]`

ใช้ `]d` / `[d` กระโดดไป diagnostic ถัดไป / ก่อนหน้าแทนการเลื่อนเอง

### 3.4 Format Terraform

เปิด `terraform/main.tf` — ไฟล์นี้ไม่มีการเยื้องเลย กด `C-s` (save)
ถ้ามี `terraform` ในเครื่อง ไฟล์จะถูก `terraform fmt` จัดให้สวยทันที (หรือกด `<leader>cf`)

จากนั้นลอง LSP:

1. วาง cursor บน `docker_image.nginx.image_id` (ใน resource `docker_container`) แล้วกด `gd` — กระโดดไปที่ resource ต้นทาง
2. กด `C-o` กลับมาที่เดิม
3. วาง cursor บน `docker_container` แล้วกด `K` — เห็นเอกสารของ resource นี้
4. `<leader>ss` — ดูรายการ resource ทั้งไฟล์

<details>
<summary>เฉลย Dockerfile</summary>

```dockerfile
FROM python:3.12-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "app.py"]
```

hadolint อาจยังเตือนเรื่อง pin เวอร์ชันของ `curl` (`DL3008`) — ในงานจริงควร pin แต่สำหรับ lab ถือว่าผ่าน
</details>

:::tip[Kubernetes YAML ก็มี schema ได้]
ใส่บรรทัดนี้ไว้บนสุดของ manifest แล้ว yamlls จะรู้ว่า field ไหนถูก/ผิด + autocomplete ได้:
`# yaml-language-server: $schema=https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/master-standalone-strict/deployment-apps-v1.json`
:::

---

## Exercise 4 — แก้หลายจุดพร้อมกัน

เปิด `k8s/deployment.yaml`

### 4.1 เปลี่ยน tag ด้วย `ci"` + `.`

โจทย์: เปลี่ยน image ทั้ง 3 ตัวจาก `1.0.0` เป็น `1.1.0`

1. วิธีที่เร็วที่สุด: `:%s/1\.0\.0/1.1.0/g` → `Enter`
2. กด `u` undo แล้วลองอีกวิธีด้วย **dot repeat**:
   - `/1.0.0` → `Enter`
   - `cgn` พิมพ์ `1.1.0` → `Esc` (`gn` = "ผลค้นหาถัดไป")
   - กด `.` อีก 2 ครั้ง — แก้จุดที่เหลือทีละจุด

### 4.2 เพิ่ม replicas

วาง cursor บนเลข `1` ของ `replicas: 1` แล้วกด `2` `C-a` → กลายเป็น `3`

### 4.3 Visual block — comment หลายบรรทัด

โจทย์: comment container `worker` ทั้ง block (2 บรรทัด)

1. ไปที่บรรทัด `- name: worker`
2. `V` แล้ว `j` เลือก 2 บรรทัด
3. `gc` — comment ทั้งหมด
4. กด `gcc` ที่บรรทัดเดิมอีกครั้งเพื่อ uncomment ทีละบรรทัด (หรือ `V` `j` `gc` อีกรอบ)

### 4.4 Macro — แปลง inventory เป็น Ansible format

เปิด `inventory.txt` (ที่ rename ไว้ใน Exercise 2) โจทย์คือแปลง:

```text
web01          →    web01 ansible_host=web01.lab.local
```

ทุกบรรทัด:

1. `gg` ไปบรรทัดแรก
2. `qa` เริ่มอัด macro
3. `yiw` copy ชื่อ host → `A` ไปท้ายบรรทัด → พิมพ์ ` ansible_host=` → `Esc`
4. `p` วางชื่อ host → `a` พิมพ์ `.lab.local` → `Esc`
5. `j0` ไปต้นบรรทัดถัดไป → `q` หยุดอัด
6. `4@a` เล่นซ้ำอีก 4 บรรทัด

<details>
<summary>เฉลย 4.1 — ทำไม `cgn` ดีกว่า `:%s`?</summary>

`:%s` แก้ทุกจุดทีเดียว ซึ่งเร็ว แต่ถ้ามีบางจุดที่ **ไม่อยาก** แก้ ต้องใช้ `/gc` แล้วตอบ y/n ทีละจุด
`cgn` + `.` ให้เราเห็นแต่ละจุดก่อนกด — ถ้าจุดไหนไม่อยากแก้ก็กด `n` ข้ามไปแทน `.`
ส่วนถ้าต้องแก้ข้ามหลายไฟล์ ใช้ `<leader>sr` (search & replace ทั้งโปรเจกต์)
</details>

---

## Exercise 5 — กระโดดด้วย flash

ใน `deployment.yaml` วาง cursor ที่บรรทัดแรก

1. กด `s` แล้วพิมพ์ `co` — จะมี label (ตัวอักษรสี) แปะทุกจุดที่มีคำว่า `co`
2. กดตัวอักษร label ของ `containerPort` — กระโดดไปทันที
3. ลอง `S` (Flash Treesitter) — เลือกทั้ง block ตาม syntax ได้ เช่นกด label เพื่อเลือกทั้ง `metadata:` block แล้ว `y` copy

---

## Exercise 6 — Git ในตัว

แก้ไฟล์อะไรก็ได้แล้ว save (เช่น `deployment.yaml` ที่แก้ไว้แล้ว)

1. ดูแถบสีด้านซ้ายของบรรทัด — เขียว (เพิ่ม), น้ำเงิน (แก้), แดง (ลบ)
2. `]h` / `[h` กระโดดระหว่าง hunk, `<leader>ghp` ดู preview ว่าเดิมเป็นอะไร
3. ไปที่ hunk หนึ่งแล้ว `<leader>ghr` — reset hunk นั้นกลับเป็นเดิม
4. `<leader>gb` — ดูว่าบรรทัดนี้ใครแก้ commit ไหน
5. `<leader>gg` เปิด **lazygit**:
   - `space` stage ไฟล์
   - `c` พิมพ์ข้อความ commit → `Enter`
   - `3` ไปแท็บ Branches / `4` ไปแท็บ Commits ดูประวัติ
   - `q` ออก

**คำถาม:** ทำไม `<leader>gg` ถึงใช้ git root ของโปรเจกต์ แม้ว่าเราจะเปิดไฟล์อยู่ใน `k8s/`?

<details>
<summary>เฉลย</summary>

LazyVim หา **root directory** ของไฟล์จาก LSP workspace หรือ marker อย่าง `.git` — ปุ่มที่บอกว่า "root dir" (เช่น `<leader><space>`, `<leader>/`, `<leader>gg`) จะทำงานที่ root นั้น
ส่วนปุ่มตัวใหญ่ (`<leader>fF`, `<leader>sG`, `<leader>E`) จะใช้ **cwd** (โฟลเดอร์ที่รัน `nvim`) แทน
</details>

---

## Exercise 7 — Terminal ในตัว

1. กด `C-/` — terminal ลอยขึ้นมา
2. รัน:

   ```bash
   docker build -t nvim-lab . 2>&1 | tail -5
   cd terraform && terraform fmt -check; cd ..
   ```

3. กด `C-/` อีกครั้งเพื่อซ่อน (process ยังรันอยู่) แล้วกดอีกครั้งเพื่อเปิดกลับมา
4. ใน terminal กด `Esc` `Esc` → ตอนนี้เลื่อนดู output ด้วย `k`/`j` และ `y` copy ได้เหมือนไฟล์ปกติ → กด `i` เพื่อกลับไปพิมพ์

:::tip[ทางกลับกัน: ใช้ nvim เป็น editor ของเครื่องมืออื่น]
```bash
export EDITOR=nvim          # ใส่ใน ~/.zshrc หรือ ~/.bashrc
git commit                  # เขียน commit message ใน nvim
kubectl edit deploy web     # แก้ resource บน cluster ด้วย nvim
```
:::

---

## Exercise 8 — ปรับแต่ง Config ของตัวเอง

กด `<leader>fc` แล้วเปิดไฟล์ต่อไปนี้ทีละไฟล์

### 8.1 Options — `lua/config/options.lua`

```lua
vim.opt.relativenumber = false   -- ปิดเลขบรรทัดแบบ relative
vim.opt.wrap = true              -- ตัดบรรทัดยาว (YAML/log อ่านง่ายขึ้น)
vim.opt.scrolloff = 8            -- เหลือบรรทัดรอบ cursor 8 บรรทัดเสมอ
```

### 8.2 Keymaps — `lua/config/keymaps.lua`

```lua
-- กด jk เร็วๆ ใน insert mode = Esc
vim.keymap.set("i", "jk", "<Esc>", { desc = "Exit insert mode" })

-- ตรวจ YAML ปัจจุบันด้วย kubectl แบบไม่ apply จริง (ต้องมี kubectl)
vim.keymap.set("n", "<leader>kd", function()
  Snacks.terminal("kubectl apply --dry-run=client -f " .. vim.fn.expand("%"), { auto_close = false })
end, { desc = "kubectl dry-run current file" })
```

### 8.3 Plugin — สร้าง `lua/plugins/colorscheme.lua`

```lua
return {
  { "catppuccin/nvim", name = "catppuccin" },
  { "LazyVim/LazyVim", opts = { colorscheme = "catppuccin-mocha" } },
}
```

save แล้วปิด / เปิด nvim ใหม่ — lazy.nvim จะดาวน์โหลด theme ให้เอง
กด `Space` แล้วรอ — เห็นปุ่ม `k` → `kubectl dry-run current file` ใน which-key ไหม?

:::caution
ถ้า config พังจนเปิดไม่ได้ ให้เปิดแบบไม่โหลด config: `nvim --clean ~/.config/nvim/lua/config/keymaps.lua` แล้วแก้กลับ
ข้อดีของการเก็บ config ใน git คือ `git diff` / `git checkout .` ได้ทันที
:::

---

:::tip[สำเร็จแล้ว!]
ถ้าทำครบ คุณใช้ LazyVim แก้ไฟล์ DevOps ได้ครบวงจร: หาไฟล์ → แก้ → LSP จับ error → format → commit → รันคำสั่ง โดยไม่ต้องออกจาก terminal
ต่อไปลองใช้ทุกวันจริงๆ อย่างน้อย 2 สัปดาห์ — แล้วกลับมาทำ lab อื่นๆ ของเว็บนี้ด้วย nvim แทน editor เดิม
:::

:::note[Challenge เพิ่มเติม]
1. เปิด Extra `lang.ansible` แล้วเขียน playbook ที่ใช้ `inventory.txt` — สังเกต autocomplete ของ module
2. ทำ `~/.config/nvim` ให้เป็น git repo push ขึ้น GitHub แล้วลอง clone ลงใน container:
   `docker run -it --rm ubuntu:24.04 bash` → ติดตั้ง nvim + clone config → เปิดแล้วได้หน้าตาเดียวกัน
3. เพิ่ม keymap `<leader>kt` ที่รัน `terraform validate` ใน terminal ลอย (ดูตัวอย่างจาก 8.2)

**Hint:** ข้อ 2 หลัง clone ไปที่ `~/.config/nvim` แล้ว รัน `nvim --headless "+Lazy! sync" +qa` เพื่อติดตั้ง plugin แบบไม่ต้องเปิด UI
:::
