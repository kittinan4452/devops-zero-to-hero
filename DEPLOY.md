# Deploy — Cloudflare Pages

เว็บนี้เป็น static site (Astro Starlight) build ออกเป็น HTML ล้วนในโฟลเดอร์ `dist/`

## ภาพรวม

```
เขียน/แก้เนื้อหา → git push → Cloudflare Pages build (npm run build) → เผยแพร่อัตโนมัติ
```

---

## ขั้นตอนแบบละเอียด

### 1. เอาโค้ดขึ้น Git (ยังไม่ได้ทำ)

```bash
cd ~/devops-zero-to-hero
git init
git add .
git commit -m "init: astro starlight docs site"

# สร้าง repo ว่างบน GitHub ก่อน แล้ว:
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

> `.gitignore` ตั้งค่าไว้แล้ว — `node_modules/`, `dist/`, `.astro/` จะไม่ถูก push (ถูกต้อง เพราะ Cloudflare build เอง)

### 2. เชื่อม Cloudflare Pages

1. ไปที่ Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. เลือก repo ที่เพิ่ง push
3. ตั้งค่า build ตามนี้:

| ช่อง | ค่า |
|------|-----|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | อ่านจาก `.nvmrc` (22) อัตโนมัติ — หรือเพิ่ม env `NODE_VERSION=22` |

4. กด **Save and Deploy** — รอ build เสร็จจะได้ URL `https://<project>.pages.dev`

### 3. อัปเดต `site` URL ให้ตรง

หลังรู้ URL จริงแล้ว แก้ใน `astro.config.mjs`:

```js
site: 'https://<project>.pages.dev',   // หรือ custom domain
```

commit + push → Cloudflare re-deploy ให้เอง (ค่านี้มีผลกับ sitemap และ canonical URL)

---

## หลังจากนี้

- **ทุกครั้งที่ `git push` เข้า main** → Cloudflare build + deploy ให้อัตโนมัติ
- **Pull request** → ได้ preview URL แยกให้ทดสอบก่อน merge
- **Custom domain** → ตั้งได้ในหน้า Pages → Custom domains (ฟรี ต่อ DNS ผ่าน Cloudflare)

## ทดสอบ build เหมือน production ในเครื่อง

```bash
npm run build     # build → dist/
npm run preview   # เปิดดู dist/ ที่ localhost:4321
```
