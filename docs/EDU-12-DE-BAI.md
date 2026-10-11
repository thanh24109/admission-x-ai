# EDU-12 — Trợ lý tuyển sinh X: Trợ lý tuyển sinh AI tư vấn và tăng gắn kết ứng viên

## 1. Thực trạng
Phòng tuyển sinh Trường đại học X nhận nhiều câu hỏi lặp về quy trình, ngành, học phí, học bổng qua nhiều kênh; cán bộ quá tải, ứng viên chờ lâu và dễ bỏ cuộc.

## 2. Vấn đề và mục tiêu
Xây dựng chatbot tuyển sinh tư vấn ứng viên 24/7, hướng dẫn quy trình nộp hồ sơ, cá nhân hóa theo hồ sơ/ngành quan tâm, chủ động dẫn dắt nhằm tăng mức độ gắn kết ứng viên (applicant engagement).

**KPI mục tiêu:**
- Tỷ lệ câu hỏi được chatbot trả lời (answer rate) ≥ 70%.
- Độ chính xác câu trả lời (accuracy) ≥ 85%.
- Giảm ≥ 50% câu hỏi trực tiếp cho cán bộ tuyển sinh.

Đây là **mục tiêu nghiệm thu**, không phải kết quả đã được xác thực.

## 3. Ràng buộc
- Trả lời dựa trên quy chế/thông tin tuyển sinh **chính thức**, kèm trích dẫn nguồn.
- Không bịa điều kiện tuyển sinh, hạn nộp, học phí, học bổng; không hứa hẹn kết quả trúng tuyển.
- Khi câu hỏi ngoài phạm vi, nhạy cảm hoặc thiếu bằng chứng/độ tin cậy, chuyển cho cán bộ (human-in-the-loop, HITL).
- Thu thập tối thiểu dữ liệu cá nhân ứng viên, bảo mật thông tin và tránh thiên vị.
- Kiểm soát chi phí và độ trễ trong mùa tuyển sinh cao điểm.

## 4. Công nghệ đề xuất
- **LLM:** sinh câu trả lời có kiểm soát.
- **RAG:** pgvector lưu tài liệu tuyển sinh chính thức, kết hợp reranker.
- **Điều phối:** intent detection, fallback/handover logic, multi-turn memory theo hồ sơ ứng viên.
- **Đánh giá:** answer rate, accuracy bằng LLM-as-Judge kết hợp bộ test có nhãn.
- **An toàn:** guardrails chống bịa cam kết và phát hiện câu hỏi nhạy cảm.
- **Backend:** FastAPI.
- **Frontend:** Next.js, widget chat.
- **Triển khai:** Docker + cloud, caching các câu hỏi thường gặp.

## 5. Yêu cầu cơ bản (MVP)
- [ ] Web app triển khai được, có ít nhất 2 vai trò: ứng viên và cán bộ tuyển sinh.
- [ ] Chatbot trả lời câu hỏi tuyển sinh có trích dẫn nguồn.
- [ ] Fallback/handover khi không chắc chắn hoặc ngoài phạm vi.
- [ ] Cán bộ xem và xử lý hàng chờ handover (HITL).
- [ ] Đo answer rate và accuracy trên bộ kiểm thử có nhãn.

## 6. Yêu cầu nâng cao
- [ ] Cá nhân hóa theo hồ sơ và ngành quan tâm; chủ động nurture ứng viên.
- [ ] Eval pipeline đo và xác minh KPI: answer rate ≥70%, accuracy ≥85%, giảm ≥50% câu hỏi trực tiếp cho cán bộ.
- [ ] Dashboard theo dõi engagement ứng viên.
- [ ] Guardrails chống bịa cam kết và tối ưu chi phí bằng caching.

## 7. Gợi ý nghiệm thu và phương pháp đo
- **Answer rate:** số câu hỏi được hệ thống trả lời hữu ích (không chuyển người) / tổng số câu hỏi hợp lệ trong tập đo; báo cáo riêng số câu handover.
- **Accuracy:** số câu trả lời được chấm đúng / tổng số câu trả lời được đánh giá; đánh giá theo đáp án tham chiếu có nhãn và rà soát mẫu của LLM-as-Judge.
- **Giảm tải cán bộ:** so sánh số câu hỏi phải xử lý trực tiếp ở giai đoạn vận hành với baseline tương đương trước triển khai; chuẩn hóa theo lưu lượng/cùng kỳ.
- **An toàn:** kiểm thử các tình huống hỏi điểm chuẩn tương lai, cam kết trúng tuyển, hạn nộp/học phí không có nguồn, dữ liệu nhạy cảm.
- **Truy xuất nguồn:** lưu bằng chứng và phiên bản tài liệu để tái kiểm chứng câu trả lời.

## 8. Liên hệ với repository
Repository hiện có các thành phần liên quan: `apps/web`, `apps/api`, `ai`, `evals`, `workers`, `supabase`, `infra`. Xem thêm [README](../README.md) và [PRODUCT](../PRODUCT.md).

> Tài liệu này mô tả **đề bài và tiêu chí mong muốn**; các ô kiểm không xác nhận rằng chức năng đã được hiện thực.
