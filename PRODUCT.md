# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Thí sinh & Phụ huynh**: Tìm hiểu thông tin tuyển sinh, quy chế xét tuyển, ngành đào tạo, học phí, học bổng và thủ tục nộp hồ sơ.
- **Cán bộ tuyển sinh**: Tiếp nhận và xử lý các câu hỏi phức tạp, câu hỏi nhạy cảm hoặc câu hỏi chưa có tài liệu chính thức thông qua hàng đợi bàn giao (HITL Handover Queue).

## Product Purpose

Cung cấp trợ lý AI tư vấn tuyển sinh chuẩn xác, đáng tin cậy. Hệ thống trả lời dựa trên tài liệu tuyển sinh chính thức đã kiểm chứng (official-source grounding), ngăn chặn rủi ro phát ngôn sai lệch và tự động bàn giao các câu hỏi ngoài tầm kiểm soát cho cán bộ chuyên trách.

## Positioning

Khác với các chatbot AI thông thường có nguy cơ tạo thông tin ảo (hallucination) hoặc tự đưa ra cam kết đỗ sai lệch, Admission X AI áp dụng guardrails nghiêm ngặt: chỉ phát ngôn khi có bằng chứng chính thống, từ chối võ đoán điểm chuẩn tương lai hay học phí chưa ban hành, và tích hợp sẵn quy trình Human-in-the-loop (HITL) liền mạch.

## Operating Context

- Giao diện web thí sinh: Cổng hội thoại hỏi đáp trực tuyến tiện lợi, thân thiện trên desktop và mobile (`/chat`).
- Giao diện cán bộ tuyển sinh: Danh sách và hàng đợi xử lý ca bàn giao (`/staff/handovers`).
- Kiến trúc xử lý: Next.js frontend kết nối FastAPI backend, điều phối qua LangGraph pipeline, truy xuất hybrid vector search trên Supabase pgvector và kiểm thử qua Agent-Harness.

## Capabilities and Constraints

- **Chức năng chính**: Phân loại ý định tuyển sinh/hồ sơ/học bổng, truy xuất tài liệu hybrid, sinh câu trả lời có trích dẫn nguồn, kiểm tra grounding, cổng kiểm duyệt độ tin cậy và tạo ticket bàn giao cán bộ khi cần.
- **Ràng buộc an toàn**: 
  - Không bao giờ tự suy đoán hoặc cam kết đỗ tuyển sinh.
  - Không tự bịa đặt học phí, hạn nộp hồ sơ, chỉ tiêu hay điểm chuẩn chưa công bố.
  - Tối thiểu hóa việc thu thập dữ liệu cá nhân (Minimal PII).

## Brand Commitments

- **Tên sản phẩm**: Admission X AI.
- **Tông giọng (Voice)**: Thân thiện, tôn trọng, minh bạch, chính xác và chuyên nghiệp.

## Evidence on Hand

- Tài liệu đề án tuyển sinh, quy chế xét tuyển lưu trữ trong cơ sở dữ liệu tri thức `admission_documents` và `admission_chunks`.
- Bộ câu hỏi kiểm thử vàng tại `evals/datasets/golden_admission.jsonl`.

## Product Principles

1. **Grounding First**: Mọi câu trả lời thực tế phải có tài liệu đối chiếu xác thực.
2. **Safety over Guessing**: Thà thừa nhận chưa có thông tin và chuyển cán bộ hỗ trợ còn hơn trả lời sai.
3. **Seamless Handover**: Bàn giao cho cán bộ tuyển sinh nhanh chóng, đầy đủ ngữ cảnh câu hỏi của thí sinh.
4. **Performance & Clean Craft**: Giao diện trực quan, tốc độ phản hồi nhanh, thiết kế không lạm dụng khuôn mẫu AI sáo rỗng.

## Accessibility & Inclusion

- Chuẩn WCAG AA cho độ tương phản màu sắc và kích thước vùng bấm (tap target).
- Tương thích tốt với mọi thiết bị di động của học sinh và phụ huynh.

