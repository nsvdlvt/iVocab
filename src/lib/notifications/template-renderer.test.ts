import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  validateTemplate,
  extractVariables,
  escapeHtml,
} from "./template-renderer";

describe("TemplateRenderer", () => {
  describe("extractVariables", () => {
    it("should extract single and multiple variables accurately", () => {
      const vars = extractVariables("Xin chào {name}, bạn đang có chuỗi {streak} ngày!");
      expect(vars).toEqual(["name", "streak"]);
    });

    it("should return empty array when no variables exist", () => {
      expect(extractVariables("Chào mừng bạn quay lại với Vocabee!")).toEqual([]);
    });

    it("should deduplicate variable names", () => {
      const vars = extractVariables("{name} ơi, {name} nhớ học nhé {streak}!");
      expect(vars).toEqual(["name", "streak"]);
    });
  });

  describe("validateTemplate", () => {
    it("should pass when all variables are valid registered variables", () => {
      const res = validateTemplate({
        title: "🐝 {name} ơi, đến giờ học từ vựng rồi!",
        body: "Hôm nay bạn đã học {words_learned_today} từ và streak hiện tại là {streak} ngày.",
      });

      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.unknownVariables).toHaveLength(0);
      expect(res.variables).toEqual(
        expect.arrayContaining(["name", "words_learned_today", "streak"])
      );
    });

    it("should detect unknown / unregistered variables and fail validation", () => {
      const res = validateTemplate({
        title: "Thông báo {invalid_var_xyz}",
        body: "Chào {name}, mật khẩu của bạn là {password_secret}.",
      });

      expect(res.isValid).toBe(false);
      expect(res.unknownVariables).toContain("invalid_var_xyz");
      expect(res.unknownVariables).toContain("password_secret");
      expect(res.errors.length).toBeGreaterThanOrEqual(2);
    });

    it("should reject empty title or empty body", () => {
      const res1 = validateTemplate({ title: "", body: "Nội dung" });
      expect(res1.isValid).toBe(false);
      expect(res1.errors).toContain("Tiêu đề thông báo không được để trống.");

      const res2 = validateTemplate({ title: "Tiêu đề", body: "   " });
      expect(res2.isValid).toBe(false);
      expect(res2.errors).toContain("Nội dung thông báo không được để trống.");
    });
  });

  describe("renderTemplate - Variable Substitution & Fallbacks", () => {
    it("1. Render {name}, {streak} và {word_count} đúng dữ liệu thực", () => {
      const template = {
        title: "Chào {name}!",
        body: "Bạn đã lưu {word_count} từ và đạt chuỗi {streak} ngày.",
      };
      const context = {
        name: "Nguyễn Sỹ Việt Dũng",
        word_count: 85,
        streak: 12,
      };

      const result = renderTemplate(template, context);

      expect(result.success).toBe(true);
      expect(result.title).toBe("Chào Nguyễn Sỹ Việt Dũng!");
      expect(result.body).toBe("Bạn đã lưu 85 từ và đạt chuỗi 12 ngày.");
      expect(result.missingVariables).toHaveLength(0);
    });

    it("4. Giá trị bằng 0 (streak = 0, words_review_due = 0) được xử lý đúng, không bị coi là rỗng", () => {
      const template = {
        title: "Streak của bạn: {streak}",
        body: "Hôm nay bạn có {words_review_due} từ đến hạn và đã học {words_learned_today} từ.",
      };
      const context = {
        streak: 0,
        words_review_due: 0,
        words_learned_today: 0,
      };

      const result = renderTemplate(template, context);

      expect(result.success).toBe(true);
      expect(result.title).toBe("Streak của bạn: 0");
      expect(result.body).toBe("Hôm nay bạn có 0 từ đến hạn và đã học 0 từ.");
    });

    it("3. Biến bắt buộc bị thiếu khiến template không được gửi (success = false, ghi nhận missingVariables)", () => {
      const template = {
        title: "Chào {name}",
        body: "Bạn đang có streak {streak} ngày nhưng thiếu {missing_var}.",
      };
      const context = {
        name: "Minh",
        streak: 5,
        // missing_var is undefined
      };

      const result = renderTemplate(template, context);

      expect(result.success).toBe(false);
      expect(result.missingVariables).toContain("missing_var");
      // Does not replace missing variable with undefined or blank in strict mode
      expect(result.body).toContain("{missing_var}");
    });

    it("should correctly substitute action_url variables if provided", () => {
      const template = {
        title: "Ôn tập ngay",
        body: "Học tiếp bài học",
        action_url: "/review",
      };
      const context = {
        name: "Dũng",
      };

      const result = renderTemplate(template, context);
      expect(result.actionUrl).toBe("/review");
    });

    it("should escape HTML special characters when escapeHtml option is enabled", () => {
      const template = {
        title: "Chào {name}",
        body: "Lời nhắn: {message}",
      };
      const context = {
        name: "<script>alert(1)</script>",
        message: 'Click <a href="evil.com">here</a> & win $100',
      };

      const result = renderTemplate(template, context, { escapeHtml: true });

      expect(result.title).not.toContain("<script>");
      expect(result.title).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(result.body).toContain("&amp;");
      expect(result.body).toContain("&lt;a href=&quot;evil.com&quot;&gt;");
    });
  });

  describe("escapeHtml utility", () => {
    it("should escape special characters correctly", () => {
      expect(escapeHtml(`<b>"hello" & 'world'</b>`)).toBe(
        "&lt;b&gt;&quot;hello&quot; &amp; &#039;world&#039;&lt;/b&gt;"
      );
    });
  });
});
