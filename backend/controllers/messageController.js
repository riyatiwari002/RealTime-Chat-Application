import Message from '../models/Message.js';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';

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

export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIdx !== -1) {
      if (message.reactions[existingIdx].emoji === emoji) {
        // Toggle off same reaction
        message.reactions.splice(existingIdx, 1);
      } else {
        message.reactions[existingIdx].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      const otherId = message.senderId.toString() === userId.toString()
        ? message.receiverId?.toString()
        : message.senderId.toString();
      if (otherId) {
        const chatId = [userId.toString(), otherId].sort().join('_');
        io.to(chatId).emit('messageReaction', { messageId: message._id, reactions: message.reactions });
      }
    }

    res.json({ reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
