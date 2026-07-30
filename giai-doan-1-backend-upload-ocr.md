# Giai đoạn 1: Backend lõi + Upload + OCR

> Trước khi bắt đầu, đọc file `CLAUDE.md` ở thư mục gốc để hiểu bối cảnh tổng thể dự án. Stack: Node.js/TypeScript, Fastify, Prisma, PostgreSQL.

**Mục tiêu giai đoạn:** Có API Fastify chạy được, kết nối database qua Prisma, upload được ảnh trang truyện lên Cloudinary, và OCR nhận diện được chữ trong bong bóng thoại.

---

## Task 1.1 — Khởi tạo monorepo + project API (Fastify)

**Prompt gợi ý:**
```
Khởi tạo 1 monorepo Node.js/TypeScript dùng npm workspaces tên comic-to-voice với cấu trúc:
apps/api/       (Fastify)
apps/worker/    (Node.js script rỗng, sẽ làm ở giai đoạn 2)
apps/web/       (để trống, làm ở giai đoạn 3)
packages/shared/ (Prisma schema + types dùng chung)

Trong apps/api, setup Fastify với TypeScript (tsx hoặc ts-node-dev cho dev mode).
Cài đặt: fastify, @fastify/cors, @fastify/multipart, dotenv, zod (validate input).
Tạo route GET /health trả về { status: "ok" }.
Tạo .env.example ở root với: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET, GOOGLE_VISION_API_KEY, REDIS_URL.
Tạo docker-compose.yml chạy PostgreSQL và Redis cho local dev.
```

**Acceptance criteria:**
- [ ] `npm run dev` trong apps/api chạy được, gọi `GET /health` trả về `{"status": "ok"}`
- [ ] `docker-compose up` chạy được PostgreSQL + Redis

---

## Task 1.2 — Thiết kế Prisma schema & migration

**Prompt gợi ý:**
```
Trong packages/shared/prisma/schema.prisma, định nghĩa các model sau:
- User(id, email, createdAt)
- Comic(id, userId, title, videoUrl String?, createdAt) — quan hệ tới User
- Page(id, comicId, pageNumber Int, imageUrl, createdAt) — quan hệ tới Comic
- Character(id, comicId, name, voiceId, createdAt) — quan hệ tới Comic
- DialogueLine(id, pageId, characterId String?, text, bboxX Float, bboxY Float,
  bboxWidth Float, bboxHeight Float, orderIndex Int, audioUrl String?, createdAt)
  — quan hệ tới Page và Character (nullable)
Setup Prisma Client, chạy migration đầu tiên (npx prisma migrate dev) áp dụng
vào database local. Export Prisma Client instance dùng chung từ packages/shared
để cả apps/api và apps/worker đều import được.
```

**Acceptance criteria:**
- [ ] `npx prisma migrate dev` chạy thành công, các bảng xuất hiện trong PostgreSQL
- [ ] `npx prisma studio` mở được, xem được cấu trúc bảng
- [ ] Viết 1 script test đơn giản insert/query thử qua Prisma Client thành công

---

## Task 1.3 — Upload ảnh lên Cloudinary

**Prompt gợi ý:**
```
Trong packages/shared/src/services/storage.service.ts, dùng SDK chính thức
`cloudinary` (cấu hình cloud_name/api_key/api_secret từ .env). Viết hàm
uploadFile(fileBuffer: Buffer, filename: string): Promise<string> trả về public URL
(dùng uploader.upload_stream để upload trực tiếp từ Buffer, không cần lưu file tạm).

Trong apps/api, dùng @fastify/multipart để nhận file upload. Tạo route:
POST /comics/:comicId/pages — nhận file ảnh upload, gọi storage.service để lưu
lên Cloudinary, tạo record Page trong DB qua Prisma, trả về page object.
Validate bằng zod: chỉ nhận .jpg/.png/.webp, giới hạn 10MB.
```

**Acceptance criteria:**
- [ ] Test bằng Postman/curl upload 1 ảnh thật, ảnh xuất hiện trên Cloudinary Media Library
- [ ] Record Page được tạo đúng trong DB với imageUrl hợp lệ

---

## Task 1.4 — Tích hợp OCR (Google Cloud Vision)

**Prompt gợi ý:**
```
Trong packages/shared/src/services/ocr.service.ts, dùng @google-cloud/vision
(hoặc gọi REST API trực tiếp nếu không muốn cài SDK nặng). Viết hàm
extractTextBlocks(imageUrl: string) trả về mảng { text, bboxX, bboxY, bboxWidth,
bboxHeight }.

Trong apps/api, tạo route POST /comics/pages/:pageId/ocr — gọi ocr.service,
lưu kết quả thành các DialogueLine (characterId để null, orderIndex theo thứ
tự top-to-bottom dựa vào bboxY).
```

**Acceptance criteria:**
- [ ] Gọi endpoint với 1 page ảnh truyện tranh tiếng Việt thật
- [ ] Kết quả trả về danh sách DialogueLine có text hợp lý, bbox đúng vị trí bong bóng thoại

---

## Trước khi sang Giai đoạn 2

⚠️ Dừng lại test OCR với 5-10 ảnh truyện tranh khác nhau (nhiều thể loại, nhiều style vẽ) để đánh giá độ chính xác thực tế. Đây là phần ảnh hưởng lớn đến chất lượng toàn bộ sản phẩm, nên xác nhận nó đủ tốt trước khi đầu tư tiếp vào các giai đoạn sau.
