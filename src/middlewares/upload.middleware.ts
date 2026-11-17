import multer from 'multer';

// Use memory storage so files are held in buffer and can be streamed directly to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
  },
});

export default upload;
