export const FRAMES_MESSAGES = {
  // --- COMMON ---
  INVALID_ID: 'ID khung avatar không hợp lệ!',
  DELETED_OR_BANNED:
    'Khung avatar đã bị xóa hoặc không còn tồn tại!',
  NO_IDS_PROVIDED: 'Không có danh sách ID khung avatar được cung cấp!',
  INVALID_IDS: 'Một hoặc nhiều ID avatar không hợp lệ!',
  NO_ELIGIBLE: 'Không đủ điều kiện thực hiện hành động này!',

  // --- CREATE / UPDATE ---
  NAME_EXISTED: 'Tên đã được sử dụng',
  CREATE_SUCCESS: 'Tạo khung avatar thành công!',
  UPDATE_SUCCESS: 'Cập nhật khung avatar thành công!',
  UPDATE_PROFILE_SUCCESS: 'Cập nhật hồ sơ thành công!',
  DELETE_SUCCESS: 'Xóa khung avatar thành công!',
  DELETE_MULTI_SUCCESS: 'Xóa nhiều khung avatar thành công!',
  RESTORE_SUCCESS: 'Khôi phục khung avatar thành công!',
  RESTORE_MULTI_SUCCESS: 'Khôi phục nhiều khung avatar thành công!',

  // --- GET ---
  GET_ALL_SUCCESS: 'Lấy danh sách khung thành công!',
  GET_DETAIL_SUCCESS: 'Lấy thông tin chi tiết khung avatar thành công!',
  GET_PROFILE_SUCCESS: 'Lấy thông tin hồ sơ thành công!',
  GET_TRASH_SUCCESS: 'Lấy danh sách khung avatar đã xóa thành công!',
  GET_TRASH_DETAIL_SUCCESS: 'Lấy chi tiết khung avatar đã xóa thành công!',

  // --- AUTH / PASSWORD ---
  INVALID_OR_EXPIRED_TOKEN: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!',
  USER_NOT_FOUND: 'Không tìm thấy người dùng tương ứng với email!',
} as const;
