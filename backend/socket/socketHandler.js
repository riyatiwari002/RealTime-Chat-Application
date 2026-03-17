import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { v4 as uuidv4 } from "uuid";

const userSockets = new Map(); // userId -> Set of socketIds

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  //checks connection for user is connected  to socket
  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Track user socket
    if (!userSockets.has(userId)) {
      //its check the user is register in socket or not if not add this user in socket
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Update user online status
    User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    }).exec();

    // Broadcast user online to others
    socket.broadcast.emit("userStatus", {
      userId,
      isOnline: true,
      lastSeen: new Date(),
    });

    socket.on("join", (data) => {
      const chatId = data.receiverId
        ? getChatId(userId, data.receiverId)
        : data.roomId;
      socket.join(chatId);
    });

    socket.on("message", async (data) => {
      try {
        const { receiverId, content } = data;
        const chatId = getChatId(userId, receiverId);

        const message = await Message.create({
          messageId: uuidv4(),
          senderId: userId,
          receiverId,
          messageType: "text",
          content,
        });

        const populated = await Message.findById(message._id)
          .populate("senderId", "username avatar")
          .populate("receiverId", "username avatar");

        io.to(chatId).emit("message", populated);
        socket.emit("messageSent", populated);
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("image", async (data) => {
      try {
        const { receiverId, imageUrl } = data;
        const chatId = getChatId(userId, receiverId);

        const message = await Message.create({
          messageId: uuidv4(),
          senderId: userId,
          receiverId,
          messageType: "image",
          content: imageUrl,
        });

        const populated = await Message.findById(message._id)
          .populate("senderId", "username avatar")
          .populate("receiverId", "username avatar");

        io.to(chatId).emit("image", populated);
        socket.emit("imageSent", populated);
      } catch (error) {
        socket.emit("error", { message: "Failed to send image" });
      }
    });

    socket.on("typing", (data) => {
      const chatId = getChatId(userId, data.receiverId);
      socket
        .to(chatId)
        .emit("typing", { userId, username: socket.user?.username });
    });

    socket.on("stopTyping", (data) => {
      const chatId = getChatId(userId, data.receiverId);
      socket.to(chatId).emit("stopTyping", { userId });
    });

    socket.on("deleteMessage", async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findOne({ messageId, senderId: userId });
        if (!message)
          return socket.emit("error", {
            message: "Cannot delete this message",
          });

        message.isDeleted = true;
        await message.save();

        const chatId = message.receiverId
          ? getChatId(userId, message.receiverId.toString())
          : message.roomId;
        io.to(chatId).emit("messageDeleted", { messageId });
      } catch (error) {
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("messageRead", async (data) => {
      try {
        const { messageIds, senderId } = data;
        await Message.updateMany(
          { messageId: { $in: messageIds }, receiverId: userId, senderId },
          { isRead: true, readAt: new Date() },
        );
        const chatId = getChatId(userId, senderId);
        io.to(chatId).emit("messagesRead", { messageIds, readBy: userId});
      } catch (error) {
        console.error("Message read error:", error);
      }
    });

    socket.on("disconnect", async () => {
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        socket.broadcast.emit("userStatus", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });

  return io;
};

function getChatId(user1, user2) {
  return [user1, user2].sort().join("_");
}
