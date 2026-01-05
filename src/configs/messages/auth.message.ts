export const AUTH_MESSAGES = {
  UNAUTHORIZED: 'Bạn cần đăng nhập để truy cập tài nguyên này',
  PERMISSION_DENIED: 'Bạn không có quyền thực hiện hành động này',

  // --- LOGIN ---
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không hợp lệ',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Email hoặc mật khẩu không đúng',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  SOCIAL_LOGIN_SUCCESS: 'Đăng nhập thành công',
  SOCIAL_LOGIN_FAILED: 'Đăng nhập thất bại, vui lòng thử lại',

  // --- REGISTER ---
  REGISTRATION_SUCCESS: 'Đăng ký thành công',
  REGISTRATION_FAILED: 'Đăng ký thất bại, vui lòng thử lại',

  // --- REFRESH_TOKEN ---
  REFRESH_TOKEN_SUCCESS: 'Lấy token mới thành công',
  REFRESH_TOKEN_FAILED: 'Token không hợp lệ hoặc đã hết hạn',
  REFRESH_TOKEN_MISSING: 'Refresh token không được gửi',

  // --- PASSWORD ---
  FORGOT_PASSWORD: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
  FORGOT_PASSWORD_FAILED: 'Email không tồn tại trong hệ thống',
  RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công',
  TOKEN_INVALID_OR_EXPIRED: 'Token không hợp lệ hoặc đã hết hạn',
} as const;
