// src/lib/ai/agent/tools/index.ts
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import {
  handleCountVocabularySets,
  handleCountVocabularyWords,
  handleGetDueReviews,
  handleGetLearningOverview,
  handleGetLearningStatistics,
  handleGetOverdueReviews,
  handleGetRecentLearningActivity,
  handleGetReviewStatistics,
  handleGetSetLearningStatistics,
  handleGetSrsOverview,
  handleGetVocabularySet,
  handleGetVocabularyWord,
  handleGetWordMasteryStatistics,
  handleGetWordsNeedingAttention,
  handleListVocabularySets,
  handleListVocabularyWords,
  handleSearchVocabularySets,
  handleSearchVocabularyWords,
} from "./phase1-read";
import {
  handlePrepareBulkCreateVocabularyWords,
  handlePrepareBulkUpdateVocabularyWords,
  handlePrepareCreateVocabularySet,
  handlePrepareCreateVocabularyWord,
  handlePrepareDeleteVocabularySet,
  handlePrepareDeleteVocabularyWord,
  handlePrepareUpdateVocabularySet,
  handlePrepareUpdateVocabularyWord,
} from "./phase2-write";
import {
  handleAnalyzeLearningPatterns,
  handleGeneratePracticeExercise,
  handleGetPersonalizedRecommendations,
  handlePrepareSavePersonalTest,
} from "./phase3-intelligence";
import {
  createToolExecutionContext,
  runWithToolExecutionContext,
  type ToolExecutionContext,
  type ToolExecutionOutput,
} from "./shared";

const MAX_SERIALIZED_RESULT_CHARS = 18000;

export const READ_ONLY_TOOL_NAMES = new Set<string>([
  "list_vocabulary_sets",
  "get_vocabulary_set",
  "search_vocabulary_sets",
  "count_vocabulary_sets",
  "list_vocabulary_words",
  "get_vocabulary_word",
  "search_vocabulary_words",
  "count_vocabulary_words",
  "get_learning_overview",
  "get_learning_statistics",
  "get_set_learning_statistics",
  "get_word_mastery_statistics",
  "get_recent_learning_activity",
  "get_srs_overview",
  "get_due_reviews",
  "get_overdue_reviews",
  "get_review_statistics",
  "get_words_needing_attention",
  "analyze_learning_patterns",
  "get_personalized_recommendations",
  "generate_practice_exercise",
]);

export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  list_vocabulary_sets: "Đang tải danh sách bộ từ...",
  get_vocabulary_set: "Đang xem chi tiết bộ từ...",
  search_vocabulary_sets: "Đang tìm kiếm bộ từ vựng...",
  count_vocabulary_sets: "Đang thống kê số bộ từ...",
  list_vocabulary_words: "Đang lọc danh sách từ vựng...",
  get_vocabulary_word: "Đang tra cứu chi tiết từ vựng...",
  search_vocabulary_words: "Đang tìm kiếm từ vựng...",
  count_vocabulary_words: "Đang đếm từ vựng của bạn...",
  get_learning_overview: "Đang phân tích dữ liệu học tập...",
  get_learning_statistics: "Đang tổng hợp thống kê học tập...",
  get_set_learning_statistics: "Đang so sánh tiến độ các bộ từ...",
  get_word_mastery_statistics: "Đang kiểm tra mức độ thành thạo...",
  get_recent_learning_activity: "Đang xem lịch sử học gần đây...",
  get_srs_overview: "Đang kiểm tra lịch ôn tập SRS...",
  get_due_reviews: "Đang tải các từ cần ôn hôm nay...",
  get_overdue_reviews: "Đang kiểm tra các từ quá hạn...",
  get_review_statistics: "Đang tổng hợp lịch sử ôn tập...",
  get_words_needing_attention: "Đang phân tích các từ thường sai...",
  create_vocabulary_set: "Đang chuẩn bị tạo bộ từ mới...",
  update_vocabulary_set: "Đang chuẩn bị cập nhật bộ từ...",
  delete_vocabulary_set: "Đang chuẩn bị xác nhận xóa bộ từ...",
  create_vocabulary_word: "Đang chuẩn bị thêm từ vựng...",
  update_vocabulary_word: "Đang chuẩn bị cập nhật từ vựng...",
  delete_vocabulary_word: "Đang chuẩn bị xác nhận xóa từ...",
  bulk_create_vocabulary_words: "Đang chuẩn bị thêm nhiều từ vựng...",
  bulk_update_vocabulary_words: "Đang chuẩn bị cập nhật nhiều từ...",
  analyze_learning_patterns: "Đang phân tích xu hướng học tập...",
  get_personalized_recommendations: "Đang tạo gợi ý ôn tập cá nhân hóa...",
  generate_practice_exercise: "Đang tạo bài luyện tập từ kho từ...",
  save_personal_test: "Đang chuẩn bị lưu bài kiểm tra...",
};

export const AGENT_TOOLS: ChatCompletionTool[] = [
  // Phase 1: Vocabulary Sets
  {
    type: "function",
    function: {
      name: "list_vocabulary_sets",
      description: "List current user's active vocabulary sets with word counts, mastery rate, and pagination.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "integer", description: "Page number (1-based)" },
          limit: { type: "integer", description: "Items per page (1-50)" },
          sort: { type: "string", enum: ["updated_desc", "title_asc", "words_desc", "mastery_desc"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vocabulary_set",
      description: "Get details and paginated words of a specific vocabulary set owned by the user.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          set_title: { type: "string" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_vocabulary_sets",
      description: "Search user's vocabulary sets by title or description.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_vocabulary_sets",
      description: "Count total active vocabulary sets belonging to the user.",
      parameters: { type: "object", properties: {} },
    },
  },

  // Phase 1: Vocabulary Words
  {
    type: "function",
    function: {
      name: "list_vocabulary_words",
      description: "List/filter user's vocabulary words by set, difficulty, part of speech, starred, or mastery group.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          difficulty: { type: "string" },
          part_of_speech: { type: "string" },
          starred_only: { type: "boolean" },
          mastery_group: { type: "string", enum: ["new", "learning", "learned", "mastered"] },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_vocabulary_word",
      description: "Retrieve full details (IPA, meaning, examples, synonyms, SRS status) of a word in user's sets.",
      parameters: {
        type: "object",
        properties: {
          word_id: { type: "string" },
          word: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_vocabulary_words",
      description: "Search user's vocabulary words by English term, meaning, or note.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          set_id: { type: "string" },
          difficulty: { type: "string" },
          part_of_speech: { type: "string" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_vocabulary_words",
      description: "Accurately count total word records and unique normalized words (account-wide or in a set).",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
        },
      },
    },
  },

  // Phase 1: Learning Progress
  {
    type: "function",
    function: {
      name: "get_learning_overview",
      description: "Get account-wide learning overview: total sets, word counts, mastery breakdown, due reviews, streak, daily goal.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_learning_statistics",
      description: "Get learning activity statistics over the past N days (study minutes, quizzes, sentence practice, difficulty breakdown).",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "Lookback window in days (1-90)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_set_learning_statistics",
      description: "Get per-set mastery rates and word breakdowns to compare vocabulary sets.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_word_mastery_statistics",
      description: "Get exact breakdown of words by SRS level (lv0..lv5), difficulty, and starred count.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_learning_activity",
      description: "Get recent study sessions, quiz history, sentence practice, and adaptive learning sessions.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer" },
        },
      },
    },
  },

  // Phase 1: SRS
  {
    type: "function",
    function: {
      name: "get_srs_overview",
      description: "Get SRS review overview: due today, overdue count, level distribution, and 7-day forecast.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_due_reviews",
      description: "Get paginated list of vocabulary words due for SRS review today.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overdue_reviews",
      description: "Get paginated list of overdue SRS review words.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_review_statistics",
      description: "Get aggregate SRS review statistics (last grade distribution, average ease factor and interval).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_words_needing_attention",
      description: "Identify words the user frequently gets wrong, rated again/hard, or left overdue.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer" },
          set_id: { type: "string" },
        },
      },
    },
  },

  // Phase 2: Controlled Write Operations (Preview + UI Confirmation)
  {
    type: "function",
    function: {
      name: "create_vocabulary_set",
      description: "Prepare a preview & confirmation to create a new vocabulary set (with optional initial words).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          source_language: { type: "string" },
          target_language: { type: "string" },
          visibility: { type: "string", enum: ["private", "unlisted", "public"] },
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                meaning: { type: "string" },
                ipa: { type: "string" },
                part_of_speech: { type: "string" },
                example: { type: "string" },
                example_translation: { type: "string" },
                synonyms: { type: "array", items: { type: "string" } },
                antonyms: { type: "array", items: { type: "string" } },
                note: { type: "string" },
                difficulty: { type: "string" },
              },
              required: ["word", "meaning"],
            },
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_vocabulary_set",
      description: "Prepare a preview & confirmation to rename or update metadata of a vocabulary set.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          current_title: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          visibility: { type: "string", enum: ["private", "unlisted", "public"] },
          source_language: { type: "string" },
          target_language: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_vocabulary_set",
      description: "Prepare a destructive preview & confirmation to delete a user's vocabulary set.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          set_title: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_vocabulary_word",
      description: "Prepare a preview & confirmation to add a word to a target vocabulary set (checks duplicates).",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          set_title: { type: "string" },
          word: { type: "string" },
          meaning: { type: "string" },
          ipa: { type: "string" },
          part_of_speech: { type: "string" },
          example: { type: "string" },
          example_translation: { type: "string" },
          synonyms: { type: "array", items: { type: "string" } },
          antonyms: { type: "array", items: { type: "string" } },
          note: { type: "string" },
          difficulty: { type: "string" },
        },
        required: ["word", "meaning"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_vocabulary_word",
      description: "Prepare a preview & confirmation to update an existing vocabulary word's fields.",
      parameters: {
        type: "object",
        properties: {
          word_id: { type: "string" },
          word: { type: "string" },
          set_id: { type: "string" },
          updates: {
            type: "object",
            properties: {
              word: { type: "string" },
              meaning: { type: "string" },
              ipa: { type: "string" },
              part_of_speech: { type: "string" },
              example: { type: "string" },
              example_translation: { type: "string" },
              synonyms: { type: "array", items: { type: "string" } },
              antonyms: { type: "array", items: { type: "string" } },
              note: { type: "string" },
              difficulty: { type: "string" },
              is_starred: { type: "boolean" },
            },
          },
        },
        required: ["updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_vocabulary_word",
      description: "Prepare a destructive preview & confirmation to remove a vocabulary word from a set.",
      parameters: {
        type: "object",
        properties: {
          word_id: { type: "string" },
          word: { type: "string" },
          set_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_create_vocabulary_words",
      description: "Prepare a preview & confirmation to add multiple words to a set while skipping duplicates.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          set_title: { type: "string" },
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                meaning: { type: "string" },
                ipa: { type: "string" },
                part_of_speech: { type: "string" },
                example: { type: "string" },
                example_translation: { type: "string" },
                synonyms: { type: "array", items: { type: "string" } },
                note: { type: "string" },
                difficulty: { type: "string" },
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
      name: "bulk_update_vocabulary_words",
      description: "Prepare a preview & confirmation to update multiple vocabulary words owned by the user.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word_id: { type: "string" },
                meaning: { type: "string" },
                ipa: { type: "string" },
                part_of_speech: { type: "string" },
                example: { type: "string" },
                note: { type: "string" },
                difficulty: { type: "string" },
                is_starred: { type: "boolean" },
              },
              required: ["word_id"],
            },
          },
        },
        required: ["items"],
      },
    },
  },

  // Phase 3: Learning Intelligence & Personalized Exercises
  {
    type: "function",
    function: {
      name: "analyze_learning_patterns",
      description: "Analyze user's real mastery, study frequency, weak words, and set progress over N days.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personalized_recommendations",
      description: "Recommend review words, words to relearn, and priority sets grounded in Vocabee's SRS engine.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_practice_exercise",
      description: "Generate interactive practice questions from the user's real vocabulary without altering SRS.",
      parameters: {
        type: "object",
        properties: {
          set_id: { type: "string" },
          set_title: { type: "string" },
          focus: { type: "string", enum: ["all", "weak", "due", "unlearned"] },
          exercise_type: {
            type: "string",
            enum: [
              "mcq",
              "contextual_mcq",
              "fill_in_blank",
              "sentence_completion",
              "synonym_selection",
              "word_formation",
              "cloze_test",
            ],
          },
          count: { type: "integer" },
          word_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_personal_test",
      description: "Prepare a preview & confirmation to save a 4-part Vocabee Personal Test from real user words.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          set_id: { type: "string" },
          set_title: { type: "string" },
          word_ids: { type: "array", items: { type: "string" } },
          max_words: { type: "integer" },
        },
        required: ["title"],
      },
    },
  },
];

function capResultSize(data: unknown): { payload: unknown; truncated: boolean } {
  const serialized = JSON.stringify(data);
  if (!serialized || serialized.length <= MAX_SERIALIZED_RESULT_CHARS) {
    return { payload: data, truncated: false };
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = { ...(data as Record<string, unknown>) };
    for (const key of ["words", "sets", "items", "questions", "weakWords", "records"]) {
      if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 10) {
        obj[key] = (obj[key] as unknown[]).slice(0, 10);
        obj._truncatedNote =
          "Kết quả chi tiết đã được rút gọn để đảm bảo giới hạn kích thước; các con số tổng hợp vẫn giữ nguyên chính xác.";
        return { payload: obj, truncated: true };
      }
    }
  }

  return {
    payload: {
      _truncatedNote: "Dữ liệu quá lớn nên đã được rút gọn.",
      preview: serialized.slice(0, MAX_SERIALIZED_RESULT_CHARS),
    },
    truncated: true,
  };
}

export class AgentToolExecutor {
  private readonly ctx: ToolExecutionContext;

  constructor(private readonly userId: string) {
    this.ctx = createToolExecutionContext(userId);
  }

  getContext(): ToolExecutionContext {
    return this.ctx;
  }

  async execute(toolName: string, rawArgs: Record<string, unknown>): Promise<ToolExecutionOutput> {
    return runWithToolExecutionContext(this.ctx, async () => {
    // Defense in depth: strip any user-provided user_id / owner_id so the model can never spoof identity
    const safeArgs = { ...rawArgs };
    delete safeArgs.user_id;
    delete safeArgs.userId;
    delete safeArgs.owner_id;
    delete safeArgs.ownerId;

    let result: ToolExecutionOutput;

    switch (toolName) {
      case "list_vocabulary_sets":
        result = await handleListVocabularySets(this.userId, safeArgs);
        break;
      case "get_vocabulary_set":
        result = await handleGetVocabularySet(this.userId, safeArgs);
        break;
      case "search_vocabulary_sets":
        result = await handleSearchVocabularySets(this.userId, safeArgs);
        break;
      case "count_vocabulary_sets":
        result = await handleCountVocabularySets(this.userId);
        break;
      case "list_vocabulary_words":
        result = await handleListVocabularyWords(this.userId, safeArgs);
        break;
      case "get_vocabulary_word":
        result = await handleGetVocabularyWord(this.userId, safeArgs);
        break;
      case "search_vocabulary_words":
        result = await handleSearchVocabularyWords(this.userId, safeArgs);
        break;
      case "count_vocabulary_words":
        result = await handleCountVocabularyWords(this.userId, safeArgs);
        break;
      case "get_learning_overview":
        result = await handleGetLearningOverview(this.userId);
        break;
      case "get_learning_statistics":
        result = await handleGetLearningStatistics(this.userId, safeArgs);
        break;
      case "get_set_learning_statistics":
        result = await handleGetSetLearningStatistics(this.userId, safeArgs);
        break;
      case "get_word_mastery_statistics":
        result = await handleGetWordMasteryStatistics(this.userId);
        break;
      case "get_recent_learning_activity":
        result = await handleGetRecentLearningActivity(this.userId, safeArgs);
        break;
      case "get_srs_overview":
        result = await handleGetSrsOverview(this.userId);
        break;
      case "get_due_reviews":
        result = await handleGetDueReviews(this.userId, safeArgs);
        break;
      case "get_overdue_reviews":
        result = await handleGetOverdueReviews(this.userId, safeArgs);
        break;
      case "get_review_statistics":
        result = await handleGetReviewStatistics(this.userId);
        break;
      case "get_words_needing_attention":
        result = await handleGetWordsNeedingAttention(this.userId, safeArgs);
        break;
      case "create_vocabulary_set":
        result = await handlePrepareCreateVocabularySet(this.userId, safeArgs);
        break;
      case "update_vocabulary_set":
        result = await handlePrepareUpdateVocabularySet(this.userId, safeArgs);
        break;
      case "delete_vocabulary_set":
        result = await handlePrepareDeleteVocabularySet(this.userId, safeArgs);
        break;
      case "create_vocabulary_word":
        result = await handlePrepareCreateVocabularyWord(this.userId, safeArgs);
        break;
      case "update_vocabulary_word":
        result = await handlePrepareUpdateVocabularyWord(this.userId, safeArgs);
        break;
      case "delete_vocabulary_word":
        result = await handlePrepareDeleteVocabularyWord(this.userId, safeArgs);
        break;
      case "bulk_create_vocabulary_words":
        result = await handlePrepareBulkCreateVocabularyWords(this.userId, safeArgs);
        break;
      case "bulk_update_vocabulary_words":
        result = await handlePrepareBulkUpdateVocabularyWords(this.userId, safeArgs);
        break;
      case "analyze_learning_patterns":
        result = await handleAnalyzeLearningPatterns(this.userId, safeArgs);
        break;
      case "get_personalized_recommendations":
        result = await handleGetPersonalizedRecommendations(this.userId);
        break;
      case "generate_practice_exercise":
        result = await handleGeneratePracticeExercise(this.userId, safeArgs);
        break;
      case "save_personal_test":
        result = await handlePrepareSavePersonalTest(this.userId, safeArgs);
        break;
      default:
        return {
          data: null,
          summary: `Công cụ "${toolName}" không được hỗ trợ.`,
          error: `Unsupported tool: ${toolName}`,
        };
    }

    const capped = capResultSize(result.data);
    return {
      ...result,
      data: capped.payload,
    };
    });
  }
}
