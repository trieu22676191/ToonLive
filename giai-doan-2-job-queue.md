# Giai đoạn 2: Job Queue (BullMQ + Redis)

> Trước khi bắt đầu, đọc file `CLAUDE.md` ở thư mục gốc. Giai đoạn này phụ thuộc vào Giai đoạn 1 đã hoàn thành (đặc biệt Task 1.4 — OCR). Stack: BullMQ + Redis.

**Mục tiêu giai đoạn:** Chuyển các tác vụ chậm (bắt đầu với OCR) sang chạy nền trong 1 process worker riêng (`apps/worker`), không chặn HTTP request của API. Đây là nền tảng bắt buộc trước khi thêm TTS và render video ở các giai đoạn sau.

---

## Task 2.1 — Setup BullMQ (queue trong API, worker xử lý trong apps/worker)

**Prompt gợi ý:**
```
Trong packages/shared/src/queue/, tạo file queue.ts định nghĩa các Queue dùng
BullMQ (kết nối Redis qua REDIS_URL): ocrQueue, ttsQueue (sẽ dùng ở giai đoạn 3),
videoQueue (sẽ dùng ở giai đoạn 4). Export các queue này để cả apps/api và
apps/worker cùng dùng.

Trong apps/api: route POST /comics/pages/:pageId/ocr (đã có ở task 1.4) giờ
sửa lại thành: đẩy job vào ocrQueue với data { pageId }, trả về job.id ngay
lập tức (không đợi xử lý xong).
Tạo route GET /jobs/:queueName/:jobId/status — nhận tên queue + job id, trả
về trạng thái (waiting/active/completed/failed) và kết quả nếu đã xong.

Trong apps/worker/src/index.ts: setup Worker của BullMQ lắng nghe ocrQueue,
khi nhận job thì gọi lại hàm extractTextBlocks (từ ocr.service đã viết ở task
1.4) và lưu kết quả vào DB qua Prisma (giống hệt logic cũ, chỉ chuyển từ chạy
trong request sang chạy trong worker).
```

**Acceptance criteria:**
- [ ] Chạy `npm run dev` trong apps/worker thành công, log hiển thị đang lắng nghe queue
- [ ] Gọi OCR endpoint → nhận job id ngay → poll status → thấy chuyển từ waiting/active sang completed
- [ ] Kết quả OCR được lưu đúng vào DB sau khi worker xử lý xong

---

## Ghi chú

Từ giai đoạn 3 trở đi, mọi tác vụ chậm khác (TTS, render video) sẽ tái sử dụng đúng pattern Queue + Worker + job id + polling status đã dựng ở đây (chỉ thêm queue mới và processor mới trong apps/worker). Nên đảm bảo cơ chế này chạy ổn định trước khi tiếp tục.
