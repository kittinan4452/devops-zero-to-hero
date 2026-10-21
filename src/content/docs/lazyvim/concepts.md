---
title: "LazyVim - Editor ใน Terminal สำหรับ DevOps"
description: Vim / Neovim / LazyVim ต่างกันยังไง ทำไม DevOps ควรใช้เป็น วิธีติดตั้ง โหมดต่างๆ ไวยากรณ์ของ Vim และโครงสร้าง config ของ LazyVim
---

งาน DevOps ส่วนใหญ่อยู่ใน **terminal** — SSH เข้า server, แก้ YAML ของ Kubernetes, แก้ Dockerfile, เขียน Terraform
ถ้าแก้ไฟล์ใน terminal ได้คล่องเท่า VS Code ก็ไม่ต้องสลับหน้าจอไปมา และใช้ได้แม้บน server ที่ไม่มี GUI

**LazyVim** คือ Neovim ที่ตั้งค่ามาให้พร้อมใช้ — มี file explorer, ค้นหาไฟล์, LSP (autocomplete + เช็ค error), git, terminal ในตัว
ติดตั้งเสร็จก็ได้ IDE เต็มตัวทันที ไม่ต้องนั่งเขียน config เองเป็นสัปดาห์

---

## Vim vs Neovim vs LazyVim

| | คืออะไร | เปรียบเทียบ |
|---|---|---|
| **Vim** | editor ดั้งเดิม มีแทบทุก server | Notepad ที่ทรงพลังมาก |
| **Neovim** | Vim เวอร์ชันใหม่ เขียน config/plugin ด้วย **Lua**, มี LSP + Treesitter ในตัว | เครื่องยนต์ |
| **LazyVim** | **ชุด config** ของ Neovim ที่รวม plugin ดีๆ มาให้แล้ว (ไม่ใช่โปรแกรมแยก) | รถที่ประกอบเสร็จพร้อมขับ |

ชื่อ "Lazy" มาจาก **lazy.nvim** ซึ่งเป็นตัวจัดการ plugin — โหลด plugin เฉพาะตอนที่ต้องใช้ ทำให้เปิดเร็วมาก

:::tip[ทำไม DevOps ต้องใช้ Vim เป็น?]
ต่อให้เครื่องตัวเองใช้ VS Code แต่วันที่ต้อง SSH เข้า production ตอนตี 2 แล้วแก้ config ด่วน — บน server มีแค่ `vi` / `vim`
**ปุ่มที่ฝึกใน LazyVim ใช้กับ vim บน server ได้เลย** (ยกเว้นปุ่มของ plugin ที่ขึ้นต้นด้วย Space)
:::

---

## โหมด (Modes) — หัวใจของ Vim

Vim ไม่เหมือน editor อื่นตรงที่ **พิมพ์แล้วไม่ได้ตัวอักษรเสมอไป** — ขึ้นกับว่าอยู่โหมดไหน

```
                  i  a  o                 
            ┌──────────────────▶ ┌──────────┐
            │                    │  INSERT  │
            │ ◀────── Esc ────── └──────────┘
       ┌──────────┐
       │  NORMAL  │  v  V  Ctrl+v ┌──────────┐
       │ (default)│ ────────────▶ │  VISUAL  │
       └──────────┘ ◀─── Esc ──── └──────────┘
            │  ▲
          : │  │ Enter / Esc
            ▼  │
       ┌──────────┐
       │ COMMAND  │  :w  :q  :%s/a/b/g
       └──────────┘
```

| โหมด | ใช้ทำอะไร | เข้ายังไง |
|---|---|---|
| **Normal** | เลื่อน cursor, ลบ, copy, วาง, สั่งงาน — **อยู่โหมดนี้เป็นหลัก** | `Esc` |
| **Insert** | พิมพ์ข้อความเหมือน editor ทั่วไป | `i` (ก่อน cursor), `a` (หลัง cursor), `o` (บรรทัดใหม่) |
| **Visual** | เลือกข้อความ | `v` (ตัวอักษร), `V` (ทั้งบรรทัด), `Ctrl+v` (คอลัมน์) |
| **Command** | สั่งคำสั่ง เช่น save / quit / แทนที่ | `:` |

:::caution[ติดอยู่ใน Vim ออกไม่ได้?]
กด `Esc` สองสามครั้ง แล้วพิมพ์ `:q!` + Enter (ออกโดยไม่ save) หรือ `:wq` (save แล้วออก)
ใน LazyVim กด `Space` `q` `q` ก็ได้
:::

---

## ไวยากรณ์ของ Vim — พูดกับ editor เป็นประโยค

นี่คือสิ่งที่ทำให้ Vim เร็ว: คำสั่งคือ **กริยา + (จำนวน) + กรรม**

```
  d       2       w        → ลบ 2 คำ
  │       │       │
 กริยา   จำนวน   motion / text object
```

**กริยา (operator)**

| ปุ่ม | ความหมาย |
|---|---|
| `d` | delete (ลบ — และเก็บไว้ใน clipboard ของ vim) |
| `c` | change (ลบแล้วเข้า Insert mode) |
| `y` | yank (copy) |
| `>` / `<` | เยื้องเข้า / ออก |
| `gc` | comment / uncomment |

**กรรม — motion (ไปถึงไหน)**

| ปุ่ม | ไปถึง |
|---|---|
| `w` / `b` / `e` | คำถัดไป / คำก่อนหน้า / ท้ายคำ |
| `0` / `^` / `$` | ต้นบรรทัด / ตัวอักษรแรก / ท้ายบรรทัด |
| `gg` / `G` | บรรทัดแรก / บรรทัดสุดท้าย |
| `f"` / `t"` | ไปที่ `"` ตัวถัดไป / ไปก่อนถึง `"` |
| `}` / `{` | ย่อหน้าถัดไป / ก่อนหน้า |

**กรรม — text object (ก้อนข้อความรอบ cursor)** — ใช้ `i` = inside, `a` = around

| ปุ่ม | หมายถึง |
|---|---|
| `iw` / `aw` | คำ |
| `i"` / `a"` | ข้อความใน `"..."` |
| `i(` / `i{` / `i[` | ข้อความในวงเล็บ |
| `ip` | ย่อหน้า (บล็อกที่คั่นด้วยบรรทัดว่าง) |
| `it` | ข้างใน HTML/XML tag |

พอรู้ทั้งสองฝั่งก็ **ผสมกันได้เอง** โดยไม่ต้องจำทีละคำสั่ง:

| คำสั่ง | อ่านว่า | ใช้ตอน |
|---|---|---|
| `ciw` | change inside word | เปลี่ยนคำที่ cursor อยู่ |
| `ci"` | change inside quotes | เปลี่ยน `image: "nginx:1.25"` ทั้งค่าในเครื่องหมายคำพูด |
| `dap` | delete around paragraph | ลบทั้ง block YAML |
| `yi{` | yank inside braces | copy ข้างใน `{ ... }` ของ Terraform |
| `>ip` | indent paragraph | เยื้อง block ทั้งก้อน |
| `dd` / `yy` / `cc` | กริยาซ้ำ = ทั้งบรรทัด | ลบ / copy / เปลี่ยนทั้งบรรทัด |

และปุ่ม `.` (dot) = **ทำคำสั่งล่าสุดซ้ำ** — แก้ที่หนึ่งแล้วกด `n` `.` `n` `.` ไปเรื่อยๆ ได้

---

## Leader key และ which-key

ปุ่มของ LazyVim ส่วนใหญ่ขึ้นต้นด้วย **Leader** = `Space` (ในเอกสารเขียนว่า `<leader>`)

กด `Space` แล้ว **รอครึ่งวินาที** — จะมีเมนู **which-key** เด้งขึ้นมาบอกว่ากดอะไรต่อได้บ้าง ไม่ต้องจำทั้งหมด

```
<leader>f  → file / find       <leader>g  → git
<leader>s  → search            <leader>c  → code (LSP)
<leader>b  → buffer            <leader>u  → UI toggle
<leader>w  → window            <leader>x  → diagnostics / quickfix
<leader>q  → quit / session    <leader>l  → Lazy (จัดการ plugin)
```

:::tip
ลืมปุ่มไหน กด `<leader>sk` (search keymaps) แล้วพิมพ์ค้นหาได้เลย เช่นพิมพ์ "rename"
:::

---

## มีอะไรมาให้ใน LazyVim

| ความสามารถ | Plugin | ปุ่มหลัก |
|---|---|---|
| ค้นหาไฟล์ / grep ทั้งโปรเจกต์ | snacks.nvim picker | `<leader><space>`, `<leader>/` |
| File explorer ด้านข้าง | snacks.nvim explorer | `<leader>e` |
| Autocomplete | blink.cmp | พิมพ์แล้วเด้งเอง |
| เช็ค error / ไปที่ definition | LSP (ติดตั้งผ่าน **Mason**) | `gd`, `K`, `<leader>ca` |
| Syntax highlight แม่นๆ | nvim-treesitter | อัตโนมัติ |
| Format ตอน save | conform.nvim | `<leader>cf` |
| Lint | nvim-lint | อัตโนมัติ |
| Git ในตัว | gitsigns + lazygit | `<leader>gg`, `]h` |
| กระโดดไปตรงไหนก็ได้บนจอ | flash.nvim | `s` |
| Terminal ลอย | snacks terminal | `Ctrl+/` |
| รายการ error ทั้งโปรเจกต์ | trouble.nvim | `<leader>xx` |

### LSP คืออะไร?

**Language Server Protocol** — โปรแกรมแยกที่ "เข้าใจภาษา" นั้นๆ แล้วคุยกับ editor
ตัวเดียวกับที่ VS Code ใช้ ทำให้ Neovim ได้ autocomplete, เช็ค error, rename ทั้งโปรเจกต์ เหมือน IDE

```
┌──────────┐   LSP protocol   ┌───────────────────────┐
│ Neovim   │ ◀──────────────▶ │ yaml-language-server  │  (ติดตั้งผ่าน Mason)
│          │ ◀──────────────▶ │ terraform-ls          │
│          │ ◀──────────────▶ │ dockerfile-ls         │
└──────────┘                  └───────────────────────┘
```

**Mason** (`<leader>cm`) คือ app store ของ LSP / formatter / linter — ติดตั้งให้อัตโนมัติเมื่อเปิดใช้ Extras ภาษานั้น

### Extras — เปิดใช้ภาษาที่ต้องการ

LazyVim ไม่ได้เปิดทุกภาษาไว้ (จะได้ไม่หนัก) — เปิดเพิ่มได้ด้วยคำสั่ง `:LazyExtras` แล้วกด `x` ที่รายการที่ต้องการ

Extras ที่สาย DevOps ควรเปิด:

| Extra | ได้อะไร |
|---|---|
| `lang.docker` | Dockerfile + compose LSP, lint ด้วย hadolint |
| `lang.yaml` | YAML LSP + schema (รู้ว่า key ไหนถูก/ผิด) |
| `lang.terraform` | terraform-ls, `terraform fmt` ตอน save |
| `lang.ansible` | ansible-language-server, ansible-lint |
| `lang.helm` | Helm chart template |
| `lang.json`, `lang.toml`, `lang.markdown` | ไฟล์ config / เอกสาร |
| `lang.python`, `lang.go` | ถ้าเขียน script / tool |

---

## ติดตั้ง

### 1. Requirements

| ต้องมี | ทำไม |
|---|---|
| **Neovim ≥ 0.11.2** | LazyVim รุ่นปัจจุบันต้องใช้ |
| **git ≥ 2.19** | ดาวน์โหลด plugin |
| **C compiler** (`gcc`) + **tree-sitter-cli** | compile parser ของ Treesitter |
| **curl** | ใช้โดย blink.cmp |
| **ripgrep** (`rg`) + **fd** | ค้นหาข้อความ / ไฟล์ |
| **Nerd Font** (แนะนำ) | แสดง icon — ไม่มีจะเห็นเป็นกล่อง ☐ |
| **lazygit** (แนะนำ) | git UI ใน terminal |
| Terminal ที่รองรับ true color | เช่น Ghostty, kitty, WezTerm, Alacritty, GNOME Terminal |

**Fedora / RHEL**

```bash
sudo dnf install neovim git gcc make curl ripgrep fd-find fzf unzip
sudo dnf copr enable atim/lazygit -y && sudo dnf install lazygit
npm install -g tree-sitter-cli        # หรือ: cargo install tree-sitter-cli
```

**Ubuntu / Debian** — `apt` มักได้ Neovim เวอร์ชันเก่า ให้โหลดจาก GitHub release แทน

```bash
sudo apt install git build-essential curl ripgrep fd-find fzf unzip
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
sudo rm -rf /opt/nvim-linux-x86_64 && sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz
echo 'export PATH="/opt/nvim-linux-x86_64/bin:$PATH"' >> ~/.bashrc   # zsh ใช้ ~/.zshrc
npm install -g tree-sitter-cli
```

**macOS**

```bash
brew install neovim git ripgrep fd fzf lazygit tree-sitter-cli
brew install --cask font-jetbrains-mono-nerd-font
```

ตรวจเวอร์ชัน:

```bash
nvim --version | head -1     # ต้อง >= v0.11.2
```

### 2. Nerd Font (Linux)

```bash
mkdir -p ~/.local/share/fonts && cd ~/.local/share/fonts
curl -LO https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip
unzip -o JetBrainsMono.zip -d JetBrainsMono && rm JetBrainsMono.zip
fc-cache -fv
```

แล้วไปตั้ง font ของ terminal เป็น **JetBrainsMono Nerd Font**

### 3. ติดตั้ง LazyVim Starter

```bash
# สำรอง config เดิม (ถ้ามี)
mv ~/.config/nvim{,.bak}
mv ~/.local/share/nvim{,.bak}
mv ~/.local/state/nvim{,.bak}
mv ~/.cache/nvim{,.bak}

# clone starter แล้วตัด .git ทิ้ง เพื่อให้เป็น config ของเราเอง
git clone https://github.com/LazyVim/starter ~/.config/nvim
rm -rf ~/.config/nvim/.git

nvim
```

เปิดครั้งแรกจะดาวน์โหลด plugin ทั้งหมดเอง รอจนเสร็จแล้วรัน `:LazyHealth` เพื่อเช็คว่าขาดอะไร

:::note[ลองก่อนโดยไม่ทับ config เดิม]
ใช้ `NVIM_APPNAME` แยก config ได้ — clone ไปไว้ที่ `~/.config/lazyvim` แล้วเปิดด้วย
`NVIM_APPNAME=lazyvim nvim` ข้อมูลจะแยกจาก `~/.config/nvim` เดิมทั้งหมด
:::

---

## โครงสร้าง Config

```
~/.config/nvim
├── init.lua               ← จุดเริ่ม (แค่ require config.lazy)
├── lazy-lock.json         ← lock เวอร์ชัน plugin (ควร commit เก็บไว้)
├── lazyvim.json           ← บันทึกว่าเปิด Extras อะไรไว้
└── lua
    ├── config
    │   ├── lazy.lua       ← bootstrap lazy.nvim (ปกติไม่ต้องแตะ)
    │   ├── options.lua    ← ตั้งค่า vim.opt เช่น เลขบรรทัด, tab
    │   ├── keymaps.lua    ← เพิ่ม/ลบปุ่มลัดของเรา
    │   └── autocmds.lua   ← คำสั่งที่รันเมื่อเกิด event
    └── plugins
        └── *.lua          ← ไฟล์ไหนก็ได้ใน folder นี้ = เพิ่ม/แก้ plugin
```

**หลักสำคัญ:** ไม่ต้องแก้ไฟล์ของ LazyVim เอง — เขียน **ทับ** (override) ใน folder ของเรา แล้ว LazyVim จะ merge ให้

```lua
-- lua/plugins/colorscheme.lua
return {
  { "ellisonleao/gruvbox.nvim" },                          -- เพิ่ม plugin ใหม่
  { "LazyVim/LazyVim", opts = { colorscheme = "gruvbox" } }, -- แก้ค่า LazyVim
  { "folke/flash.nvim", enabled = false },                 -- ปิด plugin ที่ไม่ชอบ
}
```

:::tip[เก็บ config ไว้ใน git (dotfiles)]
`~/.config/nvim` เป็นแค่ไฟล์ Lua — เอาไปไว้ใน repo dotfiles แล้ว clone บนเครื่องใหม่ / VM / devcontainer
ได้ editor หน้าตาเดิมทุกเครื่องในคำสั่งเดียว (เหมือนหลัก **Infrastructure as Code** แต่ใช้กับ editor)
:::

---

## ลำดับการฝึกที่แนะนำ

1. **สัปดาห์แรก:** รัน `:Tutor` (บทเรียนในตัวของ Neovim ~30 นาที) — ฝึก `hjkl`, `w`/`b`, `i`/`a`/`o`, `dd`/`yy`/`p`, `u`
2. **ใช้แก้ไฟล์จริงทุกวัน** แม้จะช้ากว่าเดิม — ความเร็วจะกลับมาภายใน 1–2 สัปดาห์
3. **เรียนทีละ 2–3 ปุ่มต่อวัน** — เปิด [Cheatsheet](/lazyvim/cheatsheet) ไว้ข้างๆ
4. ลงมือทำ [Lab 01](/lazyvim/lab-01) เพื่อใช้กับไฟล์ DevOps จริง (Dockerfile, YAML, Terraform)
