# Bối cảnh dự án: Comic-to-Voice (chuyển truyện tranh thành lồng tiếng/video)

> File này dùng để cung cấp bối cảnh tổng quan cho AI (Claude Code) trước khi bắt đầu thực hiện các task cụ thể. Nên đưa file này vào đầu phiên làm việc, hoặc lưu thành `CLAUDE.md` ở thư mục gốc project để Claude Code tự đọc mỗi khi mở project.

## 1. Sản phẩm là gì

Đây là một web app cho phép người dùng upload ảnh các trang truyện tranh (comic/manga/webtoon do họ tự sở hữu), sau đó:

1. Hệ thống tự động nhận diện chữ trong các bong bóng thoại (OCR).
2. Người dùng tự gán từng dòng thoại cho nhân vật tương ứng (thủ công, chưa dùng AI nhận diện khuôn mặt ở giai đoạn này).
3. Người dùng chọn giọng đọc (voice) cho từng nhân vật.
4. Hệ thống dùng AI Text-to-Speech để tạo file âm thanh lồng tiếng cho từng dòng thoại.
5. Hệ thống ghép ảnh các trang truyện + audio đã tạo thành 1 video hoàn chỉnh (mỗi trang hiện tĩnh trong lúc audio của trang đó phát).

**Mục tiêu MVP:** Chỉ làm chế độ "lồng tiếng" với gán nhân vật thủ công. Chưa làm AI tự động nhận diện nhân vật, chưa làm animation phức tạp — những phần này để sau khi có tín hiệu nhu cầu thật từ người dùng.

## 2. Đối tượng người dùng

Tác giả truyện tranh nghiệp dư/webtoon muốn tạo video quảng bá tác phẩm của chính họ, hoặc người làm content muốn biến truyện tranh họ sở hữu bản quyền thành video có giọng đọc.

**Lưu ý về bản quyền:** Sản phẩm chỉ phục vụ nội dung do người dùng tự sở hữu/sáng tác. Không phải công cụ để re-upload truyện có bản quyền của người khác.

## 3. Kiến trúc & luồng xử lý tổng thể

```
User upload ảnh trang truyện
        ↓
   Lưu ảnh lên Cloudinary (object storage + CDN)
        ↓
   OCR (Google Cloud Vision) chạy nền qua BullMQ worker
   → tách được các dòng thoại + vị trí (bounding box)
        ↓
   User vào giao diện, xem ảnh + các ô thoại overlay
   → gán từng dòng thoại cho 1 Character (tự tạo/chọn)
   → chọn giọng đọc cho Character đó
        ↓
   Trigger TTS (FPT.AI/Google TTS) chạy nền qua BullMQ worker
   → sinh file audio cho từng dòng thoại, lưu lên Cloudinary
        ↓
   Trigger render video (FFmpeg qua fluent-ffmpeg) chạy nền qua BullMQ worker
   → ghép ảnh trang + audio theo đúng thứ tự thành video hoàn chỉnh
        ↓
   User xem/tải video kết quả
```

**Nguyên tắc quan trọng:** Mọi tác vụ chậm (OCR, TTS, render video) đều PHẢI chạy qua BullMQ worker ở nền (1 process Node.js riêng), không bao giờ xử lý đồng bộ trong 1 HTTP request. API chỉ đẩy job vào queue và trả về `job_id`, frontend poll trạng thái qua endpoint riêng.

## 4. Stack kỹ thuật — 100% Node.js/TypeScript

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | TypeScript (dùng xuyên suốt API, Worker, Frontend) |
| API Backend | Fastify |
| Frontend | React + Vite (SPA thuần, không SSR) |
| ORM / Database | Prisma + PostgreSQL |
| Xử lý tác vụ nền | BullMQ + Redis |
| Lưu trữ file | Cloudinary (dùng SDK chính thức `cloudinary`) |
| OCR | Google Cloud Vision API (`@google-cloud/vision`) |
| Text-to-Speech | FPT.AI TTS hoặc Google Cloud TTS (gọi qua REST API, ưu tiên giọng tiếng Việt tự nhiên) |
| Ghép video | FFmpeg qua `fluent-ffmpeg` |
| Deploy | Railway (3 service: api, worker, web — hoặc web deploy riêng qua Vercel/Netlify) |
| Quản lý monorepo | npm workspaces (hoặc Turborepo nếu muốn build cache tốt hơn) |

## 5. Cấu trúc dữ liệu chính (data model)

- **User** — người dùng của hệ thống
- **Comic** — 1 bộ truyện tranh do user upload (có thể nhiều trang), có thêm `videoUrl` sau khi render xong
- **Page** — 1 trang ảnh cụ thể thuộc 1 Comic, có thứ tự (`pageNumber`)
- **Character** — 1 nhân vật trong Comic, có tên và giọng đọc (`voiceId`) do user gán
- **DialogueLine** — 1 dòng thoại được OCR ra từ 1 Page, có vị trí (bounding box), được gán cho 1 Character, có thứ tự đọc (`orderIndex`), và `audioUrl` sau khi TTS xong

Quan hệ: `User → Comic → Page → DialogueLine → Character` (DialogueLine thuộc Page, tham chiếu tới Character).

## 6. Cấu trúc thư mục dự kiến (monorepo)

```
comic-to-voice/
├── apps/
│   ├── api/                    # Fastify — REST API thuần
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/          # comics, characters, dialogue-lines, jobs
│   │   │   ├── services/         # ocr, tts, video, storage (dùng chung với worker)
│   │   │   └── plugins/          # config, db connection
│   │   └── package.json
│   ├── worker/                  # Node.js script riêng, chạy BullMQ worker
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── processors/       # ocr.processor.ts, tts.processor.ts, video.processor.ts
│   │   └── package.json
│   └── web/                     # React + Vite (SPA)
│       ├── src/
│       │   ├── pages/            # UploadPage, EditPage, ResultPage
│       │   └── components/
│       └── package.json
├── packages/
│   └── shared/                   # Prisma schema, TypeScript types, service logic dùng chung
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
├── docker-compose.yml             # PostgreSQL + Redis cho local dev
├── package.json                    # root, npm workspaces
└── .env.example
```

## 7. Trạng thái hiện tại của dự án

*(Cập nhật mục này khi dự án tiến triển, để mỗi phiên làm việc mới với Claude Code biết đang ở đâu)*

- [ ] Chưa bắt đầu — đang ở Giai đoạn 1, Task 1.1

## 8. Nguyên tắc làm việc

- Làm từng task nhỏ theo đúng thứ tự trong các file `tasks/giai-doan-*.md`, test kỹ trước khi sang task tiếp theo.
- Ưu tiên có luồng end-to-end chạy được (dù còn thô) hơn là tối ưu sớm một phần nhỏ.
- Chưa cần xử lý edge-case phức tạp hay tối ưu hiệu năng ở giai đoạn MVP.
- Khi không chắc chắn về lựa chọn kỹ thuật, ưu tiên giải pháp đơn giản, dễ triển khai nhất trước.
- API (`apps/api`) và Worker (`apps/worker`) là 2 process riêng biệt, luôn chạy song song khi dev (`npm run dev` ở cả 2 thư mục, hoặc dùng script chung ở root).
