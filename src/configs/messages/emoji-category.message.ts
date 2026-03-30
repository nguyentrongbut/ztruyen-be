export const EMOJI_CATEGORY_MESSAGES = {
  // --- CREATE ---
  CREATE_SUCCESS: 'Tạo danh mục emoji thành công!',

  // --- GET ---
  GET_ALL_SUCCESS: 'Lấy danh sách danh mục emoji thành công!',
  GET_ONE_SUCCESS: 'Lấy chi tiết danh mục emoji thành công',

  // --- UPDATE ---
  UPDATE_SUCCESS: 'Cập nhật danh mục emoji thành công!',
  REORDER_SUCCESS: 'Cập nhật thứ tự danh mục emoji thành công!',
  TOGGLE_SUCCESS: 'Cập nhật trạng thái danh mục emoji thành công!',

  // --- DELETE ---
  DELETE_SUCCESS: 'Xóa danh mục emoji thành công!',

  // --- ERROR ---
  NOT_FOUND: 'Category emoji không tồn tại',
  ALREADY_EXISTS: 'Tên danh mục emoji đã tồn tại',
  HAS_EMOJI: 'Category đang có emoji, không thể xóa',
} as const;
