
# 🤖 hCaptcha Text Challenge Solver (Puppeteer + Groq AI)

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-43853D?style=flat&logo=node.js&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Chrome%20Automation-40B5A4?style=flat&logo=puppeteer&logoColor=white)
![Groq API](https://img.shields.io/badge/AI-Groq%20Cloud-F55036?style=flat&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

> **Một giải pháp tự động hóa thông minh (Proof of Concept) sử dụng Mô hình Ngôn ngữ Lớn (LLM) để giải quyết các câu đố logic văn bản của hCaptcha với tốc độ cực nhanh.**

---

## 📑 Mục lục
- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Cài đặt & Cấu hình](#-cài-đặt--cấu-hình)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Phân tích kỹ thuật](#-phân-tích-kỹ-thuật-cơ-chế-hoạt-động)
- [Tuyên bố miễn trừ trách nhiệm](#-tuyên-bố-miễn-trừ-trách-nhiệm)

---

## 📖 Giới thiệu

Dự án này minh họa cách kết hợp sức mạnh của **Puppeteer** (để điều khiển trình duyệt) và **Groq API** (để xử lý ngôn ngữ tự nhiên) nhằm vượt qua các bài kiểm tra **Text Challenge** của hCaptcha.

Khác với các phương pháp truyền thống dựa vào nhận diện hình ảnh, công cụ này tập trung vào việc hiểu và giải các câu đố logic, toán học, và ngữ nghĩa mà hCaptcha đưa ra (ví dụ: tìm vị trí ký tự, tính toán đơn giản, suy luận logic).

---

## ✨ Tính năng nổi bật

* 🚀 **Tốc độ xử lý cao:** Sử dụng Groq API (GPT-OSS models) cho phản hồi độ trễ thấp (Low Latency).
* 🧠 **Prompt Engineering chuyên sâu:** Hệ thống prompt được tối ưu hóa để xử lý các dạng câu hỏi "mẹo" (Trick questions), chuỗi số, đảo ngược từ và logic gia đình.
* 🔗 **Kiến trúc Bridge thông minh:** Kỹ thuật kết nối Node.js và Browser Context giúp vượt qua hạn chế của môi trường Sandbox.
* 🛡️ **Cơ chế Polyfill:** Giả lập môi trường Chrome Extension ngay trong Puppeteer, cho phép tái sử dụng logic của extension mà không cần đóng gói.
* 🔄 **Tự động hóa hoàn toàn:** Tự động phát hiện iframe, chuyển đổi ngôn ngữ sang tiếng Anh (để tăng độ chính xác cho AI) và tự động thử lại (Retry) khi thất bại.

---

## 🛠 Cài đặt & Cấu hình

### 1. Yêu cầu hệ thống
* [Node.js](https://nodejs.org/) (Phiên bản 18 trở lên).
* Tài khoản và API Key từ [Groq Console](https://console.groq.com/).

### 2. Cài đặt
Clone repository và cài đặt các thư viện phụ thuộc:

```bash
git clone [https://github.com/username/hcaptcha-text-solver.git](https://github.com/username/hcaptcha-text-solver.git)
cd hcaptcha-text-solver
npm install puppeteer

3. Cấu hình API Key
Mở file code chính (ví dụ index.js), tìm đến dòng cấu hình và dán API Key của bạn vào:
// Configuration section
const GROQ_API_KEY = 'gsk_...YOUR_KEY_HERE...'; 
const MODEL = 'openai/gpt-oss-20b'; // Hoặc model khác tùy chọn

🚀 Hướng dẫn sử dụng
Chạy lệnh sau trong terminal để khởi động tool:
node index.js

Quá trình diễn ra:
 * Trình duyệt Chromium sẽ mở lên (chế độ có giao diện).
 * Tự động truy cập trang Demo của hCaptcha.
 * Tool sẽ tự động tìm iframe, click checkbox, đọc câu hỏi và điền đáp án.
 * Kết quả sẽ được log ra màn hình console.
🔍 Phân tích kỹ thuật (Cơ chế hoạt động)
Dự án được thiết kế dựa trên mô hình Injection & Bridging:
1. The Backend (Node.js Controller)
Chịu trách nhiệm giao tiếp với thế giới bên ngoài (API AI).
 * Nhận question từ trình duyệt.
 * Gửi request tới Groq API với PROMPT_TEMPLATE được thiết kế riêng để ép AI trả lời ngắn gọn (JSON/Single word).
 * Sanitize (làm sạch) câu trả lời trước khi gửi lại cho Client.
2. The Bridge (page.exposeFunction)
Puppeteer cung cấp phương thức exposeFunction cho phép tiêm một hàm Node.js vào ngữ cảnh toàn cục (window) của trình duyệt.
 * Hàm window.nodeSolve(question) được tạo ra để browser có thể gọi ngược về Node.js.
3. The Client (Injected Script)
Logic này chạy bên trong iframe của hCaptcha. Vì môi trường này bị cô lập, chúng tôi sử dụng kỹ thuật Mocking Chrome API:
 * Polyfill: Tạo giả các đối tượng chrome.runtime, chrome.storage để code (vốn được viết cho Extension) có thể chạy mượt mà mà không báo lỗi undefined.
 * DOM Watcher: Sử dụng setInterval và MutationObserver để liên tục theo dõi sự xuất hiện của câu hỏi mới.
⚠️ Tuyên bố miễn trừ trách nhiệm
VUI LÒNG ĐỌC KỸ:
 * Mục đích giáo dục: Mã nguồn này chỉ được cung cấp cho mục đích nghiên cứu kỹ thuật, học tập và kiểm thử bảo mật (Educational & Research Purposes Only).
 * Tuân thủ quy định: Người sử dụng chịu hoàn toàn trách nhiệm về việc tuân thủ các Điều khoản Dịch vụ (Terms of Service) của các trang web mục tiêu.
 * Không khuyến khích lạm dụng: Tác giả không chịu trách nhiệm cho bất kỳ hành vi sử dụng công cụ này vào mục đích spam, tấn công hệ thống, hoặc các hoạt động bất hợp pháp khác.
 * Bản quyền: hCaptcha là thương hiệu của Intuition Machines, Inc. Dự án này không có liên kết với hCaptcha.
Author: Konmeo22132.
License: MIT

