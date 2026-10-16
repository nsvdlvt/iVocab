import { describe, it, expect } from "vitest";
import { mapAuthError } from "./error-map";

describe("mapAuthError", () => {
  it("should map invalid credentials correctly", () => {
    expect(mapAuthError(new Error("Invalid login credentials"))).toBe(
      "Email hoặc mật khẩu không chính xác."
    );
    expect(mapAuthError({ message: "invalid_grant" })).toBe(
      "Email hoặc mật khẩu không chính xác."
    );
  });

  it("should map existing user registration errors", () => {
    expect(mapAuthError(new Error("User already registered"))).toBe(
      "Email này đã được đăng ký sử dụng. Vui lòng đăng nhập."
    );
    expect(mapAuthError("identity_already_exists")).toBe(
      "Email này đã được đăng ký sử dụng. Vui lòng đăng nhập."
    );
  });

  it("should map rate limit errors", () => {
    expect(mapAuthError(new Error("Email rate limit exceeded"))).toBe(
      "Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút."
    );
    expect(mapAuthError("over_email_send_rate_limit")).toBe(
      "Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút."
    );
  });

  it("should map unconfirmed email errors", () => {
    expect(mapAuthError(new Error("Email not confirmed"))).toBe(
      "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác nhận tài khoản."
    );
  });

  it("should map expired / invalid token errors", () => {
    expect(mapAuthError(new Error("token is expired"))).toBe(
      "Mã xác thực hoặc liên kết đã hết hạn hoặc không hợp lệ. Vui lòng kiểm tra lại."
    );
    expect(mapAuthError("otp_expired")).toBe(
      "Mã xác thực hoặc liên kết đã hết hạn hoặc không hợp lệ. Vui lòng kiểm tra lại."
    );
  });

  it("should map OAuth cancelled errors", () => {
    expect(mapAuthError("access_denied")).toBe("Bạn đã hủy quá trình đăng nhập qua Google.");
  });

  it("should fallback gracefully for unknown errors", () => {
    expect(mapAuthError(new Error("some random internal error 500"))).toBe(
      "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."
    );
    expect(mapAuthError(null)).toBe("Đã xảy ra lỗi không xác định.");
  });
});
