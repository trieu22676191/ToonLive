# Giai đoạn 3: Gán thoại cho nhân vật + TTS

> Trước khi bắt đầu, đọc file `CLAUDE.md` ở thư mục gốc. Giai đoạn này phụ thuộc vào Giai đoạn 1 và 2 đã hoàn thành. Frontend dùng React + Vite.

**Mục tiêu giai đoạn:** Người dùng có thể tạo nhân vật, gán từng dòng thoại cho nhân vật, chọn giọng đọc, và nghe được audio lồng tiếng tạo ra bằng TTS — qua giao diện web thực tế.

---

## Task 3.1 — API quản lý Character

**Prompt gợi ý:**
```
Trong apps/api/src/routes/characters.ts, tạo các route CRUD:
POST /comics/:comicId/characters (tạo nhân vật: name, voiceId)
GET /comics/:comicId/characters (danh sách nhân vật)
PUT /characters/:characterId (sửa tên/giọng)
DELETE /characters/:characterId
Dùng zod validate input, Prisma Client để thao tác DB.
```

**Acceptance criteria:**
- [ ] Test CRUD đầy đủ qua Postman/curl, dữ liệu lưu đúng trong DB

---

## Task 3.2 — API gán thoại cho nhân vật

**Prompt gợi ý:**
```
Trong apps/api/src/routes/dialogue-lines.ts, tạo route PUT /dialogue-lines/:lineId
cho phép cập nhật: characterId (gán nhân vật), text (sửa nội dung nếu OCR sai),
orderIndex (sửa thứ tự đọc).
Tạo route GET /comics/pages/:pageId/dialogue-lines trả về danh sách thoại của
trang đó, dùng Prisma include để kèm theo thông tin Character đã gán (nếu có).
```

**Acceptance criteria:**
- [ ] Gán characterId cho 1 dòng thoại → GET lại thấy đúng thông tin nhân vật kèm theo

---

## Task 3.3 — Tích hợp TTS

**Prompt gợi ý:**
```
Trong packages/shared/src/services/tts.service.ts, viết hàm generateAudio(text: string,
voiceId: string): Promise<Buffer> gọi [FPT.AI TTS API / Google Cloud TTS —
chọn 1 bên] qua REST (dùng fetch hoặc axios).

Trong apps/worker: tạo processor mới lắng nghe ttsQueue. Job data { lineId }:
lấy text + voiceId (từ character gán cho dòng thoại đó qua Prisma) → gọi
tts.service → upload audio buffer lên R2 qua storage.service → cập nhật
audioUrl vào DialogueLine.

Trong apps/api: tạo route POST /dialogue-lines/:lineId/generate-audio — đẩy job
vào ttsQueue, trả về job id (dùng lại endpoint GET /jobs/:queueName/:jobId/status
đã có từ giai đoạn 2 để poll).
```

**Acceptance criteria:**
- [ ] Trigger TTS cho 1 dòng thoại đã gán nhân vật → poll job status → nghe được file audio kết quả, đúng giọng đã chọn
- [ ] Test với ít nhất 2 giọng khác nhau để xác nhận voiceId hoạt động đúng

---

## Task 3.4 — Frontend: màn hình upload + gán thoại (React + Vite)

**Prompt gợi ý:**
```
Trong apps/web, setup React project bằng Vite + TypeScript. Cài axios,
react-router-dom, @tanstack/react-query. Tạo các trang:
1. UploadPage: chọn comic, upload nhiều ảnh trang, hiển thị danh sách trang đã upload
2. EditPage: hiển thị ảnh 1 trang full-size, overlay các ô vuông trong suốt tại
   vị trí bbox của từng DialogueLine (dùng absolute positioning theo tỉ lệ % của
   kích thước ảnh gốc). Click vào 1 ô → mở panel bên phải cho chọn/tạo Character,
   sửa text, nút 'Nghe thử' gọi API generate-audio, poll job status, phát audio
   (thẻ <audio>) khi xong.
Dùng React Query để gọi API và quản lý loading/polling state.
```

**Acceptance criteria:**
- [ ] Upload được ảnh, thấy hiện trang trong danh sách
- [ ] Vào EditPage thấy đúng vị trí các ô thoại chồng lên ảnh
- [ ] Gán được nhân vật, nghe thử được audio ngay trên giao diện
