import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import env from './env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/**
 * Upload a local file path or base64 URI to Cloudinary.
 */
export const uploadToCloudinary = async (
  filePathOrBase64: string,
  folder: string = 'inkoma_uploads'
): Promise<UploadApiResponse> => {
  return cloudinary.uploader.upload(filePathOrBase64, {
    folder,
    resource_type: 'auto',
  });
};

/**
 * Upload an in-memory buffer (e.g. from multer memoryStorage) to Cloudinary via upload_stream.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = 'inkoma_uploads',
  filename?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'auto',
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty response'));
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<any> => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
