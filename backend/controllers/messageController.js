import Message from '../models/Message.js';
import { v4 as uuidv4 } from 'uuid';

export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ],
      isDeleted: false
    })
      .sort({ timestamp: 1 })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadImageMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const imageUrl = req.file?.path;

    if (!imageUrl) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const message = await Message.create({
      messageId: uuidv4(),
      senderId: req.user._id,
      receiverId,
      messageType: 'image',
      content: imageUrl
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar');

    // Emit to socket room for real-time delivery
    const io = req.app.get('io');
    if (io) {
      const chatId = [req.user._id.toString(), receiverId].sort().join('_');
      io.to(chatId).emit('image', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      senderId: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or you can only delete your own messages' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
