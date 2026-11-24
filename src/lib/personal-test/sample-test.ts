import { VocabeeTest } from "@/types/vocabee-test";

export const SAMPLE_VOCABEE_TEST: VocabeeTest = {
  schema: "vocabee-test-v1",
  title: "Academic Vocabulary Mastery - Set 1 & 2",
  total_words: 6,
  total_sets: 2,
  sets: [
    {
      id: "set_1",
      label: "Set 1: Problem Solving & Innovation",
      words: ["mitigate", "pioneer", "scrutinize"],
      exercises: [
        {
          type: "matching",
          items: [
            {
              id: 1,
              word: "mitigate",
              definition: "To make something less severe, harmful, or painful",
              explanation: "mitigate có nghĩa là giảm nhẹ mức độ nghiêm trọng hoặc tác động tiêu cực của một vấn đề.",
            },
            {
              id: 2,
              word: "pioneer",
              definition: "To be the first to develop or use a new method or idea",
              explanation: "pioneer có nghĩa là tiên phong, mở đường cho một hướng đi hay phát kiến mới.",
            },
            {
              id: 3,
              word: "scrutinize",
              definition: "To examine or inspect someone or something very closely and carefully",
              explanation: "scrutinize có nghĩa là xem xét, kiểm tra kỹ lưỡng từng chi tiết.",
            },
          ],
        },
        {
          type: "sentence_completion",
          word_bank: ["mitigate", "pioneer", "scrutinize", "accelerate"],
          items: [
            {
              id: 1,
              sentence: "The government implemented new safety regulations to ___ flood damage.",
              answer: "mitigate",
              explanation: "Điền 'mitigate' vì câu nói về việc giảm nhẹ thiệt hại do lũ lụt.",
            },
            {
              id: 2,
              sentence: "Auditors arrived unexpectedly to ___ the financial statements.",
              answer: "scrutinize",
              explanation: "Điền 'scrutinize' vì kiểm toán viên kiểm tra kỹ lưỡng các báo cáo tài chính.",
            },
            {
              id: 3,
              sentence: "Dr. Marie decided to ___ research in renewable geothermal power.",
              answer: "pioneer",
              explanation: "Điền 'pioneer' vì nói về việc đi tiên phong nghiên cứu một lĩnh vực mới.",
            },
          ],
        },
        {
          type: "synonyms_matching",
          items: [
            {
              id: 1,
              word: "mitigate",
              synonyms: ["alleviate", "lessen"],
              explanation: "mitigate đồng nghĩa với alleviate và lessen (giảm thiểu, làm dịu bớt).",
            },
            {
              id: 2,
              word: "pioneer",
              synonyms: ["innovate"],
              explanation: "pioneer đồng nghĩa với innovate (tiên phong, đổi mới).",
            },
            {
              id: 3,
              word: "scrutinize",
              synonyms: ["inspect", "examine"],
              explanation: "scrutinize đồng nghĩa với inspect và examine (thanh tra, khảo sát kỹ).",
            },
          ],
        },
        {
          type: "cloze_test",
          word_bank: ["mitigate", "pioneer", "scrutinize"],
          passage:
            "In recent years, tech enterprises have strived to ___(1)___ greener algorithms. When regulators ___(2)___ their environmental impact, effective measures are needed to ___(3)___ energy consumption.",
          answers: [
            {
              id: 1,
              answer: "pioneer",
              explanation: "Vị trí (1) cần động từ nguyên mẫu sau 'strived to', diễn tả hành động đi đầu phát triển thuật toán xanh ('pioneer').",
            },
            {
              id: 2,
              answer: "scrutinize",
              explanation: "Vị trí (2) mang nghĩa cơ quan quản lý soi xét, kiểm tra chặt chẽ ('scrutinize').",
            },
            {
              id: 3,
              answer: "mitigate",
              explanation: "Vị trí (3) nói về việc giảm thiểu mức tiêu thụ năng lượng ('mitigate').",
            },
          ],
        },
      ],
    },
    {
      id: "set_2",
      label: "Set 2: Discourse & Evaluation",
      words: ["articulate", "bolster", "substantiate"],
      exercises: [
        {
          type: "matching",
          items: [
            {
              id: 1,
              word: "articulate",
              definition: "To express an idea clearly and fluently in words",
              explanation: "articulate: diễn đạt rõ ràng, gãy gọn bằng lời nói hoặc văn bản.",
            },
            {
              id: 2,
              word: "bolster",
              definition: "To support, strengthen, or fortify something",
              explanation: "bolster: củng cố, tăng cường sức mạnh hoặc sự tự tin.",
            },
            {
              id: 3,
              word: "substantiate",
              definition: "To provide evidence to prove the truth of something",
              explanation: "substantiate: chứng minh, xác minh bằng chứng cứ cụ thể.",
            },
          ],
        },
        {
          type: "sentence_completion",
          word_bank: ["articulate", "bolster", "substantiate", "disprove"],
          items: [
            {
              id: 1,
              sentence: "The candidate was able to ___ her vision with remarkable clarity.",
              answer: "articulate",
              explanation: "Dùng 'articulate' để diễn đạt việc trình bày tầm nhìn một cách lưu loát, rõ ràng.",
            },
            {
              id: 2,
              sentence: "Extra training sessions helped ___ the team's morale before the finals.",
              answer: "bolster",
              explanation: "Dùng 'bolster' mang nghĩa nâng cao, củng cố tinh thần.",
            },
            {
              id: 3,
              sentence: "He failed to ___ his allegations with any verified facts.",
              answer: "substantiate",
              explanation: "Dùng 'substantiate' vì câu nói về việc không thể đưa ra bằng chứng xác minh lời cáo buộc.",
            },
          ],
        },
        {
          type: "synonyms_matching",
          items: [
            {
              id: 1,
              word: "articulate",
              synonyms: ["express", "enunciate"],
              explanation: "articulate đồng nghĩa với express và enunciate (phát biểu rõ ràng).",
            },
            {
              id: 2,
              word: "bolster",
              synonyms: ["reinforce", "strengthen"],
              explanation: "bolster đồng nghĩa với reinforce và strengthen (củng cố, trợ lực).",
            },
            {
              id: 3,
              word: "substantiate",
              synonyms: ["verify", "corroborate"],
              explanation: "substantiate đồng nghĩa với verify và corroborate (xác thực, chứng minh).",
            },
          ],
        },
        {
          type: "cloze_test",
          word_bank: ["articulate", "bolster", "substantiate"],
          passage:
            "During the academic debate, the speaker managed to ___(1)___ complex ideas convincingly. She cited empirical studies to ___(2)___ her primary hypothesis, which helped ___(3)___ her credibility.",
          answers: [
            {
              id: 1,
              answer: "articulate",
              explanation: "Vị trí (1) cần động từ diễn đạt ý tưởng phức tạp ('articulate').",
            },
            {
              id: 2,
              answer: "substantiate",
              explanation: "Vị trí (2) mang nghĩa dẫn chứng nghiên cứu thực nghiệm để chứng minh giả thuyết ('substantiate').",
            },
            {
              id: 3,
              answer: "bolster",
              explanation: "Vị trí (3) mang nghĩa củng cố uy tín ('bolster').",
            },
          ],
        },
      ],
    },
  ],
};
