import type { ComprehensionQuestion } from "@/components/features/reading/reading-types";

export const DEFAULT_READING_QUESTIONS: Record<string, ComprehensionQuestion[]> = {
  "the-rise-of-smart-cities": [
    {
      id: "sc-q1",
      question: "What is the primary purpose of adding sensors and connected traffic systems in cities?",
      options: [
        "To increase traffic fines for drivers",
        "To help planners understand congestion, energy use, and transit patterns in real time",
        "To completely replace public transportation drivers",
        "To limit the movement of residents between neighborhoods",
      ],
      correctAnswer: 1,
      explanation: "Đoạn 1 nêu rõ các công cụ này giúp các nhà quy hoạch nắm bắt tình trạng tắc nghẽn, mức tiêu thụ năng lượng và lưu lượng giao thông công cộng theo thời gian thực.",
      paragraphRef: "Paragraph 1",
    },
    {
      id: "sc-q2",
      question: "How do residents usually experience smart city changes in the beginning?",
      options: [
        "Through drastic and disruptive overnight transformations",
        "Through mandatory fees and new surveillance regulations",
        "Through small, everyday conveniences like predictable bus schedules and automated lights",
        "Through immediate elimination of all road traffic",
      ],
      correctAnswer: 2,
      explanation: "Đoạn 2 chỉ ra rằng sự thay đổi ban đầu thường rất nhỏ: xe buýt đến đúng giờ hơn, đèn đường tự điều chỉnh hoặc ứng dụng thanh toán giúp giảm thời gian chờ.",
      paragraphRef: "Paragraph 2",
    },
    {
      id: "sc-q3",
      question: "According to the passage, which of the following is a major challenge for smart city initiatives?",
      options: [
        "A lack of interested tech companies",
        "High costs, privacy protection, and ensuring benefits reach all neighborhoods",
        "Smart city technology is already completely flawless",
        "Citizens prefer manual traffic systems without technology",
      ],
      correctAnswer: 1,
      explanation: "Đoạn 3 nhấn mạnh các dự án thành phố thông minh có thể tốn kém, cần bảo vệ quyền riêng tư và đảm bảo công nghệ phục vụ mọi người chứ không chỉ khu vực phát triển nhất.",
      paragraphRef: "Paragraph 3",
    },
    {
      id: "sc-q4",
      question: "What will the future of urban life likely depend on according to the author?",
      options: [
        "Building larger motorways in every city center",
        "How well people balance technological innovation with social fairness",
        "Completely automating all city administrative jobs",
        "Stopping any further sensor deployments in residential areas",
      ],
      correctAnswer: 1,
      explanation: "Đoạn cuối kết luận rằng tương lai đời sống thành thị sẽ phụ thuộc vào việc con người cân bằng giữa đổi mới công nghệ và tính công bằng xã hội.",
      paragraphRef: "Paragraph 4",
    },
  ],
  "how-communities-respond-to-climate-change": [
    {
      id: "cc-q1",
      question: "Why are local communities often the first to take action against climate change?",
      options: [
        "Because national governments are prohibited from acting locally",
        "Because climate impacts such as extreme heat and flooding are directly visible in neighborhoods",
        "Because local projects do not require any funding",
        "Because global conferences only invite neighborhood leaders",
      ],
      correctAnswer: 1,
      explanation: "Đoạn 1 và 2 giải thích rằng các tác động như mùa hè nóng hơn, mưa lớn và bão đều hiện rõ tại địa phương nên cộng đồng thường là nơi phản ứng đầu tiên.",
      paragraphRef: "Paragraph 1 & 2",
    },
    {
      id: "cc-q2",
      question: "Which everyday habits are mentioned as helpful ways for people to reduce environmental pressure?",
      options: [
        "Using reusable bags, repairing household appliances, and choosing public transit",
        "Purchasing new electronic devices every year",
        "Avoiding any form of public transportation",
        "Leaving all climate decisions entirely to multinational corporations",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 3 chỉ ra rằng việc dùng túi tái sử dụng, sửa chữa đồ đạc và đi lại bằng phương tiện công cộng mang lại tác động lớn khi nhiều người duy trì đều đặn.",
      paragraphRef: "Paragraph 3",
    },
    {
      id: "cc-q3",
      question: "What is required from governments and companies to make sustainable habits easier?",
      options: [
        "Better infrastructure such as accessible recycling and reliable clean transport",
        "Strict bans on all neighborhood initiatives",
        "Closing public parks to save maintenance costs",
        "Increasing the price of public transport tickets",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 4 nêu rõ chính phủ và doanh nghiệp cần hỗ trợ bằng hạ tầng tốt hơn, giúp việc tái chế và di chuyển sạch trở nên thuận tiện và đáng tin cậy.",
      paragraphRef: "Paragraph 4",
    },
  ],
  "why-active-learning-sticks-better": [
    {
      id: "al-q1",
      question: "According to the article, why does active participation help students retain information?",
      options: [
        "It forces the brain to work harder by speaking, writing, summarizing, and questioning",
        "It eliminates the need to review material before tests",
        "It allows students to learn without focusing or paying attention",
        "It replaces the need for teachers in classrooms",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 1 nêu rằng nói, viết, tóm tắt và đặt câu hỏi buộc não bộ hoạt động tích cực hơn, giúp thông tin lưu trữ lâu hơn trong trí nhớ.",
      paragraphRef: "Paragraph 1",
    },
    {
      id: "al-q2",
      question: "Why is mixing explanation with practice more effective than long lectures?",
      options: [
        "Practice exercises are faster to grade than exams",
        "Interactive exercises lead to deeper understanding than passive listening",
        "Students prefer to do homework during lecture hours",
        "Lectures are proven to damage memory retention",
      ],
      correctAnswer: 1,
      explanation: "Đoạn 2 giải thích một bài học ngắn kết hợp thảo luận hoặc thực hành sẽ mang lại hiệu quả hiểu bài tốt hơn một bài giảng dài không có tương tác.",
      paragraphRef: "Paragraph 2",
    },
    {
      id: "al-q3",
      question: "When does repetition become most effective for long-term memory?",
      options: [
        "When learners notice patterns and connect new ideas to familiar concepts",
        "When material is memorized without understanding its context",
        "When repetition is done only once right before an exam",
        "When students copy text repeatedly without reading it",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 3 và 4 chỉ ra rằng sự lặp lại hiệu quả nhất khi người học nhận diện quy luật và liên kết kiến thức mới với điều quen thuộc.",
      paragraphRef: "Paragraph 3 & 4",
    },
  ],
  "the-new-rules-of-wellness": [
    {
      id: "wl-q1",
      question: "What does modern wellness include beyond gym workouts and dietary restrictions?",
      options: [
        "Quality sleep, stress management, hydration, and a supportive daily routine",
        "Relying exclusively on energy drinks and supplements",
        "Exercising strenuously without rest days",
        "Skipping meals to improve cognitive performance",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 1 giải thích sự khỏe mạnh thực chất còn bao gồm giấc ngủ, kiểm soát căng thẳng, uống đủ nước và duy trì nhịp sinh hoạt cân bằng.",
      paragraphRef: "Paragraph 1",
    },
    {
      id: "wl-q2",
      question: "Why are small routines often more successful than dramatic lifestyle overhauls?",
      options: [
        "Small habits are easier to maintain consistently until they become automatic",
        "Dramatic overhauls are forbidden by health professionals",
        "Small habits do not require any conscious effort from day one",
        "Only short routines produce visible results within 24 hours",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 3 nhấn mạnh các thói quen nhỏ như đi bộ ngắn, ngủ đúng giờ dễ duy trì hơn việc thay đổi lối sống quá đột ngột và dần trở thành tự nhiên.",
      paragraphRef: "Paragraph 3",
    },
    {
      id: "wl-q3",
      question: "What core principle matters most when building long-term healthy habits?",
      options: [
        "Consistency matters more than temporary perfection",
        "Perfection on every single day is required",
        "Following extreme diet plans for short periods",
        "Exercising only when feeling fully energized",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 4 nhấn mạnh: 'Consistency matters more than perfection' — sự đều đặn quan trọng hơn sự hoàn hảo trong hành trình sức khỏe dài hạn.",
      paragraphRef: "Paragraph 4",
    },
  ],
  "what-the-future-workplace-might-look-like": [
    {
      id: "fw-q1",
      question: "What key advantage does workplace flexibility offer to companies?",
      options: [
        "It eliminates the need to pay employee salaries",
        "It allows companies to hire talented people living far away from major business hubs",
        "It removes all requirements for team communication",
        "It ensures that employees work 24 hours every day",
      ],
      correctAnswer: 1,
      explanation: "Đoạn 2 cho biết tính linh hoạt giúp doanh nghiệp chiêu mộ người tài ở khắp mọi nơi thay vì chỉ giới hạn ở các trung tâm tài chính lớn.",
      paragraphRef: "Paragraph 2",
    },
    {
      id: "fw-q2",
      question: "Why does flexible remote work require even stronger communication?",
      options: [
        "Because physical distance can cause confusion to spread rapidly when messages are unclear",
        "Because employees cannot read text messages without supervision",
        "Because video conferencing tools have strict time limits",
        "Because managers are unable to track project goals remotely",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 3 nêu rõ làm việc linh hoạt đòi hỏi giao tiếp rõ ràng vì khoảng cách có thể khiến hiểu lầm lan truyền nhanh khi thông tin thiếu chuẩn xác.",
      paragraphRef: "Paragraph 3",
    },
    {
      id: "fw-q3",
      question: "What will distinguish the most successful workplaces of the future?",
      options: [
        "They will combine modern digital technology with strong human values like empathy and cooperation",
        "They will eliminate all face-to-face conversations permanently",
        "They will replace all human workers with automated chatbots",
        "They will operate without shared schedules or team objectives",
      ],
      correctAnswer: 0,
      explanation: "Đoạn 4 kết luận môi trường làm việc thành công nhất sẽ kết hợp công nghệ hiện đại với sự đồng cảm, hợp tác và tinh thần gắn kết giữa con người.",
      paragraphRef: "Paragraph 4",
    },
  ],
  "hanoi-s-green-transition-a-new-era-for-urban-transport": [
    {
      id: "hn-q1",
      question: "What is Hanoi doing to advance its urban transport transition?",
      options: [
        "Expanding electric bus routes, metro lines, and encouraging clean vehicle adoption",
        "Banning all pedestrians from public sidewalks",
        "Converting public parks into parking garages",
        "Canceling all public investment in rail transport",
      ],
      correctAnswer: 0,
      explanation: "Bài đọc về quá trình chuyển dịch xanh của Hà Nội tập trung vào việc mở rộng xe buýt điện, đường sắt đô thị và thúc đẩy giao thông sạch.",
      paragraphRef: "Paragraph 1 & 2",
    },
    {
      id: "hn-q2",
      question: "What is the primary benefit of shifting to green public transit in Hanoi?",
      options: [
        "Reducing harmful air pollution, lowering traffic noise, and alleviating congestion",
        "Making all transport tickets completely free for everyone",
        "Preventing residents from owning bicycles",
        "Allowing vehicles to travel at unlimited speeds",
      ],
      correctAnswer: 0,
      explanation: "Giao thông công cộng xanh giúp giảm thiểu ô nhiễm không khí, hạ nhiệt tiếng ồn đô thị và giải quyết bài toán ùn tắc giao thông một cách bền vững.",
      paragraphRef: "Paragraph 3",
    },
  ],
};

export function getQuestionsForArticle(slug?: string): ComprehensionQuestion[] {
  if (!slug) return [];
  return DEFAULT_READING_QUESTIONS[slug] ?? [];
}
