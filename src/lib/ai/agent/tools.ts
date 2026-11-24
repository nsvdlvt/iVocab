// src/lib/ai/agent/tools.ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const AGENT_TOOLS: ChatCompletionTool[] = [
  // ==========================================
  // VOCABULARY QUERIES
  // ==========================================
  {
    type: "function",
    function: {
      name: "get_vocabulary_overview",
      description:
        "Lấy thống kê tổng quan về từ vựng của người dùng: tổng số từ, phân bố theo cấp độ CEFR (A1, A2, B1, B2, C1, C2), phân bố theo trạng thái học tập (new/chưa học, learning/đang học, learned/đã học, mastered/đã thuộc) và số từ được đánh dấu yêu thích.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_vocab_sets",
      description:
        "Lấy danh sách tất cả bộ từ vựng cá nhân của người dùng, kèm theo tên, mô tả, số lượng từ, số từ đã thuộc, số từ chưa học, tỷ lệ tiến độ % và ngày cập nhật/học gần nhất.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Từ khóa tìm kiếm theo tên hoặc mô tả bộ từ (tùy chọn)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vocab_set_details",
      description:
        "Lấy thông tin chi tiết của một bộ từ vựng theo ID hoặc theo tên bộ từ. Bao gồm tổng số từ, danh sách các từ trong bộ kèm nghĩa, phiên âm IPA, từ loại, cấp độ CEFR và trạng thái học tập.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID của bộ từ vựng (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ vựng cần tìm (nếu chưa biết ID)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_vocabulary",
      description:
        "Tìm kiếm từ vựng trong kho của người dùng theo từ tiếng Anh hoặc nghĩa tiếng Việt. Có thể lọc theo bộ từ hoặc cấp độ CEFR.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Từ tiếng Anh hoặc nghĩa tiếng Việt cần tìm kiếm",
          },
          set_id: {
            type: "string",
            description: "Giới hạn tìm kiếm trong bộ từ có ID này (tùy chọn)",
          },
          cefr_level: {
            type: "string",
            enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
            description: "Cấp độ CEFR cần lọc (tùy chọn)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vocabulary_details",
      description:
        "Xem thông tin chi tiết đầy đủ của một từ vựng cụ thể (nghĩa, phiên âm, từ loại, ví dụ câu, bản dịch ví dụ, từ đồng nghĩa/trái nghĩa, ghi chú, trạng thái SRS, ngày ôn tiếp theo, số lần ôn, độ dễ ease_factor).",
      parameters: {
        type: "object",
        properties: {
          word: {
            type: "string",
            description: "Từ tiếng Anh cần xem chi tiết",
          },
          vocabulary_id: {
            type: "string",
            description: "ID của từ vựng nếu đã biết (tùy chọn)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_dictionary_word",
      description:
        "Tra cứu thông tin từ điển chính thức của Vocabee (phiên âm IPA chuẩn, nghĩa, từ loại, định nghĩa tiếng Anh/Việt, ví dụ và từ đồng nghĩa). Dùng khi giải thích từ vựng, phân biệt từ gần nghĩa, collocations hoặc khi từ vựng chưa có trong kho cá nhân.",
      parameters: {
        type: "object",
        properties: {
          word: {
            type: "string",
            description: "Từ tiếng Anh cần tra cứu từ điển",
          },
        },
        required: ["word"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_duplicate_vocabularies",
      description:
        "Quét toàn bộ kho từ vựng của người dùng hoặc trong một bộ từ cụ thể để tìm các từ bị trùng lặp (xuất hiện nhiều hơn 1 lần).",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID bộ từ cần quét trùng lặp (để trống nếu muốn quét toàn bộ kho từ)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vocabularies_by_cefr",
      description:
        "Liệt kê các từ vựng theo cấp độ CEFR (A1, A2, B1, B2, C1, C2), có thể giới hạn trong một bộ từ cụ thể.",
      parameters: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
            description: "Cấp độ CEFR cần lấy",
          },
          set_id: {
            type: "string",
            description: "ID của bộ từ (tùy chọn)",
          },
          set_name: {
            type: "string",
            description: "Tên của bộ từ (tùy chọn)",
          },
        },
        required: ["level"],
      },
    },
  },

  // ==========================================
  // LEARNING PROGRESS QUERIES
  // ==========================================
  {
    type: "function",
    function: {
      name: "get_learning_progress",
      description:
        "Lấy số liệu tiến trình học tập tổng thể của người dùng: số từ đã thuộc (mastered), đang học (learning), chưa học (new), số từ cần ôn hôm nay (dueToday), quá hạn (overdue), chuỗi ngày học streak hiện tại, kỷ lục streak và mục tiêu hàng ngày.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_review_schedule",
      description:
        "Lấy lịch ôn tập SRS tổng quan: số từ cần ôn hôm nay, số từ quá hạn, dự báo số lượng từ cần ôn trong các ngày tới, kèm tổng hợp phân bố theo từng bộ từ. Lưu ý: danh sách sample_words_preview trong tool này chỉ là mẫu 15 từ minh họa, TUYỆT ĐỐI KHÔNG dùng để kết luận toàn bộ tài khoản.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Số ngày dự báo phía trước (mặc định 7)",
          },
          set_id: {
            type: "string",
            description: "Giới hạn lịch ôn cho một bộ từ cụ thể (tùy chọn)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_srs_sets_distribution",
      description:
        "Phân tích ĐẦY ĐỦ 100% dữ liệu SRS: thống kê chính xác các từ đến hạn ôn tập và quá hạn thuộc về những bộ từ vựng nào trên toàn tài khoản. BẮT BUỘC sử dụng tool này khi người dùng hỏi các từ đến hạn/cần ôn thuộc bộ từ nào. Trả về bảng phân bố chi tiết theo từng bộ từ (số từ đến hạn, số từ quá hạn, tỉ lệ %, danh sách từ mẫu của từng bộ, số từ chưa gắn bộ) và tổng số từ duy nhất trên toàn tài khoản để tránh nhầm lẫn hoặc kết luận vội vàng từ dữ liệu mẫu.",
      parameters: {
        type: "object",
        properties: {
          include_sample_words_per_set: {
            type: "boolean",
            description: "Có kèm theo danh sách từ mẫu minh họa cho từng bộ từ không (mặc định true)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_learning_history",
      description:
        "Lấy lịch sử học tập cá nhân: số từ đã học trong ngày, tuần này hoặc tháng này; tổng thời gian học; tổng số câu hỏi đã làm và tỷ lệ chính xác.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["today", "week", "month", "all"],
            description: "Khoảng thời gian cần thống kê: 'today' (hôm nay), 'week' (tuần này), 'month' (tháng này), 'all' (toàn bộ)",
          },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_frequently_incorrect_words",
      description:
        "Lấy danh sách các từ vựng mà người dùng thường xuyên trả lời sai nhất trong các bài tập ôn tập, bài kiểm tra thích ứng (adaptive) hoặc flashcard.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Số lượng từ cần lấy (mặc định 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sets_learning_comparison",
      description:
        "So sánh tiến độ học tập giữa các bộ từ của người dùng: tìm bộ từ có nhiều từ chưa học nhất, bộ từ có tỷ lệ chính xác thấp nhất hoặc cao nhất, bộ từ có nhiều từ đã thuộc nhất.",
      parameters: {
        type: "object",
        properties: {
          criterion: {
            type: "string",
            enum: ["most_unlearned", "lowest_accuracy", "highest_mastery", "all"],
            description: "Tiêu chí so sánh: 'most_unlearned' (nhiều từ chưa học nhất), 'lowest_accuracy' (tỷ lệ chính xác thấp nhất), 'highest_mastery' (đạt chuẩn thuộc nhiều nhất), 'all' (tổng hợp)",
          },
        },
        required: ["criterion"],
      },
    },
  },

  // ==========================================
  // ACTION TOOLS (SAFE WRITES)
  // ==========================================
  {
    type: "function",
    function: {
      name: "create_vocab_set",
      description:
        "Tạo một bộ từ vựng mới cho người dùng. Thao tác này an toàn và có thể thực hiện ngay khi người dùng yêu cầu.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Tên bộ từ vựng mới",
          },
          description: {
            type: "string",
            description: "Mô tả ngắn gọn về bộ từ (tùy chọn)",
          },
          source_language: {
            type: "string",
            description: "Ngôn ngữ nguồn (mặc định 'en')",
          },
          target_language: {
            type: "string",
            description: "Ngôn ngữ đích (mặc định 'vi')",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_vocab_set",
      description:
        "Đổi tên hoặc cập nhật mô tả của một bộ từ vựng hiện có của người dùng.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID của bộ từ (nếu đã biết)",
          },
          current_title: {
            type: "string",
            description: "Tên hiện tại của bộ từ (nếu chưa biết ID)",
          },
          new_title: {
            type: "string",
            description: "Tên mới cần đổi",
          },
          new_description: {
            type: "string",
            description: "Mô tả mới (tùy chọn)",
          },
        },
        required: ["new_title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_vocabulary",
      description:
        "Thêm một từ vựng mới vào một bộ từ cụ thể của người dùng. Tự động kiểm tra trùng lặp trước khi thêm.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID bộ từ mục tiêu (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ mục tiêu (nếu chưa biết ID)",
          },
          word: {
            type: "string",
            description: "Từ tiếng Anh",
          },
          meaning: {
            type: "string",
            description: "Nghĩa tiếng Việt",
          },
          ipa: {
            type: "string",
            description: "Phiên âm IPA (ví dụ: '/rɪˈzɪliənt/')",
          },
          part_of_speech: {
            type: "string",
            description: "Từ loại (noun, verb, adjective, adverb,...)",
          },
          example: {
            type: "string",
            description: "Câu ví dụ tiếng Anh",
          },
          example_translation: {
            type: "string",
            description: "Bản dịch tiếng Việt của câu ví dụ",
          },
          difficulty: {
            type: "string",
            enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
            description: "Cấp độ CEFR (tùy chọn)",
          },
          note: {
            type: "string",
            description: "Ghi chú thêm (tùy chọn)",
          },
        },
        required: ["word", "meaning"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_add_vocabulary",
      description:
        "Thêm danh sách nhiều từ vựng cùng lúc vào một bộ từ. Kiểm tra và loại bỏ các từ bị trùng lặp trong bộ từ đó.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID bộ từ mục tiêu (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ mục tiêu (nếu chưa biết ID)",
          },
          words: {
            type: "array",
            description: "Danh sách các từ vựng cần thêm",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                meaning: { type: "string" },
                ipa: { type: "string" },
                part_of_speech: { type: "string" },
                example: { type: "string" },
                example_translation: { type: "string" },
                difficulty: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
                note: { type: "string" },
              },
              required: ["word", "meaning"],
            },
          },
        },
        required: ["words"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_vocabulary",
      description:
        "Chỉnh sửa thông tin của một từ vựng đã tồn tại trong bộ từ của người dùng (sửa nghĩa, phiên âm, từ loại, ví dụ, ghi chú,...).",
      parameters: {
        type: "object",
        properties: {
          vocabulary_id: {
            type: "string",
            description: "ID của từ vựng cần sửa (nếu đã biết)",
          },
          word: {
            type: "string",
            description: "Từ tiếng Anh cần sửa (nếu chưa biết ID)",
          },
          set_id: {
            type: "string",
            description: "ID bộ từ chứa từ này (tùy chọn để xác định chính xác)",
          },
          updates: {
            type: "object",
            properties: {
              meaning: { type: "string", description: "Nghĩa tiếng Việt mới" },
              ipa: { type: "string", description: "Phiên âm mới" },
              part_of_speech: { type: "string", description: "Từ loại mới" },
              example: { type: "string", description: "Ví dụ mới" },
              example_translation: { type: "string", description: "Bản dịch ví dụ mới" },
              difficulty: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
              note: { type: "string", description: "Ghi chú mới" },
            },
            required: [],
          },
        },
        required: ["updates"],
      },
    },
  },

  // ==========================================
  // DESTRUCTIVE ACTION TOOLS (CONFIRMATION REQUIRED)
  // ==========================================
  {
    type: "function",
    function: {
      name: "delete_vocab_set",
      description:
        "Yêu cầu xóa một bộ từ vựng của người dùng. LƯU Ý: Đây là thao tác phá hủy dữ liệu. Tool này KHÔNG xóa ngay mà sẽ kiểm tra đối tượng, kiểm tra quyền sở hữu và tạo bản xem trước xác nhận (Confirmation Card) để người dùng bấm nút Xác nhận.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID của bộ từ cần xóa (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ cần xóa (nếu chưa biết ID)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_vocabulary",
      description:
        "Yêu cầu xóa một từ vựng cụ thể khỏi bộ từ của người dùng. LƯU Ý: Đây là thao tác phá hủy dữ liệu. Tool này sẽ kiểm tra quyền sở hữu và tạo bản xem trước xác nhận để người dùng bấm nút Xác nhận.",
      parameters: {
        type: "object",
        properties: {
          vocabulary_id: {
            type: "string",
            description: "ID của từ vựng cần xóa (nếu đã biết)",
          },
          word: {
            type: "string",
            description: "Từ tiếng Anh cần xóa (nếu chưa biết ID)",
          },
          set_id: {
            type: "string",
            description: "ID bộ từ chứa từ này (tùy chọn)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reset_vocab_set_progress",
      description:
        "Yêu cầu reset tiến trình học tập (cấp độ SRS, số lần ôn, ngày ôn) của tất cả từ vựng trong một bộ từ về trạng thái 'mới chưa học'. Danh sách các từ vựng vẫn được GIỮ NGUYÊN. Yêu cầu xác nhận trước khi thực hiện.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID của bộ từ cần reset tiến trình (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ cần reset tiến trình (nếu chưa biết ID)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_vocab_set_learning_history",
      description:
        "Yêu cầu xóa toàn bộ lịch sử các phiên học (learning sessions) và bài kiểm tra liên quan đến một bộ từ. Bộ từ và danh sách từ vựng vẫn được GIỮ NGUYÊN. Yêu cầu xác nhận trước khi thực hiện.",
      parameters: {
        type: "object",
        properties: {
          set_id: {
            type: "string",
            description: "ID của bộ từ cần xóa lịch sử học (nếu đã biết)",
          },
          set_name: {
            type: "string",
            description: "Tên bộ từ cần xóa lịch sử học (nếu chưa biết ID)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reset_single_vocabulary_progress",
      description:
        "Yêu cầu reset tiến trình học tập của một từ vựng duy nhất về trạng thái chưa học. Từ vựng không bị xóa khỏi bộ từ. Yêu cầu xác nhận trước khi thực hiện.",
      parameters: {
        type: "object",
        properties: {
          vocabulary_id: {
            type: "string",
            description: "ID của từ vựng cần reset (nếu đã biết)",
          },
          word: {
            type: "string",
            description: "Từ tiếng Anh cần reset (nếu chưa biết ID)",
          },
        },
        required: [],
      },
    },
  },
];
