import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedIds = currentUser.blockedUsers || [];

    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ isOnline: -1, lastSeen: -1 });

    // Attach isBlocked flag
    const result = users.map((u) => ({
      ...u.toObject(),
      isBlocked: blockedIds.map(String).includes(u._id.toString()),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -blockedUsers');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio, username } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;

    if (username !== undefined) {
      const trimmed = username.trim();
      if (trimmed.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
      const exists = await User.findOne({ username: trimmed, _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
      updates.username = trimmed;
    }

    // Handle avatar image upload
    if (req.file) {
      const { uploadToCloudinary } = await import('../utils/cloudinaryUpload.js');
      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      updates.avatar = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -blockedUsers');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: userId },
    });
    res.json({ message: 'User blocked', userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: userId },
    });
    res.json({ message: 'User unblocked', userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
