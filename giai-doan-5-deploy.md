# Giai đoạn 5: Deploy thử nghiệm

> Trước khi bắt đầu, đọc file `CLAUDE.md` ở thư mục gốc. Giai đoạn này phụ thuộc vào Giai đoạn 1-4 đã hoàn thành và chạy tốt ở local.

**Mục tiêu giai đoạn:** Đưa sản phẩm lên môi trường public để 5-10 người dùng thật có thể trải nghiệm toàn bộ luồng từ upload đến tải video.

---

## Task 5.1 — Deploy API + Worker

**Prompt gợi ý:**
```
Viết Dockerfile cho apps/api và 1 Dockerfile riêng cho apps/worker (worker cần
cài thêm FFmpeg trong image, ví dụ base image node:20-bullseye rồi apt-get
install ffmpeg). Cả 2 Dockerfile cần build được packages/shared trước (monorepo
build step).
Viết hướng dẫn deploy lên Railway gồm: service "api" (Fastify), service "worker"
(BullMQ worker), PostgreSQL addon, Redis addon. Đảm bảo biến môi trường được
cấu hình đúng qua Railway dashboard cho cả 2 service.
```

**Acceptance criteria:**
- [ ] API chạy được trên URL public của Railway, gọi thử `GET /health` thành công
- [ ] Worker chạy được, xử lý được job thật gửi từ API production (kiểm tra qua log Railway)

---

## Task 5.2 — Deploy frontend

**Prompt gợi ý:**
```
Build apps/web (Vite) thành static files (npm run build), deploy lên Vercel
hoặc Netlify, cấu hình biến môi trường VITE_API_URL trỏ về URL API trên Railway.
Đảm bảo CORS trong apps/api cho phép domain frontend production gọi vào.
```

**Acceptance criteria:**
- [ ] Truy cập được frontend qua URL public, thực hiện được full luồng upload → gán thoại → tạo video → tải video

---

## Sau khi deploy xong

- [ ] Chuẩn bị 3-5 truyện mẫu để demo
- [ ] Mời 5-10 người trong cộng đồng vẽ truyện/webtoon dùng thử
- [ ] Thu thập phản hồi: điểm khó dùng, lỗi OCR/TTS thường gặp, mong muốn thêm tính năng
- [ ] Tổng hợp phản hồi → quyết định hướng phát triển tiếp theo (AI nhận diện nhân vật tự động, chế độ tạo video nâng cao, v.v.)
