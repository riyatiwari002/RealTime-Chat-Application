import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { getChatHistory, uploadImageMessage, deleteMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:userId', protect, getChatHistory);
router.post('/image', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (req.file) {
      const { uploadToCloudinary } = await import('../utils/cloudinaryUpload.js');
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      req.file.path = result.secure_url;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Image upload failed' });
  }
}, uploadImageMessage);
router.delete('/:id', protect, deleteMessage);

export default router;
