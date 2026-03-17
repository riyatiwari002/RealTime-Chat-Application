import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadToCloudinary = async (buffer, originalName) => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "chat-images" },
        (error, result) => {
          if (error) reject(error);
          else resolve({ secure_url: result.secure_url });
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
  // Fallback: Save locally for development
  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `chat-${Date.now()}-${originalName || "image.jpg"}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);
  return { secure_url: `/uploads/${filename}` };
};
