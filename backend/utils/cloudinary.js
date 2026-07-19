import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const configure = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  });
  return !!process.env.CLOUDINARY_NAME && !!process.env.CLOUDINARY_API_KEY;
};

export const uploadToCloudinary = async (localFilePath) => {
  const cleanup = () => {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
  };

  if (!configure()) {
    cleanup();
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "linear-app",
    });
    cleanup();
    return response.secure_url;
  } catch (error) {
    cleanup();
    return null;
  }
};
