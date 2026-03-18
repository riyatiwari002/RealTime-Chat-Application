import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { getAllUsers, getUserProfile, updateProfile, blockUser, unblockUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, getAllUsers);
router.put('/me/profile', protect, upload.single('avatar'), updateProfile);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.get('/:userId', protect, getUserProfile);

export default router;
