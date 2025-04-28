import api from './config';

/**
 * 通用图片上传函数
 * @param file 要上传的文件对象
 * @param onUploadProgress 可选的回调函数，用于跟踪上传进度
 * @returns Promise，包含成功信息和图片的URL
 */
export const uploadImage = async (
  file: File | Blob, 
  onUploadProgress?: (progressEvent: any) => void
): Promise<{ success: boolean; message: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file); // 对应后端 multer.single('file')

  try {
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  } catch (error: any) {
    console.error('图片上传失败:', error);
    throw new Error(error.response?.data?.message || error.message || '图片上传失败');
  }
};

const commonAPI = {
  uploadImage,
};

export default commonAPI; 