# Git Workflow — Quy tắc commit code cho dự án Comic-to-Voice

> File này định nghĩa cách commit, đặt tên nhánh, và quy trình làm việc với Git khi thực hiện các task trong thư mục `tasks/`. Đưa file này cho Claude Code đọc cùng lúc với `CLAUDE.md` để nó tự tuân theo khi tạo commit.

## 1. Nguyên tắc chung

- Mỗi **task** (ví dụ Task 1.1, Task 1.2...) tương ứng với **ít nhất 1 commit riêng**, không gộp nhiều task vào 1 commit lớn.
- Code phải chạy được (đạt Acceptance Criteria của task đó) trước khi commit — không commit code dở dang giữa chừng lên nhánh chính.
- Vì làm 1 mình, không bắt buộc Pull Request, nhưng vẫn nên dùng nhánh riêng cho từng giai đoạn để dễ rollback nếu 1 giai đoạn bị lỗi nặng.
- **Luôn hỏi xác nhận người dùng trước mỗi lần `git push`** (kể cả push nhánh phụ, không riêng `main`). Commit local thì không cần hỏi, nhưng trước khi đẩy lên remote phải chờ đồng ý.

## 2. Chiến lược nhánh (branching)

```
main                          ← nhánh ổn định, chỉ merge khi 1 giai đoạn hoàn chỉnh và test xong
  └── phase-1-backend-ocr      ← nhánh làm việc cho Giai đoạn 1
  └── phase-2-job-queue        ← nhánh làm việc cho Giai đoạn 2
  └── phase-3-tts-frontend     ← nhánh làm việc cho Giai đoạn 3
  └── phase-4-video            ← nhánh làm việc cho Giai đoạn 4
  └── phase-5-deploy           ← nhánh làm việc cho Giai đoạn 5
```

Quy trình:
1. Trước khi bắt đầu 1 giai đoạn mới: `git checkout -b phase-N-ten-giai-doan` từ `main`.
2. Làm từng task trong giai đoạn, mỗi task xong → commit ngay trên nhánh này.
3. Khi cả giai đoạn hoàn thành và test đầy đủ (tất cả Acceptance Criteria đều pass) → merge vào `main`:
   ```
   git checkout main
   git merge phase-N-ten-giai-doan
   git push
   ```
4. Xoá nhánh giai đoạn sau khi merge xong (tuỳ chọn, giữ lại cũng không sao).

## 3. Quy tắc đặt tên commit message

Dùng format [Conventional Commits](https://www.conventionalcommits.org/), gắn kèm mã task để dễ tra cứu:

```
<type>(<phase.task>): <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>
```

**Các loại `type` thường dùng:**
| Type | Khi nào dùng |
|---|---|
| `feat` | Thêm tính năng/endpoint/component mới |
| `fix` | Sửa lỗi |
| `chore` | Setup project, cài dependency, cấu hình không ảnh hưởng logic |
| `refactor` | Sửa cấu trúc code, không đổi hành vi |
| `docs` | Cập nhật tài liệu (CLAUDE.md, README...) |
| `test` | Thêm/sửa test |

**Ví dụ cụ thể theo từng task:**
```
chore(1.1): khởi tạo monorepo, setup Fastify + health check
feat(1.2): thêm Prisma schema và migration đầu tiên
feat(1.3): thêm endpoint upload ảnh lên Cloudinary
feat(1.4): tích hợp OCR Google Vision, lưu DialogueLine
feat(2.1): setup BullMQ queue + worker xử lý OCR nền
feat(3.1): thêm CRUD Character
feat(3.2): thêm API gán thoại cho nhân vật
feat(3.3): tích hợp TTS, tạo audio cho dòng thoại
feat(3.4): thêm UploadPage và EditPage frontend
feat(4.1): thêm service ghép video bằng fluent-ffmpeg
feat(4.2): thêm worker + endpoint render video toàn bộ comic
feat(4.3): thêm ResultPage hiển thị và tải video
chore(5.1): thêm Dockerfile, hướng dẫn deploy API + worker lên Railway
chore(5.2): deploy frontend lên Vercel
```

## 4. Checklist trước mỗi lần commit

- [ ] Code chạy được, không lỗi khi start dev server
- [ ] Đã test theo đúng Acceptance Criteria của task trong file `tasks/giai-doan-*.md`
- [ ] Không commit file `.env` thật (chỉ commit `.env.example`) — kiểm tra `.gitignore` đã có `.env`, `node_modules/`, `dist/`
- [ ] Commit message đúng format ở mục 3

## 5. File `.gitignore` gợi ý cho project

```
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
apps/worker/tmp/
```

## 6. Cập nhật CLAUDE.md sau mỗi giai đoạn

Sau khi merge 1 nhánh `phase-N-*` vào `main`, nhớ cập nhật mục "7. Trạng thái hiện tại của dự án" trong `CLAUDE.md`, ví dụ:
```
- [x] Giai đoạn 1 hoàn thành (Task 1.1 → 1.4)
- [ ] Đang làm Giai đoạn 2, Task 2.1
```
Việc này giúp phiên làm việc Claude Code tiếp theo biết chính xác đang ở đâu mà không cần đọc lại toàn bộ lịch sử commit.
