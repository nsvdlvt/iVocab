import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20260817_create_reading_articles.sql");

function flattenContent(content, valueKey) {
  const sections = Array.isArray(content?.sections) ? content.sections : [];
  const paragraphs = [];

  for (const section of sections) {
    const sectionParagraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : [];
    for (const paragraph of sectionParagraphs) {
      paragraphs.push({
        id: paragraph.id,
        text: typeof paragraph?.[valueKey] === "string" ? paragraph[valueKey] : "",
        highlighted_words: Array.isArray(paragraph?.highlighted_words) ? paragraph.highlighted_words : undefined,
      });
    }
  }

  return { paragraphs };
}

const readingSeedRows = [
  {
    slug: "the-rise-of-smart-cities",
    title: "The Rise of Smart Cities",
    description: "How connected infrastructure is changing urban life and making cities more responsive.",
    cover_image_url:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
    topic: "Technology",
    level: "B1-B2",
    estimated_reading_minutes: 6,
    vocabulary_count: 24,
    english_content: {
      sections: [
        {
          id: "intro",
          title: "Smart cities are growing fast",
          paragraphs: [
            {
              id: "p1",
              english:
                "Around the world, cities are adding sensors, connected traffic systems, and digital services to make daily life easier. These tools help planners understand congestion, energy use, and public transport patterns in real time.",
              vietnamese:
                "Trên khắp thế giới, các thành phố đang bổ sung cảm biến, hệ thống giao thông kết nối và các dịch vụ số để giúp cuộc sống hằng ngày dễ dàng hơn. Những công cụ này giúp nhà quy hoạch hiểu tình trạng tắc đường, mức sử dụng năng lượng và mô hình giao thông công cộng theo thời gian thực.",
            },
            {
              id: "p2",
              english:
                "For residents, the change is often small at first: a bus arrives more predictably, street lights adjust automatically, or a payment app reduces waiting time. Over time, these small improvements can make a city feel more organized and less stressful.",
              vietnamese:
                "Với cư dân, sự thay đổi ban đầu thường rất nhỏ: xe buýt đến đúng giờ hơn, đèn đường tự điều chỉnh hoặc ứng dụng thanh toán giúp giảm thời gian chờ. Theo thời gian, những cải thiện nhỏ này có thể khiến thành phố trở nên gọn gàng và bớt căng thẳng hơn.",
            },
          ],
        },
        {
          id: "future",
          title: "The promise and the challenge",
          paragraphs: [
            {
              id: "p3",
              english:
                "Smart city projects are not perfect. They can be expensive, and they depend on careful planning, reliable data, and trust from the people who live there. Cities also need to protect privacy and make sure technology serves everyone, not only the most connected neighborhoods.",
              vietnamese:
                "Các dự án thành phố thông minh không hoàn hảo. Chúng có thể tốn kém và phụ thuộc vào kế hoạch cẩn thận, dữ liệu đáng tin cậy cùng sự tin tưởng của người dân. Các thành phố cũng cần bảo vệ quyền riêng tư và đảm bảo công nghệ phục vụ tất cả mọi người, không chỉ những khu vực kết nối tốt nhất.",
            },
            {
              id: "p4",
              english:
                "Even so, many urban leaders believe that thoughtful technology can create cleaner streets, safer intersections, and better public services. The future of city life will likely depend on how well people balance innovation with fairness.",
              vietnamese:
                "Dù vậy, nhiều nhà lãnh đạo đô thị tin rằng công nghệ được áp dụng một cách thận trọng có thể tạo ra đường phố sạch hơn, giao lộ an toàn hơn và dịch vụ công tốt hơn. Tương lai của đời sống thành thị có lẽ sẽ phụ thuộc vào việc con người cân bằng đổi mới với sự công bằng như thế nào.",
            },
          ],
        },
      ],
    },
    vietnamese_content: {
      sections: [
        {
          id: "intro",
          title: "Các thành phố thông minh đang phát triển nhanh",
          paragraphs: [
            {
              id: "p1",
              english:
                "Around the world, cities are adding sensors, connected traffic systems, and digital services to make daily life easier. These tools help planners understand congestion, energy use, and public transport patterns in real time.",
              vietnamese:
                "Trên khắp thế giới, các thành phố đang bổ sung cảm biến, hệ thống giao thông kết nối và các dịch vụ số để giúp cuộc sống hằng ngày dễ dàng hơn. Những công cụ này giúp nhà quy hoạch hiểu tình trạng tắc đường, mức sử dụng năng lượng và mô hình giao thông công cộng theo thời gian thực.",
            },
            {
              id: "p2",
              english:
                "For residents, the change is often small at first: a bus arrives more predictably, street lights adjust automatically, or a payment app reduces waiting time. Over time, these small improvements can make a city feel more organized and less stressful.",
              vietnamese:
                "Với cư dân, sự thay đổi ban đầu thường rất nhỏ: xe buýt đến đúng giờ hơn, đèn đường tự điều chỉnh hoặc ứng dụng thanh toán giúp giảm thời gian chờ. Theo thời gian, những cải thiện nhỏ này có thể khiến thành phố trở nên gọn gàng và bớt căng thẳng hơn.",
            },
          ],
        },
        {
          id: "future",
          title: "Tiềm năng và thách thức",
          paragraphs: [
            {
              id: "p3",
              english:
                "Smart city projects are not perfect. They can be expensive, and they depend on careful planning, reliable data, and trust from the people who live there. Cities also need to protect privacy and make sure technology serves everyone, not only the most connected neighborhoods.",
              vietnamese:
                "Các dự án thành phố thông minh không hoàn hảo. Chúng có thể tốn kém và phụ thuộc vào kế hoạch cẩn thận, dữ liệu đáng tin cậy cùng sự tin tưởng của người dân. Các thành phố cũng cần bảo vệ quyền riêng tư và đảm bảo công nghệ phục vụ tất cả mọi người, không chỉ những khu vực kết nối tốt nhất.",
            },
            {
              id: "p4",
              english:
                "Even so, many urban leaders believe that thoughtful technology can create cleaner streets, safer intersections, and better public services. The future of city life will likely depend on how well people balance innovation with fairness.",
              vietnamese:
                "Dù vậy, nhiều nhà lãnh đạo đô thị tin rằng công nghệ được áp dụng một cách thận trọng có thể tạo ra đường phố sạch hơn, giao lộ an toàn hơn và dịch vụ công tốt hơn. Tương lai của đời sống thành thị có lẽ sẽ phụ thuộc vào việc con người cân bằng đổi mới với sự công bằng như thế nào.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "how-communities-respond-to-climate-change",
    title: "How Communities Respond to Climate Change",
    description: "A clear look at how local action, daily habits, and public policy can reduce climate risk.",
    cover_image_url:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80",
    topic: "Environment",
    level: "B1",
    estimated_reading_minutes: 7,
    vocabulary_count: 22,
    english_content: {
      sections: [
        {
          id: "section-1",
          title: "Climate change feels local",
          paragraphs: [
            {
              id: "p1",
              english:
                "People often hear about climate change as a global issue, but many of its effects are visible in local neighborhoods. Hotter summers, heavier rain, and stronger storms can all affect homes, roads, and public spaces.",
              vietnamese:
                "Mọi người thường nghe về biến đổi khí hậu như một vấn đề toàn cầu, nhưng nhiều tác động của nó lại hiện rõ ở các khu dân cư địa phương. Mùa hè nóng hơn, mưa lớn hơn và bão mạnh hơn đều có thể ảnh hưởng đến nhà ở, đường sá và không gian công cộng.",
            },
            {
              id: "p2",
              english:
                "Because the impacts are so close, communities are often the first to respond. They plant trees, improve drainage systems, and organize campaigns to reduce waste and save energy.",
              vietnamese:
                "Vì tác động diễn ra rất gần, các cộng đồng thường là nơi phản ứng đầu tiên. Họ trồng cây, cải thiện hệ thống thoát nước và tổ chức các chiến dịch giảm rác thải, tiết kiệm năng lượng.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Small habits matter",
          paragraphs: [
            {
              id: "p3",
              english:
                "Not every solution has to be large or expensive. Choosing reusable bags, repairing appliances, and using public transport can reduce pressure on the environment when many people do it consistently.",
              vietnamese:
                "Không phải giải pháp nào cũng phải lớn hoặc tốn kém. Việc dùng túi tái sử dụng, sửa đồ gia dụng và đi phương tiện công cộng có thể giảm áp lực lên môi trường nếu nhiều người duy trì đều đặn.",
            },
            {
              id: "p4",
              english:
                "At the same time, governments and companies must support these habits with better infrastructure. When recycling is easy and clean transport is reliable, it becomes much simpler for people to make greener choices.",
              vietnamese:
                "Đồng thời, chính phủ và doanh nghiệp phải hỗ trợ những thói quen này bằng hạ tầng tốt hơn. Khi việc tái chế trở nên dễ dàng và phương tiện sạch đáng tin cậy, con người sẽ dễ dàng đưa ra những lựa chọn xanh hơn rất nhiều.",
            },
          ],
        },
      ],
    },
    vietnamese_content: {
      sections: [
        {
          id: "section-1",
          title: "Biến đổi khí hậu là vấn đề rất gần",
          paragraphs: [
            {
              id: "p1",
              english:
                "People often hear about climate change as a global issue, but many of its effects are visible in local neighborhoods. Hotter summers, heavier rain, and stronger storms can all affect homes, roads, and public spaces.",
              vietnamese:
                "Mọi người thường nghe về biến đổi khí hậu như một vấn đề toàn cầu, nhưng nhiều tác động của nó lại hiện rõ ở các khu dân cư địa phương. Mùa hè nóng hơn, mưa lớn hơn và bão mạnh hơn đều có thể ảnh hưởng đến nhà ở, đường sá và không gian công cộng.",
            },
            {
              id: "p2",
              english:
                "Because the impacts are so close, communities are often the first to respond. They plant trees, improve drainage systems, and organize campaigns to reduce waste and save energy.",
              vietnamese:
                "Vì tác động diễn ra rất gần, các cộng đồng thường là nơi phản ứng đầu tiên. Họ trồng cây, cải thiện hệ thống thoát nước và tổ chức các chiến dịch giảm rác thải, tiết kiệm năng lượng.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Thói quen nhỏ cũng có ý nghĩa",
          paragraphs: [
            {
              id: "p3",
              english:
                "Not every solution has to be large or expensive. Choosing reusable bags, repairing appliances, and using public transport can reduce pressure on the environment when many people do it consistently.",
              vietnamese:
                "Không phải giải pháp nào cũng phải lớn hoặc tốn kém. Việc dùng túi tái sử dụng, sửa đồ gia dụng và đi phương tiện công cộng có thể giảm áp lực lên môi trường nếu nhiều người duy trì đều đặn.",
            },
            {
              id: "p4",
              english:
                "At the same time, governments and companies must support these habits with better infrastructure. When recycling is easy and clean transport is reliable, it becomes much simpler for people to make greener choices.",
              vietnamese:
                "Đồng thời, chính phủ và doanh nghiệp phải hỗ trợ những thói quen này bằng hạ tầng tốt hơn. Khi việc tái chế trở nên dễ dàng và phương tiện sạch đáng tin cậy, con người sẽ dễ dàng đưa ra những lựa chọn xanh hơn rất nhiều.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "why-active-learning-sticks-better",
    title: "Why Active Learning Sticks Better",
    description: "A practical article on why participation, repetition, and reflection improve memory.",
    cover_image_url:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=80",
    topic: "Education",
    level: "B2",
    estimated_reading_minutes: 6,
    vocabulary_count: 20,
    english_content: {
      sections: [
        {
          id: "section-1",
          title: "Learning is stronger when it is active",
          paragraphs: [
            {
              id: "p1",
              english:
                "Students remember more when they do something with information instead of only reading it. Speaking, writing, summarizing, and asking questions all force the brain to work harder, which helps knowledge stay in memory.",
              vietnamese:
                "Học sinh ghi nhớ tốt hơn khi họ làm gì đó với thông tin thay vì chỉ đọc nó. Việc nói, viết, tóm tắt và đặt câu hỏi đều buộc não phải làm việc nhiều hơn, từ đó giúp kiến thức ở lại trong trí nhớ lâu hơn.",
            },
            {
              id: "p2",
              english:
                "This is why teachers often mix explanation with practice. A short lesson followed by discussion or exercise usually leads to better understanding than a long lecture with no interaction.",
              vietnamese:
                "Đó là lý do giáo viên thường kết hợp giải thích với thực hành. Một bài học ngắn đi kèm thảo luận hoặc bài tập thường giúp hiểu bài tốt hơn so với một bài giảng dài mà không có tương tác.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Repetition works, but only with meaning",
          paragraphs: [
            {
              id: "p3",
              english:
                "Repeating the same material can help, but repetition is more effective when learners notice patterns and connect new ideas to something familiar. That connection gives the brain more places to store the information.",
              vietnamese:
                "Việc lặp lại cùng một nội dung có thể hữu ích, nhưng sự lặp lại hiệu quả hơn khi người học nhận ra quy luật và kết nối ý mới với điều quen thuộc. Sự kết nối đó tạo cho não nhiều “điểm lưu” hơn để cất giữ thông tin.",
            },
            {
              id: "p4",
              english:
                "Because of this, good study methods usually include review, self-testing, and reflection. These habits turn passive knowledge into something the learner can use more confidently in real situations.",
              vietnamese:
                "Vì thế, các phương pháp học tốt thường bao gồm ôn tập, tự kiểm tra và tự phản chiếu. Những thói quen này biến kiến thức thụ động thành thứ mà người học có thể sử dụng tự tin hơn trong các tình huống thực tế.",
            },
          ],
        },
      ],
    },
    vietnamese_content: {
      sections: [
        {
          id: "section-1",
          title: "Học tập hiệu quả hơn khi chủ động",
          paragraphs: [
            {
              id: "p1",
              english:
                "Students remember more when they do something with information instead of only reading it. Speaking, writing, summarizing, and asking questions all force the brain to work harder, which helps knowledge stay in memory.",
              vietnamese:
                "Học sinh ghi nhớ tốt hơn khi họ làm gì đó với thông tin thay vì chỉ đọc nó. Việc nói, viết, tóm tắt và đặt câu hỏi đều buộc não phải làm việc nhiều hơn, từ đó giúp kiến thức ở lại trong trí nhớ lâu hơn.",
            },
            {
              id: "p2",
              english:
                "This is why teachers often mix explanation with practice. A short lesson followed by discussion or exercise usually leads to better understanding than a long lecture with no interaction.",
              vietnamese:
                "Đó là lý do giáo viên thường kết hợp giải thích với thực hành. Một bài học ngắn đi kèm thảo luận hoặc bài tập thường giúp hiểu bài tốt hơn so với một bài giảng dài mà không có tương tác.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Ôn tập có ý nghĩa mới thật sự hiệu quả",
          paragraphs: [
            {
              id: "p3",
              english:
                "Repeating the same material can help, but repetition is more effective when learners notice patterns and connect new ideas to something familiar. That connection gives the brain more places to store the information.",
              vietnamese:
                "Việc lặp lại cùng một nội dung có thể hữu ích, nhưng sự lặp lại hiệu quả hơn khi người học nhận ra quy luật và kết nối ý mới với điều quen thuộc. Sự kết nối đó tạo cho não nhiều “điểm lưu” hơn để cất giữ thông tin.",
            },
            {
              id: "p4",
              english:
                "Because of this, good study methods usually include review, self-testing, and reflection. These habits turn passive knowledge into something the learner can use more confidently in real situations.",
              vietnamese:
                "Vì thế, các phương pháp học tốt thường bao gồm ôn tập, tự kiểm tra và tự phản chiếu. Những thói quen này biến kiến thức thụ động thành thứ mà người học có thể sử dụng tự tin hơn trong các tình huống thực tế.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "the-new-rules-of-wellness",
    title: "The New Rules of Wellness",
    description: "How sleep, movement, and balance are becoming the center of everyday health.",
    cover_image_url:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
    topic: "Health",
    level: "B1-B2",
    estimated_reading_minutes: 5,
    vocabulary_count: 18,
    english_content: {
      sections: [
        {
          id: "section-1",
          title: "Wellness is more than exercise",
          paragraphs: [
            {
              id: "p1",
              english:
                "Many people think health only means going to the gym or eating less sugar. In reality, wellness also includes sleep, stress control, hydration, and a routine that supports the body and mind together.",
              vietnamese:
                "Nhiều người nghĩ sức khỏe chỉ có nghĩa là đến phòng tập hoặc ăn ít đường. Trên thực tế, sự khỏe mạnh còn bao gồm giấc ngủ, kiểm soát căng thẳng, đủ nước và một thói quen sinh hoạt hỗ trợ cả cơ thể lẫn tinh thần.",
            },
            {
              id: "p2",
              english:
                "When people start paying attention to these simple basics, they often feel more energy during the day. They also make better decisions because the body is not constantly fighting tiredness.",
              vietnamese:
                "Khi mọi người bắt đầu chú ý đến những điều cơ bản này, họ thường thấy có nhiều năng lượng hơn trong ngày. Họ cũng đưa ra quyết định tốt hơn vì cơ thể không phải liên tục chống lại sự mệt mỏi.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Small routines are easier to keep",
          paragraphs: [
            {
              id: "p3",
              english:
                "A short walk after lunch, a fixed bedtime, or a glass of water before every meal can be easier to maintain than a dramatic lifestyle change. Over time, these habits often become automatic.",
              vietnamese:
                "Đi bộ ngắn sau bữa trưa, ngủ đúng giờ hoặc uống một cốc nước trước mỗi bữa ăn có thể dễ duy trì hơn nhiều so với việc thay đổi lối sống quá đột ngột. Theo thời gian, những thói quen này thường trở nên tự động.",
            },
            {
              id: "p4",
              english:
                "The best wellness advice is often simple enough to repeat every day. Consistency matters more than perfection, especially when the goal is to build a healthier life that lasts.",
              vietnamese:
                "Lời khuyên chăm sóc sức khỏe tốt nhất thường đủ đơn giản để lặp lại mỗi ngày. Sự đều đặn quan trọng hơn sự hoàn hảo, đặc biệt khi mục tiêu là xây dựng một cuộc sống khỏe mạnh hơn và bền vững hơn.",
            },
          ],
        },
      ],
    },
    vietnamese_content: {
      sections: [
        {
          id: "section-1",
          title: "Wellness không chỉ là tập luyện",
          paragraphs: [
            {
              id: "p1",
              english:
                "Many people think health only means going to the gym or eating less sugar. In reality, wellness also includes sleep, stress control, hydration, and a routine that supports the body and mind together.",
              vietnamese:
                "Nhiều người nghĩ sức khỏe chỉ có nghĩa là đến phòng tập hoặc ăn ít đường. Trên thực tế, sự khỏe mạnh còn bao gồm giấc ngủ, kiểm soát căng thẳng, đủ nước và một thói quen sinh hoạt hỗ trợ cả cơ thể lẫn tinh thần.",
            },
            {
              id: "p2",
              english:
                "When people start paying attention to these simple basics, they often feel more energy during the day. They also make better decisions because the body is not constantly fighting tiredness.",
              vietnamese:
                "Khi mọi người bắt đầu chú ý đến những điều cơ bản này, họ thường thấy có nhiều năng lượng hơn trong ngày. Họ cũng đưa ra quyết định tốt hơn vì cơ thể không phải liên tục chống lại sự mệt mỏi.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Thói quen nhỏ dễ duy trì hơn",
          paragraphs: [
            {
              id: "p3",
              english:
                "A short walk after lunch, a fixed bedtime, or a glass of water before every meal can be easier to maintain than a dramatic lifestyle change. Over time, these habits often become automatic.",
              vietnamese:
                "Đi bộ ngắn sau bữa trưa, ngủ đúng giờ hoặc uống một cốc nước trước mỗi bữa ăn có thể dễ duy trì hơn nhiều so với việc thay đổi lối sống quá đột ngột. Theo thời gian, những thói quen này thường trở nên tự động.",
            },
            {
              id: "p4",
              english:
                "The best wellness advice is often simple enough to repeat every day. Consistency matters more than perfection, especially when the goal is to build a healthier life that lasts.",
              vietnamese:
                "Lời khuyên chăm sóc sức khỏe tốt nhất thường đủ đơn giản để lặp lại mỗi ngày. Sự đều đặn quan trọng hơn sự hoàn hảo, đặc biệt khi mục tiêu là xây dựng một cuộc sống khỏe mạnh hơn và bền vững hơn.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "what-the-future-workplace-might-look-like",
    title: "What the Future Workplace Might Look Like",
    description: "Remote teams, flexible schedules, and AI tools are reshaping how people work together.",
    cover_image_url:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    topic: "Society",
    level: "B2",
    estimated_reading_minutes: 7,
    vocabulary_count: 25,
    english_content: {
      sections: [
        {
          id: "section-1",
          title: "Work is becoming more flexible",
          paragraphs: [
            {
              id: "p1",
              english:
                "The workplace is changing faster than many people expected. Some teams now work from different cities, meet online, and rely on shared digital tools instead of a single office.",
              vietnamese:
                "Nơi làm việc đang thay đổi nhanh hơn nhiều người từng dự đoán. Một số nhóm hiện làm việc từ nhiều thành phố khác nhau, họp trực tuyến và dựa vào các công cụ số dùng chung thay vì một văn phòng duy nhất.",
            },
            {
              id: "p2",
              english:
                "This flexibility can give workers more control over their time. It can also help companies hire talented people who live far away from major business centers.",
              vietnamese:
                "Tính linh hoạt này có thể giúp người lao động kiểm soát thời gian tốt hơn. Nó cũng có thể giúp công ty tuyển được những người tài giỏi sống xa các trung tâm kinh doanh lớn.",
            },
          ],
        },
        {
          id: "section-2",
          title: "New tools need new habits",
          paragraphs: [
            {
              id: "p3",
              english:
                "At the same time, flexible work requires stronger communication. Teams need clear schedules, shared goals, and trust, because distance can make confusion spread quickly when messages are unclear.",
              vietnamese:
                "Đồng thời, làm việc linh hoạt đòi hỏi giao tiếp tốt hơn. Các nhóm cần lịch trình rõ ràng, mục tiêu chung và sự tin tưởng, vì khoảng cách có thể khiến sự nhầm lẫn lan rất nhanh khi thông điệp không rõ ràng.",
            },
            {
              id: "p4",
              english:
                "In the future, the most successful workplaces will probably be the ones that combine technology with strong human habits. People will still need empathy, cooperation, and a sense of purpose even if the office looks very different.",
              vietnamese:
                "Trong tương lai, những môi trường làm việc thành công nhất có lẽ là nơi kết hợp công nghệ với các thói quen con người mạnh mẽ. Mọi người vẫn sẽ cần sự đồng cảm, tinh thần hợp tác và cảm giác có mục đích dù văn phòng trông rất khác trước.",
            },
          ],
        },
      ],
    },
    vietnamese_content: {
      sections: [
        {
          id: "section-1",
          title: "Công việc đang trở nên linh hoạt hơn",
          paragraphs: [
            {
              id: "p1",
              english:
                "The workplace is changing faster than many people expected. Some teams now work from different cities, meet online, and rely on shared digital tools instead of a single office.",
              vietnamese:
                "Nơi làm việc đang thay đổi nhanh hơn nhiều người từng dự đoán. Một số nhóm hiện làm việc từ nhiều thành phố khác nhau, họp trực tuyến và dựa vào các công cụ số dùng chung thay vì một văn phòng duy nhất.",
            },
            {
              id: "p2",
              english:
                "This flexibility can give workers more control over their time. It can also help companies hire talented people who live far away from major business centers.",
              vietnamese:
                "Tính linh hoạt này có thể giúp người lao động kiểm soát thời gian tốt hơn. Nó cũng có thể giúp công ty tuyển được những người tài giỏi sống xa các trung tâm kinh doanh lớn.",
            },
          ],
        },
        {
          id: "section-2",
          title: "Công cụ mới cần thói quen mới",
          paragraphs: [
            {
              id: "p3",
              english:
                "At the same time, flexible work requires stronger communication. Teams need clear schedules, shared goals, and trust, because distance can make confusion spread quickly when messages are unclear.",
              vietnamese:
                "Đồng thời, làm việc linh hoạt đòi hỏi giao tiếp tốt hơn. Các nhóm cần lịch trình rõ ràng, mục tiêu chung và sự tin tưởng, vì khoảng cách có thể khiến sự nhầm lẫn lan rất nhanh khi thông điệp không rõ ràng.",
            },
            {
              id: "p4",
              english:
                "In the future, the most successful workplaces will probably be the ones that combine technology with strong human habits. People will still need empathy, cooperation, and a sense of purpose even if the office looks very different.",
              vietnamese:
                "Trong tương lai, những môi trường làm việc thành công nhất có lẽ là nơi kết hợp công nghệ với các thói quen con người mạnh mẽ. Mọi người vẫn sẽ cần sự đồng cảm, tinh thần hợp tác và cảm giác có mục đích dù văn phòng trông rất khác trước.",
            },
          ],
        },
      ],
    },
  },
];

const nowIso = new Date().toISOString();

async function main() {
  const migrationSql = await fs.readFile(migrationPath, "utf8");
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(migrationSql);

    const upsertSql = `
      insert into public.reading_articles (
        slug, title, description, cover_image_url, topic, level,
        estimated_reading_minutes, vocabulary_count, english_content,
        vietnamese_content, status, published_at, created_at, updated_at
      )
      values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14
      )
      on conflict (slug) do update set
        title = excluded.title,
        description = excluded.description,
        cover_image_url = excluded.cover_image_url,
        topic = excluded.topic,
        level = excluded.level,
        estimated_reading_minutes = excluded.estimated_reading_minutes,
        vocabulary_count = excluded.vocabulary_count,
        english_content = excluded.english_content,
        vietnamese_content = excluded.vietnamese_content,
        status = excluded.status,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at;
    `;

    for (const row of readingSeedRows) {
      await client.query(upsertSql, [
        row.slug,
        row.title,
        row.description,
        row.cover_image_url,
        row.topic,
      row.level,
      row.estimated_reading_minutes,
      row.vocabulary_count,
        JSON.stringify(flattenContent(row.english_content, "english")),
        JSON.stringify(flattenContent(row.vietnamese_content, "vietnamese")),
        "published",
        nowIso,
        nowIso,
        nowIso,
      ]);
    }

    await client.query("COMMIT");
    console.log(`Seeded ${readingSeedRows.length} reading articles successfully.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
