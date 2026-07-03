export function mapAuthError(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";

  // Standardize error message extraction
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : String(error);
  
  if (message.includes("Invalid login credentials")) {
    return "Email hoặc mật khẩu không chính xác.";
  }
  
  if (message.includes("User already registered")) {
    return "Email này đã được đăng ký sử dụng.";
  }
  
  if (message.includes("Password should be at least")) {
    return "Mật khẩu phải chứa ít nhất 6 ký tự.";
  }

  if (message.includes("Signup requires verification")) {
    return "Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác nhận tài khoản.";
  }

  if (message.includes("Email rate limit exceeded")) {
    return "Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  }

  if (message.includes("Email not confirmed")) {
    return "Tài khoản chưa được kích hoạt. Vui lòng xác thực email trước.";
  }

  if (message.includes("invalid claim") || message.includes("token is expired") || message.includes("Flow state not found")) {
    return "Đường dẫn xác thực đã hết hạn hoặc không hợp lệ.";
  }

  return "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
}
