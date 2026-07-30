# Giai đoạn 4: Ghép video

> Trước khi bắt đầu, đọc file `CLAUDE.md` ở thư mục gốc. Giai đoạn này phụ thuộc vào Giai đoạn 1, 2, 3 đã hoàn thành (cần có audioUrl cho các dòng thoại).

**Mục tiêu giai đoạn:** Ghép ảnh các trang truyện + audio đã tạo thành 1 video hoàn chỉnh, người dùng xem và tải xuống được từ giao diện.

---

## Task 4.1 — Service ghép video bằng fluent-ffmpeg

**Prompt gợi ý:**
```
Đảm bảo FFmpeg binary đã được cài trên máy dev (kiểm tra `ffmpeg -version`).
Trong packages/shared/src/services/video.service.ts, dùng fluent-ffmpeg.
Viết hàm renderPageVideo(imagePath: string, audioPaths: string[], outputPath: string):
Promise<void> — với mỗi audio trong danh sách (theo orderIndex), hiện ảnh tĩnh
trong suốt thời lượng audio đó, nối các đoạn lại thành 1 video cho cả trang
(có thể dùng ffmpeg concat filter hoặc tạo từng đoạn nhỏ rồi nối).
Viết hàm concatVideos(videoPaths: string[], outputPath: string): Promise<void>
nối video của tất cả các trang trong comic thành 1 video hoàn chỉnh, dùng
ffmpeg concat demuxer.
```

**Acceptance criteria:**
- [ ] Test với 1 trang có 2-3 dòng thoại đã có audio → ra video mp4 xem được, đúng thứ tự, audio khớp
- [ ] Test ghép nhiều trang thành 1 video hoàn chỉnh

---

## Task 4.2 — Worker + endpoint render video toàn bộ comic

**Prompt gợi ý:**
```
Thêm cột videoUrl vào model Comic trong schema.prisma (nếu chưa có từ task 1.2),
chạy migration mới.

Trong apps/worker: tạo processor mới lắng nghe videoQueue. Job data { comicId }:
lấy tất cả Page của comic theo thứ tự (Prisma orderBy pageNumber), với mỗi page
lấy các DialogueLine đã có audioUrl theo orderIndex, tải ảnh + audio về thư mục
tạm (dùng fs + fetch để download từ R2 URL), gọi video.service để render từng
trang rồi ghép toàn bộ, upload video final lên R2 qua storage.service, cập nhật
videoUrl vào Comic qua Prisma. Nhớ cleanup file tạm sau khi xong.

Trong apps/api: tạo route POST /comics/:comicId/render-video — đẩy job vào
videoQueue, trả về job id. Tạo route GET /comics/:comicId trả về thông tin
comic gồm videoUrl nếu có.
```

**Acceptance criteria:**
- [ ] Trigger render cho 1 comic có đủ audio ở tất cả dòng thoại → poll job → videoUrl xuất hiện, video xem được và đúng nội dung

---

## Task 4.3 — Frontend: màn hình xuất kết quả

**Prompt gợi ý:**
```
Trong apps/web, tạo trang ResultPage: nút 'Tạo video' gọi API render-video,
hiển thị trạng thái xử lý (loading/progress) bằng cách poll job status định kỳ
(React Query refetchInterval), khi xong hiển thị video player (thẻ <video>)
phát video kết quả và nút tải xuống (link trực tiếp tới videoUrl trên R2).
```

**Acceptance criteria:**
- [ ] Từ EditPage bấm sang được ResultPage, tạo video, xem và tải video thành công
