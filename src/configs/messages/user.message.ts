export const USERS_MESSAGES = {
  // --- COMMON ---
  INVALID_ID: 'ID người dùng không hợp lệ!',
  DELETED_OR_BANNED:
    'Tài khoản đã bị khóa vui lòng liên hệ admin để biết thêm chi tiết',
  NO_IDS_PROVIDED: 'Không có danh sách ID người dùng được cung cấp!',
  INVALID_IDS: 'Một hoặc nhiều ID người dùng không hợp lệ!',
  NO_ELIGIBLE: 'Không đủ điều kiện thực hiện hành động này!',

  // --- CREATE / UPDATE ---
  EMAIL_EXISTED: 'Email đã được sử dụng bởi người dùng khác!',
  NAME_EXISTED: 'Tên đã được sử dụng bởi người dùng khác!',
  PASSWORD_NOT_SUPPORTED: 'Tài khoản không hỗ trợ đổi mật khẩu',
  PASSWORD_MUST_BE_DIFFERENT: 'Mật khẩu mới phải khác mật khẩu cũ',
  CREATE_SUCCESS: 'Tạo người dùng thành công!',
  UPDATE_SUCCESS: 'Cập nhật người dùng thành công!',
  UPDATE_PROFILE_SUCCESS: 'Cập nhật hồ sơ thành công!',
  BAN_USER_SUCCESS: 'Cấm người dùng thành công!',
  BAN_MULTI_USER_SUCCESS: 'Cấm nhiều người dùng thành công!',
  DELETE_SUCCESS: 'Xóa người dùng thành công!',
  DELETE_MULTI_SUCCESS: 'Xóa nhiều người dùng thành công!',
  RESTORE_SUCCESS: 'Khôi phục người dùng thành công!',
  RESTORE_MULTI_SUCCESS: 'Khôi phục nhiều người dùng thành công!',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công!',
  ADMIN_CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu người dùng thành công!',
  DELETE_PROFILE_SUCCESS: 'Xoá tài khoản thành công!',
  UPDATE_FRAME_SUCCESS: 'Cập nhật khung avatar thành công!',

  // --- GET ---
  GET_ALL_SUCCESS: 'Lấy danh sách người dùng thành công!',
  GET_DETAIL_SUCCESS: 'Lấy thông tin chi tiết người dùng thành công!',
  GET_PROFILE_SUCCESS: 'Lấy thông tin hồ sơ thành công!',
  GET_TRASH_SUCCESS: 'Lấy danh sách người dùng đã xóa thành công!',
  GET_TRASH_DETAIL_SUCCESS: 'Lấy chi tiết người dùng đã xóa thành công!',

  // --- AUTH / PASSWORD ---
  INVALID_OR_EXPIRED_TOKEN: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  INVALID_OLD_PASSWORD: 'Mật khẩu cũ không chính xác',

  // --- FIREBASE ---
  UPDATE_FCM_TOKEN_SUCCESS: 'Cập nhật FCM token thành công!',
  DELETE_FCM_TOKEN_SUCCESS: 'Xóa FCM token thành công!',
} as const;
