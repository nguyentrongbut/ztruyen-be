export const UPLOAD_MESSAGES = {
  // --- SUCCESS ---
  UPLOAD_SINGLE_SUCCESS: 'Tải ảnh lên thành công',
  UPLOAD_MULTIPLE_SUCCESS: 'Tải nhiều ảnh lên thành công',

  // --- VALIDATION / ERROR ---
  ONLY_IMAGES_ALLOWED: 'Chỉ cho phép tải lên tệp hình ảnh',
  FILE_TOO_LARGE: 'Kích thước tệp vượt quá giới hạn cho phép (10MB)',
  NO_FILE_UPLOADED: 'Không có tệp nào được tải lên',
  NO_FILES_UPLOADED: 'Không có tệp hình ảnh nào được tải lên',

  CAPTION_REQUIRED: 'Vui lòng nhập chú thích cho ảnh.',
  FILE_NOT_FOUND: 'Không tìm thấy tệp.',
  FETCH_FILE_ERROR: 'Không thể lấy thông tin tệp.',
  STREAM_FILE_ERROR: 'Không thể tải luồng dữ liệu hình ảnh.',
  UPLOAD_FAILED: 'Tải ảnh lên thất bại.',
} as const;
