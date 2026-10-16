const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vocabee.site";

export const siteConfig = {
  name: "Vocabee",
  title: "Vocabee - Học từ vựng tiếng Anh thông minh",
  description: "Website học từ vựng tiếng Anh hiện đại phong cách Notion/Linear, tích hợp Flashcard, Quiz và trợ lý AI giúp nâng cao vốn từ vựng của bạn.",
  url: siteUrl,
  ogImage: `${siteUrl}/og.png`,
  links: {
    github: "https://github.com/dungb/vocabee",
  },
  creator: "Senior Frontend Developer & UI/UX Designer",
} as const;
