import { QuizQuestion } from "@/types/quiz";

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: "q-1",
    question: "Từ nào sau đây tương đương nghĩa với 'Nhất quán, kiên định, trước sau như một'?",
    options: ["Implement", "Consistent", "Significant", "Analyze"],
    correctOptionIndex: 1,
    explanation: "'Consistent' (adjective) nghĩa là nhất quán, kiên định. Ví dụ: consistent performance (hiệu suất nhất quán).",
  },
  {
    id: "q-2",
    question: "Điền vào chỗ trống: 'The company will ______ workers for extra working hours.'",
    options: ["compensate", "negotiate", "collaborate", "acquire"],
    correctOptionIndex: 0,
    explanation: "'Compensate' (verb) nghĩa là đền bù, bồi thường. Câu trên dịch là: Công ty sẽ bồi thường cho nhân viên làm thêm giờ.",
  },
  {
    id: "q-3",
    question: "Từ 'Punctual' thuộc loại từ nào và có nghĩa là gì?",
    options: [
      "Động từ - Làm việc năng nổ",
      "Tính từ - Đúng giờ",
      "Danh từ - Điểm số",
      "Trạng từ - Một cách cẩn thận",
    ],
    correctOptionIndex: 1,
    explanation: "'Punctual' là tính từ (adjective) mang ý nghĩa đúng giờ, không trễ hẹn.",
  },
  {
    id: "q-4",
    question: "Nghĩa của từ 'Advocate' là gì?",
    options: [
      "Phản đối ý kiến",
      "Ủng hộ, tán thành công khai",
      "Tìm kiếm cơ hội",
      "Đầu tư tài chính",
    ],
    correctOptionIndex: 1,
    explanation: "'Advocate' (verb) nghĩa là ủng hộ, tán thành công khai một lối sống, chính sách hoặc biện pháp nào đó.",
  },
];
