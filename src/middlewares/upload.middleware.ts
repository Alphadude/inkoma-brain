import multer from 'multer';
import ApiError from '../utils/ApiError';

// Use memory storage so files are held in buffer and can be streamed directly to Cloudinary or parsed
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
  },
});

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for full manuscript PDFs
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only PDF documents (.pdf) are supported for manuscript uploads'));
    }
  },
});

export default upload;

