"use client";

const article = {
  badge: "Reading Draft",
  title: "How Vocabulary Becomes a Better Reading Experience",
  description:
    "A fake reading page for UI testing. One article only, with two clear columns: English on the left and Vietnamese on the right.",
  meta: [
    { label: "Words", value: "24" },
    { label: "Time", value: "6 min" },
    { label: "Level", value: "B1-B2" },
  ],
  paragraphs: [
    {
      en: "A smart reading system can turn vocabulary into a real lesson instead of a random list of words. It chooses terms that fit the topic, keeps them natural in context, and helps the learner see how the words work inside a paragraph.",
      vi: "Một hệ thống đọc thông minh có thể biến từ vựng thành một bài học thật sự thay vì chỉ là một danh sách từ ngẫu nhiên. Nó chọn những từ phù hợp với chủ đề, đặt chúng vào ngữ cảnh tự nhiên và giúp người học thấy cách các từ hoạt động trong một đoạn văn.",
    },
    {
      en: "When the same content is shown in two columns, the learner can compare meaning much faster. The English side gives direct exposure, while the Vietnamese side removes confusion and makes the idea easier to understand.",
      vi: "Khi cùng một nội dung được hiển thị thành hai cột, người học có thể so sánh nghĩa nhanh hơn rất nhiều. Cột tiếng Anh mang lại sự tiếp xúc trực tiếp, còn cột tiếng Việt gỡ rối và làm ý nghĩa dễ hiểu hơn.",
    },
    {
      en: "The best reading lessons do not overload the page. They focus on one article, a clear title, and a clean structure so the eye can move from sentence to sentence without distraction.",
      vi: "Những bài đọc tốt nhất không làm trang bị quá tải. Chúng chỉ tập trung vào một bài, một tiêu đề rõ ràng và một bố cục sạch sẽ để mắt người học có thể đi từ câu này sang câu khác mà không bị xao nhãng.",
    },
    {
      en: "In the next version, AI can pick the best matching words from the vocabulary bank and generate the article automatically. For now, this fake version is enough to test spacing, hierarchy, and the bilingual reading layout.",
      vi: "Ở phiên bản tiếp theo, AI có thể chọn những từ khớp nhất từ kho từ vựng và tự động tạo bài đọc. Còn bây giờ, bản giả này là đủ để test khoảng cách, thứ bậc nội dung và bố cục đọc song ngữ.",
    },
  ],
  words: [
    { word: "curated", meaning: "được chọn lọc" },
    { word: "context", meaning: "ngữ cảnh" },
    { word: "exposure", meaning: "sự tiếp xúc" },
    { word: "clarity", meaning: "độ rõ ràng" },
    { word: "retention", meaning: "khả năng ghi nhớ" },
  ],
};

export default function ReadingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,#f5f7fb_0%,#ffffff_100%)] text-slate-900">
      <div className="mx-auto w-full max-w-[1680px] px-2 py-3 md:px-4 md:py-6 lg:px-6 lg:py-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <header className="border-b border-slate-200 px-5 py-5 md:px-7 md:py-7">
            <div className="flex flex-col gap-5">
              <span className="w-fit rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                {article.badge}
              </span>
              <div className="max-w-4xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{article.title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">{article.description}</p>
              </div>
              <div className="grid max-w-xl grid-cols-3 gap-3">
                {article.meta.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-950">{item.value}</div>
                  </div>
                ))}
              </div>

            </div>
          </header>

          <div className="block md:hidden">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mobile reading</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">English + Tiếng Việt</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Pairs
                </span>
              </div>

              <div className="space-y-4">
                {article.paragraphs.map((paragraph, index) => (
                  <MobilePair
                    key={index}
                    number={index + 1}
                    english={paragraph.en}
                    vietnamese={paragraph.vi}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-2">
            <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r md:p-7 lg:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Column 1</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">English</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Source
                </span>
              </div>

              <div className="space-y-4">
                {article.paragraphs.map((paragraph, index) => (
                  <ArticleBlock
                    key={index}
                    number={index + 1}
                    text={paragraph.en}
                    accent="bg-sky-500"
                  />
                ))}
              </div>
            </div>

            <div className="p-5 md:p-7 lg:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Column 2</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">Tiếng Việt</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Translation
                </span>
              </div>

              <div className="space-y-4">
                {article.paragraphs.map((paragraph, index) => (
                  <ArticleBlock
                    key={index}
                    number={index + 1}
                    text={paragraph.vi}
                    accent="bg-emerald-500"
                  />
                ))}
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-slate-50 px-5 py-5 md:px-7 md:py-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vocabulary pool</p>
                <p className="mt-1 text-sm text-slate-600">
                  Fake words list for later AI selection. This is just for visual testing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.words.map((item) => (
                  <span
                    key={item.word}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <strong className="font-semibold text-slate-950">{item.word}</strong>
                    <span className="text-slate-500">{item.meaning}</span>
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function ArticleBlock({
  number,
  text,
  accent,
}: {
  number: number;
  text: string;
  accent: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${accent} text-sm font-semibold text-white`}>
          {number}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paragraph {number}</span>
      </div>
      <p className="text-[15px] leading-8 text-slate-700">{text}</p>
    </article>
  );
}

function MobilePair({
  number,
  english,
  vietnamese,
}: {
  number: number;
  english: string;
  vietnamese: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {number}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paragraph {number}</span>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-sky-200 bg-white p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">English</p>
          <p className="text-[15px] leading-7 text-slate-700">{english}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Tiếng Việt</p>
          <p className="text-[15px] leading-7 text-slate-700">{vietnamese}</p>
        </div>
      </div>
    </article>
  );
}
