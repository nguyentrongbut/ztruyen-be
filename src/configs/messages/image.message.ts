export const IMAGE_MESSAGES = {
  // --- GET ---
  NOT_FOUND: 'Không tìm thấy hình ảnh',
  ACCESS_FORBIDDEN: 'Không có quyền truy cập hình ảnh này',

  // --- CREATE ---
  CREATE_SUCCESS: 'Tải hình ảnh lên thành công',
  SLUG_EXISTS: 'Slug hình ảnh đã tồn tại',
  NO_FIELDS_PROVIDED: 'Không có dữ liệu để tạo hình ảnh',

  // --- DELETE ---
  DELETE_SUCCESS: 'Xóa hình ảnh thành công',
  DELETE_MANY_SUCCESS: 'Xóa nhiều hình ảnh thành công',
  NO_SLUGS_PROVIDED: 'Không có slug nào được cung cấp',
  NO_IMAGES_FOUND_FOR_SLUGS:
    'Không tìm thấy hình ảnh nào tương ứng với các slug đã cho',
  NO_IMAGES_FOUND_FOR_IDS:
    'Không tìm thấy hình ảnh nào tương ứng với các ID đã cho',

  // --- UPLOAD  ---
  FETCH_SUCCESS: 'Tải hình ảnh thành công',
  FETCH_FAILED: 'Không thể tải hình ảnh từ máy chủ',
} as const;
