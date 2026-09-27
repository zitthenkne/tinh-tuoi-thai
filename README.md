# ⚡ zitthenk Tính Tuổi Thai Thần Tốc (SanCalc Y4)

Web App luyện tính nhẩm, phản xạ định tuổi thai và ngày dự sinh (EDD) chuẩn mực theo **Bộ môn Phụ Sản Đại học Y Dược TP.HCM** (Thầy Âu Nhứt Luân, Thầy Vinh, Cô Uyên ra đề) và Giáo trình *"Bài giảng Thực hành Sản khoa 2025"*.

🔗 **Trải nghiệm trực tiếp trên web**: [https://zitthenkne.github.io/tinh-tuoi-thai/](https://zitthenkne.github.io/tinh-tuoi-thai/)

---

## 🆕 Bản 3.0 — Nhiều trang ngắn, học bằng hình

Công thức bám **Chương 1 (skill `san-khoa-y4`)** + Sách Thực hành Sản khoa 2025.

- **🏠 Trang chủ**: linh vật "Bé Mầm" (chạm để nghe mẹo), vòng xoay thai kỳ 40 tuần bấm được từng mốc.
- **🧭 Chọn công thức**: mỗi câu hỏi 1 màn (IVF? ➔ kinh chót tin cậy? ➔ chu kỳ? ➔ yếu tố nhiễu?) ➔ ra đúng công thức hoặc bẫy phải né.
- **📚 Bài học dạng slide** (◀ ▶, vuốt, phím mũi tên; mỗi bài kết thúc bằng 1 câu thử):
  * Bài 0 — Đếm từ kinh chót (tính cả ngày đó = ngày 1): thụ tinh = ngày 14 ➔ lùi 13 ra kinh chót lý thuyết, hạt 7 ngày = 1 tuần, đếm tuổi thai hôm khám (01/02 ➔ 02/04 = 61 ngày = 8w5d).
  * Bài 1 — Naegele: lịch lật số 3 nhịp, vòng 12 tháng (+9 = −3 & năm +1), máy tính từng bước.
  * Bài 1B — Vắt tháng: nắm tay đếm tháng 30/31, lịch tháng dự sinh tràn ô.
  * Bài 2 — Chu kỳ: hoàng thể cố định 14 ngày, dự sinh + (X − 28), kinh không đều ➔ đóng dấu "KHÔNG NAEGELE".
  * Bài 3 — IVF & IUI: phôi phân chia N0 ➔ N5, thụ tinh = ngày 14 (2w0d), máy tính (Khám − Chuyển phôi) + 17/19 (bài Thầy Vinh 08/08 ➔ 17/09 = 8w3d), kinh chót lý thuyết = chuyển phôi − 16/18, IUI + 14, tuổi thai IVF bất biến.
  * Bài 4 — CRL: màn hình siêu âm giả lập (42 + CRL), tư thế đo chuẩn (cúi / ngửa làm sai CRL), cân LMP ↔ CRL theo ACOG (< 9 tuần: lệch > 5 ngày; 9 – 13⁺⁶ tuần: lệch > 7 ngày ➜ đổi), khóa chết TCN1.
- **⚡ Luyện**: thêm dạng IUI, IVF hôm khám, "LMP hay CRL"; câu sai hiện bảng giải + nút 🎬 xem hoạt ảnh đúng số liệu câu đó; Blitz 60 giây.
- **🚫 Bẫy**: 6 thẻ lật có con dấu kết luận • **📋 Thẻ công thức** gói gọn 1 màn • **🏆 Kỷ lục**: huy hiệu, % đúng theo bài.
- Font **Baloo 2 + Nunito nhúng base64** trong `fonts/fonts-embed.css` ➔ không lỗi font tiếng Việt, chạy offline.

## 🌟 Điểm Nổi Bật & Tính Năng

1. **⚡ Phản Xạ 1 Giây (Flashcard Rapid-Fire)**:
   - Đề bài siêu tinh gọn: 1 dòng Ngày Tháng Kinh Chót (LMP) ➔ Phản xạ ngay Ngày Dự Sinh (EDD).
   - **2 Chế độ luyện tập linh hoạt**:
     * ⌨️ **Gõ Đáp Án Trực Tiếp**: Nhập nhanh Ngày / Tháng (tự động nhảy con trỏ, năm tự điền sẵn, phím Enter kiểm tra, phím `N` bắt bẫy).
     * ⚡ **Trắc Nghiệm 4 Nút**: 4 nút to rõ ràng, hỗ trợ phím tắt `[1]`, `[2]`, `[3]`, `[4]` hoặc chạm nhanh trên iPad/điện thoại.
   - **Tự động nhảy câu (Flow Mode 0.35s)**: Đúng là chuyển câu ngay tức thì, sai thì dừng lại chỉ rõ mẹo nhẩm 1 giây!

2. **🚫 Bộ Lọc Nhận Diện Bẫy Điểm Liệt (Phải Né Ngay)**:
   - Kinh không đều (30 - 60 ngày) ➔ 🚫 KHÔNG DÙNG NAEGELE (dựa vào siêu âm CRL 3 tháng đầu).
   - Quan hệ duy nhất 1 lần ➔ 🚫 CẤM LẤY NGÀY QUAN HỆ (phải biết ngày rụng trứng).
   - Uống thuốc khẩn cấp Postinor-1 ➔ 🚫 KINH CHÓT MẤT ĐỘ TIN CẬY (hoãn rụng trứng muộn).
   - Thai IVF siêu âm tuần 12 thấy nhỏ ➔ 🚫 CẤM HIỆU CHỈNH LÙI DỰ SINH (chuẩn IVF là tuyệt đối 100%).
   - Siêu âm 3 tháng giữa đo BPD/FL lệch ➔ 🚫 KHÓA CHẾT NGÀY DỰ SINH 3 THÁNG ĐẦU.

3. **📚 Bám Sát 2 Chuẩn Học Thuật**:
   - **Thứ tự nguồn**: lời giảng APP Chương 1 (bản chép lời gốc) > sách bộ môn (chỉ dùng chỗ bài giảng không nói). Sách tự lệch nhau: ví dụ vòng xoay (bà G.) đếm *không* tính ngày kinh chót, ví dụ lùi (bà A., bà C.) thì tính ➔ app theo bài giảng.
   - **Chu kỳ đều X ngày**: dự sinh + (X − 28) (APP C1: chu kỳ 40 ➔ rụng trứng ngày 26 ➔ tính từ ngày 12).
   - **Cách đếm (bài giảng Thầy Vinh – APP Chương 1)**: tuổi thai đếm **tính cả ngày kinh chót** ➔ 01/02 ➔ 02/04 = 61 ngày = 8w5d.
   - **IVF**: thụ tinh = ngày 14 (2w0d) ➔ Phôi D3 = 17 ngày (2w3d), Phôi D5 = 19 ngày (2w5d); tuổi thai = (Khám − Chuyển phôi) + 17 / + 19. Tịnh tiến 13 ngày dùng để lùi ra kinh chót lý thuyết = chuyển phôi − 16 / − 18 (Sách 2025 trang 2: chuyển 23/08 ➔ 07/08).

4. **🎨 Giao Diện Sổ Dán Pastel Retro (zitthenk Style)**:
   - Font chữ chuẩn 100% tiếng Việt (`Baloo 2` & `Nunito`, nhúng base64 trong `fonts/fonts-embed.css`), sạch bóng lỗi font.
   - Washi tape, giấy caro, hiệu ứng âm thanh Synth Web Audio API nhẹ nhàng và pháo hoa Confetti khi đạt chuỗi Streak!
   - Chạy 100% offline không cần cài đặt.

---

## 🛠️ Hướng Dẫn Sử Dụng Offline Trên Máy Tính
- Tải về và bấm đúp vào file `bat_tinh_tuoi_thai.bat` để mở ngay trên trình duyệt Chrome / Edge.

---
Made with 💖 for **Nguyễn Việt Thanh (Y23C UMP HCMC)**.
