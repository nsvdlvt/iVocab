export function mapAuthError(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";

  // Standardize error message extraction
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid_grant") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  if (
    lowerMessage.includes("user already registered") ||
    lowerMessage.includes("already been registered") ||
    lowerMessage.includes("identity_already_exists")
  ) {
    return "Email này đã được đăng ký sử dụng. Vui lòng đăng nhập.";
  }

  if (
    lowerMessage.includes("password should be at least") ||
    lowerMessage.includes("weak_password")
  ) {
    return "Mật khẩu phải chứa ít nhất 6 ký tự.";
  }

  if (lowerMessage.includes("signup requires verification")) {
    return "Đăng ký thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản.";
  }

  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("over_email_send_rate_limit") ||
    lowerMessage.includes("too many requests")
  ) {
    return "Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  }

  if (
    lowerMessage.includes("email not confirmed") ||
    lowerMessage.includes("email_not_confirmed")
  ) {
    return "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác nhận tài khoản.";
  }

  if (
    lowerMessage.includes("invalid claim") ||
    lowerMessage.includes("token is expired") ||
    lowerMessage.includes("flow state not found") ||
    lowerMessage.includes("otp_expired") ||
    lowerMessage.includes("token_expired") ||
    lowerMessage.includes("bad_code_verifier") ||
    lowerMessage.includes("expired-link") ||
    lowerMessage.includes("invalid-link")
  ) {
    return "Đường dẫn xác thực đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.";
  }

  if (
    lowerMessage.includes("auth-code-missing") ||
    lowerMessage.includes("code parameter is missing")
  ) {
    return "Mã xác thực không tồn tại. Vui lòng kiểm tra lại liên kết.";
  }

  if (
    lowerMessage.includes("access_denied") ||
    lowerMessage.includes("user cancelled") ||
    lowerMessage.includes("oauth_cancelled")
  ) {
    return "Bạn đã hủy quá trình đăng nhập qua Google.";
  }

  if (
    lowerMessage.includes("auth session missing") ||
    lowerMessage.includes("session not found") ||
    lowerMessage.includes("session has expired")
  ) {
    return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (lowerMessage.includes("user not found")) {
    return "Không tìm thấy thông tin tài khoản.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("fetch failed")) {
    return "Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.";
  }

  return "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
}
