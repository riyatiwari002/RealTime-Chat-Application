import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ isOnline: -1, lastSeen: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
