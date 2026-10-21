---
title: "Cheatsheet - ปุ่มลัด LazyVim"
description: รวมปุ่ม Vim พื้นฐานและปุ่มลัด LazyVim ที่ใช้บ่อย ไว้เปิดดูเวลาลืม
---

หน้ารวมปุ่มไว้เปิดเร็วๆ เวลาลืม — `<leader>` = **Space**, `C-x` = **Ctrl+x**, `S-x` = **Shift+x**

:::tip
จำไม่ได้ไม่เป็นไร: กด `Space` แล้วรอ → which-key บอกปุ่มถัดไป หรือ `<leader>sk` เพื่อค้นหาปุ่มทั้งหมด
:::

## เอาตัวรอด

| ปุ่ม | ทำอะไร |
|---|---|
| `Esc` | กลับ Normal mode (กดเมื่อไม่แน่ใจว่าอยู่โหมดไหน) |
| `:w` / `C-s` | save |
| `:q` / `:q!` | ออก / ออกโดยไม่ save |
| `:wq` หรือ `ZZ` | save แล้วออก |
| `<leader>qq` | ออกทั้งหมด |
| `u` / `C-r` | undo / redo |
| `:Tutor` | บทเรียน Vim ในตัว |

## เข้า Insert mode

| ปุ่ม | พิมพ์ตรงไหน |
|---|---|
| `i` / `a` | ก่อน / หลัง cursor |
| `I` / `A` | ต้นบรรทัด / ท้ายบรรทัด |
| `o` / `O` | เปิดบรรทัดใหม่ข้างล่าง / ข้างบน |
| `ciw` | ลบคำนี้แล้วพิมพ์ใหม่ |
| `cc` / `C` | ลบทั้งบรรทัด / ลบถึงท้ายบรรทัด แล้วพิมพ์ใหม่ |

## เลื่อน cursor

| ปุ่ม | ไปไหน |
|---|---|
| `h` `j` `k` `l` | ซ้าย ลง ขึ้น ขวา |
| `w` / `b` / `e` | คำถัดไป / คำก่อน / ท้ายคำ |
| `0` / `^` / `$` | ต้นบรรทัด / ตัวอักษรแรก / ท้ายบรรทัด |
| `gg` / `G` / `42G` | บนสุด / ล่างสุด / บรรทัด 42 |
| `C-d` / `C-u` | เลื่อนลง / ขึ้นครึ่งจอ |
| `f x` / `F x` | ไปที่ตัว `x` ถัดไป / ก่อนหน้า ในบรรทัด (`;` ซ้ำ) |
| `%` | กระโดดไปวงเล็บคู่กัน |
| `s` + 2 ตัวอักษร + label | **flash** — กระโดดไปตรงไหนก็ได้บนจอ |
| `C-o` / `C-i` | ย้อนกลับ / ไปข้างหน้า ตำแหน่งที่เคยกระโดด |

## แก้ไข

| ปุ่ม | ทำอะไร |
|---|---|
| `x` | ลบตัวอักษร |
| `dd` / `yy` / `p` / `P` | ลบบรรทัด / copy บรรทัด / วางข้างล่าง / วางข้างบน |
| `dw` / `d$` / `dG` | ลบคำ / ลบถึงท้ายบรรทัด / ลบถึงท้ายไฟล์ |
| `ci"` / `ci(` / `ci{` | เปลี่ยนข้อความใน `"..."` / `(...)` / `{...}` |
| `dap` / `yap` | ลบ / copy ทั้งย่อหน้า (block) |
| `>>` / `<<` | เยื้องบรรทัดเข้า / ออก |
| `gcc` / `gc` (visual) | comment บรรทัด / ส่วนที่เลือก |
| `J` | รวมบรรทัดล่างขึ้นมา |
| `A-j` / `A-k` | ย้ายบรรทัดลง / ขึ้น |
| `.` | **ทำคำสั่งล่าสุดซ้ำ** |
| `~` | สลับตัวพิมพ์เล็ก/ใหญ่ |
| `C-a` / `C-x` | เพิ่ม / ลดตัวเลขใต้ cursor (เช่น `replicas: 3`) |

## Visual mode

| ปุ่ม | ทำอะไร |
|---|---|
| `v` / `V` / `C-v` | เลือกตัวอักษร / ทั้งบรรทัด / แบบคอลัมน์ |
| `C-v` → เลือก → `I` → พิมพ์ → `Esc` | **พิมพ์หลายบรรทัดพร้อมกัน** (เช่น ใส่ `# ` หน้าหลายบรรทัด) |
| `>` / `<` | เยื้อง block ที่เลือก |
| `C-space` | ขยายการเลือกตาม syntax (Treesitter) |

## ค้นหา & แทนที่

| ปุ่ม / คำสั่ง | ทำอะไร |
|---|---|
| `/text` → `n` / `N` | ค้นในไฟล์ → ถัดไป / ก่อนหน้า |
| `*` | ค้นคำใต้ cursor |
| `:%s/old/new/g` | แทนที่ทั้งไฟล์ |
| `:%s/old/new/gc` | แทนที่ทั้งไฟล์ แต่ถามทีละจุด |
| `<leader>sr` | **search & replace ทั้งโปรเจกต์** (grug-far) |
| `Esc` | ล้าง highlight ผลค้นหา |

## ค้นหาไฟล์ (Picker)

| ปุ่ม | ทำอะไร |
|---|---|
| `<leader><space>` | หาไฟล์ (root ของโปรเจกต์) |
| `<leader>/` | grep ข้อความทั้งโปรเจกต์ |
| `<leader>,` | สลับ buffer (ไฟล์ที่เปิดอยู่) |
| `<leader>fr` | ไฟล์ที่เปิดล่าสุด |
| `<leader>fc` | หาไฟล์ config ของ Neovim |
| `<leader>sw` | grep คำใต้ cursor |
| `<leader>ss` | หา symbol ในไฟล์ (function, resource) |
| `<leader>sh` | ค้น help |
| `<leader>sk` | ค้นปุ่มลัด |

ใน picker: พิมพ์เพื่อกรอง, `C-j`/`C-k` เลื่อน, `Enter` เปิด, `C-v` / `C-s` เปิดแบบ split ขวา / ล่าง, `Esc` ปิด

## File Explorer

| ปุ่ม | ทำอะไร |
|---|---|
| `<leader>e` | เปิด / ปิด explorer |
| `l` / `Enter` | เปิดไฟล์ / โฟลเดอร์ |
| `h` | ปิดโฟลเดอร์ |
| `a` | สร้างไฟล์ใหม่ (ลงท้าย `/` = โฟลเดอร์) |
| `r` / `d` | rename / ลบ |
| `c` / `m` | copy / move |
| `H` / `I` | แสดงไฟล์ซ่อน / ไฟล์ที่ git ignore |
| `?` | ดูปุ่มทั้งหมด |

## Buffer & Window

| ปุ่ม | ทำอะไร |
|---|---|
| `S-h` / `S-l` | buffer ก่อนหน้า / ถัดไป (เหมือนสลับ tab) |
| `<leader>bd` | ปิด buffer นี้ |
| `<leader>bo` | ปิด buffer อื่นทั้งหมด |
| `<leader>\|` / `<leader>-` | แบ่งจอ ขวา / ล่าง |
| `C-h` `C-j` `C-k` `C-l` | ย้ายไปหน้าต่าง ซ้าย ล่าง บน ขวา |
| `<leader>wd` | ปิดหน้าต่าง |
| `<leader>wm` | ขยายหน้าต่างเต็มจอ (toggle) |
| `C-Up` / `C-Down` / `C-Left` / `C-Right` | ปรับขนาดหน้าต่าง |

## Code (LSP)

| ปุ่ม | ทำอะไร |
|---|---|
| `gd` | ไปที่ definition |
| `gr` | หาว่าใช้ที่ไหนบ้าง (references) |
| `K` | ดูเอกสาร / type ใต้ cursor |
| `<leader>ca` | code action (quick fix) |
| `<leader>cr` | rename ทั้งโปรเจกต์ |
| `<leader>cf` | format ไฟล์ |
| `<leader>cd` | ดู error ของบรรทัดนี้ |
| `]d` / `[d` | diagnostic ถัดไป / ก่อนหน้า |
| `]e` / `[e` | error ถัดไป / ก่อนหน้า |
| `<leader>xx` | รายการ diagnostics ทั้งหมด (Trouble) |
| `<leader>cl` | ดูว่า LSP ตัวไหนทำงานอยู่ |
| `<leader>cm` | เปิด Mason (ติดตั้ง LSP / formatter / linter) |

## Git

| ปุ่ม | ทำอะไร |
|---|---|
| `<leader>gg` | เปิด **lazygit** |
| `]h` / `[h` | hunk (จุดที่แก้) ถัดไป / ก่อนหน้า |
| `<leader>ghp` | preview hunk |
| `<leader>ghs` / `<leader>ghr` | stage / reset hunk |
| `<leader>gb` | blame บรรทัดนี้ |
| `<leader>gs` | git status |
| `<leader>gl` | git log |
| `<leader>gf` | ประวัติของไฟล์นี้ |
| `<leader>gB` | เปิดไฟล์นี้บน GitHub/GitLab ใน browser |

**ใน lazygit:** `space` stage, `c` commit, `P` push, `p` pull, `Enter` ดู diff, `?` help, `q` ออก

## Terminal

| ปุ่ม | ทำอะไร |
|---|---|
| `C-/` | เปิด / ปิด terminal ลอย |
| `<leader>ft` / `<leader>fT` | terminal ที่ root / cwd |
| `Esc Esc` | ออกจาก terminal mode (เพื่อเลื่อน/copy output) |

## UI Toggle

| ปุ่ม | ทำอะไร |
|---|---|
| `<leader>uf` | เปิด / ปิด format ตอน save |
| `<leader>uw` | ตัดบรรทัด (wrap) |
| `<leader>ul` / `<leader>uL` | เลขบรรทัด / เลขบรรทัดแบบ relative |
| `<leader>ud` | แสดง / ซ่อน diagnostics |
| `<leader>uC` | เปลี่ยน colorscheme (มี preview) |
| `<leader>uz` | Zen mode |
| `<leader>n` | ประวัติ notification |

## จัดการ LazyVim

| คำสั่ง | ทำอะไร |
|---|---|
| `<leader>l` หรือ `:Lazy` | จัดการ plugin (`U` update, `S` sync, `X` clean) |
| `:LazyExtras` | เปิด / ปิด Extras (กด `x` ที่รายการ) |
| `:LazyHealth` | ตรวจว่าเครื่องขาดอะไร |
| `:Mason` | จัดการ LSP / formatter / linter |
| `<leader>L` | ดู changelog ของ LazyVim |
| `<leader>qs` / `<leader>ql` | กู้คืน session ของโฟลเดอร์นี้ / session ล่าสุด |

## Macro

```text
qa        เริ่มอัด macro ลง register "a"
...       ทำสิ่งที่อยากให้ซ้ำ (จบด้วยการเลื่อนไปบรรทัดถัดไป เช่น j0)
q         หยุดอัด
@a        เล่น macro 1 ครั้ง
10@a      เล่น 10 ครั้ง
@@        เล่น macro ล่าสุดซ้ำ
```

## เปิดไฟล์จาก terminal

```bash
nvim .                      # เปิดโฟลเดอร์ปัจจุบัน (เห็นหน้า dashboard)
nvim deploy.yaml            # เปิดไฟล์
nvim +42 main.tf            # เปิดที่บรรทัด 42
nvim -d a.yaml b.yaml       # diff สองไฟล์
kubectl get deploy web -o yaml | nvim   # อ่าน output ใน nvim (ตั้ง :set ft=yaml)
export EDITOR=nvim          # ให้ git commit / kubectl edit / crontab -e ใช้ nvim
```
